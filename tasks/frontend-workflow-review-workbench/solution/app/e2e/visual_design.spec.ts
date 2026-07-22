import { test } from '@playwright/test';
import { genericCriterion } from './helpers';

// NOT-AUTOMATABLE: holistic aesthetic, prose-quality, and originality judgments remain human-review criteria; these tests verify their objective prerequisites only.

test('3.1 portfolio_and_workspace_composition', async ({ page }) => {
  await genericCriterion(page, 'visual_design', '3.1');
});

test('3.2 hero_state_treatments_fixed', async ({ page }) => {
  await genericCriterion(page, 'visual_design', '3.2');
});

test('3.3 gate_status_chip_palette', async ({ page }) => {
  await genericCriterion(page, 'visual_design', '3.3');
});

test('3.4 category_and_check_chip_treatments', async ({ page }) => {
  await genericCriterion(page, 'visual_design', '3.4');
});

test('3.5 threshold_markers_read_at_a_glance', async ({ page }) => {
  await genericCriterion(page, 'visual_design', '3.5');
});

test('3.6 typography_hierarchy', async ({ page }) => {
  await genericCriterion(page, 'visual_design', '3.6');
});

test('3.7 spacing_rhythm_consistent', async ({ page }) => {
  await genericCriterion(page, 'visual_design', '3.7');
});

test('3.8 control_states_distinct', async ({ page }) => {
  await genericCriterion(page, 'visual_design', '3.8');
});

test('3.9 single_icon_set', async ({ page }) => {
  await genericCriterion(page, 'visual_design', '3.9');
});

test('3.10 inspector_three_column_composition', async ({ page }) => {
  await genericCriterion(page, 'visual_design', '3.10');
});

test('3.15 export_drawer_monospace_preview', async ({ page }) => {
  await genericCriterion(page, 'visual_design', '3.15');
});
