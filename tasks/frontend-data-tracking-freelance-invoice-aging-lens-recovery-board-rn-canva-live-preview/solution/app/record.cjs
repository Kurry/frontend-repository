const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

(async () => {
    // 1. Create reference screenshots directory to avoid silent record failures
    const screenshotDir = path.resolve(__dirname, '../../../environment/reference-screenshots');
    fs.mkdirSync(screenshotDir, { recursive: true });

    // 2. Start the development server
    const serverProcess = spawn('npm', ['run', 'start'], { cwd: path.resolve(__dirname), shell: true });

    // Give it a moment to boot up
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log("Launching browser...");
    const browser = await chromium.launch();
    const context = await browser.newContext({
        recordVideo: {
            dir: __dirname,
            size: { width: 1280, height: 720 },
        },
        viewport: { width: 1280, height: 720 }
    });

    const page = await context.newPage();

    try {
        console.log("Navigating to http://localhost:3000...");
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

        console.log("Waiting for app to load...");
        // Wait for the specific element that indicates app is ready
        await page.waitForSelector('text="Freelance Invoice Aging Lens"', { timeout: 10000 });

        console.log("Taking some actions to record...");

        // Wait for the first failed invoice specifically (e.g. Acme Corp)
        await page.waitForSelector('text="Acme Corp"', { timeout: 10000 });

        // Click on the Investigate button for Acme Corp
        console.log("Clicking Investigate...");
        const investigateBtn = page.locator('button:has-text("Investigate")').first();
        if (await investigateBtn.isVisible()) {
            await investigateBtn.click();
            await page.waitForTimeout(500); // Wait for transition
        }

        console.log("Clicking Resolve...");
        const resolveBtn = page.locator('button:has-text("Resolve")').first();
        if (await resolveBtn.isVisible()) {
            await resolveBtn.click();
            await page.waitForTimeout(1000); // Wait for transition and summary update
        }

        console.log("Undoing the action...");
        const undoBtn = page.locator('button:has-text("Undo")');
        if (await undoBtn.isVisible()) {
            await undoBtn.click();
            await page.waitForTimeout(1000); // Wait for undo to reflect
        }

        console.log("Clicking Add Record...");
        const addBtn = page.locator('button:has-text("+")').first(); // the plus icon in actions panel
        if (await addBtn.isVisible()) {
            await addBtn.click();
            await page.waitForTimeout(500);

            console.log("Filling form...");
            await page.fill('input[name="client"]', 'New Client LLC');
            await page.fill('input[name="amount"]', '500');
            await page.fill('input[name="dueDate"]', '2026-07-01');
            await page.click('button:has-text("Save Invoice")');
            await page.waitForTimeout(1000);
        }

        console.log("Recording complete.");

    } catch (e) {
        console.error("Recording error:", e);
    } finally {
        const video = await page.video();
        const videoPath = await video.path();

        await context.close();
        await browser.close();

        // Rename the generated webm file to evidence.webm
        fs.renameSync(videoPath, path.join(__dirname, 'evidence.webm'));
        console.log("evidence.webm saved successfully.");

        // Kill the server
        serverProcess.kill();
    }
})();
