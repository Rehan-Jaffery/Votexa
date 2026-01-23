from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Election

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
        post=data.get("post"),
        start_date=data.get("start_date"),
        end_date=data.get("end_date")
    )

    db.session.add(election)
    db.session.commit()

    return jsonify({"message": "Election created successfully"}), 201

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from models import Election
from extensions import db

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
