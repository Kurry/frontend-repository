# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.mjs >> 135 Criteria E2E Test Suite >> 1.4 feedback_uses_live_regions
- Location: e2e.spec.mjs:10:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('#import-json-error')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('#import-json-error')

```

```yaml
- banner:
  - img
  - text: Traceframe Review workbench 3 seeded tasks
  - button "Open command palette":
    - img
    - text: Commands ⌘K
- main:
  - navigation "Breadcrumb":
    - button "Tasks"
    - img
    - button "Lantern log parser"
    - img
    - text: Fernhollow-2
  - button "Undo adjudication mutation" [disabled]:
    - img
    - text: Undo
  - button "Redo adjudication mutation" [disabled]:
    - img
    - text: Redo
  - button "Toggle verdict and timeline density":
    - img
    - text: Comfortable density
  - button "Keyboard cheatsheet":
    - img
    - text: Keyboard cheatsheet
  - button "Import review package":
    - img
    - text: Import review package
  - button "Export review package":
    - img
    - text: Export review package
  - text: task-lantern-parse-trial-1 None
  - heading "Fernhollow-2 on Lantern log parser" [level=1]
  - text: Reward 0.66 Duration 8m 12s Scorer Gossamer rubric engine
  - region "agent trajectory":
    - img
    - heading "Agent trajectory" [level=2]
    - text: Focused 1 / 13
    - listbox "agent trajectory steps":
      - option "01 Map the requested behavior I will trace the request against the existing structure before editing. Trial seed 1-1 needs a narrow, verifiable change." [selected]:
        - img
        - text: 01 Map the requested behavior I will trace the request against the existing structure before editing. Trial seed 1-1 needs a narrow, verifiable change.
      - option "02 Inspect the workspace Inspect the workspace while keeping the benchmark contract and neighboring files intact.":
        - img
        - text: 02 Inspect the workspace Inspect the workspace while keeping the benchmark contract and neighboring files intact.
      - option "03 Identify the integration seam Identify the integration seam while keeping the benchmark contract and neighboring files intact.":
        - img
        - text: 03 Identify the integration seam Identify the integration seam while keeping the benchmark contract and neighboring files intact.
      - option "04 Run the baseline checks Run the baseline checks while keeping the benchmark contract and neighboring files intact.":
        - img
        - text: 04 Run the baseline checks Run the baseline checks while keeping the benchmark contract and neighboring files intact.
      - option "05 Choose a minimal implementation Choose a minimal implementation while keeping the benchmark contract and neighboring files intact.":
        - img
        - text: 05 Choose a minimal implementation Choose a minimal implementation while keeping the benchmark contract and neighboring files intact.
      - option "06 Write the signal pipeline Write the signal pipeline while keeping the benchmark contract and neighboring files intact.":
        - img
        - text: 06 Write the signal pipeline Write the signal pipeline while keeping the benchmark contract and neighboring files intact.
      - option "07 Inspect the rendered preview Inspect the rendered preview while keeping the benchmark contract and neighboring files intact.":
        - img
        - text: 07 Inspect the rendered preview Inspect the rendered preview while keeping the benchmark contract and neighboring files intact.
      - option "08 Review the changed surface Review the changed surface while keeping the benchmark contract and neighboring files intact.":
        - img
        - text: 08 Review the changed surface Review the changed surface while keeping the benchmark contract and neighboring files intact.
      - option "09 Exercise focused verification Exercise focused verification while keeping the benchmark contract and neighboring files intact.":
        - img
        - text: 09 Exercise focused verification Exercise focused verification while keeping the benchmark contract and neighboring files intact.
      - option "10 Tighten the failure path Tighten the failure path while keeping the benchmark contract and neighboring files intact.":
        - img
        - text: 10 Tighten the failure path Tighten the failure path while keeping the benchmark contract and neighboring files intact.
      - option "11 Audit the final diff Audit the final diff while keeping the benchmark contract and neighboring files intact.":
        - img
        - text: 11 Audit the final diff Audit the final diff while keeping the benchmark contract and neighboring files intact.
      - option "12 Run the full check suite Run the full check suite while keeping the benchmark contract and neighboring files intact.":
        - img
        - text: 12 Run the full check suite Run the full check suite while keeping the benchmark contract and neighboring files intact.
      - option "13 Summarize the result Summarize the result while keeping the benchmark contract and neighboring files intact.":
        - img
        - text: 13 Summarize the result Summarize the result while keeping the benchmark contract and neighboring files intact.
    - text: agent step 01
    - heading "Map the requested behavior" [level=3]
    - text: reasoning
    - paragraph: I will trace the request against the existing structure before editing. Trial seed 1-1 needs a narrow, verifiable change.
    - button "Reasoning region Expand":
      - img
      - text: Reasoning region Expand
    - paragraph: The active constraint at this point is to preserve the surrounding workspace while proving the requested behavior. I am checking assumptions before advancing from step 0.
    - text: Evolving file tree
    - button "assets/preview.svg":
      - img
      - text: assets/preview.svg
    - button "fixtures/results.csv":
      - img
      - text: fixtures/results.csv
    - button "README.md":
      - img
      - text: README.md
    - button "src/index.ts":
      - img
      - text: src/index.ts
    - button "src/pipeline.ts":
      - img
      - text: src/pipeline.ts
    - text: assets/preview.svg
    - img "Generated verification preview from the active file"
  - region "scorer trajectory":
    - img
    - heading "Scorer trajectory" [level=2]
    - text: 1 / 8
    - listbox "scorer trajectory steps":
      - option "01 Load trial artifacts Load trial artifacts for evidence set 1-1.0. The inspection is mapped to explicit rubric criteria." [selected]:
        - img
        - text: 01 Load trial artifacts Load trial artifacts for evidence set 1-1.0. The inspection is mapped to explicit rubric criteria.
      - option "02 Check required behavior Check required behavior for evidence set 1-1.1. The inspection is mapped to explicit rubric criteria.":
        - img
        - text: 02 Check required behavior Check required behavior for evidence set 1-1.1. The inspection is mapped to explicit rubric criteria.
      - option "03 Inspect implementation seam Inspect implementation seam for evidence set 1-1.2. The inspection is mapped to explicit rubric criteria.":
        - img
        - text: 03 Inspect implementation seam Inspect implementation seam for evidence set 1-1.2. The inspection is mapped to explicit rubric criteria.
      - option "04 Exercise edge case Exercise edge case for evidence set 1-1.3. The inspection is mapped to explicit rubric criteria.":
        - img
        - text: 04 Exercise edge case Exercise edge case for evidence set 1-1.3. The inspection is mapped to explicit rubric criteria.
      - option "05 Review regression proof Review regression proof for evidence set 1-1.4. The inspection is mapped to explicit rubric criteria.":
        - img
        - text: 05 Review regression proof Review regression proof for evidence set 1-1.4. The inspection is mapped to explicit rubric criteria.
      - option "06 Inspect visual evidence Inspect visual evidence for evidence set 1-1.5. The inspection is mapped to explicit rubric criteria.":
        - img
        - text: 06 Inspect visual evidence Inspect visual evidence for evidence set 1-1.5. The inspection is mapped to explicit rubric criteria.
      - option "07 Audit workspace scope Audit workspace scope for evidence set 1-1.6. The inspection is mapped to explicit rubric criteria.":
        - img
        - text: 07 Audit workspace scope Audit workspace scope for evidence set 1-1.6. The inspection is mapped to explicit rubric criteria.
      - option "08 Synthesize verdicts Synthesize verdicts for evidence set 1-1.7. The inspection is mapped to explicit rubric criteria.":
        - img
        - text: 08 Synthesize verdicts Synthesize verdicts for evidence set 1-1.7. The inspection is mapped to explicit rubric criteria.
    - text: scorer step 01
    - heading "Load trial artifacts" [level=3]
    - text: tool-call
    - paragraph: Load trial artifacts for evidence set 1-1.0. The inspection is mapped to explicit rubric criteria.
    - button "Reasoning region Expand":
      - img
      - text: Reasoning region Expand
    - paragraph: Evidence is considered sufficient only when the artifact and observed behavior agree. This inspection step keeps that distinction explicit.
    - button "artifact.open complete":
      - img
      - text: artifact.open complete
    - term: Input summary
    - definition: trial bundle
    - term: Output
    - definition: Inspection 0 completed with structured evidence.
    - img "scorer trajectory step 1 inspection screenshot frame":
      - img
      - text: Captured inspection frame Visual evidence · 1280 × 720
  - img
  - heading "Verdict register" [level=2]
  - paragraph: Weighted decisions linked to scorer and agent evidence.
  - text: Active scoring label
  - button "Primary pass Active scoring label Active scoring label":
    - text: Primary pass
    - img
  - text: Intent 56% Craft 71% Proof 67% Stewardship 71%
  - img
  - text: "Compare labels Delta: second minus first First label"
  - button "Primary pass First label First label":
    - text: Primary pass
    - img
  - img
  - text: Second label
  - button "Evidence rescore Second label Second label":
    - text: Evidence rescore
    - img
  - text: Intent -34 Craft 0 Proof +33 Stewardship 0 Total 0
  - img
  - heading "Adjudication summary" [level=3]
  - text: 0 recorded 0 agent-bug 0 rubric-bug 0 scorer-error
  - paragraph: No adjudications recorded yet. Open Adjudicate criterion on a flipped or failed row to classify it as agent-bug, rubric-bug, or scorer-error.
  - img
  - text: Review activity
  - paragraph: Mutations appear here with timestamps after you adjudicate, import, undo, or redo.
  - text: Comparison filter 2 flipped criteria
  - button "Flips only" [pressed]:
    - img
    - text: Flips only
  - paragraph: When enabled, check flipped rows to apply one classification in bulk.
  - heading "Intent fidelity" [level=3]
  - text: 1 criteria
  - table "Intent fidelity verdicts":
    - rowgroup:
      - row "Pick Criterion Weight Verdict Scorer reasoning Evidence Review":
        - columnheader "Pick"
        - columnheader "Criterion"
        - columnheader "Weight"
        - columnheader "Verdict"
        - columnheader "Scorer reasoning"
        - columnheader "Evidence"
        - columnheader "Review"
    - rowgroup:
      - button "Select criterion INT-02 Interaction matches the request":
        - cell "Select INT-02 for bulk adjudication":
          - checkbox "Select INT-02 for bulk adjudication" [checked]
        - cell "INT-02 Flipped Interaction matches the request"
        - cell "3"
        - cell "Yes":
          - img
          - text: "Yes"
        - cell "Evidence confirms “interaction matches the request” across the inspected artifact and the targeted scenario.":
          - paragraph: Evidence confirms “interaction matches the request” across the inspected artifact and the targeted scenario.
        - cell "Scorer 2":
          - button "Scorer 2":
            - text: Scorer 2
            - img
        - cell "Adjudicate criterion":
          - button "Adjudicate criterion"
  - heading "Verification depth" [level=3]
  - text: 1 criteria
  - table "Verification depth verdicts":
    - rowgroup:
      - row "Pick Criterion Weight Verdict Scorer reasoning Evidence Review":
        - columnheader "Pick"
        - columnheader "Criterion"
        - columnheader "Weight"
        - columnheader "Verdict"
        - columnheader "Scorer reasoning"
        - columnheader "Evidence"
        - columnheader "Review"
    - rowgroup:
      - button "Select criterion PRF-02 Regression coverage is credible":
        - cell "Select PRF-02 for bulk adjudication":
          - checkbox "Select PRF-02 for bulk adjudication"
        - cell "PRF-02 Flipped Regression coverage is credible"
        - cell "3"
        - cell "No":
          - img
          - text: "No"
        - cell "The inspection found a material gap in “regression coverage is credible”; the observed behavior diverges from the requested contract in the linked evidence.":
          - paragraph: The inspection found a material gap in “regression coverage is credible”; the observed behavior diverges from the requested contract in the linked evidence.
        - cell "Scorer 8":
          - button "Scorer 8":
            - text: Scorer 8
            - img
        - cell "Adjudicate criterion":
          - button "Adjudicate criterion"
  - text: 1 flipped criteria selected
  - button "Clear selection"
  - text: Classification
  - button "Select an item classification Classification":
    - text: Select an item
    - img
  - alert: "classification: classification must be selected"
  - text: Shared rationale
  - textbox "Shared rationale" [invalid]:
    - /placeholder: Explain the selected criteria (20–2000 characters).
  - alert: "rationale: rationale must be at least 20 characters"
  - button "Apply classification to selected"
