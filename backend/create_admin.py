from app import create_app
from app.extensions import db
from app.models import Student
from werkzeug.security import generate_password_hash

app = create_app()

with app.app_context():
    admin = Student.query.filter_by(role="admin").first()
    if not admin:
        print("Creating Admin User...")
        admin = Student(
            university_id="ADMIN001",
            name="Super Admin",
            course="Administration",
            batch="2024",
            email="admin@votexa.com", # Dummy email
            role="admin",
            password_hash=generate_password_hash("admin123"),
            is_password_changed=False # Set to False to test change password flow
        )
        db.session.add(admin)
        db.session.commit()
        print("Admin user created.")
    else:
        # For testing, reset flag if exists
        admin.password_hash = generate_password_hash("admin123")
        admin.is_password_changed = False
        db.session.commit()
        print("Admin user already exists. **PASSWORD RESET to admin123**.")
