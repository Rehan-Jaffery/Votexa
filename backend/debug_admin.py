from app import create_app
from app.extensions import db
from app.models import Student
from werkzeug.security import check_password_hash

app = create_app()

with app.app_context():
    print("--- CHECKING ADMIN USERS ---")
    admins = Student.query.filter_by(role="admin").all()
    if not admins:
        print("NO ADMIN USERS FOUND!")
    
    for a in admins:
        print(f"ID: '{a.university_id}'")
        print(f"Name: {a.name}")
        print(f"Role: {a.role}")
        print(f"Password Hash: {a.password_hash}")
        
        # Test default password
        is_valid = check_password_hash(a.password_hash, "admin123")
        print(f"Is password 'admin123' valid? {is_valid}")
        print("-" * 20)

    print("--- CHECKING ALL USERS (First 5) ---")
    users = Student.query.all()[:5]
    for u in users:
         print(f"ID: '{u.university_id}', Role: {u.role}")
