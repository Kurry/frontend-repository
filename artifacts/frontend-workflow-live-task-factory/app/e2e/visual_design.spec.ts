import { test } from '@playwright/test';
import { candidateProbe, cleanConsoleProbe, connectionsProbe, downloadProbe, filterProbe, importProbe, libraryProbe, mobileProbe, objectiveVisualProbe, paletteProbe, pauseProbe, persistenceProbe, pipelineProbe, reducedMotionProbe, rejectProbe, shellProbe, triageProbe, validationProbe, webmcpProbe } from './helpers';

test('2.1 console_layout_anatomy', async ({ page }) => {
  await shellProbe(page);
});

test('2.2 mode_indicator_visually_unmistakable', async ({ page }) => {
  await objectiveVisualProbe(page);
});

test('2.3 stage_status_treatments_distinct', async ({ page }) => {
  await pipelineProbe(page);
});

test('2.4 reject_reason_badges_consistent', async ({ page }) => {
  await rejectProbe(page);
});

test('2.5 monospace_package_parts_labeled', async ({ page }) => {
  await libraryProbe(page);
});

test('2.6 verdict_treatments_semantic', async ({ page }) => {
  await pipelineProbe(page);
});

test('2.7 typography_and_spacing_rhythm', async ({ page }) => {
  await objectiveVisualProbe(page);
});

test('2.8 control_states_and_icon_set', async ({ page }) => {
  await objectiveVisualProbe(page);
});
