import { test, expect } from '@playwright/test';

// ==== END CANONICAL REGION — add task-specific criterion tests below. ====

test('AC-01 signature_mutation', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Initial 4 seeded records
  await expect(page.getByRole('checkbox')).toHaveCount(4);

  // Select 2 items
  await page.getByRole('checkbox').nth(0).click();
  await page.getByRole('checkbox').nth(1).click();

  // Mutation
  await page.getByRole('button', { name: 'Reconcile Batch' }).click();

  // Verification
  await expect(page.getByRole('checkbox').nth(0)).toContainText('changed');
  await expect(page.getByRole('checkbox').nth(1)).toContainText('changed');
  await expect(page.getByText('1 operations')).toBeVisible(); // 1 initial derived calc, +1 mutation? Actually, just check if history grows.
});

test('AC-05 complete_user_flow', async ({ page }) => {
  await page.goto('http://localhost:3000');

  await page.getByRole('button', { name: '+ Create' }).click();
  await page.getByPlaceholder('Name').fill('New Color');
  await page.getByPlaceholder('#Hex').fill('#abcdef');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByRole('checkbox')).toHaveCount(5);
  await expect(page.getByText('New Color')).toBeVisible();
});

test('AC-11 linked_utility', async ({ page }) => {
  await page.goto('http://localhost:3000');

  await page.getByRole('checkbox').nth(2).click();
  await page.getByRole('button', { name: 'Reconcile Batch' }).click();

  await expect(page.getByRole('checkbox').nth(2)).toContainText('changed');
});

test('AC-02 visual_hierarchy', async ({ page }) => {
  // NOT-AUTOMATABLE: visual hierarchy
});

test('AC-03 causal_motion', async ({ page }) => {
  // NOT-AUTOMATABLE: causal motion
});

test('AC-04 schema_contract', async ({ page }) => {
  await page.goto('http://localhost:3000');

  await page.getByRole('checkbox').nth(0).click();
  await page.getByRole('button', { name: 'Reconcile Batch' }).click();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export Artifact' }).click();
  const download = await downloadPromise;

  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const json = JSON.parse(Buffer.concat(chunks).toString('utf8'));

  expect(json.schemaVersion).toBe('palette-simulation-v1');
  expect(json.records[0].status).toBe('changed');
});

test('AC-13 artifact_round_trip', async ({ page }) => {
  await page.goto('http://localhost:3000');

  await page.getByRole('checkbox').nth(2).click();
  await page.getByRole('button', { name: 'Reconcile Batch' }).click();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export Artifact' }).click();
  const download = await downloadPromise;

  const path = await download.path();

  // Undo mutation
  await page.getByRole('button', { name: 'Undo Last Mutation' }).click();
  await expect(page.getByRole('checkbox').nth(2)).toContainText('ready');

  // Import
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Import Artifact' }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(path);

  // Check restored state
  await expect(page.getByRole('checkbox').nth(2)).toContainText('changed');
});
