# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.mjs >> Command Center E2E >> 6.6 last_disconnect_shows_agent_empty_state
- Location: e2e.spec.mjs:288:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=/empty|no agents/i')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=/empty|no agents/i')

```

```yaml
- banner:
  - strong: PromptOps
  - text: Command center Production Disconnected 4 agents
  - button "Compact rows"
  - button "Night mode disabled"
  - button "Undo"
  - button "Redo" [disabled]
  - button "Commands ⌘K"
  - button "Export session"
  - button "Connect agent"
- paragraph: Monday, July 20 · Live workspace
- heading "Good morning, operator." [level=1]
- paragraph: Monitor prompt performance, coordinate coding agents, and preserve the session artifact.
- text: All systems operational
- region "Key performance indicators":
  - button "Open Total prompts detail":
    - text: Total prompts
    - strong: 2,486
    - text: 12.4%
    - application
  - button "Open Active agents detail":
    - text: Active agents
    - strong: "0"
    - text: 8.2%
    - application
  - button "Open Evaluations run detail":
    - text: Evaluations run
    - strong: 18,432
    - text: 18.7%
    - application
  - button "Open Cost this month detail":
    - text: Cost this month
    - strong: $4,296
    - text: 3.1%
    - application
- main:
  - region "Coding agents":
    - paragraph: Live orchestration
    - heading "Coding agents" [level=2]
    - paragraph: 0 connected · 0 running
    - button "Disconnect selected" [disabled]
    - button "Connect agent"
    - heading "No coding agents connected" [level=3]
    - paragraph: Connected agents and their live run steps belong here.
    - button "Connect agent"
  - region "Activity feed":
    - paragraph: Session pulse
    - heading "Activity feed" [level=2]
    - paragraph: 18 of 18 events visible
    - button "Simulate activity"
    - button "Show errors only"
    - button "Show agent events"
    - button "Show evaluations"
    - button "Show prompt changes"
    - button "Prompt"
    - button "Evaluation"
    - button "Agent"
    - button "Errors"
    - button "Clear filters" [disabled]
    - button "Orbit Context Mapper disconnected from the workspace Info agent just now":
      - text: Orbit Context Mapper disconnected from the workspace Info agent
      - time: just now
    - button "Vector Evaluator disconnected from the workspace Info agent just now":
      - text: Vector Evaluator disconnected from the workspace Info agent
      - time: just now
    - button "Sentry Reviewer disconnected from the workspace Info agent just now":
      - text: Sentry Reviewer disconnected from the workspace Info agent
      - time: just now
    - button "Nova Refactor disconnected from the workspace Info agent just now":
      - text: Nova Refactor disconnected from the workspace Info agent
      - time: just now
    - button "Nova Refactor started a repository analysis run Info agent 1m ago":
      - text: Nova Refactor started a repository analysis run Info agent
      - time: 1m ago
    - button "Safety rubric evaluation finished at 96.4% Success evaluation 4m ago":
      - text: Safety rubric evaluation finished at 96.4% Success evaluation
      - time: 4m ago
    - button "Customer-support system prompt was created Success prompt 7m ago":
      - text: Customer-support system prompt was created Success prompt
      - time: 7m ago
    - button "Vector Evaluator encountered a context window error Error agent 18m ago":
      - text: Vector Evaluator encountered a context window error Error agent
      - time: 18m ago
    - button "Hallucination benchmark finished with 42 cases Success evaluation 27m ago":
      - text: Hallucination benchmark finished with 42 cases Success evaluation
      - time: 27m ago
    - button "Sentry Reviewer completed a policy review Success agent 39m ago":
      - text: Sentry Reviewer completed a policy review Success agent
      - time: 39m ago
    - button "Code migration prompt was revised Info prompt 51m ago":
      - text: Code migration prompt was revised Info prompt
      - time: 51m ago
    - button "Tool-use evaluation finished at 91.8% Success evaluation 1h ago":
      - text: Tool-use evaluation finished at 91.8% Success evaluation
      - time: 1h ago
    - button "Orbit Context Mapper connected to the workspace Info agent 1h ago":
      - text: Orbit Context Mapper connected to the workspace Info agent
      - time: 1h ago
    - button "Retrieval grounding prompt was created Success prompt 2h ago":
      - text: Retrieval grounding prompt was created Success prompt
      - time: 2h ago
    - button "Monthly evaluation cost checkpoint completed Info evaluation 3h ago":
      - text: Monthly evaluation cost checkpoint completed Info evaluation
      - time: 3h ago
    - button "Nova Refactor completed step Analyze repository context Success agent 5h ago":
      - text: Nova Refactor completed step Analyze repository context Success agent
      - time: 5h ago
    - button "Incident response prompt was archived Info prompt 7h ago":
      - text: Incident response prompt was archived Info prompt
      - time: 7h ago
    - button "Agent handoff benchmark reported one error Error evaluation 10h ago":
      - text: Agent handoff benchmark reported one error Error evaluation
      - time: 10h ago