- button "Dismiss"
- dialog "Import review package":
  - img
  - text: Review package
  - heading "Import review package" [level=2]
  - paragraph: Paste one review-package/v1 JSON object for this open trial.
  - button "Close import surface":
    - img
  - text: Review Package JSON
  - textbox "Review Package JSON":
    - /placeholder: "{\n  \"schemaVersion\": \"review-package/v1\",\n  ...\n}"
  - alert: "document: Review Package JSON is required"
  - button "Cancel"
  - button "Import review package"
```

# Test source

```ts
  1   | // ==== END CANONICAL REGION — add task-specific criterion tests below. ====
  2   | import { test, expect } from '@playwright/test';
  3   |
  4   | test.describe('135 Criteria E2E Test Suite', () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await page.setViewportSize({ width: 1280, height: 800 });
  7   |     await page.goto('/');
  8   |   });
  9   |
  10  |   test('1.4 feedback_uses_live_regions', async ({ page }) => {
  11  |     // 1. Export copy confirmation
  12  |     // Click the first task in the list
  13  |     await page.click('button[aria-label^="Open task"]');
  14  |     await expect(page.locator('text=Trial register')).toBeVisible();
  15  |
  16  |     // Click the first trial in the list
  17  |     await page.locator('tr[aria-label^="Open review workspace"]').first().click();
  18  |     await expect(page.locator('h2:has-text("Verdict register")').first()).toBeVisible();
  19  |
  20  |     await page.click('text=Export review package');
  21  |
  22  |     // Check export copy
  23  |     await page.click('button:has-text("Copy")');
  24  |     const copyNotice = page.locator('[role="status"][aria-live="polite"]');
  25  |     await expect(copyNotice).toBeVisible();
  26  |     await expect(copyNotice).toContainText('copied to clipboard');
  27  |
  28  |     await page.click('button[aria-label="Close export drawer"]');
  29  |
  30  |     // 2. Validation errors (Bulk Apply)
  31  |     // The tour might be open, let's close it first if it exists
  32  |     await page.locator('button:has-text("Dismiss tour")').click().catch(() => {});
  33  |     await page.click('button:has-text("Flips only")');
  34  |     const checkboxes = page.locator('input[type="checkbox"]');
  35  |     await checkboxes.nth(0).click();
  36  |     await page.click('text=Apply classification to selected');
  37  |
  38  |     // Check classification error
  39  |     const classificationError = page.locator('#bulk-classification-error');
  40  |     await expect(classificationError).toBeVisible();
  41  |     const classificationSelect = page.locator('button[aria-label="classification"]');
  42  |     // React-aria Select triggers don't keep aria-invalid effectively.
  43  |     // Wait, the new rule is we test ONLY `aria-describedby` for select, and `aria-invalid` for others.
  44  |     await expect(classificationSelect).toHaveAttribute('aria-describedby', 'bulk-classification-error');
  45  |
  46  |     // Check rationale error
  47  |     const rationaleError = page.locator('#bulk-rationale-error');
  48  |     await expect(rationaleError).toBeVisible();
  49  |     const rationaleInput = page.locator('input[placeholder*="Explain the selected criteria"]');
  50  |     await expect(rationaleInput).toHaveAttribute('aria-invalid', 'true');
  51  |     await expect(rationaleInput).toHaveAttribute('aria-describedby', 'bulk-rationale-error');
  52  |
  53  |     // 3. Validation errors (Import)
  54  |     await page.click('button:has-text("Import review package")');
  55  |     // Clear first to trigger required error
  56  |     await page.fill('textarea[name="json"]', '');
  57  |     await page.click('button[type="submit"]:has-text("Import review package")');
  58  |
  59  |     const importJsonError = page.locator('#import-json-error');
> 60  |     await expect(importJsonError).toBeVisible();
      |                                   ^ Error: expect(locator).toBeVisible() failed
  61  |     const jsonTextarea = page.locator('textarea[name="json"]');
  62  |     await expect(jsonTextarea).toHaveAttribute('aria-invalid', 'true');
  63  |     await expect(jsonTextarea).toHaveAttribute('aria-describedby', 'import-json-error');
  64  |
  65  |     // also check JSON parse error
  66  |     await page.fill('textarea[name="json"]', '{ invalid json }');
  67  |     await page.click('button[type="submit"]:has-text("Import review package")');
  68  |     await expect(page.locator('text=Import validation failed')).toBeVisible();
  69  |
  70  |     // Check successful import
  71  |     const validJson = JSON.stringify({
  72  |       schemaVersion: "review-package/v1",
  73  |       exportedAt: new Date().toISOString(),
  74  |       taskId: "28e7cd18-49d7-4660-84a5-93c6628fcb97",
  75  |       trialId: "4b82d3f9-671c-438a-8e24-95b7194f280a",
  76  |       model: "claude-3-5-sonnet",
  77  |       activeLabel: "v2-run",
  78  |       comparedLabels: ["v1-run", "v2-run"],
  79  |       dimensionRollup: {
  80  |         "core_features": { "score": 1, "weight": 2 },
  81  |         "edge_cases": { "score": 1, "weight": 1 },
  82  |         "visual_design": { "score": 1, "weight": 1 },
  83  |         "performance": { "score": 1, "weight": 1 }
  84  |       },
  85  |       adjudications: [
  86  |         {
  87  |           criterionId: "1.2",
  88  |           classification: "agent-bug",
  89  |           rationale: "This is a valid rationale for testing.",
  90  |           reviewedAt: new Date().toISOString(),
  91  |           evidenceStepIds: []
  92  |         }
  93  |       ],
  94  |       summaryCounts: {
  95  |         "agent-bug": 1,
  96  |         "rubric-bug": 0,
  97  |         "scorer-error": 0
  98  |       },
  99  |       flipCriterionIds: ["1.2"]
  100 |     });
  101 |
  102 |     await page.fill('textarea[name="json"]', validJson);
  103 |     await page.click('button[type="submit"]:has-text("Import review package")');
  104 |
  105 |     const globalAnnouncement = page.locator('div[aria-live="polite"] span');
  106 |     await expect(globalAnnouncement).toContainText('Imported 1 adjudications successfully');
  107 |   });
  108 | });
  109 |
```