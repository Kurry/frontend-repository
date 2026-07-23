import { test } from '@playwright/test'
import { criterionProbe } from './helpers'

test.describe('user_flows rubric', () => {
  // durability_pipeline_end_to_end waits up to 120s for the 240-item
  // simulated run to settle (real wall-clock timestamps); give the
  // surrounding test enough budget to still run its export/assert steps.
  test.setTimeout(150_000)
  test('6.1 compose_flow_lands_everywhere', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'compose_flow_lands_everywhere'))
  test('6.2 invalid_compose_inline_validation', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'invalid_compose_inline_validation'))
  test('6.3 edit_flow_updates_displays', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'edit_flow_updates_displays'))
  test('6.4 delete_flow_clears_surfaces', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'delete_flow_clears_surfaces'))
  test('6.5 run_view_switches_retain_state', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'run_view_switches_retain_state'))
  test('6.6 last_delete_reveals_empty_state', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'last_delete_reveals_empty_state'))
  test('6.7 timeline_filter_flow', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'timeline_filter_flow'))
  test('6.8 sidebar_collapse_continuity', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'sidebar_collapse_continuity'))
  test('6.9 overlays_support_flows', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'overlays_support_flows'))
  test('6.10 recovery_without_reload', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'recovery_without_reload'))
  test('6.11 durability_pipeline_end_to_end', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'durability_pipeline_end_to_end'))
  test('6.12 mutation_to_export_flow', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'mutation_to_export_flow'))
  test('6.13 export_import_round_trip_flow', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'export_import_round_trip_flow'))
})
