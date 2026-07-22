const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function record() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: {
      dir: __dirname,
      size: { width: 1280, height: 720 },
    },
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  // Start server
  const { spawn } = require('child_process');
  const server = spawn('npm', ['start'], { cwd: __dirname });

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 3000));

  await page.goto('http://localhost:3000');

  // Interactions to record
  await page.waitForTimeout(2000);

  // Close context to finish recording
  await context.close();
  await browser.close();

  // Cleanup server
  server.kill();

  // Rename the generated video file to evidence.webm
  const files = fs.readdirSync(__dirname);
  const videoFile = files.find(f => f.endsWith('.webm') && f !== 'evidence.webm');
  if (videoFile) {
    fs.renameSync(path.join(__dirname, videoFile), path.join(__dirname, 'evidence.webm'));
    console.log('Successfully recorded evidence.webm');
  }
}

record().catch(console.error);
