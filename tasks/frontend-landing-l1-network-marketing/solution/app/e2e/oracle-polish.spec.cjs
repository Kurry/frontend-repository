const { test, expect } = require('@playwright/test');

test('light theme, complete chapters, and mega-menu dismissal remain observable', async ({ page }) => {
  const consoleErrors = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  const colors = await page.evaluate(() => ({
    body: getComputedStyle(document.body).color,
    background: getComputedStyle(document.body).backgroundColor,
  }));
  expect(colors).toEqual({ body: 'rgb(0, 0, 0)', background: 'rgb(255, 255, 255)' });

  // Chapter titles render ALL CAPS via text-transform (instruction-mandated
  // casing), so match the accessible name case-insensitively.
  for (const name of [/^developer resources$/i, /^solutions$/i, /^community$/i, /^news & stories$/i]) {
    await expect(page.getByRole('heading', { name })).toBeVisible();
  }

  await page.getByRole('button', { name: 'Open menu' }).click();
  const menu = page.getByRole('dialog', { name: 'Site menu' });
  await expect(menu).toBeVisible();
  await menu.click({ position: { x: 8, y: 100 } });
  await expect(menu).toBeHidden();
  await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused();
  expect(consoleErrors).toEqual([]);
});
