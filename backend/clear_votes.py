from app import create_app
from app.extensions import db
from app.models import Vote, Student

app = create_app()

with app.app_context():
    # Find student 
    s = Student.query.filter_by(university_id="24mca11").first()
    if s:
        # Delete votes for this student
        deleted = Vote.query.filter_by(voter_id=s.student_id).delete()
        db.session.commit()
        print(f"Deleted {deleted} votes for user {s.name}")
    else:
        print("Student not found")
