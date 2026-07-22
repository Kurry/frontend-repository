# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.mjs >> Command Center E2E >> 1.5 validation_associated_with_fields
- Location: e2e.spec.mjs:40:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Connect agent', exact: true }).last()
    - locator resolved to <button disabled type="submit" class="cds--btn cds--btn--primary cds--btn--disabled">…</button>
  - attempting click action
    - waiting for element to be visible, enabled and stable
    - element is not stable
  - retrying click action
    - waiting for element to be visible, enabled and stable
    - element is not enabled
  - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
      - waiting 100ms
    50 × waiting for element to be visible, enabled and stable
       - element is not enabled
     - retrying click action
       - waiting 500ms

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
              - button "NO Nova Refactor gpt-4.1 Draft prompt changes 1 of 3 steps complete Running" [expanded] [ref=e206] [cursor=pointer]:
                - generic [ref=e207]: "NO"
                - generic [ref=e208]:
                  - strong [ref=e209]: Nova Refactor
                  - generic [ref=e210]: gpt-4.1
                - generic [ref=e211]:
                  - strong [ref=e212]: Draft prompt changes
                  - generic [ref=e213]: 1 of 3 steps complete
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
                  - strong [ref=e244]: 7/22/2026, 2:12:13 AM
              - list "Nova Refactor steps" [ref=e245]:
                - listitem [ref=e246]:
                  - img [ref=e248]
                  - generic [ref=e251]:
                    - strong [ref=e252]: Analyze repository context
                    - generic [ref=e253]: complete
                - listitem [ref=e254]:
                  - generic [ref=e257]:
                    - strong [ref=e258]: Draft prompt changes
                    - generic [ref=e259]: running
                - listitem [ref=e260]:
                  - generic [ref=e261]: "3"
                  - generic [ref=e262]:
                    - strong [ref=e263]: Verify evaluation results
                    - generic [ref=e264]: pending
          - article [ref=e265]:
            - generic [ref=e266]:
              - generic [ref=e268]:
                - checkbox "Select Sentry Reviewer" [ref=e269]
                - generic [ref=e271] [cursor=pointer]: Select Sentry Reviewer
              - button "SE Sentry Reviewer claude-sonnet-4 Ready for a task Last active 7m ago Idle" [ref=e272] [cursor=pointer]:
                - generic [ref=e273]: SE
                - generic [ref=e274]:
                  - strong [ref=e275]: Sentry Reviewer
                  - generic [ref=e276]: claude-sonnet-4
                - generic [ref=e277]:
                  - strong [ref=e278]: Ready for a task
                  - generic [ref=e279]: Last active 7m ago
                - generic "Idle" [ref=e281]
                - img [ref=e282]
              - generic [ref=e284]:
                - button "Run" [ref=e285] [cursor=pointer]:
                  - text: Run
                  - img [ref=e286]
                - generic [ref=e288]:
                  - button "Rename Sentry Reviewer" [ref=e290] [cursor=pointer]:
                    - img [ref=e291]
                  - tooltip
                - generic [ref=e294]:
                  - button "Disconnect Sentry Reviewer" [ref=e296] [cursor=pointer]:
                    - img [ref=e297]
                  - tooltip
            - generic [ref=e302]:
              - generic [ref=e303]:
                - generic [ref=e304]:
                  - generic [ref=e305]: Description
                  - strong [ref=e306]: Reviews prompt changes for safety and regression risk.
                - generic [ref=e307]:
                  - generic [ref=e308]: Full agent name
                  - strong [ref=e309]: Sentry Reviewer
                - generic [ref=e310]:
                  - generic [ref=e311]: Last active
                  - strong [ref=e312]: 7/22/2026, 2:04:46 AM
              - list [ref=e313]:
                - listitem [ref=e314]:
                  - generic [ref=e315]: "1"
                  - generic [ref=e316]:
                    - strong [ref=e317]: Analyze repository context
                    - generic [ref=e318]: pending
                - listitem [ref=e319]:
                  - generic [ref=e320]: "2"
                  - generic [ref=e321]:
                    - strong [ref=e322]: Draft prompt changes
                    - generic [ref=e323]: pending
                - listitem [ref=e324]:
                  - generic [ref=e325]: "3"
                  - generic [ref=e326]:
                    - strong [ref=e327]: Verify evaluation results
                    - generic [ref=e328]: pending
          - article [ref=e329]:
            - generic [ref=e330]:
              - generic [ref=e332]:
                - checkbox "Select Vector Evaluator" [ref=e333]
                - generic [ref=e335] [cursor=pointer]: Select Vector Evaluator
              - button "VE Vector Evaluator o3-mini Run needs attention Last active 18m ago Error" [ref=e336] [cursor=pointer]:
                - generic [ref=e337]: VE
                - generic [ref=e338]:
                  - strong [ref=e339]: Vector Evaluator
                  - generic [ref=e340]: o3-mini
                - generic [ref=e341]:
                  - strong [ref=e342]: Run needs attention
                  - generic [ref=e343]: Last active 18m ago
                - generic "Error" [ref=e345]
                - img [ref=e346]
              - generic [ref=e348]:
                - button "Retry" [ref=e349] [cursor=pointer]:
                  - text: Retry
                  - img [ref=e350]
                - generic [ref=e353]:
                  - button "Rename Vector Evaluator" [ref=e355] [cursor=pointer]:
                    - img [ref=e356]
                  - tooltip
                - generic [ref=e359]:
                  - button "Disconnect Vector Evaluator" [ref=e361] [cursor=pointer]:
                    - img [ref=e362]
                  - tooltip
            - generic [ref=e367]:
              - generic [ref=e368]:
                - generic [ref=e369]:
                  - generic [ref=e370]: Description
                  - strong [ref=e371]: Runs fast rubric-based evaluation suites.
                - generic [ref=e372]:
                  - generic [ref=e373]: Full agent name
                  - strong [ref=e374]: Vector Evaluator
                - generic [ref=e375]:
                  - generic [ref=e376]: Last active
                  - strong [ref=e377]: 7/22/2026, 1:53:46 AM
              - list [ref=e378]:
                - listitem [ref=e379]:
                  - img [ref=e381]
                  - generic [ref=e384]:
                    - strong [ref=e385]: Analyze repository context
                    - generic [ref=e386]: complete
                - listitem [ref=e387]:
                  - img [ref=e389]
                  - generic [ref=e392]:
                    - strong [ref=e393]: Draft prompt changes
                    - generic [ref=e394]: complete
                - listitem [ref=e395]:
                  - generic [ref=e396]: "3"
                  - generic [ref=e397]:
                    - strong [ref=e398]: Verify evaluation results
                    - generic [ref=e399]: pending
          - article [ref=e400]:
            - generic [ref=e401]:
              - generic [ref=e403]:
                - checkbox "Select Orbit Context Mapper" [ref=e404]
                - generic [ref=e406] [cursor=pointer]: Select Orbit Context Mapper
              - button "OR Orbit Context Mapper gemini-2.5-pro Ready for a task Last active 42m ago Idle" [ref=e407] [cursor=pointer]:
                - generic [ref=e408]: OR
                - generic [ref=e409]:
                  - strong [ref=e410]: Orbit Context Mapper
                  - generic [ref=e411]: gemini-2.5-pro
                - generic [ref=e412]:
                  - strong [ref=e413]: Ready for a task
                  - generic [ref=e414]: Last active 42m ago
                - generic "Idle" [ref=e416]
                - img [ref=e417]
              - generic [ref=e419]:
                - button "Run" [ref=e420] [cursor=pointer]:
                  - text: Run
                  - img [ref=e421]
                - generic [ref=e423]:
                  - button "Rename Orbit Context Mapper" [ref=e425] [cursor=pointer]:
                    - img [ref=e426]
                  - tooltip
                - generic [ref=e429]:
                  - button "Disconnect Orbit Context Mapper" [ref=e431] [cursor=pointer]:
                    - img [ref=e432]
                  - tooltip
            - generic [ref=e437]:
              - generic [ref=e438]:
                - generic [ref=e439]:
                  - generic [ref=e440]: Description
                  - strong [ref=e441]: Maps large codebases into compact working context.
                - generic [ref=e442]:
                  - generic [ref=e443]: Full agent name
                  - strong [ref=e444]: Orbit Context Mapper
                - generic [ref=e445]:
                  - generic [ref=e446]: Last active
                  - strong [ref=e447]: 7/22/2026, 1:29:46 AM
              - list [ref=e448]:
                - listitem [ref=e449]:
                  - generic [ref=e450]: "1"
                  - generic [ref=e451]:
                    - strong [ref=e452]: Analyze repository context
                    - generic [ref=e453]: pending
                - listitem [ref=e454]:
                  - generic [ref=e455]: "2"
                  - generic [ref=e456]:
                    - strong [ref=e457]: Draft prompt changes
                    - generic [ref=e458]: pending
                - listitem [ref=e459]:
                  - generic [ref=e460]: "3"
                  - generic [ref=e461]:
                    - strong [ref=e462]: Verify evaluation results
                    - generic [ref=e463]: pending
      - region "Activity feed" [ref=e464]:
        - generic [ref=e465]:
          - generic [ref=e466]:
            - paragraph [ref=e467]: Session pulse
            - heading "Activity feed" [level=2] [ref=e468]
            - paragraph [ref=e469]: 14 of 14 events visible
          - button "Simulate activity" [ref=e470] [cursor=pointer]:
            - text: Simulate activity
            - img [ref=e471]
        - generic "Feed suggestions" [ref=e473]:
          - button "Show errors only" [ref=e474] [cursor=pointer]:
            - img [ref=e475]
            - text: Show errors only
          - button "Show agent events" [ref=e477] [cursor=pointer]:
            - img [ref=e478]
            - text: Show agent events
          - button "Show evaluations" [ref=e480] [cursor=pointer]:
            - img [ref=e481]
            - text: Show evaluations
          - button "Show prompt changes" [ref=e483] [cursor=pointer]:
            - img [ref=e484]
            - text: Show prompt changes
        - generic "Activity filters" [ref=e486]:
          - img [ref=e487]
          - button "Prompt" [ref=e489] [cursor=pointer]
          - button "Evaluation" [ref=e490] [cursor=pointer]
          - button "Agent" [ref=e491] [cursor=pointer]
          - button "Errors" [ref=e492] [cursor=pointer]
          - button "Clear filters" [disabled] [ref=e493]
        - generic "Recent activity events" [ref=e495]:
          - generic [ref=e496]:
            - button "Nova Refactor started a repository analysis run Info agent 1m ago" [ref=e497] [cursor=pointer]:
              - img [ref=e499]
              - generic [ref=e501]:
                - generic [ref=e502]: Nova Refactor started a repository analysis run
                - generic [ref=e503]:
                  - generic "Info" [ref=e505]
                  - generic [ref=e506]: agent
                  - img [ref=e507]
                  - time [ref=e510]: 1m ago
            - button "Safety rubric evaluation finished at 96.4% Success evaluation 4m ago" [ref=e511] [cursor=pointer]:
              - img [ref=e513]
              - generic [ref=e515]:
                - generic [ref=e516]: Safety rubric evaluation finished at 96.4%
                - generic [ref=e517]:
                  - generic "Success" [ref=e519]
                  - generic [ref=e520]: evaluation
                  - img [ref=e521]
                  - time [ref=e524]: 4m ago
            - button "Customer-support system prompt was created Success prompt 7m ago" [ref=e525] [cursor=pointer]:
              - img [ref=e527]
              - generic [ref=e531]:
                - generic [ref=e532]: Customer-support system prompt was created
                - generic [ref=e533]:
                  - generic "Success" [ref=e535]
                  - generic [ref=e536]: prompt
                  - img [ref=e537]
                  - time [ref=e540]: 7m ago
            - button "Vector Evaluator encountered a context window error Error agent 18m ago" [ref=e541] [cursor=pointer]:
              - img [ref=e543]
              - generic [ref=e545]:
                - generic [ref=e546]: Vector Evaluator encountered a context window error
                - generic [ref=e547]:
                  - generic "Error" [ref=e549]
                  - generic [ref=e550]: agent
                  - img [ref=e551]
                  - time [ref=e554]: 18m ago
            - button "Hallucination benchmark finished with 42 cases Success evaluation 27m ago" [ref=e555] [cursor=pointer]:
              - img [ref=e557]
              - generic [ref=e559]:
                - generic [ref=e560]: Hallucination benchmark finished with 42 cases
                - generic [ref=e561]:
                  - generic "Success" [ref=e563]
                  - generic [ref=e564]: evaluation
                  - img [ref=e565]
                  - time [ref=e568]: 27m ago
            - button "Sentry Reviewer completed a policy review Success agent 39m ago" [ref=e569] [cursor=pointer]:
              - img [ref=e571]
              - generic [ref=e573]:
                - generic [ref=e574]: Sentry Reviewer completed a policy review
                - generic [ref=e575]:
                  - generic "Success" [ref=e577]
                  - generic [ref=e578]: agent
                  - img [ref=e579]
                  - time [ref=e582]: 39m ago
            - button "Code migration prompt was revised Info prompt 51m ago" [ref=e583] [cursor=pointer]:
              - img [ref=e585]
              - generic [ref=e589]:
                - generic [ref=e590]: Code migration prompt was revised
                - generic [ref=e591]:
                  - generic "Info" [ref=e593]
                  - generic [ref=e594]: prompt
                  - img [ref=e595]
                  - time [ref=e598]: 51m ago
            - button "Tool-use evaluation finished at 91.8% Success evaluation 1h ago" [ref=e599] [cursor=pointer]:
              - img [ref=e601]
              - generic [ref=e603]:
                - generic [ref=e604]: Tool-use evaluation finished at 91.8%
                - generic [ref=e605]:
                  - generic "Success" [ref=e607]
                  - generic [ref=e608]: evaluation
                  - img [ref=e609]
                  - time [ref=e612]: 1h ago
            - button "Orbit Context Mapper connected to the workspace Info agent 1h ago" [ref=e613] [cursor=pointer]:
              - img [ref=e615]
              - generic [ref=e617]:
                - generic [ref=e618]: Orbit Context Mapper connected to the workspace
                - generic [ref=e619]:
                  - generic "Info" [ref=e621]
                  - generic [ref=e622]: agent
                  - img [ref=e623]
                  - time [ref=e626]: 1h ago
            - button "Retrieval grounding prompt was created Success prompt 2h ago" [ref=e627] [cursor=pointer]:
              - img [ref=e629]
              - generic [ref=e633]:
                - generic [ref=e634]: Retrieval grounding prompt was created
                - generic [ref=e635]:
                  - generic "Success" [ref=e637]
                  - generic [ref=e638]: prompt
                  - img [ref=e639]
                  - time [ref=e642]: 2h ago
            - button "Monthly evaluation cost checkpoint completed Info evaluation 3h ago" [ref=e643] [cursor=pointer]:
              - img [ref=e645]
              - generic [ref=e647]:
                - generic [ref=e648]: Monthly evaluation cost checkpoint completed
                - generic [ref=e649]:
                  - generic "Info" [ref=e651]
                  - generic [ref=e652]: evaluation
                  - img [ref=e653]
                  - time [ref=e656]: 3h ago
            - button "Nova Refactor completed step Analyze repository context Success agent 5h ago" [ref=e657] [cursor=pointer]:
              - img [ref=e659]
              - generic [ref=e661]:
                - generic [ref=e662]: Nova Refactor completed step Analyze repository context
                - generic [ref=e663]:
                  - generic "Success" [ref=e665]
                  - generic [ref=e666]: agent
                  - img [ref=e667]
                  - time [ref=e670]: 5h ago
            - button "Incident response prompt was archived Info prompt 7h ago" [ref=e671] [cursor=pointer]:
              - img [ref=e673]
              - generic [ref=e677]:
                - generic [ref=e678]: Incident response prompt was archived
                - generic [ref=e679]:
                  - generic "Info" [ref=e681]
                  - generic [ref=e682]: prompt
                  - img [ref=e683]
                  - time [ref=e686]: 7h ago
            - button "Agent handoff benchmark reported one error Error evaluation 10h ago" [ref=e687] [cursor=pointer]:
              - img [ref=e689]
              - generic [ref=e691]:
                - generic [ref=e692]: Agent handoff benchmark reported one error
                - generic [ref=e693]:
                  - generic "Error" [ref=e695]
                  - generic [ref=e696]: evaluation
                  - img [ref=e697]
                  - time [ref=e700]: 10h ago
  - dialog "Connect agent" [ref=e701]:
    - generic [ref=e702]:
      - generic [ref=e703]:
        - paragraph [ref=e704]: Agent registration
        - heading "Connect agent" [level=2] [ref=e705]
        - paragraph [ref=e706]: Register a coding agent using the shared session contract.
      - generic [ref=e707]:
        - button "Close Connect agent dialog" [active] [ref=e709] [cursor=pointer]:
          - img [ref=e710]
        - tooltip "Close Connect agent dialog":
          - generic [ref=e712]: Close Connect agent dialog
    - generic [ref=e713]:
      - generic [ref=e714]:
        - generic [ref=e716]: Agent name
        - generic [ref=e717]:
          - generic [ref=e718]:
            - textbox "Agent name" [invalid] [ref=e719]
            - img [ref=e720]
            - alert [ref=e723]
          - generic [ref=e724]: Agent name is required and cannot be whitespace only.
      - generic [ref=e726]:
        - generic [ref=e727]: Model
        - generic [ref=e728]:
          - combobox "Model" [invalid] [ref=e729] [cursor=pointer]:
            - option "Choose an allowed model" [disabled] [selected]
            - option "gpt-4.1"
            - option "claude-sonnet-4"
            - option "o3-mini"
            - option "gemini-2.5-pro"
          - img
          - img [ref=e730]
        - generic [ref=e733]: Model is required and must be one of the four allowed models.
      - generic [ref=e734]:
        - generic [ref=e735]:
          - generic [ref=e737]: Description (optional)
          - generic [ref=e738]:
            - textbox "Description (optional)" [ref=e739]:
              - /placeholder: ""
            - alert [ref=e740]
        - generic [ref=e741]: 0/280
      - generic [ref=e742]:
        - button "Cancel" [ref=e743] [cursor=pointer]
        - button "Connect agent" [disabled] [ref=e744]:
          - text: Connect agent
          - img [ref=e745]
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
> 42  |     await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();
      |                                                                                   ^ Error: locator.click: Test timeout of 30000ms exceeded.
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
```