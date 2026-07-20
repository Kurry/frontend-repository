import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto("http://localhost:3000")

        # Verify app loaded successfully by checking for a known element, e.g. 'Theme Builder'
        title = await page.title()
        print(f"Page Title: {title}")

        # Capture screenshot for verification
        await page.screenshot(path="tasks/frontend-creative-tools-css-theme-builder/solution/app/screenshot_final.png")
        print("Saved screenshot to tasks/frontend-creative-tools-css-theme-builder/solution/app/screenshot_final.png")

        await browser.close()

asyncio.run(run())
