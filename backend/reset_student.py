from app import create_app
from app.extensions import db
from app.models import Student
from werkzeug.security import generate_password_hash

app = create_app()

with app.app_context():
    s = Student.query.filter_by(university_id="24msc13").first()
    if s:
        s.password_hash = generate_password_hash("test@123")
        db.session.commit()
        print("SUCCESS: Password reset for 24msc13 to test@123")
    else:
        print("ERROR: Student not found")
