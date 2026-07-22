import { test, expect } from '@playwright/test';

test.describe('Weekly Review Evidence Deck E2E', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  // ==== CANONICAL REGION — do not modify below this line until END CANONICAL REGION ====
  test('verify webmcp session info', async ({ page }) => {
    const sessionInfo = await page.evaluate(() => window.webmcp_session_info);
    expect(sessionInfo).toBeDefined();
    expect(sessionInfo.version).toBe('zto-webmcp-v1');
    expect(sessionInfo.capabilities).toContain('data-tracking');
    expect(sessionInfo.capabilities).toContain('artifact-transfer');
  });

  test('verify webmcp list tools', async ({ page }) => {
    const tools = await page.evaluate(() => window.webmcp_list_tools());
    expect(tools.length).toBeGreaterThan(0);
    expect(tools.find(t => t.name === 'entity_query')).toBeDefined();
    expect(tools.find(t => t.name === 'artifact_export')).toBeDefined();
  });
  // ==== END CANONICAL REGION — add task-specific criterion tests below. ====

  test('AC-01 core_features reconcile-intervals', async ({ page }) => {
    const ribbon = page.locator('[data-testid="ribbon"]');
    await expect(ribbon).toBeVisible();
    await expect(ribbon.locator('button:has-text("Link Evidence")').first()).toBeVisible();
  });

  test('AC-01 core_features allocate-evidence', async ({ page }) => {
    const graph = page.locator('[data-testid="provenance-graph"]');
    await expect(graph).toBeVisible();
    await expect(graph).toContainText('Provenance Graph');
  });

  test('AC-01 core_features classify-variance', async ({ page }) => {
    const variance = page.locator('[data-testid="outcome-variance"]');
    await expect(variance).toBeVisible();
    await variance.locator('button:has-text("Mark Completed")').first().click();
    await expect(variance).toContainText('completed');
  });

  test('AC-01 core_features branch-carry-forward', async ({ page }) => {
    const branches = page.locator('[data-testid="branches"]');
    await expect(branches).toBeVisible();
    await branches.locator('button:has-text("Create Defer Branch")').click();
    await expect(branches).toContainText('defer');
  });

  test('AC-01 core_features place-capacity', async ({ page }) => {
    // Needs branches first
    const branches = page.locator('[data-testid="branches"]');
    await branches.locator('button:has-text("Create Defer Branch")').click();

    const capacity = page.locator('[data-testid="capacity-terrain"]');
    await expect(capacity).toBeVisible();
    await capacity.locator('button:has-text("Place First Branch")').click();
    await expect(capacity).toContainText('Monday AM');
  });

  test('AC-01 core_features close-rebase', async ({ page }) => {
    const reviewClose = page.locator('[data-testid="review-close"]');
    await expect(reviewClose).toBeVisible();
    await reviewClose.locator('button:has-text("Close Review")').click();
    await expect(reviewClose).toContainText('Closed');
    await expect(reviewClose.locator('button:has-text("Rebase (Late Evidence)")')).toBeVisible();
  });

  test('AC-01 core_features export-artifacts', async ({ page }) => {
    const reviewClose = page.locator('[data-testid="review-close"]');
    await expect(reviewClose.locator('button:has-text("Export Artifacts")')).toBeVisible();
    await reviewClose.locator('button:has-text("Export Artifacts")').click();
  });

  // NOT-AUTOMATABLE: inspect-planned-observed-states - Visual distinction
  // NOT-AUTOMATABLE: inspect-outcome-variance-states - Visual distinction
  // NOT-AUTOMATABLE: inspect-branch-capacity-states - Visual distinction
  // NOT-AUTOMATABLE: inspect-stale-closed-states - Visual distinction
  // NOT-AUTOMATABLE: causal-motion-links-allocations - Animation verification
  // NOT-AUTOMATABLE: causal-motion-branch-merge - Animation verification
  // NOT-AUTOMATABLE: causal-motion-stale-rebase - Animation verification
  // NOT-AUTOMATABLE: reduced-motion - Animation verification
  // NOT-AUTOMATABLE: interleave-actions-canonical-match - Complex interleaving verification
});
