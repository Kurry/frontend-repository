// Re-recording evidence to capture edit/reorder logic
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: {
      dir: __dirname,
      size: { width: 1280, height: 720 },
    },
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  try {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(1000); // Wait for animations to settle

    // Find the conflicted record ("Expired Yeast") and click it
    await page.click('text=Expired Yeast');
    await page.waitForTimeout(500);

    // Verify recovery board shows Failed state
    await page.waitForSelector('text=Failed Record Detected');

    // Type the reason
    await page.fill('textarea[id="reason"]', 'Substituted with active dry yeast from pantry');
    await page.waitForTimeout(500);

    // Click the mutation button
    await page.click('text=Repair Downstream Consequences');
    await page.waitForTimeout(1000); // Wait for transitions

    // Now edit the record (we know it's selected and has the Edit button)
    const editButtons = await page.$$('button[title="Edit"]');
    if (editButtons.length > 0) {
      await editButtons[0].click();
      await page.waitForTimeout(200);
      const inputs = await page.$$('input[type="text"]');
      if (inputs.length > 0) {
        await inputs[0].fill('Active Dry Yeast');
      }
      await page.click('button:has(svg.lucide-check)');
      await page.waitForTimeout(500);
    }

    // Reorder records (move down instead since the first one can't move up)
    const moveDowns = await page.$$('button[title="Move Down"]');
    for (let btn of moveDowns) {
      if (await btn.isEnabled()) {
        await btn.click();
        await page.waitForTimeout(500);
        break;
      }
    }

    // Trigger artifact export
    await page.click('text=Export Artifact');
    await page.waitForTimeout(1000); // Wait for the download action to complete visually

    console.log("Successfully recorded interactions.");
  } catch (error) {
    console.error("Error during recording:", error);
  } finally {
    const videoPath = await page.video().path();
    await context.close();
    await browser.close();

    // Rename video to evidence.webm
    const fs = require('fs');
    fs.renameSync(videoPath, path.join(__dirname, 'evidence.webm'));
    console.log(`Video saved to ${path.join(__dirname, 'evidence.webm')}`);
  }
})();
