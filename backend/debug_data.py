from app import create_app
from app.extensions import db
from app.models import Student, Election, Candidate, CandidateApplication

app = create_app()

with app.app_context():
    print("=== ELECTIONS ===")
    elections = Election.query.all()
    for e in elections:
        print(f"ID: {e.election_id}, Type: {e.election_type}, Course: '{e.course}', Sem: '{e.semester}', Status: {e.status}")

    print("\n=== STUDENTS (Zaki) ===")
    students = Student.query.filter(Student.name.ilike("%zaki%")).all()
    for s in students:
        print(f"ID: {s.student_id}, Name: {s.name}, Course: '{s.course}', Sem: '{s.semester}'")

    print("\n=== APPLICATIONS (Zaki) ===")
    if students:
        apps = CandidateApplication.query.filter_by(student_id=students[0].student_id).all()
        for a in apps:
             print(f"AppID: {a.id}, Post: {a.post}, Status: {a.status}")

    print("\n=== CANDIDATES ===")
    cands = Candidate.query.all()
    for c in cands:
        print(f"CandID: {c.candidate_id}, StudentID: {c.student_id}, ElectionID: {c.election_id}")
