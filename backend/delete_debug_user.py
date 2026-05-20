from app import create_app
from app.extensions import db
from app.models import Student

app = create_app()

with app.app_context():
    user = Student.query.filter_by(university_id="DEBUG_VP").first()
    if user:
        # Delete related announcements first
        from app.models import Announcement
        Announcement.query.filter_by(sender_id=user.student_id).delete()
        print("[DONE] Deleted related announcements.")
        
        db.session.delete(user)
        db.session.commit()
        print("[DONE] Debug user 'DEBUG_VP' deleted successfully.")
    else:
        print("[INFO] Debug user 'DEBUG_VP' not found.")


