from app import create_app, db
from app.models import Student
from werkzeug.security import generate_password_hash

app = create_app()
with app.app_context():
    admin = Student.query.filter_by(university_id="ADMIN001").first()
    if admin:
        admin.password_hash = generate_password_hash("admin")
        db.session.commit()
        print("Admin password reset to 'admin'")
    else:
        print("Admin user not found!")
