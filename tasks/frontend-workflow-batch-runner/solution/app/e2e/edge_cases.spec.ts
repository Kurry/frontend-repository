import { test } from '@playwright/test'
import { criterionProbe } from './helpers'

test.describe('edge_cases rubric', () => {
  test('4.1 empty_states_designed', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'empty_states_designed'))
  test('4.2 forms_validate_inline', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'forms_validate_inline'))
  test('4.3 errors_are_actionable', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'errors_are_actionable'))
  test('4.4 actions_show_confirmation', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'actions_show_confirmation'))
  test('4.5 simulated_work_shows_activity', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'simulated_work_shows_activity'))
  test('4.6 destructive_actions_guarded', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'destructive_actions_guarded'))
  test('4.7 nonobvious_controls_have_help', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'nonobvious_controls_have_help'))
  test('4.8 controls_use_semantic_tags', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'controls_use_semantic_tags'))
  test('4.9 modal_close_paths', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'modal_close_paths'))
  test('4.10 long_runs_show_progress', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'long_runs_show_progress'))
  test('4.11 import_invalid_leaves_run_unchanged', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'import_invalid_leaves_run_unchanged'))
  test('4.12 field_contract_rejects_overlong_name', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'field_contract_rejects_overlong_name'))
})

