from extensions import db
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
    role = db.Column(
        db.Enum("student", "cr", "admin"),
        default="student",
        nullable=False
    )


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
