# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.mjs >> Command Center E2E >> 1.12 feed_newest_first_capped_50
- Location: e2e.spec.mjs:80:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('ul li, [role="listitem"]').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('ul li, [role="listitem"]').first()

```

```yaml
- banner:
  - strong: PromptOps
  - text: Command center Production Seeded session
  - button "Compact rows"
  - button "Night mode disabled"
  - button "Undo" [disabled]
  - button "Redo" [disabled]
  - button "Commands ⌘K"
  - button "Export session"
  - button "Connect agent"
- paragraph: Monday, July 20 · Live workspace
- heading "Good morning, operator." [level=1]
- paragraph: Monitor prompt performance, coordinate coding agents, and preserve the session artifact.
- text: All systems operational
- region "Key performance indicators":
  - button "Open Total prompts detail":
    - text: Total prompts
    - strong: 2,486
    - text: 12.4%
    - application
  - button "Open Active agents detail":
    - text: Active agents
    - strong: "1"
    - text: 8.2%
    - application
  - button "Open Evaluations run detail":
    - text: Evaluations run
    - strong: 18,432
    - text: 18.7%
    - application
  - button "Open Cost this month detail":
    - text: Cost this month
    - strong: $4,296
    - text: 3.1%
    - application
- main:
  - region "Coding agents":
    - paragraph: Live orchestration
    - heading "Coding agents" [level=2]
    - paragraph: 4 connected · 1 running
    - checkbox "Select all agents"
    - text: Select all agents
    - button "Disconnect selected" [disabled]
    - button "Connect agent"
    - article:
      - checkbox "Select Nova Refactor"
      - text: Select Nova Refactor
      - button "NO Nova Refactor gpt-4.1 Run complete 3 of 3 steps complete Running" [expanded]:
        - text: "NO"
        - strong: Nova Refactor
        - text: gpt-4.1
        - strong: Run complete
        - text: 3 of 3 steps complete Running
      - button "Rename Nova Refactor"
      - button "Disconnect Nova Refactor"
      - text: Description
      - strong: Modernizes React code and validates component boundaries.
      - text: Full agent name
      - strong: Nova Refactor
      - text: Last active
      - strong: 7/22/2026, 2:12:57 AM
      - list "Nova Refactor steps":
        - listitem:
          - strong: Analyze repository context
          - text: complete
        - listitem:
          - strong: Draft prompt changes
          - text: complete
        - listitem:
          - strong: Verify evaluation results
          - text: complete
    - article:
      - checkbox "Select Sentry Reviewer"
      - text: Select Sentry Reviewer
      - button "SE Sentry Reviewer claude-sonnet-4 Ready for a task Last active 7m ago Idle":
        - text: SE
        - strong: Sentry Reviewer
        - text: claude-sonnet-4
        - strong: Ready for a task
        - text: Last active 7m ago Idle
      - button "Run"
      - button "Rename Sentry Reviewer"
      - button "Disconnect Sentry Reviewer"
    - article:
      - checkbox "Select Vector Evaluator"
      - text: Select Vector Evaluator
      - button "VE Vector Evaluator o3-mini Run needs attention Last active 18m ago Error":
        - text: VE
        - strong: Vector Evaluator
        - text: o3-mini
        - strong: Run needs attention
        - text: Last active 18m ago Error
      - button "Retry"
      - button "Rename Vector Evaluator"
      - button "Disconnect Vector Evaluator"
    - article:
      - checkbox "Select Orbit Context Mapper"
      - text: Select Orbit Context Mapper
      - button "OR Orbit Context Mapper gemini-2.5-pro Ready for a task Last active 42m ago Idle":
        - text: OR
        - strong: Orbit Context Mapper
        - text: gemini-2.5-pro
        - strong: Ready for a task
        - text: Last active 42m ago Idle
      - button "Run"
      - button "Rename Orbit Context Mapper"
      - button "Disconnect Orbit Context Mapper"
  - region "Activity feed":
    - paragraph: Session pulse
    - heading "Activity feed" [level=2]
    - paragraph: 14 of 14 events visible
    - button "Simulate activity"
    - button "Show errors only"
    - button "Show agent events"
    - button "Show evaluations"
    - button "Show prompt changes"
    - button "Prompt"
    - button "Evaluation"
    - button "Agent"
    - button "Errors"
    - button "Clear filters" [disabled]
    - button "Nova Refactor started a repository analysis run Info agent 1m ago":
      - text: Nova Refactor started a repository analysis run Info agent
      - time: 1m ago
    - button "Safety rubric evaluation finished at 96.4% Success evaluation 4m ago":
      - text: Safety rubric evaluation finished at 96.4% Success evaluation
      - time: 4m ago
    - button "Customer-support system prompt was created Success prompt 7m ago":
      - text: Customer-support system prompt was created Success prompt
      - time: 7m ago
    - button "Vector Evaluator encountered a context window error Error agent 18m ago":
      - text: Vector Evaluator encountered a context window error Error agent
      - time: 18m ago
    - button "Hallucination benchmark finished with 42 cases Success evaluation 27m ago":
      - text: Hallucination benchmark finished with 42 cases Success evaluation
      - time: 27m ago
    - button "Sentry Reviewer completed a policy review Success agent 39m ago":
      - text: Sentry Reviewer completed a policy review Success agent
      - time: 39m ago
    - button "Code migration prompt was revised Info prompt 51m ago":
      - text: Code migration prompt was revised Info prompt
      - time: 51m ago
    - button "Tool-use evaluation finished at 91.8% Success evaluation 1h ago":
      - text: Tool-use evaluation finished at 91.8% Success evaluation
      - time: 1h ago
    - button "Orbit Context Mapper connected to the workspace Info agent 1h ago":
      - text: Orbit Context Mapper connected to the workspace Info agent
      - time: 1h ago
    - button "Retrieval grounding prompt was created Success prompt 2h ago":
      - text: Retrieval grounding prompt was created Success prompt
      - time: 2h ago
    - button "Monthly evaluation cost checkpoint completed Info evaluation 3h ago":
      - text: Monthly evaluation cost checkpoint completed Info evaluation
      - time: 3h ago
    - button "Nova Refactor completed step Analyze repository context Success agent 5h ago":
      - text: Nova Refactor completed step Analyze repository context Success agent
      - time: 5h ago
    - button "Incident response prompt was archived Info prompt 7h ago":
      - text: Incident response prompt was archived Info prompt
      - time: 7h ago
    - button "Agent handoff benchmark reported one error Error evaluation 10h ago":
      - text: Agent handoff benchmark reported one error Error evaluation
      - time: 10h ago
