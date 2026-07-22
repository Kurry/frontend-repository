import { test, expect } from './fixtures';
import { closeTopOverlay, fillRegister, importText, openApp, openDetail, openRegister, register, row } from './helpers';

test.beforeEach(async ({ page }) => openApp(page));

test('15.1 headings_consistent_capitalization', async ({ page }) => {
  await expect(page.getByText('Mission Control', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Agent registry' })).toBeVisible();
  const panel = await openDetail(page, 'Aster Finch');
  await expect(panel.getByRole('tab', { name: 'Configuration' })).toBeVisible();
  await expect(panel.getByRole('tab', { name: 'History' })).toBeVisible();
  await expect(panel.getByRole('tab', { name: 'Activity' })).toBeVisible();
});

test('15.2 actions_use_specific_verbs', async ({ page }) => {
  for (const label of ['Register Agent', 'Export fleet', 'Import fleet', 'Pause All', 'Resume All']) {
    await expect(page.getByRole('button', { name: label }).first()).toBeVisible();
  }
  await page.getByRole('button', { name: 'Export fleet' }).first().click();
  await expect(page.getByRole('button', { name: 'Copy', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Download', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /submit|^ok$/i })).toHaveCount(0);
});

test('15.3 errors_name_field_and_rule', async ({ page }) => {
  const modal = await openRegister(page);
  await fillRegister(page, modal);
  await modal.getByLabel('Name').fill('Aster Finch');
  await expect(modal.locator('#agent-name-error-msg')).toContainText('Name must be unique');
  await modal.getByLabel('Name').fill('Valid Signal');
  await modal.getByLabel('Access key').fill('short');
  await expect(modal.locator('#agent-access-key-error-msg')).toContainText('Access key must be 16 to 64 characters');
  await closeTopOverlay(page);
  const importModal = await importText(page, '{broken');
  await expect(importModal.locator('#fleet-json-import-error-msg')).toContainText(/malformed/i);
});

test('15.4 empty_states_explain_next_step', async ({ page }) => {
  await row(page, 'Boreal Sable').getByRole('button', { name: 'Retry' }).click();
  await page.getByRole('checkbox', { name: 'Error' }).check();
  await expect(page.getByText(/Filtered by/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Clear filter' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filter' }).click();
  const panel = await openDetail(page, 'Boreal Echo');
  await panel.getByRole('tab', { name: 'Activity' }).click();
  await expect(panel.getByRole('heading', { name: 'No prompts executed today' })).toBeVisible();
  await expect(panel.getByText(/Start a run to see/)).toBeVisible();
});

// NOT-AUTOMATABLE 15.5 body_copy_quality: holistic spelling/grammar quality is subjective language review.

test('15.6 agent_terminology_consistent', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Agent registry' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: /Agent/ })).toBeVisible();
  const panel = await openDetail(page, 'Aster Finch');
  await expect(panel).toContainText('Agent detail');
  await expect(panel.getByText(/\brow\b/i)).toHaveCount(0);
});

test('15.7 timestamps_and_counts_consistent', async ({ page }) => {
  await expect(row(page, 'Aster Finch').locator('time')).toHaveAttribute('datetime', /T/);
  const panel = await openDetail(page, 'Cinder Vale');
  await panel.getByRole('tab', { name: 'Activity' }).click();
  await expect(panel.getByText(/\d of 5 steps complete/)).toBeVisible();
  await expect(panel.getByText(/Attempt \d of 3/).first()).toBeVisible();
  await panel.getByRole('tab', { name: 'History' }).click();
  await expect(panel.locator('.timeline-item time').first()).toHaveAttribute('datetime', /T/);
});

test('15.8 success_messages_specific', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-write']);
  await register(page, 'Toast Signal');
  await expect(page.getByLabel('Notifications')).toContainText('Toast Signal registered');
  await page.getByRole('button', { name: 'Export fleet' }).first().click();
  await page.getByRole('button', { name: 'Copy', exact: true }).click();
  await expect(page.getByLabel('Notifications')).toContainText(/Fleet JSON copied/);
});
