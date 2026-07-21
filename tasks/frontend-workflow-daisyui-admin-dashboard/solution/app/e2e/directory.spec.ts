import { expect, test, type Page } from '@playwright/test';

const sidebar = (page: Page) => page.getByRole('complementary', { name: 'Primary navigation' });

async function openAllUsers(page: Page) {
  await page.goto('/');
  await sidebar(page).getByRole('button', { name: 'All users', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'All users', exact: true })).toBeVisible();
}

async function openAddUser(page: Page) {
  await sidebar(page).getByRole('button', { name: 'Add user', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Add user', exact: true })).toBeVisible();
}

async function fillRequiredUser(page: Page, firstName: string, lastName: string, email: string) {
  await page.getByLabel('First name').fill(firstName);
  await page.getByLabel('Last name').fill(lastName);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Temporary password').fill('ValidPass42!');
}

function totalKpi(page: Page) {
  return page.locator('[aria-label="User KPIs"] .kpi-card').filter({ hasText: 'Total' }).locator('strong');
}

test('valid creation updates the row, KPI, pagination, logs, and both exports', async ({ page }) => {
  await openAllUsers(page);
  const before = Number(await totalKpi(page).textContent());
  await openAddUser(page);
  await fillRequiredUser(page, 'Ada', 'Lovelace', 'ada.distinctive@example.dev');
  await page.getByLabel('Send invitation after creating this user').check();
  await page.getByLabel('billing.view').check();

  const submit = page.getByRole('button', { name: 'Create user' });
  await expect(submit).toBeEnabled();
  await submit.click();

  await expect(page.getByRole('heading', { name: 'All users', exact: true })).toBeVisible();
  await expect(totalKpi(page)).toHaveText(String(before + 1));
  await expect(page.getByText('Ada Lovelace', { exact: true })).toBeVisible();
  await expect(page.getByText(`of ${before + 1}`, { exact: false })).toBeVisible();

  await page.getByRole('button', { name: 'Export directory', exact: true }).last().click();
  const jsonText = await page.locator('.export-drawer .preview').textContent();
  const report = JSON.parse(jsonText!);
  const ada = report.users.find((user: { email: string }) => user.email === 'ada.distinctive@example.dev');
  expect(ada).toMatchObject({ firstName: 'Ada', sendInvitation: true });
  expect(ada.permissions).toContain('billing.view');
  await page.getByRole('tab', { name: 'Users CSV' }).click();
  await expect(page.locator('.export-drawer .preview')).toContainText('ada.distinctive@example.dev');
  await page.getByRole('button', { name: 'Close export drawer' }).click();

  await sidebar(page).getByRole('button', { name: 'User logs', exact: true }).click();
  await expect(page.locator('.log-row').first()).toContainText('User created');
  await expect(page.locator('.log-row').first()).toContainText('ada.distinctive@example.dev');
});

test('invalid fields keep create disabled and clear named inline errors when corrected', async ({ page }) => {
  await page.goto('/');
  await openAddUser(page);
  const submit = page.getByRole('button', { name: 'Create user' });
  await expect(submit).toBeDisabled();

  await page.getByLabel('First name').fill('A'.repeat(41));
  await page.getByLabel('Last name').fill('Tester');
  await page.getByLabel('Email').fill('missing-domain');
  await page.getByLabel('Temporary password').fill('short');
  await expect(page.locator('#firstName-error')).toContainText('1 to 40');
  await expect(page.locator('#email-error')).toContainText('domain dot');
  await expect(page.locator('#temporaryPassword-error')).toContainText('at least 8');
  await expect(submit).toBeDisabled();

  await page.getByLabel('First name').fill('Valid');
  await page.getByLabel('Email').fill('valid@example.dev');
  await page.getByLabel('Temporary password').fill('ValidPass42!');
  await expect(page.locator('#firstName-error')).toBeEmpty();
  await expect(page.locator('#email-error')).toBeEmpty();
  await expect(page.locator('#temporaryPassword-error')).toBeEmpty();
  await expect(submit).toBeEnabled();
});

test('sidebar modes keep active navigation synchronized with their domain tables', async ({ page }) => {
  await page.goto('/');

  const roles = sidebar(page).getByRole('button', { name: 'Roles', exact: true });
  await roles.click();
  await expect(page.getByRole('heading', { name: 'Roles', exact: true })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Members' })).toBeVisible();
  await expect(roles).toHaveClass(/active/);

  const permissions = sidebar(page).getByRole('button', { name: 'Permissions', exact: true });
  await permissions.click();
  await expect(page.getByRole('heading', { name: 'Permissions', exact: true })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Permission IDs' })).toBeVisible();
  await expect(permissions).toHaveClass(/active/);
  await expect(roles).not.toHaveClass(/active/);
});

test('directory JSON import restores a created user and archive membership', async ({ page }) => {
  await openAllUsers(page);
  await openAddUser(page);
  await fillRequiredUser(page, 'Roundtrip', 'User', 'roundtrip.user@example.dev');
  await page.getByRole('button', { name: 'Create user' }).click();

  await page.getByRole('button', { name: 'Delete Mina' }).click();
  await page.getByRole('button', { name: 'Export directory', exact: true }).last().click();
  const report = await page.locator('.export-drawer .preview').textContent();
  await page.getByRole('button', { name: 'Close export drawer' }).click();

  await page.getByRole('button', { name: 'Delete Roundtrip' }).click();
  await expect(page.getByText('Roundtrip User', { exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'Import directory', exact: true }).click();
  const importDialog = page.getByRole('dialog', { name: 'Import directory' });
  await importDialog.getByLabel('Directory JSON text').fill(report!);
  await importDialog.getByRole('button', { name: 'Import directory', exact: true }).click();

  await expect(page.getByRole('status')).toContainText('Directory JSON was imported');
  await expect(page.getByText('Roundtrip User', { exact: true })).toBeVisible();
  await sidebar(page).getByRole('button', { name: 'Archive', exact: true }).click();
  await expect(page.getByText('Mina Park', { exact: true })).toBeVisible();
});

test('KPI trends render and command palette actions update the real shell', async ({ page }) => {
  await openAllUsers(page);
  const trends = page.locator('[aria-label="User KPIs"] .spark');
  await expect(trends).toHaveCount(4);
  for (const trend of await trends.all()) {
    const box = await trend.boundingBox();
    expect(box?.width).toBeGreaterThan(20);
    expect(box?.height).toBeGreaterThan(20);
  }

  const commandTrigger = page.getByRole('button', { name: 'Open Command palette' });
  await commandTrigger.click();
  await page.getByRole('button', { name: /Toggle theme/ }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await commandTrigger.click();
  await page.getByRole('dialog', { name: 'Command palette' }).getByRole('button', { name: /Export directory/ }).click();
  await expect(page.getByRole('dialog', { name: 'Export directory' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Export directory' })).toBeHidden();
  await expect(commandTrigger).toBeFocused();
});
