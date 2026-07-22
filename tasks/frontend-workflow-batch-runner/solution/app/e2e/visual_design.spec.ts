import { test } from '@playwright/test'
import { criterionProbe } from './helpers'

// NOT-AUTOMATABLE: holistic aesthetic originality, taste, and prose quality remain human judgments.
// These tests execute objective UI prerequisites and observable evidence for every criterion; they do not replace visual review.

test.describe('visual_design rubric', () => {
  test('3.1 workspace_layout_composition', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'workspace_layout_composition'))
  test('3.2 status_color_system', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'status_color_system'))
  test('3.3 concurrency_strip_states', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'concurrency_strip_states'))
  test('3.4 consistent_currency_format', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'consistent_currency_format'))
  test('3.5 active_job_highlight', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'active_job_highlight'))
  test('3.6 typography_hierarchy', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'typography_hierarchy'))
  test('3.7 spacing_rhythm', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'spacing_rhythm'))
  test('3.8 control_state_treatments', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'control_state_treatments'))
  test('3.9 single_icon_set', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'single_icon_set'))
  test('3.10 ics_monospace_block', async ({ page }, testInfo) => criterionProbe(page, testInfo, 'ics_monospace_block'))
})

