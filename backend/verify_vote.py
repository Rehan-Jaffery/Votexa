import urllib.request
import json
import traceback

BASE_URL = "http://127.0.0.1:5000"

def verify():
    # 1. Login as Student (zakitest)
    print("Logging in as Student (zakitest)...")
    try:
        # Assuming zakitest / password123 (created earlier? Or default password?)
        # If created manually via UI, I don't know the password if hashed.
        # But I can use create_admin.py style to reset a student password if needed.
        # Let's try password123.
        # Wait, I don't know the student ID used in the screenshot. "24mca11".
        # Password might be "password" or whatever was set.
        # I'll TRY standard ones. If fail, I will reset it in DB.
        
        data = json.dumps({"university_id": "24mca11", "password": "password123"}).encode('utf-8')
        req = urllib.request.Request(f"{BASE_URL}/api/auth/login", data=data, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req) as response:
            res_json = json.loads(response.read().decode())
            token = res_json.get("access_token")
            print("Login Successful.")
    except Exception as e:
        print(f"Login Failed: {e}")
        # If login fails, I can't test voting properly without resetting password.
        return

    # 2. Cast Vote
    print("Casting Vote...")
    try:
        # Election ID 9 (from previous steps), Candidate ID 6 (zakitest candidate id from previous step output)
        payload = {
            "election_id": 9,
            "candidate_id": 6
        }
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(f"{BASE_URL}/api/votes/vote", data=data, headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        })
        with urllib.request.urlopen(req) as response:
            print(f"Vote Response: {response.read().decode()}")
    except urllib.error.HTTPError as e:
        print(f"Vote Failed: {e.code} - {e.read().decode()}")
    except Exception as e:
        print(f"Vote Error: {e}")

if __name__ == "__main__":
    verify()
