from app import create_app
from app.models import Student

app = create_app()

with app.app_context():
    admin = Student.query.filter_by(role='admin').first()
    if admin:
        print(f"Admin Found. Name: {admin.name}")
        print(f"University ID: {admin.university_id}")
        print(f"Email: {admin.email}")
    else:
        print("Admin NOT found.")
