import { test, expect } from '@playwright/test';

test.describe('Grid Paint Studio E2E', () => {
  let errors = [];

  test.beforeEach(async ({ page }) => {
    errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('favicon')) {
        errors.push(`Console error: ${msg.text()}`);
      }
    });
    page.on('pageerror', err => {
      errors.push(`Page error: ${err.message}`);
    });
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(() => {
    expect(errors).toEqual([]);
  });

  test('full e2e user flow', async ({ page, browserName }) => {
    // 1. Initial Load & structural validation
    await expect(page.getByRole('heading', { name: '<GRID PAINT STUDIO>', exact: true })).toBeVisible();
    await expect(page.getByText('YOU ARE THE ALGORITHM')).toBeVisible();

    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found or not visible");

    // Click middle of canvas to paint initial QR stroke
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

    // Switch to Color Brush ('B')
    await page.keyboard.press('b');
    // Change to Red ('3')
    await page.keyboard.press('3');

    // Drag paint (press and drag)
    await page.mouse.move(box.x + box.width / 4, box.y + box.height / 4);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 4 + 50, box.y + box.height / 4);
    await page.mouse.move(box.x + box.width / 4 + 100, box.y + box.height / 4);
    await page.mouse.up();

    // Toggle Grid ('G')
    await page.keyboard.press('g');

    // Undo twice
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');

    // Flood fill
    await page.keyboard.press('f');
    // Change to Yellow ('4')
    await page.keyboard.press('4');
    await page.mouse.click(box.x + 10, box.y + 10);

    // Gallery operations
    const galleryButton = page.getByRole('button', { name: 'Gallery', exact: true });
    await galleryButton.click();

    // Filter cards
    const tagFilter = page.getByRole('button', { name: 'pattern', exact: true });
    if (await tagFilter.isVisible()) {
        await tagFilter.click();
    }

    // Switch to Export mode
    const exportButton = page.getByRole('button', { name: 'Export', exact: true });
    await exportButton.click();

    // Check Export output exists
    await expect(page.getByText('"cellSize":')).toBeVisible();

    // Back to Paint
    const paintButton = page.getByRole('button', { name: 'Paint', exact: true });
    await paintButton.click();

    // Lock check - cell size slider should be disabled after painting
    const cellSlider = page.getByRole('slider', { name: 'Cell size' });
    if (await cellSlider.isVisible()) {
       await expect(cellSlider).toBeDisabled();
    }
  });
});