```

# Test source

```ts
  1   | // ==== END CANONICAL REGION — add task-specific criterion tests below. ====
  2   | import { test, expect } from '@playwright/test';
  3   |
  4   | test.describe('Command Center E2E', () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await page.goto('http://localhost:3000');
  7   |     await page.waitForLoadState('networkidle');
  8   |   });
  9   |
  10  |   // 1. Accessibility
  11  |   test('1.1 keyboard_reaches_primary_controls', async ({ page }) => {
  12  |     await page.keyboard.press('Tab');
  13  |     const focused = page.locator('*:focus');
  14  |     await expect(focused).not.toBeNull();
  15  |   });
  16  |
  17  |   test('1.2 visible_focus_indicators', async ({ page }) => {
  18  |     await page.keyboard.press('Tab');
  19  |     const focused = page.locator('*:focus');
  20  |     await expect(focused).not.toBeNull();
  21  |     const outline = await focused.evaluate(el => window.getComputedStyle(el).outlineStyle);
  22  |     expect(outline).not.toBe('none');
  23  |   });
  24  |
  25  |   test('1.3 dialogs_trap_focus_and_escape', async ({ page }) => {
  26  |     await page.getByRole('button', { name: /Connect agent/i }).first().click();
  27  |     const dialog = page.getByRole('dialog');
  28  |     await expect(dialog).toBeVisible();
  29  |     await page.keyboard.press('Escape');
  30  |     await expect(dialog).not.toBeVisible();
  31  |   });
  32  |
  33  |   test('1.4 night_popover_escape_returns_focus', async ({ page }) => {
  34  |     const trigger = page.locator('header button').last();
  35  |     await trigger.click();
  36  |     await page.keyboard.press('Escape');
  37  |     await expect(trigger).toBeFocused();
  38  |   });
  39  |
  40  |   test('1.5 validation_associated_with_fields', async ({ page }) => {
  41  |     await page.getByRole('button', { name: /Connect agent/i }).first().click();
  42  |     await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();
  43  |     await expect(page.locator('[aria-invalid="true"]').first()).toBeVisible();
  44  |   });
  45  |
  46  |   test('1.6 status_not_color_only', async ({ page }) => {
  47  |     const status = page.locator('[class*="status"], [class*="chip"]').first();
  48  |     await expect(status).toHaveText(/[a-zA-Z]+/);
  49  |   });
  50  |
  51  |   test('1.7 aria_live_announces_mutations', async ({ page }) => {
  52  |     await expect(page.locator('[aria-live]').first()).toBeAttached();
  53  |   });
  54  |
  55  |   test('1.8 labels_on_form_controls', async ({ page }) => {
  56  |     await page.getByRole('button', { name: /Connect agent/i }).first().click();
  57  |     const input = page.locator('input').first();
  58  |     const hasLabel = await input.evaluate(el => el.hasAttribute('id') || el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby'));
  59  |     expect(hasLabel).toBe(true);
  60  |   });
  61  |
  62  |   test('1.9 checkbox_and_bulk_actions_labeled', async ({ page }) => {
  63  |     const checkbox = page.locator('input[type="checkbox"]').first();
  64  |     const hasLabel = await checkbox.evaluate(el => el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby') || el.hasAttribute('id'));
  65  |     expect(hasLabel).toBe(true);
  66  |   });
  67  |
  68  |   test('1.10 export_tabs_are_keyboard_operable', async ({ page }) => {
  69  |     await page.getByRole('button', { name: /Export/i }).click();
  70  |     await expect(page.getByRole('tablist')).toBeVisible();
  71  |     await expect(page.getByRole('tab')).toHaveCount(2);
  72  |   });
  73  |
  74  |   test('1.11 rename_and_disconnect_agent', async ({ page }) => {
  75  |     await page.locator('table tbody tr [aria-haspopup="true"], table tbody tr [aria-label*="menu"]').first().click();
  76  |     await expect(page.getByRole('menuitem', { name: /Rename/i })).toBeVisible();
  77  |     await expect(page.getByRole('menuitem', { name: /Disconnect/i })).toBeVisible();
  78  |   });
  79  |
  80  |   test('1.12 feed_newest_first_capped_50', async ({ page }) => {
> 81  |     await expect(page.locator('ul li, [role="listitem"]').first()).toBeVisible();
      |                                                                    ^ Error: expect(locator).toBeVisible() failed
  82  |     const count = await page.locator('ul li, [role="listitem"]').count();
  83  |     expect(count).toBeGreaterThanOrEqual(12);
  84  |     expect(count).toBeLessThanOrEqual(50);
  85  |   });
  86  |
  87  |   test('1.13 feed_item_opens_related_resource', async ({ page }) => {
  88  |     await page.locator('.feed-item button, [role="listitem"] button, ul li button').first().click();
  89  |     await expect(page.locator('*:focus')).not.toBeNull();
  90  |   });
  91  |
  92  |   test('1.14 feed_filter_chips_and_clear', async ({ page }) => {
  93  |     await page.getByRole('button', { name: /Error/i }).first().click();
  94  |     await expect(page.getByRole('button', { name: /Clear/i })).toBeVisible();
  95  |   });
  96  |
  97  |   test('1.15 simulate_activity_appends_event', async ({ page }) => {
  98  |     const initial = await page.locator('ul li, [role="listitem"]').count();
  99  |     await page.getByRole('button', { name: /Simulate activity/i }).click();
  100 |     const updated = await page.locator('ul li, [role="listitem"]').count();
  101 |     expect(updated).toBeGreaterThan(initial);
  102 |   });
  103 |
  104 |   test('1.16 feed_autofollow_and_jump_to_latest', async ({ page }) => {
  105 |     await page.getByRole('button', { name: /Simulate activity/i }).click();
  106 |     await expect(page.locator('ul li, [role="listitem"]').first()).toBeVisible();
  107 |   });
  108 |
  109 |   test('1.17 suggestion_chips_apply_named_filter', async ({ page }) => {
  110 |     await page.keyboard.press('Meta+k');
  111 |     const palette = page.getByRole('dialog');
  112 |     await expect(palette).toBeVisible();
  113 |     await palette.locator('button').first().click();
  114 |     await expect(palette).not.toBeVisible();
  115 |   });
  116 |
  117 |   test('1.18 night_mode_badge_schedule_form', async ({ page }) => {
  118 |     await page.locator('header button').last().click();
  119 |     await expect(page.locator('text=/night/i').first()).toBeVisible();
  120 |   });
  121 |
  122 |   test('1.19 long_agent_name_truncation', async ({ page }) => {
  123 |     await expect(page.locator('table tbody tr').first()).toBeVisible();
  124 |   });
  125 |
  126 |   test('1.20 bulk_disconnect_selected_agents', async ({ page }) => {
  127 |     await page.locator('input[type="checkbox"]').nth(1).click({ force: true });
  128 |     await page.locator('input[type="checkbox"]').nth(2).click({ force: true });
  129 |     await expect(page.getByRole('button', { name: /Disconnect selected/i })).toBeVisible();
  130 |   });
  131 |
  132 |   test('1.21 command_palette_runs_named_commands', async ({ page }) => {
  133 |     await page.keyboard.press('Meta+k');
  134 |     await expect(page.getByRole('dialog')).toBeVisible();
  135 |   });
  136 |
  137 |   test('1.22 undo_redo_agent_mutations', async ({ page }) => {
  138 |     await page.getByRole('button', { name: /Connect agent/i }).first().click();
  139 |     await page.locator('input#agent-name, input[name="name"], input[placeholder*="name" i]').first().fill('Mutate Agent');
  140 |     await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();
  141 |
  142 |     await page.getByRole('button', { name: /Undo/i }).click();
  143 |     await expect(page.getByRole('button', { name: /Redo/i })).toBeEnabled();
  144 |   });
  145 |
  146 |   test('1.23 session_export_json_and_agents_csv', async ({ page }) => {
  147 |     await page.getByRole('button', { name: /Export/i }).click();
  148 |     await expect(page.getByRole('tab', { name: /JSON/i })).toBeVisible();
  149 |     await expect(page.getByRole('tab', { name: /CSV/i })).toBeVisible();
  150 |   });
  151 |
  152 |   test('1.24 export_reflects_session_mutations', async ({ page }) => {
  153 |     await page.getByRole('button', { name: /Connect agent/i }).first().click();
  154 |     await page.locator('input#agent-name, input[name="name"], input[placeholder*="name" i]').first().fill('Export Mutation');
  155 |     await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();
  156 |
  157 |     await page.keyboard.press('Escape');
  158 |     await page.getByRole('button', { name: /Export/i }).click({ force: true });
  159 |     await expect(page.locator('pre, code').first()).toContainText('Export Mutation');
  160 |   });
  161 |
  162 |   test('1.25 export_copy_download_and_import_roundtrip', async ({ page }) => {
  163 |     await page.getByRole('button', { name: /Export/i }).click();
  164 |     await expect(page.getByRole('button', { name: /Copy/i })).toBeVisible();
  165 |     await expect(page.getByRole('button', { name: /Download/i })).toBeVisible();
  166 |   });
  167 |
  168 |   // 4. Motion
  169 |   test('4.8 reduced_motion_fallback', async ({ page }) => {
  170 |     await page.emulateMedia({ reducedMotion: 'reduce' });
  171 |     await page.goto('http://localhost:3000');
  172 |     await page.getByRole('button', { name: /Connect agent/i }).first().click();
  173 |     const dialog = page.getByRole('dialog');
  174 |     await expect(dialog).toBeVisible();
  175 |     const transitionDuration = await dialog.evaluate((el) => window.getComputedStyle(el).transitionDuration);
  176 |     expect(parseFloat(transitionDuration) || 0).toBeLessThan(0.1);
  177 |   });
  178 |
  179 |   // 5. Core
  180 |   test('5.1 serves_clean_and_interactive_fast', async ({ page }) => {
  181 |     await expect(page.locator('body')).toBeVisible();
```