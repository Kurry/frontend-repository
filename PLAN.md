I will write deterministic e2e tests using Playwright for the `frontend-data-tracking-plausible-analytics` task.

### Pre-commit steps
Ensure proper testing, verification, review, and reflection are done.

### Steps:
1. **Setup test environment:**
   - Update `package.json` with `test:e2e:criteria` using Playwright.
   - Initialize `tasks/frontend-data-tracking-plausible-analytics/solution/app/e2e.spec.mjs` with the exact canonical marker `// ==== END CANONICAL REGION — add task-specific criterion tests below. ====`.

2. **Implement test groups:**
   - Group 1: Basic dashboard interactions (1.1 breakdown rows keyboard, 1.2 selectors keyboard, etc.)
   - Group 2: Dialogs and trapping (1.5 dialogs trap focus)
   - Group 3: Core flows (6.3 add site, 6.6 bounce ceiling, 6.7 compare previous)
   - Group 4: UI rendering and labels (15.3 export labels, 15.8 brand title)
   - Group N: Implement remaining UI assertions systematically to cover all criteria across 13 dimensions.

3. **Final verification & Commit:**
   - Run the tests, report pass/fail/skipped realistically, make sure the test output matches the assertions.
   - Complete pre-commit instructions.
   - Use the submit tool to finalize and open the PR.
