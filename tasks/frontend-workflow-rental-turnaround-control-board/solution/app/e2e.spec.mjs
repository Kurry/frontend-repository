import { test, expect } from '@playwright/test';

// ==== BEGIN CANONICAL REGION ====
// Globals provided by the grading environment:
// test, expect, listTools, invokeTool
// ==== END CANONICAL REGION — add task-specific criterion tests below. ====

const mockInvokeTool = async (page, toolName, params) => {
  return await page.evaluate(async ({ toolName, params }) => {
    return window.webmcp_invoke_tool(toolName, params);
  }, { toolName, params });
};

test('cf-01 Inspect and select floorplan loci', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('svg').first()).toBeVisible();

  const firstRoom = page.locator('svg rect').first();
  await firstRoom.click();

  const state = await mockInvokeTool(page, 'get_state', {});
  expect(state.selection.length).toBeGreaterThan(0);
});

test('cf-02 View evidence ledger', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.getByText('Findings & Evidence Ledger')).toBeVisible();
  await expect(page.locator('img').first()).toBeVisible();
});

test('cf-03 Schedule work on timeline', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.getByRole('button', { name: /Add Task/ }).click();

  const state = await mockInvokeTool(page, 'get_state', {});
  expect(state.tasks.length).toBeGreaterThan(0);
});

test('cf-04 Manage inventory and custody', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.getByText('Reserve').first().click();
  await page.getByText('Check Out').first().click();

  const state = await mockInvokeTool(page, 'get_state', {});
  expect(state.inventoryLots[0].available).toBeLessThan(10);
  expect(state.custodyEvents.length).toBeGreaterThan(0);
});

test('cf-05 Advance clock and dispatch', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.getByText('Advance Clock').click();

  await page.getByRole('button', { name: /Add Task/ }).click();
  await page.getByText('Dispatch Previews').click();

  const state = await mockInvokeTool(page, 'get_state', {});
  expect(state.clock).toBeGreaterThan(1);
  expect(state.tasks.some(t => t.status === 'dispatched')).toBeTruthy();
});

test('cf-06 Export artifacts', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByText('Export Packet (.zip)').click()
  ]);

  expect(download.suggestedFilename()).toBe('turnaround-packet.zip');
});

// NOT-AUTOMATABLE: vd-01 — visual design check for selected loci highlighted
// NOT-AUTOMATABLE: vd-02 — visual design check for clear state indications
// NOT-AUTOMATABLE: mo-01 — motion check for task block resize motion
// NOT-AUTOMATABLE: mo-02 — motion check for causal updates
// NOT-AUTOMATABLE: te-01 — technical check for no localStorage used
// NOT-AUTOMATABLE: te-02 — technical check for WebMCP bindings
