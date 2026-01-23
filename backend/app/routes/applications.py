from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.extensions import db
from app.models import Student, CandidateApplication, Election, Candidate
from datetime import datetime

applications_bp = Blueprint("applications", __name__)

# ============================
# SUBMIT APPLICATION
# ============================
@applications_bp.route("/apply", methods=["POST"])
@jwt_required()
def submit_application():
    student_id = get_jwt_identity()
    user = Student.query.get(student_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()
    post = data.get("post")
    
    # --- Role Logic ---
    # Student -> Can only apply for "Class Representative"
    if user.role == "student" and post != "Class Representative":
        return jsonify({"error": "Students can only apply for Class Representative"}), 403
    
    # CR -> Can apply for Council Posts
    council_posts = ["Vice President", "Secretary", "Joint Secretary"] # President usually chosen from VP? or direct? Assuming direct for now based on request "vice president, secretary and joint secreatry"
    # User request: "only login with CR credentials can apply for position of vice president, secretary and joint secreatry"
    
    if user.role == "cr" and post not in council_posts:
        return jsonify({"error": "CRs can only apply for Council Posts"}), 403
        
    if user.role not in ["student", "cr"]:
        return jsonify({"error": "Not eligible to apply"}), 403

    # Check if already applied
    existing = CandidateApplication.query.filter_by(student_id=student_id, status="PENDING").first()
    if existing:
        return jsonify({"error": "You already have a pending application"}), 400

    new_app = CandidateApplication(
        student_id=student_id,
        post=post,
        manifesto=data.get("manifesto", ""),
        reason=data.get("reason", ""),
        gpa=data.get("gpa", "NA"),
        achievements=data.get("achievements", ""),
        status="PENDING"
    )
    
    db.session.add(new_app)
    db.session.commit()
    
    return jsonify({"message": "Application submitted successfully!"}), 201

# ============================
# LIST APPLICATIONS (ADMIN)
# ============================
@applications_bp.route("/", methods=["GET"])
@jwt_required()
def list_applications():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin access only"}), 403
        
    apps = CandidateApplication.query.order_by(CandidateApplication.created_at.desc()).all()
    
    data = []
    for a in apps:
        data.append({
            "id": a.id,
            "student_id": a.student.university_id,
            "name": a.student.name,
            "role": a.student.role,
            "post": a.post,
            "gpa": a.gpa,
            "status": a.status,
            "created_at": a.created_at.strftime("%Y-%m-%d")
        })
        
    return jsonify(data), 200

# ============================
# APPROVE / REJECT
# ============================
@applications_bp.route("/<int:app_id>", methods=["PUT"])
@jwt_required()
def update_application_status(app_id):
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin access only"}), 403
        
    data = request.get_json()
    new_status = data.get("status")
    
    if new_status not in ["APPROVED", "REJECTED"]:
        return jsonify({"error": "Invalid status"}), 400
        
    app_record = CandidateApplication.query.get(app_id)
    if not app_record:
        return jsonify({"error": "Application not found"}), 404
        
    app_record.status = new_status
    
    # If Approved, try to add as Candidate if election exists
    msg = f"Application {new_status}"
    if new_status == "APPROVED":
        # Find relevant election
        # If Post is CR, look for election type 'CR' and matching course/batch
        # If Post is Council, look for election type 'COUNCIL' and matching post
        
        post_map = {
            "Class Representative": "CR",
            "Vice President": "COUNCIL",
            "Secretary": "COUNCIL",
            "Joint Secretary": "COUNCIL"
        }
        
        election_type = post_map.get(app_record.post, "COUNCIL")
        
        query = Election.query.filter_by(status="UPCOMING", election_type=election_type)
        
        if election_type == "CR":
            # Filter by batch/course
            query = query.filter_by(course=app_record.student.course, batch=app_record.student.batch)
        else:
            # Filter by specific post
            query = query.filter_by(post=app_record.post)
            
        election = query.first()
        
        if election:
            # Check if already candidate
            ext_cand = Candidate.query.filter_by(student_id=app_record.student_id, election_id=election.election_id).first()
            if not ext_cand:
                new_cand = Candidate(
                    student_id=app_record.student_id,
                    election_id=election.election_id
                )
                db.session.add(new_cand)
                msg += ". Candidate added to Election."
            else:
                msg += ". User is already a candidate."
        else:
             msg += ". No active election found for this post."

    db.session.commit()
    return jsonify({"message": msg}), 200
