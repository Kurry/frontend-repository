import { chromium } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: {
      dir: join(__dirname, 'testing'),
      size: { width: 1280, height: 720 }
    }
  });
  const page = await context.newPage();

  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1000);

  // Flow: Select failed record -> Apply recovery -> Download Export
  const failedRecordBtn = page.getByRole('button', { name: /Dragon Lair/i });
  await failedRecordBtn.click();
  await page.waitForTimeout(1000);

  const applyBtn = page.getByRole('button', { name: 'Apply Recovery Path' });
  await applyBtn.click();
  await page.waitForTimeout(1500);

  const exportBtn = page.getByRole('button', { name: 'Export JSON' });
  await exportBtn.click();
  await page.waitForTimeout(1000);

  await context.close();
  await browser.close();

  // Rename video to evidence.webm
  import('fs').then(fs => {
    const dir = join(__dirname, 'testing');
    const files = fs.readdirSync(dir);
    const webm = files.find(f => f.endsWith('.webm') && f !== 'evidence.webm');
    if (webm) {
      fs.renameSync(join(dir, webm), join(dir, 'evidence.webm'));
    }
  });
})();
