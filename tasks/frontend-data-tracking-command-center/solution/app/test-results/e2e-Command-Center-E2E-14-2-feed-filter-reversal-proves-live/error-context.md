# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.mjs >> Command Center E2E >> 14.2 feed_filter_reversal_proves_live
- Location: e2e.spec.mjs:527:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /Clear/i })
    - locator resolved to <button disabled type="button" class="clear-filter">Clear filters</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
      - waiting 100ms
    54 × waiting for element to be visible, enabled and stable
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
                  - strong [ref=e244]: 7/22/2026, 2:24:26 AM
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
                  - strong [ref=e315]: 7/22/2026, 2:16:57 AM
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
              - button "VE Vector Evaluator o3-mini Run needs attention Last active 18m ago Error" [expanded] [active] [ref=e339] [cursor=pointer]:
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
            - generic [ref=e371]:
              - generic [ref=e372]:
                - generic [ref=e373]:
                  - generic [ref=e374]: Description
                  - strong [ref=e375]: Runs fast rubric-based evaluation suites.
                - generic [ref=e376]:
                  - generic [ref=e377]: Full agent name
                  - strong [ref=e378]: Vector Evaluator
                - generic [ref=e379]:
                  - generic [ref=e380]: Last active
                  - strong [ref=e381]: 7/22/2026, 2:05:57 AM
              - list "Vector Evaluator steps" [ref=e382]:
                - listitem [ref=e383]:
                  - img [ref=e385]
                  - generic [ref=e388]:
                    - strong [ref=e389]: Analyze repository context
                    - generic [ref=e390]: complete
                - listitem [ref=e391]:
                  - img [ref=e393]
                  - generic [ref=e396]:
                    - strong [ref=e397]: Draft prompt changes
                    - generic [ref=e398]: complete
                - listitem [ref=e399]:
                  - generic [ref=e400]: "3"
                  - generic [ref=e401]:
                    - strong [ref=e402]: Verify evaluation results
                    - generic [ref=e403]: pending
          - article [ref=e404]:
            - generic [ref=e405]:
              - generic [ref=e407]:
                - checkbox "Select Orbit Context Mapper" [ref=e408]
                - generic [ref=e410] [cursor=pointer]: Select Orbit Context Mapper
              - button "OR Orbit Context Mapper gemini-2.5-pro Ready for a task Last active 42m ago Idle" [ref=e411] [cursor=pointer]:
                - generic [ref=e412]: OR
                - generic [ref=e413]:
                  - strong [ref=e414]: Orbit Context Mapper
                  - generic [ref=e415]: gemini-2.5-pro
                - generic [ref=e416]:
                  - strong [ref=e417]: Ready for a task
                  - generic [ref=e418]: Last active 42m ago
                - generic "Idle" [ref=e420]
                - img [ref=e421]
              - generic [ref=e423]:
                - button "Run" [ref=e424] [cursor=pointer]:
                  - text: Run
                  - img [ref=e425]
                - generic [ref=e427]:
                  - button "Rename Orbit Context Mapper" [ref=e429] [cursor=pointer]:
                    - img [ref=e430]
                  - tooltip
                - generic [ref=e433]:
                  - button "Disconnect Orbit Context Mapper" [ref=e435] [cursor=pointer]:
                    - img [ref=e436]
                  - tooltip
            - generic [ref=e441]:
              - generic [ref=e442]:
                - generic [ref=e443]:
                  - generic [ref=e444]: Description
                  - strong [ref=e445]: Maps large codebases into compact working context.
                - generic [ref=e446]:
                  - generic [ref=e447]: Full agent name
                  - strong [ref=e448]: Orbit Context Mapper
                - generic [ref=e449]:
                  - generic [ref=e450]: Last active
                  - strong [ref=e451]: 7/22/2026, 1:41:57 AM
              - list [ref=e452]:
                - listitem [ref=e453]:
                  - generic [ref=e454]: "1"
                  - generic [ref=e455]:
                    - strong [ref=e456]: Analyze repository context
                    - generic [ref=e457]: pending
                - listitem [ref=e458]:
                  - generic [ref=e459]: "2"
                  - generic [ref=e460]:
                    - strong [ref=e461]: Draft prompt changes
                    - generic [ref=e462]: pending
                - listitem [ref=e463]:
                  - generic [ref=e464]: "3"
                  - generic [ref=e465]:
                    - strong [ref=e466]: Verify evaluation results
                    - generic [ref=e467]: pending
      - region "Activity feed" [ref=e468]:
        - generic [ref=e469]:
          - generic [ref=e470]:
            - paragraph [ref=e471]: Session pulse
            - heading "Activity feed" [level=2] [ref=e472]
            - paragraph [ref=e473]: 14 of 14 events visible
          - button "Simulate activity" [ref=e474] [cursor=pointer]:
            - text: Simulate activity
            - img [ref=e475]
        - generic "Feed suggestions" [ref=e477]:
          - button "Show errors only" [ref=e478] [cursor=pointer]:
            - img [ref=e479]
            - text: Show errors only
          - button "Show agent events" [ref=e481] [cursor=pointer]:
            - img [ref=e482]
            - text: Show agent events
          - button "Show evaluations" [ref=e484] [cursor=pointer]:
            - img [ref=e485]
            - text: Show evaluations
          - button "Show prompt changes" [ref=e487] [cursor=pointer]:
            - img [ref=e488]
            - text: Show prompt changes
        - generic "Activity filters" [ref=e490]:
          - img [ref=e491]
          - button "Prompt" [ref=e493] [cursor=pointer]
          - button "Evaluation" [ref=e494] [cursor=pointer]
          - button "Agent" [ref=e495] [cursor=pointer]
          - button "Errors" [ref=e496] [cursor=pointer]
          - button "Clear filters" [disabled] [ref=e497]
        - generic "Recent activity events" [ref=e499]:
          - generic [ref=e500]:
            - button "Nova Refactor started a repository analysis run Info agent 1m ago" [ref=e501] [cursor=pointer]:
              - img [ref=e503]
              - generic [ref=e505]:
                - generic [ref=e506]: Nova Refactor started a repository analysis run
                - generic [ref=e507]:
                  - generic "Info" [ref=e509]
                  - generic [ref=e510]: agent
                  - img [ref=e511]
                  - time [ref=e514]: 1m ago
            - button "Safety rubric evaluation finished at 96.4% Success evaluation 4m ago" [ref=e515] [cursor=pointer]:
              - img [ref=e517]
              - generic [ref=e519]:
                - generic [ref=e520]: Safety rubric evaluation finished at 96.4%
                - generic [ref=e521]:
                  - generic "Success" [ref=e523]
                  - generic [ref=e524]: evaluation
                  - img [ref=e525]
                  - time [ref=e528]: 4m ago
            - button "Customer-support system prompt was created Success prompt 7m ago" [ref=e529] [cursor=pointer]:
              - img [ref=e531]
              - generic [ref=e535]:
                - generic [ref=e536]: Customer-support system prompt was created
                - generic [ref=e537]:
                  - generic "Success" [ref=e539]
                  - generic [ref=e540]: prompt
                  - img [ref=e541]
                  - time [ref=e544]: 7m ago
            - button "Vector Evaluator encountered a context window error Error agent 18m ago" [ref=e545] [cursor=pointer]:
              - img [ref=e547]
              - generic [ref=e549]:
                - generic [ref=e550]: Vector Evaluator encountered a context window error
                - generic [ref=e551]:
                  - generic "Error" [ref=e553]
                  - generic [ref=e554]: agent
                  - img [ref=e555]
                  - time [ref=e558]: 18m ago
            - button "Hallucination benchmark finished with 42 cases Success evaluation 27m ago" [ref=e559] [cursor=pointer]:
              - img [ref=e561]
              - generic [ref=e563]:
                - generic [ref=e564]: Hallucination benchmark finished with 42 cases
                - generic [ref=e565]:
                  - generic "Success" [ref=e567]
                  - generic [ref=e568]: evaluation
                  - img [ref=e569]
                  - time [ref=e572]: 27m ago
            - button "Sentry Reviewer completed a policy review Success agent 39m ago" [ref=e573] [cursor=pointer]:
              - img [ref=e575]
              - generic [ref=e577]:
                - generic [ref=e578]: Sentry Reviewer completed a policy review
                - generic [ref=e579]:
                  - generic "Success" [ref=e581]
                  - generic [ref=e582]: agent
                  - img [ref=e583]
                  - time [ref=e586]: 39m ago
            - button "Code migration prompt was revised Info prompt 51m ago" [ref=e587] [cursor=pointer]:
              - img [ref=e589]
              - generic [ref=e593]:
                - generic [ref=e594]: Code migration prompt was revised
                - generic [ref=e595]:
                  - generic "Info" [ref=e597]
                  - generic [ref=e598]: prompt
                  - img [ref=e599]
                  - time [ref=e602]: 51m ago
            - button "Tool-use evaluation finished at 91.8% Success evaluation 1h ago" [ref=e603] [cursor=pointer]:
              - img [ref=e605]
              - generic [ref=e607]:
                - generic [ref=e608]: Tool-use evaluation finished at 91.8%
                - generic [ref=e609]:
                  - generic "Success" [ref=e611]
                  - generic [ref=e612]: evaluation
                  - img [ref=e613]
                  - time [ref=e616]: 1h ago
            - button "Orbit Context Mapper connected to the workspace Info agent 1h ago" [ref=e617] [cursor=pointer]:
              - img [ref=e619]
              - generic [ref=e621]:
                - generic [ref=e622]: Orbit Context Mapper connected to the workspace
                - generic [ref=e623]:
                  - generic "Info" [ref=e625]
                  - generic [ref=e626]: agent
                  - img [ref=e627]
                  - time [ref=e630]: 1h ago
            - button "Retrieval grounding prompt was created Success prompt 2h ago" [ref=e631] [cursor=pointer]:
              - img [ref=e633]
              - generic [ref=e637]:
                - generic [ref=e638]: Retrieval grounding prompt was created
                - generic [ref=e639]:
                  - generic "Success" [ref=e641]
                  - generic [ref=e642]: prompt
                  - img [ref=e643]
                  - time [ref=e646]: 2h ago
            - button "Monthly evaluation cost checkpoint completed Info evaluation 3h ago" [ref=e647] [cursor=pointer]:
              - img [ref=e649]
              - generic [ref=e651]:
                - generic [ref=e652]: Monthly evaluation cost checkpoint completed
                - generic [ref=e653]:
                  - generic "Info" [ref=e655]
                  - generic [ref=e656]: evaluation
                  - img [ref=e657]
                  - time [ref=e660]: 3h ago
            - button "Nova Refactor completed step Analyze repository context Success agent 5h ago" [ref=e661] [cursor=pointer]:
              - img [ref=e663]
              - generic [ref=e665]:
                - generic [ref=e666]: Nova Refactor completed step Analyze repository context
                - generic [ref=e667]:
                  - generic "Success" [ref=e669]
                  - generic [ref=e670]: agent
                  - img [ref=e671]
                  - time [ref=e674]: 5h ago
            - button "Incident response prompt was archived Info prompt 7h ago" [ref=e675] [cursor=pointer]:
              - img [ref=e677]
              - generic [ref=e681]:
                - generic [ref=e682]: Incident response prompt was archived
                - generic [ref=e683]:
                  - generic "Info" [ref=e685]
                  - generic [ref=e686]: prompt
                  - img [ref=e687]
                  - time [ref=e690]: 7h ago
            - button "Agent handoff benchmark reported one error Error evaluation 10h ago" [ref=e691] [cursor=pointer]:
              - img [ref=e693]
              - generic [ref=e695]:
                - generic [ref=e696]: Agent handoff benchmark reported one error
                - generic [ref=e697]:
                  - generic "Error" [ref=e699]
                  - generic [ref=e700]: evaluation
                  - img [ref=e701]
                  - time [ref=e704]: 10h ago
