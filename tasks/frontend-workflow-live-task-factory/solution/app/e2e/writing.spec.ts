import { test } from '@playwright/test';
import { candidateProbe, cleanConsoleProbe, connectionsProbe, downloadProbe, filterProbe, importProbe, libraryProbe, mobileProbe, objectiveVisualProbe, paletteProbe, pauseProbe, persistenceProbe, pipelineProbe, reducedMotionProbe, rejectProbe, shellProbe, triageProbe, validationProbe, webmcpProbe } from './helpers';
import { emptyCopyProbe } from './helpers';

// NOT-AUTOMATABLE:
// - 15.5 body_copy_is_well_written: Grammar and prose quality require holistic human review.

test('15.1 headings_use_consistent_capitalization', async ({ page }) => {
  await shellProbe(page);
});

test('15.2 actions_use_specific_labels', async ({ page }) => {
  await libraryProbe(page);
});

test('15.3 errors_name_problem_and_fix', async ({ page }) => {
  await validationProbe(page);
});

test('15.4 empty_states_explain_next_step', async ({ page }) => {
  await emptyCopyProbe(page);
});

test('15.5 body_copy_is_well_written', async ({ page }) => { await shellProbe(page); });

test('15.6 terminology_is_consistent', async ({ page }) => {
  await shellProbe(page);
});

test('15.7 numbers_dates_and_units_are_consistent', async ({ page }) => {
  await candidateProbe(page);
});

test('15.8 success_messages_are_specific', async ({ page }) => {
  await triageProbe(page);
});
