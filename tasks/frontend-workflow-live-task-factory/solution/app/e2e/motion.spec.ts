import { test } from '@playwright/test';
import { batchProbe, candidateProbe, cleanConsoleProbe, connectionsProbe, downloadProbe, filterProbe, importProbe, libraryProbe, mobileProbe, objectiveVisualProbe, paletteProbe, pauseProbe, persistenceProbe, pipelineProbe, reducedMotionProbe, rejectProbe, shellProbe, triageProbe, validationProbe, webmcpProbe } from './helpers';
import { streamingProbe, toastMotionProbe, transitionCountdownProbe, triageMotionProbe } from './helpers';

test('8.1 hover_system_present', async ({ page }) => {
  await objectiveVisualProbe(page);
});

test('8.2 streaming_affordance_active_then_stops', async ({ page }) => {
  await streamingProbe(page);
});

test('8.3 stage_transitions_and_countdown_tick', async ({ page }) => {
  await transitionCountdownProbe(page);
});

test('8.4 triage_cards_animate_between_columns', async ({ page }) => {
  await triageMotionProbe(page);
});

test('8.5 list_changes_animate', async ({ page }) => {
  await filterProbe(page);
});

test('8.6 palette_and_slideover_transitions', async ({ page }) => {
  await paletteProbe(page);
});

test('8.7 toasts_slide_and_auto_dismiss', async ({ page }) => {
  await toastMotionProbe(page);
});

test('8.8 reduced_motion_respected', async ({ page }) => {
  await reducedMotionProbe(page);
});

test('8.9 batch_progress_fills_continuously', async ({ page }) => {
  await batchProbe(page);
});
