from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import Election

elections_bp = Blueprint("elections", __name__)

@elections_bp.route("/create", methods=["POST"])
@jwt_required()
def create_election():
    user = get_jwt_identity()

    if user["role"] != "admin":
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()

    election = Election(
        election_type=data.get("election_type"),
        course=data.get("course"),
        batch=data.get("batch"),
        semester=data.get("semester"), # Added
        post=data.get("post"),
        start_date=data.get("start_date"),
        end_date=data.get("end_date")
    )

    db.session.add(election)
    db.session.commit()

    return jsonify({"message": "Election created successfully"}), 201

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from app.models import Election
from app.extensions import db

election_bp = Blueprint("elections", __name__)

@election_bp.route("/elections/<int:election_id>/close", methods=["POST"])
@jwt_required()

def close_election(election_id):
    role = get_jwt().get("role")

    if role != "admin":
        return jsonify({"error": "Admin access only"}), 403

    election = Election.query.get(election_id)

    if not election:
        return jsonify({"error": "Election not found"}), 404

    if election.status == "COMPLETED":
        return jsonify({"message": "Election already closed"}), 409

    election.status = "COMPLETED"
    db.session.commit()

    return jsonify({
        "message": "Election closed successfully",
        "election_id": election_id,
        "status": "COMPLETED"
    }), 200

# ==========================
# GET ACTIVE ELECTIONS (PUBLIC/STUDENT)
# ==========================
@election_bp.route("/active", methods=["GET"])
@jwt_required()
def get_active_elections():
    # Fetch elections that are UPCOMING or ONGOING
    query = Election.query.filter(Election.status.in_(["UPCOMING", "ONGOING"]))
    
    # Filter based on Role and Course/Batch
    current_user_id = get_jwt_identity()
    user = Student.query.get(current_user_id)
    
    if user.role == "student":
        # Students can only see CR elections for their specific batch AND semester
        query = query.filter(
            Election.election_type == "CR",
            Election.course == user.course,
            Election.batch == user.batch,
            Election.semester == user.semester # Semester Check
        )
    elif user.role == "cr":
        # CRs can see Council elections AND their own batch CR election (if active)
        from sqlalchemy import or_
        query = query.filter(
            or_(
                Election.election_type == "COUNCIL",
                (Election.election_type == "CR") & (Election.course == user.course) & (Election.batch == user.batch) & (Election.semester == user.semester)
            )
        )
    # Admin sees everything (no filter added)

    elections = query.all()
    
    response = []
    for election in elections:
        response.append({
            "election_id": election.election_id,
            "title": f"{election.election_type} Election - {election.post or 'Class Representative'}",
            "type": election.election_type,
            "course": election.course,
            "batch": election.batch,
            "semester": election.semester,
            "post": election.post,
            "status": election.status,
            "start_date": election.start_date.isoformat() if election.start_date else None,
            "end_date": election.end_date.isoformat() if election.end_date else None
        })

    return jsonify(response), 200


# ==========================
# GET CANDIDATES FOR ELECTION
# ==========================
from app.models import Candidate, Student

@election_bp.route("/<int:election_id>/candidates", methods=["GET"])
@jwt_required()
def get_election_candidates(election_id):
    election = Election.query.get(election_id)
    if not election:
        return jsonify({"error": "Election not found"}), 404

    candidates = (
        db.session.query(Candidate, Student)
        .join(Student, Candidate.student_id == Student.student_id)
        .filter(Candidate.election_id == election_id)
        .all()
    )

    response = []
    for cand, stud in candidates:
        response.append({
            "candidate_id": cand.candidate_id,
            "name": stud.name,
            "course": stud.course,
            "batch": stud.batch
        })

    return jsonify(response), 200
