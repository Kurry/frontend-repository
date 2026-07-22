# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.mjs >> Command Center E2E >> 14.9 undo_round_trip_restores_exports
- Location: e2e.spec.mjs:601:3

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
                  - strong [ref=e244]: 7/22/2026, 2:27:35 AM
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
                  - strong [ref=e312]: 7/22/2026, 2:20:07 AM
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
                  - strong [ref=e377]: 7/22/2026, 2:09:07 AM
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
                  - strong [ref=e447]: 7/22/2026, 1:45:07 AM
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
        - button "Close Connect agent dialog" [ref=e709] [cursor=pointer]:
          - img [ref=e710]
        - tooltip
    - generic [ref=e712]:
      - generic [ref=e713]:
        - generic [ref=e715]: Agent name
        - generic [ref=e717]:
          - textbox "Agent name" [active] [ref=e718]: Undo Export Agent 14.9
          - alert [ref=e719]
      - generic [ref=e721]:
        - generic [ref=e722]: Model
        - generic [ref=e723]:
          - combobox "Model" [invalid] [ref=e724] [cursor=pointer]:
            - option "Choose an allowed model" [disabled] [selected]
            - option "gpt-4.1"
            - option "claude-sonnet-4"
            - option "o3-mini"
            - option "gemini-2.5-pro"
          - img
          - img [ref=e725]
        - generic [ref=e728]: Model is required and must be one of the four allowed models.
      - generic [ref=e729]:
        - generic [ref=e730]:
          - generic [ref=e732]: Description (optional)
          - generic [ref=e733]:
            - textbox "Description (optional)" [ref=e734]:
              - /placeholder: ""
            - alert [ref=e735]
        - generic [ref=e736]: 0/280
      - generic [ref=e737]:
        - button "Cancel" [ref=e738] [cursor=pointer]
        - button "Connect agent" [disabled] [ref=e739]:
          - text: Connect agent
          - img [ref=e740]
```

# Test source

```ts
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
  529 |     await page.getByRole('button', { name: /Clear/i }).click();
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
> 604 |     await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();
      |                                                                                   ^ Error: locator.click: Test timeout of 30000ms exceeded.
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
  630 |
  631 |   test('15.4 empty_states_explain_next_step', async ({ page }) => {
  632 |     await page.getByRole('button', { name: /Connect agent/i }).first().click();
  633 |     await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();
  634 |     await expect(page.locator('[aria-invalid="true"]').first()).toBeVisible();
  635 |   });
  636 |
  637 |   test('15.8 success_messages_are_specific', async ({ page }) => {
  638 |     await page.getByRole('button', { name: /Connect agent/i }).first().click();
  639 |     await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();
  640 |     await expect(page.locator('[aria-invalid="true"]').first()).toBeVisible();
  641 |   });
  642 | });
  643 |
  644 | /*
  645 | // NOT-AUTOMATABLE: 2.1 — grid_composition_kpi_main_sidebar
  646 | // NOT-AUTOMATABLE: 2.2 — typography_hierarchy
  647 | // NOT-AUTOMATABLE: 2.3 — kpi_tile_accent_and_shared_anatomy
  648 | // NOT-AUTOMATABLE: 2.4 — consistent_status_chip_language
  649 | // NOT-AUTOMATABLE: 2.5 — focus_ring_and_danger_treatment
  650 | // NOT-AUTOMATABLE: 2.6 — single_icon_set_consistency
  651 | // NOT-AUTOMATABLE: 2.7 — night_theme_full_recolor
  652 | // NOT-AUTOMATABLE: 2.8 — responsive_reflow_and_wrap
  653 | // NOT-AUTOMATABLE: 2.9 — export_drawer_and_palette_anatomy
  654 | // NOT-AUTOMATABLE: 3.1 — prd_grid_composition_fidelity
  655 | // NOT-AUTOMATABLE: 3.2 — prd_kpi_tile_anatomy_fidelity
  656 | // NOT-AUTOMATABLE: 3.3 — prd_chip_language_fidelity
  657 | // NOT-AUTOMATABLE: 3.4 — prd_export_drawer_fidelity
  658 | // NOT-AUTOMATABLE: 3.5 — prd_palette_overlay_fidelity
  659 | // NOT-AUTOMATABLE: 3.6 — prd_night_theme_fidelity
  660 | // NOT-AUTOMATABLE: 3.7 — prd_danger_treatment_fidelity
  661 | // NOT-AUTOMATABLE: 3.8 — prd_typography_hierarchy_fidelity
  662 | // NOT-AUTOMATABLE: 3.9 — prd_icon_consistency_fidelity
  663 | // NOT-AUTOMATABLE: 3.10 — prd_detail_view_fidelity
  664 | // NOT-AUTOMATABLE: 4.1 — kpi_countup_on_fresh_load
  665 | // NOT-AUTOMATABLE: 4.2 — feed_item_slide_in_from_top
  666 | // NOT-AUTOMATABLE: 4.3 — step_status_transition_animation
  667 | // NOT-AUTOMATABLE: 4.4 — dialog_drawer_palette_enter_exit
  668 | // NOT-AUTOMATABLE: 4.5 — agent_row_animate_in_out
  669 | // NOT-AUTOMATABLE: 4.6 — hover_wash_system
  670 | // NOT-AUTOMATABLE: 4.7 — theme_recolor_transition
  671 | // NOT-AUTOMATABLE: 4.9 — export_drawer_motion
  672 | // NOT-AUTOMATABLE: 4.10 — running_agent_shows_step_progress_feedback
  673 | // NOT-AUTOMATABLE: 11.1 — export_summary_strip_bonus
  674 | // NOT-AUTOMATABLE: 11.3 — last_mutation_chip_bonus
  675 | // NOT-AUTOMATABLE: 11.4 — kpi_sparkline_extra_affordance
  676 | // NOT-AUTOMATABLE: 11.5 — palette_recent_commands_bonus
  677 | // NOT-AUTOMATABLE: 11.6 — operator_density_preferences_bonus
  678 | // NOT-AUTOMATABLE: 11.7 — ops_console_brand_polish_bonus
  679 | // NOT-AUTOMATABLE: 11.8 — theme_accent_customization_bonus
  680 | // NOT-AUTOMATABLE: 11.9 — print_or_share_session_bonus
  681 | // NOT-AUTOMATABLE: 11.10 — competition_level_ops_polish
  682 | // NOT-AUTOMATABLE: 15.1 — headings_use_consistent_capitalization
  683 | // NOT-AUTOMATABLE: 15.5 — body_copy_is_well_written
  684 | // NOT-AUTOMATABLE: 15.6 — terminology_is_consistent
  685 | // NOT-AUTOMATABLE: 15.7 — numbers_dates_and_units_consistent
  686 | // NOT-AUTOMATABLE: innovation.catchall — innovation_catchall
  687 | */
  688 |
```