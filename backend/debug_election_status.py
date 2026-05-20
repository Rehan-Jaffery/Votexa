from app import create_app
from app.models import Election
from datetime import datetime

app = create_app()

with app.app_context():
    evals = [17, 18, 19] # From screenshot IDs
    for eid in evals:
        e = Election.query.get(eid)
        if e:
            print(f"ID: {e.election_id}")
            print(f"Title: {e.post} / {e.course}")
            print(f"Status: '{e.status}'") # Quote to see spaces
            print(f"End Date: {e.end_date}")
            print(f"UTC Now: {datetime.utcnow()}")
            print(f"Now: {datetime.now()}")
            print("-" * 20)
        else:
            print(f"ID {eid} not found")
