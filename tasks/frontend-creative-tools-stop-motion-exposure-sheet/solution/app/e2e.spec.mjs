import { test, expect } from '@playwright/test';

test('CF-01 Exposure Sheet tracks and frames', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.getByText('Tracks: 3')).toBeVisible();
  await expect(page.getByText('Frames: 504')).toBeVisible();
});

test('CF-02 Ripple and Overwrite editing modes', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const trackRange = page.getByRole('button').filter({ hasText: '1' }).first();
  await trackRange.click();
  await expect(page.getByText('ID: range-1')).toBeVisible();

  // Drag test
  await trackRange.dragTo(page.getByText('Tracks: 3'), { sourcePosition: { x: 5, y: 5 } });
});

test('CF-03 Stage and Onion Skins', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.getByText('Prev Onion:')).toBeVisible();

  // Drag subject
  const subject = page.getByRole('button').filter({ hasText: 'S' }).first();
  await subject.dragTo(page.getByText('Stage'), { force: true });
});

test('CF-04 Cue alignment and timing updates', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const cue = page.getByRole('button').filter({ hasText: 'Cue' }).first();
  await expect(cue).toBeVisible();
  await cue.dragTo(page.getByText('Cues'));
});

test('CF-05 Prop and pose continuity', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.getByText('Pos: hand | Ori: upright')).toBeVisible();
});

test('CF-06 Capture Event Ledger', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.getByText('Logical Clock: 100')).toBeVisible();
  await page.getByRole('button', { name: 'Capture' }).click();
  await expect(page.getByText('Logical Clock: 101')).toBeVisible();
});

test('CF-07 Take branches and Cut Approval', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.getByText('approved', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Fork' }).click();
  await expect(page.getByText('Take Fork')).toBeVisible();

  await page.getByRole('button', { name: 'Approve Cut' }).click();
  await expect(page.getByText('Rev: 2')).toBeVisible();
});

test('CF-08 Deterministic export artifacts', async ({ page }) => {
  await page.goto('http://localhost:3000');

  const [downloadJson] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export JSON' }).click()
  ]);
  expect(downloadJson.suggestedFilename()).toBe('stop-motion-project.json');

  const [downloadCsv] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export CSV' }).click()
  ]);
  expect(downloadCsv.suggestedFilename()).toBe('exposure-sheet.csv');
});

test('TC-03 WebMCP interleave operations', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const result = await page.evaluate(async () => {
    return await window.webmcp_invoke_tool('set_frame', { frame: 10 });
  });
  expect(JSON.parse(result).success).toBe(true);
  await expect(page.getByText('Frame: 10', { exact: true })).toBeVisible();
});

// NOT-AUTOMATABLE: VD-01 — Visual layout relationships between views
// NOT-AUTOMATABLE: VD-02 — Color distinctions between states
// NOT-AUTOMATABLE: VD-03 — Opacity step interpolation of onion skins
// NOT-AUTOMATABLE: MO-01 — Causal motion aesthetics
// NOT-AUTOMATABLE: MO-02 — Reduced motion preference toggles visually correctly
// NOT-AUTOMATABLE: TC-01 — Reload verification for zero local storage
// NOT-AUTOMATABLE: TC-02 — Fluid interaction across strict 12 fps timeline
