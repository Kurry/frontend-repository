import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const RECORDING_DIR = path.resolve('./evidence/webm');
if (!fs.existsSync(RECORDING_DIR)) {
  fs.mkdirSync(RECORDING_DIR, { recursive: true });
}

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: {
      dir: RECORDING_DIR,
      size: { width: 1280, height: 720 },
    },
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:5174...');
  await page.goto('http://localhost:5174');
  await page.waitForLoadState('networkidle');

  console.log('Taking screenshot...');
  await page.screenshot({ path: path.join(RECORDING_DIR, 'evidence.png') });

  console.log('Interacting...');
  await page.click('button[aria-label="Start playback"]');
  await page.waitForTimeout(1000);
  await page.click('button[aria-label="Toggle step 1 for Kick"]');
  await page.waitForTimeout(1000);
  await page.click('button[aria-label="Undo"]');
  await page.waitForTimeout(1000);

  console.log('Closing browser...');
  await context.close();
  await browser.close();

  // Rename video
  const files = fs.readdirSync(RECORDING_DIR);
  const videoFile = files.find(f => f.endsWith('.webm') && f !== 'evidence.webm');
  if (videoFile) {
    fs.renameSync(
      path.join(RECORDING_DIR, videoFile),
      path.join(RECORDING_DIR, 'evidence.webm')
    );
  }
  console.log('Evidence generated successfully.');
})().catch(console.error);
