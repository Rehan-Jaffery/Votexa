from app import create_app
from app.extensions import db
from app.models import Election

app = create_app()

with app.app_context():
    # Delete elections created in the last few minutes or by specific title/post if possible.
    # Since I just created it, it has ID 20 (from previous output).
    # I'll just delete ID 20.
    
    e = Election.query.get(20)
    if e:
        db.session.delete(e)
        db.session.commit()
        print(f"[SUCCESS] Deleted Dummy Election ID: 20")
    else:
        print("[WARNING] Election ID 20 not found.")
