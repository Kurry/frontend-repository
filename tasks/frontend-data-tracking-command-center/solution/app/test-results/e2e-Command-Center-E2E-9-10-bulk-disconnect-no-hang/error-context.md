# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.mjs >> Command Center E2E >> 9.10 bulk_disconnect_no_hang
- Location: e2e.spec.mjs:494:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('table tbody tr').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('table tbody tr').first()

```

```yaml
- banner:
  - strong: PromptOps
  - text: Command center Production Disconnected 2 agents
  - button "Compact rows"
  - button "Night mode disabled"
  - button "Undo"
  - button "Redo" [disabled]
  - button "Commands ⌘K"
  - button "Export session"
  - button "Connect agent"
- paragraph: Monday, July 20 · Live workspace
- heading "Good morning, operator." [level=1]
- paragraph: Monitor prompt performance, coordinate coding agents, and preserve the session artifact.
- text: All systems operational
- region "Key performance indicators":
  - button "Open Total prompts detail":
    - text: Total prompts
    - strong: 2,486
    - text: 12.4%
    - application
  - button "Open Active agents detail":
    - text: Active agents
    - strong: "0"
    - text: 8.2%
    - application
  - button "Open Evaluations run detail":
    - text: Evaluations run
    - strong: 18,432
    - text: 18.7%
    - application
  - button "Open Cost this month detail":
    - text: Cost this month
    - strong: $4,296
    - text: 3.1%
    - application
- main:
  - region "Coding agents":
    - paragraph: Live orchestration
    - heading "Coding agents" [level=2]
    - paragraph: 2 connected · 0 running
    - checkbox "Select all agents"
    - text: Select all agents
    - button "Disconnect selected" [disabled]
    - button "Connect agent"
    - article:
      - checkbox "Select Vector Evaluator"
      - text: Select Vector Evaluator
      - button "VE Vector Evaluator o3-mini Run needs attention Last active 18m ago Error":
        - text: VE
        - strong: Vector Evaluator
        - text: o3-mini
        - strong: Run needs attention
        - text: Last active 18m ago Error
      - button "Retry"
      - button "Rename Vector Evaluator"
      - button "Disconnect Vector Evaluator"
    - article:
      - checkbox "Select Orbit Context Mapper"
      - text: Select Orbit Context Mapper
      - button "OR Orbit Context Mapper gemini-2.5-pro Ready for a task Last active 42m ago Idle":
        - text: OR
        - strong: Orbit Context Mapper
        - text: gemini-2.5-pro
        - strong: Ready for a task
        - text: Last active 42m ago Idle
      - button "Run"
      - button "Rename Orbit Context Mapper"
      - button "Disconnect Orbit Context Mapper"
  - region "Activity feed":
    - paragraph: Session pulse
    - heading "Activity feed" [level=2]
    - paragraph: 16 of 16 events visible
    - button "Simulate activity"
    - button "Show errors only"
    - button "Show agent events"
    - button "Show evaluations"
    - button "Show prompt changes"
    - button "Prompt"
    - button "Evaluation"
    - button "Agent"
    - button "Errors"
    - button "Clear filters" [disabled]
    - button "Sentry Reviewer disconnected from the workspace Info agent just now":
      - text: Sentry Reviewer disconnected from the workspace Info agent
      - time: just now
    - button "Nova Refactor disconnected from the workspace Info agent just now":
      - text: Nova Refactor disconnected from the workspace Info agent
      - time: just now
    - button "Nova Refactor started a repository analysis run Info agent 1m ago":
      - text: Nova Refactor started a repository analysis run Info agent
      - time: 1m ago
    - button "Safety rubric evaluation finished at 96.4% Success evaluation 4m ago":
      - text: Safety rubric evaluation finished at 96.4% Success evaluation
      - time: 4m ago
    - button "Customer-support system prompt was created Success prompt 7m ago":
      - text: Customer-support system prompt was created Success prompt
      - time: 7m ago
    - button "Vector Evaluator encountered a context window error Error agent 18m ago":
      - text: Vector Evaluator encountered a context window error Error agent
      - time: 18m ago
    - button "Hallucination benchmark finished with 42 cases Success evaluation 27m ago":
      - text: Hallucination benchmark finished with 42 cases Success evaluation
      - time: 27m ago
    - button "Sentry Reviewer completed a policy review Success agent 39m ago":
      - text: Sentry Reviewer completed a policy review Success agent
      - time: 39m ago
    - button "Code migration prompt was revised Info prompt 51m ago":
      - text: Code migration prompt was revised Info prompt
      - time: 51m ago
    - button "Tool-use evaluation finished at 91.8% Success evaluation 1h ago":
      - text: Tool-use evaluation finished at 91.8% Success evaluation
      - time: 1h ago
    - button "Orbit Context Mapper connected to the workspace Info agent 1h ago":
      - text: Orbit Context Mapper connected to the workspace Info agent
      - time: 1h ago
    - button "Retrieval grounding prompt was created Success prompt 2h ago":
      - text: Retrieval grounding prompt was created Success prompt
      - time: 2h ago
    - button "Monthly evaluation cost checkpoint completed Info evaluation 3h ago":
      - text: Monthly evaluation cost checkpoint completed Info evaluation
      - time: 3h ago
    - button "Nova Refactor completed step Analyze repository context Success agent 5h ago":
      - text: Nova Refactor completed step Analyze repository context Success agent
      - time: 5h ago
    - button "Incident response prompt was archived Info prompt 7h ago":
      - text: Incident response prompt was archived Info prompt
      - time: 7h ago
    - button "Agent handoff benchmark reported one error Error evaluation 10h ago":
      - text: Agent handoff benchmark reported one error Error evaluation
      - time: 10h ago
- text: 2 agents disconnected.
```

# Test source

```ts
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
> 499 |     await expect(page.locator('table tbody tr').first()).toBeVisible();
      |                                                          ^ Error: expect(locator).toBeVisible() failed
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
  597 |     await page.getByRole('button', { name: 'Connect agent', exact: true }).last().click();
  598 |     await expect(page.locator('table tbody tr').first()).toBeVisible();
  599 |   });
```