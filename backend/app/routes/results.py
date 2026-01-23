from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from app.models import Vote
from app.extensions import db

results_bp = Blueprint("results", __name__)

@results_bp.route("/results/<int:election_id>", methods=["GET"])
@jwt_required()
def election_results(election_id):
    claims = get_jwt()

    if claims.get("role") != "admin":
        return jsonify({"error": "Admin access only"}), 403

    results = (
        db.session.query(
            Vote.candidate_id,
            db.func.count(Vote.vote_id).label("votes")
        )
        .filter(Vote.election_id == election_id)
        .group_by(Vote.candidate_id)
        .order_by(db.desc("votes"))
        .all()
    )

    if not results:
        return jsonify({"message": "No votes yet"}), 200

    formatted_results = [
        {"candidate_id": r.candidate_id, "votes": r.votes}
        for r in results
    ]

    winner = formatted_results[0]["candidate_id"]

    return jsonify({
        "election_id": election_id,
        "results": formatted_results,
        "winner_candidate_id": winner
    }), 200
