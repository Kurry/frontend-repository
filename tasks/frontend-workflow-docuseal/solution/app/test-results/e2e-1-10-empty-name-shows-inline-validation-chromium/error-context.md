# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.mjs >> 1.10 empty_name_shows_inline_validation
- Location: e2e.spec.mjs:29:1

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
Call log:
  - navigating to "http://localhost:3000/", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   |
  3   | // ==== END CANONICAL REGION — add task-specific criterion tests below. ====
  4   |
  5   | test('1.4 opens_into_document_editor_workspace', async ({ page }) => {
  6   |   await page.goto('/');
  7   |   await expect(page.getByRole('heading', { name: 'Docuseal' })).toBeVisible();
  8   |   await expect(page.locator('.template-name-input')).toBeVisible();
  9   |   await expect(page.getByRole('switch', { name: /Build/ })).toBeVisible();
  10  |   await expect(page.locator('.status-pill')).toBeVisible();
  11  |   await expect(page.locator('.left-rail')).toBeVisible();
  12  |   await expect(page.locator('.properties-panel')).toBeVisible();
  13  | });
  14  |
  15  | test('1.5 palette_click_places_and_selects_field', async ({ page }) => {
  16  |   await page.goto('/');
  17  |   await page.getByRole('button', { name: /Add Date field/i }).click();
  18  |   await expect(page.locator('.field-box').last()).toHaveClass(/selected/);
  19  |   await expect(page.locator('.properties-panel')).toContainText('Date');
  20  | });
  21  |
  22  | test('1.9 rename_updates_canvas_label_immediately', async ({ page }) => {
  23  |   await page.goto('/');
  24  |   await page.locator('.field-box').first().click();
  25  |   await page.locator('#field-name').fill('NewTestName');
  26  |   await expect(page.locator('.field-box').first().locator('.field-name')).toHaveText('NewTestName');
  27  | });
  28  |
  29  | test('1.10 empty_name_shows_inline_validation', async ({ page }) => {
> 30  |   await page.goto('/');
      |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
  31  |   await page.locator('.field-box').first().click();
  32  |   await page.locator('#field-name').fill('');
  33  |   await expect(page.locator('.form-error').filter({ hasText: 'Name: ' })).toBeVisible();
  34  |
  35  |   await expect(page.locator('.field-box').first()).toBeVisible();
  36  |
  37  |   await page.locator('#field-name').fill('ValidName');
  38  |   await expect(page.locator('.form-error').filter({ hasText: 'Name: ' })).not.toBeVisible();
  39  | });
  40  |
  41  | test('1.11 delete_removes_only_selected_field', async ({ page }) => {
  42  |   await page.goto('/');
  43  |   const countBefore = await page.locator('.field-box').count();
  44  |   await page.locator('.field-box').first().click();
  45  |   await page.getByRole('button', { name: 'Delete field' }).click();
  46  |   await expect(page.locator('.field-box')).toHaveCount(countBefore - 1);
  47  | });
  48  |
  49  | test('1.26 preview_mode_shows_fillable_fields', async ({ page }) => {
  50  |   await page.goto('/');
  51  |   await page.getByRole('switch', { name: /Build or Preview/i }).click();
  52  |   await expect(page.locator('.preview-field-input').first()).toBeVisible();
  53  |   await page.getByRole('switch', { name: /Build or Preview/i }).click();
  54  |   await expect(page.locator('.field-box').first().locator('.field-name')).toBeVisible();
  55  | });
  56  |
  57  | test('1.32 send_for_signing_invalid_shows_feedback', async ({ page }) => {
  58  |   await page.goto('/');
  59  |   await page.getByRole('button', { name: 'Onboarding Packet' }).click();
  60  |   await page.getByRole('button', { name: 'Send for signing' }).click();
  61  |   await expect(page.locator('.top-error')).toBeVisible();
  62  | });
  63  |
  64  | test('1.40 template_name_inline_validation', async ({ page }) => {
  65  |   await page.goto('/');
  66  |   await page.locator('.template-name-input').fill('');
  67  |   await expect(page.locator('.template-name-error')).toBeVisible();
  68  |   await page.locator('.template-name-input').fill('ValidName');
  69  |   await expect(page.locator('.template-name-error')).not.toBeVisible();
  70  | });
  71  |
  72  | test('14.1 multi_facet_persistence_round_trip', async ({ page }) => {
  73  |   await page.goto('/');
  74  |
  75  |   await page.getByRole('button', { name: /Add Text field/i }).click();
  76  |   await expect(page.locator('.field-box')).toHaveCount(4);
  77  |
  78  |   await page.locator('.field-box').nth(0).click();
  79  |   await page.locator('#field-submitter').click();
  80  |   await page.getByRole('option', { name: 'Second Party' }).click();
  81  |
  82  |   await page.getByRole('button', { name: 'Add submitter' }).click();
  83  |   await page.getByRole('dialog').getByLabel('Name').fill('Third Party');
  84  |   await page.getByRole('dialog').getByRole('button', { name: 'Add submitter', exact: true }).click();
  85  |
  86  |   await page.getByRole('button', { name: /Send for signing/i }).click();
  87  |
  88  |   await page.reload();
  89  |
  90  |   await expect(page.locator('.field-box')).toHaveCount(4);
  91  |   await expect(page.locator('.field-box').nth(0).locator('.field-owner')).toHaveText('Second Party');
  92  |   await expect(page.locator('.submitter-row')).toHaveCount(3);
  93  |   await expect(page.locator('.status-pill')).toHaveText('Awaiting First Party');
  94  | });
  95  |
  96  | test('14.2 template_order_swap_proves_live_lists', async ({ page }) => {
  97  |   await page.goto('/');
  98  |   await expect(page.locator('.field-box')).toHaveCount(3);
  99  |
  100 |   await page.locator('.template-row').nth(1).click();
  101 |   await expect(page.locator('.field-box')).toHaveCount(1);
  102 |
  103 |   await page.locator('.template-row').nth(0).click();
  104 |   await expect(page.locator('.field-box')).toHaveCount(3);
  105 | });
  106 |
  107 | test('14.3 export_derived_view_tracks_edits', async ({ page }) => {
  108 |   await page.goto('/');
  109 |
  110 |   await page.locator('.field-box').first().click();
  111 |   await page.locator('#field-name').fill('CustomName123');
  112 |   await page.locator('#field-submitter').click();
  113 |   await page.getByRole('option', { name: 'Second Party' }).click();
  114 |
  115 |   await page.locator('button[aria-label="Export template package"]').click();
  116 |   const jsonPreview = page.locator('pre[aria-label="Template JSON preview"]');
  117 |   await expect(jsonPreview).toBeVisible();
  118 |   const jsonContent = await jsonPreview.textContent();
  119 |   expect(jsonContent).toContain('CustomName123');
  120 |   expect(jsonContent).toContain('"submitter": "Second Party"');
  121 | });
  122 |
  123 | test('14.4 cross_view_echo_canvas_panel_export', async ({ page }) => {
  124 |   await page.goto('/');
  125 |
  126 |   await page.locator('.field-box').first().click();
  127 |   await page.locator('#field-name').fill('CanvasEchoTest');
  128 |
  129 |   await expect(page.locator('.field-box').first().locator('.field-name')).toHaveText('CanvasEchoTest');
  130 |
```