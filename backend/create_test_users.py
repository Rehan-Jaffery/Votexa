import sys
from app import create_app
from app.extensions import db
from app.models import Student
from werkzeug.security import generate_password_hash

def create_test_users():
    app = create_app()
    with app.app_context():
        test_users = [
            {
                "email": "testuser1@gmail.com",
                "password": "test1@123",
                "university_id": "TEST001",
                "name": "Test User 1",
                "course": "BCA",
                "batch": "2024",
                "semester": "1"
            },
            {
                "email": "testuser2@gmail.com",
                "password": "test2@123",
                "university_id": "TEST002",
                "name": "Test User 2",
                "course": "BCA",
                "batch": "2024",
                "semester": "1"
            },
            {
                "email": "testuser3@gmail.com",
                "password": "test3@123",
                "university_id": "TEST003",
                "name": "Test User 3",
                "course": "MCA",
                "batch": "2024",
                "semester": "1"
            },
            {
                "email": "testuser4@gmail.com",
                "password": "test4@123",
                "university_id": "TEST004",
                "name": "Test User 4",
                "course": "MCA",
                "batch": "2024",
                "semester": "1"
            }
        ]

        for user_data in test_users:
            # Check if user already exists
            existing_user = Student.query.filter_by(email=user_data["email"]).first()
            if existing_user:
                print(f"User {user_data['email']} already exists. Updating password...")
                existing_user.password_hash = generate_password_hash(user_data["password"])
                # Ensure they are marked as not having changed their password yet, if that's the flow
                existing_user.is_password_changed = True # Or False depending on if they must change it on first login. Let's say True so they can just use it.
            else:
                new_user = Student(
                    university_id=user_data["university_id"],
                    name=user_data["name"],
                    course=user_data["course"],
                    batch=user_data["batch"],
                    semester=user_data["semester"],
                    email=user_data["email"],
                    password_hash=generate_password_hash(user_data["password"]),
                    role="student",
                    is_password_changed=True # True means they don't have to change it immediately
                )
                db.session.add(new_user)
                print(f"Created user: {user_data['email']}")

        db.session.commit()
        print("All test users processed successfully.")

if __name__ == "__main__":
    create_test_users()
