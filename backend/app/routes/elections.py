from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from app.extensions import db
from app.models import Election, Candidate, Student, CandidateApplication, Vote
from datetime import datetime

elections_bp = Blueprint("elections", __name__)

# ============================
# CREATE ELECTION (ADMIN)
# ============================
@elections_bp.route("/", methods=["POST"])
@jwt_required()
def create_election():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin access only"}), 403

    data = request.get_json()
    
    # Validation
    election_type = data.get("election_type")
    if election_type not in ["CR", "COUNCIL"]:
        return jsonify({"error": "Invalid election type"}), 400

    new_election = Election(
        election_type=election_type,
        course=data.get("course"), # Optional
        # batch=data.get("batch"), # REMOVED per user request
        semester=data.get("semester"),
        post=data.get("post"),     # Only for COUNCIL
        start_date=datetime.strptime(data.get("start_date"), "%Y-%m-%dT%H:%M") if data.get("start_date") else None,
        end_date=datetime.strptime(data.get("end_date"), "%Y-%m-%dT%H:%M") if data.get("end_date") else None,
        status="UPCOMING" 
    )

    try:
        db.session.add(new_election)
        db.session.commit()
        return jsonify({"message": "Election created successfully", "id": new_election.election_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@elections_bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_election(id):
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin access only"}), 403

    election = Election.query.get(id)
    if not election:
        return jsonify({"error": "Election not found"}), 404

    # Delete associated votes, candidates?
    # Cascade delete usually handles this if configured, but let's be safe
    # SQLite might not enforce cascade without config
    Vote.query.filter_by(election_id=id).delete()
    Candidate.query.filter_by(election_id=id).delete()
    db.session.delete(election)
    db.session.commit()
    return jsonify({"message": "Election deleted successfully"}), 200

# ============================
# LIST ELECTIONS (ADMIN)
# ============================
@elections_bp.route("/", methods=["GET"])
@jwt_required()
def list_elections():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin access only"}), 403

    elections = Election.query.order_by(Election.election_id.desc()).all()
    data = []
    for e in elections:
        data.append({
            "id": e.election_id,
            "type": e.election_type,
            "title": f"{e.post}" if e.election_type == "COUNCIL" else f"CR - {e.course} Sem {e.semester}",
            "status": e.status,
            "start_date": e.start_date.strftime("%Y-%m-%d %H:%M") if e.start_date else "TBD",
            "end_date": e.end_date.strftime("%Y-%m-%d %H:%M") if e.end_date else "TBD"
        })
    return jsonify(data), 200

# ============================
# UPDATE STATUS (ADMIN)
# ============================
@elections_bp.route("/<int:id>/status", methods=["PUT"])
@jwt_required()
def update_status(id):
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin access only"}), 403

    data = request.get_json()
    status = data.get("status")
    
    if status not in ["UPCOMING", "ONGOING", "COMPLETED"]:
        return jsonify({"error": "Invalid status"}), 400

    election = Election.query.get(id)
    if not election:
        return jsonify({"error": "Election not found"}), 404

    election.status = status
    db.session.commit()
    return jsonify({"message": f"Status updated to {status}"}), 200

# ============================
# CHECK ELIGIBILITY (STUDENT)
# ============================
@elections_bp.route("/check-eligibility", methods=["GET"])
@jwt_required()
def check_eligibility():
    student_id = get_jwt_identity()
    user = Student.query.get(student_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Logic:
    # Look for UPCOMING elections
    
    eligible_elections = []
    
    if user.role == "student":
        elections = Election.query.filter_by(status="UPCOMING", election_type="CR").all()
        
        for e in elections:
            # If election has specific constraints, check them
            if e.course and e.course.lower() != user.course.lower(): continue
            # if e.batch and str(e.batch) != str(user.batch): continue # REMOVED
            if e.semester and str(e.semester) != str(user.semester): continue
            
            eligible_elections.append({
                "id": e.election_id,
                "title": f"Class Representative ({user.course} {user.batch} Sem {user.semester})",
                "post": "Class Representative"
            })
            
    elif user.role in ["cr", "vice_president", "secretary", "joint_secretary"]:
        # Can apply for Council Posts
        elections = Election.query.filter_by(status="UPCOMING", election_type="COUNCIL").all()
        for e in elections:
            eligible_elections.append({
                "id": e.election_id,
                "title": e.post,
                "post": e.post
            })

    if not eligible_elections:
        return jsonify({"can_apply": False, "message": "No active elections for your profile."}), 200
        
    return jsonify({"can_apply": True, "elections": eligible_elections}), 200

# ============================
# MANAGE CANDIDATES (ADMIN)
# ============================
@elections_bp.route("/active", methods=["GET"])
@jwt_required()
def list_active_elections():
    # Public (Students) - Show ONGOING elections
    elections = Election.query.filter_by(status="ONGOING").all()
    data = []
    
    student_id = get_jwt_identity()
    user = Student.query.get(student_id)
    
    for e in elections:
        if e.election_type == "CR":
            # If Valid User (Student) -> Check constraints
            # If Admin -> Skip constraints (Bypass)
            if user.role != "admin":
                 if e.course and e.course.lower() != user.course.lower(): continue
            
            data.append({
                "election_id": e.election_id,
                "title": f"Class Representative ({e.course} {e.semester})", # Use Election details, not User details (as admin needs to see real title)
                "type": "CR",
                "course": e.course,
                "batch": getattr(e, 'batch', 'NA'),
                "status": e.status,
                "end_date": e.end_date.strftime("%Y-%m-%d %H:%M") if e.end_date else "TBD"
            })
        else:
             data.append({
                "election_id": e.election_id,
                "title": f"Council - {e.post}",
                "type": "COUNCIL",
                "post": e.post,
                "status": e.status,
                "end_date": e.end_date.strftime("%Y-%m-%d %H:%M") if e.end_date else "TBD"
            })
            
    return jsonify(data), 200

print("DEBUG: ELECTIONS MODULE LOADED - REGISTERING ROUTES")

@elections_bp.route("/test", methods=["GET"])
def test_route():
    print("DEBUG: HIT TEST ROUTE")
    return jsonify({"message": "Test OK"}), 200

@elections_bp.route("/<int:id>/candidates", methods=["GET"])
@jwt_required()
def list_candidates(id):
    student_id = get_jwt_identity()
    user = Student.query.get(student_id)
    claims = get_jwt()
    is_admin = claims.get("role") == "admin"

    election = Election.query.get(id)
    if not election:
        return jsonify({"error": "Election not found"}), 404

    query = Candidate.query.filter_by(election_id=id)
    
    # WARD FILTER FOR CR ELECTIONS
    # Ensure Admin is detected
    if user.role == "admin": is_admin = True
    
    if election.election_type == "CR" and not is_admin:
        print(f"Filtering Candidates for User: {user.name}, {user.course}, {user.batch}, {user.semester}")
        # Join with Student to check their details
        query = query.join(Student).filter(
            Student.course == user.course,
            Student.batch == user.batch,
            Student.semester == user.semester
        )
        # Debug print raw query or results
        cands = query.all()
        print(f"Found {len(cands)} candidates for this user.")
        
    candidates = query.all()
    data = []
    for c in candidates:
        data.append({
            "candidate_id": c.candidate_id,
            "student_id": c.student.university_id,
            "name": c.student.name,
            "course": c.student.course,
            "batch": c.student.batch,
            "semester": c.student.semester,
            "post": c.student.role 
        })
    return jsonify(data), 200

@elections_bp.route("/<int:election_id>/candidates/<int:candidate_id>", methods=["DELETE"])
@jwt_required()
def remove_candidate(election_id, candidate_id):
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin access only"}), 403

    candidate = Candidate.query.get(candidate_id)
    if not candidate:
        return jsonify({"error": "Candidate not found"}), 404

    # Find associated application and set it back to PENDING or REJECTED?
    # Or just delete candidate. 
    # Better: Update Application status to REJECTED so they know.
    
    app = CandidateApplication.query.filter_by(student_id=candidate.student_id, status="APPROVED").first() 
    # Be careful: might match wrong app if multiple. But usually one active.
    
    db.session.delete(candidate)
    
    if app:
        app.status = "REJECTED" # Or PENDING? Let's say REJECTED (Removed by Admin)
    
    db.session.commit()
    return jsonify({"message": "Candidate removed successfully"}), 200

@elections_bp.route("/debug/<int:id>", methods=["GET"])
def debug_candidates_public(id):
    # PUBLIC DEBUG ENDPOINT
    cands = Candidate.query.filter_by(election_id=id).all()
    data = []
    for c in cands:
        data.append({
            "cand_id": c.candidate_id, 
            "student_id": c.student_id,
            "name": c.student.name if c.student else "No Student Linked"
        })
    return jsonify({"count": len(data), "candidates": data}), 200
