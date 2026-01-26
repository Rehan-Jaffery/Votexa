import urllib.request
import json
import traceback

BASE_URL = "http://127.0.0.1:5000"

def verify():
    print("Logging in as Admin...")
    # Admin created in create_admin.py has password 'admin123' usually
    # Try admin123
    try:
        data = json.dumps({"university_id": "ADMIN001", "password": "admin123"}).encode('utf-8')
        req = urllib.request.Request(f"{BASE_URL}/auth/login", data=data, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req) as response:
            res_json = json.loads(response.read().decode())
            token = res_json.get("access_token")
            print("Login Successful.")
    except Exception as e:
        print("Login Failed with ADMIN001/admin123. Trying admin/admin...")
        # Try fallback
        try:
             data = json.dumps({"university_id": "admin", "password": "admin"}).encode('utf-8')
             req = urllib.request.Request(f"{BASE_URL}/auth/login", data=data, headers={'Content-Type': 'application/json'})
             with urllib.request.urlopen(req) as response:
                 res_json = json.loads(response.read().decode())
                 token = res_json.get("access_token")
        except:
            print("All Login attempts failed.")
            return

    print("Fetching Candidates for Election 9...")
    try:
        req = urllib.request.Request(f"{BASE_URL}/elections/9/candidates", headers={'Authorization': f'Bearer {token}'})
        with urllib.request.urlopen(req) as response:
            content = response.read().decode()
            print(f"Response: {content}")
            items = json.loads(content)
            print(f"Count: {len(items)}")
    except Exception as e:
        print("Fetch Failed")
        traceback.print_exc()

if __name__ == "__main__":
    verify()
