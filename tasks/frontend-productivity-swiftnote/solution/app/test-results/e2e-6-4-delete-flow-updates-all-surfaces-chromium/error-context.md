# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.mjs >> 6.4 delete_flow_updates_all_surfaces
- Location: e2e.spec.mjs:33:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('app-sidebar')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('app-sidebar')

```

```yaml
- banner:
  - text: AI prompt engineering workspace
  - heading "PromptOps Execution Board" [level=1]
  - text: 12 cards Live session
- main:
  - region "Board toolbar":
    - text: Assignee
    - combobox "Assignee":
      - option "All assignees" [selected]
      - option "Maya Chen"
      - option "Omar Farouk"
      - option "Lin Park"
      - option "Inez Silva"
    - search "Search cards by title":
      - text: Search cards by title
      - searchbox "Search cards by title"
    - button "Clear filters" [disabled]
    - button "Undo (Ctrl+Z)" [disabled]
    - button "Redo (Ctrl+Shift+Z)" [disabled]
    - button "Export"
  - region "Board activity":
    - strong: 28%
    - text: of 47 task items complete
    - strong: "0"
    - text: runs completed this session All columns within WIP limits
  - region "Backlog":
    - heading "Backlog" [level=2]
    - text: "4"
    - button "Add Card to Backlog"
    - button "Open Calibrate customer support tone across escalation tiers":
      - checkbox "Select Calibrate customer support tone across escalation tiers"
      - text: Select Calibrate customer support tone across escalation tiers pending
      - button "Move Calibrate customer support tone across escalation tiers":
        - img "Move Calibrate customer support tone across escalation tiers"
      - heading "Calibrate customer support tone across escalation tiers" [level=3]
      - paragraph: Build a tone rubric and compare generated responses for standard, elevated, and critical support cases.
      - button "Calibrate customer tone"
      - text: Draft tone rubric Assemble example tickets Score baseline responses Document acceptance range Progress
      - strong: 0 of 4
      - button "Run"
    - button "Open Expand adversarial safety evaluation suite":
      - checkbox "Select Expand adversarial safety evaluation suite"
      - text: Select Expand adversarial safety evaluation suite pending
      - button "Move Expand adversarial safety evaluation suite":
        - img "Move Expand adversarial safety evaluation suite"
      - heading "Expand adversarial safety evaluation suite" [level=3]
      - paragraph: Add refusal-boundary and prompt-injection cases to the evaluation harness.
      - button "Adversarial safety probe"
      - text: Map policy areas Author attack prompts Add expected outcomes Run baseline model Review false positives Progress
      - strong: 0 of 5
      - button "Run"
    - button "Open Tune long-context synthesis prompt":
      - checkbox "Select Tune long-context synthesis prompt"
      - text: Select Tune long-context synthesis prompt pending
      - button "Move Tune long-context synthesis prompt":
        - img "Move Tune long-context synthesis prompt"
      - heading "Tune long-context synthesis prompt" [level=3]
      - paragraph: Improve factual traceability when source material exceeds 40k tokens.
      - button "Long-context synthesis"
      - text: Select source corpus Define citation format Compare synthesis quality Progress
      - strong: 0 of 3
      - button "Run"
    - button "Open Benchmark multilingual intent classifier":
      - checkbox "Select Benchmark multilingual intent classifier"
      - text: Select Benchmark multilingual intent classifier pending
      - button "Move Benchmark multilingual intent classifier":
        - img "Move Benchmark multilingual intent classifier"
      - heading "Benchmark multilingual intent classifier" [level=3]
      - paragraph: Measure intent accuracy for Spanish, French, German, and Japanese inputs.
      - text: Prepare translated set Run classification batch Review low-confidence cases Publish scorecard Progress
      - strong: 0 of 4
      - button "Run"
    - button "Add Card"
  - region "In Progress":
    - heading "In Progress" [level=2]
    - text: 3 WIP limit 3
    - button "Add Card to In Progress"
    - button "Open Harden support triage agent against ambiguous requests":
      - checkbox "Select Harden support triage agent against ambiguous requests"
      - text: Select Harden support triage agent against ambiguous requests pending
      - button "Move Harden support triage agent against ambiguous requests":
        - img "Move Harden support triage agent against ambiguous requests"
      - heading "Harden support triage agent against ambiguous requests" [level=3]
      - paragraph: "Exercise routing behavior when product area and customer impact are unclear. The routing check is flaky by design: it fails on its first two attempts and recovers on the third."
      - button "Support issue triage"
      - text: Normalize ticket samples Infer product routing Validate urgency labels Check escalation notes Compile findings Progress
      - strong: 0 of 5
      - button "Run"
    - button "Open Evaluate guarded SQL generation":
      - checkbox "Select Evaluate guarded SQL generation"
      - text: Select Evaluate guarded SQL generation pending
      - button "Move Evaluate guarded SQL generation":
        - img "Move Evaluate guarded SQL generation"
      - heading "Evaluate guarded SQL generation" [level=3]
      - paragraph: Validate schema adherence, read-only safety, and usefulness of generated queries.
      - button "Guarded SQL generation"
      - text: Load schema fixtures Generate query batch Check safety constraints Summarize execution accuracy Progress
      - strong: 0 of 4
      - button "Run"
    - button "Open Measure retrieval grounding quality":
      - checkbox "Select Measure retrieval grounding quality"
      - text: Select Measure retrieval grounding quality pending
      - button "Move Measure retrieval grounding quality":
        - img "Move Measure retrieval grounding quality"
      - heading "Measure retrieval grounding quality" [level=3]
      - paragraph: Quantify citation accuracy and unsupported claims across retrieval conditions.
      - button "Long-context synthesis"
      - text: Index evaluation corpus Run retrieval matrix Audit claim citations Progress
      - strong: 0 of 3
      - button "Run"
    - button "Add Card"
  - region "Review":
    - heading "Review" [level=2]
    - text: 3 WIP limit 3
    - button "Add Card to Review"
    - button "Open Review onboarding email sequence generator":
      - checkbox "Select Review onboarding email sequence generator"
      - text: Select Review onboarding email sequence generator pending
      - button "Move Review onboarding email sequence generator":
        - img "Move Review onboarding email sequence generator"
      - heading "Review onboarding email sequence generator" [level=3]
      - paragraph: Review sequence coherence and product-language compliance before release.
      - text: Check narrative arc Verify product claims Review calls to action Approve release notes Progress
      - strong: 2 of 4
      - button "Run"
    - button "Open Validate policy extraction workflow":
      - checkbox "Select Validate policy extraction workflow"
      - text: Select Validate policy extraction workflow pending
      - button "Move Validate policy extraction workflow":
        - img "Move Validate policy extraction workflow"
      - heading "Validate policy extraction workflow" [level=3]
      - paragraph: Check structured policy fields against a manually annotated reference set.
      - button "Long-context synthesis"
      - text: Sample policy documents Compare extracted clauses Resolve review notes Progress
      - strong: 1 of 3
      - button "Run"
    - button "Open QA meeting action-item miner":
      - checkbox "Select QA meeting action-item miner"
      - text: Select QA meeting action-item miner pending
      - button "Move QA meeting action-item miner":
        - img "Move QA meeting action-item miner"
      - heading "QA meeting action-item miner" [level=3]
      - paragraph: Verify owner, due date, and dependency extraction across meeting styles.
      - text: Collect transcripts Run extraction set Check owner attribution Check date parsing Triage misses Progress
      - strong: 3 of 5
      - button "Run"
    - button "Add Card"
  - region "Done":
    - heading "Done" [level=2]
    - text: "2"
    - button "Add Card to Done"
    - button "Open Ship incident report formatter":
      - checkbox "Select Ship incident report formatter"
      - text: Select Ship incident report formatter complete
      - button "Move Ship incident report formatter":
        - img "Move Ship incident report formatter"
      - heading "Ship incident report formatter" [level=3]
      - paragraph: Released formatter for concise timelines, impact summaries, and follow-up actions.
      - text: Define report schema Build prompt Test incident samples Publish template Progress
      - strong: 4 of 4
      - button "Run again"
    - button "Open Complete product taxonomy mapper":
      - checkbox "Select Complete product taxonomy mapper"
      - text: Select Complete product taxonomy mapper complete
      - button "Move Complete product taxonomy mapper":
        - img "Move Complete product taxonomy mapper"
      - heading "Complete product taxonomy mapper" [level=3]
      - paragraph: Mapped legacy labels to the current product taxonomy with confidence scores.
      - text: Load label catalog Generate mappings Review confidence outliers Progress
      - strong: 3 of 3
      - button "Run again"
    - button "Add Card"
  - status
