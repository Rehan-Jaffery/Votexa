from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from sqlalchemy import func
from app.utils.election_utils import auto_close_election


from app.extensions import db
from app.models import Vote, Election, Candidate, Student

vote_bp = Blueprint("vote", __name__)

# ==========================
# CAST VOTE (STUDENT ONLY)
# ==========================
@vote_bp.route("/vote", methods=["POST"])
@jwt_required()
def cast_vote():
    data = request.get_json()

    election_id = data.get("election_id")
    candidate_id = data.get("candidate_id")

    if not election_id or not candidate_id:
        return jsonify({"error": "Missing election_id or candidate_id"}), 400

    student_id = int(get_jwt_identity())
    role = get_jwt().get("role")

    # Only students can vote
    if role != "student":
        return jsonify({"error": "Only students can vote"}), 403

    # Check election exists
    election = auto_close_election(election_id)

    if not election:
        return jsonify({"error": "Election not found"}), 404
    

    # from app.utils.election_utils import auto_close_election

    # Check election status
    if election.status != "ONGOING":
        return jsonify({"error": "Voting is closed for this election"}), 403

    # Prevent duplicate voting
    existing_vote = Vote.query.filter_by(
        voter_id=student_id,
        election_id=election_id
    ).first()

    if existing_vote:
        return jsonify({"error": "You have already voted in this election"}), 409

    # Cast vote
    vote = Vote(
        voter_id=student_id,
        candidate_id=candidate_id,
        election_id=election_id
    )

    db.session.add(vote)
    db.session.commit()

    return jsonify({"message": "Vote cast successfully"}), 201


# ==========================
# GET ELECTION RESULTS (ADMIN)
# ==========================
@vote_bp.route("/results/<int:election_id>", methods=["GET"])
@jwt_required()
def election_results(election_id):
    role = get_jwt().get("role")

    if role != "admin":
        return jsonify({"error": "Admin access only"}), 403

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

    response = [
        {
            "candidate_id": row.candidate_id,
            "candidate_name": row.candidate_name,
            "votes": row.votes
        }
        for row in results
    ]

    return jsonify({
        "election_id": election_id,
        "results": response
    }), 200


# ==========================
# ELECTION ANALYTICS (ADMIN)
# ==========================
@vote_bp.route("/analytics/<int:election_id>", methods=["GET"])
@jwt_required()
def election_analytics(election_id):
    role = get_jwt().get("role")

    if role != "admin":
        return jsonify({"error": "Admin access only"}), 403

    election = auto_close_election(election_id)

    if not election:
        return jsonify({"error": "Election not found"}), 404

    total_students = Student.query.count()
    total_votes = Vote.query.filter_by(election_id=election_id).count()

    turnout_percentage = (
        (total_votes / total_students) * 100
        if total_students > 0 else 0
    )

    return jsonify({
        "election_id": election_id,
        "total_students": total_students,
        "total_votes_cast": total_votes,
        "voter_turnout_percentage": round(turnout_percentage, 2)
    }), 200
