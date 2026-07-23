import { test, expect } from '@playwright/test';

test('delete note', async ({ page }) => {
  await page.goto('/');

  // Find a run row that we can click
  const firstRunBtn = page.locator('.run-list .run-card').first();
  await firstRunBtn.click();

  const addNote = page.locator('button:has-text("Add note")').first();
  await addNote.waitFor({ state: 'visible' });
  await addNote.click();

  await page.fill('textarea[name="text"]', 'Test note');
  await page.selectOption('select[name="category"]', 'observation');
  await page.click('button:has-text("Attach note")');

  // Find the remove button
  const removeBtn = page.getByRole('button', { name: /Remove note 1 from/ }).first();
  await expect(removeBtn).toBeVisible();

  // What covers it? Let's check bounding box
  const box = await removeBtn.boundingBox();
  console.log("Delete btn box:", box);

  const zIndex = await removeBtn.evaluate(e => window.getComputedStyle(e).zIndex);
  console.log("Delete btn zIndex:", zIndex);

  await removeBtn.click({ timeout: 5000 });
  await expect(removeBtn).not.toBeVisible();
});
