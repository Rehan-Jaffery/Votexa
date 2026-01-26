from app import create_app
from app.extensions import db
from app.models import Student

app = create_app()

with app.app_context():
    # Fix 1: "msc" -> "msc aiml"
    students_to_fix = Student.query.filter(Student.course.ilike("msc")).all()
    count = 0
    for s in students_to_fix:
        # Double check it's exactly "msc" (case insensitive) and not already "msc aiml"
        if s.course.lower().strip() == "msc":
            s.course = "msc aiml"
            count += 1
    
    db.session.commit()
    print(f"Updated {count} students from 'msc' to 'msc aiml'.")
