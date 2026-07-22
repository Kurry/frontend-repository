import { test, expect } from '@playwright/test';
import { copyFileSync } from 'fs';
import { join } from 'path';

test('verify seating canvas interactions', async ({ page }) => {
    await page.goto('/');

    // Add a table
    await page.getByText('Round 8').click();
    await page.waitForTimeout(500);

    // Toggle lens
    await page.getByTitle('Accessibility Lens').click();
    await page.waitForTimeout(500);

    // Take an explicit screenshot
    await page.screenshot({ path: '/app/environment/reference-screenshots/seating-canvas.png' });

    // We expect the canvas to exist
    await expect(page.getByTestId('canvas')).toBeVisible();
});
