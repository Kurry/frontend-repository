import { test, expect } from './fixtures';
import { closeTopOverlay, openApp, openDetail, register } from './helpers';

test.beforeEach(async ({ page }) => openApp(page));

// NOT-AUTOMATABLE 11.1 coachmarks_tour_bonus: optional bonus absent from the required workflow.
// NOT-AUTOMATABLE 11.2 fleet_activity_feed_bonus: optional bonus absent from the required workflow.

test('11.3 printable_fleet_summary_bonus', async ({ page }) => {
  await page.getByRole('button', { name: 'Export fleet' }).first().click();
  const summary = page.getByRole('region', { name: 'Printable fleet summary' });
  await expect(summary).toContainText('Fleet total');
  await expect(summary).toContainText('9');
  await expect(page.getByRole('button', { name: 'Print summary' })).toBeVisible();
});

// NOT-AUTOMATABLE 11.4 backoff_visual_polish_bonus: whether a cue is aesthetically "extra polished" is subjective.

test('11.5 palette_fuzzy_match_bonus', async ({ page }) => {
  await page.keyboard.press('ControlOrMeta+k');
  await page.getByRole('searchbox', { name: 'Search commands' }).fill('AFch');
  await expect(page.getByRole('button', { name: /Jump to Aster Finch/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Jump to Boreal Echo/ })).toHaveCount(0);
});

// NOT-AUTOMATABLE 11.6 session_density_preference_bonus: optional bonus absent from the required workflow.
// NOT-AUTOMATABLE 11.7 console_brand_narrative_bonus: cohesion beyond Carbon defaults is a subjective design judgment.

test('11.8 timeline_deep_linking_bonus', async ({ page }) => {
  const panel = await openDetail(page, 'Cinder Vale');
  await panel.getByRole('tab', { name: 'History' }).click();
  await panel.locator('.timeline-label').filter({ hasText: /failed|retry/i }).first().click();
  await expect(panel.getByRole('tab', { name: 'Activity' })).toHaveAttribute('aria-selected', 'true');
  await expect(panel.locator('.step-row.is-highlighted')).toBeVisible();
});

test('11.9 export_diff_hint_bonus', async ({ page }) => {
  await page.getByRole('button', { name: 'Export fleet' }).first().click();
  await expect(page.locator('.export-change-hint')).toContainText('First snapshot in this session');
  await closeTopOverlay(page);
  await register(page, 'Diff Signal');
  await page.getByRole('button', { name: 'Export fleet' }).first().click();
  await expect(page.locator('.export-change-hint')).toContainText('Registry changes detected since the last export');
});

// NOT-AUTOMATABLE 11.10 competition_level_fleet_console: "competition-grade" is a holistic subjective judgment.
// NOT-AUTOMATABLE innovation.catchall innovation_catchall: identifying an unspecified noteworthy enhancement requires human judgment.
