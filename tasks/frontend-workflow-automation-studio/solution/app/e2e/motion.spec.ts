import { test } from '@playwright/test'
import { criterionProbe } from './helpers'

test.describe('motion rubric', () => {
  test('8.1 active_step_fade', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'active_step_fade'))
  test('8.2 console_line_stagger', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'console_line_stagger'))
  test('8.3 drag_reorder_settles', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'drag_reorder_settles'))
  test('8.4 badge_and_countdown_motion', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'badge_and_countdown_motion'))
  test('8.5 modal_transitions', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'modal_transitions'))
  test('8.6 playground_match_emphasis', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'playground_match_emphasis'))
  test('8.7 copy_confirmation_transition', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'copy_confirmation_transition'))
  test('8.8 toasts_slide_and_dismiss', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'toasts_slide_and_dismiss'))
  test('8.9 hover_system', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'hover_system'))
  test('8.10 reduced_motion_respected', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'reduced_motion_respected'))
})

