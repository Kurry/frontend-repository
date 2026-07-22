import { chromium } from '@playwright/test';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const server = exec('npm start');

setTimeout(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: { dir: '../../environment/reference-screenshots', size: { width: 1280, height: 720 } }
  });
  const page = await context.newPage();
  await page.goto('http://localhost:3000');

  // Interact
  await page.waitForTimeout(1000);

  // Finish
  await context.close();
  await browser.close();
  server.kill();

  const dir = '../../environment/reference-screenshots';
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.endsWith('.webm')) {
      fs.renameSync(path.join(dir, file), path.join(dir, 'evidence.webm'));
      break;
    }
  }

  process.exit(0);
}, 3000);
