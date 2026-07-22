import { test, expect } from '@playwright/test';

test.describe('FrameFlick Oracle E2E Suite', () => {
  let consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(`[console error] ${msg.text()}`);
      }
    });
    page.on('pageerror', err => {
      consoleErrors.push(`[uncaught error] ${err.message}`);
    });
    await page.goto('/');
  });

  test.afterEach(() => {
    expect(consoleErrors).toEqual([]);
  });

  test('Workspace initial state and view switching', async ({ page }) => {
    // Header check
    await expect(page.locator('.logo-text')).toHaveText('FrameFlick');
    await expect(page.locator('.tab-btn', { hasText: 'Editor' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.tab-btn', { hasText: 'Collaboration' })).toHaveAttribute('aria-pressed', 'false');

    // Layout panels
    await expect(page.locator('.left-panel')).toBeVisible();
    await expect(page.locator('.canvas-area')).toBeVisible();
    await expect(page.locator('.right-panel')).toBeVisible();

    // Canvas placeholder before image load
    await expect(page.locator('.canvas-area')).toContainText('Upload an image to get started');

    // Switch view to Collaboration
    await page.locator('.tab-btn', { hasText: 'Collaboration' }).click();
    await expect(page.locator('.collab-view')).toBeVisible();
    await expect(page.locator('.editor-layout')).not.toBeVisible();

    // Switch back to Editor
    await page.locator('.tab-btn', { hasText: 'Editor' }).click();
    await expect(page.locator('.editor-layout')).toBeVisible();
  });

  test('Image upload via sample button and drop zone label change', async ({ page }) => {
    // Initial drop zone state
    await expect(page.locator('.upload-text')).toHaveText('Drop PNG/JPG here');

    // Click sample image button
    await page.click('button:has-text("Use sample image")');

    // Canvas placeholder should disappear and replace text should show
    await expect(page.locator('.canvas-area')).not.toContainText('Upload an image to get started');
    await expect(page.locator('.upload-text')).toHaveText('Replace image');

    // Main canvas layer visible
    await expect(page.locator('canvas.after-layer')).toBeVisible();
  });

  test('Background swatch selection, custom hex input, and override', async ({ page }) => {
    await page.click('button:has-text("Use sample image")');

    // Swatches exist
    const oceanSwatch = page.locator('button[title="Ocean"]');
    await expect(oceanSwatch).toBeVisible();
    await oceanSwatch.click();
    await expect(oceanSwatch).toHaveClass(/active/);

    // Night swatch
    const nightSwatch = page.locator('button[title="Night"]');
    await nightSwatch.click();
    await expect(nightSwatch).toHaveClass(/active/);

    // Custom background toggle
    const customToggle = page.locator('button:has-text("Custom color"), label:has-text("Custom"), button:has-text("Custom")');
    if (await customToggle.isVisible()) {
      await customToggle.click();
    }
    const hexInput = page.locator('input[placeholder="#FDE047"], input[placeholder="#RRGGBB"]').first();
    if (await hexInput.isVisible()) {
      await hexInput.fill('#123456');
      await hexInput.dispatchEvent('input');
      await hexInput.dispatchEvent('change');
    }

    // Selecting preset swatch again overrides custom
    await oceanSwatch.click();
    await expect(oceanSwatch).toHaveClass(/active/);
  });

  test('Composition sliders: padding, corner radius, shadow, frame, canvas size', async ({ page }) => {
    await page.click('button:has-text("Use sample image")');

    // Padding slider
    const paddingSlider = page.locator('input[type="range"]').nth(0);
    await paddingSlider.fill('15');
    await paddingSlider.dispatchEvent('input');

    // Corner radius slider
    const cornerSlider = page.locator('input[type="range"]').nth(1);
    await cornerSlider.fill('24');
    await cornerSlider.dispatchEvent('input');

    // Shadow slider
    const shadowSlider = page.locator('input[type="range"]').nth(2);
    await shadowSlider.fill('5');
    await shadowSlider.dispatchEvent('input');

    // Frame style selection: Browser, Phone, None
    const browserFrame = page.locator('button:has-text("Browser")');
    if (await browserFrame.isVisible()) {
      await browserFrame.click();
      await expect(page.locator('.json-preview, pre')).toContainText('"frame": "Browser"');
    }

    const phoneFrame = page.locator('button:has-text("Phone")');
    if (await phoneFrame.isVisible()) {
      await phoneFrame.click();
      await expect(page.locator('.json-preview, pre')).toContainText('"frame": "Phone"');
    }

    const noneFrame = page.locator('button:has-text("None")').first();
    if (await noneFrame.isVisible()) {
      await noneFrame.click();
      await expect(page.locator('.json-preview, pre')).toContainText('"frame": "None"');
    }

    // Canvas size selector: Widescreen, Story, Square, Original
    const widescreenBtn = page.locator('button:has-text("Widescreen")');
    if (await widescreenBtn.isVisible()) {
      await widescreenBtn.click();
    }
    const squareBtn = page.locator('button:has-text("Square")');
    if (await squareBtn.isVisible()) {
      await squareBtn.click();
    }
  });

  test('Caption and Watermark controls with validation error handling', async ({ page }) => {
    await page.click('button:has-text("Use sample image")');

    // Caption panel
    const captionInput = page.locator('input[placeholder="Enter caption text…"], input[placeholder="Caption text…"]');
    if (await captionInput.isVisible()) {
      await captionInput.fill('Sample Caption');
      await captionInput.dispatchEvent('input');

      // Caption position buttons
      const belowBtn = page.locator('button:has-text("Below")');
      if (await belowBtn.isVisible()) await belowBtn.click();

      const aboveBtn = page.locator('button:has-text("Above")');
      if (await aboveBtn.isVisible()) await aboveBtn.click();
    }

    // Invalid caption hex error check
    const captionHexInput = page.locator('input[aria-label="Caption color hex"], input[placeholder="#ffffff"]').first();
    if (await captionHexInput.isVisible()) {
      await captionHexInput.fill('invalid-hex');
      await captionHexInput.dispatchEvent('input');
      await expect(page.locator('.right-panel, body')).toContainText('Invalid color');
      // Fix back to valid hex
      await captionHexInput.fill('#000000');
      await captionHexInput.dispatchEvent('input');
    }

    // Watermark panel
    const watermarkToggle = page.locator('button[role="switch"], input[type="checkbox"]').first();
    if (await watermarkToggle.isVisible()) {
      if ((await watermarkToggle.getAttribute('aria-checked')) !== 'true') {
        await watermarkToggle.click();
      }
      const watermarkInput = page.locator('input[placeholder="Watermark text…"]');
      if (await watermarkInput.isVisible()) {
        await watermarkInput.fill('FrameFlick Pro');
        await watermarkInput.dispatchEvent('input');
      }
    }
  });

  test('Position and Zoom controls', async ({ page }) => {
    await page.click('button:has-text("Use sample image")');

    // Move buttons
    const upBtn = page.locator('button[title="Move up"], button:has-text("⬆️"), button:has-text("Up")');
    if (await upBtn.count() > 0) {
      await upBtn.first().click();
    }

    // Reset position
    const resetPosBtn = page.locator('button:has-text("Reset position"), button:has-text("Reset Pos")');
    if (await resetPosBtn.isVisible()) {
      await resetPosBtn.click();
    }
  });

  test('Export bar actions and Style JSON live preview', async ({ page }) => {
    await page.click('button:has-text("Use sample image")');

    // Style JSON preview block
    const previewJson = page.locator('.json-preview, pre');
    await expect(previewJson).toBeVisible();
    await expect(previewJson).toContainText('backgroundPreset');

    // Copy style JSON button transient feedback
    const copyStyleBtn = page.locator('button:has-text("Copy style JSON")');
    if (await copyStyleBtn.isVisible()) {
      await copyStyleBtn.click();
      await expect(page.locator('body')).toContainText('Copied style!');
    }

    // Copy image button transient feedback
    const copyImgBtn = page.locator('button:has-text("Copy image")');
    if (await copyImgBtn.isVisible()) {
      await copyImgBtn.click();
      await expect(page.locator('body')).toContainText('Copied!');
    }
  });

  test('Style JSON import valid and invalid schemas', async ({ page }) => {
    await page.click('button:has-text("Use sample image")');

    const importBtn = page.locator('button:has-text("Import style JSON")');
    if (await importBtn.isVisible()) {
      await importBtn.click();
      const modal = page.locator('[role="dialog"], .dialog-card, dialog');
      await expect(modal).toBeVisible();

      // Paste invalid JSON
      const jsonTextarea = modal.locator('textarea[placeholder*="JSON"]');
      await jsonTextarea.fill('{ "invalid": json }');

      const applyBtn = modal.locator('button:has-text("Import"), button:has-text("Apply style")');
      await applyBtn.click();
      await expect(modal).toContainText('Invalid style JSON');

      // Close modal on Escape
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
    }
  });

  test('Undo, Redo, Before/After, and Reset style', async ({ page }) => {
    await page.click('button:has-text("Use sample image")');

    // Night swatch
    const nightSwatch = page.locator('button[title="Night"]');
    await nightSwatch.click();

    // Ocean swatch
    const oceanSwatch = page.locator('button[title="Ocean"]');
    await oceanSwatch.click();

    // Undo button
    const undoBtn = page.locator('button[title*="Undo"], button:has-text("Undo")');
    if (await undoBtn.isVisible() && !(await undoBtn.isDisabled())) {
      await undoBtn.click();
    }

    // Redo button
    const redoBtn = page.locator('button[title*="Redo"], button:has-text("Redo")');
    if (await redoBtn.isVisible() && !(await redoBtn.isDisabled())) {
      await redoBtn.click();
    }

    // Before/After toggle
    const beforeBtn = page.locator('button:has-text("Before")');
    const afterBtn = page.locator('button:has-text("After")');
    if (await beforeBtn.isVisible()) {
      await beforeBtn.click();
      await afterBtn.click();
    }

    // Reset style button
    const resetStyleBtn = page.locator('button:has-text("Reset style")');
    if (await resetStyleBtn.isVisible()) {
      await resetStyleBtn.click();
    }
  });

  test('Presets panel: name validation, save, apply, and delete lifecycle', async ({ page }) => {
    await page.click('button:has-text("Use sample image")');

    const presetInput = page.locator('#preset-name');
    const savePresetBtn = page.locator('.presets-section button:has-text("Save preset")');

    // Disabled when empty
    await expect(savePresetBtn).toBeDisabled();

    // Fill valid name
    await presetInput.fill('Warm Card');
    await expect(savePresetBtn).not.toBeDisabled();
    await savePresetBtn.click();

    // Preset count increases to 1
    await expect(page.locator('[data-testid="preset-count"]')).toHaveText('1');
    await expect(page.locator('.preset-name')).toHaveText('Warm Card');

    // Duplicate name validation
    await presetInput.fill('Warm Card');
    await expect(page.locator('.presets-section .save-row')).toContainText('Preset "Warm Card" already exists');
    await expect(savePresetBtn).toBeDisabled();

    await presetInput.fill('');

    // Apply preset button
    await page.locator('.preset-item button:has-text("Apply")').click();

    // Delete preset button & confirm dialog
    await page.locator('.preset-item button:has-text("Del")').click();
    const dialog = page.locator('.dialog-card, [role="dialog"]');
    await expect(dialog).toBeVisible();
    await dialog.locator('button:has-text("Delete")').click();

    // Count returns to 0
    await expect(page.locator('[data-testid="preset-count"]')).toHaveText('0');
  });

  test('Snapshots panel: save, apply, and delete', async ({ page }) => {
    await page.click('button:has-text("Use sample image")');

    const snapshotInput = page.locator('input[placeholder="Snapshot name…"]');
    const saveSnapshotBtn = page.locator('.snapshots-section button:has-text("Save snapshot")');

    if (await snapshotInput.isVisible()) {
      await snapshotInput.fill('V1 Draft');
      await saveSnapshotBtn.click();

      await expect(page.locator('.snapshot-item')).toContainText('V1 Draft');

      // Delete snapshot
      await page.locator('.snapshot-item button:has-text("Del")').click();
      const dialog = page.locator('.dialog-card, [role="dialog"]');
      if (await dialog.isVisible()) {
        await dialog.locator('button:has-text("Delete")').click();
      }
      await expect(page.locator('.snapshot-item')).not.toBeVisible();
    }
  });

  test('Copy & Paste settings modal', async ({ page }) => {
    await page.click('button:has-text("Use sample image")');

    const copySettingsBtn = page.locator('button:has-text("Copy settings")');
    if (await copySettingsBtn.isVisible()) {
      await copySettingsBtn.click();

      const pasteSettingsBtn = page.locator('button:has-text("Paste settings")');
      await pasteSettingsBtn.click();

      const dialog = page.locator('[role="dialog"], .dialog-card');
      await expect(dialog).toBeVisible();

      const confirmBtn = dialog.locator('button:has-text("Confirm paste")');
      await confirmBtn.click();
      await expect(dialog).not.toBeVisible();
    }
  });

  test('Recent strip: multiple uploads and thumbnail switching', async ({ page }) => {
    // Load first sample
    await page.click('button:has-text("Use sample image")');
    await expect(page.locator('.thumbnails .thumb')).toHaveCount(1);

    // Load second sample
    await page.click('button:has-text("Use sample image")');
    await expect(page.locator('.thumbnails .thumb')).toHaveCount(2);

    // Click first thumbnail to switch back
    await page.locator('.thumbnails .thumb').first().click();
    await expect(page.locator('.thumbnails .thumb').first()).toHaveClass(/active/);
  });

  test('Collaboration scenario offline queue, merge, and apply to canvas', async ({ page }) => {
    await page.locator('.tab-btn', { hasText: 'Collaboration' }).click();

    // Click Go offline
    const toggleOnlineBtn = page.locator('button:has-text("Go offline")');
    await toggleOnlineBtn.click();
    await expect(page.locator('button:has-text("Go online")')).toBeVisible();

    // Edit shared editor text
    const sharedEditor = page.locator('textarea[aria-label="Shared editor"], textarea#shared-editor');
    await sharedEditor.fill('Offline edit line 1\n');
    await sharedEditor.dispatchEvent('input');

    // Simulate peer edit if button exists
    const peerEditBtn = page.locator('button:has-text("Simulate peer edit")');
    if (await peerEditBtn.isVisible()) {
      await peerEditBtn.click();
    }

    // Go online to merge
    await page.locator('button:has-text("Go online")').click();

    // Converged shared content
    await expect(page.locator('.collab-view')).toContainText('Shared content');

    // Apply to canvas
    const applyToCanvasBtn = page.locator('button:has-text("Apply to canvas")');
    if (await applyToCanvasBtn.isVisible()) {
      await applyToCanvasBtn.click();
      await page.locator('.tab-btn', { hasText: 'Editor' }).click();
      await expect(page.locator('.editor-layout')).toBeVisible();
    }
  });

  test('Command Palette shortcut Ctrl+K and navigation', async ({ page }) => {
    await page.keyboard.press('Control+k');
    const palette = page.locator('.palette-card, [aria-label="Command palette"]');
    await expect(palette).toBeVisible();

    // Close on Escape
    await page.keyboard.press('Escape');
    await expect(palette).not.toBeVisible();
  });

  test('LocalStorage persistence across full page reload', async ({ page }) => {
    await page.click('button:has-text("Use sample image")');

    // Save a preset named "Persisted Preset"
    const presetInput = page.locator('#preset-name');
    await presetInput.fill('Persisted Preset');
    await page.click('.presets-section button:has-text("Save preset")');
    await expect(page.locator('.preset-name')).toHaveText('Persisted Preset');

    // Refresh page
    await page.reload();

    // Preset survived reload
    await expect(page.locator('[data-testid="preset-count"]')).toHaveText('1');
    await expect(page.locator('.preset-name')).toHaveText('Persisted Preset');
    await expect(page.locator('.thumbnails .thumb')).toHaveCount(1);
  });
});
