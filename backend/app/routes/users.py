from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from werkzeug.security import generate_password_hash
import pandas as pd
import secrets
import string
from flask_mail import Message
from app.extensions import db, mail
from app.models import Student

users_bp = Blueprint("users", __name__)

def generate_random_password(length=8):
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for i in range(length))

def send_credentials_email(student_email, name, uid, password):
    try:
        msg = Message(
            subject="VOTEXA Login Credentials",
            recipients=[student_email],
            body=f"""Hello {name},
            
Your account has been created on VOTEXA.
    
    Login ID: {uid}
    Password: {password}

Please log in and change your password immediately.

Regards,
VOTEXA Team
"""
        )
        mail.send(msg)
        return True
    except Exception as e:
        print(f"Failed to send email to {student_email}: {e}")
        import traceback
        traceback.print_exc()
        return False

@users_bp.route("/upload", methods=["POST"])
@jwt_required()
def upload_students():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin access only"}), 403

    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file)
        else:
            df = pd.read_excel(file)
        
        # Validate columns (Added semester, password)
        # Note: password is optional in the logic below, but good to have column present even if empty
        # allowing flexible column check or just strict
        
        added_count = 0
        email_count = 0
        errors = []

        for index, row in df.iterrows():
            uid = str(row['university_id']).strip()
            email = str(row['email']).strip()
            semester = str(row.get('semester', '1')).strip() # Default to 1 if missing
            
            # Read role (Restrict Admin creation)
            role = str(row.get('role', 'student')).lower()
            if role == 'admin':
                role = 'student' # Force admin to student
            
            valid_roles = ['student', 'cr', 'president', 'vice_president', 'secretary', 'joint_secretary']
            if role not in valid_roles:
                role = 'student'
            
            if Student.query.filter_by(university_id=uid).first():
                errors.append(f"Row {index+2}: ID {uid} exists.")
                continue
                
            if Student.query.filter_by(email=email).first():
                errors.append(f"Row {index+2}: Email {email} exists.")
                continue

            # Password Logic
            provided_password = str(row.get('password', '')).strip()
            if provided_password and provided_password.lower() != 'nan':
                 final_password = provided_password
                 # Optional: Send email saying "Account created, use provided password"
                 should_send_email = True 
            else:
                 final_password = generate_random_password()
                 should_send_email = True

            try:
                new_student = Student(
                    university_id=uid,
                    name=row['name'],
                    course=row['course'],
                    batch=str(row['batch']),
                    semester=semester,
                    email=email,
                    password_hash=generate_password_hash(final_password),
                    role=role,
                    is_password_changed=False
                )
                db.session.add(new_student)
                added_count += 1
                
                # Send Email
                if should_send_email:
                    if send_credentials_email(email, row['name'], uid, final_password):
                        email_count += 1
                    
            except Exception as e:
                errors.append(f"Row {index+2}: Error adding {uid} - {str(e)}")

        db.session.commit()
        
        return jsonify({
            "message": f"Added {added_count} students. Sent {email_count} emails.",
            "errors": errors
        }), 201

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@users_bp.route("/", methods=["GET"])
@jwt_required()
def list_users():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin access only"}), 403

    students = Student.query.all()
    data = []
    for s in students:
        if s.role == 'admin': continue # Don't list super admin
        data.append({
            "student_id": s.student_id,
            "university_id": s.university_id,
            "name": s.name,
            "course": s.course,
            "batch": s.batch,
            "semester": s.semester,
            "email": s.email,
            "role": s.role
        })
    
    return jsonify(data), 200

@users_bp.route("/<int:student_id>", methods=["DELETE"])
@jwt_required()
def delete_user(student_id):
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin access only"}), 403

    student = Student.query.get(student_id)
    if not student:
        return jsonify({"error": "User not found"}), 404
        
    # Prevent deleting self (Admin)
    identity_id = int(claims.get("sub")) # sub is student_id in string
    if student.student_id == identity_id:
         return jsonify({"error": "Cannot delete yourself"}), 400

    try:
        db.session.delete(student)
        db.session.commit()
        return jsonify({"message": "User deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to delete: {str(e)}"}), 500

@users_bp.route("/<int:student_id>/role", methods=["PUT"])
@jwt_required()
def update_role(student_id):
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin access only"}), 403

    student = Student.query.get(student_id)
    if not student:
        return jsonify({"error": "User not found"}), 404

    data = request.json
    new_role = data.get("role")
    
    valid_updatable_roles = ["student", "cr", "president", "vice_president", "secretary", "joint_secretary"]
    if new_role not in valid_updatable_roles:
         return jsonify({"error": f"Invalid role. Allowed: {valid_updatable_roles}"}), 400

    try:
        student.role = new_role
        db.session.commit()
        return jsonify({"message": f"User role updated to {new_role}"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to update role: {str(e)}"}), 500

@users_bp.route("/public-council", methods=["GET"])
@jwt_required()
def get_public_council():
    # ALLOW ALL AUTHENTICATED USERS
    
    # 1. Fetch Council Members
    council = Student.query.filter(Student.role.in_(["president", "vice_president", "secretary", "joint_secretary"])).all()
    council_data = []
    for c in council:
        council_data.append({
             "name": c.name,
             "email": c.email,
             "role": c.role,
             "course": c.course, # Maybe useful
             "semester": c.semester
        })

    # 2. Fetch CRs (Include Council members as they function as CRs too)
    cr_roles = ["cr", "president", "vice_president", "secretary", "joint_secretary"]
    crs = Student.query.filter(Student.role.in_(cr_roles)).all()
    cr_data = []
    for c in crs:
        cr_data.append({
             "name": c.name,
             "email": c.email,
             "role": c.role, # Pass actual role (e.g. 'vice_president' or 'cr')
             "course": c.course,
             "batch": c.batch,
             "semester": c.semester
        })
        
    return jsonify({
        "council": council_data,
        "crs": cr_data
    }), 200
