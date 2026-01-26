import urllib.request
import json
import traceback

BASE_URL = "http://127.0.0.1:5000"

def verify():
    print("Listing All Elections (NO AUTH)...")
    try:
        # Check Test Route
        print("Checking Test Route...")
        try:
             req = urllib.request.Request(f"{BASE_URL}/api/elections/test")
             with urllib.request.urlopen(req) as response:
                 print(f"Test Route: {response.read().decode()}")
        except Exception as e:
             print(f"Test Route Failed: {e}")

        ids = [7, 8, 9, 10]
        for i in ids:
            print(f"Checking ID {i}...")
            try:
                req = urllib.request.Request(f"{BASE_URL}/api/elections/{i}/candidates")
                with urllib.request.urlopen(req) as response:
                    print(f"ID {i} Found: {response.read().decode()}")
            except urllib.error.HTTPError as e:
                print(f"ID {i} Failed: {e.code}")
    except Exception as e:
        print("Fetch Failed")
        traceback.print_exc()

if __name__ == "__main__":
    verify()
