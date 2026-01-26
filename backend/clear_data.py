from app import create_app
from app.extensions import db
from app.models import Election, Candidate, CandidateApplication, Vote

app = create_app()

with app.app_context():
    try:
        print("Cleaning up Votes...")
        db.session.query(Vote).delete()
        
        print("Cleaning up Candidates...")
        db.session.query(Candidate).delete()
        
        print("Cleaning up Applications...")
        # Note: We want to delete ALL applications as requested
        db.session.query(CandidateApplication).delete()
        
        print("Cleaning up Elections...")
        db.session.query(Election).delete()
        
        db.session.commit()
        print("Cleanup Complete. Users preserved.")
    except Exception as e:
        db.session.rollback()
        print(f"Error: {e}")
