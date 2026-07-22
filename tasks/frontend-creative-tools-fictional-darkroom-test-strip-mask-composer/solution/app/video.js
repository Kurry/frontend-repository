import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ recordVideo: { dir: './' } });
  const page = await context.newPage();
  await page.goto('about:blank');
  await page.waitForTimeout(1000);
  await context.close();
  await browser.close();

  const files = fs.readdirSync('./');
  for (const file of files) {
    if (file.endsWith('.webm')) {
      fs.renameSync(file, 'evidence.webm');
      break;
    }
  }
})();
