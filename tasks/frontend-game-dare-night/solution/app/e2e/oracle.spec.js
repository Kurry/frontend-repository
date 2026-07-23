import { expect, test } from '@playwright/test';

async function waitForApp(page) {
  await page.waitForFunction(() => typeof window.webmcp_invoke_tool === 'function');
}

async function startTwoPlayerGame(page, { timer = false } = {}) {
  await page.getByLabel('Player 1 name').fill('Alice');
  await page.getByLabel('Player 2 name').fill('Bob');
  if (timer) await page.getByRole('switch', { name: 'Round timer' }).click();
  await page.getByRole('button', { name: 'Start game' }).click();
  await expect(page.getByText("Alice's turn", { exact: true })).toBeVisible();
}

test('timer-forfeit undo restores the same card once and double Done resolves one turn', async ({ page }) => {
  await page.goto('/');
  await waitForApp(page);
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.getByRole('form', { name: 'Players (2–8)' })).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Custom card editor' })).toBeVisible();
  await startTwoPlayerGame(page, { timer: true });
  await expect(page.getByRole('complementary', { name: 'Live event feed' })).toBeVisible();

  await page.getByRole('button', { name: 'Draw card' }).click();
  const cardPrompt = page.locator('.card-flip p').last();
  const prompt = await cardPrompt.textContent();
  expect(prompt).toBeTruthy();

  await expect(page.getByRole('button', { name: 'Undo last turn' })).toBeVisible({ timeout: 18_000 });
  await page.getByRole('button', { name: 'Undo last turn' }).click();
  await expect(page.getByText("Alice's turn", { exact: true })).toBeVisible();
  await expect(page.locator('.card-flip p').last()).toHaveText(prompt);
  await expect(page.getByRole('button', { name: 'Undo last turn' })).toHaveCount(0);

  // The restored timer-forfeit snapshot must not immediately forfeit again.
  await page.waitForTimeout(1_250);
  await expect(page.locator('.card-flip p').last()).toHaveText(prompt);
  await expect(page.getByRole('button', { name: 'Undo last turn' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Done' }).evaluate((button) => {
    button.click();
    button.click();
  });
  await expect(page.getByRole('progressbar', { name: 'Alice points' })).toHaveAttribute('aria-valuenow', '1');
  await expect(page.getByText("Bob's turn", { exact: true })).toBeVisible();
});

test('export dialog stays inside a narrow viewport and its actions remain operable', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await waitForApp(page);
  await page.getByRole('button', { name: 'Export Session' }).click();

  const dialog = page.getByRole('dialog', { name: 'Export Session' });
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  if (!box) throw new Error('Export dialog has no visible bounds');
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(812);

  const download = page.getByRole('button', { name: 'Download JSON' });
  await download.scrollIntoViewIfNeeded();
  await download.click();
  await expect(page.getByRole('status')).toContainText('Session JSON downloaded');
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(dialog).toHaveCount(0);
});
