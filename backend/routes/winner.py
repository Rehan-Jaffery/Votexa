from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from sqlalchemy import func

from extensions import db
from models import Vote, Candidate, Student, Election
from utils.election_utils import auto_close_election

winner_bp = Blueprint("winner", __name__)

@winner_bp.route("/winner/<int:election_id>", methods=["GET"])
@jwt_required()
def get_winner(election_id):
    role = get_jwt().get("role")

    if role != "admin":
        return jsonify({"error": "Admin access only"}), 403

    election = auto_close_election(election_id)

    if not election:
        return jsonify({"error": "Election not found"}), 404

    if election.status != "COMPLETED":
        return jsonify({"error": "Election is not completed yet"}), 400

    results = (
        db.session.query(
            Candidate.candidate_id,
            Student.name.label("candidate_name"),
            func.count(Vote.vote_id).label("votes")
        )
        .join(Vote, Vote.candidate_id == Candidate.candidate_id)
        .join(Student, Student.student_id == Candidate.student_id)
        .filter(Vote.election_id == election_id)
        .group_by(Candidate.candidate_id, Student.name)
        .order_by(func.count(Vote.vote_id).desc())
        .all()
    )

    if not results:
        return jsonify({"message": "No votes cast"}), 200

    max_votes = results[0].votes

    winners = [
        {
            "candidate_id": r.candidate_id,
            "candidate_name": r.candidate_name,
            "votes": r.votes
        }
        for r in results if r.votes == max_votes
    ]

    return jsonify({
        "election_id": election_id,
        "status": "COMPLETED",
        "winner_count": len(winners),
        "winners": winners
    }), 200
