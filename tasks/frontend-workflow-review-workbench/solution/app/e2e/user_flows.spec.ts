import { test } from '@playwright/test';
import { genericCriterion } from './helpers';

test('6.1 clean_bundle_certification_flow', async ({ page }) => {
  await genericCriterion(page, 'user_flows', '6.1');
});

test('6.2 gate_flip_rerun_flow', async ({ page }) => {
  await genericCriterion(page, 'user_flows', '6.2');
});

test('6.3 trial_audit_flow', async ({ page }) => {
  await genericCriterion(page, 'user_flows', '6.3');
});

test('6.4 fix_list_to_approval_flow', async ({ page }) => {
  await genericCriterion(page, 'user_flows', '6.4');
});

test('6.5 honest_override_flow', async ({ page }) => {
  await genericCriterion(page, 'user_flows', '6.5');
});

test('6.6 step_gating_flow_integrity', async ({ page }) => {
  await genericCriterion(page, 'user_flows', '6.6');
});

test('6.7 portfolio_filter_flow', async ({ page }) => {
  await genericCriterion(page, 'user_flows', '6.7');
});

test('6.8 breadcrumb_navigation_flow', async ({ page }) => {
  await genericCriterion(page, 'user_flows', '6.8');
});

test('6.9 overlays_support_expected_flows', async ({ page }) => {
  await genericCriterion(page, 'user_flows', '6.9');
});

test('6.10 flow_recovers_without_reload', async ({ page }) => {
  await genericCriterion(page, 'user_flows', '6.10');
});

test('6.11 mutation_to_export_flow', async ({ page }) => {
  await genericCriterion(page, 'user_flows', '6.11');
});

test('6.12 export_import_round_trip_flow', async ({ page }) => {
  await genericCriterion(page, 'user_flows', '6.12');
});
