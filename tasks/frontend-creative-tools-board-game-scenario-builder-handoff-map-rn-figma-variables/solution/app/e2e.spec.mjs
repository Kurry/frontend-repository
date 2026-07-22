import { test, expect } from '@playwright/test';

// Use the WebMCP injected globals directly as instructed
// listTools, invokeTool are injected by test runner, but we'll use evaluate for local execution fallback

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Seed the collection for deterministic testing
  await page.evaluate(() => window.webmcp_invoke_tool('seed_collection', {}));
});

// ==== END CANONICAL REGION — add task-specific criterion tests below. ====

// core_features.toml
test('scenario_crud Scenario Cards collection — Create, edit, archive, and filter scenario cards with explicit domain statuses (empty, draft, ready, changed, archived).', async ({ page }) => {
  // Filter for draft
  await page.locator('select').first().selectOption('draft');
  const items = await page.locator('.space-y-2 > div').count();
  expect(items).toBeGreaterThan(0);

  // Filter for all
  await page.locator('select').first().selectOption('all');

  // Create
  await page.getByRole('button', { name: 'Create' }).click();
  const titleInput = page.locator('input[type="text"]').first();
  await titleInput.fill('My New Test Scenario');
  await titleInput.blur();

  await expect(page.locator('.space-y-2').getByText('My New Test Scenario')).toBeVisible();

  // Edit status to archived
  await page.locator('select').nth(1).selectOption('archived');

  // Assert state updated in view
  await expect(page.locator('.space-y-2').getByText('My New Test Scenario').locator('..').getByText('archived')).toBeVisible();
});

test('exact_boundaries Exact field boundaries are accepted while adjacent out-of-range values are rejected.', async ({ page }) => {
  // Select first record
  await page.locator('.space-y-2 > div').first().click();

  // valid boundaries
  const diffInput = page.locator('input[type="number"]').first();
  await diffInput.fill('5');
  await diffInput.blur();

  const state = await page.evaluate(() => window.webmcp_invoke_tool('query_state', {}));
  expect(state.records.find(r => r.id === state.selectedRecordId).difficulty).toBe(5);

  // invalid boundary
  await diffInput.fill('6');
  await diffInput.blur();
  const state2 = await page.evaluate(() => window.webmcp_invoke_tool('query_state', {}));
  expect(state2.records.find(r => r.id === state2.selectedRecordId).difficulty).toBe(5); // preserved 5
});

test('invalid_recovery Invalid required fields preserve the prior valid record and explain recovery.', async ({ page }) => {
  await page.locator('.space-y-2 > div').first().click();

  const titleInput = page.locator('input[type="text"]').first();
  await titleInput.fill(' ');
  await titleInput.blur();

  await expect(page.getByText('Title cannot be empty. Preserved prior valid state.')).toBeVisible();
});

test('seeded_collection Seed the collection with at least 100 deterministic records in various states (empty, boundary, valid, conflict) without the target outcome pre-completed.', async ({ page }) => {
  const state = await page.evaluate(() => window.webmcp_invoke_tool('query_state', {}));
  expect(state.records.length).toBeGreaterThanOrEqual(100);
});

test('handoff_mutation Handoff Map surface — Use the handoff map interaction to connect a selected record to a handoff owner and update readiness.', async ({ page }) => {
  await page.locator('.space-y-2 > div').first().click(); // select a record

  // Find "Alice" owner button and connect
  await page.getByRole('button', { name: /Connect to Alice/ }).click();

  const state = await page.evaluate(() => window.webmcp_invoke_tool('query_state', {}));
  const r = state.records.find(rec => rec.id === state.selectedRecordId);
  expect(r.ownerId).toBe('owner-1');
  expect(r.status).toBe('ready');

  // Check derived state update
  expect(state.derived.summary.assigned).toBeGreaterThan(0);
});

test('undo_mutation Undo the last mutation (Ctrl/Cmd+Z) and inspect the linked representation. Undo restores ordering, selection, and derived values.', async ({ page }) => {
  await page.locator('.space-y-2 > div').first().click();

  const preState = await page.evaluate(() => window.webmcp_invoke_tool('query_state', {}));
  const originalAssigned = preState.derived.summary.assigned;

  await page.getByRole('button', { name: /Connect to Alice/ }).click();

  // Undo
  await page.keyboard.press('Control+z');

  const postState = await page.evaluate(() => window.webmcp_invoke_tool('query_state', {}));
  expect(postState.derived.summary.assigned).toBe(originalAssigned);
});

