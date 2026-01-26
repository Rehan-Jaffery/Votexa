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

    print(f"Applying: User={user.name}, Post={post}, Data={data}")

    new_app = CandidateApplication(
        student_id=student_id,
        post=post,
        manifesto=data.get("manifesto", ""),
        reason=data.get("reason", ""),
        gpa=data.get("gpa", "NA"),
        achievements=data.get("achievements", ""),
        additional_details=data.get("additional_details", {}),
        status="PENDING"
    )
    
    try:
        db.session.add(new_app)
        db.session.commit()
        return jsonify({"message": "Application submitted successfully!"}), 201
    except Exception as e:
        db.session.rollback()
        print(f"DB Error during application submit: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Database Error: {str(e)}"}), 500

# ============================
# GET MY APPLICATION
# ============================
@applications_bp.route("/<int:app_id>", methods=["DELETE"])
@jwt_required()
def delete_application(app_id):
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin access only"}), 403
        
    app_record = CandidateApplication.query.get(app_id)
    if not app_record:
        return jsonify({"error": "Application not found"}), 404
        
    # Also remove candidate if exists
    cand = Candidate.query.filter_by(student_id=app_record.student_id).first()
    if cand:
        db.session.delete(cand)
        
    db.session.delete(app_record)
    db.session.commit()
    return jsonify({"message": "Application deleted successfully"}), 200

# ============================
# GET MY APPLICATION
# ============================
@applications_bp.route("/me", methods=["GET"])
@jwt_required()
def get_my_application():
    student_id = get_jwt_identity()
    
    # Logic Update: Only return application if it is relevant to an Active Election context
    # Case 1: Student is an Active Candidate (in UPCOMING or ONGOING election)
    active_candidate = Candidate.query.filter_by(student_id=student_id).join(Election).filter(
        Election.status.in_(["UPCOMING", "ONGOING"])
    ).first()
    
    if active_candidate:
        # Return the APPROVED application corresponding to this
        # Assuming one active application per student roughly
        app = CandidateApplication.query.filter_by(student_id=student_id, status="APPROVED").order_by(CandidateApplication.created_at.desc()).first()
        if app:
             return jsonify({
                "id": app.id,
                "post": app.post,
                "status": "APPROVED", # Force approved status if candidate exists
                "created_at": app.created_at.strftime("%Y-%m-%d"),
                "manifesto": app.manifesto
            }), 200

    # Case 2: Student has a PENDING application (not yet a Candidate, or Rejected but trying again? No, if Rejected it sits until new one)
    # Actually, allow showing REJECTED if it is recent?
    # User Request: "Apply position tab should reset to default when election ends"
    # So if previous election ended, show nothing.
    
    # Just look for PENDING apps.
    pending_app = CandidateApplication.query.filter_by(student_id=student_id, status="PENDING").first()
    if pending_app:
        return jsonify({
            "id": pending_app.id,
            "post": pending_app.post,
            "status": "PENDING",
            "created_at": pending_app.created_at.strftime("%Y-%m-%d"),
            "manifesto": pending_app.manifesto
        }), 200
        
    # Case 3: REJECTED?
    # If the user was rejected for an UPCOMING/ONGOING election, show "Rejected".
    # If election is over, show nothing.
    # We don't link App to Election directly.
    # Simple Heuristic: Return latest App. If it is "APPROVED" but no active candidate record (meaning election finished), return None.
    # If it is "REJECTED", and created recently?
    
    # Revised Logic:
    # 1. Fetch Latest App.
    # 2. If PENDING -> Return it.
    # 3. If APPROVED -> Check if Candidate Record exists and is tied to Active Election. If yes -> Return. Else -> Return None (Reset).
    # 4. If REJECTED -> Return it (User sees rejection). But when can they apply again? 
    #    If they want to apply again, they must likely wait or the UI handles it?
    #    Actually, if Rejected, they should be able to apply again if there is a NEW election?
    #    Let's just return None if the application is "Old".
    #    How to define Old?
    #    Let's stick to the Candidate check for Approval.
    
    latest_app = CandidateApplication.query.filter_by(student_id=student_id).order_by(CandidateApplication.created_at.desc()).first()
    
    if not latest_app:
        return jsonify(None), 200
        
    if latest_app.status == "PENDING":
        return jsonify({
            "id": latest_app.id, 
            "post": latest_app.post, 
            "status": "PENDING", 
            "created_at": latest_app.created_at.strftime("%Y-%m-%d"), 
            "manifesto": latest_app.manifesto
        }), 200
        
    if latest_app.status == "APPROVED":
        # Check if still an active candidate
        is_active = Candidate.query.filter_by(student_id=student_id).join(Election).filter(
            Election.status.in_(["UPCOMING", "ONGOING"])
        ).first()
        
        if is_active:
             return jsonify({
                "id": latest_app.id, 
                "post": latest_app.post, 
                "status": "APPROVED", 
                "created_at": latest_app.created_at.strftime("%Y-%m-%d"), 
                "manifesto": latest_app.manifesto
            }), 200
        else:
            # Election finished (Completed)
            return jsonify(None), 200 # Reset form
            
    if latest_app.status == "REJECTED":
        # Check date? Or just show Rejected.
        # User implies if election ends, reset.
        # If I was rejected for Election A, and Election A ends, I should see Default.
        # But I don't know if Election A ended.
        # Assume if "REJECTED", show it. User can perhaps "Dismiss" it? 
        # Or just show it for now.
         return jsonify({
            "id": latest_app.id, 
            "post": latest_app.post, 
            "status": "REJECTED", 
            "created_at": latest_app.created_at.strftime("%Y-%m-%d"), 
            "manifesto": latest_app.manifesto
        }), 200

    return jsonify(None), 200

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
            "created_at": a.created_at.strftime("%Y-%m-%d"),
            "manifesto": a.manifesto,
            "reason": a.reason,
            "achievements": a.achievements,
            "additional_details": a.additional_details
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
        
        query = Election.query.filter(
            Election.election_type == election_type,
            Election.status.in_(["UPCOMING", "ONGOING"])
        )
        
        if election_type == "CR":
            # 1. Try finding specific election first (Match Course + Semester - Case Insensitive)
            from sqlalchemy import func
            specific = query.filter(
                func.lower(Election.course) == func.lower(app_record.student.course),
                Election.semester == app_record.student.semester
            ).first()
            if specific:
                election = specific
            else:
                # 2. Key change: Look for Generic CR election (course is None OR empty)
                # Re-query without filters
                election = Election.query.filter(
                    Election.status.in_(["UPCOMING", "ONGOING"]),
                    Election.election_type == "CR",
                    (Election.course == None) | (Election.course == "")
                ).first()
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

    elif new_status == "REJECTED":
        # Remove from candidates table if exists
        cand = Candidate.query.filter_by(student_id=app_record.student_id).first()
        if cand:
            db.session.delete(cand)
            msg += ". Candidate removed from election."

    db.session.commit()
    return jsonify({"message": msg}), 200
