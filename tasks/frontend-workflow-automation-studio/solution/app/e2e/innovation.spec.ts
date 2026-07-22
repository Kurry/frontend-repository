import { test } from '@playwright/test'
import { criterionProbe } from './helpers'

// NOT-AUTOMATABLE: holistic aesthetic originality, taste, and prose quality remain human judgments.
// Every criterion still executes deterministic observable prerequisites; these checks do not replace human visual review.

test.describe('innovation rubric', () => {
  test('11.1 delightful_microinteractions', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'delightful_microinteractions'))
  test('11.2 advanced_motion_mechanics', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'advanced_motion_mechanics'))
  test('11.3 guided_onboarding', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'guided_onboarding'))
  test('11.4 extra_data_visualization', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'extra_data_visualization'))
  test('11.5 keyboard_first_editing', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'keyboard_first_editing'))
  test('11.6 personalization_touches', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'personalization_touches'))
  test('11.7 polished_narrative', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'polished_narrative'))
  test('11.8 celebration_moments', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'celebration_moments'))
  test('innovation.catchall innovation_catchall', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'innovation_catchall'))
})

