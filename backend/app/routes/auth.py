from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
    get_jwt
)
from app.extensions import db
from app.models import Student
from werkzeug.security import check_password_hash

auth_bp = Blueprint("auth", __name__)

# ==========================
# LOGIN ROUTE
# ==========================
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    university_id = data.get("university_id")

    if not university_id:
        return jsonify({"error": "University ID is required"}), 400

    student = Student.query.filter_by(university_id=university_id).first()
    
    print(f"Login Attempt: {university_id}")
    if student:
        print(f"User Found: {student.name}, Hash: {student.password_hash}")
        is_valid = check_password_hash(student.password_hash, data.get("password") or "")
        print(f"Password Valid: {is_valid}")
    else:
        print("User NOT Found")

    if not student or not check_password_hash(student.password_hash, data.get("password") or ""):
        return jsonify({"error": "Invalid credentials"}), 401

    # ✅ identity MUST be a STRING (JWT requirement)
    access_token = create_access_token(
        identity=str(student.student_id),
        additional_claims={
            "role": student.role,
            "university_id": student.university_id
        }
    )

    return jsonify({
        "access_token": access_token,
        "role": student.role,
        "is_password_changed": student.is_password_changed,
        "user": {
            "name": student.name,
            "university_id": student.university_id,
            "role": student.role,
            "course": student.course,
            "semester": student.semester,
            "batch": student.batch,
        }
    }), 200


# ==========================
# ADMIN DASHBOARD (PROTECTED)
# ==========================
@auth_bp.route("/admin/dashboard", methods=["GET"])
@jwt_required()
def admin_dashboard():
    student_id = get_jwt_identity()  # string
    claims = get_jwt()

    role = claims.get("role")

    if role != "admin":
        return jsonify({"error": "Admin access only"}), 403

    student = Student.query.filter_by(student_id=student_id).first()

    if not student:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "message": "Welcome Admin",
        "student_id": student.student_id,
        "university_id": student.university_id,
        "role": student.role
    }), 200

# ==========================
# CHANGE PASSWORD ROUTE
# ==========================
from werkzeug.security import generate_password_hash

@auth_bp.route("/change-password", methods=["POST"])
@jwt_required()
def change_password():
    student_id = get_jwt_identity()
    data = request.get_json()
    new_password = data.get("new_password")

    if not new_password or len(new_password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    student = Student.query.filter_by(student_id=student_id).first()
    
    student.password_hash = generate_password_hash(new_password)
    student.is_password_changed = True
    db.session.commit()

    return jsonify({"message": "Password updated successfully"}), 200

# ==========================
# GET CURRENT USER PROFILE
# ==========================
@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    student_id = get_jwt_identity()
    student = Student.query.filter_by(student_id=student_id).first()
    
    if not student:
        return jsonify({"error": "User not found"}), 404
        
    return jsonify({
        "university_id": student.university_id,
        "name": student.name,
        "email": student.email,
        "role": student.role,
        "course": student.course,
        "batch": student.batch
    }), 200

# ==========================
# UPDATE EMAIL
# ==========================
@auth_bp.route("/me", methods=["PUT"])
@jwt_required()
def update_profile():
    student_id = get_jwt_identity()
    data = request.get_json()
    new_email = data.get("email")

    if not new_email:
        return jsonify({"error": "Email is required"}), 400
        
    student = Student.query.filter_by(student_id=student_id).first()
    
    # Check if email is taken by another user
    existing = Student.query.filter_by(email=new_email).first()
    if existing and existing.student_id != int(student_id):
        return jsonify({"error": "Email already in use"}), 409
        
    student.email = new_email
    db.session.commit()

    return jsonify({"message": "Profile updated successfully"}), 200

# ==========================
# GET VOTING HISTORY
# ==========================
from app.models import Vote, Election

@auth_bp.route("/me/votes", methods=["GET"])
@jwt_required()
def get_voting_history():
    student_id = get_jwt_identity()
    
    votes = db.session.query(Vote, Election).join(Election, Vote.election_id == Election.election_id)\
        .filter(Vote.voter_id == student_id).all()
        
    history = []
    for vote, election in votes:
        history.append({
            "election": f"{election.election_type} - {election.post}" if election.post else election.election_type,
            "vote_time": vote.vote_time.strftime("%Y-%m-%d %H:%M:%S"),
            "status": election.status
        })
        
    return jsonify(history), 200
