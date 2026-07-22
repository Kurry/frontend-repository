# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.mjs >> 14.3 export_derived_view_tracks_edits
- Location: e2e.spec.mjs:107:1

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
Call log:
  - navigating to "http://localhost:3000/", waiting until "load"

```

# Test source

```ts
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
  30  |   await page.goto('/');
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
> 108 |   await page.goto('/');
      |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
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
  131 |   await page.locator('button[aria-label="Export template package"]').click();
  132 |   await expect(page.locator('pre[aria-label="Template JSON preview"]')).toContainText('CanvasEchoTest');
  133 |
  134 |   await page.getByRole('tab', { name: 'Signing Summary' }).click();
  135 |   await expect(page.locator('pre[aria-label="Signing summary preview"]')).toContainText('CanvasEchoTest');
  136 | });
  137 |
  138 | test('14.5 place_field_count_delta_exact', async ({ page }) => {
  139 |   await page.goto('/');
  140 |   const countBefore = await page.locator('.field-box').count();
  141 |   await page.getByRole('button', { name: /Add Text field/i }).click();
  142 |   const countAfter = await page.locator('.field-box').count();
  143 |   expect(countAfter).toBe(countBefore + 1);
  144 | });
  145 |
  146 | test('14.6 different_field_names_change_export', async ({ page }) => {
  147 |   await page.goto('/');
  148 |
  149 |   await page.getByRole('button', { name: /Add Text field/i }).click();
  150 |   await page.locator('.field-box').nth(3).click();
  151 |   await page.locator('#field-name').fill('FirstFieldName');
  152 |
  153 |   await page.getByRole('button', { name: /Add Text field/i }).click();
  154 |   await page.locator('.field-box').nth(4).click();
  155 |   await page.locator('#field-name').fill('SecondFieldName');
  156 |
  157 |   await page.locator('button[aria-label="Export template package"]').click();
  158 |   const jsonPreview = page.locator('pre[aria-label="Template JSON preview"]');
  159 |   await expect(jsonPreview).toBeVisible();
  160 |   const jsonContent = await jsonPreview.textContent();
  161 |   expect(jsonContent).toContain('FirstFieldName');
  162 |   expect(jsonContent).toContain('SecondFieldName');
  163 | });
  164 |
  165 | test('14.7 interleaved_template_and_export_flows', async ({ page }) => {
  166 |   await page.goto('/');
  167 |
  168 |   await page.getByRole('button', { name: /Add Text field/i }).click();
  169 |   await page.locator('.field-box').nth(3).click();
  170 |   await page.locator('#field-name').fill('TemplateA_Field');
  171 |
  172 |   await page.getByRole('button', { name: 'NDA — Mutual' }).click();
  173 |   await page.getByRole('button', { name: /Add Text field/i }).click();
  174 |   await page.locator('.field-box').nth(1).click();
  175 |   await page.locator('#field-name').fill('TemplateB_Field');
  176 |
  177 |   await page.getByRole('button', { name: 'Sales Agreement' }).click();
  178 |
  179 |   await page.locator('button[aria-label="Export template package"]').click();
  180 |   const jsonPreview = page.locator('pre[aria-label="Template JSON preview"]');
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
```