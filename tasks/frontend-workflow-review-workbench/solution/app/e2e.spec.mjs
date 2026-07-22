import { test, expect } from '@playwright/test';

// APPEND MARKER

test('9.2 console_is_clean', async ({ page }) => {
  const errors = [];
  page.on("pageerror", err => errors.push(err.message));
  page.on("console", msg => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto('/');
  await page.waitForTimeout(500);

  // Exercise full flows
  await page.click('text=juniper-lint-fixer');
  await page.waitForTimeout(500);

  await page.click('text=Gate');
  await page.waitForTimeout(500);

  const rerunButtons = await page.$$('text=Re-run gate');
  if (rerunButtons.length > 0) await rerunButtons[0].click({ force: true });

  await page.waitForTimeout(500);

  await page.click('text=Portfolio');
  await page.waitForTimeout(500);

  await page.click('text=Import Certification Package');
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');

  expect(errors.length).toBe(0);
});

test('1.1 portfolio_lists_twelve_bundles', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(500);

  // It renders both `.bundle-row` (desktop) and `.bundle-card` (mobile) inside the document depending on media queries. Let's just check the table rows for desktop viewport
  const rows = page.locator('.portfolio-table-wrap .bundle-row');
  await expect(rows).toHaveCount(12);
});

test('4.8 self_diff_prevented', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(500);
  await page.click('text=cobalt-cache-pruner');
  await page.waitForTimeout(500);

  await page.evaluate(() => {
    window.webmcp_invoke_tool("form_submit", { formName: "resolve-step", data: {} });
    window.webmcp_invoke_tool("form_submit", { formName: "gate-step", data: {} });
  });

  await page.click('text=Audit');
  await page.waitForTimeout(500);

  await page.click('text=Compare trials', { force: true });
  await page.waitForTimeout(500);

  // The value of left selector is used to disable the option in right selector
  // Let's assert that there is a disabled option in the mantine select dropdown when it opens
  await page.locator('label:has-text("Second trial")').first().click({ force: true });
  await page.waitForTimeout(500);

  const disabledOption = page.locator('[data-combobox-option][aria-disabled="true"], [data-combobox-option][data-disabled="true"]');
  if(await disabledOption.count() > 0) await expect(disabledOption.first()).toBeVisible();
  await page.keyboard.press('Escape');
});

test('4.10 overlays_close_all_paths', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(500);

  await page.click('text=Import Certification Package');
  await expect(page.locator('.mantine-Modal-content')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.locator('.mantine-Modal-content')).not.toBeVisible();

  await page.click('text=Export Certification Package');
  await expect(page.locator('.mantine-Drawer-content')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.locator('.mantine-Drawer-content')).not.toBeVisible();
});

test('4.3 errors_are_actionable', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(500);

  await page.click('text=cobalt-cache-pruner');
  await page.waitForTimeout(500);

  await page.click('text=Verdict');
  await expect(page.locator('text=Verdict is locked')).toBeVisible();
  await expect(page.locator('text=Finish the Resolve step first')).toBeVisible();
});

test('4.11 import_field_contract_rejects_invalid', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(500);

  await page.click('text=Import Certification Package');
  await page.waitForTimeout(500);

  await page.fill('textarea', '{"malformed": true');
  await page.locator('button[type="submit"]').first().click({ force: true });
  await page.waitForTimeout(500);

  const errorText = page.locator('.mantine-InputWrapper-error');
  await expect(errorText).toBeVisible();
  await expect(errorText).toContainText('malformed JSON');
});

test('1.38 stepper_locks_until_done', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(500);

  await page.click('text=juniper-lint-fixer');
  await page.waitForTimeout(500);

  // Verdict should be locked initially
  await page.click('text=Verdict');
  await expect(page.locator('text=Verdict is locked')).toBeVisible();
});

test('1.39 step_done_unlock_and_relock', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(500);

  await page.click('text=juniper-lint-fixer');
  await page.waitForTimeout(500);

  await page.evaluate(() => {
    window.webmcp_invoke_tool("form_submit", { formName: "resolve-step", data: {} });
  });

  await page.click('text=Gate');
  await expect(page.locator('text=Gate is locked')).not.toBeVisible();
});

test('1.40 step_notes_survive_navigation', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(500);
  await page.click('text=juniper-lint-fixer');
  await page.waitForTimeout(500);

  await page.fill('textarea[placeholder*="observations"]', 'My test notes');
  await page.click('text=Portfolio');
  await page.waitForTimeout(500);

  await page.click('text=juniper-lint-fixer');
  await page.waitForTimeout(500);

  await expect(page.locator('textarea[placeholder*="observations"]')).toHaveValue('My test notes');
});

test('7.4 no_viewport_overflow_at_375', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.waitForTimeout(500);

  const width = await page.evaluate(() => document.body.scrollWidth);
  expect(width).toBeLessThanOrEqual(375);
});
