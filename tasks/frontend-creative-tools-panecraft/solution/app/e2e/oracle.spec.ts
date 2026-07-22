import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error(`Page error console log: ${msg.text()}`);
    }
  });
  page.on('pageerror', (exception) => {
    console.error(`Page uncaught exception: ${exception.message}`);
  });
});

test.describe('PaneCraft E2E Oracle Test Suite', () => {
  test('1.1 Seeded workspace baseline and layout on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Header title check
    await expect(page.getByText('PaneCraft', { exact: true }).first()).toBeVisible();

    // Page tab active baseline
    await expect(page.getByRole('button', { name: 'Dashboard', exact: true })).toBeVisible();

    // Data Source Library section check
    await expect(page.getByText('Data Source Library')).toBeVisible();
    await expect(page.getByText('Website Analytics').first()).toBeVisible();
    await expect(page.getByText('Sales Sheet').first()).toBeVisible();
    await expect(page.getByText('Support Tickets').first()).toBeVisible();

    // Default 3 panes check
    await expect(page.getByText('Traffic trend')).toBeVisible();
    await expect(page.getByText('Revenue by category')).toBeVisible();
    await expect(page.getByText('Open support volume')).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('1.2 Data source preview modal and filter flow', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click Sales Sheet preview card
    await page.getByRole('button', { name: 'Preview Sales Sheet rows' }).click();

    const modal = page.getByRole('dialog');
    await expect(modal.getByRole('heading', { name: 'Sales Sheet' })).toBeVisible();
    await expect(modal.getByLabel('Filter preview rows')).toBeVisible();

    // Count indicator check (showing out of 60 rows)
    await expect(modal.getByText(/showing/i)).toContainText('60');

    // Filter input narrowing
    const filterInput = modal.getByLabel('Filter preview rows');
    await filterInput.fill('Hardware');

    // Verify row count narrowed
    await expect(modal.getByText(/showing/i)).not.toContainText('showing 60');

    // Clear filter input
    await filterInput.fill('');
    await expect(modal.getByText(/showing/i)).toContainText('60');

    // Close preview modal
    await modal.getByRole('button', { name: 'Close' }).click();

    expect(errors).toEqual([]);
  });

  test('1.3 Pane wizard creation flow', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const panesBefore = await page.locator('.pane-card').count();

    // Click Create Pane button
    await page.getByRole('button', { name: 'Create Pane', exact: true }).click();

    const modal = page.getByRole('dialog');

    // Step 1: Choose source
    await expect(modal.getByText('Choose a Data Source')).toBeVisible();
    await modal.getByRole('button', { name: /Website Analytics/i }).first().click();
    await modal.getByRole('button', { name: 'Next' }).click();

    // Step 2: Choose type
    await expect(modal.getByText('Choose Pane Type')).toBeVisible();
    await modal.getByRole('button', { name: /Line Chart/i }).click();
    await modal.getByRole('button', { name: 'Next' }).click();

    // Step 3: Configure metric, dimension, size
    await expect(modal.getByText('Configure Pane')).toBeVisible();
    await modal.getByLabel('Metric').selectOption('pageViews');
    await modal.getByLabel('Dimension').selectOption('date');
    await modal.getByRole('button', { name: 'Create Pane', exact: true }).click();

    // Verify new pane created
    await expect(page.locator('.pane-card')).toHaveCount(panesBefore + 1);

    expect(errors).toEqual([]);
  });

  test('1.4 Pane edit in place flow', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find first pane card and hover to reveal Edit control
    const firstPane = page.locator('.pane-card').first();
    await firstPane.hover();

    const editBtn = firstPane.getByRole('button', { name: 'Edit' });
    await editBtn.click();

    const modal = page.getByRole('dialog');
    await expect(modal.getByRole('heading', { name: 'Edit Pane' })).toBeVisible();
    await modal.getByLabel('Metric').selectOption('sessions');
    await modal.getByRole('button', { name: 'Save Changes' }).click();

    // Verify modal closed
    await expect(modal).not.toBeVisible();

    expect(errors).toEqual([]);
  });

  test('1.5 Pane delete confirmation flow', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const panesBefore = await page.locator('.pane-card').count();
    const firstPane = page.locator('.pane-card').first();
    await firstPane.hover();

    // Click Delete
    await firstPane.getByRole('button', { name: 'Delete' }).click();

    // Confirm dialog appears
    const modal = page.getByRole('dialog');
    await expect(modal.getByRole('heading', { name: /Delete Pane/i })).toBeVisible();

    // Cancel deletion first
    await modal.getByRole('button', { name: 'Cancel' }).click();
    expect(await page.locator('.pane-card').count()).toBe(panesBefore);

    // Delete again and confirm
    await firstPane.hover();
    await firstPane.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Confirm Delete' }).click();

    await expect(page.locator('.pane-card')).toHaveCount(panesBefore - 1);

    expect(errors).toEqual([]);
  });

  test('1.6 Page tabs independence, creation, rename, and delete rules', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Add Page
    await page.getByRole('button', { name: 'Add Page' }).click();
    await expect(page.getByRole('button', { name: 'Page 2', exact: true })).toBeVisible();

    // Active page is Page 2, verify empty state message
    await expect(page.getByText('Create your first pane to build this page')).toBeVisible();

    // Switch back to Dashboard tab
    await page.getByRole('button', { name: 'Dashboard', exact: true }).click();
    await expect(page.getByText('Traffic trend')).toBeVisible();

    // Delete Page 2
    await page.getByRole('button', { name: 'Page 2', exact: true }).click();
    await page.getByRole('button', { name: 'Delete page Page 2' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Confirm Delete' }).click();
    await expect(page.getByRole('button', { name: 'Page 2', exact: true })).not.toBeVisible();

    // Verify last remaining page (Dashboard) cannot be deleted (delete button absent)
    await expect(page.getByRole('button', { name: 'Delete page Dashboard' })).not.toBeVisible();

    expect(errors).toEqual([]);
  });

  test('1.7 Pane grid move and resize controls', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const firstPane = page.locator('.pane-card').first();
    await firstPane.hover();

    // Size toggles Small, Medium, Large
    await firstPane.getByRole('button', { name: 'Large', exact: true }).click();
    await expect(firstPane).toHaveClass(/col-span-4/);

    await firstPane.getByRole('button', { name: 'Small', exact: true }).click();
    await expect(firstPane).toHaveClass(/col-span-1/);

    expect(errors).toEqual([]);
  });

  test('1.8 Shared date range filter flow', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Switch shared date range
    await page.getByRole('button', { name: 'Today Only' }).click();
    await page.getByRole('button', { name: 'Last 7 Days' }).click();
    await page.getByRole('button', { name: 'Last 90 Days' }).click();
    await page.getByRole('button', { name: 'Last 30 Days' }).click();

    expect(errors).toEqual([]);
  });

  test('1.9 Saved analysis collection workspace', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Fill analysis name and create analysis
    await page.getByLabel('Analysis name').fill('Test Revenue Analysis');
    await page.getByLabel('Data source', { exact: true }).selectOption('sales-sheet');
    await page.getByLabel('Metric', { exact: true }).selectOption('revenue');
    await page.getByRole('button', { name: 'Create analysis' }).click();

    // Verify item in list
    await expect(page.getByText('Test Revenue Analysis').first()).toBeVisible();

    // Switch view mode Overview / Table
    await page.getByRole('button', { name: 'Table', exact: true }).click();
    await expect(page.getByRole('table')).toBeVisible();
    await page.getByRole('button', { name: 'Overview', exact: true }).click();

    expect(errors).toEqual([]);
  });

  test('1.10 Collaboration scenario panel', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open Collaboration modal
    await page.getByRole('button', { name: 'Collaboration Scenario' }).click();
    const modal = page.getByRole('dialog');
    await expect(modal.getByRole('heading', { name: 'Collaboration Scenario' })).toBeVisible();

    // Toggle Go Offline
    await modal.getByRole('button', { name: 'Go Offline' }).click();
    await expect(modal.getByRole('button', { name: 'Go Online' })).toBeVisible();

    // Toggle Go Online
    await modal.getByRole('button', { name: 'Go Online' }).click();
    await expect(modal.getByRole('button', { name: 'Go Offline' })).toBeVisible();

    // Close Collaboration modal
    await modal.getByRole('button', { name: 'Close' }).click();

    expect(errors).toEqual([]);
  });

  test('1.11 Share panel link and copy feedback', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open Share panel from header
    await page.getByRole('button', { name: 'Share' }).first().click();
    const modal = page.getByRole('dialog');
    await expect(modal.getByRole('heading', { name: 'Share Page' })).toBeVisible();

    // Verify monospace mock link
    await expect(modal.getByText(/panecraft\.local\/view\//i)).toBeVisible();

    // Click Copy Link
    await modal.getByRole('button', { name: 'Copy Link' }).click();
    await expect(modal.getByText(/Copied!/i)).toBeVisible();

    // Close Share modal
    await modal.getByRole('button', { name: 'Close' }).click();

    expect(errors).toEqual([]);
  });

  test('1.12 Export center and import round trip', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click Export button in header
    await page.getByRole('button', { name: 'Export' }).first().click();
    let modal = page.getByRole('dialog');
    await expect(modal.getByRole('heading', { name: 'Export Center' })).toBeVisible();

    // Check JSON preview contains panecraft-workspace-v1
    const textarea = modal.locator('#export-preview');
    await expect(textarea).toHaveValue(/panecraft-workspace-v1/);

    // Click Copy button in export center
    await modal.getByRole('button', { name: 'Copy' }).click();
    await expect(modal.getByText(/Copied!/i)).toBeVisible();

    // Switch tab to Markdown Report
    await modal.getByRole('tab', { name: 'Markdown Report' }).click();
    await expect(textarea).toHaveValue(/# PaneCraft Workspace Report/);

    // Close Export modal
    await modal.getByRole('button', { name: 'Close' }).click();

    // Open Import modal
    await page.getByRole('button', { name: 'Import' }).first().click();
    modal = page.getByRole('dialog');
    await expect(modal.getByRole('heading', { name: 'Export Center' })).toBeVisible();

    // Paste invalid JSON and test validation error
    const importTextarea = modal.getByPlaceholder(/Paste Workspace JSON/i);
    await importTextarea.fill('{"invalid": true}');
    await modal.getByRole('button', { name: 'Import Pasted JSON' }).click();
    await expect(modal.getByText(/Import rejected/i)).toBeVisible();

    // Close Import modal
    await modal.getByRole('button', { name: 'Close' }).click();

    expect(errors).toEqual([]);
  });

  test('1.13 Responsiveness and mobile viewport without overflow', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);

    expect(errors).toEqual([]);
  });
});
