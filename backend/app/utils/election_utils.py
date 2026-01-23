from datetime import datetime
from app.models import Election
from app.extensions import db

def auto_close_election(election_id):
    election = Election.query.get(election_id)

    if not election:
        return None

    if election.end_date and election.end_date < datetime.utcnow():
        if election.status != "COMPLETED":
            election.status = "COMPLETED"
            db.session.commit()

    return election
