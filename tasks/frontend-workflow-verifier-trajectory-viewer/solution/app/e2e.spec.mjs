// ==== END CANONICAL REGION — add task-specific criterion tests below. ====
import { test, expect } from '@playwright/test';

test.describe('135 Criteria E2E Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
  });

  test('1.4 feedback_uses_live_regions', async ({ page }) => {
    // 1. Export copy confirmation
    // Click the first task in the list
    await page.click('button[aria-label^="Open task"]');
    await expect(page.locator('text=Trial register')).toBeVisible();

    // Click the first trial in the list
    await page.locator('tr[aria-label^="Open review workspace"]').first().click();
    await expect(page.locator('h2:has-text("Verdict register")').first()).toBeVisible();

    await page.click('text=Export review package');

    // Check export copy
    await page.click('button:has-text("Copy")');
    const copyNotice = page.locator('[role="status"][aria-live="polite"]');
    await expect(copyNotice).toBeVisible();
    await expect(copyNotice).toContainText('copied to clipboard');

    await page.click('button[aria-label="Close export drawer"]');

    // 2. Validation errors (Bulk Apply)
    // The tour might be open, let's close it first if it exists
    await page.locator('button:has-text("Dismiss tour")').click().catch(() => {});
    await page.click('button:has-text("Flips only")');
    const checkboxes = page.locator('input[type="checkbox"]');
    await checkboxes.nth(0).click();
    await page.click('text=Apply classification to selected');

    // Check classification error
    const classificationError = page.locator('#bulk-classification-error');
    await expect(classificationError).toBeVisible();
    const classificationSelect = page.locator('button[aria-label="classification"]');
    // React-aria Select triggers don't keep aria-invalid effectively.
    // Wait, the new rule is we test ONLY `aria-describedby` for select, and `aria-invalid` for others.
    await expect(classificationSelect).toHaveAttribute('aria-describedby', 'bulk-classification-error');

    // Check rationale error
    const rationaleError = page.locator('#bulk-rationale-error');
    await expect(rationaleError).toBeVisible();
    const rationaleInput = page.locator('input[placeholder*="Explain the selected criteria"]');
    await expect(rationaleInput).toHaveAttribute('aria-invalid', 'true');
    await expect(rationaleInput).toHaveAttribute('aria-describedby', 'bulk-rationale-error');

    // 3. Validation errors (Import)
    await page.click('button:has-text("Import review package")');
    // Clear first to trigger required error
    await page.fill('textarea[name="json"]', '');
    await page.click('button[type="submit"]:has-text("Import review package")');

    const importJsonError = page.locator('#import-json-error');
    await expect(importJsonError).toBeVisible();
    const jsonTextarea = page.locator('textarea[name="json"]');
    await expect(jsonTextarea).toHaveAttribute('aria-invalid', 'true');
    await expect(jsonTextarea).toHaveAttribute('aria-describedby', 'import-json-error');

    // also check JSON parse error
    await page.fill('textarea[name="json"]', '{ invalid json }');
    await page.click('button[type="submit"]:has-text("Import review package")');
    await expect(page.locator('text=Import validation failed')).toBeVisible();

    // Check successful import
    const validJson = JSON.stringify({
      schemaVersion: "review-package/v1",
      exportedAt: new Date().toISOString(),
      taskId: "28e7cd18-49d7-4660-84a5-93c6628fcb97",
      trialId: "4b82d3f9-671c-438a-8e24-95b7194f280a",
      model: "claude-3-5-sonnet",
      activeLabel: "v2-run",
      comparedLabels: ["v1-run", "v2-run"],
      dimensionRollup: {
        "core_features": { "score": 1, "weight": 2 },
        "edge_cases": { "score": 1, "weight": 1 },
        "visual_design": { "score": 1, "weight": 1 },
        "performance": { "score": 1, "weight": 1 }
      },
      adjudications: [
        {
          criterionId: "1.2",
          classification: "agent-bug",
          rationale: "This is a valid rationale for testing.",
          reviewedAt: new Date().toISOString(),
          evidenceStepIds: []
        }
      ],
      summaryCounts: {
        "agent-bug": 1,
        "rubric-bug": 0,
        "scorer-error": 0
      },
      flipCriterionIds: ["1.2"]
    });

    await page.fill('textarea[name="json"]', validJson);
    await page.click('button[type="submit"]:has-text("Import review package")');

    const globalAnnouncement = page.locator('div[aria-live="polite"] span');
    await expect(globalAnnouncement).toContainText('Imported 1 adjudications successfully');
  });
});
