import { test, expect } from '@playwright/test';

test.describe('Apparel Fit Annotation Studio - Audit Lens - Job Viewer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForFunction(() => window.webmcp_session_info !== undefined);
  });

  test('AC-01 signature_mutation', async ({ page }) => {
    await page.click('text=Annotation 1');
    await expect(page.locator('h3', { hasText: 'Annotation 1' })).toBeVisible();
    await expect(page.locator('text=Missing')).toBeVisible();

    const initialResolved = await page.locator('text=of 110 resolved').innerText();

    await page.click('button:has-text("Attach Evidence & Resolve")');

    await expect(page.locator('text=Audit Discrepancy Resolved')).toBeVisible();

    const recordRow = page.locator('div[data-testid="record-rec-1"]');
    await expect(recordRow.locator('span', { hasText: 'ready' })).toBeVisible();

    const finalResolved = await page.locator('text=of 110 resolved').innerText();
    expect(finalResolved).not.toBe(initialResolved);
  });

  test('AC-04 schema_contract', async ({ page }) => {
    const sessionInfo = await page.evaluate(async () => await window.webmcp_session_info());
    expect(sessionInfo.contract_version).toBe('zto-webmcp-v1');
    expect(sessionInfo.modules).toContain('artifact-transfer-v1');

    const exportData = await page.evaluate(async () => await window.webmcp_invoke_tool('artifact_export'));
    expect(exportData.schemaVersion).toBe('fit-annotations-v1');
    expect(exportData.records.length).toBe(110);
    expect(exportData.derived).toBeDefined();
    expect(exportData.history).toBeDefined();
    expect(typeof exportData.exportedAt).toBe('string');
  });

  test('AC-05 complete_user_flow', async ({ page }) => {
    await page.click('button:has-text("New")');
    await page.fill('input[name="title"]', 'Flow Test Record');
    await page.fill('input[name="measurement"]', '42');
    await page.click('button:has-text("Save")');

    await expect(page.locator('text=Flow Test Record')).toBeVisible();

    await page.click('text=Flow Test Record');
    await page.click('button:has-text("Attach Evidence & Resolve")');
    await expect(page.locator('text=Audit Discrepancy Resolved')).toBeVisible();

    await page.keyboard.press('Control+z');
    await expect(page.locator('text=Attach Evidence & Resolve')).toBeVisible();
  });

  test('AC-06 boundaries_recovery', async ({ page }) => {
    await page.click('button:has-text("New")');
    await page.click('button:has-text("Save")');
    await expect(page.locator('text=Title is required')).toBeVisible();

    await page.fill('input[name="title"]', 'Valid Title');
    await page.fill('input[name="measurement"]', '-5');
    await expect(page.locator('text=Measurement must be non-negative')).toBeVisible();

    await page.fill('input[name="measurement"]', '10');
    await page.click('button:has-text("Save")');
    await expect(page.locator('text=Valid Title')).toBeVisible();

    const res = await page.evaluate(async () => {
      try {
        await window.webmcp_invoke_tool('artifact_import', { payload: { invalid: 'schema' } });
        return 'success';
      } catch (err) {
        return err.message;
      }
    });
    expect(res).toContain('Malformed schema');
  });

  test('AC-07 mobile_mode', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.click('text=Annotation 1');

    const noOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth;
    });
    expect(noOverflow).toBe(true);
  });

  test('AC-08 alternate_input', async ({ page }) => {
    await page.keyboard.press('Tab');

    await page.click('text=Annotation 1');
    await page.click('button:has-text("Attach Evidence & Resolve")');
    await expect(page.locator('text=Audit Discrepancy Resolved')).toBeVisible();

    await page.keyboard.press('Control+z');
    await page.keyboard.press('Escape');
    await expect(page.locator('text=Select an annotation to audit')).toBeVisible();
  });

  test('AC-09 large_collection', async ({ page }) => {
    await page.click('text=Annotation 100');
    await expect(page.locator('h3', { hasText: 'Annotation 100' })).toBeVisible();
  });

  test('AC-11 linked_utility', async ({ page }) => {
    await page.click('text=Annotation 4');
    await page.click('button:has-text("Attach Evidence & Resolve")');

    const summary = await page.locator('.bg-blue-50').innerText();
    expect(summary).toContain('Resolved');
  });

  test('AC-13 artifact_round_trip', async ({ page }) => {
    await page.click('div[data-testid="record-rec-5"]');
    await page.click('button:has-text("Attach Evidence & Resolve")');
    await expect(page.locator('text=Audit Discrepancy Resolved')).toBeVisible();

    const exportedState = await page.evaluate(async () => await window.webmcp_invoke_tool('artifact_export'));

    page.once('dialog', dialog => dialog.accept());
    await page.click('button:has-text("Clear Session")');

    await expect(page.locator('text=No records found')).toBeVisible();

    await page.evaluate(async (state) => await window.webmcp_invoke_tool('artifact_import', { payload: state }), exportedState);

    await expect(page.locator('div[data-testid="record-rec-5"]')).toBeVisible();
    await page.click('div[data-testid="record-rec-5"]');
    await expect(page.locator('text=Audit Discrepancy Resolved')).toBeVisible();
  });

  // NOT-AUTOMATABLE: AC-02 visual_hierarchy - Visual design thesis requires human review.
  // NOT-AUTOMATABLE: AC-03 causal_motion - Requires subjective evaluation of motion quality and appropriateness.
  // NOT-AUTOMATABLE: AC-10 domain_copy - Subjective review of domain naming appropriateness.
  // NOT-AUTOMATABLE: AC-12 source_fidelity - Human review required to ensure not copying unrelated screens directly.
});
