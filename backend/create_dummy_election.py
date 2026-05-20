from app import create_app
from app.extensions import db
from app.models import Election
from datetime import datetime, timedelta

app = create_app()

with app.app_context():
    # Create Dummy Council Election
    dummy = Election(
        election_type="COUNCIL",
        post="Vice President", 
        course="N/A", # Assuming required or nullable?
        semester="N/A",
        batch="2024",
        start_date=datetime.utcnow() - timedelta(days=1),
        end_date=datetime.utcnow() + timedelta(days=1),
        status="ONGOING"
    )

    db.session.add(dummy)
    db.session.commit()
    print(f"[SUCCESS] Created Dummy Election ID: {dummy.election_id}")
