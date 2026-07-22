import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test('OpenUsage Web Console E2E Walkthrough', async ({ page }) => {
  await page.goto('/');

  await page.waitForTimeout(1000);

  // 1. Verify Connection Mode
  await page.click('button:has-text("Demo")');

  // 2. Start Refresh
  await page.click('button:has-text("Start Refresh")');

  await page.waitForTimeout(3000);

  // Expect providers to be visible - specify the heading explicitly
  await expect(page.locator('h3:has-text("Claude")').first()).toBeVisible();

  // 3. Pin Resources via WebMCP
  await page.evaluate(() => {
    (window as any).webmcp_invoke_tool('set_pin', { index: 0, providerId: 'claude', resourceId: 'claude-weekly' });
    (window as any).webmcp_invoke_tool('set_pin', { index: 1, providerId: 'codex', resourceId: 'codex-session' });
  });

  await page.waitForTimeout(500);
  await expect(page.locator('div:text-is("Claude - Claude Weekly")').first()).toBeVisible();
  await expect(page.locator('div:text-is("Codex - Codex Session")').first()).toBeVisible();

  // 4. Test Date Range Brushing via WebMCP
  await page.evaluate(() => {
    (window as any).webmcp_invoke_tool('set_range', { start: '2023-10-01', end: '2023-10-31' });
  });

  await page.waitForTimeout(500);

  // 5. Test Export
  const result = await page.evaluate(async () => {
    return await (window as any).webmcp_invoke_tool('export_workspace', {});
  });

  expect(result.success).toBe(true);
  expect(result.data).toContain('openusage-web-workspace/v1');

  await page.waitForTimeout(1000);

  // Close context to force video flush to disk BEFORE trying to copy it.
  await page.context().close();

  // Now copy it from the video path
  const videoPath = await page.video()?.path();
  if (videoPath) {
    fs.copyFileSync(videoPath, path.join(process.cwd(), 'evidence.webm'));
  }
});
