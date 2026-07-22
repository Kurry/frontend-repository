# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.mjs >> Command Center E2E >> 5.4 reload_returns_seeded_baseline
- Location: e2e.spec.mjs:202:3

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
    51 × waiting for element to be visible, enabled and stable
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
                  - strong [ref=e244]: 7/22/2026, 2:16:04 AM
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
                  - strong [ref=e315]: 7/22/2026, 2:08:35 AM
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
                  - strong [ref=e380]: 7/22/2026, 1:57:35 AM
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
                  - strong [ref=e450]: 7/22/2026, 1:33:35 AM
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
  - dialog "Connect agent" [ref=e704]:
    - generic [ref=e705]:
      - generic [ref=e706]:
        - paragraph [ref=e707]: Agent registration
        - heading "Connect agent" [level=2] [ref=e708]
        - paragraph [ref=e709]: Register a coding agent using the shared session contract.
      - generic [ref=e710]:
        - button "Close Connect agent dialog" [ref=e712] [cursor=pointer]:
          - img [ref=e713]
        - tooltip
    - generic [ref=e715]:
      - generic [ref=e716]:
        - generic [ref=e718]: Agent name
        - generic [ref=e720]:
          - textbox "Agent name" [active] [ref=e721]: Seeded Agent
          - alert [ref=e722]
      - generic [ref=e724]:
        - generic [ref=e725]: Model
        - generic [ref=e726]:
          - combobox "Model" [invalid] [ref=e727] [cursor=pointer]:
            - option "Choose an allowed model" [disabled] [selected]
            - option "gpt-4.1"
            - option "claude-sonnet-4"
            - option "o3-mini"
            - option "gemini-2.5-pro"
          - img
          - img [ref=e728]
        - generic [ref=e731]: Model is required and must be one of the four allowed models.
      - generic [ref=e732]:
        - generic [ref=e733]:
          - generic [ref=e735]: Description (optional)
          - generic [ref=e736]:
            - textbox "Description (optional)" [ref=e737]:
              - /placeholder: ""
            - alert [ref=e738]
        - generic [ref=e739]: 0/280
      - generic [ref=e740]:
        - button "Cancel" [ref=e741] [cursor=pointer]
        - button "Connect agent" [disabled] [ref=e742]:
          - text: Connect agent
          - img [ref=e743]
