import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api/v1/auth"
HEADERS = {"Content-Type": "application/json"}

def log(msg, data=None):
    print(f"[TEST] {msg}")
    with open("test_auth_results.txt", "a") as f:
        f.write(f"[TEST] {msg}\n")
        if data:
            f.write(json.dumps(data, indent=2) + "\n")

def test_register(email, password):
    log(f"Registering user: {email}")
    payload = {
        "email": email,
        "password": password,
        "full_name": "Test User",
        "avatar_url": "",
        "google_id": ""
    }
    try:
        response = requests.post(f"{BASE_URL}/register", json=payload, headers=HEADERS)
        if response.status_code == 200:
            log("Registration SUCCESS", response.json())
            return True
        elif response.status_code == 400 and "already exists" in response.text:
            log("User already exists (Expected if re-running)", response.json())
            return True
        else:
            log(f"Registration FAILED: {response.status_code}", response.text)
            return False
    except Exception as e:
        log(f"Registration EXCEPTION: {e}")
        return False

def test_login(email, password):
    log(f"Logging in user: {email}")
    payload = {
        "username": email,
        "password": password
    }
    # Login endpoint uses OAuth2PasswordRequestForm, so it expects form data, not JSON
    try:
        response = requests.post(f"{BASE_URL}/login", data=payload)
        if response.status_code == 200:
            log("Login SUCCESS", response.json())
            return True
        else:
            log(f"Login FAILED: {response.status_code}", response.text)
            return False
    except Exception as e:
        log(f"Login EXCEPTION: {e}")
        return False

if __name__ == "__main__":
    test_email = "testuser@example.com"
    test_pass = "SecurePass123!"
    
    # 1. Register
    if not test_register(test_email, test_pass):
        sys.exit(1)
        
    # 2. Login
    if not test_login(test_email, test_pass):
        sys.exit(1)
    
    log("ALL TESTS PASSED")
