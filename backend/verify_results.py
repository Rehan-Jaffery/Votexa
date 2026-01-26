import urllib.request
import json
import traceback

BASE_URL = "http://127.0.0.1:5000"

def verify():
    print("Logging in as Admin...")
    try:
        data = json.dumps({"university_id": "ADMIN001", "password": "admin123"}).encode('utf-8')
        req = urllib.request.Request(f"{BASE_URL}/api/auth/login", data=data, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req) as response:
            res_json = json.loads(response.read().decode())
            token = res_json.get("access_token")
            print("Login Successful.")
    except Exception as e:
        print(f"Login Failed: {e}")
        return

    print("Fetching /api/results/completed ...")
    try:
        req = urllib.request.Request(f"{BASE_URL}/api/results/completed", headers={'Authorization': f'Bearer {token}'})
        with urllib.request.urlopen(req) as response:
            content = response.read().decode()
            items = json.loads(content)
            print(f"Total Items: {len(items)}")
            for item in items:
                print(f"ID: {item.get('election_id')}, Title: {item.get('title')}, Status: '{item.get('status')}'")
    except Exception as e:
        print("Fetch Failed")
        traceback.print_exc()

if __name__ == "__main__":
    verify()
