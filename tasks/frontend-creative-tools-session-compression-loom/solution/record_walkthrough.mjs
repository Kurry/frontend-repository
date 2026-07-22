import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: {
      dir: path.resolve('tasks/frontend-creative-tools-session-compression-loom/environment/reference-screenshots'),
      size: { width: 1280, height: 720 },
    },
  });
  const page = await context.newPage();

  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1000);

  // Click first event
  await page.click('text=Phase 1');
  await page.waitForTimeout(500);

  // Click second event to form range
  await page.click('text=Phase 2');
  await page.waitForTimeout(500);

  // Fold
  await page.click('text=Fold Selected');
  await page.waitForTimeout(1000);

  // Select the newly folded capsule in Preview to edit
  await page.click('text=New Summary');
  await page.waitForTimeout(500);

  // Edit title
  await page.fill('input[type="text"]', 'Distilled Genesis');
  await page.waitForTimeout(500);

  // Change variant
  await page.selectOption('select', 'diagnostic');
  await page.waitForTimeout(500);

  // Export
  await page.click('text=Export');
  await page.waitForTimeout(1000);

  await context.close();
  await browser.close();
})();
