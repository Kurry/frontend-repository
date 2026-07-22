import { test } from '@playwright/test';
import { candidateProbe, cleanConsoleProbe, connectionsProbe, downloadProbe, filterProbe, importProbe, libraryProbe, mobileProbe, objectiveVisualProbe, paletteProbe, pauseProbe, persistenceProbe, pipelineProbe, reducedMotionProbe, rejectProbe, shellProbe, triageProbe, validationProbe, webmcpProbe } from './helpers';
import { emptyLibraryProbe, failureRetryProbe, libraryDeleteProbe, libraryFilterProbe, roundTripProbe, viewRetentionProbe } from './helpers';

test.setTimeout(90_000);

test('6.1 demo_pipeline_flow_ends_at_bundle', async ({ page }) => {
  await pipelineProbe(page);
});

test('6.2 invalid_inputs_validated_inline_in_flows', async ({ page }) => {
  await validationProbe(page);
});

test('6.3 filter_changes_update_related_displays', async ({ page }) => {
  await filterProbe(page);
});

test('6.4 package_delete_flow_updates_all_surfaces', async ({ page }) => {
  await libraryDeleteProbe(page);
});

test('6.5 view_switches_retain_state', async ({ page }) => {
  await viewRetentionProbe(page);
});

test('6.6 emptied_library_shows_empty_state', async ({ page }) => {
  await emptyLibraryProbe(page);
});

test('6.7 filters_agree_across_surfaces', async ({ page }) => {
  await libraryFilterProbe(page);
});

test('6.8 collapsible_chrome_preserves_workflow', async ({ page }) => {
  await mobileProbe(page);
});

test('6.9 overlays_support_expected_flows', async ({ page }) => {
  await connectionsProbe(page);
});

test('6.10 failures_recover_without_reload', async ({ page }) => {
  await failureRetryProbe(page);
});

test('6.11 export_import_round_trip_flow', async ({ page }) => {
  await roundTripProbe(page);
});
