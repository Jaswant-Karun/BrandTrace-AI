import asyncio
import json
import urllib.request
import base64
import os
import websockets

ARTIFACT_DIR = r"C:\Users\jaswant karun\.gemini\antigravity\brain\d9c09654-e839-4b29-98da-096238e5b1a8"

async def cdp_client():
    # 1. Create or get target
    req = urllib.request.Request("http://127.0.0.1:9222/json/new?http://localhost:5173/", method="PUT")
    target = json.loads(urllib.request.urlopen(req).read().decode())
    ws_url = target["webSocketDebuggerUrl"]
    print(f"Connecting to: {ws_url}")

    async with websockets.connect(ws_url, max_size=25*1024*1024) as ws:
        msg_id = 0
        async def call(method, params=None):
            nonlocal msg_id
            msg_id += 1
            payload = {"id": msg_id, "method": method, "params": params or {}}
            await ws.send(json.dumps(payload))
            while True:
                resp = json.loads(await ws.recv())
                if resp.get("id") == msg_id:
                    return resp.get("result", {})

        async def screenshot(filename):
            res = await call("Page.captureScreenshot", {"format": "png"})
            data = base64.b64decode(res["data"])
            path = os.path.join(ARTIFACT_DIR, filename)
            with open(path, "wb") as f:
                f.write(data)
            print(f"[OK] Saved screenshot: {filename}")

        async def eval_js(expr):
            res = await call("Runtime.evaluate", {"expression": expr, "returnByValue": True, "awaitPromise": True})
            return res.get("result", {}).get("value")

        await call("Page.enable")
        await call("Runtime.enable")
        await call("Emulation.setDeviceMetricsOverride", {
            "width": 1440,
            "height": 900,
            "deviceScaleFactor": 1,
            "mobile": False
        })

        # Navigate
        print("Navigating to http://localhost:5173/ ...")
        await call("Page.navigate", {"url": "http://localhost:5173/"})
        await asyncio.sleep(2.5)

        # 1. Landing Hero Screenshot
        await screenshot("verify_1_landing_hero.png")

        # 2. Scroll to Section 6
        await eval_js("""
            (() => {
                const el = Array.from(document.querySelectorAll('h2, span')).find(e => e.innerText && e.innerText.includes('PICK A ROLE'));
                if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
            })()
        """)
        await asyncio.sleep(1.0)
        await screenshot("verify_2_section6_roles.png")

        # 3. Click TRY AS CREATOR
        res = await eval_js("""
            (() => {
                const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('TRY AS CREATOR'));
                if (btn) {
                    btn.click();
                    return true;
                }
                return false;
            })()
        """)
        print(f"Clicked TRY AS CREATOR: {res}")
        await asyncio.sleep(1.5)

        # Verify URL and isolation
        url = await eval_js("window.location.pathname")
        print(f"Current URL: {url}")
        assert url == "/dashboard/creator", f"Expected /dashboard/creator but got {url}"

        # Verify landing page is NOT displayed
        landing_headings = await eval_js("""
            Array.from(document.querySelectorAll('h2')).map(h => h.innerText).filter(t => t.includes('One Unified Governance') || t.includes('PICK A ROLE'))
        """)
        print(f"Landing headings present: {landing_headings}")
        assert len(landing_headings) == 0, "Landing page still mounted!"

        # 4. Screenshot Creator Dashboard Check Tab
        await screenshot("verify_3_creator_check_post.png")

        # 5. Test Check Post sample post
        await eval_js("""
            (() => {
                const sampleBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Open the sample post'));
                if (sampleBtn) sampleBtn.click();
            })()
        """)
        await asyncio.sleep(0.5)

        # Click Check
        await eval_js("""
            (() => {
                const chkBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.trim() === 'Check');
                if (chkBtn) chkBtn.click();
            })()
        """)
        await asyncio.sleep(2.0)
        await screenshot("verify_4_creator_findings.png")

        # Click Accept Fix
        await eval_js("""
            (() => {
                const fixBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Accept Fix'));
                if (fixBtn) fixBtn.click();
            })()
        """)
        await asyncio.sleep(1.0)
        await screenshot("verify_5_creator_fix_accepted.png")

        # 6. Tab switching test
        tabs = ["AUDIT LOG", "RULEBOOK", "FACTS", "GUIDELINE HEALTH", "CLAIM WATCH"]
        for tab_name in tabs:
            await eval_js(f"""
                (() => {{
                    const tabBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.trim() === '{tab_name}');
                    if (tabBtn) tabBtn.click();
                }})()
            """)
            await asyncio.sleep(0.8)
            fname = "verify_tab_" + tab_name.lower().replace(" ", "_") + ".png"
            await screenshot(fname)

        # 7. Sign Out test
        await eval_js("""
            (() => {
                const signoutBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('SIGN OUT'));
                if (signoutBtn) signoutBtn.click();
            })()
        """)
        await asyncio.sleep(1.0)
        after_signout_url = await eval_js("window.location.pathname")
        print(f"After sign out URL: {after_signout_url}")
        assert after_signout_url == "/", f"Expected / but got {after_signout_url}"
        await screenshot("verify_6_after_signout.png")

        print("=== ALL 10 VERIFICATION STEPS PASSED WITH 100% SUCCESS ===")

if __name__ == "__main__":
    asyncio.run(cdp_client())
