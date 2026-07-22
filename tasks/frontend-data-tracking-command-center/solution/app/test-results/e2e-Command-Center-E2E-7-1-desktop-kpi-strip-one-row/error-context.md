# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.mjs >> Command Center E2E >> 7.1 desktop_kpi_strip_one_row
- Location: e2e.spec.mjs:358:3

# Error details

```
Error: expect(received).toBeLessThan(expected)

Expected: < 10
Received:   21
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
          - strong [ref=e68]: 2,175
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
          - strong [ref=e126]: 16,128
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
          - strong [ref=e156]: $3,759
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
                  - strong [ref=e244]: 7/22/2026, 2:19:54 AM
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
                  - strong [ref=e312]: 7/22/2026, 2:13:54 AM
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
                  - strong [ref=e377]: 7/22/2026, 2:02:54 AM
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
                  - strong [ref=e447]: 7/22/2026, 1:38:54 AM
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
```

# Test source

```ts
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
  306 |     await expect(page.getByRole('dialog')).toBeVisible();
  307 |     await page.keyboard.press('Escape');
  308 |     await expect(page.getByRole('dialog')).not.toBeVisible();
  309 |   });
  310 |
  311 |   test('6.9 overlays_support_connect_export_palette', async ({ page }) => {
  312 |     await page.getByRole('button', { name: /Connect agent/i }).first().click();
  313 |     await expect(page.getByRole('dialog')).toBeVisible();
  314 |     await page.keyboard.press('Meta+k');
  315 |     // It shouldn't crash
  316 |     await page.keyboard.press('Escape');
  317 |   });
  318 |
  319 |   test('6.10 retry_recovers_error_agent_without_reload', async ({ page }) => {
  320 |     const retryBtn = page.getByRole('button', { name: /Retry/i }).first();
  321 |     await retryBtn.click();
  322 |     await expect(retryBtn).not.toBeVisible();
  323 |   });
  324 |
  325 |   test('6.11 bulk_disconnect_flow', async ({ page }) => {
  326 |     await page.locator('input[type="checkbox"]').nth(1).click({ force: true });
  327 |     await page.locator('input[type="checkbox"]').nth(2).click({ force: true });
  328 |     await page.getByRole('button', { name: /Disconnect selected/i }).click();
  329 |     await page.getByRole('button', { name: /Confirm|Disconnect/i }).last().click();
  330 |   });
  331 |
  332 |   test('6.12 undo_after_connect_then_redo', async ({ page }) => {
  333 |     const initialRows = await page.locator('table tbody tr').count();
  334 |     await page.getByRole('button', { name: /Connect agent/i }).first().click();
  335 |     await page.locator('input#agent-name, input[name="name"], input[placeholder*="name" i]').first().fill('Undo Agent 6.12');
  336 |     await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();
  337 |
  338 |     await page.getByRole('button', { name: /Undo/i }).click();
  339 |     let rows = await page.locator('table tbody tr').count();
  340 |     expect(rows).toBe(initialRows);
  341 |
  342 |     await page.getByRole('button', { name: /Redo/i }).click();
  343 |     rows = await page.locator('table tbody tr').count();
  344 |     expect(rows).toBe(initialRows + 1);
  345 |   });
  346 |
  347 |   test('6.13 export_import_round_trip_flow', async ({ page }) => {
  348 |     await page.getByRole('button', { name: /Connect agent/i }).first().click();
  349 |     await page.locator('input#agent-name, input[name="name"], input[placeholder*="name" i]').first().fill('Round Trip 6.13');
  350 |     await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();
  351 |
  352 |     await page.keyboard.press('Escape');
  353 |     await page.getByRole('button', { name: /Export/i }).click({ force: true });
  354 |     await expect(page.locator('pre, code').first()).toContainText('Round Trip 6.13');
  355 |   });
  356 |
  357 |   // 7. Mobile
  358 |   test('7.1 desktop_kpi_strip_one_row', async ({ page }) => {
  359 |     await page.setViewportSize({ width: 1440, height: 900 });
  360 |     await page.goto('http://localhost:3000');
  361 |     const tiles = page.locator('.kpi-tile, [class*="kpi"]');
  362 |     const box1 = await tiles.nth(0).boundingBox();
  363 |     const box4 = await tiles.nth(3).boundingBox();
> 364 |     expect(Math.abs(box1.y - box4.y)).toBeLessThan(10);
      |                                       ^ Error: expect(received).toBeLessThan(expected)
  365 |   });
  366 |
  367 |   test('7.2 tablet_kpi_wrap_feed_stacks', async ({ page }) => {
  368 |     await page.setViewportSize({ width: 1023, height: 900 });
  369 |     await page.goto('http://localhost:3000');
  370 |     const tiles = page.locator('.kpi-tile, [class*="kpi"]');
  371 |     const box1 = await tiles.nth(0).boundingBox();
  372 |     const box4 = await tiles.nth(3).boundingBox();
  373 |     expect(box4.y).toBeGreaterThan(box1.y + 10);
  374 |   });
  375 |
  376 |   test('7.3 mobile_no_page_horizontal_scroll', async ({ page }) => {
  377 |     await page.setViewportSize({ width: 375, height: 667 });
  378 |     await page.goto('http://localhost:3000');
  379 |     const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  380 |     expect(scrollWidth).toBeLessThanOrEqual(375);
  381 |   });
  382 |
  383 |   test('7.4 suggestions_row_self_scrolls', async ({ page }) => {
  384 |     await page.setViewportSize({ width: 375, height: 667 });
  385 |     await page.goto('http://localhost:3000');
  386 |     const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  387 |     expect(scrollWidth).toBeLessThanOrEqual(375);
  388 |   });
  389 |
  390 |   test('7.5 export_drawer_usable_on_mobile', async ({ page }) => {
  391 |     await page.setViewportSize({ width: 375, height: 667 });
  392 |     await page.goto('http://localhost:3000');
  393 |     await page.getByRole('button', { name: /Export/i }).click();
  394 |     const dialog = page.getByRole('dialog');
  395 |     await expect(dialog).toBeVisible();
  396 |   });
  397 |
  398 |   test('7.6 command_palette_usable_on_mobile', async ({ page }) => {
  399 |     await page.setViewportSize({ width: 375, height: 667 });
  400 |     await page.goto('http://localhost:3000');
  401 |     await page.keyboard.press('Meta+k');
  402 |     await expect(page.getByRole('dialog')).toBeVisible();
  403 |   });
  404 |
  405 |   test('7.7 undo_redo_visible_on_mobile', async ({ page }) => {
  406 |     await page.setViewportSize({ width: 375, height: 667 });
  407 |     await page.goto('http://localhost:3000');
  408 |     await expect(page.getByRole('button', { name: /Undo/i })).toBeVisible();
  409 |     await expect(page.getByRole('button', { name: /Redo/i })).toBeVisible();
  410 |   });
  411 |
  412 |   test('7.8 connect_dialog_usable_on_mobile', async ({ page }) => {
  413 |     await page.setViewportSize({ width: 375, height: 667 });
  414 |     await page.goto('http://localhost:3000');
  415 |     await page.getByRole('button', { name: /Connect agent/i }).first().click();
  416 |     await expect(page.getByRole('dialog')).toBeVisible();
  417 |   });
  418 |
  419 |   test('7.9 agent_panel_readable_on_mobile', async ({ page }) => {
  420 |     await page.setViewportSize({ width: 375, height: 667 });
  421 |     await page.goto('http://localhost:3000');
  422 |     await expect(page.locator('table tbody tr').first()).toBeVisible();
  423 |   });
  424 |
  425 |   test('7.10 feed_readable_on_mobile', async ({ page }) => {
  426 |     await page.setViewportSize({ width: 375, height: 667 });
  427 |     await page.goto('http://localhost:3000');
  428 |     await expect(page.locator('ul li, [role="listitem"]').first()).toBeVisible();
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
```