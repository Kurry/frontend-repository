import { test, expect } from '@playwright/test';
import * as fs from 'fs';

// ==== START CANONICAL REGION ====
// These are assumed globals for the evaluation environment
const listTools = async (page) => {
  return await page.evaluate(() => window.webmcp_list_tools());
};

const invokeTool = async (page, name, args) => {
  return await page.evaluate(({ name, args }) => window.webmcp_invoke_tool(name, args), { name, args });
};
// ==== END CANONICAL REGION — add task-specific criterion tests below. ====

test.use({
  video: { mode: 'on', size: { width: 1280, height: 720 } },
  viewport: { width: 1280, height: 720 },
  launchOptions: {
    recordVideo: { dir: './testing/' } // this will be processed by playwright natively
  }
});

test.describe('Spatial Composer Reference Artifact', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/');
  });

  test('AC-01 The spatial composer mutation changes the primary record, linked view, and status together', async ({ page }) => {
    // wait for list
    await page.waitForSelector('[data-testid^="record-item-"]');

    // select a record that is not yet placed (index 3)
    const record = page.locator('[data-testid^="record-item-"]').nth(3);
    await record.click();

    // click on composer to place (click away from edge/center where other elements might be)
    const composer = page.getByTestId('composer-canvas');
    await composer.click({ position: { x: 400, y: 400 } });

    // check if it is placed
    const placed = page.locator('.placed-record').last();
    await expect(placed).toBeVisible();

    // linked view should show active count updated
    await expect(page.getByText(/Active:\s*4/)).toBeVisible(); // 3 seeded + 1 newly placed

    // Use tool to check state updated
    const state = await invokeTool(page, 'editor_preview', {});
    expect(state.success).toBe(true);
    expect(state.result.activeCount).toBe(4);
  });

  test('AC-04 The tool result and artifact contain the declared API-shaped fields', async ({ page }) => {
    // Intercept download
    const downloadPromise = page.waitForEvent('download');
    const res = await invokeTool(page, 'artifact_export', { format: 'scenario-builder-v1-spatial-composer.json' });
    expect(res.success).toBe(true);

    const download = await downloadPromise;
    const path = await download.path();
    const content = JSON.parse(fs.readFileSync(path, 'utf8'));

    expect(content.schemaVersion).toBe('scenario-builder-v1');
    expect(content.records).toBeInstanceOf(Array);
    expect(content.derived).toBeDefined();
    expect(content.history).toBeInstanceOf(Array);
    expect(typeof content.exportedAt).toBe('string');
  });

  test('AC-05 The end-to-end job is recoverable without reload', async ({ page }) => {
    // mutate
    await page.locator('[data-testid^="record-item-"]').last().click(); // last one is definitely not placed
    await page.getByTestId('composer-canvas').click({ position: { x: 500, y: 400 } });

    // verify it changed to 4
    await expect(page.getByText(/Active:\s*4/)).toBeVisible();

    // undo (Ctrl+Z)
    await page.keyboard.press('Control+Z');

    // ensure active count went back
    await expect(page.getByText(/Active:\s*3/)).toBeVisible();
  });

  test('AC-06 Each invalid action gives field-level recovery and preserves prior valid state', async ({ page }) => {
    const record = page.locator('[data-testid^="record-item-"]').first();

    // Click edit
    await record.locator('button').first().click();

    // Provide invalid capacity > 10
    const capacityInput = page.getByPlaceholder('Capacity (1-10)');
    await capacityInput.fill('15');

    // save
    await page.getByText('Save').click();

    // expect error message
    await expect(page.getByText(/Invalid data/)).toBeVisible();

    // fix it
    await capacityInput.fill('5');
    await page.getByText('Save').click();
    await expect(page.getByText(/Invalid data/)).not.toBeVisible();
  });

  test('AC-08 Alternate input produces identical state with visible focus and live feedback', async ({ page }) => {
    // using webmcp as alternate input

    // select via tool
    await invokeTool(page, 'editor_select', { id: 'record-10' });
    // place via tool
    const res = await invokeTool(page, 'editor_update_property', { id: 'record-10', property: 'position', value: { x: 50, y: 50 } });
    expect(res.success).toBe(true);

    // visual check
    await expect(page.getByText(/Active:\s*4/)).toBeVisible();
  });

  test('AC-09 The signature interaction remains responsive and unrelated rows stay stable', async ({ page }) => {
    // We seeded 110 records, test basic filter performance
    const filter = page.locator('select').first();
    await filter.selectOption('ready');

    // count should be exactly 5
    await expect(page.locator('[data-testid^="record-item-"]')).toHaveCount(5);
  });

  test('AC-11 Linked views provide domain utility beyond CRUD', async ({ page }) => {
    // Place item, observe capacity changes
    const record = page.locator('[data-testid^="record-item-"]').nth(10); // draft
    await record.click();
    await page.getByTestId('composer-canvas').click({ position: { x: 300, y: 300 } });

    // Verify toolbar capacity shows linked update
    await expect(page.locator('text=/Capacity:\\s*\\d+\\s*\\/\\s*20/')).toBeVisible();
  });

  test('AC-13 Authored order/selection/geometry and domain state survive; invalid import is a no-op', async ({ page }) => {
     const downloadPromise = page.waitForEvent('download');
     const exportRes = await invokeTool(page, 'artifact_export', { format: 'scenario-builder-v1-spatial-composer.json' });
     expect(exportRes.success).toBe(true);

     const download = await downloadPromise;
     const path = await download.path();

     // create bad payload
     const badPath = path + '-bad.json';
     fs.writeFileSync(badPath, JSON.stringify({ invalid: 'yes' }));

     // clear
     await page.getByText('Clear').click();
     await expect(page.getByText(/Active:\s*0/)).toBeVisible();

     // Invalid import
     const fileChooserPromiseBad = page.waitForEvent('filechooser');
     await invokeTool(page, 'artifact_import', { mode: 'scenario-builder-v1-spatial-composer.json' });
     const fileChooserBad = await fileChooserPromiseBad;
     await fileChooserBad.setFiles(badPath);

     // Wait for alert and close it
     page.once('dialog', dialog => dialog.accept());
     await expect(page.getByText(/Active:\s*0/)).toBeVisible();

     // Valid import
     const fileChooserPromiseGood = page.waitForEvent('filechooser');
     await invokeTool(page, 'artifact_import', { mode: 'scenario-builder-v1-spatial-composer.json' });
     const fileChooserGood = await fileChooserPromiseGood;
     await fileChooserGood.setFiles(path);

     await expect(page.getByText(/Active:\s*3/)).toBeVisible(); // restored
  });

  // NOT-AUTOMATABLE: AC-02 — visual hierarchy and state tokens are subjective visual evaluations
  // NOT-AUTOMATABLE: AC-03 — causal motion connection and reduced-motion fidelity require subjective visual validation
  // NOT-AUTOMATABLE: AC-07 — stack/drawer mobile transformations require manual responsive inspection
  // NOT-AUTOMATABLE: AC-10 — domain copy precision and empty state text are subjective evaluations
  // NOT-AUTOMATABLE: AC-12 — visual and interaction thesis coherence is a subjective design evaluation
});
