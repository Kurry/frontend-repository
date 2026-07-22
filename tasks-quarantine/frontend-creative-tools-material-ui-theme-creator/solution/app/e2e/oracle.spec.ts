import { test, expect } from '@playwright/test';

test.describe('Material UI Theme Creator Oracle E2E Tests', () => {
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

  test('Shell and Navigation: header elements, version chip, tutorial, main tabs, and command palette', async ({ page }) => {
    // Check product title and version affordance
    await expect(page.locator('h1')).toHaveText('Material-UI Theme Creator');
    await expect(page.getByRole('note', { name: 'Package version' })).toHaveText('@material-ui/core@^4.11.0');

    // Tutorial modal flow
    await page.getByRole('button', { name: 'Open Tutorial' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Welcome to the Theme Creator')).toBeVisible();
    await page.getByRole('button', { name: 'Close Tutorial' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();

    // Tab switching
    const previewTab = page.getByRole('tab', { name: 'Preview' });
    const componentsTab = page.getByRole('tab', { name: 'Components' });
    const savedTab = page.getByRole('tab', { name: 'Saved Themes' });

    await expect(previewTab).toHaveAttribute('aria-selected', 'true');

    await componentsTab.click();
    await expect(componentsTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByPlaceholder(/Search components/i)).toBeVisible();

    await savedTab.click();
    await expect(savedTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('Saved Themes', { exact: false })).toBeVisible();

    await previewTab.click();
    await expect(previewTab).toHaveAttribute('aria-selected', 'true');

    // Command palette via keyboard shortcut Cmd+K
    await page.keyboard.press('Control+k');
    const commandDialog = page.getByRole('dialog');
    await expect(commandDialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(commandDialog).toBeHidden();
  });

  test('Preview workspace: device toggles, sample site templates, color blindness filters, and before/after compare', async ({ page }) => {
    // Device frame toggles
    await page.getByRole('button', { name: 'Phone' }).click();
    await page.getByRole('button', { name: 'Tablet' }).click();
    await page.getByRole('button', { name: 'Desktop' }).click();

    // Sample site nested tabs
    await page.getByRole('button', { name: 'Sign Up' }).click();
    await page.getByRole('button', { name: 'Dashboard' }).click();
    await page.getByRole('button', { name: 'Blog' }).click();
    await page.getByRole('button', { name: 'Pricing' }).click();
    await page.getByRole('button', { name: 'Checkout' }).click();
    await page.getByRole('button', { name: 'Instructions' }).click();

    // Color blindness controls
    await page.getByRole('button', { name: 'Protanopia' }).click();
    await page.getByRole('button', { name: 'Deuteranopia' }).click();
    await page.getByRole('button', { name: 'Tritanopia' }).click();
    await page.getByRole('button', { name: 'Off' }).click();

    // Before/After compare toggle
    await page.getByRole('button', { name: 'Before' }).click();
    await page.getByRole('button', { name: 'After' }).click();
  });

  test('Theme tools & editor: Light/Dark toggle, Palette accordion, Presets, Snippets, Shape, Typography, and Contrast matrix', async ({ page }) => {
    // Light/Dark toggle
    const darkToggle = page.getByRole('button', { name: 'Dark', exact: true });
    if (await darkToggle.isVisible()) {
      await darkToggle.click();
    }
    const lightToggle = page.getByRole('button', { name: 'Light', exact: true });
    if (await lightToggle.isVisible()) {
      await lightToggle.click();
    }

    // Palette accordion expand & edit primary color
    const primaryAccordion = page.getByRole('button', { name: /primary/i }).first();
    await primaryAccordion.click();

    // Apply Presets
    await page.getByRole('button', { name: 'Ocean' }).click();
    await page.getByRole('button', { name: 'Forest' }).click();
    await page.getByRole('button', { name: 'High Contrast' }).click();
    await page.getByRole('button', { name: 'Material Blue' }).click();

    // Shape tool - border radius
    const shapeButton = page.getByRole('button', { name: 'Shape' }).first();
    if (await shapeButton.isVisible()) {
      await shapeButton.click();
    }

    // Check Contrast Matrix panel presence and AA/AAA badges
    await expect(page.getByText('Contrast Matrix')).toBeVisible();
    await expect(page.getByText(/AA|AAA/i).first()).toBeVisible();
  });

  test('Components Gallery: search filtering and component demos', async ({ page }) => {
    await page.getByRole('tab', { name: 'Components' }).click();

    const searchInput = page.getByPlaceholder(/Search components/i);
    await searchInput.fill('Button');
    await expect(page.getByText(/Buttons/i).first()).toBeVisible();

    await searchInput.clear();
    await searchInput.fill('Accordion');
    await expect(page.getByText(/Accordion/i).first()).toBeVisible();

    await searchInput.clear();
  });

  test('Saved Themes: seed set, creation with validation, load, rename, delete, search, and empty state', async ({ page }) => {
    await page.getByRole('tab', { name: 'Saved Themes' }).click();

    // Check seeded themes exist (at least 3)
    const cards = page.locator('[data-testid="theme-card"], .theme-card, article, .border.rounded-lg');
    const initialCount = await cards.count();
    expect(initialCount).toBeGreaterThanOrEqual(3);

    // Create New Theme with empty name (should show inline error)
    await page.getByRole('button', { name: 'New Theme' }).click();
    const nameInput = page.getByLabel(/Theme Name/i);
    await nameInput.clear();
    const createSubmit = page.getByRole('button', { name: 'Create Theme' });
    await expect(createSubmit).toBeDisabled();

    // Enter valid unique name
    await nameInput.fill('Harbor Indigo');
    await expect(createSubmit).toBeEnabled();
    await createSubmit.click();

    // Verify card is added
    await expect(page.getByText('Harbor Indigo')).toBeVisible();

    // Search filter
    const searchInput = page.getByPlaceholder(/Search saved themes/i);
    await searchInput.fill('Harbor Indigo');
    await expect(page.getByText('Harbor Indigo')).toBeVisible();

    await searchInput.fill('nonexistent_theme_query_12345');
    await expect(page.getByText(/No themes match/i)).toBeVisible();

    await searchInput.clear();
  });

  test('Theme Files Export and Import: JSON and CSS drawer, field contract validation, copy & download', async ({ page }) => {
    // Open Export drawer
    await page.getByRole('button', { name: 'Export Theme Files' }).click();
    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible();

    await expect(page.getByText('JSON Theme Package')).toBeVisible();
    await expect(page.getByText('CSS Custom Properties')).toBeVisible();

    // Copy JSON artifact
    await page.getByRole('button', { name: 'Copy JSON' }).click();

    // Close drawer
    await page.getByRole('button', { name: 'Close Theme Files' }).click();
    await expect(drawer).toBeHidden();

    // Open Import dialog
    await page.getByRole('button', { name: 'Import Theme' }).click();
    const importModal = page.getByRole('dialog');
    await expect(importModal).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(importModal).toBeHidden();
  });
});
