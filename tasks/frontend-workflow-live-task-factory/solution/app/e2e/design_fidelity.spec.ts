import { test } from '@playwright/test';
import { candidateProbe, cleanConsoleProbe, connectionsProbe, downloadProbe, filterProbe, importProbe, libraryProbe, mobileProbe, objectiveVisualProbe, paletteProbe, pauseProbe, persistenceProbe, pipelineProbe, reducedMotionProbe, rejectProbe, shellProbe, triageProbe, validationProbe, webmcpProbe } from './helpers';

test('3.1 spacing_and_sizing_follow_scale', async ({ page }) => {
  await objectiveVisualProbe(page);
});

test('3.2 typography_matches_spec', async ({ page }) => {
  await objectiveVisualProbe(page);
});

test('3.3 layout_matches_reference', async ({ page }) => {
  await shellProbe(page);
});

test('3.4 specified_state_changes_animate', async ({ page }) => {
  await objectiveVisualProbe(page);
});

test('3.5 responsive_behavior_matches_reference', async ({ page }) => {
  await mobileProbe(page);
});

test('3.6 control_styling_matches_spec', async ({ page }) => {
  await objectiveVisualProbe(page);
});

test('3.7 typography_has_clear_hierarchy', async ({ page }) => {
  await objectiveVisualProbe(page);
});

test('3.8 component_states_match_spec', async ({ page }) => {
  await objectiveVisualProbe(page);
});

test('3.9 surface_treatments_match_spec', async ({ page }) => {
  await objectiveVisualProbe(page);
});

test('3.10 microinteractions_match_spec', async ({ page }) => {
  await objectiveVisualProbe(page);
});
