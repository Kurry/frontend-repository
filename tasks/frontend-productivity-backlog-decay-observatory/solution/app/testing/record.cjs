const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        recordVideo: {
            dir: path.join(__dirname),
            size: { width: 1280, height: 720 },
        }
    });
    const page = await context.newPage();

    await page.goto('http://localhost:5173');
    await page.waitForTimeout(1000);

    // Allocate
    const sliders = page.locator('input[type="range"]');
    await sliders.nth(0).fill('10');
    await sliders.nth(0).evaluate((el) => {
        const event = new Event('input', { bubbles: true });
        el.dispatchEvent(event);
        const event2 = new Event('change', { bubbles: true });
        el.dispatchEvent(event2);
    });

    await page.waitForTimeout(500);

    // Dependency edge rejection check
    await page.locator('select').nth(1).selectOption({ index: 1 });
    await page.locator('select').nth(3).selectOption({ index: 1 });
    page.once('dialog', dialog => dialog.accept());
    await page.locator('button', { hasText: 'Link' }).click();
    await page.waitForTimeout(500);

    // Triage session advance
    await page.locator('button', { hasText: 'Load Queue' }).click();
    await page.waitForTimeout(500);
    await page.locator('button', { hasText: 'Do Next' }).click();
    await page.waitForTimeout(500);

    // WebMCP bindings test via evaluate
    await page.evaluate(() => window.webmcp_advanceClock(5));
    await page.waitForTimeout(1000);

    await context.close();
    await browser.close();
    console.log('Recorded verification video.');
})();
