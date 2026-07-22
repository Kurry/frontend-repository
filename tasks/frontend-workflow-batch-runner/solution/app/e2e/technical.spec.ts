import { test } from '@playwright/test'
import { criterionProbe } from './helpers'

test.describe('technical rubric', () => {
  test('2.1 shared_state_coherence', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'shared_state_coherence'))
  test('2.2 no_storage_seeded_reload', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'no_storage_seeded_reload'))
  test('2.6 rapid_input_keeps_sync', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'rapid_input_keeps_sync'))
  test('2.8 all_views_reachable', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'all_views_reachable'))
})

