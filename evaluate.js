const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  // We need to capture webm format. Playwright automatically records in WebM.
  // We will specify the directory.
  const context = await browser.newContext({ recordVideo: { dir: 'tasks/frontend-creative-tools-color-palette-archive/solution/app/testing' } });
  const page = await context.newPage();

  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'tasks/frontend-creative-tools-color-palette-archive/solution/app/testing/TASK-FUNC-001-shared.png' });

  // Core workflows
  await page.click('#btn-create');
  await page.waitForTimeout(500);

  await page.fill('#ed-name', 'Test Palette');
  await page.fill('#ed-artist', 'Test Artist');
  await page.selectOption('#ed-period', 'Modern');

  await page.fill('#ed-hex-0', '#FF0000');
  await page.fill('#ed-hex-1', '#00FF00');
  await page.fill('#ed-hex-2', '#0000FF');
  await page.waitForTimeout(200);

  const saveDisabled = await page.$eval('#ed-save', el => el.disabled);
  if (!saveDisabled) {
      await page.click('#ed-save');
      await page.waitForTimeout(500);
  }
  await page.screenshot({ path: 'tasks/frontend-creative-tools-color-palette-archive/solution/app/testing/after-create.png' });

  await page.click('#btn-export');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'tasks/frontend-creative-tools-color-palette-archive/solution/app/testing/export.png' });

  const cssTab = await page.locator('[data-tab="css"]');
  await cssTab.click();
  await page.waitForTimeout(300);

  await page.click('#export-close');
  await page.waitForTimeout(500);

  await page.click('.palette-library__toggle-option[data-view="palette"]');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'tasks/frontend-creative-tools-color-palette-archive/solution/app/testing/palette-view.png' });

  // Test compare
  await page.click('.palette-card:nth-child(1) .js-select');
  await page.click('.palette-card:nth-child(2) .js-select');
  await page.waitForTimeout(300);
  await page.click('#tray-compare');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'tasks/frontend-creative-tools-color-palette-archive/solution/app/testing/compare-dialog.png' });
  await page.click('#compare-close');
  await page.waitForTimeout(500);

  await browser.close();

  // Rename the webm file to a descriptive name
  const files = fs.readdirSync('tasks/frontend-creative-tools-color-palette-archive/solution/app/testing');
  for (const f of files) {
      if (f.endsWith('.webm')) {
          fs.renameSync(
              'tasks/frontend-creative-tools-color-palette-archive/solution/app/testing/' + f,
              'tasks/frontend-creative-tools-color-palette-archive/solution/app/testing/full-exercise.webm'
          );
      }
  }
})();
