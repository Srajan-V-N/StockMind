import requests
import sys

ports = [3000, 3001, 3002, 3003]

print("Testing Next.js Search API...")

for port in ports:
    url = f"http://localhost:{port}/api/stocks/search?q=ama"
    print(f"\nTesting port {port}...")
    try:
        response = requests.get(url, timeout=2)
        print(f"Status: {response.status_code}")
        print(f"Body: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
