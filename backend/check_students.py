from app import create_app
from app.models import Student

app = create_app()
with app.app_context():
    students = Student.query.all()
    print(f"Total Students: {len(students)}")
    for s in students:
        print(f"ID: {s.student_id}, UID: {s.university_id}, Name: {s.name}, Role: {s.role}")
