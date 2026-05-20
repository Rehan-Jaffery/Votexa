import sys
from app import create_app
from app.extensions import db
from app.models import Student
from werkzeug.security import generate_password_hash

def update_all_passwords():
    app = create_app()
    with app.app_context():
        users = Student.query.all()
        new_password_hash = generate_password_hash("test123")
        
        count = 0
        for user in users:
            user.password_hash = new_password_hash
            # Optionally, we might want to set is_password_changed = False so they have to change it,
            # or True so they can just use test123. The user wants to test with test123, so we'll leave it as is or set True.
            user.is_password_changed = True
            count += 1
            
        db.session.commit()
        print(f"Successfully updated passwords for {count} users to 'test123'.")

if __name__ == "__main__":
    update_all_passwords()
