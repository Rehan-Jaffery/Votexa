from app import create_app
from app.extensions import db
from app.models import Student
from werkzeug.security import generate_password_hash

app = create_app()

with app.app_context():
    admin = Student.query.filter_by(role='admin').first()
    if admin:
        admin.password_hash = generate_password_hash("admin123")
        db.session.commit()
        print(f"✅ Password for '{admin.name}' (ID: {admin.student_id}) reset to 'admin123'.")
    else:
        print("❌ Admin user not found.")
