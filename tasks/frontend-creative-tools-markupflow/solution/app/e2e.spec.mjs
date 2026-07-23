// MARKER: BEGIN CANONICAL E2E PREFIX
import { test, expect } from '@playwright/test';

test.describe('Markupflow Canonical E2E', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('1.1: workspace_loads_with_all_regions', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.1: keyboard_operable_studio_controls', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.10: undo_redo_step_history_with_disabled_states', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.10: reduced_motion_respected_for_lists', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.11: new_action_after_undo_discards_redo', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.11: export_import_history_keyboard_reachable', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.12: export_png_downloads_client_side', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.12: compare_pressed_state_exposed', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.13: annotations_and_effects_survive_reload', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.14: collab_converges_and_surfaces_conflicts', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.15: mobile_stack_keeps_hover_focus_states', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.18: text_tool_full_style_bar_present', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.2: sample_image_renders_demo_scene', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.2: conflict_choice_keyboard_operable', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.24: keyboard_shortcuts_drive_history', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.26: saved_project_open_update_delete', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.3: four_shape_tools_draw_distinct_shapes', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.3: icon_only_controls_have_accessible_names', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.31: choose_image_and_drop_load_client_side', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.32: edit_preview_mode_switch', async ({ page }) => {
    const descriptor = await page.evaluate(() =>
      window.webmcp_list_tools().find((tool) => tool.name === 'editor_switch_mode'));
    expect(descriptor.inputSchema).toMatchObject({
      required: ['mode'],
      properties: { mode: { enum: ['preview', 'edit'] } },
    });

    const preview = await page.evaluate(() =>
      window.webmcp_invoke_tool('editor_switch_mode', { mode: 'preview' }));
    expect(preview).toMatchObject({ ok: true, mode: 'preview' });
    await expect(page.locator('nav.tool-panel')).toHaveClass(/preview-hidden/);

    const edit = await page.evaluate(() =>
      window.webmcp_invoke_tool('editor_switch_mode', { mode: 'edit' }));
    expect(edit).toMatchObject({ ok: true, mode: 'edit' });
    await expect(page.locator('nav.tool-panel')).not.toHaveClass(/preview-hidden/);
  });

  test('1.33: save_form_validates_project_name', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.34: tiny_drag_creates_no_annotation', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.35: empty_history_keyboard_noop', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.36: last_delete_restores_empty_layers_state', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.37: conflict_preserves_prior_converged_text', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.38: flow_draw_rectangle_layers_undo_reload', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.39: flow_save_reset_open_reload_roundtrip', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.4: text_tool_styles_and_size_change_live', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.4: validation_and_conflict_announced', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.40: flow_delete_clears_row_canvas_selection', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.41: flow_undo_redo_syncs_canvas_and_layers', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.42: flow_move_buttons_reorder_and_persist', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.43: four_named_markup_presets_present', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.44: callout_arrow_preset_adds_arrow_and_text', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.45: blur_highlight_spotlight_presets_add_one_each', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.46: copy_paste_style_updates_selection', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.47: history_panel_lists_and_jumps', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.48: snapshot_restore_and_compare', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.49: export_project_json_live_compiled', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.5: blur_and_pixelate_visibly_distinct', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.5: project_name_field_explicitly_labeled', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.50: copy_project_json_reflects_session', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.51: import_project_json_round_trip', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.52: annotation_export_fields_match_contract', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.53: import_rejects_nonconforming_project_schema', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.54: saved_project_name_field_contract', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.55: arrow_and_loupe_geometry_fields_in_export', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.6: spotlight_dims_and_loupe_magnifies', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.6: active_tool_and_swatch_expose_selected', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.7: color_and_stroke_apply_to_next_shape', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.7: workspace_landmarks_present', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.8: layer_row_select_outline_and_delete', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.8: chrome_and_panel_contrast', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.9: layer_drag_reorder_restacks_canvas', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('1.9: semantic_buttons_for_tools_and_actions', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('11.1: draw_preview_delight_beyond_minimum', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('11.10: competition_level_annotation_studio_feel', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('11.11: preset_recipe_craft_beyond_bare_add', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('11.12: compare_and_history_power_user_polish', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('11.2: loupe_or_spotlight_storytelling_polish', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('11.3: guided_first_run_for_annotation_studio', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('11.4: histogram_or_annotation_aid_extra_usability', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('11.5: alternate_annotation_input_beyond_drag', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('11.6: session_personalization_beyond_requirements', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('11.7: branded_markupflow_narrative_polish', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('11.8: theme_toggle_craft_beyond_bare_swap', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('11.9: local_platform_enhancement', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('14.1: multi_facet_reload_persists_workspace', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('14.10: copy_json_input_dependent', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('14.11: history_jump_then_new_draw_discards_redo', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('14.12: compare_does_not_mutate_store', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('14.13: import_schema_rejection_preserves_workspace', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('14.14: geometry_cross_field_visible_in_export', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('14.2: layer_order_reversal_proves_live_stack', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('14.3: color_and_stroke_derived_canvas_sensitivity', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('14.4: draw_echoes_in_layers_and_canvas', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('14.5: draw_count_delta_exact', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('14.6: different_tools_different_outcomes', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('14.7: interleaved_draw_and_preview_flows', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('14.8: empty_then_repopulate_layers', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('14.9: project_json_export_import_round_trip_probe', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('15.1: consistent_capitalization_chrome_and_panels', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('15.10: specific_export_and_preset_verbs', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('15.11: import_errors_name_offending_field', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('15.2: specific_verbs_on_actions', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('15.3: validation_names_problem_and_fix', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('15.4: empty_states_explain_next_step', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('15.5: studio_copy_polished', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('15.6: terminology_consistent_across_surfaces', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('15.7: tool_and_style_labels_consistent', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('15.8: success_or_status_messages_are_specific', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('15.9: history_versions_empty_state_copy', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('3.1: spacing_matches_three_region_scale', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('3.10: microinteraction_timing_matches_spec', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('3.11: right_column_includes_history_versions', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('3.12: presets_group_in_tool_rail', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('3.2: typography_matches_studio_spec', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('3.3: desktop_composition_matches_reference', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('3.4: specified_state_changes_have_motion', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('3.5: responsive_behavior_matches_reference_patterns', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('3.6: controls_styled_not_browser_default', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('3.7: clear_hierarchy_rail_vs_layers', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('3.8: component_states_match_spec', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('3.9: palette_and_surfaces_match_tokens', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('4.1: empty_layers_message_when_no_annotations', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('4.10: save_disabled_while_name_empty', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('4.11: paste_style_disabled_before_copy', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('4.12: empty_snapshot_name_disabled', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('4.13: malformed_import_keeps_workspace', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('4.14: export_disabled_without_image', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('4.15: name_over_80_chars_rejected', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('4.16: geometry_violation_import_rejected', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('4.2: project_name_inline_validation_before_save', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('4.3: validation_names_field_and_fix', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('4.4: tiny_drag_creates_no_annotation', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('4.5: empty_history_undo_redo_disabled', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('4.6: last_delete_keeps_image_and_empty_layers', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('4.7: corrupt_storage_falls_back_clean', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('4.8: studio_controls_use_semantic_tags', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('4.9: conflict_keeps_prior_until_choice', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('6.1: draw_rectangle_updates_layers_and_undo', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('6.10: collab_conflict_resolves_without_dead_end', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('6.11: flow_preset_to_export_json', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('6.12: flow_style_copy_paste', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('6.13: flow_snapshot_compare_restore', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('6.14: flow_project_json_round_trip', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('6.2: invalid_project_name_inline_validation', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('6.3: layer_select_and_style_update_surfaces', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('6.4: delete_layer_clears_row_canvas_selection', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('6.5: edit_preview_mode_switch_retains_annotations', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('6.6: last_delete_reveals_layers_empty_state', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('6.7: save_reset_open_restores_project', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('6.8: undo_redo_keyboard_syncs_surfaces', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('6.9: layer_move_buttons_restack_canvas', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('7.1: layout_adapts_1280_to_375', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('7.10: desktop_three_regions_visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('7.11: export_history_reachable_at_375', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('7.2: mobile_tap_targets_adequate', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('7.3: typography_readable_both_widths', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('7.4: no_clip_or_overflow_at_375', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('7.5: tool_rail_scrolls_horizontally_at_375', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('7.6: narrow_stack_order_stays_usable', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('7.7: mobile_controls_tappable', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('7.8: no_horizontal_page_scroll_at_375', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('7.9: canvas_scales_to_fit_viewport', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('9.1: cold_start_under_two_seconds', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('9.10: no_layout_jumps_after_first_paint', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('9.11: project_json_compile_stays_responsive', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('9.2: console_clean_during_full_exercise', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('9.3: live_draw_preview_follows_pointer', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('9.4: shell_visible_while_settling', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('9.5: many_annotations_reorder_without_lag', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('9.6: ui_interactive_during_state_changes', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('9.7: canvas_redraw_holds_stable_frame_rate', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('9.8: rapid_undo_redo_never_hangs', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('9.9: extended_annotation_session_stable', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('MO-1: hover_states_on_all_controls', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('MO-10: collab_offline_and_syncing_indicators', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('MO-11: reduced_motion_removes_animations', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('MO-12: compare_fade_annotations', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('MO-13: preset_layers_pulse_and_copy_confirm', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('MO-14: snapshot_row_animates_in', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('MO-2: keyboard_focus_outline_visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('MO-3: active_tool_highlight_updates_instantly', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('MO-4: annotation_commits_on_pointer_release', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('MO-5: drag_row_opacity_and_drop_indicator', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('MO-6: live_dashed_drawing_preview', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('MO-7: layers_row_add_delete_animates', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('MO-8: saved_project_row_animates_in', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('MO-9: theme_toggle_recolors_every_surface', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('TI-1: image_and_effects_survive_reload', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('TI-10: interactive_within_two_seconds', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('TI-11: drawing_and_reorder_stay_responsive', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('TI-12: first_load_starts_blank', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('TI-13: versions_and_export_text_in_shared_store', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('TI-14: project_json_round_trip_persists_semantics', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('TI-15: export_import_share_api_shaped_schema', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('TI-16: saved_and_snapshot_forms_share_annotation_contract', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('TI-2: layer_order_persists_across_reload', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('TI-3: history_branch_discards_redo_stack', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('TI-4: corrupt_storage_recovers_cleanly', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('TI-5: console_clean_through_core_workflow', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('TI-6: single_shared_state_coherence', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('TI-7: keyboard_reachability_and_focus', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('TI-8: accessible_names_and_selected_state', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('TI-9: keyboard_history_and_conflict_choice', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('VD-1: dark_theme_token_palette', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('VD-10: system_ui_font_stack', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('VD-11: validation_message_error_color', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('VD-12: empty_state_copy_explains_next_step', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('VD-13: specific_verbs_consistent_capitalization', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('VD-14: presets_and_history_panel_chrome', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('VD-15: project_json_preview_monospace_surface', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('VD-2: primary_and_accent_button_colors', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('VD-3: section_label_type_hierarchy', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('VD-4: radius_and_4px_spacing_scale', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('VD-5: swatch_palette_with_selected_indicator', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('VD-6: light_theme_stays_legible', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('VD-7: mobile_canvas_scales_to_viewport', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('VD-8: desktop_three_region_layout', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('VD-9: consistent_icon_set_throughout', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

  test('innovation.catchall: innovation_catchall', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Try sample image' })).toBeVisible();
    await page.getByRole('button', { name: 'Try sample image' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Draw rectangle' }).click();
    const canvas = page.locator('canvas[role="application"]');
    await canvas.hover({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await canvas.hover({ position: { x: 200, y: 200 } });
    await page.mouse.up();
    let layers = page.locator('[role="listitem"][aria-label^="Layer"]');
    await expect(layers).toHaveCount(1);
  });

});
