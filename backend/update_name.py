from app import create_app
from app.extensions import db
from app.models import Student

app = create_app()

with app.app_context():
    s = Student.query.filter_by(name="aimlruhan").first()
    if s:
        s.name = "test student"
        db.session.commit()
        print("SUCCESS: Name updated to 'test student' for aimlruhan")
    else:
        s2 = Student.query.filter_by(university_id="24msc13").first()
        if s2:
            s2.name = "test student"
            db.session.commit()
            print("SUCCESS: Name updated to 'test student' for university_id 24msc13 (aimlruhan not found directly by name)")
        else:
            print("ERROR: User not found.")
