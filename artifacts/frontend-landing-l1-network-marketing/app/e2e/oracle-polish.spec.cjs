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

async function openPalette(page) {
  await page.getByRole('button', { name: 'Open command palette' }).click();
  return page.getByRole('dialog', { name: 'Command palette' });
}

async function openManager(page) {
  const palette = await openPalette(page);
  await palette.getByRole('button', { name: /Events Manager/i }).click();
  return page.getByRole('dialog', { name: 'Events Manager' });
}

async function openExport(page) {
  const palette = await openPalette(page);
  await palette.getByRole('button', { name: /Export Catalog/i }).click();
  return page.getByRole('dialog', { name: 'Export catalog' });
}

async function createEvent(manager, values = {}) {
  const title = values.title || 'Criterion Summit';
  await manager.getByRole('button', { name: 'Create event' }).first().click();
  const form = manager.page().getByRole('dialog', { name: 'Create event' });
  await form.getByLabel('Title').fill(title);
  await form.getByLabel(/Date/).fill(values.date || '2027-02-14');
  await form.getByLabel('City').fill(values.city || 'Detroit');
  await form.getByLabel('Category').selectOption(values.category || 'Summit');
  await form.getByLabel('Status').selectOption(values.status || 'upcoming');
  await form.getByRole('button', { name: 'Create Event' }).click();
  await expect(form).toBeHidden();
  return title;
}

test('1.8 contrast_light_and_dark_themes', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(await page.evaluate(() => ({ color: getComputedStyle(document.body).color, background: getComputedStyle(document.body).backgroundColor })))
    .toEqual({ color: 'rgb(0, 0, 0)', background: 'rgb(255, 255, 255)' });
  await page.getByRole('button', { name: /Switch to dark theme/ }).click();
  const dark = await page.evaluate(() => ({ color: getComputedStyle(document.body).color, background: getComputedStyle(document.body).backgroundColor }));
  expect(dark).toEqual({ color: 'rgb(255, 255, 255)', background: 'rgb(0, 0, 0)' });
});

test('1.7 deleted_event_removed', async ({ page }) => {
  await page.goto('/');
  const manager = await openManager(page);
  const title = await createEvent(manager);
  await manager.getByRole('button', { name: `Delete ${title}` }).click();
  await expect(manager.getByText(title)).toBeHidden();
});

test('1.8 empty_state_after_all_deleted', async ({ page }) => {
  await page.goto('/');
  const manager = await openManager(page);
  await manager.getByLabel('Select all events').check();
  await manager.getByRole('button', { name: /Delete selected \(/ }).first().click();
  await expect(manager.getByText(/No events found in the catalog/)).toBeVisible();
});

test('1.24 create_flow_cross_surface', async ({ page }) => {
  await page.goto('/');
  const manager = await openManager(page);
  const title = await createEvent(manager, { title: 'Cross Surface Summit' });
  await page.keyboard.press('Escape');
  await expect(manager).toBeHidden();
  await expect(page.locator('[data-events-listing]').getByText(title)).toBeVisible();
});

test('1.25 edit_flow_cross_surface', async ({ page }) => {
  await page.goto('/');
  const manager = await openManager(page);
  const row = manager.locator('tr', { hasText: 'Builder Meetup SF' });
  await row.getByRole('button', { name: 'Edit' }).click();
  const form = page.getByRole('dialog', { name: 'Edit event' });
  await form.getByLabel('Title').fill('Edited Builder Meetup');
  await form.getByRole('button', { name: 'Save Changes' }).click();
  await expect(manager.getByRole('cell', { name: 'Edited Builder Meetup', exact: true })).toBeVisible();
});

test('1.26 delete_flow_cross_surface', async ({ page }) => {
  await page.goto('/');
  const manager = await openManager(page);
  await manager.getByRole('button', { name: 'Delete Builder Meetup SF' }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-events-listing]').getByText('Builder Meetup SF')).toHaveCount(0);
});

test('1.27 theme_flow_preserves_state', async ({ page }) => {
  await page.goto('/');
  const manager = await openManager(page);
  const title = await createEvent(manager, { title: 'Theme State Event' });
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /Switch to dark theme/ }).click();
  const reopened = await openManager(page);
  await expect(reopened.getByText(title)).toBeVisible();
});

