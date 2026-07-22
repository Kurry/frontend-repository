import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: {
      dir: '../environment/reference-screenshots/',
      size: { width: 1280, height: 720 },
    }
  });
  const page = await context.newPage();

  await page.goto('http://127.0.0.1:3000');
  await page.waitForTimeout(1000);

  // Example interaction
  await page.click('text=Product Launch');
  await page.waitForTimeout(1000);

  await page.fill('input[placeholder="e.g., Jane Doe"]', 'John Smith');
  await page.waitForTimeout(500);

  await page.check('input[value="resolved"]');
  await page.waitForTimeout(500);

  await page.click('text=Connect Record & Update Readiness');
  await page.waitForTimeout(1000);

  await page.click('text=Undo');
  await page.waitForTimeout(1000);

  await context.close();
  await browser.close();

  // Rename the generated webm file to evidence.webm
  import('fs').then(fs => {
    const dir = '../environment/reference-screenshots/';
    const files = fs.readdirSync(dir);
    const webmFile = files.find(f => f.endsWith('.webm') && f !== 'evidence.webm');
    if (webmFile) {
      fs.renameSync(dir + webmFile, dir + 'evidence.webm');
    }
  });
})();
