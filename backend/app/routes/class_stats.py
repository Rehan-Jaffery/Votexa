from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from sqlalchemy import func
from app.extensions import db
from app.models import Student, Election, Vote, Candidate

class_stats_bp = Blueprint("class_stats", __name__)


@class_stats_bp.route("/my-class", methods=["GET"])
@jwt_required()
def get_my_class_stats():
    """CR view: stats for their own class (course + semester + batch)"""
    user_id = get_jwt_identity()
    user = db.session.get(Student, user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    # Get all students in this class
    classmates = Student.query.filter_by(
        course=user.course,
        batch=user.batch,
        semester=user.semester
    ).all()

    total_students = len(classmates)

    # Get all completed CR elections for this class
    elections = Election.query.filter_by(
        election_type="CR",
        course=user.course,
        semester=user.semester,
        status="COMPLETED"
    ).all()

    participation_data = []
    for e in elections:
        voters = Vote.query.filter_by(election_id=e.election_id).with_entities(Vote.voter_id).distinct().count()
        participation_data.append({
            "election_id": e.election_id,
            "title": f"CR Election - Sem {e.semester}",
            "total_eligible": total_students,
            "voters": voters,
            "turnout_percent": round((voters / total_students) * 100, 1) if total_students > 0 else 0
        })

    # Student list
    student_list = [{
        "student_id": s.student_id,
        "name": s.name,
        "university_id": s.university_id,
        "email": s.email or "N/A",
        "role": s.role
    } for s in classmates]

    return jsonify({
        "class_info": {
            "course": user.course,
            "batch": user.batch,
            "semester": user.semester,
            "total_students": total_students
        },
        "participation": participation_data,
        "students": student_list
    }), 200


@class_stats_bp.route("/all-classes", methods=["GET"])
@jwt_required()
def get_all_classes_stats():
    """Council view: overview of all classes"""
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get("role", "student")

    if role not in ["admin", "president", "vice_president", "secretary", "joint_secretary"]:
        return jsonify({"message": "Permission denied"}), 403

    # Group students by course + semester
    class_groups = db.session.query(
        Student.course,
        Student.semester,
        Student.batch,
        func.count(Student.student_id).label("count")
    ).filter(
        Student.role != "admin"
    ).group_by(
        Student.course, Student.semester, Student.batch
    ).all()

    classes = []
    for course, semester, batch, count in class_groups:
        # Find CR for this class
        cr = Student.query.filter_by(course=course, semester=semester, batch=batch, role="cr").first()

        # Get completed elections for this class
        elections = Election.query.filter_by(
            election_type="CR",
            course=course,
            semester=semester,
            status="COMPLETED"
        ).all()

        avg_turnout = 0
        if elections:
            turnouts = []
            for e in elections:
                voters = Vote.query.filter_by(election_id=e.election_id).with_entities(Vote.voter_id).distinct().count()
                turnouts.append((voters / count) * 100 if count > 0 else 0)
            avg_turnout = round(sum(turnouts) / len(turnouts), 1) if turnouts else 0

        classes.append({
            "course": course,
            "semester": semester,
            "batch": batch,
            "student_count": count,
            "cr_name": cr.name if cr else "Not Assigned",
            "cr_email": cr.email if cr else "N/A",
            "avg_turnout": avg_turnout,
            "elections_held": len(elections)
        })

    return jsonify({"classes": classes}), 200
