import urllib.request
import json

BASE_URL = "http://127.0.0.1:8000/api"

def make_request(url, method="GET", data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    body = json.dumps(data).encode('utf-8') if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode('utf-8')
            return json.loads(res_body), response.status
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        return json.loads(error_body) if error_body else {}, e.code

def run_tests():
    print("==========================================")
    print("     NEOBANK PYTHON BACKEND TEST SUITE    ")
    print("==========================================")
    
    # 1. Customer Login
    print("\n[1] Testing Customer Login (alice@example.com)...")
    res, status = make_request(f"{BASE_URL}/auth/login", method="POST", data={
        "email": "alice@example.com",
        "password": "Password123!"
    })
    assert status == 200, f"Customer login failed: {res}"
    customer_token = res["accessToken"]
    print(f"SUCCESS: Customer Logged In ({res['user']['email']}) | Role: {res['user']['role']}")
    
    # 2. Admin Login
    print("\n[2] Testing Admin Login (admin@neobank.com)...")
    res, status = make_request(f"{BASE_URL}/auth/login", method="POST", data={
        "email": "admin@neobank.com",
        "password": "Password123!"
    })
    assert status == 200, f"Admin login failed: {res}"
    admin_token = res["accessToken"]
    print(f"SUCCESS: Admin Logged In ({res['user']['email']}) | Role: {res['user']['role']}")
    
    # 3. Customer Dashboard
    print("\n[3] Testing Customer Dashboard API...")
    res, status = make_request(f"{BASE_URL}/dashboard", token=customer_token)
    assert status == 200, f"Dashboard failed: {res}"
    print(f"SUCCESS: Total Balance: ${res['summary']['totalBalance']:,.2f} | Accounts Count: {len(res['accounts'])}")
    primary_account_id = res['accounts'][0]['id']
    
    # 4. Deposit Funds
    print("\n[4] Testing Deposit Funds ($250)...")
    res, status = make_request(f"{BASE_URL}/deposit", method="POST", token=customer_token, data={
        "accountId": primary_account_id,
        "amount": 250.0,
        "description": "Python API Test Deposit"
    })
    assert status == 200, f"Deposit failed: {res}"
    print(f"SUCCESS: Deposited ${res['amount']} | Reference: {res['reference']} | New Balance: ${res['account']['balance']}")
    
    # 5. Log Expense
    print("\n[5] Testing Log Expense ($35.00 FOOD)...")
    res, status = make_request(f"{BASE_URL}/expenses", method="POST", token=customer_token, data={
        "title": "Grocery Shopping",
        "amount": 35.0,
        "category": "FOOD",
        "notes": "Python backend verified"
    })
    assert status == 201, f"Log expense failed: {res}"
    print(f"SUCCESS: {res['message']} | Expense ID: {res['expense']['id']}")
    
    # 6. AI Assistant Query
    print("\n[6] Testing AI Assistant Financial Query...")
    res, status = make_request(f"{BASE_URL}/ai-assistant", method="POST", token=customer_token, data={
        "message": "summarize my finances"
    })
    assert status == 200, f"AI Assistant failed: {res}"
    print("SUCCESS: AI Assistant Response:")
    print("------------------------------------------")
    print(res['reply'][:250].encode('ascii', errors='ignore').decode('utf-8') + "...")
    print("------------------------------------------")
    
    # 7. Admin Analytics
    print("\n[7] Testing Admin Analytics API...")
    res, status = make_request(f"{BASE_URL}/admin/analytics", token=admin_token)
    assert status == 200, f"Admin Analytics failed: {res}"
    print(f"SUCCESS: Total Users: {res['overview']['totalUsers']} | Total Txns: {res['overview']['totalTransactions']} | Revenue: ${res['overview']['systemRevenue']}")

    # 8. New User Registration Test
    print("\n[8] Testing New Customer Registration...")
    import time
    unique_email = f"py_user_{int(time.time())}@example.com"
    res, status = make_request(f"{BASE_URL}/auth/register", method="POST", data={
        "firstName": "PyTest",
        "lastName": "User",
        "email": unique_email,
        "phone": "5551234567",
        "password": "Password123!"
    })
    assert status == 201 or status == 200, f"Registration failed: {res}"
    print(f"SUCCESS: Registered New User: {res['user']['email']} | Welcome Account Created!")

    print("\n==========================================")
    print("   ALL TESTS PASSED SUCCESSFULLY!       ")
    print("==========================================")

if __name__ == "__main__":
    run_tests()
