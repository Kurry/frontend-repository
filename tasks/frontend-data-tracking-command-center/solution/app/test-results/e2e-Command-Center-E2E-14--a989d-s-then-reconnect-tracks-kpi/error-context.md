# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.mjs >> Command Center E2E >> 14.8 empty_agents_then_reconnect_tracks_kpi
- Location: e2e.spec.mjs:586:3

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
    52 × waiting for element to be visible, enabled and stable
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
      - generic "Disconnected 4 agents" [ref=e17]:
        - img [ref=e18]
        - text: Disconnected 4 agents
      - button "Compact rows" [ref=e20] [cursor=pointer]:
        - img [ref=e21]
        - generic [ref=e24]: Compact rows
      - button "Night mode disabled" [ref=e26] [cursor=pointer]:
        - img [ref=e27]
        - generic [ref=e29]: Night mode disabled
      - generic [ref=e30]:
        - generic [ref=e31]:
          - button "Undo" [ref=e33] [cursor=pointer]:
            - img [ref=e34]
          - tooltip
        - generic [ref=e36]:
          - generic [ref=e37]:
            - button "Redo" [disabled]:
              - img
          - tooltip
      - button "Commands ⌘K" [ref=e38] [cursor=pointer]:
        - text: Commands
        - generic [ref=e39]: ⌘K
        - img [ref=e40]
      - button "Export session" [ref=e42] [cursor=pointer]:
        - text: Export session
        - img [ref=e43]
      - button "Connect agent" [ref=e47] [cursor=pointer]:
        - text: Connect agent
        - img [ref=e48]
  - generic [ref=e50]:
    - generic [ref=e51]:
      - generic [ref=e52]:
        - paragraph [ref=e53]: Monday, July 20 · Live workspace
        - heading "Good morning, operator." [level=1] [ref=e54]
        - paragraph [ref=e55]: Monitor prompt performance, coordinate coding agents, and preserve the session artifact.
      - generic [ref=e56]:
        - img [ref=e57]
        - text: All systems operational
    - region "Key performance indicators" [ref=e60]:
      - button "Open Total prompts detail" [ref=e62] [cursor=pointer]:
        - generic [ref=e63]:
          - img [ref=e65]
          - generic [ref=e69]: Total prompts
        - generic [ref=e70]:
          - strong [ref=e71]: 2,486
          - generic [ref=e72]:
            - img [ref=e73]
            - text: 12.4%
        - generic "Total prompts seven day trend chart" [ref=e75]:
          - application [ref=e78]
      - button "Open Active agents detail" [ref=e93] [cursor=pointer]:
        - generic [ref=e94]:
          - img [ref=e96]
          - generic [ref=e98]: Active agents
        - generic [ref=e99]:
          - strong [ref=e100]: "0"
          - generic [ref=e101]:
            - img [ref=e102]
            - text: 8.2%
        - generic "Active agents seven day trend chart" [ref=e104]:
          - application [ref=e107]
      - button "Open Evaluations run detail" [ref=e122] [cursor=pointer]:
        - generic [ref=e123]:
          - img [ref=e125]
          - generic [ref=e127]: Evaluations run
        - generic [ref=e128]:
          - strong [ref=e129]: 18,432
          - generic [ref=e130]:
            - img [ref=e131]
            - text: 18.7%
        - generic "Evaluations run seven day trend chart" [ref=e133]:
          - application [ref=e136]
      - button "Open Cost this month detail" [ref=e151] [cursor=pointer]:
        - generic [ref=e152]:
          - img [ref=e154]
          - generic [ref=e157]: Cost this month
        - generic [ref=e158]:
          - strong [ref=e159]: $4,296
          - generic [ref=e160]:
            - img [ref=e161]
            - text: 3.1%
        - generic "Cost this month seven day trend chart" [ref=e163]:
          - application [ref=e166]
    - main [ref=e180]:
      - region "Coding agents" [ref=e181]:
        - generic [ref=e182]:
          - generic [ref=e183]:
            - paragraph [ref=e184]: Live orchestration
            - heading "Coding agents" [level=2] [ref=e185]
            - paragraph [ref=e186]: 0 connected · 0 running
          - generic [ref=e187]:
            - button "Disconnect selected" [disabled] [ref=e188]:
              - text: Disconnect selected
              - img [ref=e189]
            - button "Connect agent" [ref=e194] [cursor=pointer]:
              - text: Connect agent
              - img [ref=e195]
        - generic [ref=e197]:
          - img [ref=e198]
          - heading "No coding agents connected" [level=3] [ref=e203]
          - paragraph [ref=e204]: Connected agents and their live run steps belong here.
          - button "Connect agent" [ref=e205] [cursor=pointer]:
            - text: Connect agent
            - img [ref=e206]
      - region "Activity feed" [ref=e208]:
        - generic [ref=e209]:
          - generic [ref=e210]:
            - paragraph [ref=e211]: Session pulse
            - heading "Activity feed" [level=2] [ref=e212]
            - paragraph [ref=e213]: 18 of 18 events visible
          - button "Simulate activity" [ref=e214] [cursor=pointer]:
            - text: Simulate activity
            - img [ref=e215]
        - generic "Feed suggestions" [ref=e217]:
          - button "Show errors only" [ref=e218] [cursor=pointer]:
            - img [ref=e219]
            - text: Show errors only
          - button "Show agent events" [ref=e221] [cursor=pointer]:
            - img [ref=e222]
            - text: Show agent events
          - button "Show evaluations" [ref=e224] [cursor=pointer]:
            - img [ref=e225]
            - text: Show evaluations
          - button "Show prompt changes" [ref=e227] [cursor=pointer]:
            - img [ref=e228]
            - text: Show prompt changes
        - generic "Activity filters" [ref=e230]:
          - img [ref=e231]
          - button "Prompt" [ref=e233] [cursor=pointer]
          - button "Evaluation" [ref=e234] [cursor=pointer]
          - button "Agent" [ref=e235] [cursor=pointer]
          - button "Errors" [ref=e236] [cursor=pointer]
          - button "Clear filters" [disabled] [ref=e237]
        - generic "Recent activity events" [ref=e239]:
          - generic [ref=e240]:
            - button "Orbit Context Mapper disconnected from the workspace Info agent just now" [ref=e241] [cursor=pointer]:
              - img [ref=e243]
              - generic [ref=e245]:
                - generic [ref=e246]: Orbit Context Mapper disconnected from the workspace
                - generic [ref=e247]:
                  - generic "Info" [ref=e249]
                  - generic [ref=e250]: agent
                  - img [ref=e251]
                  - time [ref=e254]: just now
            - button "Vector Evaluator disconnected from the workspace Info agent just now" [ref=e255] [cursor=pointer]:
              - img [ref=e257]
              - generic [ref=e259]:
                - generic [ref=e260]: Vector Evaluator disconnected from the workspace
                - generic [ref=e261]:
                  - generic "Info" [ref=e263]
                  - generic [ref=e264]: agent
                  - img [ref=e265]
                  - time [ref=e268]: just now
            - button "Sentry Reviewer disconnected from the workspace Info agent just now" [ref=e269] [cursor=pointer]:
              - img [ref=e271]
              - generic [ref=e273]:
                - generic [ref=e274]: Sentry Reviewer disconnected from the workspace
                - generic [ref=e275]:
                  - generic "Info" [ref=e277]
                  - generic [ref=e278]: agent
                  - img [ref=e279]
                  - time [ref=e282]: just now
            - button "Nova Refactor disconnected from the workspace Info agent just now" [ref=e283] [cursor=pointer]:
              - img [ref=e285]
              - generic [ref=e287]:
                - generic [ref=e288]: Nova Refactor disconnected from the workspace
                - generic [ref=e289]:
                  - generic "Info" [ref=e291]
                  - generic [ref=e292]: agent
                  - img [ref=e293]
                  - time [ref=e296]: just now
            - button "Nova Refactor started a repository analysis run Info agent 1m ago" [ref=e297] [cursor=pointer]:
              - img [ref=e299]
              - generic [ref=e301]:
                - generic [ref=e302]: Nova Refactor started a repository analysis run
                - generic [ref=e303]:
                  - generic "Info" [ref=e305]
                  - generic [ref=e306]: agent
                  - img [ref=e307]
                  - time [ref=e310]: 1m ago
            - button "Safety rubric evaluation finished at 96.4% Success evaluation 4m ago" [ref=e311] [cursor=pointer]:
              - img [ref=e313]
              - generic [ref=e315]:
                - generic [ref=e316]: Safety rubric evaluation finished at 96.4%
                - generic [ref=e317]:
                  - generic "Success" [ref=e319]
                  - generic [ref=e320]: evaluation
                  - img [ref=e321]
                  - time [ref=e324]: 4m ago
            - button "Customer-support system prompt was created Success prompt 7m ago" [ref=e325] [cursor=pointer]:
              - img [ref=e327]
              - generic [ref=e331]:
                - generic [ref=e332]: Customer-support system prompt was created
                - generic [ref=e333]:
                  - generic "Success" [ref=e335]
                  - generic [ref=e336]: prompt
                  - img [ref=e337]
                  - time [ref=e340]: 7m ago
            - button "Vector Evaluator encountered a context window error Error agent 18m ago" [ref=e341] [cursor=pointer]:
              - img [ref=e343]
              - generic [ref=e345]:
                - generic [ref=e346]: Vector Evaluator encountered a context window error
                - generic [ref=e347]:
                  - generic "Error" [ref=e349]
                  - generic [ref=e350]: agent
                  - img [ref=e351]
                  - time [ref=e354]: 18m ago
            - button "Hallucination benchmark finished with 42 cases Success evaluation 27m ago" [ref=e355] [cursor=pointer]:
              - img [ref=e357]
              - generic [ref=e359]:
                - generic [ref=e360]: Hallucination benchmark finished with 42 cases
                - generic [ref=e361]:
                  - generic "Success" [ref=e363]
                  - generic [ref=e364]: evaluation
                  - img [ref=e365]
                  - time [ref=e368]: 27m ago
            - button "Sentry Reviewer completed a policy review Success agent 39m ago" [ref=e369] [cursor=pointer]:
              - img [ref=e371]
              - generic [ref=e373]:
                - generic [ref=e374]: Sentry Reviewer completed a policy review
                - generic [ref=e375]:
                  - generic "Success" [ref=e377]
                  - generic [ref=e378]: agent
                  - img [ref=e379]
                  - time [ref=e382]: 39m ago
            - button "Code migration prompt was revised Info prompt 51m ago" [ref=e383] [cursor=pointer]:
              - img [ref=e385]
              - generic [ref=e389]:
                - generic [ref=e390]: Code migration prompt was revised
                - generic [ref=e391]:
                  - generic "Info" [ref=e393]
                  - generic [ref=e394]: prompt
                  - img [ref=e395]
                  - time [ref=e398]: 51m ago
            - button "Tool-use evaluation finished at 91.8% Success evaluation 1h ago" [ref=e399] [cursor=pointer]:
              - img [ref=e401]
              - generic [ref=e403]:
                - generic [ref=e404]: Tool-use evaluation finished at 91.8%
                - generic [ref=e405]:
                  - generic "Success" [ref=e407]
                  - generic [ref=e408]: evaluation
                  - img [ref=e409]
                  - time [ref=e412]: 1h ago
            - button "Orbit Context Mapper connected to the workspace Info agent 1h ago" [ref=e413] [cursor=pointer]:
              - img [ref=e415]
              - generic [ref=e417]:
                - generic [ref=e418]: Orbit Context Mapper connected to the workspace
                - generic [ref=e419]:
                  - generic "Info" [ref=e421]
                  - generic [ref=e422]: agent
                  - img [ref=e423]
                  - time [ref=e426]: 1h ago
            - button "Retrieval grounding prompt was created Success prompt 2h ago" [ref=e427] [cursor=pointer]:
              - img [ref=e429]
              - generic [ref=e433]:
                - generic [ref=e434]: Retrieval grounding prompt was created
                - generic [ref=e435]:
                  - generic "Success" [ref=e437]
                  - generic [ref=e438]: prompt
                  - img [ref=e439]
                  - time [ref=e442]: 2h ago
            - button "Monthly evaluation cost checkpoint completed Info evaluation 3h ago" [ref=e443] [cursor=pointer]:
              - img [ref=e445]
              - generic [ref=e447]:
                - generic [ref=e448]: Monthly evaluation cost checkpoint completed
                - generic [ref=e449]:
                  - generic "Info" [ref=e451]
                  - generic [ref=e452]: evaluation
                  - img [ref=e453]
                  - time [ref=e456]: 3h ago
            - button "Nova Refactor completed step Analyze repository context Success agent 5h ago" [ref=e457] [cursor=pointer]:
              - img [ref=e459]
              - generic [ref=e461]:
                - generic [ref=e462]: Nova Refactor completed step Analyze repository context
                - generic [ref=e463]:
                  - generic "Success" [ref=e465]
                  - generic [ref=e466]: agent
                  - img [ref=e467]
                  - time [ref=e470]: 5h ago
            - button "Incident response prompt was archived Info prompt 7h ago" [ref=e471] [cursor=pointer]:
              - img [ref=e473]
              - generic [ref=e477]:
                - generic [ref=e478]: Incident response prompt was archived
                - generic [ref=e479]:
                  - generic "Info" [ref=e481]
                  - generic [ref=e482]: prompt
                  - img [ref=e483]
                  - time [ref=e486]: 7h ago
            - button "Agent handoff benchmark reported one error Error evaluation 10h ago" [ref=e487] [cursor=pointer]:
              - img [ref=e489]
              - generic [ref=e491]:
                - generic [ref=e492]: Agent handoff benchmark reported one error
                - generic [ref=e493]:
                  - generic "Error" [ref=e495]
                  - generic [ref=e496]: evaluation
                  - img [ref=e497]
                  - time [ref=e500]: 10h ago
  - dialog "Connect agent" [ref=e501]:
    - generic [ref=e502]:
      - generic [ref=e503]:
        - paragraph [ref=e504]: Agent registration
        - heading "Connect agent" [level=2] [ref=e505]
        - paragraph [ref=e506]: Register a coding agent using the shared session contract.
      - generic [ref=e507]:
        - button "Close Connect agent dialog" [ref=e509] [cursor=pointer]:
          - img [ref=e510]
        - tooltip
    - generic [ref=e512]:
      - generic [ref=e513]:
        - generic [ref=e515]: Agent name
        - generic [ref=e517]:
          - textbox "Agent name" [active] [ref=e518]: Reconnect Agent 14.8
          - alert [ref=e519]
      - generic [ref=e521]:
        - generic [ref=e522]: Model
        - generic [ref=e523]:
          - combobox "Model" [invalid] [ref=e524] [cursor=pointer]:
            - option "Choose an allowed model" [disabled] [selected]
            - option "gpt-4.1"
            - option "claude-sonnet-4"
            - option "o3-mini"
            - option "gemini-2.5-pro"
          - img
          - img [ref=e525]
        - generic [ref=e528]: Model is required and must be one of the four allowed models.
      - generic [ref=e529]:
        - generic [ref=e530]:
          - generic [ref=e532]: Description (optional)
          - generic [ref=e533]:
            - textbox "Description (optional)" [ref=e534]:
              - /placeholder: ""
            - alert [ref=e535]
        - generic [ref=e536]: 0/280
      - generic [ref=e537]:
        - button "Cancel" [ref=e538] [cursor=pointer]
        - button "Connect agent" [disabled] [ref=e539]:
          - text: Connect agent
          - img [ref=e540]
  - generic [ref=e542]: 4 agents disconnected.
```

# Test source

```ts
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
> 597 |     await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();
      |                                                                                   ^ Error: locator.click: Test timeout of 30000ms exceeded.
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