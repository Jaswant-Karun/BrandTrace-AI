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
        with urllib.request.urlopen(req, context=ctx, timeout=25) as resp:
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

print('--- 1. Testing Production Frontend (Vercel) ---')
st, dur, body = test_url('https://brandtrace.vercel.app')
print(f'Vercel Frontend: status={st}, latency={dur:.2f}s, length={len(body)} bytes')

print('\n--- 2. Testing Production Demo Login (Render) ---')
st, dur, body = test_url('https://brandtrace-backend.onrender.com/api/auth/login', 'POST', {
    'email': 'demo@brandtrace.ai',
    'password': 'DemoAurelle2026!'
})
print(f'Demo Login: status={st}, latency={dur:.2f}s')
token = None
try:
    login_json = json.loads(body)
    token = login_json.get('access_token', '')
    print('User Role:', login_json.get('user', {}).get('role'))
    print('Workspace:', login_json.get('user', {}).get('workspace_id'))
except Exception as e:
    print('Error parsing login response:', body[:200])

if token:
    headers = {'Authorization': f'Bearer {token}'}
    print('\n--- 3. Testing Production /api/facts ---')
    st, dur, body = test_url('https://brandtrace-backend.onrender.com/api/facts?brand_id=aurelle-tech', headers=headers)
    print(f'Facts list: status={st}, latency={dur:.2f}s')
    try:
        facts = json.loads(body)
        print(f'Found {len(facts)} facts. First fact ID: {facts[0].get("id", facts[0].get("fact_id"))}')
    except Exception as e:
        print('Error parsing facts:', body[:200])

    print('\n--- 4. Testing Production Content Inspection (/api/verify) ---')
    st, dur, body = test_url('https://brandtrace-backend.onrender.com/api/verify', 'POST', {
        'brand_id': 'aurelle-tech',
        'channel': 'Instagram / Meta Feed Ads',
        'content': 'Scale your creative workflows with Aurelle Cloud Studio. Spatial audio mastering starting at just ₹499/month.'
    }, headers=headers)
    print(f'Clean Copy Verify: status={st}, latency={dur:.2f}s')
    try:
        res = json.loads(body)
        print('Decision:', res.get('governance_decision'))
        print('Composite Risk:', res.get('composite_risk_score'))
    except Exception as e:
        print('Error parsing verify:', body[:200])

    print('\n--- 5. Testing Production Violation Copy Inspection ---')
    st, dur, body = test_url('https://brandtrace-backend.onrender.com/api/verify', 'POST', {
        'brand_id': 'aurelle-tech',
        'channel': 'Digital Display',
        'content': 'Aurelle Pulse Smart Ring is a medical-grade diagnostic cure that eliminates all symptoms of cardiovascular disease.'
    }, headers=headers)
    print(f'Violation Copy Verify: status={st}, latency={dur:.2f}s')
    try:
        res = json.loads(body)
        print('Decision:', res.get('governance_decision'))
        print('Composite Risk:', res.get('composite_risk_score'))
        print('Spans count:', len(res.get('all_risk_spans', [])))
    except Exception as e:
        print('Error parsing violation:', body[:200])

    print('\n--- 6. Testing Production Change Impact Simulator ---')
    st, dur, body = test_url('https://brandtrace-backend.onrender.com/api/simulator/propose', 'POST', {
        'brand_id': 'aurelle-tech',
        'target_record_id': 'FACT-AUR-PRC-01',
        'target_record_type': 'PRICE',
        'record_label': 'Aurelle Cloud Studio Subscription',
        'old_value': '₹499',
        'proposed_value': '₹599',
        'change_rationale': 'Commercial tier revision Q1',
        'proposed_by': 'Alex Mercer (VP Brand Governance)'
    }, headers=headers)
    print(f'Simulator Propose: status={st}, latency={dur:.2f}s')
    try:
        res = json.loads(body)
        print('Overall Risk Score:', res.get('overall_risk_score'))
        print('Affected touchpoints:', len(res.get('affected_touchpoints', [])))
    except Exception as e:
        print('Error parsing simulator:', body[:200])

    print('\n--- 7. Testing Production Trust Ledger Verification ---')
    st, dur, body = test_url('https://brandtrace-backend.onrender.com/api/ledger/verify-record', 'POST', {
        'identifier': 'AST-AUR-01',
        'content_to_test': 'Unlock next-generation spatial computing with Aurelle Cloud Studio for only ₹599 per month. Real-time audio rendering included.'
    }, headers=headers)
    print(f'Ledger Verify: status={st}, latency={dur:.2f}s')
    try:
        res = json.loads(body)
        print('State:', res.get('state'))
        print('Is Authentic:', res.get('is_authentic'))
    except Exception as e:
        print('Error parsing ledger:', body[:200])
