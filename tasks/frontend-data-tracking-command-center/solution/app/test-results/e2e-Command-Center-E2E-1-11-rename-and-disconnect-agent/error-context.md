# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.mjs >> Command Center E2E >> 1.11 rename_and_disconnect_agent
- Location: e2e.spec.mjs:74:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('table tbody tr [aria-haspopup="true"], table tbody tr [aria-label*="menu"]').first()

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - banner [ref=e5]:
    - generic [ref=e6]:
      - generic [ref=e11]:
        - strong [ref=e12]: PromptOps
        - generic [ref=e13]: Command center
      - generic [ref=e14]: Production
    - generic [ref=e16]:
      - generic "Seeded session" [ref=e17]:
        - img [ref=e18]
        - text: Seeded session
      - button "Compact rows" [ref=e20] [cursor=pointer]:
        - img [ref=e21]
        - generic [ref=e24]: Compact rows
      - button "Night mode disabled" [ref=e26] [cursor=pointer]:
        - img [ref=e27]
        - generic [ref=e29]: Night mode disabled
      - generic [ref=e30]:
        - generic [ref=e31]:
          - generic [ref=e32]:
            - button "Undo" [disabled]:
              - img
          - tooltip
        - generic [ref=e33]:
          - generic [ref=e34]:
            - button "Redo" [disabled]:
              - img
          - tooltip
      - button "Commands ⌘K" [ref=e35] [cursor=pointer]:
        - text: Commands
        - generic [ref=e36]: ⌘K
        - img [ref=e37]
      - button "Export session" [ref=e39] [cursor=pointer]:
        - text: Export session
        - img [ref=e40]
      - button "Connect agent" [ref=e44] [cursor=pointer]:
        - text: Connect agent
        - img [ref=e45]
  - generic [ref=e47]:
    - generic [ref=e48]:
      - generic [ref=e49]:
        - paragraph [ref=e50]: Monday, July 20 · Live workspace
        - heading "Good morning, operator." [level=1] [ref=e51]
        - paragraph [ref=e52]: Monitor prompt performance, coordinate coding agents, and preserve the session artifact.
      - generic [ref=e53]:
        - img [ref=e54]
        - text: All systems operational
    - region "Key performance indicators" [ref=e57]:
      - button "Open Total prompts detail" [ref=e59] [cursor=pointer]:
        - generic [ref=e60]:
          - img [ref=e62]
          - generic [ref=e66]: Total prompts
        - generic [ref=e67]:
          - strong [ref=e68]: 2,486
          - generic [ref=e69]:
            - img [ref=e70]
            - text: 12.4%
        - generic "Total prompts seven day trend chart" [ref=e72]:
          - application [ref=e75]
      - button "Open Active agents detail" [ref=e90] [cursor=pointer]:
        - generic [ref=e91]:
          - img [ref=e93]
          - generic [ref=e95]: Active agents
        - generic [ref=e96]:
          - strong [ref=e97]: "1"
          - generic [ref=e98]:
            - img [ref=e99]
            - text: 8.2%
        - generic "Active agents seven day trend chart" [ref=e101]:
          - application [ref=e104]
      - button "Open Evaluations run detail" [ref=e119] [cursor=pointer]:
        - generic [ref=e120]:
          - img [ref=e122]
          - generic [ref=e124]: Evaluations run
        - generic [ref=e125]:
          - strong [ref=e126]: 18,432
          - generic [ref=e127]:
            - img [ref=e128]
            - text: 18.7%
        - generic "Evaluations run seven day trend chart" [ref=e130]:
          - application [ref=e133]
      - button "Open Cost this month detail" [ref=e148] [cursor=pointer]:
        - generic [ref=e149]:
          - img [ref=e151]
          - generic [ref=e154]: Cost this month
        - generic [ref=e155]:
          - strong [ref=e156]: $4,296
          - generic [ref=e157]:
            - img [ref=e158]
            - text: 3.1%
        - generic "Cost this month seven day trend chart" [ref=e160]:
          - application [ref=e163]
    - main [ref=e177]:
      - region "Coding agents" [ref=e178]:
        - generic [ref=e179]:
          - generic [ref=e180]:
            - paragraph [ref=e181]: Live orchestration
            - heading "Coding agents" [level=2] [ref=e182]
            - paragraph [ref=e183]: 4 connected · 1 running
          - generic [ref=e184]:
            - generic [ref=e185]:
              - checkbox "Select all agents" [ref=e186]
              - generic [ref=e188] [cursor=pointer]: Select all agents
            - button "Disconnect selected" [disabled] [ref=e189]:
              - text: Disconnect selected
              - img [ref=e190]
            - button "Connect agent" [ref=e195] [cursor=pointer]:
              - text: Connect agent
              - img [ref=e196]
        - generic [ref=e198]:
          - article [ref=e199]:
            - generic [ref=e200]:
              - generic [ref=e202]:
                - checkbox "Select Nova Refactor" [ref=e203]
                - generic [ref=e205] [cursor=pointer]: Select Nova Refactor
              - button "NO Nova Refactor gpt-4.1 Verify evaluation results 2 of 3 steps complete Running" [expanded] [ref=e206] [cursor=pointer]:
                - generic [ref=e207]: "NO"
                - generic [ref=e208]:
                  - strong [ref=e209]: Nova Refactor
                  - generic [ref=e210]: gpt-4.1
                - generic [ref=e211]:
                  - strong [ref=e212]: Verify evaluation results
                  - generic [ref=e213]: 2 of 3 steps complete
                - generic "Running" [ref=e215]
                - img [ref=e216]
              - generic [ref=e218]:
                - generic [ref=e219]:
                  - button "Rename Nova Refactor" [ref=e221] [cursor=pointer]:
                    - img [ref=e222]
                  - tooltip
                - generic [ref=e225]:
                  - button "Disconnect Nova Refactor" [ref=e227] [cursor=pointer]:
                    - img [ref=e228]
                  - tooltip
            - generic [ref=e234]:
              - generic [ref=e235]:
                - generic [ref=e236]:
                  - generic [ref=e237]: Description
                  - strong [ref=e238]: Modernizes React code and validates component boundaries.
                - generic [ref=e239]:
                  - generic [ref=e240]: Full agent name
                  - strong [ref=e241]: Nova Refactor
                - generic [ref=e242]:
                  - generic [ref=e243]: Last active
                  - strong [ref=e244]: 7/22/2026, 2:12:51 AM
              - list "Nova Refactor steps" [ref=e245]:
                - listitem [ref=e246]:
                  - img [ref=e248]
                  - generic [ref=e251]:
                    - strong [ref=e252]: Analyze repository context
                    - generic [ref=e253]: complete
                - listitem [ref=e254]:
                  - img [ref=e256]
                  - generic [ref=e259]:
                    - strong [ref=e260]: Draft prompt changes
                    - generic [ref=e261]: complete
                - listitem [ref=e262]:
                  - generic [ref=e265]:
                    - strong [ref=e266]: Verify evaluation results
                    - generic [ref=e267]: running
          - article [ref=e268]:
            - generic [ref=e269]:
              - generic [ref=e271]:
                - checkbox "Select Sentry Reviewer" [ref=e272]
                - generic [ref=e274] [cursor=pointer]: Select Sentry Reviewer
              - button "SE Sentry Reviewer claude-sonnet-4 Ready for a task Last active 7m ago Idle" [ref=e275] [cursor=pointer]:
                - generic [ref=e276]: SE
                - generic [ref=e277]:
                  - strong [ref=e278]: Sentry Reviewer
                  - generic [ref=e279]: claude-sonnet-4
                - generic [ref=e280]:
                  - strong [ref=e281]: Ready for a task
                  - generic [ref=e282]: Last active 7m ago
                - generic "Idle" [ref=e284]
                - img [ref=e285]
              - generic [ref=e287]:
                - button "Run" [ref=e288] [cursor=pointer]:
                  - text: Run
                  - img [ref=e289]
                - generic [ref=e291]:
                  - button "Rename Sentry Reviewer" [ref=e293] [cursor=pointer]:
                    - img [ref=e294]
                  - tooltip
                - generic [ref=e297]:
                  - button "Disconnect Sentry Reviewer" [ref=e299] [cursor=pointer]:
                    - img [ref=e300]
                  - tooltip
            - generic [ref=e305]:
              - generic [ref=e306]:
                - generic [ref=e307]:
                  - generic [ref=e308]: Description
                  - strong [ref=e309]: Reviews prompt changes for safety and regression risk.
                - generic [ref=e310]:
                  - generic [ref=e311]: Full agent name
                  - strong [ref=e312]: Sentry Reviewer
                - generic [ref=e313]:
                  - generic [ref=e314]: Last active
                  - strong [ref=e315]: 7/22/2026, 2:05:22 AM
              - list [ref=e316]:
                - listitem [ref=e317]:
                  - generic [ref=e318]: "1"
                  - generic [ref=e319]:
                    - strong [ref=e320]: Analyze repository context
                    - generic [ref=e321]: pending
                - listitem [ref=e322]:
                  - generic [ref=e323]: "2"
                  - generic [ref=e324]:
                    - strong [ref=e325]: Draft prompt changes
                    - generic [ref=e326]: pending
                - listitem [ref=e327]:
                  - generic [ref=e328]: "3"
                  - generic [ref=e329]:
                    - strong [ref=e330]: Verify evaluation results
                    - generic [ref=e331]: pending
          - article [ref=e332]:
            - generic [ref=e333]:
              - generic [ref=e335]:
                - checkbox "Select Vector Evaluator" [ref=e336]
                - generic [ref=e338] [cursor=pointer]: Select Vector Evaluator
              - button "VE Vector Evaluator o3-mini Run needs attention Last active 18m ago Error" [ref=e339] [cursor=pointer]:
                - generic [ref=e340]: VE
                - generic [ref=e341]:
                  - strong [ref=e342]: Vector Evaluator
                  - generic [ref=e343]: o3-mini
                - generic [ref=e344]:
                  - strong [ref=e345]: Run needs attention
                  - generic [ref=e346]: Last active 18m ago
                - generic "Error" [ref=e348]
                - img [ref=e349]
              - generic [ref=e351]:
                - button "Retry" [ref=e352] [cursor=pointer]:
                  - text: Retry
                  - img [ref=e353]
                - generic [ref=e356]:
                  - button "Rename Vector Evaluator" [ref=e358] [cursor=pointer]:
                    - img [ref=e359]
                  - tooltip
                - generic [ref=e362]:
                  - button "Disconnect Vector Evaluator" [ref=e364] [cursor=pointer]:
                    - img [ref=e365]
                  - tooltip
            - generic [ref=e370]:
              - generic [ref=e371]:
                - generic [ref=e372]:
                  - generic [ref=e373]: Description
                  - strong [ref=e374]: Runs fast rubric-based evaluation suites.
                - generic [ref=e375]:
                  - generic [ref=e376]: Full agent name
                  - strong [ref=e377]: Vector Evaluator
                - generic [ref=e378]:
                  - generic [ref=e379]: Last active
                  - strong [ref=e380]: 7/22/2026, 1:54:22 AM
              - list [ref=e381]:
                - listitem [ref=e382]:
                  - img [ref=e384]
                  - generic [ref=e387]:
                    - strong [ref=e388]: Analyze repository context
                    - generic [ref=e389]: complete
                - listitem [ref=e390]:
                  - img [ref=e392]
                  - generic [ref=e395]:
                    - strong [ref=e396]: Draft prompt changes
                    - generic [ref=e397]: complete
                - listitem [ref=e398]:
                  - generic [ref=e399]: "3"
                  - generic [ref=e400]:
                    - strong [ref=e401]: Verify evaluation results
                    - generic [ref=e402]: pending
          - article [ref=e403]:
            - generic [ref=e404]:
              - generic [ref=e406]:
                - checkbox "Select Orbit Context Mapper" [ref=e407]
                - generic [ref=e409] [cursor=pointer]: Select Orbit Context Mapper
              - button "OR Orbit Context Mapper gemini-2.5-pro Ready for a task Last active 42m ago Idle" [ref=e410] [cursor=pointer]:
                - generic [ref=e411]: OR
                - generic [ref=e412]:
                  - strong [ref=e413]: Orbit Context Mapper
                  - generic [ref=e414]: gemini-2.5-pro
                - generic [ref=e415]:
                  - strong [ref=e416]: Ready for a task
                  - generic [ref=e417]: Last active 42m ago
                - generic "Idle" [ref=e419]
                - img [ref=e420]
              - generic [ref=e422]:
                - button "Run" [ref=e423] [cursor=pointer]:
                  - text: Run
                  - img [ref=e424]
                - generic [ref=e426]:
                  - button "Rename Orbit Context Mapper" [ref=e428] [cursor=pointer]:
                    - img [ref=e429]
                  - tooltip
                - generic [ref=e432]:
                  - button "Disconnect Orbit Context Mapper" [ref=e434] [cursor=pointer]:
                    - img [ref=e435]
                  - tooltip
            - generic [ref=e440]:
              - generic [ref=e441]:
                - generic [ref=e442]:
                  - generic [ref=e443]: Description
                  - strong [ref=e444]: Maps large codebases into compact working context.
                - generic [ref=e445]:
                  - generic [ref=e446]: Full agent name
                  - strong [ref=e447]: Orbit Context Mapper
                - generic [ref=e448]:
                  - generic [ref=e449]: Last active
                  - strong [ref=e450]: 7/22/2026, 1:30:22 AM
              - list [ref=e451]:
                - listitem [ref=e452]:
                  - generic [ref=e453]: "1"
                  - generic [ref=e454]:
                    - strong [ref=e455]: Analyze repository context
                    - generic [ref=e456]: pending
                - listitem [ref=e457]:
                  - generic [ref=e458]: "2"
                  - generic [ref=e459]:
                    - strong [ref=e460]: Draft prompt changes
                    - generic [ref=e461]: pending
                - listitem [ref=e462]:
                  - generic [ref=e463]: "3"
                  - generic [ref=e464]:
                    - strong [ref=e465]: Verify evaluation results
                    - generic [ref=e466]: pending
      - region "Activity feed" [ref=e467]:
        - generic [ref=e468]:
          - generic [ref=e469]:
            - paragraph [ref=e470]: Session pulse
            - heading "Activity feed" [level=2] [ref=e471]
            - paragraph [ref=e472]: 14 of 14 events visible
          - button "Simulate activity" [ref=e473] [cursor=pointer]:
            - text: Simulate activity
            - img [ref=e474]
        - generic "Feed suggestions" [ref=e476]:
          - button "Show errors only" [ref=e477] [cursor=pointer]:
            - img [ref=e478]
            - text: Show errors only
          - button "Show agent events" [ref=e480] [cursor=pointer]:
            - img [ref=e481]
            - text: Show agent events
          - button "Show evaluations" [ref=e483] [cursor=pointer]:
            - img [ref=e484]
            - text: Show evaluations
          - button "Show prompt changes" [ref=e486] [cursor=pointer]:
            - img [ref=e487]
            - text: Show prompt changes
        - generic "Activity filters" [ref=e489]:
          - img [ref=e490]
          - button "Prompt" [ref=e492] [cursor=pointer]
          - button "Evaluation" [ref=e493] [cursor=pointer]
          - button "Agent" [ref=e494] [cursor=pointer]
          - button "Errors" [ref=e495] [cursor=pointer]
          - button "Clear filters" [disabled] [ref=e496]
        - generic "Recent activity events" [ref=e498]:
          - generic [ref=e499]:
            - button "Nova Refactor started a repository analysis run Info agent 1m ago" [ref=e500] [cursor=pointer]:
              - img [ref=e502]
              - generic [ref=e504]:
                - generic [ref=e505]: Nova Refactor started a repository analysis run
                - generic [ref=e506]:
                  - generic "Info" [ref=e508]
                  - generic [ref=e509]: agent
                  - img [ref=e510]
                  - time [ref=e513]: 1m ago
            - button "Safety rubric evaluation finished at 96.4% Success evaluation 4m ago" [ref=e514] [cursor=pointer]:
              - img [ref=e516]
              - generic [ref=e518]:
                - generic [ref=e519]: Safety rubric evaluation finished at 96.4%
                - generic [ref=e520]:
                  - generic "Success" [ref=e522]
                  - generic [ref=e523]: evaluation
                  - img [ref=e524]
                  - time [ref=e527]: 4m ago
            - button "Customer-support system prompt was created Success prompt 7m ago" [ref=e528] [cursor=pointer]:
              - img [ref=e530]
              - generic [ref=e534]:
                - generic [ref=e535]: Customer-support system prompt was created
                - generic [ref=e536]:
                  - generic "Success" [ref=e538]
                  - generic [ref=e539]: prompt
                  - img [ref=e540]
                  - time [ref=e543]: 7m ago
            - button "Vector Evaluator encountered a context window error Error agent 18m ago" [ref=e544] [cursor=pointer]:
              - img [ref=e546]
              - generic [ref=e548]:
                - generic [ref=e549]: Vector Evaluator encountered a context window error
                - generic [ref=e550]:
                  - generic "Error" [ref=e552]
                  - generic [ref=e553]: agent
                  - img [ref=e554]
                  - time [ref=e557]: 18m ago
            - button "Hallucination benchmark finished with 42 cases Success evaluation 27m ago" [ref=e558] [cursor=pointer]:
              - img [ref=e560]
              - generic [ref=e562]:
                - generic [ref=e563]: Hallucination benchmark finished with 42 cases
                - generic [ref=e564]:
                  - generic "Success" [ref=e566]
                  - generic [ref=e567]: evaluation
                  - img [ref=e568]
                  - time [ref=e571]: 27m ago
            - button "Sentry Reviewer completed a policy review Success agent 39m ago" [ref=e572] [cursor=pointer]:
              - img [ref=e574]
              - generic [ref=e576]:
                - generic [ref=e577]: Sentry Reviewer completed a policy review
                - generic [ref=e578]:
                  - generic "Success" [ref=e580]
                  - generic [ref=e581]: agent
                  - img [ref=e582]
                  - time [ref=e585]: 39m ago
            - button "Code migration prompt was revised Info prompt 51m ago" [ref=e586] [cursor=pointer]:
              - img [ref=e588]
              - generic [ref=e592]:
                - generic [ref=e593]: Code migration prompt was revised
                - generic [ref=e594]:
                  - generic "Info" [ref=e596]
                  - generic [ref=e597]: prompt
                  - img [ref=e598]
                  - time [ref=e601]: 51m ago
            - button "Tool-use evaluation finished at 91.8% Success evaluation 1h ago" [ref=e602] [cursor=pointer]:
              - img [ref=e604]
              - generic [ref=e606]:
                - generic [ref=e607]: Tool-use evaluation finished at 91.8%
                - generic [ref=e608]:
                  - generic "Success" [ref=e610]
                  - generic [ref=e611]: evaluation
                  - img [ref=e612]
                  - time [ref=e615]: 1h ago
            - button "Orbit Context Mapper connected to the workspace Info agent 1h ago" [ref=e616] [cursor=pointer]:
              - img [ref=e618]
              - generic [ref=e620]:
                - generic [ref=e621]: Orbit Context Mapper connected to the workspace
                - generic [ref=e622]:
                  - generic "Info" [ref=e624]
                  - generic [ref=e625]: agent
                  - img [ref=e626]
                  - time [ref=e629]: 1h ago
            - button "Retrieval grounding prompt was created Success prompt 2h ago" [ref=e630] [cursor=pointer]:
              - img [ref=e632]
              - generic [ref=e636]:
                - generic [ref=e637]: Retrieval grounding prompt was created
                - generic [ref=e638]:
                  - generic "Success" [ref=e640]
                  - generic [ref=e641]: prompt
                  - img [ref=e642]
                  - time [ref=e645]: 2h ago
            - button "Monthly evaluation cost checkpoint completed Info evaluation 3h ago" [ref=e646] [cursor=pointer]:
              - img [ref=e648]
              - generic [ref=e650]:
                - generic [ref=e651]: Monthly evaluation cost checkpoint completed
                - generic [ref=e652]:
                  - generic "Info" [ref=e654]
                  - generic [ref=e655]: evaluation
                  - img [ref=e656]
                  - time [ref=e659]: 3h ago
            - button "Nova Refactor completed step Analyze repository context Success agent 5h ago" [ref=e660] [cursor=pointer]:
              - img [ref=e662]
              - generic [ref=e664]:
                - generic [ref=e665]: Nova Refactor completed step Analyze repository context
                - generic [ref=e666]:
                  - generic "Success" [ref=e668]
                  - generic [ref=e669]: agent
                  - img [ref=e670]
                  - time [ref=e673]: 5h ago
            - button "Incident response prompt was archived Info prompt 7h ago" [ref=e674] [cursor=pointer]:
              - img [ref=e676]
              - generic [ref=e680]:
                - generic [ref=e681]: Incident response prompt was archived
                - generic [ref=e682]:
                  - generic "Info" [ref=e684]
                  - generic [ref=e685]: prompt
                  - img [ref=e686]
                  - time [ref=e689]: 7h ago
            - button "Agent handoff benchmark reported one error Error evaluation 10h ago" [ref=e690] [cursor=pointer]:
              - img [ref=e692]
              - generic [ref=e694]:
                - generic [ref=e695]: Agent handoff benchmark reported one error
                - generic [ref=e696]:
                  - generic "Error" [ref=e698]
                  - generic [ref=e699]: evaluation
                  - img [ref=e700]
                  - time [ref=e703]: 10h ago
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
> 75  |     await page.locator('table tbody tr [aria-haspopup="true"], table tbody tr [aria-label*="menu"]').first().click();
      |                                                                                                              ^ Error: locator.click: Test timeout of 30000ms exceeded.
  76  |     await expect(page.getByRole('menuitem', { name: /Rename/i })).toBeVisible();
  77  |     await expect(page.getByRole('menuitem', { name: /Disconnect/i })).toBeVisible();
  78  |   });
  79  |
  80  |   test('1.12 feed_newest_first_capped_50', async ({ page }) => {
  81  |     await expect(page.locator('ul li, [role="listitem"]').first()).toBeVisible();
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
```