import { test } from '@playwright/test'
import { criterionProbe } from './helpers'

test.describe('performance rubric', () => {
  test('9.1 cold_start_under_2s', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'cold_start_under_2s'))
  test('9.2 console_free_of_errors', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'console_free_of_errors'))
  test('9.3 transitions_respond_fast', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'transitions_respond_fast'))
  test('9.4 async_work_indicated', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'async_work_indicated'))
  test('9.5 long_console_smooth', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'long_console_smooth'))
  test('9.6 ui_interactive_during_run', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'ui_interactive_during_run'))
  test('9.7 animations_stay_smooth', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'animations_stay_smooth'))
  test('9.8 rapid_input_no_hangs', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'rapid_input_no_hangs'))
  test('9.9 extended_session_stable', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'extended_session_stable'))
  test('9.10 no_blank_loading_gaps', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'no_blank_loading_gaps'))
})

