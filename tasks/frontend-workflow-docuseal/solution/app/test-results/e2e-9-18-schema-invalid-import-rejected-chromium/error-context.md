# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.mjs >> 9.18 schema_invalid_import_rejected
- Location: e2e.spec.mjs:280:1

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
Call log:
  - navigating to "http://localhost:3000/", waiting until "load"

```

# Test source

```ts
  181 |   await expect(jsonPreview).toBeVisible();
  182 |   const jsonContent = await jsonPreview.textContent();
  183 |   expect(jsonContent).toContain('TemplateA_Field');
  184 |   expect(jsonContent).not.toContain('TemplateB_Field');
  185 | });
  186 |
  187 | test('14.8 empty_fields_then_repopulate_tracks_counts', async ({ page }) => {
  188 |   await page.goto('/');
  189 |
  190 |   await page.locator('.field-box').nth(2).click();
  191 |   await page.keyboard.press('Delete');
  192 |   await page.locator('.field-box').nth(1).click();
  193 |   await page.keyboard.press('Delete');
  194 |   await page.locator('.field-box').nth(0).click();
  195 |   await page.keyboard.press('Delete');
  196 |
  197 |   await expect(page.locator('.field-box')).toHaveCount(0);
  198 |   await expect(page.locator('.template-row.active .row-meta')).toHaveText('0 fields');
  199 |
  200 |   await page.getByRole('button', { name: /Add Text field/i }).click();
  201 |   await expect(page.locator('.template-row.active .row-meta')).toHaveText('1 field');
  202 | });
  203 |
  204 | test('14.9 undo_round_trip_restores_export', async ({ page }) => {
  205 |   await page.goto('/');
  206 |
  207 |   await page.getByRole('button', { name: /Add Text field/i }).click();
  208 |   await page.locator('.field-box').nth(3).click();
  209 |   await page.locator('#field-name').fill('TempNameBeforeUndo');
  210 |
  211 |   await page.getByRole('button', { name: 'Undo', exact: true }).click();
  212 |
  213 |   await page.locator('button[aria-label="Export template package"]').click();
  214 |   const jsonPreview = page.locator('pre[aria-label="Template JSON preview"]');
  215 |   await expect(jsonPreview).toBeVisible();
  216 |   const jsonContent = await jsonPreview.textContent();
  217 |   expect(jsonContent).not.toContain('TempNameBeforeUndo');
  218 | });
  219 |
  220 | test('14.10 import_export_round_trip_preserves_fields', async ({ page }) => {
  221 |   await page.goto('/');
  222 |
  223 |   await page.locator('.field-box').nth(0).click();
  224 |   await page.locator('#field-name').fill('ImportExportTestName');
  225 |
  226 |   await page.locator('button[aria-label="Export template package"]').click();
  227 |   const jsonPreview = page.locator('pre[aria-label="Template JSON preview"]');
  228 |   await expect(jsonPreview).toBeVisible();
  229 |   const jsonContent = await jsonPreview.textContent();
  230 |   await page.locator('button[aria-label="Close export dialog"]').click();
  231 |
  232 |   await page.locator('.field-box').nth(0).click();
  233 |   await page.keyboard.press('Delete');
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
> 281 |   await page.goto('/');
      |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
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
  334 |   await page.goto('/');
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
```