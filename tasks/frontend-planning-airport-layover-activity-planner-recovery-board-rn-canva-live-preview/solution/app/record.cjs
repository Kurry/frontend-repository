const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

(async () => {
  // Start the server
  const server = exec('npm run preview -- --port 3000', { cwd: __dirname });

  // Wait a bit for the server to start
  await new Promise(resolve => setTimeout(resolve, 3000));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: { dir: '.' }
  });
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(1000);

    // 1. Move a failed record into a recovery path (Signature Interaction)
    await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll("h3")).find(e => e.textContent === "Missed Connection Check");
      if (el) el.closest("[role=listitem]").click();
    });
    await page.waitForTimeout(500);

    // Fill in recovery details
    await page.evaluate(() => {
      const input = document.querySelector("input[placeholder=\"e.g., ALT-FLIGHT-992\"]");
      if (input) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(input, 'ALT-FLIGHT-992');
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });
    await page.evaluate(() => {
      const textarea = document.querySelector("textarea[placeholder=\"Describe how the impact is resolved...\"]");
      if (textarea) {
        const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        nativeTextAreaValueSetter.call(textarea, 'Rebooked on next available flight');
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });

    // Apply mutation
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find(e => e.textContent === "Apply Recovery Mutation");
      if (btn) btn.click();
    });
    await page.waitForTimeout(1000);

    // 2. Export Artifact
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find(e => e.textContent === "Export JSON");
      if (btn) btn.click();
    });
    await page.waitForTimeout(1000);

    // 3. Clear State
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find(e => e.textContent === "Clear");
      if (btn) btn.click();
    });
    await page.waitForTimeout(1000);

    // 4. Undo using keyboard shortcut
    await page.keyboard.press('Control+z');
    await page.waitForTimeout(1000);

  } catch (err) {
    console.error(err);
  } finally {
    await context.close();
    await browser.close();

    // Rename video file
    const files = fs.readdirSync(__dirname);
    const webmFile = files.find(f => f.endsWith('.webm') && f !== 'evidence.webm');
    if (webmFile) {
      fs.renameSync(path.join(__dirname, webmFile), path.join(__dirname, 'evidence.webm'));
    }

    server.kill();
    process.exit(0);
  }
})();
