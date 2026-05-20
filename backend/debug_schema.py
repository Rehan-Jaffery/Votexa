from app import create_app
from app.extensions import db
from sqlalchemy import inspect

app = create_app()

with app.app_context():
    inspector = inspect(db.engine)
    
    print("--- Table: students ---")
    columns = [col['name'] for col in inspector.get_columns('students')]
    print(columns)
    if 'semester' in columns:
        print("[YES] 'semester' column exists in students.")
    else:
        print("[NO] 'semester' column MISSING in students.")

    print("\n--- Table: elections ---")
    columns = [col['name'] for col in inspector.get_columns('elections')]
    print(columns)
    if 'semester' in columns:
        print("[YES] 'semester' column exists in elections.")
    else:
        print("[NO] 'semester' column MISSING in elections.")

    print("\n--- Table: announcements ---")
    if inspector.has_table("announcements"):
        print("[YES] 'announcements' table exists.")
        columns = [col['name'] for col in inspector.get_columns('announcements')]
        print(columns)
    else:
        print("[NO] 'announcements' table MISSING.")

