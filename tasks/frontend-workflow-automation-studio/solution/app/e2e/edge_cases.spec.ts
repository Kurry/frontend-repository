import { test } from '@playwright/test'
import { criterionProbe } from './helpers'

test.describe('edge_cases rubric', () => {
  test('4.1 double_run_single_execution', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'double_run_single_execution'))
  test('4.2 double_create_single_script', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'double_create_single_script'))
  test('4.3 delete_selected_script_empty_state', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'delete_selected_script_empty_state'))
  test('4.4 all_disabled_steps_run', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'all_disabled_steps_run'))
  test('4.5 empty_stacks_disable_undo_redo', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'empty_stacks_disable_undo_redo'))
  test('4.6 invalid_wait_fails_gracefully', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'invalid_wait_fails_gracefully'))
  test('4.7 stepless_script_state', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'stepless_script_state'))
  test('4.8 timeline_filter_empty_state', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'timeline_filter_empty_state'))
  test('4.9 jump_to_latest_visibility', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'jump_to_latest_visibility'))
  test('4.10 copy_matches_visible_preview', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'copy_matches_visible_preview'))
})