test('1.29 double_submit_adds_one_event', async ({ page }) => {
  await page.goto('/');
  const manager = await openManager(page);
  await manager.getByRole('button', { name: 'Create event' }).first().click();
  const form = page.getByRole('dialog', { name: 'Create event' });
  await form.getByLabel('Title').fill('Single Commit Event');
  await form.getByLabel(/Date/).fill('2027-03-01');
  await form.getByLabel('City').fill('Detroit');
  await form.getByRole('button', { name: 'Create Event' }).dblclick();
  await expect(manager.getByText('Single Commit Event')).toHaveCount(1);
});

test('1.31 empty_state_create_control', async ({ page }) => {
  await page.goto('/');
  const manager = await openManager(page);
  await manager.getByLabel('Select all events').check();
  await manager.getByRole('button', { name: /Delete selected \(/ }).first().click();
  await manager.getByRole('button', { name: 'Create event' }).last().click();
  await expect(page.getByRole('dialog', { name: 'Create event' })).toBeVisible();
});

test('1.34 featured_flag_surfaces_on_landing', async ({ page }) => {
  await page.goto('/');
  const manager = await openManager(page);
  await manager.getByRole('button', { name: 'Create event' }).first().click();
  const form = page.getByRole('dialog', { name: 'Create event' });
  await form.getByLabel('Title').fill('Featured Criterion Event');
  await form.getByLabel(/Date/).fill('2027-04-01');
  await form.getByLabel('City').fill('Detroit');
  await form.getByLabel('Featured Event').check();
  await form.getByRole('button', { name: 'Create Event' }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Featured Criterion Event', exact: true })).toBeVisible();
});

test('1.39 bulk_delete_selected_removes_all', async ({ page }) => {
  await page.goto('/');
  const manager = await openManager(page);
  const rows = manager.locator('tbody tr');
  const before = await rows.count();
  await rows.nth(0).getByRole('checkbox').check();
  await rows.nth(1).getByRole('checkbox').check();
  await manager.getByRole('button', { name: /Delete selected \(2\)/ }).first().click();
  await expect(rows).toHaveCount(before - 2);
});

test('1.44 undo_restores_deleted_event', async ({ page }) => {
  await page.goto('/');
  const manager = await openManager(page);
  await manager.getByRole('button', { name: 'Delete Builder Meetup SF' }).click();
  await manager.getByRole('button', { name: 'Undo last change' }).click();
  await expect(manager.getByRole('cell', { name: 'Builder Meetup SF', exact: true })).toBeVisible();
  await manager.getByRole('button', { name: 'Redo last change' }).click();
  await expect(manager.getByRole('cell', { name: 'Builder Meetup SF', exact: true })).toBeHidden();
});

test('1.49 undo_last_lead_decrements', async ({ page }) => {
  await page.goto('/');
  for (const [name, email] of [['First Lead', 'first@example.com'], ['Second Lead', 'second@example.com']]) {
    await page.getByLabel('Name').fill(name);
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Interest').selectOption('Build');
    await page.getByLabel(/privacy policy/).check();
    await page.getByRole('button', { name: 'Send contact request' }).click();
    await page.getByRole('button', { name: 'Send another' }).click();
  }
  await expect(page.getByText('Total: 2')).toBeVisible();
  await page.getByRole('button', { name: 'Undo last lead' }).click();
  await expect(page.getByText('Total: 1')).toBeVisible();
  await expect(page.getByText('Second Lead')).toHaveCount(0);
  await expect(page.getByText('First Lead')).toBeVisible();
});

test('1.51 event_field_contract_enums_and_featured', async ({ page }) => {
  await page.goto('/');
  const manager = await openManager(page);
  await manager.getByRole('button', { name: 'Create event' }).first().click();
  const form = page.getByRole('dialog', { name: 'Create event' });
  await form.getByRole('button', { name: 'Create Event' }).click();
  await expect(form.locator('#ef-title-err')).toBeVisible();
  await expect(form.locator('#ef-date-err')).toBeVisible();
  await form.getByLabel('Featured Event').check();
  await expect(form.getByLabel('Status')).toHaveValue('featured');
});

test('3.4 specified_motion_states_present', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 700 });
  await page.goto('/');
  const hero = page.locator('.hero-plane');
  await expect.poll(async () => (await hero.evaluate(el => getComputedStyle(el).clipPath))).not.toBe('inset(0%)');
  await page.locator('#getStarted').scrollIntoViewIfNeeded();
  await expect(page.locator('#trio')).toHaveClass(/trio-in/);
  await page.locator('#events').scrollIntoViewIfNeeded();
  await expect(page.locator('#eventsHeadline span').first()).toBeVisible();
  await page.getByRole('button', { name: /Switch to dark theme/ }).click();
  await expect(page.locator('.theme-icon-swap')).toBeVisible();
});

