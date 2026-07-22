import { test, expect } from '@playwright/test';

// ==== START CANONICAL REGION ====
// This region is intentionally left empty.
// ==== END CANONICAL REGION — add task-specific criterion tests below. ====

test('AC-01 signature_mutation', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Select "Nine Patch" (initially empty)
  await page.click('button:has-text("Nine Patch")');

  // Verify it says Requires valid evidence
  await expect(page.locator('text=Requires valid evidence')).toBeVisible();

  // Input evidence
  await page.fill('[data-testid="evidence-input"]', 'Attached evidence photo');

  // Click Resolve
  await page.click('[data-testid="resolve-button"]');

  // Verify UI changes
  await expect(page.locator('text=Discrepancy resolved')).toBeVisible();
  await expect(page.locator('[data-testid="resolve-button"]')).toHaveText('Resolved');

  // Verify status token updated to READY
  const blockBtn = page.locator('[data-testid="block-4"]');
  await expect(blockBtn.locator('span:has-text("ready")')).toBeVisible();

  // Verify WebMCP
  const webmcpResult = await page.evaluate(() => window.webmcp_invoke_tool('quilt_query', {}));
  const block = webmcpResult.records.find(r => r.id === '4');
  expect(block.auditEvidence).toBe('Attached evidence photo');
  expect(block.auditDiscrepancyResolved).toBe(true);
  expect(block.status).toBe('ready');
});

test('AC-04 schema_contract', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const artifact = await page.evaluate(() => window.webmcp_invoke_tool('export_artifact', {}));
  expect(artifact.schemaVersion).toBe('v1');
  expect(artifact.exportedAt).toBeDefined();
  expect(Array.isArray(artifact.records)).toBe(true);
  expect(artifact.records[0].id).toBe('1');
  expect(artifact.derived.totalBlocks).toBe(4);
  expect(Array.isArray(artifact.history)).toBe(true);
});

test('AC-05 complete_user_flow', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Create
  await page.click('button:has-text("Add Block")');

  // Find the new block (it will have name "New Block")
  const newBlock = page.locator('button:has-text("New Block")').first();
  await newBlock.click();

  // Edit
  const nameInput = page.locator('input[type="text"]').first();
  await nameInput.fill('My Custom Block');
  await expect(page.locator('button:has-text("My Custom Block")').first()).toBeVisible();

  // Mutate
  await page.fill('[data-testid="evidence-input"]', 'Proof');
  await page.click('[data-testid="resolve-button"]');
  await expect(page.locator('text=Discrepancy resolved')).toBeVisible();

  // Undo
  await page.click('button:has-text("Undo")');
  await expect(page.locator('text=Requires valid evidence')).toBeVisible();
});

test('AC-06 boundaries_recovery', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Select first block
  await page.click('button:has-text("Morning Star")');

  // Invalid input for fabric count
  const fabricInput = page.locator('input[type="number"]');
  await fabricInput.fill('-5');

  // Verify error
  await expect(page.locator('text=Fabric count must be a positive number')).toBeVisible();

  // Invalid import
  await page.setInputFiles('[data-testid="import-input"]', {
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ schemaVersion: 'v2' })) // invalid schema
  });

  await expect(page.locator('text=Invalid schema version')).toBeVisible();

  // Preserves prior state (still 4 blocks)
  const blocks = await page.locator('ul.space-y-2 > li').count();
  expect(blocks).toBe(4);
});

test('AC-08 alternate_input', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Focus via tab to Nine Patch
  await page.focus('button:has-text("Nine Patch")');
  await page.keyboard.press('Enter');

  // Tab to evidence input
  await page.focus('[data-testid="evidence-input"]');
  await page.keyboard.type('Keyboard evidence');

  // Tab to resolve
  await page.focus('[data-testid="resolve-button"]');
  await page.keyboard.press('Enter');

  await expect(page.locator('text=Discrepancy resolved')).toBeVisible();
});

test('AC-11 linked_utility', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Check initial summary (1 ready block)
  await expect(page.locator('.text-green-800:has-text("1")')).toBeVisible();

  // Make a block ready
  await page.click('button:has-text("Log Cabin")'); // draft
  await page.fill('[data-testid="evidence-input"]', 'Linked update');
  await page.click('[data-testid="resolve-button"]');

  // Verify derived summary updated to 2
  await expect(page.locator('.text-green-800:has-text("2")')).toBeVisible();
});

test('AC-13 artifact_round_trip', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Export initial
  const exported = await page.evaluate(() => window.webmcp_invoke_tool('export_artifact', {}));

  // Delete a block to change state
  await page.click('button:has-text("Morning Star")');
  await page.fill('input[type="number"]', '999');
  await expect(page.locator('text=999 fabrics')).toBeVisible();

  // Import original
  await page.evaluate((data) => window.webmcp_invoke_tool('import_artifact', { artifact: data }), exported);

  // Verify reverted
  await expect(page.locator('text=12 fabrics').first()).toBeVisible();
});

// NOT-AUTOMATABLE: AC-02 — visual hierarchy and next action clarity is subjective.
// NOT-AUTOMATABLE: AC-03 — causal motion connection to state changes is subjective/visual.
// NOT-AUTOMATABLE: AC-07 — desktop becoming stack/drawer/stepper without horizontal overflow is subjective layout intent.
// NOT-AUTOMATABLE: AC-09 — performance on large collections (100+) without rebuilding unrelated surfaces is a subjective framerate/profiling metric.
// NOT-AUTOMATABLE: AC-10 — copy naming domain consequences precisely is subjective writing.
// NOT-AUTOMATABLE: AC-12 — design fidelity coherence to source thesis is subjective visual design.
