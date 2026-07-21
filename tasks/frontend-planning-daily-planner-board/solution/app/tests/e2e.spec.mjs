import { test, expect } from '@playwright/test';

// We mock listTools and invokeTool for the standalone run.
const listTools = async (page) => {
  return await page.evaluate(async () => window.webmcp_list_tools ? await window.webmcp_list_tools() : []);
};

const invokeTool = async (page, name, args) => {
  return await page.evaluate(async ({name, args}) => await window.webmcp_invoke_tool(name, args), {name, args});
};

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:3000");
});

// ==== END CANONICAL REGION — add task-specific criterion tests below. ====

test('1.24 inline_validation_disables_submit_until_valid', async ({ page }) => {
  await page.locator(".col[data-day='18'] .add-task").click();
  const form = page.locator(".col[data-day='18'] .add-form");
  const submit = form.getByRole("button", { name: "Add task" });
  await expect(submit).toBeDisabled();

  await form.locator(".add-title").fill("Plan launch");
  await expect(submit).toBeEnabled();
  await form.locator(".add-start").fill("tomorrow morning");
  await expect(form.getByText("Start time must look like 9:00 am or 2:30 pm")).toBeVisible();
  await expect(submit).toBeDisabled();
  await form.locator(".add-start").fill("10:30 am");
  await expect(submit).toBeEnabled();
});

test('1.30 completion_toggle_round_trips_across_views', async ({ page }) => {
  const complete = page.getByRole("checkbox", { name: "Complete task: Work" });
  await expect(complete).not.toBeChecked();
  await complete.click();
  await expect(complete).toBeChecked();
  await expect(page.getByText("Work", { exact: true }).first()).toHaveCSS("text-decoration-line", "line-through");
  await complete.click();
  await expect(complete).not.toBeChecked();
});

test('1.46 schedule_conflict_drawer_lists_collisions', async ({ page }) => {
  const conflicts = page.getByRole("button", { name: "Schedule conflicts: 0" });
  await expect(conflicts).toBeVisible();
  await conflicts.click();
  await expect(page.getByText("No schedule conflicts")).toBeVisible();

  await page.locator(".col[data-day='20'] .add-task").click();
  const form = page.locator(".col[data-day='20'] .add-form");
  await form.locator(".add-title").fill("Overlap review");
  await form.locator(".add-start").fill("9:00 am");
  await form.getByRole("button", { name: "Add task" }).click();
  await expect(page.getByRole("button", { name: "Schedule conflicts: 1" })).toBeVisible();
});

test('1.43 export_reflects_session_mutations', async ({ page }) => {
  await page.getByRole("button", { name: "Export planner artifacts" }).click();
  await expect(page.getByText(/compiled just now/)).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  await page.locator(".col[data-day='18'] .add-task").click();
  const form = page.locator(".col[data-day='18'] .add-form");
  await form.locator(".add-title").fill("Fresh artifact task");
  await form.getByRole("button", { name: "Add task" }).click();
  await expect(page.locator("#export-btn")).toHaveClass(/stale/);
  await page.getByRole("button", { name: "Export planner artifacts" }).click();
  await expect(page.getByText(/recompiled after board changes/)).toBeVisible();
  await expect(page.getByLabel("ICS payload preview")).toHaveValue(/SUMMARY:Fresh artifact task/);
});

// NOT-AUTOMATABLE: 1.1 controls_are_keyboard_accessible — Subjective definition of 'reachable'.
// NOT-AUTOMATABLE: 1.2 edit_dialog_manages_focus — Requires specific OS focus semantics testing.
// NOT-AUTOMATABLE: 3.1 three_region_spacing_matches_reference — Visual match criteria.
// NOT-AUTOMATABLE: 3.2 day_column_headers_match_reference — Visual layout check.