- status: Board ready.
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   |
  3   | test('6.1 create_flow_updates_all_surfaces and 14.5 new_note_count_delta_exact', async ({ page }) => {
  4   |   await page.goto('/');
  5   |   await expect(page.locator('app-sidebar')).toBeVisible();
  6   |
  7   |   const getNoteCount = async () => page.locator('.notes-list-wrapper > *:not(.empty-state)').count();
  8   |   const initialCount = await getNoteCount();
  9   |
  10  |   await page.keyboard.press('Alt+n');
  11  |
  12  |   await expect(async () => {
  13  |       expect(await getNoteCount()).toBe(initialCount + 1);
  14  |   }).toPass();
  15  |
  16  |   const focused = page.locator(':focus');
  17  |   await expect(focused).toBeVisible();
  18  | });
  19  |
  20  | test('6.3 edit_flow_updates_related_displays', async ({ page }) => {
  21  |   await page.goto('/');
  22  |   await page.keyboard.press('Alt+n');
  23  |
  24  |   const editor = page.locator('.ProseMirror, [contenteditable="true"]').first();
  25  |   await expect(editor).toBeVisible();
  26  |
  27  |   await editor.fill('Edit flow test content');
  28  |
  29  |   const firstNoteInSidebar = page.locator('.notes-list-wrapper > *:not(.empty-state)').first();
  30  |   await expect(firstNoteInSidebar).toContainText('Edit flow test content');
  31  | });
  32  |
  33  | test('6.4 delete_flow_updates_all_surfaces', async ({ page }) => {
  34  |   await page.goto('/');
> 35  |   await expect(page.locator('app-sidebar')).toBeVisible();
      |                                             ^ Error: expect(locator).toBeVisible() failed
  36  |   await page.keyboard.press('Alt+n');
  37  |
  38  |   const getNoteCount = async () => page.locator('.notes-list-wrapper > *:not(.empty-state)').count();
  39  |
  40  |   await expect(async () => {
  41  |     expect(await getNoteCount()).toBeGreaterThan(0);
  42  |   }).toPass();
  43  |
  44  |   const countAfterCreate = await getNoteCount();
  45  |
  46  |   const deleteBtn = page.getByRole('button', { name: /delete/i }).first();
  47  |   await deleteBtn.click();
  48  |
  49  |   const confirmDialog = page.getByRole('dialog', { name: /confirm delete note/i });
  50  |   await expect(confirmDialog).toBeVisible();
  51  |   await confirmDialog.getByRole('button', { name: /^delete note$/i }).click();
  52  |
  53  |   await expect(async () => {
  54  |       expect(await getNoteCount()).toBe(countAfterCreate - 1);
  55  |   }).toPass();
  56  | });
  57  |
  58  | test('6.8 focus_mode_hides_and_restores_sidebar', async ({ page }) => {
  59  |   await page.goto('/');
  60  |   const sidebar = page.locator('app-sidebar');
  61  |   await expect(sidebar).toBeVisible();
  62  |
  63  |   await page.keyboard.press('Control+Shift+F');
  64  |
  65  |   await expect(async () => {
  66  |       const display = await sidebar.evaluate(el => getComputedStyle(el).display);
  67  |       const isHiddenClass = await sidebar.evaluate(el => el.classList.contains('hidden') || el.style.display === 'none');
  68  |       expect(display === 'none' || isHiddenClass || await sidebar.isHidden()).toBeTruthy();
  69  |   }).toPass();
  70  |
  71  |   await page.keyboard.press('Escape');
  72  |
  73  |   await expect(async () => {
  74  |       const display = await sidebar.evaluate(el => getComputedStyle(el).display);
  75  |       expect(display !== 'none').toBeTruthy();
  76  |   }).toPass();
  77  | });
  78  |
  79  | test('6.11 artifact_end_state_export_import and 14.9 workspace_export_import_pipeline', async ({ page }) => {
  80  |   await page.goto('/');
  81  |   await page.keyboard.press('Alt+n');
  82  |
  83  |   await page.waitForTimeout(100);
  84  |   await page.keyboard.type('Testing export import pipeline');
  85  |
  86  |   const editor = page.locator('.ProseMirror, [contenteditable="true"]').first();
  87  |   await expect(editor).toBeVisible();
  88  |
  89  |   const imageTag = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==" alt="test image">';
  90  |   const imageObj = {
  91  |       id: 'img-1',
  92  |       filename: 'test.png',
  93  |       dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
  94  |   };
  95  |
  96  |   const exportWsBtn = page.getByRole('button', { name: /export workspace/i });
  97  |   await exportWsBtn.click();
  98  |
  99  |   const jsonTextarea = page.locator('textarea, pre').first();
  100 |   const wsJson = await jsonTextarea.inputValue().catch(async () => await jsonTextarea.textContent());
  101 |
  102 |   await page.keyboard.press('Escape');
  103 |
  104 |   let parsed = JSON.parse(wsJson);
  105 |   parsed.notes[0].bodyHtml += imageTag;
  106 |   parsed.notes[0].images = [imageObj];
  107 |   parsed.notes[0].createdAt = new Date(parsed.notes[0].createdAt).toISOString();
  108 |   parsed.notes[0].updatedAt = new Date(parsed.notes[0].updatedAt).toISOString();
  109 |   parsed.notes[0].title = 'Modified via import';
  110 |
  111 |   const modifiedJson = JSON.stringify(parsed);
  112 |
  113 |   const importWsBtn = page.getByRole('button', { name: /import workspace/i });
  114 |   await importWsBtn.click();
  115 |
  116 |   const importTextarea = page.locator('textarea').filter({ state: 'visible' }).first();
  117 |   await importTextarea.fill(modifiedJson);
  118 |
  119 |   const confirmImport = page.getByRole('button', { name: /import/i }).last();
  120 |   await expect(confirmImport).toBeEnabled();
  121 |   await confirmImport.click();
  122 |
  123 |   await expect(async () => {
  124 |       const firstNoteInSidebar = page.locator('.notes-list-wrapper > *:not(.empty-state)').first();
  125 |       expect(await firstNoteInSidebar.textContent()).toContain('Modified via import');
  126 |   }).toPass({ timeout: 5000 });
  127 | });
  128 |
  129 | test('4.11 import_rejects_bad_workspace_json', async ({ page }) => {
  130 |   await page.goto('/');
  131 |
  132 |   const getNoteCount = async () => page.locator('.notes-list-wrapper > *:not(.empty-state)').count();
  133 |   const startCount = await getNoteCount();
  134 |
  135 |   const importWsBtn = page.getByRole('button', { name: /import workspace/i });
```