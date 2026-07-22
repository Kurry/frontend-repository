import { expect, test } from '@playwright/test';

test('a built-in color fork stays coherent across preview and artifact views', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/');
  await page.locator('[data-row="builtin-cupcake"] [data-select="builtin-cupcake"]').click();

  const primary = page.getByLabel('Primary color');
  await primary.focus();
  await primary.evaluate((input) => {
    input.value = '#123456';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  await expect(page.locator('#my-count')).toHaveText('1');
  await expect(page.locator('#theme-name')).toHaveValue('cupcake-edit');
  await expect(primary).toHaveValue('#123456');
  await expect(page.locator('[data-row^="custom-cupcake-edit"]')).toContainText('cupcake-edit');

  await page.getByRole('tab', { name: 'Component Variants' }).click();
  await expect(page.locator('[data-panel="variants"]')).toBeVisible();
  await expect(primary).toHaveValue('#123456');

  await page.locator('#theme-name').fill('evening-tide');
  await page.locator('#theme-name').press('Enter');
  await expect(page.locator('#my-themes')).toContainText('evening-tide');

  await page.getByRole('button', { name: /^CSS / }).click();
  await expect(page.getByRole('dialog', { name: 'Artifact Center' })).toBeVisible();
  await expect(page.locator('#artifact-code')).toContainText('[data-theme="evening-tide"]');
  await expect(page.locator('#artifact-code')).toContainText('--color-primary: #123456;');

  expect(pageErrors).toEqual([]);
});

test('declared-theme JSON preserves its generated timestamp through import', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /^CSS / }).click();
  await page.getByRole('tab', { name: 'JSON' }).click();

  const exported = await page.locator('#artifact-code').textContent();
  const before = JSON.parse(exported);
  await page.locator('#import-src').fill(exported);
  await page.getByRole('button', { name: 'Import Theme' }).click();

  await expect(page.locator('#theme-name')).toHaveValue('light-2');
  await expect(page.locator('#my-count')).toHaveText('1');
  const imported = JSON.parse(await page.locator('#artifact-code').textContent());
  expect(imported.generatedAt).toBe(before.generatedAt);
});

test('font controls export and import the public declared-theme enum', async ({ page }) => {
  await page.goto('/');

  for (const [label, declaredValue] of [
    ['Outfit', 'Outfit'],
    ['System', 'system-ui'],
    ['Serif', 'serif'],
    ['Mono', 'monospace'],
  ]) {
    await page.getByRole('button', { name: `Font family ${label}` }).click();
    await page.getByRole('button', { name: /^CSS / }).click();
    await page.getByRole('tab', { name: 'JSON' }).click();
    const exported = JSON.parse(await page.locator('#artifact-code').textContent());
    expect(exported.fontFamily).toBe(declaredValue);
    await page.locator('#import-src').fill(JSON.stringify(exported));
    await page.getByRole('button', { name: 'Import Theme' }).click();
    await expect(page.getByRole('button', { name: `Font family ${label}` })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Close artifact center' }).click();
  }
});

test('entity creation with initial tokens writes those tokens into the share hash', async ({ page, context }) => {
  await page.goto('/');
  const result = await page.evaluate(() => window.webmcp_invoke_tool('entity_create', {
    entity: 'theme',
    fields: {
      name: 'hash-ready',
      tokens: { colors: { '--color-primary': '#123456' } },
    },
  }));
  expect(result.ok).toBe(true);
  await expect(page.getByLabel('Primary color')).toHaveValue('#123456');

  const sharedUrl = page.url();
  expect(new URL(sharedUrl).hash).toMatch(/^#theme=/);
  const freshPage = await context.newPage();
  await freshPage.goto(sharedUrl);
  await expect(freshPage.locator('#theme-name')).toHaveValue('hash-ready');
  await expect(freshPage.getByLabel('Primary color')).toHaveValue('#123456');
});
