import { test } from '@playwright/test'
import { criterionProbe } from './helpers'

test.describe('user_flows rubric', () => {
  test('6.1 build_and_run_end_to_end', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'build_and_run_end_to_end'))
  test('6.2 invalid_forms_block_inline', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'invalid_forms_block_inline'))
  test('6.3 failure_recovery_flow', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'failure_recovery_flow'))
  test('6.4 selector_to_step_flow', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'selector_to_step_flow'))
  test('6.5 diff_two_runs_flow', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'diff_two_runs_flow'))
  test('6.6 schedule_round_trip_flow', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'schedule_round_trip_flow'))
  test('6.7 undo_timeline_flow', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'undo_timeline_flow'))
  test('6.8 sidebar_collapse_continuity', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'sidebar_collapse_continuity'))
  test('6.9 overlays_dismiss_cleanly', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'overlays_dismiss_cleanly'))
  test('6.10 flows_recover_without_reload', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'flows_recover_without_reload'))
})

