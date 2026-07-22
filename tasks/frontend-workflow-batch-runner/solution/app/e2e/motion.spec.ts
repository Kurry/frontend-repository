import { test } from '@playwright/test'
import { criterionProbe } from './helpers'

test.describe('motion rubric', () => {
  test('4.1 completed_items_staggered', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'completed_items_staggered'))
  test('4.2 progress_bar_eased', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'progress_bar_eased'))
  test('4.3 status_transition_motion', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'status_transition_motion'))
  test('4.4 queue_reorder_animation', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'queue_reorder_animation'))
  test('4.5 macro_flip_reconcile_motion', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'macro_flip_reconcile_motion'))
  test('4.6 hover_system', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'hover_system'))
  test('4.7 modal_enter_exit', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'modal_enter_exit'))
  test('4.8 inspector_slide', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'inspector_slide'))
  test('4.9 feedback_toasts', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'feedback_toasts'))
  test('4.10 reduced_motion_fallback', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'reduced_motion_fallback'))
})

