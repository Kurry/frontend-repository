import { test } from '@playwright/test';
import { genericCriterion } from './helpers';

test('2.1 single_store_coherence', async ({ page }) => {
  await genericCriterion(page, 'technical', '2.1');
});

test('2.2 no_storage_reload_seeded', async ({ page }) => {
  await genericCriterion(page, 'technical', '2.2');
});

test('2.5 console_clean_through_flows', async ({ page }) => {
  await genericCriterion(page, 'technical', '2.5');
});

test('2.6 cold_load_interactive_2s', async ({ page }) => {
  await genericCriterion(page, 'technical', '2.6');
});

test('2.7 responsive_during_rerun', async ({ page }) => {
  await genericCriterion(page, 'technical', '2.7');
});

test('2.8 selection_state_single_source', async ({ page }) => {
  await genericCriterion(page, 'technical', '2.8');
});

test('2.9 derived_values_arithmetically_consistent', async ({ page }) => {
  await genericCriterion(page, 'technical', '2.9');
});

test('2.12 app_serves_documented_path', async ({ page }) => {
  await genericCriterion(page, 'technical', '2.12');
});

test('2.14 export_import_share_field_contract', async ({ page }) => {
  await genericCriterion(page, 'technical', '2.14');
});
