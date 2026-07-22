import { test } from '@playwright/test'
import { criterionProbe } from './helpers'

test.describe('accessibility rubric', () => {
  test('1.1 keyboard_reaches_everything', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'keyboard_reaches_everything'))
  test('1.2 dialogs_trap_and_return_focus', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'dialogs_trap_and_return_focus'))
  test('1.3 icons_and_images_labeled', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'icons_and_images_labeled'))
  test('1.4 live_announcements', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'live_announcements'))
  test('1.5 labeled_form_fields', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'labeled_form_fields'))
  test('1.6 heading_order_logical', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'heading_order_logical'))
  test('1.7 landmarks_present', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'landmarks_present'))
  test('1.8 contrast_sufficient', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'contrast_sufficient'))
  test('1.9 semantic_controls', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'semantic_controls'))
  test('1.10 state_not_color_only', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'state_not_color_only'))
})

