import { test } from '@playwright/test'
import { criterionProbe } from './helpers'

// NOT-AUTOMATABLE: holistic aesthetic originality, taste, and prose quality remain human judgments.
// These tests execute objective UI prerequisites and observable evidence for every criterion; they do not replace visual review.

test.describe('innovation rubric', () => {
  test('11.1 delightful_microinteractions', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'delightful_microinteractions'))
  test('11.2 advanced_motion_mechanics', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'advanced_motion_mechanics'))
  test('11.3 guided_onboarding', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'guided_onboarding'))
  test('11.4 run_activity_feed', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'run_activity_feed'))
  test('11.5 alternative_input_support', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'alternative_input_support'))
  test('11.6 preference_personalization', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'preference_personalization'))
  test('11.7 polished_product_narrative', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'polished_product_narrative'))
  test('11.8 dynamic_theming', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'dynamic_theming'))
  test('11.9 printable_run_summary', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'printable_run_summary'))
  test('11.10 competition_level_polish', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'competition_level_polish'))
  test('innovation.catchall innovation_catchall', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'innovation_catchall'))
})

