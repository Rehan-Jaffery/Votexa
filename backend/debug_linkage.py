from app import create_app
from app.extensions import db
from app.models import Student, Election, Candidate, CandidateApplication
from sqlalchemy import func

app = create_app()

with app.app_context():
    print("=== DEBUG LINKAGE ===")
    
    # 1. Get the Student
    student = Student.query.filter(Student.name.ilike("%zaki%")).first()
    if not student:
        print("Student 'zaki' not found!")
    else:
        print(f"Student: {student.name}, Course: '{student.course}', Sem: '{student.semester}'")

    # 2. Get the Election #9
    election = Election.query.get(9)
    if not election:
        print("Election #9 not found! Listing all:")
        for e in Election.query.all():
             print(f"ID: {e.election_id}, Course: '{e.course}', Sem: '{e.semester}'")
    else:
        print(f"Election #9: Course: '{election.course}', Sem: '{election.semester}'")
        
        # 3. Test Match Logic
        print(f"Match Check:")
        print(f"Courses: '{student.course.lower()}' == '{election.course.lower()}' ? {student.course.lower() == election.course.lower()}")
        print(f"Semesters: '{student.semester}' == '{election.semester}' ? {student.semester == election.semester}")
        
    # 4. Check Candidates
    cands = Candidate.query.all()
    print(f"Total Candidates: {len(cands)}")
    for c in cands:
        print(f"Candidate: Student {c.student_id} -> Election {c.election_id}")
