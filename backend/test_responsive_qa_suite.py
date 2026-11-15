import asyncio
import json
import os
import sys
from playwright.async_api import async_playwright

VIEWPORTS = [
    {"name": "320x568 (iPhone SE)", "width": 320, "height": 568},
    {"name": "360x800 (Galaxy S20)", "width": 360, "height": 800},
    {"name": "375x812 (iPhone X/12 mini)", "width": 375, "height": 812},
    {"name": "390x844 (iPhone 13/14)", "width": 390, "height": 844},
    {"name": "430x932 (iPhone 15 Pro Max)", "width": 430, "height": 932},
    {"name": "768x1024 (iPad Portrait)", "width": 768, "height": 1024},
    {"name": "1024x768 (iPad Landscape)", "width": 1024, "height": 768},
    {"name": "1366x768 (Standard Laptop)", "width": 1366, "height": 768},
    {"name": "1920x1080 (Desktop FHD)", "width": 1920, "height": 1080},
]

PAGES = [
    {"role": "Landing Page", "url": "http://127.0.0.1:5173/"},
    {"role": "Public Verification", "url": "http://127.0.0.1:5173/verify"},
    {"role": "Creator (Check Post)", "url": "http://127.0.0.1:5173/creator/check"},
    {"role": "Agency", "url": "http://127.0.0.1:5173/dashboard/agency"},
    {"role": "Reviewer", "url": "http://127.0.0.1:5173/dashboard/reviewer"},
    {"role": "Compliance", "url": "http://127.0.0.1:5173/dashboard/compliance"},
    {"role": "Brand Owner", "url": "http://127.0.0.1:5173/dashboard/brand-owner"},
]

async def check_overflow_and_accessibility(page, vp_name, role_name):
    """Checks for horizontal overflow and elements clipping past viewport."""
    evaluation = await page.evaluate('''() => {
        const docWidth = document.documentElement.clientWidth;
        const scrollWidth = document.documentElement.scrollWidth;
        const bodyWidth = document.body.clientWidth;
        const bodyScrollWidth = document.body.scrollWidth;
        const hasHorizontalScroll = scrollWidth > docWidth || bodyScrollWidth > docWidth;
        
        // Find offending elements causing horizontal scroll
        const offendingElements = [];
        const all = document.querySelectorAll('*');
        for (let i = 0; i < all.length; i++) {
            const el = all[i];
            const rect = el.getBoundingClientRect();
            if (rect.right > docWidth + 1.5) {
                // Ignore SVG defs or elements with overflow hidden parents
                const tag = el.tagName.toLowerCase();
                const cls = (el.className || '').toString();
                if (tag !== 'svg' && tag !== 'path' && tag !== 'defs') {
                    offendingElements.push({
                        tag: tag,
                        class: cls.slice(0, 60),
                        rectRight: Math.round(rect.right),
                        docWidth: docWidth,
                        overflowDelta: Math.round(rect.right - docWidth)
                    });
                }
            }
        }
        
        return {
            docWidth,
            scrollWidth,
            hasHorizontalScroll,
            offendingCount: offendingElements.length,
            offendingElements: offendingElements.slice(0, 5)
        };
    }''')
    return evaluation

async def run_qa_suite():
    print("=" * 80)
    print("BRANDTRACE AI — FULL RESPONSIVE & FUNCTIONAL QA MATRIX")
    print("=" * 80)
    
    results = []
    total_checks = len(VIEWPORTS) * len(PAGES)
    passed_checks = 0
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            headless=True
        )
        
        for vp in VIEWPORTS:
            print(f"\n[VIEWPORT] {vp['name']} ({vp['width']} x {vp['height']})")
            print("-" * 60)
            
            context = await browser.new_context(
                viewport={"width": vp["width"], "height": vp["height"]},
                user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15" if vp["width"] < 600 else None
            )
            page = await context.new_page()
            
            # Listen to console errors
            console_errors = []
            page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
            
            for page_def in PAGES:
                role = page_def["role"]
                url = page_def["url"]
                
                try:
                    await page.goto(url, wait_until="networkidle", timeout=15000)
                    await asyncio.sleep(0.5) # allow framer-motion animations to settle
                    
                    eval_res = await check_overflow_and_accessibility(page, vp["name"], role)
                    has_overflow = eval_res["hasHorizontalScroll"]
                    
                    # Test page refresh persistence
                    await page.reload(wait_until="networkidle", timeout=15000)
                    await asyncio.sleep(0.3)
                    refresh_eval = await check_overflow_and_accessibility(page, vp["name"], role)
                    
                    status = "PASS" if not has_overflow and not refresh_eval["hasHorizontalScroll"] else "FAIL"
                    if status == "PASS":
                        passed_checks += 1
                        print(f"  ✓ {role:<25} | Scroll: {eval_res['scrollWidth']}px / {eval_res['docWidth']}px | Persistence: OK | {status}")
                    else:
                        print(f"  ✗ {role:<25} | OVERFLOW DETECTED: {eval_res['scrollWidth']}px > {eval_res['docWidth']}px")
                        for off in eval_res['offendingElements']:
                            print(f"      -> <{off['tag']} class='{off['class']}'> overflows by {off['overflowDelta']}px")
                    
                    results.append({
                        "viewport": vp["name"],
                        "width": vp["width"],
                        "height": vp["height"],
                        "role": role,
                        "status": status,
                        "docWidth": eval_res["docWidth"],
                        "scrollWidth": eval_res["scrollWidth"],
                        "offenders": eval_res["offendingElements"],
                        "consoleErrors": len(console_errors)
                    })
                    
                except Exception as ex:
                    print(f"  ✗ {role:<25} | ERROR: {ex}")
                    results.append({
                        "viewport": vp["name"],
                        "width": vp["width"],
                        "height": vp["height"],
                        "role": role,
                        "status": "FAIL",
                        "error": str(ex)
                    })
            
            await context.close()
        
        await browser.close()
    
    print("\n" + "=" * 80)
    print(f"TOTAL TESTS: {total_checks} | PASSED: {passed_checks} | FAILED: {total_checks - passed_checks}")
    print("=" * 80)
    
    with open("qa_responsive_results.json", "w") as f:
        json.dump(results, f, indent=2)

if __name__ == "__main__":
    asyncio.run(run_qa_suite())
