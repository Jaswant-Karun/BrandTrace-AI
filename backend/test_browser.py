import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            headless=True
        )
        page = await browser.new_page()
        await page.goto("http://127.0.0.1:5173/")
        title = await page.title()
        print(f"Page title: {title}")
        await browser.close()

asyncio.run(main())
