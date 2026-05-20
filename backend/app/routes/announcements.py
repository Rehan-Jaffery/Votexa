from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from sqlalchemy import or_
from app.extensions import db
from app.models import Announcement, Student
from datetime import datetime

announcement_bp = Blueprint("announcements", __name__)

@announcement_bp.route("/", methods=["POST"])
@jwt_required()
def create_announcement():
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get("role", "student")
    
    data = request.get_json()
    title = data.get("title")
    content = data.get("content")
    audience_scope = data.get("audience_scope", "CLASS") # Default to CLASS
    priority = data.get("priority", "NORMAL")
    
    # Validation
    if not title or not content:
        return jsonify({"message": "Title and content are required"}), 400

    student = Student.query.get(user_id)
    if not student:
        return jsonify({"message": "User not found"}), 404

    # Permission Logic
    if role == "student":
        return jsonify({"message": "Permission denied"}), 403
        
    final_scope = audience_scope
    target_course = None
    target_batch = None
    target_semester = None

    # Council / Admin can post GOV_INTERNAL
    if role in ["admin", "president", "vice_president", "secretary", "joint_secretary"]:
        if audience_scope == "GOV_INTERNAL":
             final_scope = "GOV_INTERNAL"
        else:
             # If they want to post to a class, which class? 
             # For now, let's assume they post to their own class if scope is CLASS
             final_scope = "CLASS"
             target_course = student.course
             target_batch = student.batch
             target_semester = student.semester
    
    # CR can ONLY post to CLASS (their own)
    elif role == "cr":
        if audience_scope != "CLASS":
             return jsonify({"message": "CRs can only post to their class"}), 403
        final_scope = "CLASS"
        target_course = student.course
        target_batch = student.batch
        target_semester = student.semester
    else:
        # Fallback for unexpected roles
        return jsonify({"message": "Permission denied"}), 403

    # Add DB entry
    try:
        new_announcement = Announcement(
            sender_id=user_id,
            title=title,
            content=content,
            audience_scope=final_scope,
            target_course=target_course,
            target_batch=target_batch,
            target_semester=target_semester,
            priority=priority
        )
        
        print(f"[DEBUG] Creating Announcement: {new_announcement.__dict__}")
        db.session.add(new_announcement)
        db.session.commit()
    except Exception as e:
        print(f"[ERROR] Failed to create announcement: {str(e)}")
        db.session.rollback()
        return jsonify({"message": f"Server Error: {str(e)}"}), 500
    
    return jsonify({"message": "Announcement created successfully"}), 201


@announcement_bp.route("/", methods=["GET"])
@jwt_required()
def get_announcements():
    user_id = get_jwt_identity()
    student = Student.query.get(user_id)
    if not student:
        return jsonify({"message": "User not found"}), 404
        
    query_filters = []
    
    # 1. GLOBAL Scope (for future use, or if admin posts ALL)
    query_filters.append(Announcement.audience_scope == "ALL") 
    
    # 2. CLASS Scope (must match student's details)
    class_filter = (Announcement.audience_scope == "CLASS") & \
                   (Announcement.target_course == student.course) & \
                   (Announcement.target_batch == student.batch) & \
                   (Announcement.target_semester == student.semester)
    query_filters.append(class_filter)
    
    # 3. GOV_INTERNAL Scope (only for Council/CR/Admin)
    if student.role in ["cr", "president", "vice_president", "secretary", "joint_secretary", "admin"]:
        query_filters.append(Announcement.audience_scope == "GOV_INTERNAL")
        
    # Combine with OR
    final_query = Announcement.query.filter(or_(*query_filters)).order_by(Announcement.created_at.desc())
    
    announcements = final_query.all()
    
    result = []
    for a in announcements:
        result.append({
            "id": a.id,
            "title": a.title,
            "content": a.content,
            "sender_name": a.sender.name,
            "sender_id": a.sender_id,
            "sender_role": a.sender.role,
            "priority": a.priority,
            "created_at": a.created_at.isoformat(),
            "scope": a.audience_scope
        })
        
    return jsonify(result), 200

@announcement_bp.route("/<int:announcement_id>", methods=["DELETE"])
@jwt_required()
def delete_announcement(announcement_id):
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get("role", "student")
    
    announcement = Announcement.query.get(announcement_id)
    if not announcement:
        return jsonify({"message": "Announcement not found"}), 404
        
    if announcement.sender_id != user_id:
        return jsonify({"message": "Permission denied"}), 403
        
    db.session.delete(announcement)
    db.session.commit()
    return jsonify({"message": "Announcement deleted successfully"}), 200
