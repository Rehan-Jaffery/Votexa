import requests

BASE_URL = "http://127.0.0.1:5000"

def test_candidates():
    # 1. Login as Admin
    # Assuming standard admin credentials from create_admin.py or previous context
    # Usually admin/admin123 or similar. 
    # Let's try to find admin credentials or create a clean one?
    # I'll try the usual defaults.
    
    session = requests.Session()
    
    # Login
    print("Logging in...")
    # Note: password might be "admin123" or hashed.
    # If I can't login, I can't test.
    # I'll assume the user hasn't changed it from default 'admin123' if that was set.
    # Actually, create_admin.py uses 'admin123'.
    
    login_payload = {"university_id": "admin", "password": "admin"} # Try these?
    res = session.post(f"{BASE_URL}/auth/login", json=login_payload)
    
    if res.status_code != 200:
        print(f"Login failed: {res.text}")
        # Try 'admin123'
        login_payload["password"] = "admin123"
        res = session.post(f"{BASE_URL}/auth/login", json=login_payload)
    
    if res.status_code != 200:
        print(f"Login failed 2: {res.text}")
        return

    token = res.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    print("Fetching Candidates for Election 6...")
    res = session.get(f"{BASE_URL}/elections/6/candidates", headers=headers)
    print(f"Status: {res.status_code}")
    print(f"Response: {res.text}")

if __name__ == "__main__":
    test_candidates()