test('4.7 invalid_create_leaves_count_unchanged', async ({ page }) => {
  await page.goto('/');
  const manager = await openManager(page);
  const before = await manager.locator('tbody tr').count();
  await manager.getByRole('button', { name: 'Create event' }).first().click();
  const form = page.getByRole('dialog', { name: 'Create event' });
  await form.getByRole('button', { name: 'Create Event' }).click();
  await expect(form.locator('#ef-title-err')).toBeVisible();
  await form.getByRole('button', { name: 'Cancel' }).click();
  await expect(manager.locator('tbody tr')).toHaveCount(before);
});

test('4.13 malformed_import_leaves_collection', async ({ page }) => {
  await page.goto('/');
  const dialog = await openExport(page);
  const before = JSON.parse(await dialog.getByLabel('JSON preview').textContent()).counts.events;
  await dialog.getByLabel('Or paste catalog JSON').fill('{"version":1,"events":"bad"}');
  await dialog.getByRole('button', { name: 'Load pasted catalog' }).click();
  await expect(dialog.getByRole('alert')).toContainText('catalog');
  expect(JSON.parse(await dialog.getByLabel('JSON preview').textContent()).counts.events).toBe(before);
});

test('innovation.catchall innovation_catchall', async ({ page }) => {
  await page.goto('/');
  const manager = await openManager(page);
  await expect(manager.getByLabel('Catalog pulse')).toContainText(/active cities/);
  await expect(manager.getByLabel('Catalog pulse')).toContainText(/Next:/);
});

test('4.12 form_success_transitions_in', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Name').fill('Motion Lead');
  await page.getByLabel('Email').fill('motion@example.com');
  await page.getByLabel('Interest').selectOption('Build');
  await page.getByLabel(/privacy policy/).check();
  await page.getByRole('button', { name: 'Send contact request' }).click();
  const success = page.getByRole('status').filter({ hasText: 'Message Sent' });
  await expect(success).toBeVisible();
  expect(await success.evaluate(el => getComputedStyle(el).animationName)).toBe('ridge-success-in');
});

test('4.13 smooth_inertial_scroll', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/lenis/);
  await page.mouse.wheel(0, 900);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  await expect(page.locator('#chrome')).toHaveCSS('position', 'sticky');
});

test('2.8 keyboard_operable_focus_visible', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const focused = page.locator(':focus');
  await expect(focused).toBeVisible();
  const outline = await focused.evaluate(el => getComputedStyle(el).outlineStyle);
  expect(outline).not.toBe('none');
  await page.getByRole('button', { name: 'Open menu' }).focus();
  await page.keyboard.press('Enter');
  const menu = page.getByRole('dialog', { name: 'Site menu' });
  await expect(menu).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused();
});

test('3.16 institutional_copy_quality', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Send contact request' }).click();
  await expect(page.locator('#name-err')).toBeVisible();
  await expect(page.locator('#email-err')).toBeVisible();
  const manager = await openManager(page);
  await manager.getByLabel('Select all events').check();
  await manager.getByRole('button', { name: /Delete selected \(/ }).first().click();
  await expect(manager.getByText(/Create your first event to start building the schedule/)).toBeVisible();
});
