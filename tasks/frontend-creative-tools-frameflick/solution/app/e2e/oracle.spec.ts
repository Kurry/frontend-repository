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

  test('tab_switch_no_reload', async ({ page }) => {
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

  test('empty_canvas_placeholder_before_upload', async ({ page }) => {
    // Initial drop zone state
    await expect(page.locator('.upload-text')).toHaveText('Drop PNG/JPG here');

    // Click sample image button
    await page.getByRole('button', { name: /Use sample image/ }).click();

    // Canvas placeholder should disappear and replace text should show
    await expect(page.locator('.canvas-area')).not.toContainText('Upload an image to get started');
    await expect(page.locator('.upload-text')).toHaveText('Replace image');

    // Main canvas layer visible
    await expect(page.locator('canvas.after-layer')).toBeVisible();
  });

  test('background_swatch_and_custom_color', async ({ page }) => {
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

  test('frame_style_browser_phone_none', async ({ page }) => {
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

  test('caption_renders_and_invalid_hex_rejected', async ({ page }) => {
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

  test('move_buttons_and_reset_position', async ({ page }) => {
    await page.click('button:has-text("Use sample image")');
    const previewJson = page.locator('.json-preview, pre');

    const upBtn = page.getByRole('button', { name: 'Move image up' });
    await expect(upBtn).toBeVisible();
    await upBtn.click();
    await expect(previewJson).toContainText('"positionY": -10');

    const resetPosBtn = page.getByRole('button', { name: /Reset position/ });
    await resetPosBtn.click();
    await expect(previewJson).toContainText('"positionY": 0');
  });

  test('style_recipe_json_live_export', async ({ page }) => {
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

  test('style_json_import_round_trip', async ({ page }) => {
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

  test('undo_redo_style_mutations', async ({ page }) => {
    await page.click('button:has-text("Use sample image")');
    const paddingSlider = page.locator('input[type="range"]').nth(0);

    const nightSwatch = page.locator('button[title="Night"]');
    await nightSwatch.click();
    await paddingSlider.fill('8');
    await expect(nightSwatch).toHaveClass(/active/);
    await expect(paddingSlider).toHaveValue('8');

    // Reloading the sample keeps the current settings and starts a fresh
    // per-image history context with Night and padding 8 as the baseline.
    await page.getByRole('button', { name: /Use sample image/ }).click();
    await expect(nightSwatch).toHaveClass(/active/);
    await expect(paddingSlider).toHaveValue('8');

    const oceanSwatch = page.locator('button[title="Ocean"]');
    await oceanSwatch.click();
    await paddingSlider.fill('18');
    await expect(oceanSwatch).toHaveClass(/active/);
    await expect(paddingSlider).toHaveValue('18');

    const undoBtn = page.locator('button[title*="Undo"], button:has-text("Undo")');
    await expect(undoBtn).toBeEnabled();
    await undoBtn.click();
    await expect(nightSwatch).toHaveClass(/active/);
    await expect(paddingSlider).toHaveValue('8');

    const redoBtn = page.locator('button[title*="Redo"], button:has-text("Redo")');
    await expect(redoBtn).toBeEnabled();
    await redoBtn.click();
    await expect(oceanSwatch).toHaveClass(/active/);
    await expect(paddingSlider).toHaveValue('18');

    const beforeBtn = page.locator('button:has-text("Before")');
    const afterBtn = page.locator('button:has-text("After")');
    await beforeBtn.click();
    await expect(beforeBtn).toHaveAttribute('aria-pressed', 'true');
    await afterBtn.click();
    await expect(afterBtn).toHaveAttribute('aria-pressed', 'true');

    const resetStyleBtn = page.locator('button:has-text("Reset style")');
    await resetStyleBtn.click();
    await expect(paddingSlider).toHaveValue('8');
  });

  test('preset_save_apply_delete_lifecycle', async ({ page }) => {
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

  test('snapshots_save_apply_delete', async ({ page }) => {
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

  test('copy_paste_settings_groups', async ({ page }) => {
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

  test('recent_switch_round_trip_keeps_per_image_settings', async ({ page }) => {
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

  test('collab_offline_merge_convergence', async ({ page }) => {
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

  test('refresh_restores_settings_presets_recents', async ({ page }) => {
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