```

# Test source

```ts
  429 |   });
  430 |
  431 |   // 9. Perf
  432 |   test('9.1 interactive_within_two_seconds', async ({ page }) => {
  433 |     await expect(page.locator('body')).toBeVisible();
  434 |   });
  435 |
  436 |   test('9.2 console_clean_on_load', async ({ page }) => {
  437 |     let errors = 0;
  438 |     page.on('console', msg => { if (msg.type() === 'error') errors++; });
  439 |     page.on('pageerror', () => errors++);
  440 |     await page.goto('http://localhost:3000');
  441 |     await page.waitForLoadState('networkidle');
  442 |     expect(errors).toBe(0);
  443 |   });
  444 |
  445 |   test('9.3 console_clean_during_exercise', async ({ page }) => {
  446 |     let errors = 0;
  447 |     page.on('console', msg => { if (msg.type() === 'error') errors++; });
  448 |     page.on('pageerror', () => errors++);
  449 |     await page.goto('http://localhost:3000');
  450 |     await page.getByRole('button', { name: /Connect agent/i }).first().click();
  451 |     await page.keyboard.press('Escape');
  452 |     expect(errors).toBe(0);
  453 |   });
  454 |
  455 |   test('9.4 rapid_simulate_stays_responsive', async ({ page }) => {
  456 |     const simBtn = page.getByRole('button', { name: /Simulate activity/i });
  457 |     for(let i=0; i<5; i++){ await simBtn.click(); }
  458 |     await expect(page.locator('ul li, [role="listitem"]').first()).toBeVisible();
  459 |   });
  460 |
  461 |   test('9.5 rapid_filter_toggles_stay_responsive', async ({ page }) => {
  462 |     const errorBtn = page.getByRole('button', { name: /Error/i }).first();
  463 |     for(let i=0; i<5; i++){ await errorBtn.click(); }
  464 |     await expect(page.locator('ul li, [role="listitem"]').first()).toBeVisible();
  465 |   });
  466 |
  467 |   test('9.6 export_tab_switch_no_freeze', async ({ page }) => {
  468 |     await page.getByRole('button', { name: /Export/i }).click();
  469 |     await page.getByRole('tab', { name: /CSV/i }).click();
  470 |     await expect(page.locator('pre, code').first()).toBeVisible();
  471 |   });
  472 |
  473 |   test('9.7 palette_filter_stays_snappy', async ({ page }) => {
  474 |     await page.keyboard.press('Meta+k');
  475 |     await page.keyboard.type('test');
  476 |     await expect(page.getByRole('dialog')).toBeVisible();
  477 |   });
  478 |
  479 |   test('9.8 undo_redo_stays_responsive', async ({ page }) => {
  480 |     await page.getByRole('button', { name: /Connect agent/i }).first().click();
  481 |     await page.locator('input#agent-name, input[name="name"], input[placeholder*="name" i]').first().fill('Resp Agent');
  482 |     await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();
  483 |
  484 |     await page.getByRole('button', { name: /Undo/i }).click();
  485 |     await expect(page.locator('table tbody tr').first()).toBeVisible();
  486 |   });
  487 |
  488 |   test('9.9 detail_navigation_no_jank', async ({ page }) => {
  489 |     await page.locator('.kpi-tile, [class*="kpi"]').first().click();
  490 |     await page.getByRole('button', { name: /Back/i }).click();
  491 |     await expect(page.locator('table tbody tr').first()).toBeVisible();
  492 |   });
  493 |
  494 |   test('9.10 bulk_disconnect_no_hang', async ({ page }) => {
  495 |     await page.locator('input[type="checkbox"]').nth(1).click({ force: true });
  496 |     await page.locator('input[type="checkbox"]').nth(2).click({ force: true });
  497 |     await page.getByRole('button', { name: /Disconnect selected/i }).click();
  498 |     await page.getByRole('button', { name: /Confirm|Disconnect/i }).last().click();
  499 |     await expect(page.locator('table tbody tr').first()).toBeVisible();
  500 |   });
  501 |
  502 |   // 11. Bonus
  503 |   test('11.2 undo_redo_keyboard_shortcuts_bonus', async ({ page }) => {
  504 |     const initialRows = await page.locator('table tbody tr').count();
  505 |     await page.getByRole('button', { name: /Connect agent/i }).first().click();
  506 |     await page.locator('input#agent-name, input[name="name"], input[placeholder*="name" i]').first().fill('Shortcut Agent');
  507 |     await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();
  508 |
  509 |     const connectedRows = await page.locator('table tbody tr').count();
  510 |     expect(connectedRows).toBe(initialRows + 1);
  511 |
  512 |     await page.keyboard.press('Meta+z');
  513 |     const undoRows = await page.locator('table tbody tr').count();
  514 |     expect(undoRows).toBeLessThanOrEqual(connectedRows);
  515 |   });
  516 |
  517 |   // 14. Integrity
  518 |   test('14.1 multi_facet_reload_resets_seeded', async ({ page }) => {
  519 |     await page.getByRole('button', { name: /Connect agent/i }).first().click();
  520 |     await page.locator('input#agent-name, input[name="name"], input[placeholder*="name" i]').first().fill('Reload Agent 14.1');
  521 |     await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();
  522 |
  523 |     await page.reload();
  524 |     await expect(page.locator('body')).not.toContainText('Reload Agent 14.1');
  525 |   });
  526 |
  527 |   test('14.2 feed_filter_reversal_proves_live', async ({ page }) => {
  528 |     await page.getByRole('button', { name: /Error/i }).first().click();
> 529 |     await page.getByRole('button', { name: /Clear/i }).click();
      |                                                        ^ Error: locator.click: Test timeout of 30000ms exceeded.
  530 |     await page.getByRole('button', { name: /Error/i }).first().click();
  531 |     await expect(page.locator('.feed-item, [role="listitem"], ul li').first()).toContainText(/error/i);
  532 |   });
  533 |
  534 |   test('14.3 export_preview_tracks_agent_mutations', async ({ page }) => {
  535 |     await page.getByRole('button', { name: /Connect agent/i }).first().click();
  536 |     await page.locator('input#agent-name, input[name="name"], input[placeholder*="name" i]').first().fill('Probe Alpha');
  537 |     await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();
  538 |
  539 |     await page.keyboard.press('Escape');
  540 |     await page.getByRole('button', { name: /Export/i }).click({ force: true });
  541 |     await expect(page.locator('pre, code').first()).toContainText('Probe Alpha');
  542 |   });
  543 |
  544 |   test('14.4 rename_echoes_panel_feed_export', async ({ page }) => {
  545 |     await page.locator('table tbody tr [aria-haspopup="true"], table tbody tr [aria-label*="menu"]').first().click();
  546 |     await page.getByRole('menuitem', { name: /Rename/i }).click();
  547 |     await page.locator('input[type="text"]').last().fill('Echo Agent 14.4');
  548 |     await page.getByRole('button', { name: /Rename|Save/i }).click();
  549 |
  550 |     await page.getByRole('button', { name: /Export/i }).click({ force: true });
  551 |     await expect(page.locator('pre, code').first()).toContainText('Echo Agent 14.4');
  552 |   });
  553 |
  554 |   test('14.5 connect_count_delta_is_exact', async ({ page }) => {
  555 |     const initialRows = await page.locator('table tbody tr').count();
  556 |     await page.getByRole('button', { name: /Connect agent/i }).first().click();
  557 |     await page.locator('input#agent-name, input[name="name"], input[placeholder*="name" i]').first().fill('Delta Agent');
  558 |     await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();
  559 |
  560 |     const newRows = await page.locator('table tbody tr').count();
  561 |     expect(newRows - initialRows).toBe(1);
  562 |   });
  563 |
  564 |   test('14.6 different_agent_names_change_exports', async ({ page }) => {
  565 |     await page.getByRole('button', { name: /Connect agent/i }).first().click();
  566 |     await page.locator('input#agent-name, input[name="name"], input[placeholder*="name" i]').first().fill('Agent One');
  567 |     await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();
  568 |
  569 |     await page.getByRole('button', { name: /Connect agent/i }).first().click();
  570 |     await page.locator('input#agent-name, input[name="name"], input[placeholder*="name" i]').first().fill('Agent Two');
  571 |     await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();
  572 |
  573 |     await page.keyboard.press('Escape');
  574 |     await page.getByRole('button', { name: /Export/i }).click({ force: true });
  575 |     await expect(page.locator('pre, code').first()).toContainText('Agent One');
  576 |     await expect(page.locator('pre, code').first()).toContainText('Agent Two');
  577 |   });
  578 |
  579 |   test('14.7 interleaved_connect_and_detail_views', async ({ page }) => {
  580 |     await page.getByRole('button', { name: /Connect agent/i }).first().click();
  581 |     await page.keyboard.press('Escape');
  582 |     await page.locator('.kpi-tile, [class*="kpi"]').first().click();
  583 |     await expect(page.locator('body')).toBeVisible();
  584 |   });
  585 |
  586 |   test('14.8 empty_agents_then_reconnect_tracks_kpi', async ({ page }) => {
  587 |     const checkboxes = page.locator('input[type="checkbox"]');
  588 |     const cnt = await checkboxes.count();
  589 |     for (let i = 1; i < cnt; i++) {
  590 |         await checkboxes.nth(i).click({ force: true });
  591 |     }
  592 |     await page.getByRole('button', { name: /Disconnect selected/i }).click();
  593 |     await page.getByRole('button', { name: /Confirm|Disconnect/i }).last().click();
  594 |
  595 |     await page.getByRole('button', { name: /Connect agent/i }).first().click();
  596 |     await page.locator('input#agent-name, input[name="name"], input[placeholder*="name" i]').first().fill('Reconnect Agent 14.8');
  597 |     await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();
  598 |     await expect(page.locator('table tbody tr').first()).toBeVisible();
  599 |   });
  600 |
  601 |   test('14.9 undo_round_trip_restores_exports', async ({ page }) => {
  602 |     await page.getByRole('button', { name: /Connect agent/i }).first().click();
  603 |     await page.locator('input#agent-name, input[name="name"], input[placeholder*="name" i]').first().fill('Undo Export Agent 14.9');
  604 |     await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();
  605 |
  606 |     await page.getByRole('button', { name: /Undo/i }).click();
  607 |     await page.keyboard.press('Escape');
  608 |     await page.getByRole('button', { name: /Export/i }).click({ force: true });
  609 |     await expect(page.locator('pre, code').first()).not.toContainText('Undo Export Agent 14.9');
  610 |   });
  611 |
  612 |   test('14.10 export_import_pipeline_end_state', async ({ page }) => {
  613 |     await page.getByRole('button', { name: /Connect agent/i }).first().click();
  614 |     await page.locator('input#agent-name, input[name="name"], input[placeholder*="name" i]').first().fill('Pipeline Agent 14.10');
  615 |     await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();
  616 |     await expect(page.locator('table tbody tr').first()).toBeVisible();
  617 |   });
  618 |
  619 |   // 15. Writing
  620 |   test('15.2 actions_use_specific_labels', async ({ page }) => {
  621 |     await page.getByRole('button', { name: /Connect agent/i }).first().click();
  622 |     await expect(page.getByRole('button', { name: 'Connect agent', exact: true }).last()).toBeVisible();
  623 |   });
  624 |
  625 |   test('15.3 errors_name_field_and_rule', async ({ page }) => {
  626 |     await page.getByRole('button', { name: /Connect agent/i }).first().click();
  627 |     await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();
  628 |     await expect(page.locator('[aria-invalid="true"]').first()).toBeVisible();
  629 |   });
```