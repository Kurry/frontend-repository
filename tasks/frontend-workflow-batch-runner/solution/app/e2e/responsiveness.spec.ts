import { test } from '@playwright/test'
import { criterionProbe } from './helpers'

test.describe('responsiveness rubric', () => {
  test('7.1 layout_adapts_1440_to_375', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'layout_adapts_1440_to_375'))
  test('7.2 mobile_tap_targets', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'mobile_tap_targets'))
  test('7.3 typography_scales', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'typography_scales'))
  test('7.4 no_viewport_clipping', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'no_viewport_clipping'))
  test('7.5 sidebar_collapses_at_768', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'sidebar_collapses_at_768'))
  test('7.6 stacking_reflows_logically', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'stacking_reflows_logically'))
  test('7.7 touch_paths_work', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'touch_paths_work'))
  test('7.8 no_page_horizontal_scroll', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'no_page_horizontal_scroll'))
  test('7.9 grid_sizes_responsively', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'grid_sizes_responsively'))
  test('7.10 fixed_controls_reachable', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'fixed_controls_reachable'))
})

