import requests
import json
import sys
import time

BASE_URL = "http://127.0.0.1:8000/api/v1"
AUTH_URL = "http://127.0.0.1:8000/api/v1/auth"

# Global token
ACCESS_TOKEN = ""

def log(msg, data=None):
    print(f"[TEST] {msg}")
    with open("test_features_results.txt", "a") as f:
        f.write(f"[TEST] {msg}\n")
        if data:
            f.write(json.dumps(data, indent=2) + "\n")

def login(email, password):
    global ACCESS_TOKEN
    payload = {"username": email, "password": password}
    try:
        response = requests.post(f"{AUTH_URL}/login", data=payload)
        if response.status_code == 200:
            ACCESS_TOKEN = response.json()["access_token"]
            log("Login SUCCESS")
            return True
        else:
            log(f"Login FAILED: {response.status_code}", response.text)
            return False
    except Exception as e:
        log(f"Login EXCEPTION: {e}")
        return False

def test_optimize_caption():
    headers = {"Authorization": f"Bearer {ACCESS_TOKEN}", "Content-Type": "application/json"}
    payload = {
        "caption": "Check out our new AI product!",
        "tone": "exciting",
        "target_audience": "tech enthusiasts"
    }
    log("Testing Content Optimization...")
    try:
        response = requests.post(f"{BASE_URL}/posts/optimize/caption", json=payload, headers=headers)
        if response.status_code == 200:
            log("Optimize Caption SUCCESS", response.json())
            return True
        else:
            log(f"Optimize Caption FAILED: {response.status_code}", response.text)
            return False
    except Exception as e:
        log(f"Optimize Caption EXCEPTION: {e}")
        return False

def test_create_and_schedule_post():
    headers = {"Authorization": f"Bearer {ACCESS_TOKEN}", "Content-Type": "application/json"}
    
    # 1. Create Post
    post_payload = {
        "content": "This is a test post for automation.",
        "platform": "twitter",
        "status": "draft"
    }
    log("Creating Post...")
    post_id = None
    try:
        response = requests.post(f"{BASE_URL}/posts/posts", json=post_payload, headers=headers)
        if response.status_code == 200:
            post_data = response.json()
            post_id = post_data["id"]
            log("Create Post SUCCESS", post_data)
        else:
            log(f"Create Post FAILED: {response.status_code}", response.text)
            return False
    except Exception as e:
        log(f"Create Post EXCEPTION: {e}")
        return False

    if not post_id:
        return False

    # 2. Schedule Post
    log(f"Scheduling Post {post_id}...")
    try:
        # Note: scheduling endpoint might require query params or body depending on implementation
        # Based on inspection, it's a POST to /posts/{id}/schedule
        response = requests.post(f"{BASE_URL}/posts/posts/{post_id}/schedule", headers=headers)
        if response.status_code == 200:
            log("Schedule Post SUCCESS", response.json())
            return True
        else:
            log(f"Schedule Post FAILED: {response.status_code}", response.text)
            return False
    except Exception as e:
        log(f"Schedule Post EXCEPTION: {e}")
        return False

def test_analytics_export():
    headers = {"Authorization": f"Bearer {ACCESS_TOKEN}"}
    log("Testing Analytics Export...")
    try:
        response = requests.get(f"{BASE_URL}/analytics/export/csv", headers=headers)
        if response.status_code == 200:
            log("Analytics Export SUCCESS (CSV received)")
            return True
        else:
            log(f"Analytics Export FAILED: {response.status_code}", response.text)
            return False
    except Exception as e:
        log(f"Analytics Export EXCEPTION: {e}")
        return False

if __name__ == "__main__":
    # Clear previous log
    with open("test_features_results.txt", "w") as f:
        f.write("Starting Feature Tests...\n")
        
    test_email = "testuser@example.com"
    test_pass = "SecurePass123!"

    if login(test_email, test_pass):
        test_optimize_caption()
        test_create_and_schedule_post()
        test_analytics_export()
    else:
        log("Skipping feature tests due to login failure.")
