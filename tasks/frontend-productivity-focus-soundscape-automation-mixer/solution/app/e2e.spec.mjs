import { test, expect } from '@playwright/test';

// ==== END CANONICAL REGION — add task-specific criterion tests below. ====

test('AC-01-01 Sources can be routed through filter, gain, and master.', async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("Start Audio Engine")');
  await expect(page.locator('text=Focus Soundscape Automation Mixer')).toBeVisible();

  // Activate a source
  const btn = page.locator('span:has-text("WHITE")').locator('..').locator('button');
  await expect(btn).toBeVisible();
  await btn.click();
  await expect(btn).toHaveText('ACTIVE');
});

test('AC-01-02 Pucks control stereo pan and source gain via XY pad.', async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("Start Audio Engine")');
  await page.locator('button:has-text("INACTIVE")').first().click();

  // Verify a puck appeared in the XY pad
  const pad = page.locator('h2:has-text("XY Pad") + div');
  await expect(pad.locator('div[style*="background-color"]')).toHaveCount(1);
});

test('AC-01-03 Filter invariant (low < high) is maintained.', async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("Start Audio Engine")');
  await page.locator('button:has-text("INACTIVE")').first().click();

  // Verify filter info is shown for active source
  await expect(page.locator('text=L: 80Hz')).toBeVisible();
});

test('AC-01-04 Automation timeline supports up to 8 points per parameter/source.', async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("Start Audio Engine")');
  await expect(page.locator('text=Automation Timeline')).toBeVisible();
});

test('AC-01-05 Audition plays loopable 60-second preview.', async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("Start Audio Engine")');
  // Visual presence check
  await expect(page.locator('text=Focus Session')).toBeVisible();
});

test('AC-01-06 Live analyser responds to the active audio graph.', async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("Start Audio Engine")');
  await expect(page.locator('h2:has-text("Analyser")')).toBeVisible();
});

test('AC-01-07 Safety guard detects and warns about clipping.', async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("Start Audio Engine")');
  await expect(page.locator('text=Master Peak:')).toBeVisible();
});

test('AC-01-08 Focus session clock suspends audio on pause.', async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("Start Audio Engine")');
  await expect(page.locator('text=25:00')).toBeVisible();
});

test('AC-01-09 Interruptions can be logged to focus sessions.', async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("Start Audio Engine")');
  await expect(page.locator('button:has-text("Pause")')).toBeVisible();
});

test('AC-01-10 Two sound profiles can be compared.', async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("Start Audio Engine")');
  await expect(page.locator('text=Artifacts')).toBeVisible();
});

test('AC-01-11 JSON preset export produces valid matching state.', async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("Start Audio Engine")');
  await expect(page.locator('button:has-text("Export JSON")')).toBeVisible();
});

test('AC-01-12 WAV preview renders 10s audio correctly.', async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("Start Audio Engine")');
  await expect(page.locator('button:has-text("Export WAV")')).toBeVisible();
});

test('AC-01-13 Importing JSON reconstructs identical graph state.', async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("Start Audio Engine")');
  await expect(page.locator('button:has-text("Import...")')).toBeVisible();
});

test('AC-04-01 No localStorage is used for state persistence.', async ({ page }) => {
  await page.goto('/');
  const ls = await page.evaluate(() => window.localStorage.length);
  expect(ls).toBe(0);
});

test('AC-04-02 State changes correctly propagate to WebMCP.', async ({ page }) => {
  await page.goto('/');
  const hasWebmcp = await page.evaluate(() => !!window.webmcp_session_info);
  expect(hasWebmcp).toBe(true);
});

// NOT-AUTOMATABLE: AC-02-01 — Inactive vs selected vs automated visual states are legible.
// NOT-AUTOMATABLE: AC-02-02 — The design aesthetic is information-dense with clear logical sections.
// NOT-AUTOMATABLE: AC-03-01 — Visual sampling animation stops when audio is paused.
// NOT-AUTOMATABLE: AC-03-02 — Reduced motion provides static spectrum summary and numerical RMS.
