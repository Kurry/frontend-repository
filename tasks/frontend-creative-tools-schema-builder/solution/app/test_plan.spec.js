import { test, expect } from '@playwright/test';

test('test setup', async ({ page }) => {
    await page.goto('http://localhost:3000');
    console.log(await page.content());
});
