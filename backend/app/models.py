from .extensions import db
from datetime import datetime


# =========================
# STUDENT
# =========================
class Student(db.Model):
    __tablename__ = "students"

    student_id = db.Column(db.Integer, primary_key=True)
    university_id = db.Column(db.String(20), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    course = db.Column(db.String(50), nullable=False)
    batch = db.Column(db.String(10), nullable=False)
    semester = db.Column(db.String(10), nullable=False, default="1") # Added Semester
    role = db.Column(
        db.Enum("student", "cr", "admin", "president", "vice_president", "secretary", "joint_secretary"),
        default="student",
        nullable=False
    )
    email = db.Column(db.String(120), unique=True, nullable=True)
    is_password_changed = db.Column(db.Boolean, default=False)
    password_hash = db.Column(db.String(256), nullable=False)

# =========================
# CANDIDATE APPLICATION
# =========================
class CandidateApplication(db.Model):
    __tablename__ = "applications"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.student_id"), nullable=False)
    
    post = db.Column(db.String(50), nullable=False) # CR, Vice President, etc.
    manifesto = db.Column(db.Text, nullable=False)
    reason = db.Column(db.Text, nullable=False)
    
    gpa = db.Column(db.String(10), nullable=True) # Allow "NA"
    achievements = db.Column(db.Text, nullable=True)
    additional_details = db.Column(db.JSON, nullable=True) # For Agenda, Vision, Experience, etc.
    
    status = db.Column(
        db.Enum("PENDING", "APPROVED", "REJECTED"),
        default="PENDING"
    )

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship to access student details easily
    student = db.relationship("Student", backref="applications")


# =========================
# ELECTION
# =========================
class Election(db.Model):
    __tablename__ = "elections"

    election_id = db.Column(db.Integer, primary_key=True)
    election_type = db.Column(
        db.Enum("CR", "COUNCIL"),
        nullable=False
    )
    course = db.Column(db.String(50))
    batch = db.Column(db.String(10))
    semester = db.Column(db.String(10)) # Added Semester
    post = db.Column(
        db.Enum("Vice President", "Secretary", "Joint Secretary")
    )
    start_date = db.Column(db.DateTime)
    end_date = db.Column(db.DateTime)
    status = db.Column(
        db.Enum("UPCOMING", "ONGOING", "COMPLETED"),
        default="UPCOMING"
    )


# =========================
# CANDIDATE  (MISSING EARLIER)
# =========================
class Candidate(db.Model):
    __tablename__ = "candidates"

    candidate_id = db.Column(db.Integer, primary_key=True)

    student_id = db.Column(
        db.Integer,
        db.ForeignKey("students.student_id"),
        nullable=False
    )

    election_id = db.Column(
        db.Integer,
        db.ForeignKey("elections.election_id"),
        nullable=False
    )

    student = db.relationship("Student", backref="candidates")
    election = db.relationship("Election", backref="candidates")


# =========================
# VOTE
# =========================
class Vote(db.Model):
    __tablename__ = "votes"

    vote_id = db.Column(db.Integer, primary_key=True)

    # student who voted
    voter_id = db.Column(
        db.Integer,
        db.ForeignKey("students.student_id"),
        nullable=False
    )

    # candidate who received vote
    candidate_id = db.Column(
        db.Integer,
        db.ForeignKey("candidates.candidate_id"),
        nullable=False
    )

    election_id = db.Column(
        db.Integer,
        db.ForeignKey("elections.election_id"),
        nullable=False
    )

    vote_time = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )
