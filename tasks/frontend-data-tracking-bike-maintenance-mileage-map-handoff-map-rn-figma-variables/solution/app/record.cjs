const { chromium } = require('playwright');
const path = require('path');
const { spawn } = require('child_process');

async function run() {
  // Start server
  const server = spawn('npm', ['start'], { stdio: 'inherit' });

  // Wait for server to be ready
  await new Promise(resolve => setTimeout(resolve, 3000));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: {
      dir: path.join(__dirname, '..'),
      size: { width: 1280, height: 720 },
    },
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  try {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // 1. Signature interaction: Connect a selected record to a handoff owner
    // Click on the draft record
    await page.getByText('Needs new chain').click();
    await page.waitForTimeout(500);

    // Click on Mechanic A to assign it
    await page.getByRole('button', { name: 'mechanic a' }).click();
    await page.waitForTimeout(1000);

    // Undo the assignment
    await page.getByRole('button', { name: 'Undo' }).click();
    await page.waitForTimeout(1000);

    // Redo assignment to Mechanic B
    await page.getByRole('button', { name: 'mechanic b' }).click();
    await page.waitForTimeout(1000);

    // 2. Create flow
    await page.getByRole('button').filter({ has: page.locator('svg.lucide-plus') }).click();
    await page.waitForTimeout(500);

    await page.locator('input[name="notes"]').fill('New brake pads');
    await page.locator('input[name="mileage"]').fill('5000');
    await page.locator('select[name="status"]').selectOption('ready');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(1000);

    // Select the new record
    await page.getByText('New brake pads').click();
    await page.waitForTimeout(1000);

    // 3. Artifact Transfer - Export
    // First setup the download listener
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export Artifact' }).click();
    const download = await downloadPromise;
    console.log(`Downloaded ${download.suggestedFilename()}`);
    await download.delete(); // Cleanup
    await page.waitForTimeout(1000);

    console.log('Walkthrough complete');
  } catch (error) {
    console.error('Error during walkthrough:', error);
  } finally {
    await context.close();
    await browser.close();
    server.kill();

    // Rename video to evidence.webm
    const fs = require('fs');
    const files = fs.readdirSync(path.join(__dirname, '..'));
    const webmFile = files.find(f => f.endsWith('.webm') && f !== 'evidence.webm');
    if (webmFile) {
      fs.renameSync(
        path.join(__dirname, '..', webmFile),
        path.join(__dirname, '..', 'evidence.webm')
      );
      console.log('Saved evidence.webm');
    }
    process.exit(0);
  }
}

run();
