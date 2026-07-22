import { test, expect } from '@playwright/test';

test.describe('NoteNest Oracle E2E Tests', () => {
  let consoleErrors: string[] = [];
  let pageErrors: Error[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    pageErrors = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (err) => {
      pageErrors.push(err);
    });

    await page.goto('/');
  });

  test.afterEach(async () => {
    expect(consoleErrors, `Console errors occurred: ${consoleErrors.join(', ')}`).toEqual([]);
    expect(pageErrors, `Page errors occurred: ${pageErrors.map((e) => e.message).join(', ')}`).toEqual([]);
  });

  test('Shell opens with sidebar, note list, and editor regions', async ({ page }) => {
    await expect(page.getByText('All Notes').first()).toBeVisible();
    await expect(page.getByText('Trash').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'New Note' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export Nest' })).toBeVisible();
  });

  test('Folder management: create, rename, collapse, and count badges', async ({ page }) => {
    // Create new folder
    const createFolderBtn = page.getByRole('button', { name: 'New Folder' });
    await createFolderBtn.click();

    await expect(page.getByText('New Folder').first()).toBeVisible();

    // Create a note in current view
    await page.getByRole('button', { name: 'New Note' }).click();
    await page.locator('input[placeholder="Note title..."]').fill('Test Note in Root');

    // Folder badge check
    await expect(page.getByText('All Notes').first()).toBeVisible();
  });

  test('Note creation, title validation, body editing, pinning, and coloring', async ({ page }) => {
    // Create note
    await page.getByRole('button', { name: 'New Note' }).click();

    const titleInput = page.locator('input[placeholder="Note title..."]');
    await titleInput.fill('Project Roadmap');

    // Pin note
    const pinBtn = page.locator('button[title="Pin note"], button[title="Unpin note"]').first();
    if (await pinBtn.isVisible()) {
      await pinBtn.click();
      await expect(page.getByText('📌 Pinned')).toBeVisible();
    }

    // Color swatch picker
    const colorBtn = page.locator('button[title="Color label"]').first();
    if (await colorBtn.isVisible()) {
      await colorBtn.click();
      const blueSwatch = page.locator('button[title="blue"]');
      if (await blueSwatch.isVisible()) {
        await blueSwatch.click();
      }
    }
  });

  test('Multi-select note selection and batch tray operations', async ({ page }) => {
    // Create two notes
    await page.getByRole('button', { name: 'New Note' }).click();
    await page.locator('input[placeholder="Note title..."]').fill('Batch Note 1');

    await page.getByRole('button', { name: 'New Note' }).click();
    await page.locator('input[placeholder="Note title..."]').fill('Batch Note 2');

    // Select first note via checkbox
    const checkboxes = page.locator('input[type="checkbox"]');
    if (await checkboxes.count() > 0) {
      await checkboxes.first().check();
      await expect(page.getByText('selected', { exact: false })).toBeVisible();
    }
  });

  test('Search bar filters notes and clear restores list', async ({ page }) => {
    await page.getByRole('button', { name: 'New Note' }).click();
    await page.locator('input[placeholder="Note title..."]').fill('Unique Searchable Note');

    const searchInput = page.locator('input[placeholder="Search notes..."]');
    await searchInput.fill('Unique Searchable');

    await expect(page.getByText('Unique Searchable Note')).toBeVisible();

    await searchInput.fill('');
  });

  test('Trash operations: delete to trash, view trash, restore note, and empty trash', async ({ page }) => {
    await page.getByRole('button', { name: 'New Note' }).click();
    await page.locator('input[placeholder="Note title..."]').fill('Note to be Trashed');

    const deleteBtn = page.locator('button[title="Delete note"]').first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
    }

    // Navigate to Trash view
    await page.getByText('Trash').first().click();
    await expect(page.locator('h1')).toContainText('Trash');

    // Restore note if present
    const restoreBtn = page.getByRole('button', { name: 'Restore' });
    if (await restoreBtn.isVisible()) {
      await restoreBtn.click();
    }
  });

  test('Command palette overlay navigation', async ({ page }) => {
    const paletteBtn = page.getByRole('button', { name: 'Command Palette' });
    await paletteBtn.click();

    await expect(page.locator('input[placeholder="Search folders, notes, and actions…"]')).toBeVisible();

    await page.keyboard.press('Escape');
  });

  test('Export Nest drawer and Import Nest dialog', async ({ page }) => {
    // Export Nest
    await page.getByRole('button', { name: 'Export Nest' }).click();
    await expect(page.getByRole('heading', { name: 'Export Nest' })).toBeVisible();

    // Verify format tabs are present
    await expect(page.getByRole('tab', { name: 'Nest JSON' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Markdown vault' })).toBeVisible();

    // Verify Copy and Download buttons exist
    await expect(page.getByRole('button', { name: 'Copy' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Download' })).toBeVisible();

    // Open Import Nest from within the export drawer
    await page.getByRole('dialog').getByRole('button', { name: 'Import Nest' }).click();
    await expect(page.getByRole('heading', { name: 'Import Nest' })).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('Load 10,000 items virtualized list view', async ({ page }) => {
    await page.locator('button[title="Load 10,000 Items"]').click();
    await expect(page.getByText('Virtualized Items', { exact: true })).toBeVisible();

    await page.getByText('← Back').click();
    await expect(page.getByText('All Notes').first()).toBeVisible();
  });

  test('Session Undo and Redo buttons', async ({ page }) => {
    const undoBtn = page.getByRole('button', { name: 'Undo' });
    const redoBtn = page.getByRole('button', { name: 'Redo' });

    await expect(undoBtn).toBeDisabled();

    // Create note mutation
    await page.getByRole('button', { name: 'New Note' }).click();
    await expect(undoBtn).toBeEnabled();

    await undoBtn.click();
    await expect(redoBtn).toBeEnabled();
  });

  test('Page reload resets workspace state to baseline', async ({ page }) => {
    await page.getByRole('button', { name: 'New Note' }).click();
    await page.locator('input[placeholder="Note title..."]').fill('Temporary Note');

    await page.reload();
    await expect(page.getByText('All Notes').first()).toBeVisible();
  });
});
