import { test } from '@playwright/test';
import { candidateProbe, cleanConsoleProbe, connectionsProbe, downloadProbe, filterProbe, importProbe, libraryProbe, mobileProbe, objectiveVisualProbe, overlayClosePathsProbe, paletteProbe, pauseProbe, persistenceProbe, pipelineProbe, reducedMotionProbe, rejectProbe, shellProbe, triageProbe, validationProbe, webmcpProbe } from './helpers';
import { emptyStateProbe, libraryDeleteProbe } from './helpers';

test('4.1 empty_states_are_designed', async ({ page }) => {
  await emptyStateProbe(page);
});

test('4.2 forms_validate_inline_before_submit', async ({ page }) => {
  await validationProbe(page);
});

test('4.11 invalid_schema_version_rejected', async ({ page }) => {
  await importProbe(page);
});

test('4.3 errors_carry_status_and_fix', async ({ page }) => {
  await validationProbe(page);
});

test('4.4 actions_confirm_visibly', async ({ page }) => {
  await triageProbe(page);
});

test('4.5 async_work_shows_activity', async ({ page }) => {
  await pipelineProbe(page);
});

test('4.6 destructive_actions_guarded', async ({ page }) => {
  await libraryDeleteProbe(page);
});

test('4.7 guidance_for_non_obvious_controls', async ({ page }) => {
  await shellProbe(page);
});

test('4.8 controls_use_semantic_tags', async ({ page }) => {
  await shellProbe(page);
});

test('4.9 overlays_close_by_multiple_paths', async ({ page }) => {
  await overlayClosePathsProbe(page);
});

test('4.10 long_flows_show_progress', async ({ page }) => {
  await pipelineProbe(page);
});
