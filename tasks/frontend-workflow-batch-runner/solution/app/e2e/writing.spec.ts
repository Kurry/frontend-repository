import { test } from '@playwright/test'
import { criterionProbe } from './helpers'

// NOT-AUTOMATABLE: holistic aesthetic originality, taste, and prose quality remain human judgments.
// These tests execute objective UI prerequisites and observable evidence for every criterion; they do not replace visual review.

test.describe('writing rubric', () => {
  test('15.1 headings_consistent_capitalization', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'headings_consistent_capitalization'))
  test('15.2 actions_use_specific_labels', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'actions_use_specific_labels'))
  test('15.3 errors_name_problem_and_fix', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'errors_name_problem_and_fix'))
  test('15.4 empty_states_explain_next_step', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'empty_states_explain_next_step'))
  test('15.5 body_copy_is_well_written', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'body_copy_is_well_written'))
  test('15.6 terminology_is_consistent', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'terminology_is_consistent'))
  test('15.7 numbers_dates_units_consistent', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'numbers_dates_units_consistent'))
  test('15.8 success_messages_specific', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'success_messages_specific'))
})