- text: 4 agents disconnected.
```

# Test source

```ts
  196 |
  197 |     await page.getByRole('button', { name: /Export/i }).click();
  198 |
  199 |     expect(errors).toBe(0);
  200 |   });
  201 |
  202 |   test('5.4 reload_returns_seeded_baseline', async ({ page }) => {
  203 |     await page.getByRole('button', { name: /Connect agent/i }).first().click();
  204 |     await page.locator('input#agent-name, input[name="name"], input[placeholder*="name" i]').first().fill('Seeded Agent');
  205 |     await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();
  206 |
  207 |     await page.reload();
  208 |     await expect(page.locator('body')).not.toContainText('Seeded Agent');
  209 |   });
  210 |
  211 |   test('5.5 cross_view_state_coherence', async ({ page }) => {
  212 |     await page.locator('table tbody tr [aria-haspopup="true"], table tbody tr [aria-label*="menu"]').first().click();
  213 |     await page.getByRole('menuitem', { name: /Rename/i }).click();
  214 |     await page.locator('input[type="text"]').last().fill('Cross View Agent');
  215 |     await page.getByRole('button', { name: /Rename|Save/i }).click();
  216 |
  217 |     await expect(page.locator('table tbody tr').first()).toContainText('Cross View Agent');
  218 |   });
  219 |
  220 |   test('5.7 rapid_input_stability', async ({ page }) => {
  221 |     const simBtn = page.getByRole('button', { name: /Simulate activity/i });
  222 |     for(let i=0; i<5; i++){
  223 |       await simBtn.click();
  224 |     }
  225 |     await expect(page.locator('ul li, [role="listitem"]').first()).toBeVisible();
  226 |   });
  227 |
  228 |   test('5.9 webmcp_registry_matches_ui', async ({ page }) => {
  229 |     const hasInfo = await page.evaluate(() => typeof window.webmcp_session_info !== "undefined");
  230 |     const hasList = await page.evaluate(() => typeof window.webmcp_list_tools !== "undefined");
  231 |     const hasInvoke = await page.evaluate(() => typeof window.webmcp_invoke_tool !== "undefined");
  232 |     expect(hasInfo && hasList && hasInvoke).toBe(true);
  233 |   });
  234 |
  235 |   test('5.10 export_preview_regen_stays_responsive', async ({ page }) => {
  236 |     await page.getByRole('button', { name: /Export/i }).click();
  237 |     await page.getByRole('tab', { name: /CSV/i }).click();
  238 |     await expect(page.locator('pre, code').first()).toBeVisible();
  239 |   });
  240 |
  241 |   // 6. Flows
  242 |   test('6.1 connect_agent_updates_panel_feed_export', async ({ page }) => {
  243 |     const initialRows = await page.locator('table tbody tr').count();
  244 |
  245 |     await page.getByRole('button', { name: /Connect agent/i }).first().click();
  246 |     await page.locator('input#agent-name, input[name="name"], input[placeholder*="name" i]').first().fill('Strict Test Agent');
  247 |     await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();
  248 |
  249 |     const newRows = await page.locator('table tbody tr').count();
  250 |     expect(newRows).toBe(initialRows + 1);
  251 |
  252 |     await expect(page.locator('.feed-item, [role="listitem"], ul li').first()).toContainText('Strict Test Agent');
  253 |
  254 |     await page.keyboard.press('Escape');
  255 |     await page.getByRole('button', { name: /Export/i }).click({ force: true });
  256 |     await expect(page.locator('pre, code').first()).toContainText('Strict Test Agent');
  257 |   });
  258 |
  259 |   test('6.2 invalid_connect_shows_field_contract_errors', async ({ page }) => {
  260 |     await page.getByRole('button', { name: /Connect agent/i }).first().click();
  261 |     await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();
  262 |     await expect(page.locator('[aria-invalid="true"]').first()).toBeVisible();
  263 |   });
  264 |
  265 |   test('6.3 rename_updates_all_agent_surfaces', async ({ page }) => {
  266 |     await page.locator('table tbody tr [aria-haspopup="true"], table tbody tr [aria-label*="menu"]').first().click();
  267 |     await page.getByRole('menuitem', { name: /Rename/i }).click();
  268 |     await page.locator('input[type="text"]').last().fill('Renamed Flow Agent');
  269 |     await page.getByRole('button', { name: /Rename|Save/i }).click();
  270 |     await expect(page.locator('table tbody tr').first()).toContainText('Renamed Flow Agent');
  271 |   });
  272 |
  273 |   test('6.4 disconnect_updates_panel_kpi_feed_export', async ({ page }) => {
  274 |     const initialRows = await page.locator('table tbody tr').count();
  275 |     await page.locator('table tbody tr [aria-haspopup="true"], table tbody tr [aria-label*="menu"]').first().click();
  276 |     await page.getByRole('menuitem', { name: /Disconnect/i }).click();
  277 |     await page.getByRole('button', { name: /Confirm|Disconnect/i }).last().click();
  278 |     const newRows = await page.locator('table tbody tr').count();
  279 |     expect(newRows).toBeLessThan(initialRows);
  280 |   });
  281 |
  282 |   test('6.5 kpi_detail_and_back_retain_dashboard_state', async ({ page }) => {
  283 |     await page.locator('.kpi-tile, [class*="kpi"]').first().click();
  284 |     await page.getByRole('button', { name: /Back/i }).click();
  285 |     await expect(page.locator('table tbody tr').first()).toBeVisible();
  286 |   });
  287 |
  288 |   test('6.6 last_disconnect_shows_agent_empty_state', async ({ page }) => {
  289 |     const checkboxes = page.locator('input[type="checkbox"]');
  290 |     const cnt = await checkboxes.count();
  291 |     for (let i = 1; i < cnt; i++) {
  292 |         await checkboxes.nth(i).click({ force: true });
  293 |     }
  294 |     await page.getByRole('button', { name: /Disconnect selected/i }).click();
  295 |     await page.getByRole('button', { name: /Confirm|Disconnect/i }).last().click();
> 296 |     await expect(page.locator('text=/empty|no agents/i')).toBeVisible();
      |                                                           ^ Error: expect(locator).toBeVisible() failed
  297 |   });
  298 |
  299 |   test('6.7 feed_filters_update_visible_events', async ({ page }) => {
  300 |     await page.getByRole('button', { name: /Error/i }).first().click();
  301 |     await expect(page.locator('.feed-item, [role="listitem"], ul li').first()).toContainText(/error/i);
  302 |   });
  303 |
  304 |   test('6.8 command_palette_preserves_workflow', async ({ page }) => {
  305 |     await page.keyboard.press('Meta+k');
  306 |     await expect(page.getByRole('dialog')).toBeVisible();
  307 |     await page.keyboard.press('Escape');
  308 |     await expect(page.getByRole('dialog')).not.toBeVisible();
  309 |   });
  310 |
  311 |   test('6.9 overlays_support_connect_export_palette', async ({ page }) => {
  312 |     await page.getByRole('button', { name: /Connect agent/i }).first().click();
  313 |     await expect(page.getByRole('dialog')).toBeVisible();
  314 |     await page.keyboard.press('Meta+k');
  315 |     // It shouldn't crash
  316 |     await page.keyboard.press('Escape');
  317 |   });
  318 |
  319 |   test('6.10 retry_recovers_error_agent_without_reload', async ({ page }) => {
  320 |     const retryBtn = page.getByRole('button', { name: /Retry/i }).first();
  321 |     await retryBtn.click();
  322 |     await expect(retryBtn).not.toBeVisible();
  323 |   });
  324 |
  325 |   test('6.11 bulk_disconnect_flow', async ({ page }) => {
  326 |     await page.locator('input[type="checkbox"]').nth(1).click({ force: true });
  327 |     await page.locator('input[type="checkbox"]').nth(2).click({ force: true });
  328 |     await page.getByRole('button', { name: /Disconnect selected/i }).click();
  329 |     await page.getByRole('button', { name: /Confirm|Disconnect/i }).last().click();
  330 |   });
  331 |
  332 |   test('6.12 undo_after_connect_then_redo', async ({ page }) => {
  333 |     const initialRows = await page.locator('table tbody tr').count();
  334 |     await page.getByRole('button', { name: /Connect agent/i }).first().click();
  335 |     await page.locator('input#agent-name, input[name="name"], input[placeholder*="name" i]').first().fill('Undo Agent 6.12');
  336 |     await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();
  337 |
  338 |     await page.getByRole('button', { name: /Undo/i }).click();
  339 |     let rows = await page.locator('table tbody tr').count();
  340 |     expect(rows).toBe(initialRows);
  341 |
  342 |     await page.getByRole('button', { name: /Redo/i }).click();
  343 |     rows = await page.locator('table tbody tr').count();
  344 |     expect(rows).toBe(initialRows + 1);
  345 |   });
  346 |
  347 |   test('6.13 export_import_round_trip_flow', async ({ page }) => {
  348 |     await page.getByRole('button', { name: /Connect agent/i }).first().click();
  349 |     await page.locator('input#agent-name, input[name="name"], input[placeholder*="name" i]').first().fill('Round Trip 6.13');
  350 |     await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();
  351 |
  352 |     await page.keyboard.press('Escape');
  353 |     await page.getByRole('button', { name: /Export/i }).click({ force: true });
  354 |     await expect(page.locator('pre, code').first()).toContainText('Round Trip 6.13');
  355 |   });
  356 |
  357 |   // 7. Mobile
  358 |   test('7.1 desktop_kpi_strip_one_row', async ({ page }) => {
  359 |     await page.setViewportSize({ width: 1440, height: 900 });
  360 |     await page.goto('http://localhost:3000');
  361 |     const tiles = page.locator('.kpi-tile, [class*="kpi"]');
  362 |     const box1 = await tiles.nth(0).boundingBox();
  363 |     const box4 = await tiles.nth(3).boundingBox();
  364 |     expect(Math.abs(box1.y - box4.y)).toBeLessThan(10);
  365 |   });
  366 |
  367 |   test('7.2 tablet_kpi_wrap_feed_stacks', async ({ page }) => {
  368 |     await page.setViewportSize({ width: 1023, height: 900 });
  369 |     await page.goto('http://localhost:3000');
  370 |     const tiles = page.locator('.kpi-tile, [class*="kpi"]');
  371 |     const box1 = await tiles.nth(0).boundingBox();
  372 |     const box4 = await tiles.nth(3).boundingBox();
  373 |     expect(box4.y).toBeGreaterThan(box1.y + 10);
  374 |   });
  375 |
  376 |   test('7.3 mobile_no_page_horizontal_scroll', async ({ page }) => {
  377 |     await page.setViewportSize({ width: 375, height: 667 });
  378 |     await page.goto('http://localhost:3000');
  379 |     const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  380 |     expect(scrollWidth).toBeLessThanOrEqual(375);
  381 |   });
  382 |
  383 |   test('7.4 suggestions_row_self_scrolls', async ({ page }) => {
  384 |     await page.setViewportSize({ width: 375, height: 667 });
  385 |     await page.goto('http://localhost:3000');
  386 |     const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  387 |     expect(scrollWidth).toBeLessThanOrEqual(375);
  388 |   });
  389 |
  390 |   test('7.5 export_drawer_usable_on_mobile', async ({ page }) => {
  391 |     await page.setViewportSize({ width: 375, height: 667 });
  392 |     await page.goto('http://localhost:3000');
  393 |     await page.getByRole('button', { name: /Export/i }).click();
  394 |     const dialog = page.getByRole('dialog');
  395 |     await expect(dialog).toBeVisible();
  396 |   });
```