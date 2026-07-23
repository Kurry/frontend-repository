import { test } from '@playwright/test';
import { candidateProbe, cleanConsoleProbe, connectionsProbe, downloadProbe, filterProbe, importProbe, libraryProbe, mobileProbe, objectiveVisualProbe, paletteProbe, pauseProbe, persistenceProbe, pipelineProbe, reducedMotionProbe, rejectProbe, shellProbe, triageProbe, validationProbe, webmcpProbe } from './helpers';

test('7.1 layout_adapts_desktop_to_mobile', async ({ page }) => {
  await mobileProbe(page);
});

test('7.2 mobile_tap_targets_are_large_enough', async ({ page }) => {
  await mobileProbe(page);
});

test('7.3 typography_resizes_across_breakpoints', async ({ page }) => {
  await mobileProbe(page);
});

test('7.4 content_avoids_clipping_and_overflow', async ({ page }) => {
  await mobileProbe(page);
});

test('7.5 chrome_adapts_to_small_screens', async ({ page }) => {
  await mobileProbe(page);
});

test('7.6 stacking_reflows_logically', async ({ page }) => {
  await mobileProbe(page);
});

test('7.7 mobile_touch_gestures_work', async ({ page }) => {
  await mobileProbe(page);
});

test('7.8 small_screens_avoid_horizontal_scroll', async ({ page }) => {
  await mobileProbe(page);
});

test('7.9 dense_tables_resize', async ({ page }) => {
  await mobileProbe(page);
});

test('7.10 fixed_controls_remain_accessible', async ({ page }) => {
  await mobileProbe(page);
});
