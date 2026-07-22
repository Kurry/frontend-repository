const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: {
      dir: '../',
      size: { width: 1280, height: 720 }
    }
  });
  const page = await context.newPage();

  // Ensure port 3000 is ready
  try {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Wait for records to load
    await page.waitForSelector('text=Flavor Components');

    // Signature Interaction: connect a selected record to a handoff owner
    // 1. Select the second record (e.g., 'Dark Chocolate Ganache')
    await page.click('text=Dark Chocolate Ganache');

    // 2. Map view should show it, select handoff owner
    await page.selectOption('select[aria-label="Select handoff owner"]', 'pastry-chef');

    // 3. Click Connect
    await page.click('button:has-text("Connect")');

    // Small delay to capture the result
    await page.waitForTimeout(1000);

    // Undo interaction
    await page.click('button:has-text("Undo")');
    await page.waitForTimeout(1000);

    // Export artifact
    // Catch the download
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export")');
    const download = await downloadPromise;
    const downloadPath = path.join(__dirname, 'test-download.json');
    await download.saveAs(downloadPath);
    await page.waitForTimeout(1000);

    // Read the file and get some data to make sure import is valid
    const data = JSON.parse(fs.readFileSync(downloadPath, 'utf-8'));
    data.records[0].name = "Imported Lemon Glaze";
    const importedPath = path.join(__dirname, 'test-import.json');
    fs.writeFileSync(importedPath, JSON.stringify(data));

    // Import artifact
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('button:has-text("Import")');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(importedPath);

    // Wait for import success message
    await page.waitForSelector('text=Import successful');
    await page.waitForTimeout(1500);

  } catch (e) {
    console.error("Error during recording:", e);
  } finally {
    await context.close();
    await browser.close();

    // Rename video to evidence.webm
    const files = fs.readdirSync('../');
    const webmFile = files.find(f => f.endsWith('.webm'));
    if (webmFile) {
        fs.renameSync(path.join('../', webmFile), path.join('../', 'evidence.webm'));
        console.log("evidence.webm created successfully.");
    } else {
        console.error("No .webm file was generated.");
    }
  }
})();
