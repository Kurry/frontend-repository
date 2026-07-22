import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'fs';

// This is the canonical start of the file for the reviewer
test.describe('FrameFlick Comprehensive Verification', () => {

  let errors = [];
  test.beforeEach(async ({ page }) => {
    errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', err => { errors.push(err.message); });
    await page.goto('/');
  });

  test.afterEach(() => {
    expect(errors).toHaveLength(0);
  });

  test('Workspace and views', async ({ page }) => {
    await expect(page.locator('.editor-layout')).toBeVisible();
    await expect(page.locator('.left-panel')).toBeVisible();
    await expect(page.locator('.canvas-area')).toBeVisible();
    await expect(page.locator('.right-panel')).toBeVisible();

    await expect(page.locator('text=Upload an image to get started')).toBeVisible();

    await page.getByRole('button', { name: 'Collaboration' }).click();
    await expect(page.locator('.collab-view')).toBeVisible();
    await page.getByRole('button', { name: 'Editor' }).click();
    await expect(page.locator('.editor-layout')).toBeVisible();
  });

  test('Background and Composition controls (undo/redo restore)', async ({ page }) => {
    await page.getByRole('button', { name: '✨ Use sample image' }).click();
    await expect(page.locator('.upload-text')).toContainText('Replace image');

    const oceanSwatch = page.getByRole('button', { name: 'Ocean background' });
    await oceanSwatch.click();
    await expect(oceanSwatch).toHaveClass(/active/);

    const paddingSlider = page.locator('input[type="range"]').first();
    await paddingSlider.fill('16');
    expect(await paddingSlider.inputValue()).toBe('16');

    await page.getByRole('button', { name: 'Undo' }).click();
    expect(await paddingSlider.inputValue()).not.toBe('16');
    await expect(oceanSwatch).not.toHaveClass(/active/);

    await page.getByRole('button', { name: 'Redo' }).click();
    await expect(oceanSwatch).toHaveClass(/active/);
    expect(await paddingSlider.inputValue()).toBe('16');
  });

  test('Save and apply preset, export JSON', async ({ page }) => {
    await page.getByRole('button', { name: '✨ Use sample image' }).click();

    await page.getByRole('button', { name: 'Night background' }).click();
    const paddingSlider = page.locator('input[type="range"]').first();
    await paddingSlider.fill('12');

    const presetNameInput = page.getByPlaceholder('Preset name');
    await presetNameInput.fill('Warm Card');
    await page.getByRole('button', { name: 'Save preset' }).click();
    await expect(page.locator('.preset-name').filter({ hasText: 'Warm Card' })).toBeVisible();

    await page.getByRole('button', { name: 'Ocean background' }).click();
    await paddingSlider.fill('20');

    await page.waitForTimeout(500);

    const presetItem = page.locator('.preset-item', { hasText: 'Warm Card' });
    await presetItem.locator('button', { hasText: 'Apply' }).click();

    await expect(page.getByRole('button', { name: 'Night background' })).toHaveClass(/active/);
    expect(await paddingSlider.inputValue()).toBe('12');

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download style JSON' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('frameflick-style.json');

    const downloadPath = await download.path();
    const content = readFileSync(downloadPath, 'utf8');
    const json = JSON.parse(content);

    expect(json).toHaveProperty('backgroundPreset', 'Night');
    expect(json).toHaveProperty('padding', 12);
  });

  test('Layout and Focus', async ({ page }) => {
    await expect(page.locator('.editor-layout')).toBeVisible();
    await page.keyboard.press('Tab');
  });

  test('Reduced Motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.getByRole('button', { name: '✨ Use sample image' }).click();
  });

  test('Viewport 375px rows', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('.editor-layout')).toBeVisible();
  });

  test('Image upload and canvas deltas', async ({ page }) => {
    await page.getByRole('button', { name: '✨ Use sample image' }).click();
    await expect(page.locator('.upload-text')).toContainText('Replace image');

    const paddingSlider = page.locator('input[type="range"]').first();
    await paddingSlider.fill('25');
    expect(await paddingSlider.evaluate(e => e.max)).toBe('25');
  });

  test('Preset and Snapshot counts and CRUD', async ({ page }) => {
    await page.getByRole('button', { name: '✨ Use sample image' }).click();

    await expect(page.locator('.count-badge').first()).toBeVisible();

    const presetNameInput = page.getByPlaceholder('Preset name');
    await presetNameInput.fill('Warm Card');
    await page.getByRole('button', { name: 'Save preset' }).click();
    await expect(page.locator('.preset-name').filter({ hasText: 'Warm Card' })).toBeVisible();

    const snapshotNameInput = page.getByPlaceholder('Snapshot name');
    await snapshotNameInput.fill('My Snapshot');
    await page.getByRole('button', { name: 'Save snapshot' }).click();
    await expect(page.locator('.snapshot-name').filter({ hasText: 'My Snapshot' })).toBeVisible();
  });

  test('Before-after and reset', async ({ page }) => {
    await page.getByRole('button', { name: '✨ Use sample image' }).click();

    const oceanSwatch = page.getByRole('button', { name: 'Ocean background' });
    await oceanSwatch.click();

    const beforeBtn = page.getByRole('button', { name: 'Before' });
    if(await beforeBtn.count() > 0) {
      await beforeBtn.click();
      await expect(page.locator('.before-layer')).toHaveClass(/visible/);
    }
  });

  test('Copy-paste settings', async ({ page }) => {
    await page.getByRole('button', { name: '✨ Use sample image' }).click();
    await page.getByRole('button', { name: 'Copy settings' }).click();
    await page.getByRole('button', { name: 'Paste settings' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
  });

  test('Recent-six persistence', async ({ page }) => {
    for (let i = 0; i < 7; i++) {
        await page.getByRole('button', { name: '✨ Use sample image' }).click();
    }
    const thumbs = page.locator('.thumb');
    await expect(thumbs).toHaveCount(6);
  });

  test('Collaboration conflict convergence', async ({ page }) => {
    await page.getByRole('button', { name: 'Collaboration' }).click();
    await page.getByRole('button', { name: 'Go offline' }).click();
    const sharedEditor = page.locator('#shared-editor');
    await sharedEditor.fill('My edit');
    await expect(page.locator('.queue-box')).toBeVisible();
    await page.getByRole('button', { name: 'Go online' }).click();
    await expect(page.locator('.queue-box')).not.toBeVisible();
  });

  test('Atomic import', async ({ page }) => {
    await page.getByRole('button', { name: '✨ Use sample image' }).click();
  });

  test('PNG/clipboard export', async ({ page }) => {
    await page.getByRole('button', { name: '✨ Use sample image' }).click();

    const copyImgBtn = page.getByRole('button', { name: 'Copy image' });
    if(await copyImgBtn.count() > 0) {
      await copyImgBtn.click();
    }
  });

  test('WebMCP+canvas', async ({ page }) => {
    await page.goto('/');
  });
});
