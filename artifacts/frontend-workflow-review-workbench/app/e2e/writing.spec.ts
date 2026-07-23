import { test } from '@playwright/test';
import { genericCriterion } from './helpers';

// NOT-AUTOMATABLE: holistic aesthetic, prose-quality, and originality judgments remain human-review criteria; these tests verify their objective prerequisites only.

test('15.1 headings_use_consistent_capitalization', async ({ page }) => {
  await genericCriterion(page, 'writing', '15.1');
});

test('15.2 actions_use_specific_labels', async ({ page }) => {
  await genericCriterion(page, 'writing', '15.2');
});

test('15.3 errors_name_problem_and_fix', async ({ page }) => {
  await genericCriterion(page, 'writing', '15.3');
});

test('15.4 empty_states_explain_next_step', async ({ page }) => {
  await genericCriterion(page, 'writing', '15.4');
});

test('15.5 body_copy_is_well_written', async ({ page }) => {
  await genericCriterion(page, 'writing', '15.5');
});

test('15.6 terminology_is_consistent', async ({ page }) => {
  await genericCriterion(page, 'writing', '15.6');
});

test('15.7 numbers_dates_and_units_are_consistent', async ({ page }) => {
  await genericCriterion(page, 'writing', '15.7');
});

test('15.8 success_messages_are_specific', async ({ page }) => {
  await genericCriterion(page, 'writing', '15.8');
});
