import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const skip = page.getByRole('button', { name: 'Skip tour' });
  if (await skip.isVisible()) await skip.click();
});

test('create_flow_updates_all_surfaces: CRUD, validation, persistence, and empty recovery', async ({ page }) => {
  await page.getByRole('button', { name: 'Create loop' }).click();
  await expect(page.getByRole('alert')).toContainText('Enter a loop name');
  await page.getByRole('button', { name: /Measure 12/ }).click();
  await page.getByRole('button', { name: /Measure 16/ }).click({ modifiers: ['Shift'] });
  await page.getByLabel('Loop name').fill('Bridge precision');
  await page.getByLabel('Repetitions').fill('7');
  await page.getByRole('button', { name: 'Create loop' }).click();
  await expect(page.getByRole('status')).toContainText('Created');
  await expect(page.getByTestId('loop-count')).toHaveText('2');
  await expect(page.getByTestId('range-summary')).toHaveText('Measures 12–16');
  await page.getByRole('button', { name: 'loops', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Bridge precision' })).toBeVisible();
  await expect(page.locator('.loop-card').filter({ hasText: 'Bridge precision' }).getByText('Measures 12–16')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'loops', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('heading', { name: 'Bridge precision' })).toBeVisible();
  await page.getByRole('button', { name: 'Edit loop' }).last().click();
  await page.getByLabel('Edit name for Bridge precision').fill('Bridge locked');
  await page.getByLabel('Edit name for Bridge precision').press('Enter');
  await expect(page.getByRole('heading', { name: 'Bridge locked' })).toBeVisible();
  await page.getByRole('button', { name: 'Delete' }).first().click();
  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByTestId('loop-count')).toHaveText('0');
  await expect(page.getByRole('heading', { name: 'Your loop library is empty' })).toBeVisible();
  await page.getByRole('button', { name: 'Create a loop' }).click();
  await page.getByLabel('Loop name').fill('Fresh start');
  await page.getByRole('button', { name: 'Create loop' }).click();
  await expect(page.getByTestId('loop-count')).toHaveText('1');
});

test('controls_are_keyboard_accessible: session, schedule, alignment, and personalization', async ({ page }) => {
  await page.getByRole('button', { name: 'tempo', exact: true }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Start session' }).press('Enter');
  await expect(page.getByText('Playing · repetition 1 of 5')).toBeVisible();
  await page.getByRole('button', { name: 'Pause session' }).press('Space');
  await expect(page.getByText('Paused · progress preserved')).toBeVisible();
  await page.getByRole('button', { name: 'takes', exact: true }).click();
  await page.getByRole('button', { name: 'Accept alignment' }).click();
  await expect(page.getByText('Aligned take')).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Accepted alignment');
  await page.getByRole('button', { name: 'schedule', exact: true }).click();
  await page.getByRole('button', { name: 'Day 1 Open' }).click();
  await expect(page.getByRole('button', { name: /Day 1.*approved/ })).toBeVisible();
  await page.getByLabel('Accent').selectOption('coral');
  await page.getByLabel('Compact spacing').check();
  await page.getByRole('button', { name: 'Use dark theme' }).click();
  await page.reload();
  await expect(page.locator('.app')).toHaveClass(/dark/);
  await expect(page.getByLabel('Accent')).toHaveValue('coral');
  await expect(page.getByLabel('Compact spacing')).toBeChecked();
});

test('ac_04_interleave_ui_webmcp_match: UI and WebMCP share live state', async ({ page }) => {
  const tools = await page.evaluate(() => window.webmcp_list_tools());
  expect(Array.isArray(tools) ? tools.length : tools.tools.length).toBeGreaterThan(5);
  const created = await page.evaluate(() => window.webmcp_invoke_tool('entity.create', { name: 'MCP phrase', start: 9, end: 13, repetitions: 4 }));
  expect(created.ok).toBeTruthy();
  await page.getByRole('button', { name: 'loops', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'MCP phrase' })).toBeVisible();
  await page.evaluate(() => window.webmcp_invoke_tool('editor.set_content', { start: 9, end: 13 }));
  await expect(page.getByTestId('range-summary')).toHaveText('Measures 9–13');
  const preview = await page.evaluate(() => window.webmcp_invoke_tool('editor.preview', {}));
  expect(preview.range).toEqual({ start: 9, end: 13 });
  expect(preview.loopCount).toBe(2);
  await page.evaluate(() => window.webmcp_invoke_tool('session.start', {}));
  await page.getByRole('button', { name: 'tempo', exact: true }).click();
  await expect(page.getByText('Playing · repetition 1 of 5')).toBeVisible();
  const copied = await page.evaluate(() => window.webmcp_invoke_tool('artifact.copy', { format: 'practice-dossier-json' }));
  expect(copied.ok).toBeTruthy();
});

test('layout_adapts_desktop_to_mobile: controls remain reachable without overflow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(page.getByRole('button', { name: 'score', exact: true })).toBeVisible();
  const dimensions = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(dimensions.width).toBe(dimensions.client);
  // The callback executes in the browser, so DOM reads are synchronous.
  // eslint-disable-next-line playwright/missing-playwright-await
  const smallTargets = await page.locator('button:visible').evaluateAll(buttons => buttons.filter(button => { const rect = button.getBoundingClientRect(); return rect.width < 44 || rect.height < 44; }).map(button => button.getAttribute('aria-label') || button.textContent.trim()));
  expect(smallTargets).toEqual([]);
});

test('reduced_motion_is_respected: animation duration and console stay clean', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  // Playwright console messages expose synchronous type/text accessors.
  // eslint-disable-next-line playwright/missing-playwright-await
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  const duration = await page.locator('.panel').first().evaluate(element => getComputedStyle(element).animationDuration);
  expect(Number.parseFloat(duration)).toBeLessThanOrEqual(.001);
  expect(errors).toEqual([]);
  await context.close();
});
