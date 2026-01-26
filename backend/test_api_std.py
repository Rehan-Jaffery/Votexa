import urllib.request
import json
import traceback

BASE_URL = "http://127.0.0.1:5000"

def test():
    token = None
    # Login
    print("Attempting Login...")
    passwords = ["admin", "admin123"]
    
    for p in passwords:
        try:
            data = json.dumps({"university_id": "admin", "password": p}).encode('utf-8')
            req = urllib.request.Request(f"{BASE_URL}/auth/login", data=data, headers={'Content-Type': 'application/json'})
            with urllib.request.urlopen(req) as response:
                res_json = json.loads(response.read().decode())
                token = res_json.get("access_token")
                print(f"Login Successful with {p}")
                break
        except Exception:
            pass
            
    if not token:
        print("Login Failed completely")
        return

    # Fetch Candidates for ID 6
    print("Fetching Candidates for ID 6...")
    try:
        req = urllib.request.Request(f"{BASE_URL}/elections/6/candidates", headers={'Authorization': f'Bearer {token}'})
        with urllib.request.urlopen(req) as response:
            print(f"Candidates Response: {response.read().decode()}")
    except Exception as e:
        print("Fetch Failed")
        traceback.print_exc()

if __name__ == "__main__":
    test()
