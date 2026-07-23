import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: {
      dir: 'videos/',
      size: { width: 1440, height: 900 }
    },
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  await page.goto('http://localhost:3000');

  // Wait for load
  await page.waitForTimeout(2000);

  // Interact
  await page.mouse.move(500, 500);
  await page.mouse.down();
  await page.mouse.move(700, 500);
  await page.waitForTimeout(1000);
  await page.mouse.up();

  await page.waitForTimeout(1000);

  await page.getByText('Confirm').click().catch(() => {});

  await page.waitForTimeout(2000);

  await context.close();
  await browser.close();

  // move video to evidence.webm
  import('fs').then(fs => {
    const files = fs.readdirSync('videos');
    if (files.length > 0) {
      fs.renameSync(path.join('videos', files[0]), 'evidence.webm');
    }
  });
})();
