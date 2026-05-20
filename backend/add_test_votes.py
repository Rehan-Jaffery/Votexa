import sys
from app import create_app
from app.extensions import db
from app.models import Student, Candidate, Election, Vote
from datetime import datetime

def add_test_votes():
    app = create_app()
    with app.app_context():
        # Get the test users
        user3 = Student.query.filter_by(email="testuser3@gmail.com").first()
        user4 = Student.query.filter_by(email="testuser4@gmail.com").first()

        if not user3 or not user4:
            print("Error: Could not find Test User 3 or Test User 4.")
            return

        print(f"Found User3 (ID: {user3.student_id}) and User4 (ID: {user4.student_id})")

        # Find their candidates
        cand3 = Candidate.query.filter_by(student_id=user3.student_id).first()
        cand4 = Candidate.query.filter_by(student_id=user4.student_id).first()

        if not cand3 or not cand4:
            print("Error: Could not find candidate entries for User3 or User4. Are they approved candidates in an election?")
            return

        election_id = cand3.election_id
        if cand3.election_id != cand4.election_id:
            print("Warning: User3 and User4 are in different elections. Using User3's election for User3, and User4's for User4.")

        # Let's get some dummy voters (just any students, or we can just reuse user3 and user4 IDs since there's no DB constraint)
        # To be safe, let's fetch all students and use them as voters.
        students = Student.query.limit(10).all()
        voter_ids = [s.student_id for s in students]
        
        # If we don't have enough distinct voters, we'll just cycle through them. 
        # There's no unique constraint on the DB level in models.py, so it will work.

        # Add 4 votes for Test User 3
        print(f"Adding 4 votes for Candidate 3 (User 3)")
        for i in range(4):
            voter_id = voter_ids[i % len(voter_ids)]
            new_vote = Vote(
                voter_id=voter_id,
                candidate_id=cand3.candidate_id,
                election_id=cand3.election_id,
                vote_time=datetime.utcnow()
            )
            db.session.add(new_vote)

        # Add 5 votes for Test User 4
        print(f"Adding 5 votes for Candidate 4 (User 4)")
        for i in range(5):
            voter_id = voter_ids[(i + 4) % len(voter_ids)]
            new_vote = Vote(
                voter_id=voter_id,
                candidate_id=cand4.candidate_id,
                election_id=cand4.election_id,
                vote_time=datetime.utcnow()
            )
            db.session.add(new_vote)

        db.session.commit()
        print("Successfully added 4 votes to Test User 3 and 5 votes to Test User 4.")

if __name__ == "__main__":
    add_test_votes()
