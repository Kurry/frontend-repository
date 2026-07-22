import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: {
      dir: './',
      size: { width: 1440, height: 900 },
    },
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  // Go to local dev server
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  // Wait a moment
  await page.waitForTimeout(2000);

  // Simulate clicking the drag component and confirming
  // 1. Find GAP-04 and click it to brush it
  // This is a minimal visual evidence generation script.
  await page.mouse.move(200, 300);
  await page.mouse.down();
  await page.mouse.move(400, 300);
  await page.mouse.up();
  await page.waitForTimeout(1000);

  // 2. Click confirm weave when modal is up
  const confirmBtn = page.getByRole('button', { name: /Confirm Weave/i });
  if (await confirmBtn.isVisible()) {
    await confirmBtn.click();
  }
  await page.waitForTimeout(1000);

  // 3. Export
  const exportBtn = page.getByRole('button', { name: /Export/i });
  if (await exportBtn.isVisible()) {
    await exportBtn.click();
  }

  await page.waitForTimeout(2000);

  // Close everything to ensure video is saved
  await context.close();
  await browser.close();

  // Rename the random video file to evidence.webm
  import('fs').then(fs => {
    const files = fs.readdirSync('./');
    const videoFile = files.find(f => f.endsWith('.webm') && f !== 'evidence.webm');
    if (videoFile) {
      fs.renameSync(videoFile, 'evidence.webm');
    }
  });
})();
