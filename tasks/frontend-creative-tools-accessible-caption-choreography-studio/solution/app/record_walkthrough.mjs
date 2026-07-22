import { chromium } from 'playwright';
import path from 'path';

(async () => {
    const browser = await chromium.launch({ headless: true });

    const context = await browser.newContext({
        recordVideo: {
            dir: path.resolve('../../environment/reference-screenshots'),
            size: { width: 1440, height: 900 }
        },
        viewport: { width: 1440, height: 900 }
    });

    const page = await context.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

    console.log("Navigating to app...");
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(10000);

    await context.close();
    await browser.close();

    console.log("Walkthrough recorded successfully.");
})();
