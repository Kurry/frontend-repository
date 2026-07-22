import { test } from '@playwright/test'
import { criterionProbe } from './helpers'

test.describe('technical rubric', () => {
  test('10.1 serves_clean_on_start_path', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'serves_clean_on_start_path'))
  test('10.2 shared_state_coherence', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'shared_state_coherence'))
  test('10.3 storage_stays_empty', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'storage_stays_empty'))
  test('10.4 reload_returns_seeded_baseline', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'reload_returns_seeded_baseline'))
  test('10.5 console_clean_under_exercise', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'console_clean_under_exercise'))
  test('10.6 no_outbound_requests', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'no_outbound_requests'))
  test('10.7 no_debug_artifacts', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'no_debug_artifacts'))
  test('10.8 rapid_input_stays_coherent', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'rapid_input_stays_coherent'))
  test('10.9 all_views_reachable', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'all_views_reachable'))
  test('10.10 interactive_within_two_seconds', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'interactive_within_two_seconds'))
})

