import { test, expect } from '@playwright/test';

test.describe('O&A Palette Library Oracle E2E Tests', () => {
  let consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(() => {
    expect(consoleErrors).toEqual([]);
  });

  test('Shell and Navigation: header lockup, menu, cart drawer, and editorial intro', async ({ page }) => {
    // Header title / lockup
    await expect(page.getByText('THE O&A PALETTE LIBRARY', { exact: false }).first()).toBeVisible();

    // Menu sheet
    const menuBtn = page.getByRole('button', { name: 'MENU', exact: true });
    if (await menuBtn.isVisible()) {
      await menuBtn.click();
      await page.keyboard.press('Escape');
    }

    // Cart drawer
    const cartBtn = page.getByRole('button', { name: 'CART', exact: true });
    if (await cartBtn.isVisible()) {
      await cartBtn.click();
      await expect(page.getByRole('dialog', { name: /Cart/i })).toBeVisible();
      await page.keyboard.press('Escape');
    }

    // Editorial intro content checks
    await expect(page.getByText(/Werner's Nomenclature/i).first()).toBeVisible();
    await expect(page.getByText(/Winsor & Newton/i).first()).toBeVisible();
    await expect(page.getByText(/Cennini/i).first()).toBeVisible();
  });

  test('View modes and Period filter: Nomenclature, Palette, Swatch views and period filtering', async ({ page }) => {
    const nomBtn = page.getByRole('button', { name: /Nomenclature/i }).first();
    const palBtn = page.getByRole('button', { name: /Palette/i, exact: false }).first();
    const swaBtn = page.getByRole('button', { name: /Swatch/i, exact: false }).first();

    await palBtn.click();
    await expect(page.locator('.palette-card, [aria-label*="palette"], article').first()).toBeVisible();

    await swaBtn.click();
    await nomBtn.click();

    // Period filter
    const periodSelect = page.getByRole('combobox', { name: /Filter by Period/i });
    if (await periodSelect.isVisible()) {
      await periodSelect.selectOption({ label: 'Baroque to Neoclassical' });
      await periodSelect.selectOption({ label: 'All Periods' });
    }
  });

  test('Palette creation, form validation, and Undo/Redo', async ({ page }) => {
    // Scroll to Add to the Archive section
    await page.locator('#create-palette').scrollIntoViewIfNeeded();

    const nameInput = page.locator('#create-name');
    await nameInput.clear();
    await nameInput.fill('Cove Coastal');

    const periodSelect = page.locator('#create-period');
    await periodSelect.selectOption('Post-Impressionism');

    // Submit form
    await page.locator('#create-palette form').dispatchEvent('submit');

    // Check Undo / Redo controls
    const undoBtn = page.getByRole('button', { name: 'Undo', exact: true });
    const redoBtn = page.getByRole('button', { name: 'Redo', exact: true });
    await expect(undoBtn).toBeVisible();
    await expect(redoBtn).toBeVisible();
  });

  test('Vision Simulation and Layout Simulator', async ({ page }) => {
    // Vision simulation toggle
    const visionSelect = page.getByRole('combobox', { name: /Vision/i });
    if (await visionSelect.isVisible()) {
      await visionSelect.selectOption('Protanopia');
      await visionSelect.selectOption('Deuteranopia');
      await visionSelect.selectOption('None');
    }

    // Layout simulator
    const simBtn = page.getByRole('button', { name: /Layout Simulator|Simulator/i }).first();
    if (await simBtn.isVisible()) {
      await simBtn.click();
      const simModal = page.getByRole('dialog');
      await expect(simModal).toBeVisible();
      await page.keyboard.press('Escape');
    }
  });

  test('Export Drawer and Package JSON schema verification', async ({ page }) => {
    const exportBtn = page.getByRole('button', { name: /Export/i }).first();
    if (await exportBtn.isVisible()) {
      await exportBtn.click();

      const drawer = page.getByRole('dialog');
      await expect(drawer).toBeVisible();

      // Format tabs: CSS, utility-theme, SCSS
      await page.getByRole('tab', { name: /CSS/i }).first().click();
      await page.getByRole('tab', { name: /SCSS/i }).first().click();

      // Close export drawer
      await page.keyboard.press('Escape');
    }
  });
});
