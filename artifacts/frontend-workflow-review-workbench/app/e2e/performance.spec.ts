import { test } from '@playwright/test';
import { genericCriterion } from './helpers';

test('9.1 cold_start_is_under_two_seconds', async ({ page }) => {
  await genericCriterion(page, 'performance', '9.1');
});

test('9.2 console_is_clean', async ({ page }) => {
  await genericCriterion(page, 'performance', '9.2');
});

test('9.3 transitions_respond_under_100ms', async ({ page }) => {
  await genericCriterion(page, 'performance', '9.3');
});

test('9.4 rerun_shows_progress_indicators', async ({ page }) => {
  await genericCriterion(page, 'performance', '9.4');
});

test('9.5 dense_views_render_without_lag', async ({ page }) => {
  await genericCriterion(page, 'performance', '9.5');
});

test('9.6 state_changes_remain_interactive', async ({ page }) => {
  await genericCriterion(page, 'performance', '9.6');
});

test('9.7 animations_maintain_smooth_frame_rate', async ({ page }) => {
  await genericCriterion(page, 'performance', '9.7');
});

test('9.8 rapid_input_does_not_freeze', async ({ page }) => {
  await genericCriterion(page, 'performance', '9.8');
});
