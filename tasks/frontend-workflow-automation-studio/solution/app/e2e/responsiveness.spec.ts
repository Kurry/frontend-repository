import { test } from '@playwright/test'
import { criterionProbe } from './helpers'

test.describe('responsiveness rubric', () => {
  test('7.1 desktop_to_mobile_adapts', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'desktop_to_mobile_adapts'))
  test('7.2 mobile_tap_targets', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'mobile_tap_targets'))
  test('7.3 typography_scales', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'typography_scales'))
  test('7.4 no_viewport_clipping', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'no_viewport_clipping'))
  test('7.5 sidebar_collapses_at_768', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'sidebar_collapses_at_768'))
  test('7.6 step_fields_wrap_at_narrow', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'step_fields_wrap_at_narrow'))
  test('7.7 panes_scroll_in_containers', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'panes_scroll_in_containers'))
  test('7.8 no_horizontal_page_scroll', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'no_horizontal_page_scroll'))
  test('7.9 stacking_order_logical', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'stacking_order_logical'))
  test('7.10 fixed_controls_reachable', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'fixed_controls_reachable'))
})

