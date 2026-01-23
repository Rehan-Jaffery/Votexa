from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
    get_jwt
)
from models import Student

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

    if not student:
        return jsonify({"error": "User not found"}), 404

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
        "role": student.role
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