test('reject_conflict A conflicting or incomplete mutation is rejected without partial updates.', async ({ page }) => {
  await page.locator('.space-y-2 > div').first().click();

  // Assign to Alice
  await page.getByRole('button', { name: /Connect to Alice/ }).click();

  // Try assigning to Alice again (conflict)
  await page.getByRole('button', { name: /Connect to Alice/ }).click();

  const state = await page.evaluate(() => window.webmcp_invoke_tool('query_state', {}));
  expect(state.error).toBe('Cannot connect to the same owner.');
});

test('export_artifact Portable work artifact — Export the current artifact, containing schemaVersion, exportedAt, records[], derived{}, and history[].', async ({ page }) => {
  const result = await page.evaluate(() => window.webmcp_invoke_tool('export_artifact', {}));
  const parsed = JSON.parse(result.artifact);
  expect(parsed.schemaVersion).toBe('v1');
  expect(parsed.exportedAt).toBeDefined();
  expect(parsed.records).toBeDefined();
  expect(parsed.derived).toBeDefined();
  expect(parsed.history).toBeDefined();
});

test('clear_session Clear the current session.', async ({ page }) => {
  await page.getByRole('button', { name: 'Clear' }).click();
  const state = await page.evaluate(() => window.webmcp_invoke_tool('query_state', {}));
  expect(state.records.length).toBe(0);
});

test('import_validation Import an artifact with field-level validation. Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.', async ({ page }) => {
  const invalidArtifact = JSON.stringify({
    schemaVersion: 'v1',
    records: [{ id: '1', title: 'Invalid', status: 'empty', ownerId: 'fake-owner', difficulty: 9, duration: -1 }]
  });

  const prevState = await page.evaluate(() => window.webmcp_invoke_tool('query_state', {}));
  await page.evaluate((json) => window.webmcp_invoke_tool('import_artifact', { json }), invalidArtifact);

  const postState = await page.evaluate(() => window.webmcp_invoke_tool('query_state', {}));
  expect(postState.records.length).toBe(prevState.records.length); // no change
});

test('valid_import_restores A valid import restores authored structure and regenerates exportedAt.', async ({ page }) => {
  const result = await page.evaluate(() => window.webmcp_invoke_tool('export_artifact', {}));

  await page.getByRole('button', { name: 'Clear' }).click();

  await page.evaluate((json) => window.webmcp_invoke_tool('import_artifact', { json }), result.artifact);

  const postState = await page.evaluate(() => window.webmcp_invoke_tool('query_state', {}));
  expect(postState.records.length).toBeGreaterThan(0);
});

// visual_design.toml
// NOT-AUTOMATABLE: visual_hierarchy — The visual hierarchy makes current state and next action clear.
// NOT-AUTOMATABLE: domain_workbench — A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.

test('desktop_layout Desktop layout has a primary surface plus summary and inspector.', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  // List on left
  const listRect = await page.locator('.flex-none').first().boundingBox();
  // Map in center
  const mapRect = await page.locator('.flex-1').nth(1).boundingBox();
  // Editor on right
  const editorRect = await page.locator('.flex-none').last().boundingBox();

  expect(listRect.x).toBeLessThan(mapRect.x);
  expect(mapRect.x).toBeLessThan(editorRect.x);
});

// motion.toml
// NOT-AUTOMATABLE: causal_motion — The acted-on item moves or morphs into its new state.
// NOT-AUTOMATABLE: reduced_motion — Reduced motion preserves feedback without transforms.

// technical.toml
test('in_memory_only NO localStorage; entirely in-memory.', async ({ page }) => {
  await page.locator('.space-y-2 > div').first().click();
  await page.getByRole('button', { name: /Connect to Alice/ }).click();

  const ls = await page.evaluate(() => window.localStorage.length);
  expect(ls).toBe(0);

  await page.reload();

  const state = await page.evaluate(() => window.webmcp_invoke_tool('query_state', {}));
  expect(state.records.length).toBe(0); // Should be clear on reload, since in-memory only
});

test('webmcp_contract WebMCP contract implemented to support CRUD, status, validation, query, canonical mutation, derived state, undo, and export/import.', async ({ page }) => {
  const tools = await page.evaluate(() => window.webmcp_list_tools());
  const names = tools.map(t => t.name);
  expect(names).toContain('query_state');
  expect(names).toContain('connect_owner');
  expect(names).toContain('export_artifact');
});
