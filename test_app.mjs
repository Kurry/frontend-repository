import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');

  // Verify WebMCP tools change UI
  // Wait for window.webmcp_invoke_tool to exist
  await page.waitForFunction(() => typeof window.webmcp_invoke_tool === 'function');

  await page.evaluate(async () => {
    await window.webmcp_invoke_tool('editor_add', { objectType: 'prompt-node' });
  });

  await page.waitForTimeout(500);

  // Take screenshot
  await page.screenshot({ path: 'screenshot_webmcp.png', fullPage: true });
  console.log('Screenshot saved to screenshot_webmcp.png');

  await browser.close();
})();
