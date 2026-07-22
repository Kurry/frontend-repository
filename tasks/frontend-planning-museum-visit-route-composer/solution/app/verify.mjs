import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: {
      dir: '../../environment/reference-screenshots',
      size: { width: 1280, height: 720 }
    }
  });
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    // Drag Exhibit 1 onto the canvas
    const exhibit1 = await page.getByTestId('exhibit-ex1');
    const routeCanvas = await page.getByTestId('route-canvas');
    await exhibit1.dragTo(routeCanvas);
    await page.waitForTimeout(500);

    // Click some UI elements
    await page.getByText('Advance Clock (+15m)').click();
    await page.waitForTimeout(500);

    await page.getByText('Split Group').click();
    await page.waitForTimeout(500);

    await page.getByText('Rehearse Delay').click();
    await page.waitForTimeout(500);

    await page.getByText('Export').click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: '../../environment/reference-screenshots/screenshot.png' });

    await context.close();
    await browser.close();

    console.log("Verification complete.");
  } catch (error) {
    console.error("Verification failed:", error);
    await browser.close();
    process.exit(1);
  }
})();