```

# Test source

```ts
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
  182 |   });
  183 |
  184 |   test('5.2 console_clean_full_exercise', async ({ page }) => {
  185 |     let errors = 0;
  186 |     page.on('console', msg => { if (msg.type() === 'error') errors++; });
  187 |     page.on('pageerror', () => errors++);
  188 |     await page.goto('http://localhost:3000');
  189 |     await page.waitForLoadState('networkidle');
  190 |
  191 |     await page.getByRole('button', { name: /Connect agent/i }).first().click();
  192 |     await page.locator('input#agent-name, input[name="name"], input[placeholder*="name" i]').first().fill('Console Agent');
  193 |     await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();
  194 |
  195 |     await page.getByRole('button', { name: /Simulate activity/i }).click();
  196 |
  197 |     await page.getByRole('button', { name: /Export/i }).click();
  198 |
  199 |     expect(errors).toBe(0);
  200 |   });
  201 |
  202 |   test('5.4 reload_returns_seeded_baseline', async ({ page }) => {
  203 |     await page.getByRole('button', { name: /Connect agent/i }).first().click();
  204 |     await page.locator('input#agent-name, input[name="name"], input[placeholder*="name" i]').first().fill('Seeded Agent');
> 205 |     await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();
      |                                                                                   ^ Error: locator.click: Test timeout of 30000ms exceeded.
  206 |
  207 |     await page.reload();
  208 |     await expect(page.locator('body')).not.toContainText('Seeded Agent');
  209 |   });
  210 |
  211 |   test('5.5 cross_view_state_coherence', async ({ page }) => {
  212 |     await page.locator('table tbody tr [aria-haspopup="true"], table tbody tr [aria-label*="menu"]').first().click();
  213 |     await page.getByRole('menuitem', { name: /Rename/i }).click();
  214 |     await page.locator('input[type="text"]').last().fill('Cross View Agent');
  215 |     await page.getByRole('button', { name: /Rename|Save/i }).click();
  216 |
  217 |     await expect(page.locator('table tbody tr').first()).toContainText('Cross View Agent');
  218 |   });
  219 |
  220 |   test('5.7 rapid_input_stability', async ({ page }) => {
  221 |     const simBtn = page.getByRole('button', { name: /Simulate activity/i });
  222 |     for(let i=0; i<5; i++){
  223 |       await simBtn.click();
  224 |     }
  225 |     await expect(page.locator('ul li, [role="listitem"]').first()).toBeVisible();
  226 |   });
  227 |
  228 |   test('5.9 webmcp_registry_matches_ui', async ({ page }) => {
  229 |     const hasInfo = await page.evaluate(() => typeof window.webmcp_session_info !== "undefined");
  230 |     const hasList = await page.evaluate(() => typeof window.webmcp_list_tools !== "undefined");
  231 |     const hasInvoke = await page.evaluate(() => typeof window.webmcp_invoke_tool !== "undefined");
  232 |     expect(hasInfo && hasList && hasInvoke).toBe(true);
  233 |   });
  234 |
  235 |   test('5.10 export_preview_regen_stays_responsive', async ({ page }) => {
  236 |     await page.getByRole('button', { name: /Export/i }).click();
  237 |     await page.getByRole('tab', { name: /CSV/i }).click();
  238 |     await expect(page.locator('pre, code').first()).toBeVisible();
  239 |   });
  240 |
  241 |   // 6. Flows
  242 |   test('6.1 connect_agent_updates_panel_feed_export', async ({ page }) => {
  243 |     const initialRows = await page.locator('table tbody tr').count();
  244 |
  245 |     await page.getByRole('button', { name: /Connect agent/i }).first().click();
  246 |     await page.locator('input#agent-name, input[name="name"], input[placeholder*="name" i]').first().fill('Strict Test Agent');
  247 |     await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();
  248 |
  249 |     const newRows = await page.locator('table tbody tr').count();
  250 |     expect(newRows).toBe(initialRows + 1);
  251 |
  252 |     await expect(page.locator('.feed-item, [role="listitem"], ul li').first()).toContainText('Strict Test Agent');
  253 |
  254 |     await page.keyboard.press('Escape');
  255 |     await page.getByRole('button', { name: /Export/i }).click({ force: true });
  256 |     await expect(page.locator('pre, code').first()).toContainText('Strict Test Agent');
  257 |   });
  258 |
  259 |   test('6.2 invalid_connect_shows_field_contract_errors', async ({ page }) => {
  260 |     await page.getByRole('button', { name: /Connect agent/i }).first().click();
  261 |     await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();
  262 |     await expect(page.locator('[aria-invalid="true"]').first()).toBeVisible();
  263 |   });
  264 |
  265 |   test('6.3 rename_updates_all_agent_surfaces', async ({ page }) => {
  266 |     await page.locator('table tbody tr [aria-haspopup="true"], table tbody tr [aria-label*="menu"]').first().click();
  267 |     await page.getByRole('menuitem', { name: /Rename/i }).click();
  268 |     await page.locator('input[type="text"]').last().fill('Renamed Flow Agent');
  269 |     await page.getByRole('button', { name: /Rename|Save/i }).click();
  270 |     await expect(page.locator('table tbody tr').first()).toContainText('Renamed Flow Agent');
  271 |   });
  272 |
  273 |   test('6.4 disconnect_updates_panel_kpi_feed_export', async ({ page }) => {
  274 |     const initialRows = await page.locator('table tbody tr').count();
  275 |     await page.locator('table tbody tr [aria-haspopup="true"], table tbody tr [aria-label*="menu"]').first().click();
  276 |     await page.getByRole('menuitem', { name: /Disconnect/i }).click();
  277 |     await page.getByRole('button', { name: /Confirm|Disconnect/i }).last().click();
  278 |     const newRows = await page.locator('table tbody tr').count();
  279 |     expect(newRows).toBeLessThan(initialRows);
  280 |   });
  281 |
  282 |   test('6.5 kpi_detail_and_back_retain_dashboard_state', async ({ page }) => {
  283 |     await page.locator('.kpi-tile, [class*="kpi"]').first().click();
  284 |     await page.getByRole('button', { name: /Back/i }).click();
  285 |     await expect(page.locator('table tbody tr').first()).toBeVisible();
  286 |   });
  287 |
  288 |   test('6.6 last_disconnect_shows_agent_empty_state', async ({ page }) => {
  289 |     const checkboxes = page.locator('input[type="checkbox"]');
  290 |     const cnt = await checkboxes.count();
  291 |     for (let i = 1; i < cnt; i++) {
  292 |         await checkboxes.nth(i).click({ force: true });
  293 |     }
  294 |     await page.getByRole('button', { name: /Disconnect selected/i }).click();
  295 |     await page.getByRole('button', { name: /Confirm|Disconnect/i }).last().click();
  296 |     await expect(page.locator('text=/empty|no agents/i')).toBeVisible();
  297 |   });
  298 |
  299 |   test('6.7 feed_filters_update_visible_events', async ({ page }) => {
  300 |     await page.getByRole('button', { name: /Error/i }).first().click();
  301 |     await expect(page.locator('.feed-item, [role="listitem"], ul li').first()).toContainText(/error/i);
  302 |   });
  303 |
  304 |   test('6.8 command_palette_preserves_workflow', async ({ page }) => {
  305 |     await page.keyboard.press('Meta+k');
```