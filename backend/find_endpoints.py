import os
import re

endpoints = set()
for root, dirs, files in os.walk("frontend/src"):
    for f in files:
        if f.endswith((".tsx", ".ts")):
            p = os.path.join(root, f)
            with open(p, "r", encoding="utf-8") as fh:
                text = fh.read()
                matches = re.findall(r"['\"`](/(?:api|health)[^'\"`\s]*)['\"`]", text)
                for m in matches:
                    endpoints.add((os.path.relpath(p, "frontend/src"), m))

for filepath, endpoint in sorted(endpoints):
    print(f"{filepath} -> {endpoint}")
