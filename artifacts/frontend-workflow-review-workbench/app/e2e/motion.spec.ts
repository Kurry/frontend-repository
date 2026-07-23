import { test } from '@playwright/test';
import { genericCriterion } from './helpers';

test('4.1 hover_animations_required', async ({ page }) => {
  await genericCriterion(page, 'motion', '4.1');
});

test('4.2 rerun_step_status_motion', async ({ page }) => {
  await genericCriterion(page, 'motion', '4.2');
});

test('4.3 gate_flip_emphasis_and_hero_crossfade', async ({ page }) => {
  await genericCriterion(page, 'motion', '4.3');
});

test('4.4 fix_and_recommendation_transitions', async ({ page }) => {
  await genericCriterion(page, 'motion', '4.4');
});

test('4.5 inspector_highlight_motion', async ({ page }) => {
  await genericCriterion(page, 'motion', '4.5');
});

test('4.6 stepper_and_unlock_motion', async ({ page }) => {
  await genericCriterion(page, 'motion', '4.6');
});

test('4.7 list_change_animations', async ({ page }) => {
  await genericCriterion(page, 'motion', '4.7');
});

test('4.8 overlay_transitions_timed', async ({ page }) => {
  await genericCriterion(page, 'motion', '4.8');
});

test('4.9 toasts_slide_autodismiss', async ({ page }) => {
  await genericCriterion(page, 'motion', '4.9');
});

test('4.10 reduced_motion_respected', async ({ page }) => {
  await genericCriterion(page, 'motion', '4.10');
});
