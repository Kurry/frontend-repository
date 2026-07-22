import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: {
      dir: path.resolve('tasks/frontend-creative-tools-soundscape-scene-composer-constraint-canvas-rn-linear-views/environment/reference-screenshots'),
      size: { width: 1280, height: 720 },
    },
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  try {
    console.log('Navigating to app...');
    await page.goto('http://localhost:3000');

    console.log('Waiting for network idle...');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    console.log('Dragging record...');
    const recordToDrag = page.locator('div[draggable="true"]').nth(1);
    const targetBox = await page.locator('div:has-text("voice")').last().boundingBox();

    await recordToDrag.hover();
    await page.mouse.down();
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 5 });
    await page.mouse.up();

    console.log('Waiting to observe changes...');
    await page.waitForTimeout(2000);

    console.log('Undoing the drag via UI button...');
    const undoButton = page.locator('button[title="Undo (Ctrl+Z)"]');
    // Using force if necessary, or check if enabled
    if (await undoButton.isEnabled()) {
        await undoButton.click();
    } else {
        console.log("Undo button is not enabled, pressing Ctrl+Z instead...");
        await page.keyboard.press('Control+z');
    }

    console.log('Waiting to observe undo...');
    await page.waitForTimeout(2000);

    console.log('Redragging record using keyboard...');
    await recordToDrag.focus();
    await page.keyboard.press('ArrowRight');

    console.log('Waiting to observe keyboard action...');
    await page.waitForTimeout(2000);

    console.log('Done.');
  } catch (error) {
    console.error('Error during recording:', error);
  } finally {
    await context.close();
    await browser.close();
  }
})();
