import { expect, test } from '@playwright/test';
import { candidateProbe, cleanConsoleProbe, connectionsProbe, downloadProbe, filterProbe, importProbe, libraryProbe, mobileProbe, nav, objectiveVisualProbe, paletteProbe, pauseProbe, persistenceProbe, pipelineProbe, reducedMotionProbe, rejectProbe, shellProbe, triageProbe, validationProbe, webmcpProbe } from './helpers';
import { countDeltaProbe, differentPackagesProbe, emptyLibraryProbe, interleavedRunProbe, roundTripProbe } from './helpers';

test.setTimeout(90_000);

test('14.1 multi_facet_reload_round_trip', async ({ page }) => {
  await persistenceProbe(page);
});

test('14.2 filter_bounds_derive_from_live_data', async ({ page }) => {
  await filterProbe(page);
});

test('14.3 triage_breakdown_tracks_reasons', async ({ page }) => {
  await rejectProbe(page);
});

test('14.4 run_echoes_into_library_and_palette', async ({ page }) => {
  await pipelineProbe(page);
  await nav(page, 'Library');
  await expect(page.getByText(/(?:Pull request|PR) #57/).first()).toBeVisible();
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+K' : 'Control+K');
  const search = page.getByLabel('Search repositories, pull requests, and packages');
  await search.fill('57');
  await expect(page.locator('.palette-group').filter({ hasText: 'Library packages' }).getByText(/PR #57/)).toBeVisible();
});

test('14.5 count_deltas_are_exact', async ({ page }) => {
  await countDeltaProbe(page);
});

test('14.6 different_prs_produce_different_packages', async ({ page }) => {
  await differentPackagesProbe(page);
});

test('14.7 interleaved_run_and_triage_stay_coherent', async ({ page }) => {
  await interleavedRunProbe(page);
});

test('14.8 library_empty_then_repopulated', async ({ page }) => {
  await emptyLibraryProbe(page);
});

test('14.9 export_import_round_trip_preserves_package', async ({ page }) => {
  await roundTripProbe(page);
});
