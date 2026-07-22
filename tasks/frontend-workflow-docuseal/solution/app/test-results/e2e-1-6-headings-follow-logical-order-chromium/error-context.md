# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.mjs >> 1.6 headings_follow_logical_order
- Location: e2e.spec.mjs:333:1

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
Call log:
  - navigating to "http://localhost:3000/", waiting until "load"

```

# Test source

```ts
  234 |   await expect(page.locator('.field-box')).toHaveCount(2);
  235 |
  236 |   await page.locator('button[aria-label="Import Template JSON"]').click();
  237 |   await page.locator('#import-document').fill(jsonContent);
  238 |   await page.getByRole('button', { name: 'Import template' }).click();
  239 |
  240 |   await expect(page.locator('.field-box')).toHaveCount(3);
  241 |   await expect(page.locator('.field-box').nth(0).locator('.field-name')).toHaveText('ImportExportTestName');
  242 | });
  243 |
  244 | test('9.14 overlong_field_name_rejected', async ({ page }) => {
  245 |   await page.goto('/');
  246 |   await page.locator('.field-box').first().click();
  247 |   const overlongName = 'A'.repeat(200);
  248 |   await page.locator('#field-name').fill(overlongName);
  249 |
  250 |   const inputVal = await page.locator('#field-name').inputValue();
  251 |   if (inputVal.length < 200) {
  252 |     expect(inputVal.length).toBeLessThan(200);
  253 |   } else {
  254 |     await expect(page.locator('.form-error')).toBeVisible();
  255 |   }
  256 | });
  257 |
  258 | test('9.15 overlong_template_name_rejected', async ({ page }) => {
  259 |   await page.goto('/');
  260 |   const overlongName = 'A'.repeat(200);
  261 |   await page.locator('.template-name-input').fill(overlongName);
  262 |
  263 |   const inputVal = await page.locator('.template-name-input').inputValue();
  264 |   if (inputVal.length < 200) {
  265 |     expect(inputVal.length).toBeLessThan(200);
  266 |   } else {
  267 |     await expect(page.locator('.template-name-error')).toBeVisible();
  268 |   }
  269 | });
  270 |
  271 | test('9.17 malformed_template_json_import_rejected', async ({ page }) => {
  272 |   await page.goto('/');
  273 |   await page.locator('button[aria-label="Import Template JSON"]').click();
  274 |   await page.locator('#import-document').fill('{ malformed json }');
  275 |   await page.getByRole('button', { name: 'Import template' }).click();
  276 |
  277 |   await expect(page.locator('#import-error')).toContainText(/malformed/i);
  278 | });
  279 |
  280 | test('9.18 schema_invalid_import_rejected', async ({ page }) => {
  281 |   await page.goto('/');
  282 |   await page.locator('button[aria-label="Import Template JSON"]').click();
  283 |   await page.locator('#import-document').fill('{"name": "Valid Json but Invalid Schema"}');
  284 |   await page.getByRole('button', { name: 'Import template' }).click();
  285 |
  286 |   await expect(page.locator('#import-error')).toBeVisible();
  287 | });
  288 |
  289 | test('9.19 new_edit_after_undo_clears_redo', async ({ page }) => {
  290 |   await page.goto('/');
  291 |   const fieldBox = page.locator('.field-box').first();
  292 |
  293 |   await fieldBox.click();
  294 |   await page.locator('#field-name').fill('Edit1');
  295 |   await page.locator('#field-name').fill('Edit2');
  296 |
  297 |   await page.getByRole('button', { name: 'Undo', exact: true }).click();
  298 |   await expect(page.getByRole('button', { name: 'Redo', exact: true })).toBeEnabled();
  299 |
  300 |   await page.locator('#field-name').fill('Edit3');
  301 |   await expect(page.getByRole('button', { name: 'Redo', exact: true })).toBeDisabled();
  302 | });
  303 |
  304 | test('1.1 controls_are_keyboard_accessible', async ({ page }) => {
  305 |   await page.goto('/');
  306 |   await page.keyboard.press('Tab');
  307 | });
  308 |
  309 | test('1.2 export_modal_manages_focus', async ({ page }) => {
  310 |   await page.goto('/');
  311 |   const exportBtn = page.locator('button[aria-label="Export template package"]');
  312 |   await exportBtn.click();
  313 |   await expect(page.getByRole('dialog', { name: /Export/i })).toBeVisible();
  314 |   await page.keyboard.press('Escape');
  315 |   await expect(page.getByRole('dialog', { name: /Export/i })).not.toBeVisible();
  316 |   await expect(exportBtn).toBeFocused();
  317 | });
  318 |
  319 |
  320 |
  321 | test('1.3 icons_have_accessible_names', async ({ page }) => {
  322 |   await page.goto('/');
  323 |   await expect(page.locator('button[aria-label="Close export dialog"]')).toHaveCount(0); // Before opening
  324 |   await page.locator('button[aria-label="Export template package"]').click();
  325 |   await expect(page.locator('button[aria-label="Close export dialog"]')).toHaveCount(1);
  326 | });
  327 |
  328 | test('1.4 toast_uses_live_region', async ({ page }) => {
  329 |   await page.goto('/');
  330 |   await expect(page.locator('[role="status"][aria-live="polite"]')).toHaveCount(1); // The announcer is always present. The root is only mounted by Reka when open.
  331 | });
  332 |
  333 | test('1.6 headings_follow_logical_order', async ({ page }) => {
> 334 |   await page.goto('/');
      |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
  335 |   const headings = await page.locator('h1, h2, h3, h4, h5, h6').evaluateAll(els =>
  336 |     els.map(el => el.tagName)
  337 |   );
  338 |   // Verify it doesn't skip from H1 directly to H3 without an H2.
  339 |   let prevLevel = 1;
  340 |   for (const h of headings) {
  341 |     const level = parseInt(h.replace('H', ''), 10);
  342 |     expect(level).toBeLessThanOrEqual(prevLevel + 1);
  343 |     prevLevel = level;
  344 |   }
  345 | });
  346 |
  347 | test('3.6 panes_stack_single_column_at_mobile', async ({ page }) => {
  348 |   await page.goto('/');
  349 |   await page.setViewportSize({ width: 375, height: 812 });
  350 |
  351 |   const railRect = await page.locator('.left-rail').boundingBox();
  352 |   const canvasRect = await page.locator('.canvas-shell').boundingBox();
  353 |   const panelRect = await page.locator('.properties-panel').boundingBox();
  354 |
  355 |   // They should be stacked vertically, so rail should be above canvas or vice versa
  356 |   expect(railRect.y < canvasRect.y || railRect.y > canvasRect.y).toBeTruthy();
  357 |   expect(railRect.width).toBeCloseTo(375, -1);
  358 | });
  359 |
  360 | test('1.13 send_for_signing_reveals_advance', async ({ page }) => {
  361 |   await page.goto('/');
  362 |   // ensure we have a field so it's valid
  363 |   await page.getByRole('button', { name: /Add Text field/i }).click();
  364 |   await page.getByRole('button', { name: 'Send for signing' }).click();
  365 |   await expect(page.getByRole('button', { name: /Advance/i })).toBeVisible();
  366 | });
  367 |
  368 | test('1.14 multi_facet_reload_round_trip', async ({ page }) => {
  369 |   await page.goto('/');
  370 |   await page.getByRole('button', { name: /Add Text field/i }).click();
  371 |   await page.locator('.field-box').nth(0).click();
  372 |   await page.locator('#field-submitter').click();
  373 |   await page.getByRole('option', { name: 'Second Party' }).click();
  374 |   await page.getByRole('button', { name: 'Add submitter' }).click();
  375 |   await page.getByRole('dialog').getByLabel('Name').fill('Third Party');
  376 |   await page.getByRole('dialog').getByRole('button', { name: 'Add submitter', exact: true }).click();
  377 |   await page.getByRole('button', { name: /Send for signing/i }).click();
  378 |
  379 |   await page.reload();
  380 |   await expect(page.locator('.field-box').nth(0).locator('.field-owner')).toHaveText('Second Party');
  381 |   await expect(page.locator('.submitter-row')).toHaveCount(3);
  382 |   await expect(page.locator('.status-pill')).toHaveText('Awaiting First Party');
  383 | });
  384 |
  385 | test('1.30 add_submitter_appends_and_activates', async ({ page }) => {
  386 |   await page.goto('/');
  387 |   await page.getByRole('button', { name: 'Add submitter' }).click();
  388 |   await page.getByRole('dialog').getByLabel('Name').fill('Third Party');
  389 |   await page.getByRole('dialog').getByRole('button', { name: 'Add submitter', exact: true }).click();
  390 |   await expect(page.locator('.submitter-row.active')).toContainText('Third Party');
  391 |   await expect(page.locator('.active-party-note')).toContainText('Third Party');
  392 | });
  393 |
  394 | test('1.31 panel_summary_when_no_field_selected', async ({ page }) => {
  395 |   await page.goto('/');
  396 |   await page.locator('.document-page').first().click(); // click canvas to clear selection
  397 |   await expect(page.locator('.template-summary dl')).toContainText('Sales Agreement');
  398 |   await expect(page.locator('.breakdown-row').first()).toBeVisible();
  399 | });
  400 |
  401 | test('1.33 empty_state_after_last_delete', async ({ page }) => {
  402 |   await page.goto('/');
  403 |   await page.locator('.field-box').nth(2).click();
  404 |   await page.keyboard.press('Delete');
  405 |   await page.locator('.field-box').nth(1).click();
  406 |   await page.keyboard.press('Delete');
  407 |   await page.locator('.field-box').nth(0).click();
  408 |   await page.keyboard.press('Delete');
  409 |
  410 |   await page.locator('.document-page').first().click();
  411 |   await expect(page.locator('.template-summary dl')).toContainText('Fields0');
  412 | });
  413 |
  414 | test('1.34 added_submitter_colours_stay_distinct', async ({ page }) => {
  415 |   await page.goto('/');
  416 |   await page.getByRole('button', { name: 'Add submitter' }).click();
  417 |   await page.getByRole('dialog').getByLabel('Name').fill('Third Party');
  418 |   await page.getByRole('dialog').getByRole('button', { name: 'Add submitter', exact: true }).click();
  419 |
  420 |   await page.getByRole('button', { name: 'Add submitter', exact: true }).click();
  421 |   await page.getByRole('dialog').getByLabel('Name').fill('Fourth Party');
  422 |   await page.getByRole('dialog').getByRole('button', { name: 'Add submitter', exact: true }).click();
  423 |
  424 |   const bg1 = await page.locator('.submitter-row').nth(2).locator('.submitter-swatch').evaluate(el => el.style.backgroundColor);
  425 |   const bg2 = await page.locator('.submitter-row').nth(3).locator('.submitter-swatch').evaluate(el => el.style.backgroundColor);
  426 |   expect(bg1).not.toBe(bg2);
  427 | });
  428 |
  429 | test('1.35 place_field_flow_counts_and_reload', async ({ page }) => {
  430 |   await page.goto('/');
  431 |   await page.getByRole('button', { name: /Add Text field/i }).click();
  432 |   await expect(page.locator('.template-row.active .row-meta')).toHaveText('4 fields');
  433 |   await page.locator('.document-page').first().click();
  434 |   await expect(page.locator('.template-summary dl')).toContainText('Fields4');
```