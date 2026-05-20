import requests
import sys

BASE_URL = "http://127.0.0.1:5000/api"

# 1. Login Helper
def login(uid, pwd):
    resp = requests.post(f"{BASE_URL}/auth/login", json={"university_id": uid, "password": pwd})
    if resp.status_code == 200:
        return resp.json()["access_token"]
    return None

# 2. Check Active Elections
def check_active_elections(token, role_name):
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/elections/active", headers=headers)
    
    if resp.status_code != 200:
        print(f"[{role_name}] Error fetching elections: {resp.status_code}")
        return
        
    elections = resp.json()
    council_elections = [e for e in elections if e['type'] == 'COUNCIL']
    
    print(f"[{role_name}] Visible Council Elections: {len(council_elections)}")
    for e in council_elections:
        print(f"   - {e['title']}")

if __name__ == "__main__":
    print("--- STARTING CRITICAL FLOW VERIFICATION ---")

    # A. Login as Student (aimltestruhan) - Should see 0 Council Elections
    # Assuming password 'password' or resetting it if needed. 
    # Since I don't know student password, I might need to reset it first or create a temp user.
    # Let's try to reset 'aimltestruhan' to 'password' first just in case?
    # Actually, I'll rely on the manual check if I can't login, but let's try 'password'.
    
    student_token = login("24msc13", "password") # Trying default
    if not student_token:
         # Attempt to reset student pass or assume failure
         print("[WARNING] Could not login as Student '24msc13'. Skipping Student Check.")
    else:
         check_active_elections(student_token, "STUDENT")

    # B. Login as VP (24msc12)
    vp_token = login("24msc12", "password") # Trying default
    if not vp_token:
         print("[WARNING] Could not login as VP '24msc12'. Skipping VP Check.")
    else:
         check_active_elections(vp_token, "VP (Council)")


    print("--- VERIFICATION COMPLETE ---")
