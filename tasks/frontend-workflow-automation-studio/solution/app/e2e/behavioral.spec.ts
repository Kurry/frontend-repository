import { test } from '@playwright/test'
import { criterionProbe } from './helpers'

test.describe('behavioral rubric', () => {
  test('14.1 multi_facet_reload_reset', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'multi_facet_reload_reset'))
  test('14.2 runs_ordering_derives_live', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'runs_ordering_derives_live'))
  test('14.3 derived_surfaces_input_sensitivity', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'derived_surfaces_input_sensitivity'))
  test('14.4 cross_view_echo_to_export', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'cross_view_echo_to_export'))
  test('14.5 count_delta_exact_on_run', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'count_delta_exact_on_run'))
  test('14.6 different_inputs_different_records', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'different_inputs_different_records'))
  test('14.7 interleaved_edit_and_run', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'interleaved_edit_and_run'))
  test('14.8 empty_and_repopulate_round_trip', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'empty_and_repopulate_round_trip'))
  test('14.9 full_pipeline_probe_to_export_text', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'full_pipeline_probe_to_export_text'))
})

