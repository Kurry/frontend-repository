import { test, expect } from './fixtures';
import { fillEvaluate, openApp, openSubmit, submitAndGetNewRun } from './helpers';

// NOT-AUTOMATABLE:
// - 15.5 body_copy_is_well_written — a five-point editorial-quality rating is subjective; browser automation cannot assign it honestly.

test.beforeEach(async ({ page }) => openApp(page));

test('15.1 headings_use_consistent_capitalization', async ({ page }) => {
  const headings = await page.locator('h1,h2,h3').allTextContents(); expect(headings).toContain('Pipeline board'); expect(headings).toContain('Data generation'); expect(headings.every((text) => text.trim() && text.trim() !== text.trim().toUpperCase())).toBe(true);
});

test('15.2 actions_use_specific_labels', async ({ page }) => {
  const labels = await page.getByRole('button').allTextContents(); expect(labels).toEqual(expect.arrayContaining(['Export runs', 'Submit job', 'Retry from checkpoint'])); expect(labels.map((x) => x.trim())).not.toEqual(expect.arrayContaining(['OK', 'Submit']));
});

test('15.3 errors_name_problem_and_fix', async ({ page }) => {
  await openSubmit(page); await expect(page.getByText('Dataset is missing. Select a dataset.')).toBeVisible(); await page.getByLabel('Epoch count').fill('51'); await expect(page.getByText('Count is invalid. Enter a whole number between 1 and 50.')).toBeVisible();
});

test('15.4 empty_states_explain_next_step', async ({ page }) => {
  await page.getByRole('button', { name: 'Datasets', exact: true }).click(); await page.getByLabel('Search datasets').fill('none'); await expect(page.getByRole('status')).toContainText('Try a different dataset name or clear the search.'); await expect(page.getByRole('button', { name: 'Clear search' })).toBeVisible();
});

test('15.6 terminology_is_consistent', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Pipeline board' })).toBeVisible(); await expect(page.locator('.rollup > div > span').filter({ hasText: /^Active jobs$/ })).toBeVisible(); const dialog = await openSubmit(page); await expect(page.getByRole('heading', { name: 'Submit a research job' })).toBeVisible(); await expect(dialog.getByRole('button', { name: 'Submit job' })).toBeVisible();
});

test('15.7 numbers_dates_and_units_are_consistent', async ({ page }) => {
  const costs = await page.locator('.run-meta span').filter({ hasText: /^\$/ }).allTextContents(); expect(costs.every((value) => /^\$\d+\.\d{2}$/.test(value))).toBe(true); await page.getByRole('button', { name: 'Datasets', exact: true }).click(); await expect(page.locator('.dataset-size').first()).toContainText(/\d[\d,]+ tasks/); await page.getByRole('button', { name: 'Pipeline board' }).click(); await expect(page.locator('.run-meta span').first()).toContainText(/\w{3} \d{1,2}, \d{2}:\d{2} [AP]M/);
});

test('15.8 success_messages_are_specific', async ({ page }) => {
  const dialog = await fillEvaluate(page); await submitAndGetNewRun(page, dialog); await expect(page.getByText(/run-\d+ submitted to aurora/).first()).toBeVisible();
});
