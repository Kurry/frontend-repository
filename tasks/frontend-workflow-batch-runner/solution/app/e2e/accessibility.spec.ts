import { test } from '@playwright/test'
import { criterionProbe } from './helpers'

test.describe('accessibility rubric', () => {
  test('1.1 keyboard_reaches_everything', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'keyboard_reaches_everything'))
  test('1.2 modals_manage_focus', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'modals_manage_focus'))
  test('1.3 icons_have_labels', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'icons_have_labels'))
  test('1.4 run_events_announced', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'run_events_announced'))
  test('1.5 forms_have_explicit_labels', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'forms_have_explicit_labels'))
  test('1.6 headings_follow_order', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'headings_follow_order'))
  test('1.7 landmarks_present', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'landmarks_present'))
  test('1.8 contrast_sufficient', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'contrast_sufficient'))
  test('1.9 semantic_roles_used', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'semantic_roles_used'))
  test('1.10 reduced_motion_respected', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'reduced_motion_respected'))
  test('1.11 keyboard_queue_reorder', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'keyboard_queue_reorder'))
  test('1.12 diff_not_color_only', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'diff_not_color_only'))
})

