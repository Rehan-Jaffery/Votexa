from app import create_app
from app.extensions import db
from app.models import Student
from werkzeug.security import generate_password_hash

app = create_app()

with app.app_context():
    # Find Admin by role OR university_id if known (ADMIN001)
    admin = Student.query.filter_by(role='admin').first()
    
    if admin:
        admin.name = "Admin"
        admin.password_hash = generate_password_hash("admin123")
        db.session.commit()
        print(f"[SUCCESS] Admin Updated: Name='{admin.name}', ID='{admin.university_id}', Password='admin123'")
    else:
        print("[ERROR] Admin user not found.")

