import { test } from '@playwright/test';
import { genericCriterion } from './helpers';

test('7.1 layout_adapts_desktop_to_mobile', async ({ page }) => {
  await genericCriterion(page, 'responsiveness', '7.1');
});

test('7.2 inspector_stacks_below_1024', async ({ page }) => {
  await genericCriterion(page, 'responsiveness', '7.2');
});

test('7.3 stepper_and_table_reflow_at_768', async ({ page }) => {
  await genericCriterion(page, 'responsiveness', '7.3');
});

test('7.4 no_viewport_overflow_at_375', async ({ page }) => {
  await genericCriterion(page, 'responsiveness', '7.4');
});

test('7.5 mobile_tap_targets_are_large_enough', async ({ page }) => {
  await genericCriterion(page, 'responsiveness', '7.5');
});

test('7.6 typography_resizes_across_breakpoints', async ({ page }) => {
  await genericCriterion(page, 'responsiveness', '7.6');
});

test('7.7 stacking_reflows_logically', async ({ page }) => {
  await genericCriterion(page, 'responsiveness', '7.7');
});

test('7.8 fixed_controls_remain_accessible', async ({ page }) => {
  await genericCriterion(page, 'responsiveness', '7.8');
});

test('7.9 resize_preserves_state', async ({ page }) => {
  await genericCriterion(page, 'responsiveness', '7.9');
});
