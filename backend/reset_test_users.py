from app import create_app
from app.extensions import db
from app.models import Student
from werkzeug.security import generate_password_hash

app = create_app()

with app.app_context():
    users = [
        {"uid": "24msc12", "pass": "password"},       # VP
        {"uid": "24msc13", "pass": "password"}        # Student
    ]

    
    for u in users:
        student = Student.query.filter_by(university_id=u["uid"]).first()
        if student:
            student.password_hash = generate_password_hash(u["pass"])
            print(f"[SUCCESS] Updated password for {u['uid']}")
        else:
            print(f"[WARNING] User {u['uid']} not found")
            
    db.session.commit()
