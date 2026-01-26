from app import create_app, db
from app.models import CandidateApplication, Candidate

app = create_app()

with app.app_context():
    try:
        # Delete all candidates first (FK constraint)
        num_cands = db.session.query(Candidate).delete()
        # Delete all applications
        num_apps = db.session.query(CandidateApplication).delete()
        db.session.commit()
        print(f"Deleted {num_cands} candidates and {num_apps} applications.")
    except Exception as e:
        db.session.rollback()
        print(f"Error: {e}")
