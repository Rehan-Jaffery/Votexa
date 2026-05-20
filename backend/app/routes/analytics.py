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

@analytics_bp.route("/cr-stats", methods=["GET"])
@jwt_required()
def cr_dashboard_stats():
    claims = get_jwt()
    role = claims.get("role")
    user_id = int(claims.get("sub"))

    if role != "cr":
        return jsonify({"error": "CR access only"}), 403
    
    # Get CR details to know which batch to check
    from app.models import Student
    cr = Student.query.get(user_id)
    if not cr:
        return jsonify({"error": "User not found"}), 404

    # 1. Find ACTIVE CR Election for this batch (Course + Sem)
    # Theoretically there should be only one active CR election for a specific batch at a time
    active_election = Election.query.filter_by(
        status='ONGOING',
        election_type='CR',
        course=cr.course,
        semester=cr.semester
    ).first()

    if not active_election:
        return jsonify({
            "has_active_election": False,
            "message": "No active voting for your class right now."
        }), 200

    # 2. Stats
    # Total Class Strength
    total_students = Student.query.filter_by(
        course=cr.course,
        semester=cr.semester,
        role='student' # Count regular students (and maybe other CRs? usually 1 CR). Just count all in batch.
    ).count()
    
    # Actually, include the CR themselves in "Total Voters" usually
    total_students_all = Student.query.filter_by(
        course=cr.course, 
        semester=cr.semester
    ).count()

    # Total Votes in this election
    votes_cast = Vote.query.filter_by(election_id=active_election.election_id).count()

    return jsonify({
        "has_active_election": True,
        "election_title": active_election.election_type + " - " + (active_election.course or ""),
        "total_students": total_students_all,
        "votes_cast": votes_cast,
        "pending_votes": total_students_all - votes_cast,
        "turnout_percentage": round((votes_cast / total_students_all) * 100, 1) if total_students_all > 0 else 0
    }), 200

@analytics_bp.route("/analytics/system-health", methods=["GET"])
@jwt_required()
def system_health():

    """Admin Only: Returns system status overview."""
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin access only"}), 403
    
    try:
        # 1. DB Check (Count users is a cheap way to check connection)
        from app.models import Student
        user_count = Student.query.count()
        
        # 2. Election Stats
        active_elections = Election.query.filter_by(status="ONGOING").count()
        
        return jsonify({
            "status": "Operational",
            "db_status": "Connected",
            "active_users": user_count,
            "active_elections": active_elections,
            "message": "All Systems Operational"
        }), 200
    except Exception as e:
        return jsonify({
            "status": "Degraded",
            "db_status": "Error",
            "error": str(e),
            "message": "System experiencing issues"
        }), 200

@analytics_bp.route("/analytics/predict-turnout/<int:election_id>", methods=["GET"])
@jwt_required()
def predict_turnout(election_id):
    """Admin Only: Returns an AI prediction for the final turnout of an ongoing election."""
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin access only"}), 403

    from app.models import Student, Election, Vote
    from app.utils.ai_turnout import turnout_predictor
    from datetime import datetime

    election = Election.query.get(election_id)
    if not election:
        return jsonify({"error": "Election not found"}), 404

    # Calculate Total Eligible Students
    if election.election_type == "CR":
        total_students = Student.query.filter_by(
            course=election.course,
            semester=election.semester
        ).count()
    else:
        # Council election: All CRs (or everyone, depending on your business logic)
        # Let's say all CRs for Council
        total_students = Student.query.filter_by(role='cr').count()

    # If no students eligible, avoid div/0
    if total_students == 0:
        return jsonify({
            "election_id": election_id,
            "hours_elapsed": 0.0,
            "total_eligible_students": 0,
            "current_votes": 0,
            "current_turnout_percent": 0.0,
            "predicted_final_turnout_percent": 0.0,
            "model_used": "Linear Regression"
        }), 200

    # Current Votes
    current_votes = Vote.query.filter_by(election_id=election.election_id).count()
    current_turnout_percent = (current_votes / total_students) * 100

    # Hours Elapsed
    if election.start_date:
        # Ensure timezone naiveness matches for calculation
        now = datetime.utcnow()
        elapsed_delta = now - election.start_date
        hours_elapsed = elapsed_delta.total_seconds() / 3600.0
    else:
        hours_elapsed = 0.0

    # Call AI Model
    predicted_turnout = turnout_predictor.predict(
        hours_elapsed=hours_elapsed,
        total_students=total_students,
        current_turnout_percent=current_turnout_percent
    )

    return jsonify({
        "election_id": election_id,
        "hours_elapsed": round(hours_elapsed, 1),
        "total_eligible_students": total_students,
        "current_votes": current_votes,
        "current_turnout_percent": round(current_turnout_percent, 1),
        "predicted_final_turnout_percent": predicted_turnout,
        "model_used": "Linear Regression"
    }), 200
