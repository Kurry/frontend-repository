import { test } from '@playwright/test'
import { criterionProbe } from './helpers'

test.describe('behavioral rubric', () => {
  test.setTimeout(90_000)
  test('14.1 multi_facet_seeded_reset', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'multi_facet_seeded_reset'))
  test('14.2 queue_order_round_trip', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'queue_order_round_trip'))
  test('14.3 rollups_track_step_states', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'rollups_track_step_states'))
  test('14.4 cross_view_echo_retry', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'cross_view_echo_retry'))
  test('14.5 count_delta_exact', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'count_delta_exact'))
  test('14.6 two_launches_differ_deterministically', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'two_launches_differ_deterministically'))
  test('14.7 interleaved_flows_intact', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'interleaved_flows_intact'))
  test('14.8 empty_to_repopulated_round_trip', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'empty_to_repopulated_round_trip'))
  test('14.9 durability_export_pipeline', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'durability_export_pipeline'))
  test('14.10 stop_all_export_truthful', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'stop_all_export_truthful'))
  test('14.11 export_import_reconstructs_run', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'export_import_reconstructs_run'))
})
