const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ recordVideo: { dir: './videos/' } });
  const page = await context.newPage();

  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1000);

  // click New
  await page.click('button:has-text("New")');
  await page.waitForTimeout(500);

  // Fill form
  await page.fill('input[placeholder="Name"]', 'Test Appliance');
  await page.fill('input[placeholder="Model"]', 'Test Model');
  await page.selectOption('select', 'ready');
  await page.fill('input[placeholder="Cost"]', '150');

  // Save
  await page.click('button:has-text("Save")');
  await page.waitForTimeout(1000);

  // Branch scenario on first item
  await page.click('button[title="Branch Scenario"]');
  await page.waitForTimeout(1000);

  // select a checkbox
  await page.click('input[type="checkbox"]');
  await page.waitForTimeout(500);

  // archive selected
  await page.click('button:has-text("Archive Selected")');
  await page.waitForTimeout(1000);

  // Undo
  await page.keyboard.press('Control+z');
  await page.waitForTimeout(500);

  // Export
  await page.click('button:has-text("Export")');
  await page.waitForTimeout(1000);

  await context.close();
  await browser.close();
  console.log("Video recorded in ./videos/");
})();
