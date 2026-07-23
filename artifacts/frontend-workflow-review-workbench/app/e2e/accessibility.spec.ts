import { test } from '@playwright/test';
import { genericCriterion } from './helpers';

test('1.1 all_controls_keyboard_operable', async ({ page }) => {
  await genericCriterion(page, 'accessibility', '1.1');
});

test('1.2 modals_manage_focus', async ({ page }) => {
  await genericCriterion(page, 'accessibility', '1.2');
});

test('1.3 icons_and_badges_have_names', async ({ page }) => {
  await genericCriterion(page, 'accessibility', '1.3');
});

test('1.4 live_region_announcements', async ({ page }) => {
  await genericCriterion(page, 'accessibility', '1.4');
});

test('1.5 forms_have_explicit_labels', async ({ page }) => {
  await genericCriterion(page, 'accessibility', '1.5');
});

test('1.6 headings_follow_logical_order', async ({ page }) => {
  await genericCriterion(page, 'accessibility', '1.6');
});

test('1.7 breadcrumb_is_navigation_landmark', async ({ page }) => {
  await genericCriterion(page, 'accessibility', '1.7');
});

test('1.8 text_and_controls_have_contrast', async ({ page }) => {
  await genericCriterion(page, 'accessibility', '1.8');
});

test('1.9 status_never_color_only', async ({ page }) => {
  await genericCriterion(page, 'accessibility', '1.9');
});

test('1.10 reduced_motion_is_respected', async ({ page }) => {
  await genericCriterion(page, 'accessibility', '1.10');
});
