import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: {
      dir: '.',
      size: { width: 1280, height: 720 },
    }
  });

  const page = await context.newPage();

  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1000);

  const entry = page.getByTestId('entry-e-1');
  const surface = page.getByTestId('surface-s-1');

  await entry.hover();
  await page.mouse.down();
  await page.mouse.move(0, 0);
  const surfaceBox = await surface.boundingBox();
  await page.mouse.move(surfaceBox.x + surfaceBox.width / 2, surfaceBox.y + surfaceBox.height / 2, { steps: 20 });
  await page.mouse.up();

  await page.waitForTimeout(1000);

  const mappedEntry = page.getByTestId('mapped-entry-e-1-s-1');
  const canaryLane = page.getByTestId('lane-canary');

  await mappedEntry.hover();
  await page.mouse.down();
  const canaryBox = await canaryLane.boundingBox();
  await page.mouse.move(canaryBox.x + canaryBox.width / 2, canaryBox.y + canaryBox.height / 2, { steps: 20 });
  await page.mouse.up();

  await page.waitForTimeout(2000);

  await context.close();
  await browser.close();

  import('fs').then(fs => {
    const files = fs.readdirSync('.');
    const webmFile = files.find(f => f.endsWith('.webm'));
    if (webmFile) {
        fs.renameSync(webmFile, 'testing/evidence.webm');
        console.log('Video saved as testing/evidence.webm');
    }
  });
})();
