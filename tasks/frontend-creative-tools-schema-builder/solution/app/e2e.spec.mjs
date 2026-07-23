// ============================================================================
// CANONICAL ORACLE E2E SUITE — workspace contract (do not edit this region).
// Owned by `corpuscheck propagate`; the canonical region ends at the marker
// below. ADD task-specific criterion tests AFTER the marker — one test per
// rubric criterion, named `test('<id> <criterion_name>', ...)`.
//
// Run: start the app first (`npm run start`, port 3000), then
//   npx playwright test -c e2e.playwright.config.mjs
// (the sibling canonical config pins discovery to this file, so it works even
// when the app has its own playwright.config for other suites).
// Requires devDependency: @playwright/test (^1.x) — use the app's EXISTING
// @playwright/test if present; never install a second copy (duplicate
// instances break test loading).
// ============================================================================
import { test as base, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

export const test = base.extend({
  page: async ({ page }, use) => {
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`console.error: ${m.text()}`); });
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    await use(page);
    expect(errors, 'zero console/page errors required').toEqual([]);
  },
});

export { expect };

export const listTools = (page) => page.evaluate(async () => {
  const r = await window.webmcp_list_tools();
  return typeof r === 'string' ? JSON.parse(r) : r;
});
export const invokeTool = (page, name, args = {}) => page.evaluate(async ([n, a]) => {
  const r = await window.webmcp_invoke_tool(n, a);
  try { return typeof r === 'string' ? JSON.parse(r) : r; } catch { return r; }
}, [name, args]);

test.describe('workspace contract (canonical)', () => {
  test('serves non-empty app with zero console errors', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const len = await page.evaluate(() => document.body?.innerText?.trim().length ?? 0);
    expect(len, 'body renders visible content').toBeGreaterThan(0);
  });

  test('webmcp surface is registered and well-formed', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const kinds = await page.evaluate(() => ({
      session_info: typeof window.webmcp_session_info,
      list_tools: typeof window.webmcp_list_tools,
      invoke_tool: typeof window.webmcp_invoke_tool,
    }));
    expect(kinds).toEqual({ session_info: 'function', list_tools: 'function', invoke_tool: 'function' });
    const tools = await listTools(page);
    const arr = Array.isArray(tools) ? tools : tools?.tools ?? [];
    expect(arr.length, 'at least one webmcp tool registered').toBeGreaterThan(0);
    for (const t of arr) expect(typeof (t.name ?? t.id), 'every tool has a name').toBe('string');
  });

  test('reduced motion behaviorally suppresses animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    // Install the collector before navigation so load/hydration animations are
    // observed too. Keep it running through network idle and a settled 1.5s
    // window so late-starting effects cannot escape the assertion.
    await page.addInitScript(() => {
      window.__reducedMotionOffenders = [];
      const seen = new Set();
      const sample = () => {
        for (const animation of document.getAnimations({ subtree: true })) {
          if (animation.playState !== 'running') continue;
          let timing = {};
          try { timing = animation.effect?.getComputedTiming?.() ?? {}; } catch { /* detached */ }
          const duration = typeof timing.duration === 'number' ? timing.duration : 0;
          if (duration <= 1) continue;
          const offender = {
            kind: animation.constructor?.name ?? 'Animation',
            name: animation.animationName ?? animation.transitionProperty ?? animation.id ?? '(anonymous)',
            duration,
            iterations: timing.iterations ?? 1,
          };
          const key = JSON.stringify(offender);
          if (!seen.has(key)) {
            seen.add(key);
            window.__reducedMotionOffenders.push(offender);
          }
        }
        requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    // Precondition sanity check: the emulation actually reaches the app.
    const reduced = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
    expect(reduced, 'precondition: app sees prefers-reduced-motion: reduce').toBe(true);
    // Observe every frame for another 1.5s after load settles and assert on
    // everything seen since the document started.
    // Finished, idle, or paused effects and durations <=1ms are allowed; any
    // meaningfully timed RUNNING effect at any sample is a reduced-motion
    // failure. Apps with zero animations pass vacuously (the render/console
    // test still gates them).
    await page.waitForTimeout(1500);
    const offenders = await page.evaluate(() => window.__reducedMotionOffenders ?? []);
    expect(offenders, 'no running animation/transition with meaningful duration under reduced motion').toEqual([]);
  });

  test('no horizontal overflow at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, 'no horizontal page scroll at 375px').toBeLessThanOrEqual(1);
  });
});

