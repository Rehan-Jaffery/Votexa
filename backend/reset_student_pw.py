from app import create_app
from app.extensions import db
from app.models import Student
from werkzeug.security import generate_password_hash

app = create_app()

with app.app_context():
    s = Student.query.filter_by(university_id="24mca11").first()
    if s:
        s.password_hash = generate_password_hash("password123")
        db.session.commit()
        print("Password reset for 24mca11")
    else:
        print("Student not found")
