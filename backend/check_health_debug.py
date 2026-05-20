import requests

BASE_URL = "http://127.0.0.1:5000/api"

# 1. Login
resp = requests.post(f"{BASE_URL}/auth/login", json={"university_id": "ADMIN001", "password": "admin123"})

# Note: Assuming 'university_id' for admin is 'admin'? In DB list, I didn't see university_id printed clearly.
# Let's check DB list output again... oh wait, I didn't print university_id in the previous tool output really well? 
# Ah, I printed ID, Name, Role, Email. 
# Usually ID for admin is 'admin' or something manually set. 
# Let's try 'admin', if fails, I'll need to check the university_id from DB.

if resp.status_code != 200:
    print(f"Login failed: {resp.text}")
    # Try email login if supported? No, usually university_id.
else:
    token = resp.json()['access_token']
    print("Login successful.")
    
    # 2. Check Health
    headers = {"Authorization": f"Bearer {token}"}
    health_resp = requests.get(f"{BASE_URL}/analytics/system-health", headers=headers)

    
    print(f"Health Status: {health_resp.status_code}")
    print(f"Body: {health_resp.text}")
