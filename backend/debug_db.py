from app import create_app, db
from app.models import Election, Candidate, CandidateApplication, Student

app = create_app()

with app.app_context():
    print("--- ELECTIONS ---")
    elections = Election.query.all()
    for e in elections:
        print(f"ID: {e.election_id}, Type: {e.election_type}, Status: {e.status}, Course: {e.course}, Batch: {e.batch}")

    print("\n--- APPLICATIONS ---")
    apps = CandidateApplication.query.all()
    for a in apps:
        print(f"ID: {a.id}, Student: {a.student_id}, Post: {a.post}, Status: {a.status}")

    print("\n--- CANDIDATES ---")
    cands = Candidate.query.all()
    for c in cands:
        print(f"ID: {c.candidate_id}, Student: {c.student_id}, Election ID: {c.election_id}")
