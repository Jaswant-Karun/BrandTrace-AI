import urllib.request
import ssl
import re

ctx = ssl.create_default_context()
req = urllib.request.Request('https://brandtrace.vercel.app')
with urllib.request.urlopen(req, context=ctx) as r:
    html = r.read().decode('utf-8')

print('HTML length:', len(html))
print('Title:', re.findall(r'<title>(.*?)</title>', html))
js_files = re.findall(r'src=["\'](.*?\.(?:js|mjs))["\']', html)
css_files = re.findall(r'href=["\'](.*?\.(?:css))["\']', html)
manifest_files = re.findall(r'href=["\'](.*manifest.*?)["\']', html)
print('JS bundle:', js_files)
print('CSS bundle:', css_files)
print('Manifest:', manifest_files)

# Check if JS bundle is accessible
for js in js_files:
    url = f'https://brandtrace.vercel.app{js}' if js.startswith('/') else f'https://brandtrace.vercel.app/{js}'
    try:
        with urllib.request.urlopen(url, context=ctx) as jr:
            print(f'JS {url} -> status {jr.status}, size {len(jr.read())} bytes')
    except Exception as e:
        print(f'JS {url} failed: {e}')

# Check manifest
for m in manifest_files:
    url = f'https://brandtrace.vercel.app{m}' if m.startswith('/') else f'https://brandtrace.vercel.app/{m}'
    try:
        with urllib.request.urlopen(url, context=ctx) as mr:
            print(f'Manifest {url} -> status {mr.status}')
    except Exception as e:
        print(f'Manifest {url} failed: {e}')

# Check service worker sw.js
try:
    with urllib.request.urlopen('https://brandtrace.vercel.app/sw.js', context=ctx) as sw:
        print(f'Service worker sw.js -> status {sw.status}, size {len(sw.read())} bytes')
except Exception as e:
    print(f'sw.js failed: {e}')
