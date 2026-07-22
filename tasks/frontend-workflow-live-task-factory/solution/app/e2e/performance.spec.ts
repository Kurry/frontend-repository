import { test } from '@playwright/test';
import { candidateProbe, cleanConsoleProbe, coldStartProbe, connectionsProbe, downloadProbe, filterProbe, importProbe, libraryProbe, mobileProbe, objectiveVisualProbe, paletteProbe, pauseProbe, persistenceProbe, pipelineProbe, reducedMotionProbe, rejectProbe, shellProbe, triageProbe, validationProbe, webmcpProbe } from './helpers';
import { frameRateProbe, transitionResponseProbe } from './helpers';

test.setTimeout(180_000);

test('9.1 cold_start_is_under_two_seconds', async ({ page }) => {
  await coldStartProbe(page);
});

test('9.2 console_is_clean', async ({ page }) => {
  await cleanConsoleProbe(page);
});

test('9.3 transitions_respond_under_100ms', async ({ page }) => {
  await transitionResponseProbe(page);
});

test('9.4 async_work_has_loading_indicators', async ({ page }) => {
  await pipelineProbe(page);
});

test('9.5 large_collections_render_without_lag', async ({ page }) => {
  await candidateProbe(page);
});

test('9.6 state_changes_remain_interactive', async ({ page }) => {
  await pauseProbe(page);
});

test('9.7 animations_maintain_smooth_frame_rate', async ({ page }) => {
  await frameRateProbe(page);
});

test('9.8 rapid_input_does_not_freeze', async ({ page }) => {
  await paletteProbe(page);
});
