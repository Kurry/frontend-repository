# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.mjs >> Command Center E2E >> 6.10 retry_recovers_error_agent_without_reload
- Location: e2e.spec.mjs:319:3

# Error details

```
Error: expect(locator).not.toBeVisible() failed

Locator:  getByRole('button', { name: /Retry/i }).first()
Expected: not visible
Received: visible
Timeout:  5000ms

Call log:
  - Expect "not toBeVisible" with timeout 5000ms
  - waiting for getByRole('button', { name: /Retry/i }).first()
    14 × locator resolved to <button type="button" class="feed-item feed-enter">…</button>
       - unexpected value "visible"

```

```yaml
- button "Vector Evaluator reset after retry Success agent just now":
  - text: Vector Evaluator reset after retry Success agent
  - time: just now
```

# Test source

```ts
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
  296 |     await expect(page.locator('text=/empty|no agents/i')).toBeVisible();
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
> 322 |     await expect(retryBtn).not.toBeVisible();
      |                                ^ Error: expect(locator).not.toBeVisible() failed
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
  397 |
  398 |   test('7.6 command_palette_usable_on_mobile', async ({ page }) => {
  399 |     await page.setViewportSize({ width: 375, height: 667 });
  400 |     await page.goto('http://localhost:3000');
  401 |     await page.keyboard.press('Meta+k');
  402 |     await expect(page.getByRole('dialog')).toBeVisible();
  403 |   });
  404 |
  405 |   test('7.7 undo_redo_visible_on_mobile', async ({ page }) => {
  406 |     await page.setViewportSize({ width: 375, height: 667 });
  407 |     await page.goto('http://localhost:3000');
  408 |     await expect(page.getByRole('button', { name: /Undo/i })).toBeVisible();
  409 |     await expect(page.getByRole('button', { name: /Redo/i })).toBeVisible();
  410 |   });
  411 |
  412 |   test('7.8 connect_dialog_usable_on_mobile', async ({ page }) => {
  413 |     await page.setViewportSize({ width: 375, height: 667 });
  414 |     await page.goto('http://localhost:3000');
  415 |     await page.getByRole('button', { name: /Connect agent/i }).first().click();
  416 |     await expect(page.getByRole('dialog')).toBeVisible();
  417 |   });
  418 |
  419 |   test('7.9 agent_panel_readable_on_mobile', async ({ page }) => {
  420 |     await page.setViewportSize({ width: 375, height: 667 });
  421 |     await page.goto('http://localhost:3000');
  422 |     await expect(page.locator('table tbody tr').first()).toBeVisible();
```