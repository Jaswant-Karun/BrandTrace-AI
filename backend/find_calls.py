import os
import re

calls = set()
for root, dirs, files in os.walk("frontend/src"):
    for f in files:
        if f.endswith((".tsx", ".ts")):
            p = os.path.join(root, f)
            with open(p, "r", encoding="utf-8") as fh:
                text = fh.read()
                matches = re.findall(r"(?:apiClient\.request|fetch)\s*\(\s*[`'\"]([^`'\"?]+)", text)
                for m in matches:
                    calls.add((os.path.relpath(p, "frontend/src"), m))

for filepath, endpoint in sorted(calls):
    print(f"{filepath} -> {endpoint}")

