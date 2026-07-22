import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: {
      dir: 'testing/',
      size: { width: 1280, height: 720 },
    }
  });

  const page = await context.newPage();

  // Navigate and perform a walkthrough
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1000);

  // Select loci (with zoom/pan if needed, just click for now)
  const firstRoom = page.locator('svg rect').first();
  await firstRoom.click();
  await page.waitForTimeout(500);

  const firstFixture = page.locator('svg circle').first();
  await firstFixture.click();
  await page.waitForTimeout(500);

  // Check evidence
  await page.getByText('Findings & Evidence Ledger').click();
  await page.waitForTimeout(500);

  // Timeline
  await page.getByRole('button', { name: /Add Task/ }).first().click();
  await page.waitForTimeout(500);

  // Custody
  await page.getByText('Reserve').first().click();
  await page.waitForTimeout(500);
  await page.getByText('Check Out').first().click();
  await page.waitForTimeout(500);

  // Branching
  await page.getByText('Create Branch').click();
  await page.waitForTimeout(500);
  await page.getByText('Approve Branch').click();
  await page.waitForTimeout(500);

  // Handoff
  await page.getByText('Partial Handoff').click();
  await page.waitForTimeout(500);

  // Dispatch
  await page.getByText('Advance Clock').click();
  await page.waitForTimeout(500);
  await page.getByText('Dispatch Previews').click();
  await page.waitForTimeout(500);

  // Export
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByText('Export Packet (.zip)').click()
  ]);
  await download.path();
  await page.waitForTimeout(1000);

  await context.close();
  await browser.close();

  // Rename the video to evidence.webm
  import('fs').then(fs => {
    const files = fs.readdirSync('testing');
    const webmFile = files.find(f => f.endsWith('.webm') && f !== 'evidence.webm');
    if (webmFile) {
      if (fs.existsSync('testing/evidence.webm')) fs.unlinkSync('testing/evidence.webm');
      fs.renameSync(`testing/${webmFile}`, 'testing/evidence.webm');
      console.log('Successfully recorded testing/evidence.webm');
    }
  });
})();
