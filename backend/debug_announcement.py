import requests
from app import create_app
from app.extensions import db
from app.models import Student
import sys

# 1. Setup Debug User
app = create_app()

with app.app_context():
    # Ensure we have a VP user
    user = Student.query.filter_by(university_id="DEBUG_VP").first()
    if not user:
        user = Student(
            university_id="DEBUG_VP",
            name="Debug VP",
            course="B.Tech",
            batch="2024",
            semester="5",
            role="vice_president",
            password_hash="hashed_dummy",
            email="vp@debug.com"
        )
        user.password_hash = "password123" # In real app we hash it, but here we just need DB entry
        # Wait, we need to login via API, so we need a known password. 
        # Actually, let's just use "create_access_token" manually if we can, 
        # OR just insert a user with known password using the auth logic?
        # Let's use the app's hash function if available, or just mocking the login is hard without hashing.
        # EASIER: Register a new user via API?
        pass

# WE WILL USE API CLIENT SIMULATION within Flask Context to avoid auth complexity if possible, 
# OR just hit the running server if we knew a valid credential.
# Let's hit the running server. I'll create a user "debugvp" / "password" via direct DB injection (properly hashed) then login.

from werkzeug.security import generate_password_hash
with app.app_context():
    user = Student.query.filter_by(university_id="DEBUG_VP").first()
    if user:
        db.session.delete(user)
        db.session.commit()
    
    user = Student(
        university_id="DEBUG_VP",
        name="Debug VP",
        course="CSE",
        batch="2025",
        semester="5",
        role="vice_president",
        password_hash=generate_password_hash("password"),
        email="vp@debug.com"
    )
    db.session.add(user)
    db.session.commit()
    print("Created debug user: DEBUG_VP / password")

# 2. Login
BASE_URL = "http://127.0.0.1:5000/api"
session = requests.Session()

print("Logging in...")
resp = session.post(f"{BASE_URL}/auth/login", json={
    "university_id": "DEBUG_VP",
    "password": "password"
})

if resp.status_code != 200:
    print(f"Login Failed: {resp.text}")
    sys.exit(1)

token = resp.json()['access_token']
headers = {"Authorization": f"Bearer {token}"}

# 3. Try to Post Announcement
print("Posting Announcement...")
payload = {
    "title": "Debug Update",
    "content": "Testing backend logic",
    "audience_scope": "GOV_INTERNAL",
    "priority": "URGENT"
}

resp = session.post(f"{BASE_URL}/announcements/", json=payload, headers=headers)
print(f"Status: {resp.status_code}")
print(f"Response: {resp.text}")
