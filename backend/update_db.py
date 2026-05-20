from app import create_app
from app.extensions import db

app = create_app()

with app.app_context():
    print("Updating database schema (creating missing tables)...")
    db.create_all()
    print("Database update complete.")
