#!/usr/bin/env python3
"""
Test script to verify API endpoints are working
"""
import requests
import json

def test_api():
    base_url = "http://127.0.0.1:8004"
    
    print("Testing MedCare API...")
    print("=" * 50)
    
    # Test 1: Health check
    print("1. Testing health check...")
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"   Error: {e}")
    
    print()
    
    # Test 2: Get doctors
    print("2. Testing get doctors...")
    try:
        response = requests.get(f"{base_url}/doctors", timeout=5)
        print(f"   Status: {response.status_code}")
        data = response.json()
        print(f"   Found {len(data.get('doctors', []))} doctors")
    except Exception as e:
        print(f"   Error: {e}")
    
    print()
    
    # Test 3: User signup
    print("3. Testing user signup...")
    try:
        signup_data = {
            "username": "testuser123",
            "password": "password123"
        }
        response = requests.post(f"{base_url}/signup", json=signup_data, timeout=5)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"   Error: {e}")
    
    print()
    
    # Test 4: User login
    print("4. Testing user login...")
    try:
        login_data = {
            "username": "testuser123",
            "password": "password123"
        }
        response = requests.post(f"{base_url}/login", json=login_data, timeout=5)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"   Error: {e}")
    
    print()
    
    # Test 5: Get medicines
    print("5. Testing get medicines...")
    try:
        response = requests.get(f"{base_url}/medicines", timeout=5)
        print(f"   Status: {response.status_code}")
        data = response.json()
        print(f"   Found {len(data.get('medicines', []))} medicines")
    except Exception as e:
        print(f"   Error: {e}")
    
    print()
    print("API testing completed!")

if __name__ == "__main__":
    test_api()
