import { test } from '@playwright/test'
import { criterionProbe } from './helpers'

test.describe('performance rubric', () => {
  test('9.1 cold_start_under_2s', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'cold_start_under_2s'))
  test('9.2 console_clean', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'console_clean'))
  test('9.3 interactions_respond_fast', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'interactions_respond_fast'))
  test('9.4 simulated_work_indicated', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'simulated_work_indicated'))
  test('9.5 large_grid_renders_smoothly', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'large_grid_renders_smoothly'))
  test('9.6 ui_interactive_during_run', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'ui_interactive_during_run'))
  test('9.7 animations_hold_frame_rate', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'animations_hold_frame_rate'))
  test('9.8 rapid_input_never_freezes', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'rapid_input_never_freezes'))
  test('9.9 extended_session_stable', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'extended_session_stable'))
  test('9.10 long_work_degrades_gracefully', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'long_work_degrades_gracefully'))
})

