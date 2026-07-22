import { test } from '@playwright/test'
import { criterionProbe } from './helpers'

// NOT-AUTOMATABLE: holistic aesthetic originality, taste, and prose quality remain human judgments.
// Every criterion still executes deterministic observable prerequisites; these checks do not replace human visual review.

test.describe('visual_design rubric', () => {
  test('2.1 layout_matches_anatomy', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'layout_matches_anatomy'))
  test('2.2 active_step_border_and_pulse', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'active_step_border_and_pulse'))
  test('2.3 inline_step_controls_consistent', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'inline_step_controls_consistent'))
  test('2.4 console_terminal_treatment', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'console_terminal_treatment'))
  test('2.5 clock_badge_small', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'clock_badge_small'))
  test('2.6 status_badges_distinct_everywhere', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'status_badges_distinct_everywhere'))
  test('2.7 diff_treatments_not_color_only', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'diff_treatments_not_color_only'))
  test('2.8 typography_hierarchy', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'typography_hierarchy'))
  test('2.9 spacing_rhythm', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'spacing_rhythm'))
  test('2.10 control_state_treatments', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'control_state_treatments'))
  test('2.11 single_icon_set', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'single_icon_set'))
})

