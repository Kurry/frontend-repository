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

  await page.goto('http://localhost:3000');
  // Wait for the app to be mounted
  await page.waitForSelector('h1:has-text("Scenario Weaver")');

  // Perform walkthrough actions
  // Branch selected record
  await page.getByRole('heading', { name: 'Start of the Quest' }).click();
  await page.waitForTimeout(500);

  // Mutate title and description
  await page.locator('input[type="text"]').fill('Start of the Adventure');
  await page.waitForTimeout(200);
  await page.locator('textarea').fill('The heroes arrive at the lively tavern, full of mysterious patrons.');
  await page.waitForTimeout(500);

  // Apply mutation
  await page.getByRole('button', { name: 'Apply Mutation' }).click();
  await page.waitForTimeout(1000);

  // Undo mutation
  await page.getByLabel('Undo last mutation').click();
  await page.waitForTimeout(1000);

  // Add new scenario card
  await page.getByRole('button', { name: 'Add' }).click();
  await page.waitForTimeout(500);
  await page.getByRole('heading', { name: 'New Scenario' }).first().click();
  await page.waitForTimeout(200);
  await page.locator('input[type="text"]').fill('Secret Boss Encounter');
  await page.waitForTimeout(200);
  await page.locator('textarea').fill('A secret boss awaits behind the waterfall.');
  await page.getByRole('button', { name: 'Apply Mutation' }).click();
  await page.waitForTimeout(1000);

  // Test Export tool via WebMCP
  await page.evaluate(() => window.webmcp_invoke_tool('export_session'));
  await page.waitForTimeout(1000);

  await context.close();
  await browser.close();

  // Rename video output
  import('fs').then(fs => {
    const files = fs.readdirSync('testing/');
    const webmFile = files.find(f => f.endsWith('.webm'));
    if (webmFile) {
      fs.renameSync(`testing/${webmFile}`, 'testing/evidence.webm');
      console.log('Video recorded to testing/evidence.webm');
    }
  });
})();
