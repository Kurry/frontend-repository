const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("completion and bulk selection are distinct accessible checkboxes", async ({ page }) => {
  const complete = page.getByRole("checkbox", { name: "Complete task: Work" });
  const select = page.getByRole("checkbox", { name: "Select Work for bulk actions" });

  await expect(complete).not.toBeChecked();
  await expect(select).not.toBeChecked();
  await complete.click();
  await expect(complete).toBeChecked();
  await expect(page.getByText("Work", { exact: true }).first()).toHaveCSS("text-decoration-line", "line-through");
  await complete.click();
  await expect(complete).not.toBeChecked();
});

test("conflict count is always operable and updates for overlapping tasks", async ({ page }) => {
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

test("add task validates inline and disables submit until every field is valid", async ({ page }) => {
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

test("export visibly recompiles after a board mutation", async ({ page }) => {
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
