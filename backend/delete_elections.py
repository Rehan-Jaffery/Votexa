from app import create_app
from app.extensions import db
from app.models import Election

app = create_app()

with app.app_context():
    deleted_count = Election.query.delete(synchronize_session=False)
    db.session.commit()
    print(f"SUCCESS: Deleted {deleted_count} elections successfully.")
