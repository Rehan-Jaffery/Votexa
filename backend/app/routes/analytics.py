from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from app.models import Vote, Election
from app.extensions import db

analytics_bp = Blueprint("analytics", __name__)

@analytics_bp.route("/analytics/<int:election_id>", methods=["GET"])
@jwt_required()
def election_analytics(election_id):
    claims = get_jwt()

    # 🔒 Admin only
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin access only"}), 403

    election = Election.query.get(election_id)
    if not election:
        return jsonify({"error": "Election not found"}), 404

    total_votes = Vote.query.filter_by(election_id=election_id).count()

    candidate_results = (
        db.session.query(
            Vote.candidate_id,
            db.func.count(Vote.vote_id).label("votes")
        )
        .filter(Vote.election_id == election_id)
        .group_by(Vote.candidate_id)
        .all()
    )

    results = [
        {
            "candidate_id": c.candidate_id,
            "votes": c.votes
        }
        for c in candidate_results
    ]

    return jsonify({
        "election_id": election_id,
        "total_votes": total_votes,
        "results": results
    }), 200
