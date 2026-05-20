from app import create_app
from app.extensions import db
from app.models import Student, CandidateApplication, Candidate, Vote, Announcement
from sqlalchemy import func

app = create_app()

with app.app_context():
    # Keep admins and the specific university_id (case-insensitive)
    students_to_keep = Student.query.filter(
        (Student.role == 'admin') | 
        (func.lower(Student.university_id) == '24ma11')
    ).all()
    
    keep_ids = [s.student_id for s in students_to_keep]
    print(f"Keeping {len(keep_ids)} students/admins.")

    # Identify what to delete
    students_to_delete = Student.query.filter(~Student.student_id.in_(keep_ids)).all()
    delete_ids = [s.student_id for s in students_to_delete]

    if not delete_ids:
        print("No users to delete.")
    else:
        # 1. Delete associated Votes (where they are voter)
        Vote.query.filter(Vote.voter_id.in_(delete_ids)).delete(synchronize_session=False)

        # 2. Delete Candidates and Votes linked to those Candidates
        cands_to_delete = Candidate.query.filter(Candidate.student_id.in_(delete_ids)).all()
        cand_ids = [c.candidate_id for c in cands_to_delete]
        if cand_ids:
            Vote.query.filter(Vote.candidate_id.in_(cand_ids)).delete(synchronize_session=False)
            Candidate.query.filter(Candidate.candidate_id.in_(cand_ids)).delete(synchronize_session=False)

        # 3. Delete Candidate Applications
        CandidateApplication.query.filter(CandidateApplication.student_id.in_(delete_ids)).delete(synchronize_session=False)

        # 4. Delete Announcements they posted
        Announcement.query.filter(Announcement.sender_id.in_(delete_ids)).delete(synchronize_session=False)

        # 5. Delete Students
        deleted_count = Student.query.filter(Student.student_id.in_(delete_ids)).delete(synchronize_session=False)

        db.session.commit()
        print(f"Deleted {deleted_count} students successfully (and all their associated votes/applications/notices).")
