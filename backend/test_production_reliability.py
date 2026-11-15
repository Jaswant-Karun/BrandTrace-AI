import urllib.request
import json
import ssl
import time

ctx = ssl.create_default_context()

def test_url(url, method='GET', data=None, headers=None):
    t0 = time.perf_counter()
    req = urllib.request.Request(url, method=method)
    if headers:
        for k, v in headers.items():
            req.add_header(k, v)
    if data:
        req.data = json.dumps(data).encode('utf-8')
        req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
            dur = time.perf_counter() - t0
            body = resp.read().decode('utf-8')
            return resp.status, dur, body
    except urllib.error.HTTPError as e:
        dur = time.perf_counter() - t0
        body = e.read().decode('utf-8')
        return e.code, dur, body
    except Exception as e:
        dur = time.perf_counter() - t0
        return 0, dur, str(e)

print('--- R1: Invalid Password ---')
st, dur, body = test_url('https://brandtrace-backend.onrender.com/api/auth/login', 'POST', {
    'email': 'demo@brandtrace.ai',
    'password': 'WrongPassword123!'
})
print(f'Status: {st} (expected 401), body: {body}')

print('\n--- R2: Unknown User ---')
st, dur, body = test_url('https://brandtrace-backend.onrender.com/api/auth/login', 'POST', {
    'email': 'ghost.user.xyz999@brandtrace.ai',
    'password': 'SomePassword123!'
})
print(f'Status: {st} (expected 401), body: {body}')

print('\n--- R3: Empty Content Inspection ---')
st, dur, body = test_url('https://brandtrace-backend.onrender.com/api/verify', 'POST', {
    'brand_id': 'aurelle-tech',
    'channel': 'Instagram',
    'content': ''
})
print(f'Status: {st} (expected 400), body: {body}')

print('\n--- R4: Oversized Content (>50k chars) ---')
st, dur, body = test_url('https://brandtrace-backend.onrender.com/api/verify', 'POST', {
    'brand_id': 'aurelle-tech',
    'channel': 'Instagram',
    'content': 'Aurelle ' * 10000
})
print(f'Status: {st} (expected 413), body: {body[:150]}')

print('\n--- R5: Forged JWT Token ---')
st, dur, body = test_url('https://brandtrace-backend.onrender.com/api/auth/me', headers={'Authorization': 'Bearer fake.forged.jwt.token'})
print(f'Status: {st} (expected 401), body: {body}')

print('\n--- R6: Unauthorized Action (Creator attempting reset) ---')
# First login as creator
st, dur, body = test_url('https://brandtrace-backend.onrender.com/api/auth/login', 'POST', {
    'email': 'creator@aurelle.com',
    'password': 'brandtrace2026'
})
creator_token = json.loads(body).get('access_token')
st, dur, body = test_url('https://brandtrace-backend.onrender.com/api/demo/reset', 'POST', headers={'Authorization': f'Bearer {creator_token}'})
print(f'Creator reset attempt: status={st} (expected 403), body: {body}')
