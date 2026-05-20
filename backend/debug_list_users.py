from app import create_app
from app.models import Student

app = create_app()

with app.app_context():
    users = Student.query.all()
    print(f"Total Users: {len(users)}")
    print(f"{'ID':<5} {'UnivID':<15} {'Name':<20} {'Role':<15} {'Email':<30}")
    print("-" * 85)
    for u in users:
        print(f"{u.student_id:<5} {u.university_id:<15} {u.name:<20} {u.role:<15} {u.email if u.email else 'N/A':<30}")

