from app import create_app
from app.models import Student

app = create_app()

with app.app_context():
    # Try to find aimltest (assuming username or university_id is aimltest?)
    # The screenshot shows "aimltest" as the NAME? or ID?
    # Usually logged in name is shown.
    # Let's search by name or university_id
    users = Student.query.filter(
        (Student.name.like('%aimltest%')) | (Student.university_id.like('%aimltest%'))
    ).all()
    
    print(f"Found {len(users)} users.")
    for u in users:
        print(f"ID: {u.student_id}")
        print(f"UID: {u.university_id}")
        print(f"Name: {u.name}")
        print(f"Role: {u.role}")
        print(f"Course: {u.course}")
        print(f"Batch: {u.batch}")
        print(f"Semester: {u.semester}")
        print("-" * 20)
