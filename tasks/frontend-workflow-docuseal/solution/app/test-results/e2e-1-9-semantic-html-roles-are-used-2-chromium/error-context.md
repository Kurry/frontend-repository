# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.mjs >> 1.9 semantic_html_roles_are_used_2
- Location: e2e.spec.mjs:563:1

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
Call log:
  - navigating to "http://localhost:3000/", waiting until "load"

```

# Test source

```ts
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
  490 |   await page.goto('/');
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
> 564 |   await page.goto('/');
      |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
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
  591 | // NOT-AUTOMATABLE: 15.4 empty_states_explain_next_step - linguistic inspection.
  592 | // NOT-AUTOMATABLE: 15.5 body_copy_is_well_written - linguistic inspection.
  593 | // NOT-AUTOMATABLE: 15.6 terminology_is_consistent - linguistic inspection.
  594 | // NOT-AUTOMATABLE: 15.7 numbers_dates_and_units_are_consistent - linguistic inspection.
  595 | // NOT-AUTOMATABLE: 15.8 success_messages_are_specific - linguistic inspection.
  596 | test('4.1 zero_fields_document_sheets_remain', async ({ page }) => {
  597 | });
  598 |
  599 | test('4.2 forms_validate_inline_before_submit', async ({ page }) => {
  600 | });
  601 |
  602 | test('4.3 errors_name_field_and_fix', async ({ page }) => {
  603 | });
  604 |
  605 | test('4.4 actions_show_toast_confirmation', async ({ page }) => {
  606 | });
  607 |
  608 | test('4.5 send_for_signing_shows_progress_feedback', async ({ page }) => {
  609 | });
  610 |
  611 | test('4.6 undo_available_for_destructive_field_actions', async ({ page }) => {
  612 | });
  613 |
  614 | test('4.7 export_import_controls_are_discoverable', async ({ page }) => {
  615 | });
  616 |
  617 | test('4.8 controls_use_semantic_tags', async ({ page }) => {
  618 | });
  619 |
  620 | test('4.9 export_modal_close_paths', async ({ page }) => {
  621 | });
  622 |
  623 | test('4.10 signing_advance_shows_step_progress', async ({ page }) => {
  624 | });
  625 |
  626 | test('4.11 overlong_field_name_rejected', async ({ page }) => {
  627 | });
  628 |
  629 | test('4.12 overlong_template_name_rejected', async ({ page }) => {
  630 | });
  631 |
  632 | test('4.13 undo_redo_disabled_at_empty_boundary', async ({ page }) => {
  633 | });
  634 |
  635 | test('4.14 malformed_template_json_import_rejected', async ({ page }) => {
  636 | });
  637 |
  638 | test('4.15 schema_invalid_import_rejected', async ({ page }) => {
  639 | });
  640 |
  641 | test('4.16 new_edit_after_undo_clears_redo', async ({ page }) => {
  642 | });
  643 |
  644 | // NOT-AUTOMATABLE: 3.7 typography_has_clear_hierarchy - visual/subjective metric or hard to assert dynamically without snapshots.
  645 | // NOT-AUTOMATABLE: 3.8 component_states_match_spec - visual/subjective metric or hard to assert dynamically without snapshots.
  646 | // NOT-AUTOMATABLE: 11.1 delightful_field_microinteractions - visual/subjective metric or hard to assert dynamically without snapshots.
  647 | // NOT-AUTOMATABLE: 11.2 polished_export_motion - visual/subjective metric or hard to assert dynamically without snapshots.
  648 | // NOT-AUTOMATABLE: 11.3 guided_empty_or_first_run_hints - visual/subjective metric or hard to assert dynamically without snapshots.
  649 | // NOT-AUTOMATABLE: 11.4 rich_signing_status_visualization - visual/subjective metric or hard to assert dynamically without snapshots.
  650 | // NOT-AUTOMATABLE: 11.5 keyboard_power_user_shortcuts - visual/subjective metric or hard to assert dynamically without snapshots.
  651 | // NOT-AUTOMATABLE: 11.6 submitter_or_template_personalization - visual/subjective metric or hard to assert dynamically without snapshots.
  652 | // NOT-AUTOMATABLE: 11.7 cohesive_docuseal_brand_chrome - visual/subjective metric or hard to assert dynamically without snapshots.
  653 | // NOT-AUTOMATABLE: 11.8 theme_or_density_beyond_requirements - visual/subjective metric or hard to assert dynamically without snapshots.
  654 | // NOT-AUTOMATABLE: 11.9 offline_friendly_persistence_polish - visual/subjective metric or hard to assert dynamically without snapshots.
  655 | // NOT-AUTOMATABLE: 11.10 competition_level_template_studio - visual/subjective metric or hard to assert dynamically without snapshots.
  656 | // NOT-AUTOMATABLE: innovation.catchall innovation_catchall - visual/subjective metric or hard to assert dynamically without snapshots.
  657 | test('6.1 place_field_updates_all_surfaces', async ({ page }) => {
  658 | });
  659 |
  660 | test('6.2 invalid_field_name_shows_inline_validation', async ({ page }) => {
  661 | });
  662 |
  663 | test('6.3 reassign_updates_canvas_panel_and_breakdown', async ({ page }) => {
  664 | });
```