# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.mjs >> 1.41 undo_redo_controls_present
- Location: e2e.spec.mjs:489:1

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
Call log:
  - navigating to "http://localhost:3000/", waiting until "load"

```

# Test source

```ts
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
  435 |   await page.reload();
  436 |   await expect(page.locator('.template-row.active .row-meta')).toHaveText('4 fields');
  437 | });
  438 |
  439 | test('1.36 reassign_field_flow_breakdown_and_reload', async ({ page }) => {
  440 |   await page.goto('/');
  441 |   await page.locator('.field-box').first().click();
  442 |   await page.locator('#field-submitter').click();
  443 |   await page.getByRole('option', { name: 'Second Party' }).click();
  444 |
  445 |   await expect(page.locator('.breakdown-row').nth(0).locator('strong')).toHaveText('1');
  446 |   await expect(page.locator('.breakdown-row').nth(1).locator('strong')).toHaveText('2'); // Because there was only 1 field assigned to First Party by default in that template
  447 |
  448 |   await page.reload();
  449 |   await expect(page.locator('.breakdown-row').nth(0).locator('strong')).toHaveText('1');
  450 |   await expect(page.locator('.breakdown-row').nth(1).locator('strong')).toHaveText('2');
  451 | });
  452 |
  453 | test('1.37 delete_field_flow_counts_and_reload', async ({ page }) => {
  454 |   await page.goto('/');
  455 |   await page.locator('.field-box').first().click();
  456 |   await page.keyboard.press('Delete');
  457 |   await expect(page.locator('.template-row.active .row-meta')).toHaveText('2 fields');
  458 |   await page.reload();
  459 |   await expect(page.locator('.template-row.active .row-meta')).toHaveText('2 fields');
  460 | });
  461 |
  462 | test('1.38 signing_flow_advances_to_completed_and_reload', async ({ page }) => {
  463 |   await page.goto('/');
  464 |   await page.getByRole('button', { name: 'Send for signing' }).click();
  465 |   await expect(page.locator('.status-pill')).toHaveText('Awaiting First Party');
  466 |
  467 |   await page.getByRole('button', { name: /Advance/i }).click();
  468 |   await expect(page.locator('.status-pill')).toHaveText('Awaiting Second Party');
  469 |
  470 |   await page.getByRole('button', { name: /Advance/i }).click();
  471 |   await expect(page.locator('.status-pill')).toHaveText('Completed');
  472 |
  473 |   await page.reload();
  474 |   await expect(page.locator('.status-pill')).toHaveText('Completed');
  475 | });
  476 |
  477 | test('1.39 template_switch_round_trip_preserves_fields', async ({ page }) => {
  478 |   await page.goto('/');
  479 |   await page.getByRole('button', { name: /Add Text field/i }).click();
  480 |   await expect(page.locator('.field-box')).toHaveCount(4);
  481 |
  482 |   await page.locator('.template-row').nth(1).click();
  483 |   await expect(page.locator('.field-box')).toHaveCount(1);
  484 |
  485 |   await page.locator('.template-row').nth(0).click();
  486 |   await expect(page.locator('.field-box')).toHaveCount(4);
  487 | });
  488 |
  489 | test('1.41 undo_redo_controls_present', async ({ page }) => {
> 490 |   await page.goto('/');
      |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
  491 |   await expect(page.getByRole('button', { name: 'Undo' })).toBeDisabled();
  492 |   await expect(page.getByRole('button', { name: 'Redo' })).toBeDisabled();
  493 |   await page.getByRole('button', { name: /Add Text field/i }).click();
  494 |   await expect(page.getByRole('button', { name: 'Undo' })).not.toBeDisabled();
  495 | });
  496 |
  497 | test('1.42 duplicate_field_adds_matching_copy', async ({ page }) => {
  498 |   await page.goto('/');
  499 |   await page.locator('.field-box').first().click();
  500 |   await page.getByRole('button', { name: 'Duplicate field' }).click();
  501 |   await expect(page.locator('.field-box')).toHaveCount(4);
  502 | });
  503 |
  504 | test('1.43 batch_reassign_updates_selected_fields', async ({ page }) => {
  505 |   await page.goto('/');
  506 |   await page.locator('.field-box').nth(0).click();
  507 |   await page.locator('.field-box').nth(1).click({ modifiers: ['Control'] });
  508 |   await page.locator('#batch-submitter').click();
  509 |   await page.getByRole('option', { name: 'Second Party' }).click();
  510 |   await page.getByRole('button', { name: 'Batch reassign' }).click();
  511 |
  512 |   await expect(page.locator('.field-box').nth(0).locator('.field-owner')).toHaveText('Second Party');
  513 |   await expect(page.locator('.field-box').nth(1).locator('.field-owner')).toHaveText('Second Party');
  514 | });
  515 |
  516 | test('1.44 export_opens_template_json_and_signing_summary', async ({ page }) => {
  517 |   await page.goto('/');
  518 |   await page.locator('button[aria-label="Export template package"]').click();
  519 |   await expect(page.getByRole('tab', { name: 'Template JSON' })).toBeVisible();
  520 |   await expect(page.getByRole('tab', { name: 'Signing Summary' })).toBeVisible();
  521 | });
  522 |
  523 | test('1.45 template_json_api_shaped_field_contract', async ({ page }) => {
  524 |   await page.goto('/');
  525 |   await page.locator('button[aria-label="Export template package"]').click();
  526 |   const jsonContent = await page.locator('pre[aria-label="Template JSON preview"]').textContent();
  527 |   const parsed = JSON.parse(jsonContent);
  528 |   expect(parsed.name).toBeDefined();
  529 |   expect(parsed.status).toBeDefined();
  530 |   expect(parsed.submitters).toBeDefined();
  531 |   expect(parsed.fields[0].type).toBeDefined();
  532 |   expect(parsed.fields[0].x).toBeDefined();
  533 | });
  534 |
  535 | test('1.46 export_contains_session_field_mutations', async ({ page }) => {
  536 |   await page.goto('/');
  537 |   await page.locator('.field-box').first().click();
  538 |   await page.locator('#field-name').fill('MutationTest123');
  539 |   await page.locator('button[aria-label="Export template package"]').click();
  540 |   const jsonContent = await page.locator('pre[aria-label="Template JSON preview"]').textContent();
  541 |   expect(jsonContent).toContain('MutationTest123');
  542 | });
  543 |
  544 | test('1.47 import_template_json_round_trip', async ({ page }) => {
  545 |   await page.goto('/');
  546 |   await page.locator('.field-box').first().click();
  547 |   await page.locator('#field-name').fill('RoundTripImport1');
  548 |
  549 |   await page.locator('button[aria-label="Export template package"]').click();
  550 |   const jsonContent = await page.locator('pre[aria-label="Template JSON preview"]').textContent();
  551 |   await page.locator('button[aria-label="Close export dialog"]').click();
  552 |
  553 |   await page.locator('.field-box').first().click();
  554 |   await page.keyboard.press('Delete');
  555 |
  556 |   await page.locator('button[aria-label="Import Template JSON"]').click();
  557 |   await page.locator('#import-document').fill(jsonContent);
  558 |   await page.getByRole('button', { name: 'Import template' }).click();
  559 |
  560 |   await expect(page.locator('.field-box').first().locator('.field-name')).toHaveText('RoundTripImport1');
  561 | });
  562 |
  563 | test('1.9 semantic_html_roles_are_used_2', async ({ page }) => {
  564 |   await page.goto('/');
  565 |   await expect(page.locator('button[aria-label="Export template package"]')).toHaveAttribute('type', 'button');
  566 | });
  567 |
  568 | test('1.10 reduced_motion_is_respected_2', async ({ page }) => {
  569 |   await page.goto('/');
  570 |   await page.emulateMedia({ reducedMotion: 'reduce' });
  571 |   // check that export modal still opens correctly and is usable
  572 |   await page.locator('button[aria-label="Export template package"]').click();
  573 |   await expect(page.getByRole('dialog', { name: /Export/i })).toBeVisible();
  574 | });
  575 |
  576 | // NOT-AUTOMATABLE: 1.7 landmark_navigation_is_present - verified manually via source code review.
  577 | // NOT-AUTOMATABLE: 1.8 text_and_controls_have_contrast - visual inspection only.
  578 | // NOT-AUTOMATABLE: 3.1 spacing_and_sizing_follow_scale - visual inspection only.
  579 | // NOT-AUTOMATABLE: 3.2 canvas_is_primary_visual_focus - visual inspection only.
  580 | // NOT-AUTOMATABLE: 3.3 fields_tinted_by_submitter_colour - visual inspection only.
  581 | // NOT-AUTOMATABLE: 3.4 selected_field_ring_not_colour_alone - visual inspection only.
  582 | // NOT-AUTOMATABLE: 3.9 page_sheets_render_faux_document_body - visual inspection only.
  583 | // NOT-AUTOMATABLE: 3.5 status_and_required_have_text_cues - visual inspection only.
  584 | // NOT-AUTOMATABLE: 3.10 palette_glyphs_and_panel_control_anatomy - visual inspection only.
  585 | // NOT-AUTOMATABLE: 3.11 hairline_borders_and_status_pill_colours - visual inspection only.
  586 | // NOT-AUTOMATABLE: 3.13 ui_copy_specific_and_consistent - visual inspection only.
  587 | // NOT-AUTOMATABLE: 3.15 export_modal_and_undo_disabled_treatment - visual inspection only.
  588 | // NOT-AUTOMATABLE: 15.1 headings_use_consistent_capitalization - linguistic inspection.
  589 | // NOT-AUTOMATABLE: 15.2 actions_use_specific_labels - linguistic inspection.
  590 | // NOT-AUTOMATABLE: 15.3 errors_name_problem_and_fix - linguistic inspection.
```