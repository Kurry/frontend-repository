import { expect, test, type Locator, type Page } from '@playwright/test';

async function openFresh(page: Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByText('Plausible Analytics', { exact: true })).toBeVisible();
}

function panel(page: Page, title: string): Locator {
  return page.locator('.panel').filter({ has: page.getByRole('heading', { name: title, exact: true }) });
}

async function rowNames(page: Page, title: string) {
  return panel(page, title).locator('.row .name').allTextContents();
}

async function listboxOptionCount(page: Page, name: string) {
  const trigger = page.getByRole('combobox', { name });
  await trigger.click();
  const count = await page.getByRole('listbox', { name }).getByRole('option').count();
  await page.keyboard.press('Escape');
  return count;
}

test('keyboard selectors close on Escape and sort reverses every breakdown panel', async ({ page }) => {
  await openFresh(page);
  const titles = ['Top sources', 'Top pages', 'Countries'];
  const original = await Promise.all(titles.map((title) => rowNames(page, title)));

  const site = page.getByRole('combobox', { name: 'Site' });
  await site.focus();
  await page.keyboard.press('Enter');
  await expect(site).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(site).toHaveAttribute('aria-expanded', 'false');
  await expect(site).toBeFocused();

  const sort = page.getByRole('combobox', { name: 'Sort breakdowns' });
  await sort.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(sort).toHaveText('Fewest visitors');
  for (let index = 0; index < titles.length; index += 1) {
    await expect.poll(() => rowNames(page, titles[index])).toEqual([...original[index]].reverse());
  }

  await page.keyboard.press('Enter');
  await page.keyboard.press('Home');
  await page.keyboard.press('Enter');
  await expect(sort).toHaveText('Most visitors');
  for (let index = 0; index < titles.length; index += 1) {
    await expect.poll(() => rowNames(page, titles[index])).toEqual(original[index]);
  }
});

test('breakdown keyboard filtering preserves row focus and visible focus treatment', async ({ page }) => {
  await openFresh(page);
  const google = panel(page, 'Top sources').getByRole('button', { name: /Filter by source Google/ });
  await google.focus();
  await expect(google).toBeFocused();
  const outlineBefore = await google.evaluate((element) => getComputedStyle(element).outlineStyle);
  expect(outlineBefore).not.toBe('none');
  await page.keyboard.press('Enter');
  await expect(google).toHaveAttribute('aria-pressed', 'true');
  await expect(google).toBeFocused();
  await expect(page.getByRole('group', { name: 'Source filter Google' })).toBeVisible();
});

test('Add site traps focus and Undo/Redo round-trips the selector count', async ({ page }) => {
  await openFresh(page);
  const initialCount = await listboxOptionCount(page, 'Site');
  const opener = page.getByRole('button', { name: 'Add site', exact: true });
  await opener.click();
  const dialog = page.getByRole('dialog', { name: 'Add site' });
  await expect(dialog).toBeVisible();
  const name = dialog.getByLabel('Site name');
  await expect(name).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(name).toBeFocused();

  await name.fill('Regression site');
  await dialog.getByLabel('Domain').fill('regression.example.dev');
  await dialog.getByLabel('Timezone').selectOption('UTC');
  await dialog.getByRole('button', { name: 'Add site' }).click();
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  expect(await listboxOptionCount(page, 'Site')).toBe(initialCount + 1);

  const undo = page.getByRole('button', { name: 'Undo' });
  const redo = page.getByRole('button', { name: 'Redo' });
  await expect(undo).toHaveAttribute('aria-disabled', 'false');
  await expect(redo).toHaveAttribute('aria-disabled', 'true');
  await undo.click();
  expect(await listboxOptionCount(page, 'Site')).toBe(initialCount);
  await expect(redo).toHaveAttribute('aria-disabled', 'false');
  await redo.click();
  expect(await listboxOptionCount(page, 'Site')).toBe(initialCount + 1);
});

test('three-dimensional empty intersection clears every derived surface and export', async ({ page }) => {
  await openFresh(page);
  await panel(page, 'Top sources').getByRole('button', { name: /Filter by source Google/ }).click();
  await panel(page, 'Top pages').getByRole('button', { name: /Filter by page \/pricing/ }).click();
  await panel(page, 'Countries').locator('.row').first().click();

  for (const value of await page.locator('.kpi .figure').all()) await expect(value).toHaveText(/^(0|0%|0s)$/);
  await expect(panel(page, 'Top sources').getByText('No data for this segment')).toBeVisible();
  await expect(panel(page, 'Top pages').getByText('No data for this segment')).toBeVisible();
  await expect(panel(page, 'Countries').getByText('No data for this segment')).toBeVisible();
  await expect(panel(page, 'Goals').getByText('No goals for this segment')).toBeVisible();
  await expect(panel(page, 'Funnel').getByText('No funnel for this segment')).toBeVisible();

  await page.getByRole('button', { name: 'Export report' }).click();
  const drawer = page.getByRole('dialog', { name: 'Export report' });
  await drawer.getByRole('button', { name: 'Breakdown CSV' }).click();
  await expect(drawer.locator('#preview-csv')).toHaveText('dimension,name,visitors');
  await expect(drawer.locator('#csv-note')).toContainText('header-only');
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
  await expect(page.getByRole('button', { name: 'Export report' })).toBeFocused();
});

test('export copy/download match the preview and empty segment validation names filters', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await openFresh(page);

  const exportButton = page.getByRole('button', { name: 'Export report' });
  await exportButton.click();
  const drawer = page.getByRole('dialog', { name: 'Export report' });
  const preview = await drawer.locator('#preview-json').textContent();
  await drawer.getByRole('button', { name: 'Copy' }).click();
  await expect(page.locator('.toast').filter({ hasText: 'Copied to clipboard' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(preview);
  const downloadPromise = page.waitForEvent('download');
  await drawer.getByRole('button', { name: 'Download' }).click();
  const download = await downloadPromise;
  expect(await download.createReadStream().then(async (stream) => {
    const chunks = [];
    for await (const chunk of stream!) chunks.push(chunk);
    return Buffer.concat(chunks).toString('utf8');
  })).toBe(preview);
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Save segment' }).click();
  const saveDialog = page.getByRole('dialog', { name: 'Save segment' });
  await saveDialog.getByLabel('Segment name').fill('No filters');
  await expect(saveDialog.getByRole('alert').filter({ hasText: 'filters field' })).toBeVisible();
  await expect(saveDialog.getByRole('button', { name: 'Save segment' })).toBeDisabled();
});

test('mobile header scrolls away instead of obscuring dashboard content', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 760 });
  await openFresh(page);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await page.evaluate(() => window.scrollTo(0, document.querySelector('main')!.offsetTop));
  const headerBottom = await page.locator('.topbar').evaluate((element) => element.getBoundingClientRect().bottom);
  expect(headerBottom).toBeLessThanOrEqual(0);
  await expect(page.locator('.kpi').first()).toBeVisible();
});
