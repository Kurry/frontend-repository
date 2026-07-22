import { test } from '@playwright/test';

test.setTimeout(90_000);
import { candidateProbe, cleanConsoleProbe, connectionsProbe, downloadProbe, filterProbe, importProbe, libraryProbe, mobileProbe, objectiveVisualProbe, paletteProbe, pauseProbe, persistenceProbe, pipelineProbe, reducedMotionProbe, rejectProbe, shellProbe, triageProbe, validationProbe, webmcpProbe } from './helpers';
import { batchProbe, credentialLifecycleProbe, failureRetryProbe, rateLimitProbe, roundTripProbe, trivialProbe } from './helpers';

test('5.1 demo_mode_default_populated', async ({ page }) => {
  await shellProbe(page);
});

test('5.2 connections_panel_masked_credentials', async ({ page }) => {
  await connectionsProbe(page);
});

test('5.3 credential_connect_lifecycle', async ({ page }) => {
  await credentialLifecycleProbe(page);
});

test('5.4 pr_list_columns_and_paging', async ({ page }) => {
  await candidateProbe(page);
});

test('5.5 source_file_filter_and_issue_toggle', async ({ page }) => {
  await filterProbe(page);
});

test('5.6 pr_detail_changed_files_test_exclusion', async ({ page }) => {
  await candidateProbe(page);
});

test('5.7 triage_columns_and_reject_taxonomy', async ({ page }) => {
  await rejectProbe(page);
});

test('5.8 triage_stats_derive_live', async ({ page }) => {
  await triageProbe(page);
});

test('5.9 triage_undo_reverts_exactly', async ({ page }) => {
  await triageProbe(page);
});

test('5.10 pipeline_four_stages_with_statuses', async ({ page }) => {
  await pipelineProbe(page);
});

test('5.11 evaluate_streams_and_ends_with_verdict', async ({ page }) => {
  await pipelineProbe(page);
});

test('5.12 generate_streams_instruction_text', async ({ page }) => {
  await pipelineProbe(page);
});

test('5.13 stage_retry_resumes_from_failure', async ({ page }) => {
  await failureRetryProbe(page);
});

test('5.14 rate_limit_countdown_auto_retry', async ({ page }) => {
  test.setTimeout(90_000);
  await rateLimitProbe(page);
});

test('5.15 pause_resume_and_event_timeline', async ({ page }) => {
  await pauseProbe(page);
});

test('5.16 trivial_verdict_ends_run_without_package', async ({ page }) => {
  await trivialProbe(page);
});

test('5.17 package_four_parts_and_difficulty', async ({ page }) => {
  await libraryProbe(page);
});

test('5.18 package_copy_and_downloads_work', async ({ page }) => {
  await downloadProbe(page);
});

test('5.19 batch_run_and_bucketed_report', async ({ page }) => {
  await batchProbe(page);
});

test('5.20 library_listing_filters_and_reexport', async ({ page }) => {
  await libraryProbe(page);
});

test('5.21 import_bundle_validated_per_field', async ({ page }) => {
  await importProbe(page);
});

test('5.23 export_import_round_trip', async ({ page }) => {
  await roundTripProbe(page);
});

test('5.22 command_palette_and_coachmarks', async ({ page }) => {
  await paletteProbe(page);
});
