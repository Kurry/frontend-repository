404: Not Found
test('6.1 create_flow_updates_all_surfaces and 14.5 new_note_count_delta_exact', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('app-sidebar')).toBeVisible();

  const getNoteCount = async () => page.locator('.notes-list-wrapper > *:not(.empty-state)').count();
  const initialCount = await getNoteCount();

  await page.keyboard.press('Alt+n');

  await expect(async () => {
      expect(await getNoteCount()).toBe(initialCount + 1);
  }).toPass();

  const focused = page.locator(':focus');
  await expect(focused).toBeVisible();
});

test('6.3 edit_flow_updates_related_displays', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Alt+n');

  const editor = page.locator('.ProseMirror, [contenteditable="true"]').first();
  await expect(editor).toBeVisible();

  await editor.fill('Edit flow test content');

  const firstNoteInSidebar = page.locator('.notes-list-wrapper > *:not(.empty-state)').first();
  await expect(firstNoteInSidebar).toContainText('Edit flow test content');
});

test('6.4 delete_flow_updates_all_surfaces', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Alt+n');

  const getNoteCount = async () => page.locator('.notes-list-wrapper > *:not(.empty-state)').count();

  await expect(async () => {
    expect(await getNoteCount()).toBeGreaterThan(0);
  }).toPass();

  const countAfterCreate = await getNoteCount();

  const deleteBtn = page.getByRole('button', { name: /delete/i }).first();
  await deleteBtn.click();

  const confirmBtn = page.getByRole('button', { name: /confirm|yes|delete/i }).last();
  await confirmBtn.click();

  await expect(async () => {
      expect(await getNoteCount()).toBe(countAfterCreate - 1);
  }).toPass();
});

test('6.8 focus_mode_hides_and_restores_sidebar', async ({ page }) => {
  await page.goto('/');
  const sidebar = page.locator('app-sidebar');
  await expect(sidebar).toBeVisible();

  await page.keyboard.press('Control+Shift+F');

  await expect(async () => {
      const display = await sidebar.evaluate(el => getComputedStyle(el).display);
      const isHiddenClass = await sidebar.evaluate(el => el.classList.contains('hidden') || el.style.display === 'none');
      expect(display === 'none' || isHiddenClass || await sidebar.isHidden()).toBeTruthy();
  }).toPass();

  await page.keyboard.press('Escape');

  await expect(async () => {
      const display = await sidebar.evaluate(el => getComputedStyle(el).display);
      expect(display !== 'none').toBeTruthy();
  }).toPass();
});

test('6.11 artifact_end_state_export_import and 14.9 workspace_export_import_pipeline', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Alt+n');

  await page.waitForTimeout(100);
  await page.keyboard.type('Testing export import pipeline');

  const editor = page.locator('.ProseMirror, [contenteditable="true"]').first();
  await expect(editor).toBeVisible();

  const imageTag = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==" alt="test image">';
  const imageObj = {
      id: 'img-1',
      filename: 'test.png',
      dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
  };

  const exportWsBtn = page.getByRole('button', { name: /export workspace/i });
  await exportWsBtn.click();

  const jsonTextarea = page.locator('textarea, pre').first();
  const wsJson = await jsonTextarea.inputValue().catch(async () => await jsonTextarea.textContent());

  await page.keyboard.press('Escape');

  let parsed = JSON.parse(wsJson);
  parsed.notes[0].bodyHtml += imageTag;
  parsed.notes[0].images = [imageObj];
  parsed.notes[0].createdAt = new Date(parsed.notes[0].createdAt).toISOString();
  parsed.notes[0].updatedAt = new Date(parsed.notes[0].updatedAt).toISOString();
  parsed.notes[0].title = 'Modified via import';

  const modifiedJson = JSON.stringify(parsed);

  const importWsBtn = page.getByRole('button', { name: /import workspace/i });
  await importWsBtn.click();

  const importTextarea = page.locator('textarea').filter({ state: 'visible' }).first();
  await importTextarea.fill(modifiedJson);

  const confirmImport = page.getByRole('button', { name: /import/i }).last();
  await expect(confirmImport).toBeEnabled();
  await confirmImport.click();

  await expect(async () => {
      const firstNoteInSidebar = page.locator('.notes-list-wrapper > *:not(.empty-state)').first();
      expect(await firstNoteInSidebar.textContent()).toContain('Modified via import');
  }).toPass({ timeout: 5000 });
});

test('4.11 import_rejects_bad_workspace_json', async ({ page }) => {
  await page.goto('/');

  const getNoteCount = async () => page.locator('.notes-list-wrapper > *:not(.empty-state)').count();
  const startCount = await getNoteCount();

  const importWsBtn = page.getByRole('button', { name: /import workspace/i });
  await importWsBtn.click();

  const importTextarea = page.locator('textarea').filter({ state: 'visible' }).first();
  await importTextarea.fill('{"schemaVersion":"bad","notes":[{}]}');

  const confirmImport = page.getByRole('button', { name: /import/i }).last();
  if (await confirmImport.isEnabled()) {
      await confirmImport.click();
  }

  const errorMsg = page.locator('text=/invalid|error|schema|fail/i').first();
  await expect(errorMsg).toBeVisible();

  await page.keyboard.press('Escape');

  await expect(async () => {
      expect(await getNoteCount()).toBe(startCount);
  }).toPass();
});
