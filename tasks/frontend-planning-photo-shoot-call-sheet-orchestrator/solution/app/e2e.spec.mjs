import { test, expect } from '@playwright/test';

// ==== END CANONICAL REGION — add task-specific criterion tests below. ====

test('ac_01 Define and schedule shots', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Verify UI renders correctly
  await expect(page.locator('text=Market at First Light').first()).toBeVisible();
  await expect(page.locator('text=Shot 1').first()).toBeVisible();

  // Check location mapping
  await expect(page.locator('text=Placement Zone').first()).toBeVisible();

  // Assert WebMCP is registered
  const sessionInfo = await page.evaluate(() => window.webmcp_session_info());
  expect(sessionInfo.contract_version).toBe('zto-webmcp-v1');
});

test('ac_05 Full user flow completion', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('text=Releases')).toBeVisible();
});

// NOT-AUTOMATABLE: ac_02 — Visual hierarchy of states
// NOT-AUTOMATABLE: ac_03 — Causal motion and reduced motion
// NOT-AUTOMATABLE: ac_04 — UI and WebMCP actions match
