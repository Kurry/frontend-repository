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

test.describe('workflow builder (task-specific)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
  });

  test('1.1 seeded_workflow_walkthrough', async ({ page }) => {
    const nodes = page.locator('.workflow-node');
    await expect(nodes).toHaveCount(5);
    for (const type of ['Prompt', 'Agent', 'Eval', 'Condition', 'Output']) {
      await expect(page.locator('.workflow-node .node-type', { hasText: type })).toBeVisible();
    }
    const edges = page.locator('.react-flow__edge');
    await expect(edges).toHaveCount(4);
    for (const type of ['Prompt', 'Agent', 'Eval', 'Condition', 'Output']) {
      await expect(page.locator('.palette-item', { hasText: type })).toBeVisible();
    }
  });

  test('1.6 select_delete_edge_and_node', async ({ page }) => {
    const edgesBefore = await page.locator('.react-flow__edge').count();
    const edge = page.locator('.react-flow__edge').first();
    await edge.click({ force: true });
    await expect(edge).toHaveClass(/selected/);
    await page.keyboard.press('Delete');
    await expect(page.locator('.react-flow__edge')).toHaveCount(edgesBefore - 1);

    const nodesBefore = await page.locator('.workflow-node').count();
    const outputNode = page.locator('.workflow-node', { has: page.locator('.node-type', { hasText: 'Output' }) });
    await outputNode.click();
    await expect(outputNode).toHaveClass(/is-selected/);
    const edgesBeforeNodeDelete = await page.locator('.react-flow__edge').count();
    await page.keyboard.press('Delete');
    await expect(page.locator('.workflow-node')).toHaveCount(nodesBefore - 1);
    await expect(page.locator('.react-flow__edge')).toHaveCount(edgesBeforeNodeDelete - 1);
  });

  test('1.7 node_config_forms_field_contract', async ({ page }) => {
    const conditionNode = page.locator('.workflow-node', { has: page.locator('.node-type', { hasText: 'Condition' }) });
    await conditionNode.dblclick();
    await expect(page.getByText('Configure Condition node')).toBeVisible();
    const titleInput = page.locator('#node-title');
    await titleInput.fill('');
    const saveButton = page.getByRole('button', { name: 'Save configuration' });
    await expect(saveButton, 'save disabled with empty title').toBeDisabled();
    await titleInput.fill('Threshold gate');
    const expressionInput = page.locator('#condition-expression');
    await expressionInput.fill('');
    await expect(saveButton, 'save disabled with empty condition expression').toBeDisabled();
    await expressionInput.fill('score >= 0.9');
    await expect(saveButton, 'save enabled once all fields valid').toBeEnabled();
    await saveButton.click();
    await expect(page.getByText('Configure Condition node')).toHaveCount(0);
    await expect(conditionNode.locator('h3')).toHaveText('Threshold gate');
    await expect(conditionNode.locator('.config-badge')).toHaveText('score >= 0.9');
  });

  test('1.9 run_topological_progression', async ({ page }) => {
    await page.getByRole('button', { name: 'Run' }).click();
    const promptNode = page.locator('.workflow-node', { has: page.locator('.node-type', { hasText: 'Prompt' }) });
    const outputNode = page.locator('.workflow-node', { has: page.locator('.node-type', { hasText: 'Output' }) });
    // Shortly after Run, the source node has started while the sink is still pending —
    // nodes advance one at a time rather than all at once.
    await expect(promptNode.locator('.status-running')).toBeVisible({ timeout: 2000 });
    await expect(outputNode.locator('.status-running, .status-complete')).toHaveCount(0);
    // Eventually the whole run reaches completion in topological order.
    await expect(page.locator('.rollup')).toContainText('5/5', { timeout: 15000 });
    await expect(outputNode.locator('.status-complete')).toBeVisible();
  });

  test('1.10 retry_attempt_and_backoff_visible', async ({ page }) => {
    await page.getByRole('button', { name: 'Run' }).click();
    const agentNode = page.locator('.workflow-node', { has: page.locator('.node-type', { hasText: 'Agent' }) });
    await expect(agentNode.locator('.retry-copy')).toContainText(/waiting \d+s before retry 2 of 3/, { timeout: 6000 });
    await expect(agentNode.locator('.status-tag')).toContainText('Retrying');
    // The seeded agent-1 demo fails twice then succeeds on its third attempt.
    await expect(agentNode.locator('.status-complete')).toBeVisible({ timeout: 10000 });
  });

  test('1.14 rollup_derives_live', async ({ page }) => {
    const initial = await page.locator('.rollup').innerText();
    expect(initial).toContain('0/5');
    await page.getByRole('button', { name: 'Run' }).click();
    await expect(page.locator('.rollup')).not.toContainText('0/5', { timeout: 3000 });
    await expect(page.locator('.rollup')).toContainText('5/5', { timeout: 15000 });
    const elapsedText = await page.locator('.rollup-stat', { hasText: 'elapsed' }).innerText();
    expect(elapsedText).toMatch(/\d+\.\d+s/);
  });

  test('1.16 timeline_ordered_timestamped', async ({ page }) => {
    await expect(page.locator('.timeline-empty')).toBeVisible();
    await page.getByRole('button', { name: 'Run' }).click();
    await expect(page.locator('.rollup')).toContainText('5/5', { timeout: 15000 });
    const rows = page.locator('.timeline-row');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
    const times = await page.locator('.timeline-row time').allInnerTexts();
    const parsed = times.map((t) => t);
    // Newest appended at the end: timestamps are non-decreasing top to bottom.
    for (let i = 1; i < parsed.length; i++) expect(parsed[i] >= parsed[i - 1]).toBe(true);
    await page.locator('.filter-chip', { hasText: 'Complete' }).click();
    const filteredCount = await page.locator('.timeline-row').count();
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThanOrEqual(rowCount);
    await page.locator('.filter-chip', { hasText: 'All' }).click();
    await expect(page.locator('.timeline-row')).toHaveCount(rowCount);
  });

  test('1.18 save_load_confirmation_round_trip', async ({ page }) => {
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    const saveButton = page.getByRole('button', { name: 'Save workflow' });
    await expect(saveButton).toBeDisabled();
    await expect(page.locator('#workflow-name-error-msg, .cds--form-requirement')).toBeVisible();
    await page.locator('#workflow-name').fill('My orchestration snapshot');
    await expect(saveButton).toBeEnabled();
    await saveButton.click();
    const savedRow = page.locator('.saved-row', { hasText: 'My orchestration snapshot' });
    await expect(savedRow).toBeVisible();
    await expect(savedRow).toContainText('5 nodes');

    // Diverge the live canvas from the saved snapshot so decline vs accept is observable.
    await page.locator('.canvas-wrap').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('Alt+n');
    await page.keyboard.press('Delete');
    await expect(page.locator('.workflow-node')).toHaveCount(4);

    await savedRow.locator('.cds--tile, [role="button"]').first().click();
    await expect(page.getByText('Replace the current canvas?')).toBeVisible();
    await page.getByRole('button', { name: 'Keep current canvas' }).click();
    await expect(page.getByText('Replace the current canvas?')).toBeHidden();
    // Declining leaves the diverged (4-node) canvas untouched.
    await expect(page.locator('.workflow-node')).toHaveCount(4);

    await savedRow.locator('.cds--tile, [role="button"]').first().click();
    await page.getByRole('button', { name: 'Load workflow' }).click();
    await expect(page.locator('.workflow-identity')).toContainText('My orchestration snapshot');
    // Accepting replaces the canvas with the saved 5-node snapshot and resets execution badges.
    await expect(page.locator('.workflow-node')).toHaveCount(5);
    await expect(page.locator('.rollup')).toContainText('0/5');
  });

  test('1.20 keyboard_node_selection', async ({ page }) => {
    await page.locator('.canvas-wrap').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('Alt+n');
    const selected = page.locator('.workflow-node.is-selected');
    await expect(selected).toHaveCount(1);
    await page.keyboard.press('Enter');
    await expect(page.locator('.orchestrate-modal')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    const nodesBefore = await page.locator('.workflow-node').count();
    await page.keyboard.press('Delete');
    await expect(page.locator('.workflow-node')).toHaveCount(nodesBefore - 1);
  });

  test('1.21 run_empty_canvas_message', async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      await page.locator('.canvas-wrap').click({ position: { x: 5, y: 5 } });
      await page.keyboard.press('Alt+n');
      await page.keyboard.press('Delete');
    }
    await expect(page.locator('.workflow-node')).toHaveCount(0);
    await page.getByRole('button', { name: 'Run' }).click();
    await expect(page.locator('.toast-layer')).toContainText('nothing to run');
    await expect(page.locator('.rollup')).toContainText('Ready');
  });

  test('1.28 graph_validity_badge', async ({ page }) => {
    await expect(page.locator('.validity-badge')).toHaveText('Valid');
    const lastEdge = page.locator('.react-flow__edge').last();
    await lastEdge.click({ force: true });
    await page.keyboard.press('Delete');
    await expect(page.locator('.validity-badge')).toHaveText('Incomplete');
    await expect(page.locator('.validity-badge')).toHaveAttribute('title', /./);
  });

  test('1.30 saved_workflow_request_body_contract', async ({ page }) => {
    await page.getByRole('button', { name: 'Artifact' }).click();
    const preview = await page.locator('.artifact-preview').innerText();
    const definition = JSON.parse(preview);
    expect(definition.nodes.length).toBe(5);
    for (const node of definition.nodes) {
      expect(typeof node.id).toBe('string');
      expect(['Prompt', 'Agent', 'Eval', 'Condition', 'Output']).toContain(node.type);
      expect(typeof node.position.x).toBe('number');
      expect(typeof node.position.y).toBe('number');
      expect(node.config).toBeTruthy();
    }
    const nodeIds = new Set(definition.nodes.map((n) => n.id));
    expect(definition.edges.length).toBe(4);
    for (const edge of definition.edges) {
      expect(nodeIds.has(edge.source)).toBe(true);
      expect(nodeIds.has(edge.target)).toBe(true);
    }
  });
});
