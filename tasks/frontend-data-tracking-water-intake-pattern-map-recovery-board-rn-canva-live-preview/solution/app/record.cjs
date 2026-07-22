const { chromium } = require('playwright');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

async function run() {
  const server = exec('npm start');
  await new Promise(r => setTimeout(r, 4000));

  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: { dir: '.' },
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // 1. Move a failed record into a recovery path
    // Let's find the "Failed Coffee" record (which starts as 'empty')
    await page.click('text=Failed Coffee');

    // We are now on the Recovery Board since it's selected.
    await page.waitForTimeout(1000);

    // Click "Draft" in the recovery board
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const draftBtn = buttons.find(b => b.textContent.includes('Draft'));
      if(draftBtn) draftBtn.click();
    });
    await page.waitForTimeout(1000);

    // Click "Archived" in the recovery board
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const archivedBtn = buttons.find(b => b.textContent.includes('Archived'));
      if(archivedBtn) archivedBtn.click();
    });
    await page.waitForTimeout(1000);

    // 2. Undo the last mutation
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const undoBtn = buttons.find(b => b.textContent.includes('Undo'));
      if(undoBtn && !undoBtn.disabled) undoBtn.click();
    });
    await page.waitForTimeout(1000);

    // 3. Export the completed artifact
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const exportBtn = buttons.find(b => b.textContent.includes('Export Session'));
      if(exportBtn) exportBtn.click();
    });
    await page.waitForTimeout(2000);

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await context.close();
    await browser.close();
    server.kill();

    // Rename the recorded video to evidence.webm
    const files = fs.readdirSync('.');
    // Find files matching Playwright's generated webm names (not evidence.webm)
    const videoFiles = files.filter(f => f.endsWith('.webm') && f !== 'evidence.webm');

    if (videoFiles.length > 0) {
      // Overwrite the existing evidence.webm if needed
      if(fs.existsSync('evidence.webm')) {
        fs.unlinkSync('evidence.webm');
      }

      const newestVideo = videoFiles.sort((a, b) => fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime())[0];
      fs.renameSync(newestVideo, 'evidence.webm');
      console.log('Successfully recorded evidence.webm');
    } else {
      console.error('No video file found');
    }
    process.exit(0);
  }
}

run();
