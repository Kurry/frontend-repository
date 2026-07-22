import { test } from '@playwright/test';
import { candidateProbe, cleanConsoleProbe, connectionsProbe, downloadProbe, filterProbe, importProbe, libraryProbe, mobileProbe, objectiveVisualProbe, paletteProbe, pauseProbe, persistenceProbe, pipelineProbe, reducedMotionProbe, rejectProbe, shellProbe, triageProbe, validationProbe, webmcpProbe } from './helpers';
import { credentialExportProbe, credentialStorageProbe, crossViewCoherenceProbe, deterministicRunProbe, networkIsolationProbe } from './helpers';

test.setTimeout(180_000);

test('10.1 serves_and_runs_clean', async ({ page }) => {
  await cleanConsoleProbe(page);
});

test('10.2 demo_mode_makes_zero_outbound_requests', async ({ page }) => {
  await networkIsolationProbe(page);
});

test('10.3 credentials_held_in_memory_only', async ({ page }) => {
  await credentialStorageProbe(page);
});

test('10.4 exports_carry_no_credential_material', async ({ page }) => {
  await credentialExportProbe(page);
});

test('10.5 persistence_split_matches_contract', async ({ page }) => {
  await persistenceProbe(page);
});

test('10.6 shared_state_coherence_across_views', async ({ page }) => {
  await crossViewCoherenceProbe(page);
});

test('10.7 forms_validate_per_field_before_submit', async ({ page }) => {
  await validationProbe(page);
});

test('10.8 import_enforces_bundle_schema', async ({ page }) => {
  await importProbe(page);
});

test('10.9 fixture_data_is_api_shaped', async ({ page }) => {
  await downloadProbe(page);
});

test('10.10 demo_runs_are_deterministic', async ({ page }) => {
  await deterministicRunProbe(page);
});
