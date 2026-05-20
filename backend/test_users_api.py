import requests

BASE_URL = "http://localhost:5000/api"

def test_users_list():
    # 1. Login
    print("Logging in...")
    try:
        login_res = requests.post(f"{BASE_URL}/auth/login", json={
            "university_id": "ADMIN001",
            "password": "admin"
        })
        if login_res.status_code != 200:
            print(f"Login Failed: {login_res.status_code} {login_res.text}")
            # Try Super Admin ID 1 might have different university_id?
            # check_students output: ID: 1, Name: Super Admin, Role: admin.
            # Usually admin login is university_id='admin' or similar. 
            # I will assume 'admin'/'admin' default credentials or verify.
            return
            
        token = login_res.json()['access_token']
        print("Login Successful. Token received.")
        
        # 2. List Users
        print("Fetching Users...")
        headers = {"Authorization": f"Bearer {token}"}
        res = requests.get(f"{BASE_URL}/users/", headers=headers)
        
        if res.status_code == 200:
            users = res.json()
            print(f"Success! Users Found: {len(users)}")
            print(users)
        else:
            print(f"Fetch Failed: {res.status_code} {res.text}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_users_list()