// ==== END CANONICAL REGION — add task-specific criterion tests below. ====

test('reduced-motion load is free of console warnings', async ({ page }) => {
  const warnings = [];
  page.on('console', (message) => {
    // ConsoleMessage.type() is synchronous; the Playwright lint rule treats
    // methods named `type` as locator actions unless explicitly suppressed.
    // eslint-disable-next-line playwright/missing-playwright-await
    if (message.type() === 'warning') warnings.push(message.text());
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(BASE);
  await expect(page.locator('#schema-name')).toBeVisible();
  expect(warnings).toEqual([]);
});

test('SchemaPackage import rejects type-incompatible field constraints', async ({ page }) => {
  await page.goto(BASE);
  const initialTitle = await page.locator('#schema-name').inputValue();
  const invalidPackage = {
    schemaVersion: 'schema-package-v1',
    name: 'Invalid constraint package',
    jsonSchema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {},
      required: [],
    },
    fields: [{ key: 'score', type: 'number', required: true, enumValues: ['high'] }],
    metadata: {},
    examplePayload: { score: 1 },
    formatInstruction: 'Return score.',
  };
  await invokeTool(page, 'editor_set_content', { property: 'schema-package-json', value: JSON.stringify(invalidPackage) });
  const result = await invokeTool(page, 'artifact_import', { mode: 'schema-package' });

  expect(result.ok).toBe(false);
  expect(result.error).toContain('enumValues only applies when type is string');
  await expect(page.locator('#schema-name')).toHaveValue(initialTitle);
});

test('SchemaPackage export preserves empty structured fields for re-import', async ({ page }) => {
  await page.goto(BASE);
  await dismissOnboarding(page);

  await page.getByRole('button', { name: 'Add field', exact: true }).click();
  await rowByKey(page, 'new_field').locator('button.node-name').click();
  await page.locator('#cfg-type').selectOption('object');
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  await page.getByRole('tab', { name: 'SchemaPackage JSON' }).click();
  const exported = JSON.parse(await page.getByLabel(/SchemaPackage JSON preview/).innerText());
  const emptyObject = exported.fields.find((item) => item.key === 'new_field');

  expect(emptyObject).toMatchObject({ type: 'object', children: [] });

  await invokeTool(page, 'editor_set_content', {
    property: 'schema-package-json',
    value: JSON.stringify(exported),
  });
  const result = await invokeTool(page, 'artifact_import', { mode: 'schema-package' });
  expect(result.ok).toBe(true);
});

// Helper: the row (<li data-tree-row>) for a field whose visible name is
// `key`. Node names are unique within the seeded "Evaluation result" tree
// (run_id, score, rubric, status, tags, evaluated_at, passed, and rubric's
// nested accuracy/style/notes), so a substring match on the name button is
// unambiguous for the fields these tests use.
function rowByKey(page, key) {
  return page
    .locator('button.node-name', { hasText: key })
    .first()
    .locator('xpath=ancestor::li[@data-tree-row][1]');
}

// The app opens a first-load onboarding modal (store.js: `onboarding: { open:
// true, step: 0 }`) that overlays and intercepts pointer events on the rest
// of the UI. Dismiss it before interacting, same as a real user would.
async function dismissOnboarding(page) {
  const skip = page.getByRole('button', { name: 'Skip tour' });
  if (await skip.isVisible().catch(() => false)) await skip.click();
}

test.describe('frontend-creative-tools-schema-builder criteria', () => {
  test('1.1 seeded_library_and_tree', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await dismissOnboarding(page);

    const libraryRows = page.locator('.library-row');
    const libraryCount = await libraryRows.count();
    expect(libraryCount, 'sidebar lists at least 4 seeded schemas').toBeGreaterThanOrEqual(4);

    const activeRow = page.locator('.library-row-active');
    await expect(activeRow, 'the first schema is active and marked').toHaveCount(1);
    await expect(activeRow).toContainText('Evaluation result');
    await expect(activeRow.locator('.active-dot')).toBeVisible();

    // Root renders and every non-root row is a real field.
    const rootRow = page.locator('[data-tree-row]').first();
    await expect(rootRow).toHaveAttribute('aria-label', /root object/);
    const allRowCount = await page.locator('[data-tree-row]').count();
    expect(allRowCount - 1, 'tree renders at least 6 fields').toBeGreaterThanOrEqual(6);

    // One nested object (rubric) and one array (tags) among the fields.
    const rubricBadge = rowByKey(page, 'rubric').locator(':scope > div .type-badge').first();
    await expect(rubricBadge).toHaveAttribute('aria-label', 'type object');
    const tagsBadge = rowByKey(page, 'tags').locator(':scope > div .type-badge').first();
    await expect(tagsBadge).toHaveAttribute('aria-label', 'type array');

    // Required toggle is visible per row (rendered as a "*" for required fields).
    const runIdRow = rowByKey(page, 'run_id');
    await expect(runIdRow.locator('.req-star')).toBeVisible();

    // Chevron collapses the object child.
    const rubricRow = rowByKey(page, 'rubric');
    await expect(rubricRow).toHaveAttribute('aria-expanded', 'true');
    await rubricRow.locator(':scope > div button.icon-btn').first().click();
    await expect(rubricRow).toHaveAttribute('aria-expanded', 'false');
    await expect(rowByKey(page, 'accuracy')).toHaveCount(0);
  });

  test('1.2 add_field_and_inline_rename', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await dismissOnboarding(page);

    await page.getByRole('button', { name: 'Add field', exact: true }).click();
    const newRow = rowByKey(page, 'new_field');
    await expect(newRow, 'Add Field appends a default-named child').toBeVisible();
    await expect(newRow.locator(':scope > div .type-badge').first()).toHaveAttribute('aria-label', 'type string');

    await newRow.locator('button.node-name').dblclick();
    const renameInput = page.getByLabel('Rename new_field');
    await expect(renameInput).toBeVisible();
    await renameInput.fill('classification_confidence');
    await renameInput.press('Enter');

    await expect(rowByKey(page, 'classification_confidence'), 'rename applies in the tree').toBeVisible();
    await expect(rowByKey(page, 'new_field')).toHaveCount(0);

    const schemaText = await page.getByLabel('Compiled draft-07 JSON Schema').innerText();
    expect(schemaText, 'rename reflected in the compiled text').toContain('classification_confidence');
    expect(schemaText).not.toContain('new_field');

    await page.getByRole('tab', { name: 'Example' }).click();
    const exampleText = await page.getByLabel('Generated example payload').innerText();
    expect(exampleText, 'rename reflected in the example payload').toContain('classification_confidence');
  });

  test('1.3 delete_with_inline_confirm_root_protected', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await dismissOnboarding(page);

    // Root offers no Delete control.
    const rootRow = page.locator('[data-tree-row]').first();
    await expect(rootRow.locator(':scope > div button[aria-label^="Delete"]')).toHaveCount(0);

    const passedRow = rowByKey(page, 'passed');
    await passedRow.getByRole('button', { name: 'Delete passed' }).click();
    const confirmBox = page.getByRole('alertdialog', { name: 'Confirm deletion of passed' });
    await expect(confirmBox, 'Delete shows an inline confirmation').toBeVisible();

    // Cancel leaves the node intact.
    await confirmBox.getByRole('button', { name: 'Cancel' }).click();
    await expect(rowByKey(page, 'passed')).toBeVisible();

    // Confirming removes the node.
    await passedRow.getByRole('button', { name: 'Delete passed' }).click();
    await page.getByRole('alertdialog', { name: 'Confirm deletion of passed' }).getByRole('button', { name: 'Delete field' }).click();
    await expect(rowByKey(page, 'passed'), 'confirming removes the node').toHaveCount(0);
  });

  test('1.5 bulk_node_actions', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await dismissOnboarding(page);

    await rowByKey(page, 'status').getByRole('checkbox', { name: 'Select status' }).check();
    await rowByKey(page, 'tags').getByRole('checkbox', { name: 'Select tags' }).check();

    const bulkBar = page.getByRole('toolbar', { name: 'Bulk actions for selected fields' });
    await expect(bulkBar, 'a contextual action bar appears').toBeVisible();
    await expect(bulkBar).toContainText('2 selected');
    await expect(bulkBar.getByRole('button', { name: 'Delete 2 selected' })).toBeVisible();

    // status is already required — clear required applies to exactly the
    // selected nodes and leaves an untouched sibling (evaluated_at, required)
    // alone.
    await bulkBar.getByRole('button', { name: 'Clear required' }).click();
    await expect(rowByKey(page, 'status').locator('.req-star')).toHaveCount(0);
    await expect(rowByKey(page, 'evaluated_at').locator('.req-star'), 'unselected sibling unaffected').toBeVisible();

    await rowByKey(page, 'status').getByRole('checkbox', { name: 'Select status' }).check();
    await rowByKey(page, 'tags').getByRole('checkbox', { name: 'Select tags' }).check();
    await page.getByRole('toolbar', { name: 'Bulk actions for selected fields' }).getByRole('button', { name: 'Set required' }).click();
    await expect(rowByKey(page, 'status').locator('.req-star'), 'set required applies to the selected fields').toBeVisible();
    await expect(rowByKey(page, 'tags').locator('.req-star')).toBeVisible();
  });

  test('1.6 config_panel_field_definition_contract', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await dismissOnboarding(page);

    await rowByKey(page, 'score').locator('button.node-name').click();
    const panel = page.locator('.config-panel');
    await expect(panel, 'clicking a node opens a side configuration panel').toBeVisible();
    await expect(page.locator('#cfg-key')).toHaveValue('score');
    await expect(page.locator('#cfg-type')).toHaveValue('number');
    await expect(page.locator('#cfg-required')).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('#cfg-minimum'), 'number type shows minimum/maximum constraints').toHaveValue('0');
    await expect(page.locator('#cfg-maximum')).toHaveValue('100');
    await expect(page.locator('#cfg-enum')).toHaveCount(0);

    // Changing the type swaps the visible constraint inputs.
    await page.locator('#cfg-type').selectOption('string');
    await expect(page.locator('#cfg-minimum'), 'number constraints hide after switching to string').toHaveCount(0);
    await expect(page.locator('#cfg-enum'), 'string constraints (enum/pattern) appear').toBeVisible();
    await expect(page.locator('#cfg-pattern')).toBeVisible();
  });

  test('1.7 constraint_validation_blocks_invalid', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await dismissOnboarding(page);

    await rowByKey(page, 'score').locator('button.node-name').click();
    await page.locator('#cfg-minimum').fill('200');
    await page.locator('#cfg-minimum').blur();

    const err = page.locator('#cfg-minimum-error');
    await expect(err, 'inline message names the violated FieldDefinition rule').toBeVisible();
    await expect(err).toContainText('Minimum must not exceed maximum');

    // The invalid value is not applied to the compiled schema.
    const schemaText = await page.getByLabel('Compiled draft-07 JSON Schema').innerText();
    const scoreSchema = JSON.parse(schemaText).properties.score;
    expect(scoreSchema.minimum, 'invalid minimum never lands in the compiled schema').toBe(0);
    expect(scoreSchema.maximum).toBe(100);
  });

  test('1.8 constraint_templates_apply', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await dismissOnboarding(page);

    await page.getByRole('button', { name: 'Add field', exact: true }).click();
    await rowByKey(page, 'new_field').locator('button.node-name').click();

    const templateList = page.locator('.template-list');
    await expect(templateList).toContainText('Email pattern');
    await expect(templateList).toContainText('Percentage 0 to 100');
    await expect(templateList).toContainText('ISO date pattern');
    await expect(templateList).toContainText('Non-empty string');
    await expect(templateList).toContainText('Status enum');

    await page.getByRole('button', { name: /Email pattern/ }).click();
    await expect(page.locator('#cfg-pattern'), 'applying a template fills the matching constraint input').toHaveValue('^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$');

    const schemaText = await page.getByLabel('Compiled draft-07 JSON Schema').innerText();
    expect(schemaText, 'applied template value appears in the compiled text').toContain('^[^@\\\\s]+@[^@\\\\s]+\\\\.[^@\\\\s]+$');
  });

  test('1.9 compiled_text_live_and_faithful', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await dismissOnboarding(page);

    const schemaLocator = page.getByLabel('Compiled draft-07 JSON Schema');
    const before = await schemaLocator.innerText();
    const parsedBefore = JSON.parse(before);
    expect(parsedBefore.$schema).toBe('http://json-schema.org/draft-07/schema#');
    expect(parsedBefore.properties).toHaveProperty('run_id');

    await page.getByRole('button', { name: 'Add field', exact: true }).click();
    await expect
      .poll(async () => JSON.parse(await schemaLocator.innerText()).properties, 'compiled text updates live after a tree edit')
      .toHaveProperty('new_field');

    await rowByKey(page, 'passed').getByRole('button', { name: 'Delete passed' }).click();
    await page.getByRole('alertdialog', { name: 'Confirm deletion of passed' }).getByRole('button', { name: 'Delete field' }).click();
    await expect
      .poll(async () => JSON.parse(await schemaLocator.innerText()).properties, 'deletion is reflected in the compiled text')
      .not.toHaveProperty('passed');

    await page.getByRole('button', { name: 'Copy', exact: true }).first().click();
    await expect(page.locator('.toast').last(), 'Copy shows a visible confirmation').toContainText('Copied compiled schema to clipboard');
  });

  test('1.17 invalid_json_blocks_run', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await dismissOnboarding(page);

    const payload = page.locator('#payload');
    await payload.fill('{ "run_id": "a", ');
    await page.getByRole('button', { name: 'Run validation' }).click();

    const err = page.locator('#payload-error');
    await expect(err, 'inline parse error is shown').toBeVisible();
    await expect(err).toContainText('Invalid JSON payload');

    // No run started: the Run validation button is still present (it flips
    // to Pause once a run begins) and no step rows were created.
    await expect(page.getByRole('button', { name: 'Run validation' }), 'no validation run started').toBeVisible();
    await expect(page.locator('.step-row')).toHaveCount(0);
  });

  test('1.20 version_save_validation', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await dismissOnboarding(page);

    await page.getByRole('tab', { name: 'Versions & diff' }).click();
    await page.getByRole('button', { name: 'Save version' }).click();
    const err = page.locator('#version-name-error');
    await expect(err, 'saving with an empty name shows an inline message').toBeVisible();
    await expect(page.locator('.version-row')).toHaveCount(0);

    await page.locator('#version-name').fill('baseline');
    await page.getByRole('button', { name: 'Save version' }).click();
    await expect(page.locator('.version-row'), 'saved version lists with name and timestamp').toHaveCount(1);
    await expect(page.locator('.version-row').first()).toContainText('baseline');

    await page.locator('#version-name').fill('second');
    await page.waitForTimeout(450); // clear the 400ms same-name debounce window
    await page.getByRole('button', { name: 'Save version' }).click();
    const rows = page.locator('.version-row');
    await expect(rows).toHaveCount(2);
    await expect(rows.first(), 'newest version listed first').toContainText('second');
  });

  test('1.22 library_new_delete_duplicate', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await dismissOnboarding(page);

    const before = await page.locator('.library-row').count();
    await page.getByRole('button', { name: 'New', exact: true }).click();
    await expect(page.locator('.library-row')).toHaveCount(before + 1);
    const activeAfterNew = page.locator('.library-row-active');
    await expect(activeAfterNew, 'New starts a blank schema with a root object and loads it active').toContainText('Untitled schema');
    await expect(page.locator('[data-tree-row]')).toHaveCount(1); // root only

    await activeAfterNew.getByRole('button', { name: /^Duplicate/ }).click();
    await expect(page.locator('.library-row')).toHaveCount(before + 2);
    await expect(page.locator('.library-row-active'), 'Duplicate copies under a copy-suffixed name and loads it').toContainText('copy');

    await page.locator('.library-row-active').getByRole('button', { name: /^Delete/ }).click();
    await page.getByRole('button', { name: 'Delete schema', exact: true }).click();
    await expect(page.locator('.library-row'), 'Delete removes the schema after confirmation').toHaveCount(before + 1);
  });

  test('1.24 undo_redo_with_labels', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await dismissOnboarding(page);

    const undoBtn = page.getByRole('button', { name: /^Undo/ });
    await expect(undoBtn, 'nothing to undo initially').toBeDisabled();

    await page.getByRole('button', { name: 'Add field', exact: true }).click();
    await expect(undoBtn, 'undo label names the action it will affect').toHaveAccessibleName('Undo Add field');
    await expect(rowByKey(page, 'new_field')).toBeVisible();

    await undoBtn.click();
    await expect(rowByKey(page, 'new_field'), 'undo reverts the add').toHaveCount(0);

    const redoBtn = page.getByRole('button', { name: /^Redo/ });
    await expect(redoBtn).toHaveAccessibleName('Redo Add field');
    await redoBtn.click();
    await expect(rowByKey(page, 'new_field'), 'redo reapplies the action').toBeVisible();
  });

  test('10.3 reload_resets_to_seed', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await dismissOnboarding(page);

    await page.getByRole('button', { name: 'Add field', exact: true }).click();
    await page.getByRole('tab', { name: 'Versions & diff' }).click();
    await page.locator('#version-name').fill('temp-version');
    await page.getByRole('button', { name: 'Save version' }).click();
    await expect(page.locator('.version-row')).toHaveCount(1);

    await page.reload();
    await page.waitForLoadState('networkidle');
    await dismissOnboarding(page);

    const libraryRows = page.locator('.library-row');
    await expect(libraryRows).toHaveCount(4);
    await expect(page.locator('.library-row-active')).toContainText('Evaluation result');
    await expect(rowByKey(page, 'new_field'), 'unsaved tree edits are gone after reload').toHaveCount(0);

    await page.getByRole('tab', { name: 'Versions & diff' }).click();
    await expect(page.locator('.version-row'), 'no user versions survive a reload').toHaveCount(0);
    const undoBtn = page.getByRole('button', { name: /^Undo/ });
    await expect(undoBtn, 'undo history is empty').toBeDisabled();
  });

  test('10.5 compiled_output_parses_as_json', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await dismissOnboarding(page);

    await page.getByRole('button', { name: 'Add field', exact: true }).click();
    await rowByKey(page, 'new_field').locator('button.node-name').click();
    await page.locator('#cfg-type').selectOption('number');
    await page.locator('#cfg-minimum').fill('1');
    await page.locator('#cfg-maximum').fill('9');
    await page.locator('#cfg-minimum').blur();

    const schemaText = await page.getByLabel('Compiled draft-07 JSON Schema').innerText();
    const parsed = JSON.parse(schemaText);
    expect(parsed.$schema).toBe('http://json-schema.org/draft-07/schema#');
    expect(parsed.properties.new_field).toMatchObject({ type: 'number', minimum: 1, maximum: 9 });

    await page.getByRole('button', { name: 'Export', exact: true }).click();
    const pkgTab = page.getByRole('tab', { name: 'SchemaPackage JSON' });
    await pkgTab.click();
    const pkgText = await page.getByLabel(/SchemaPackage JSON preview/).innerText();
    const pkg = JSON.parse(pkgText);
    expect(pkg.schemaVersion).toBe('schema-package-v1');
    expect(pkg.jsonSchema.$schema).toBe('http://json-schema.org/draft-07/schema#');
  });
});
