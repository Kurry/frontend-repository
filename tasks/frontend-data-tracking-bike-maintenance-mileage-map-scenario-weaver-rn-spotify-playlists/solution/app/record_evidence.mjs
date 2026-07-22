import { chromium } from 'playwright';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const envDir = path.resolve(__dirname, '../../environment/reference-screenshots');
  if (!fs.existsSync(envDir)) {
    fs.mkdirSync(envDir, { recursive: true });
  }

  // Start the vite preview server on port 3000
  const server = spawn('npx', ['vite', 'preview', '--host', '0.0.0.0', '--port', '3000'], {
    cwd: __dirname,
    stdio: 'pipe'
  });

  server.stdout.on('data', data => console.log(data.toString()));
  server.stderr.on('data', data => console.error(data.toString()));

  // Give server time to start
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('Server started, launching browser...');

  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: {
      dir: envDir,
      size: { width: 1280, height: 720 }
    }
  });

  const page = await context.newPage();

  try {
    await page.goto('http://127.0.0.1:3000');

    // Wait for the app to load
    await page.waitForSelector('text=Bike Maintenance Scenario Weaver');
    console.log('App loaded');

    // Create a record
    const input = await page.locator('input[placeholder="New record name..."]');
    await input.fill('Fix flat tire');
    await input.press('Enter');
    await page.waitForTimeout(500);

    // Branch a scenario
    const branchBtn = await page.locator('button:has-text("Branch")').first();
    await branchBtn.click();
    await page.waitForTimeout(500);

    // Select the record
    await page.locator('text=Fix flat tire').first().click();
    await page.waitForTimeout(500);

    // Export
    // Just click it to show it works, file might download invisibly in headless
    const exportBtn = await page.locator('button:has-text("Export")');
    await exportBtn.click();
    await page.waitForTimeout(1000);

    console.log('Walkthrough completed');
  } catch (e) {
    console.error('Error during walkthrough:', e);
  } finally {
    // Closing context saves the video
    await context.close();
    await browser.close();
    server.kill();

    // Find the generated webm and rename it to evidence.webm in solution/app
    const files = fs.readdirSync(envDir);
    const videoFile = files.find(f => f.endsWith('.webm'));

    if (videoFile) {
      const oldPath = path.join(envDir, videoFile);
      const newPath = path.join(__dirname, 'evidence.webm');
      fs.renameSync(oldPath, newPath);
      console.log(`Video saved to ${newPath}`);
    } else {
      console.log('No video file found.');
    }
  }
}

run();
