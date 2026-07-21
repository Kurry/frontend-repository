# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.mjs >> 4.11 reduced_motion_respected
- Location: e2e.spec.mjs:598:1

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e6]:
        - generic [ref=e7]: Plausible Analytics
        - generic [ref=e8]: example.com · America/New_York · Last 30 days
      - generic [ref=e9]:
        - generic [ref=e10]:
          - generic [ref=e11]: Site
          - combobox "Site" [ref=e13] [cursor=pointer]: example.com
        - generic [ref=e14]:
          - generic [ref=e15]: Date range
          - combobox "Date range" [ref=e17] [cursor=pointer]: Last 30 days
        - generic [ref=e18]:
          - generic [ref=e19]: Sort
          - combobox "Sort breakdowns" [ref=e21] [cursor=pointer]: Most visitors
        - generic [ref=e22]:
          - generic [ref=e23]: Bounce ceiling
          - spinbutton "Bounce ceiling" [ref=e24]: "60"
          - generic [ref=e25]: now 44%
          - alert [ref=e26]
        - generic [ref=e27]:
          - generic [ref=e28]: Visitor floor
          - spinbutton "Visitor floor" [ref=e29]: "0"
          - alert [ref=e30]
        - generic [ref=e31]:
          - generic [ref=e32]: Theme
          - button "Switch to dark theme" [ref=e33] [cursor=pointer]: Dark
        - generic [ref=e34]:
          - button "Undo" [disabled] [ref=e35]: ↶
          - button "Redo" [disabled] [ref=e36]: ↷
        - generic [ref=e37]:
          - button "Compare previous" [ref=e38] [cursor=pointer]
          - button "Save segment" [ref=e39] [cursor=pointer]
          - button "Segments" [ref=e41] [cursor=pointer]
          - button "Export report" [ref=e42] [cursor=pointer]
          - button "Add site" [ref=e43] [cursor=pointer]
          - button "Add goal" [ref=e44] [cursor=pointer]
    - main [ref=e46]:
      - generic [ref=e47]:
        - generic [ref=e48]:
          - generic [ref=e50]: Unique visitors
          - generic [ref=e52]: 16,840
        - generic [ref=e53]:
          - generic [ref=e55]: Total pageviews
          - generic [ref=e57]: 47,220
        - generic [ref=e58]:
          - generic [ref=e60]: Bounce rate
          - generic [ref=e62]: 44%
        - generic [ref=e63]:
          - generic [ref=e65]: Visit duration
          - generic [ref=e67]: 98s
      - generic [ref=e68]:
        - heading "Visitors" [level=2] [ref=e69]
        - img "Visitors trend, 10 buckets, peak 2,346 visitors" [ref=e70]:
          - generic "1,017 visitors" [ref=e71]
          - generic "1,167 visitors" [ref=e74]
          - generic "1,315 visitors" [ref=e77]
          - generic "1,464 visitors" [ref=e80]
          - generic "1,612 visitors" [ref=e83]
          - generic "1,759 visitors" [ref=e86]
          - generic "1,907 visitors" [ref=e89]
          - generic "2,053 visitors" [ref=e92]
          - generic "2,200 visitors" [ref=e95]
          - generic "2,346 visitors" [ref=e98]
      - generic [ref=e101]:
        - generic [ref=e102]:
          - generic [ref=e103]:
            - heading "Top sources" [level=2] [ref=e104]
            - button "Export Top sources CSV" [ref=e105] [cursor=pointer]: CSV
          - list [ref=e106]:
            - button "Filter by source Google, 7,200 visitors" [ref=e107] [cursor=pointer]:
              - generic [ref=e108]: Google
              - generic [ref=e110]: 7,200
            - button "Filter by source Direct, 4,800 visitors" [ref=e111] [cursor=pointer]:
              - generic [ref=e112]: Direct
              - generic [ref=e114]: 4,800
            - button "Filter by source Twitter, 1,600 visitors" [ref=e115] [cursor=pointer]:
              - generic [ref=e116]: Twitter
              - generic [ref=e118]: 1,600
            - button "Filter by source Newsletter, 980 visitors" [ref=e119] [cursor=pointer]:
              - generic [ref=e120]: Newsletter
              - generic [ref=e122]: "980"
        - generic [ref=e123]:
          - generic [ref=e124]:
            - heading "Top pages" [level=2] [ref=e125]
            - button "Export Top pages CSV" [ref=e126] [cursor=pointer]: CSV
          - list [ref=e127]:
            - button "Filter by page /, 12,800 visitors" [ref=e128] [cursor=pointer]:
              - generic [ref=e129]: /
              - generic [ref=e131]: 12,800
            - button "Filter by page /pricing, 5,600 visitors" [ref=e132] [cursor=pointer]:
              - generic [ref=e133]: /pricing
              - generic [ref=e135]: 5,600
            - button "Filter by page /blog, 3,900 visitors" [ref=e136] [cursor=pointer]:
              - generic [ref=e137]: /blog
              - generic [ref=e139]: 3,900
            - button "Filter by page /docs, 2,800 visitors" [ref=e140] [cursor=pointer]:
              - generic [ref=e141]: /docs
              - generic [ref=e143]: 2,800
        - generic [ref=e144]:
          - generic [ref=e145]:
            - heading "Countries" [level=2] [ref=e146]
            - button "Export Countries CSV" [ref=e147] [cursor=pointer]: CSV
          - list [ref=e148]:
            - button "Filter by country United States, 6,400 visitors" [ref=e149] [cursor=pointer]:
              - generic [ref=e150]: United States
              - generic [ref=e152]: 6,400
            - button "Filter by country United Kingdom, 2,400 visitors" [ref=e153] [cursor=pointer]:
              - generic [ref=e154]: United Kingdom
              - generic [ref=e156]: 2,400
            - button "Filter by country Germany, 1,900 visitors" [ref=e157] [cursor=pointer]:
              - generic [ref=e158]: Germany
              - generic [ref=e160]: 1,900
            - button "Filter by country Canada, 1,200 visitors" [ref=e161] [cursor=pointer]:
              - generic [ref=e162]: Canada
              - generic [ref=e164]: 1,200
      - generic [ref=e165]:
        - generic [ref=e166]:
          - heading "Goals" [level=2] [ref=e167]
          - button "Export goals CSV" [ref=e168] [cursor=pointer]: CSV
        - list [ref=e169]:
          - listitem [ref=e170]:
            - generic [ref=e171]: Signup
            - generic [ref=e172]: 1,403 (8.3%)
          - listitem [ref=e173]:
            - generic [ref=e174]: Pricing viewed
            - generic [ref=e175]: 1,187 (7%)
          - listitem [ref=e176]:
            - generic [ref=e177]: Docs read
            - generic [ref=e178]: 3,477 (20.6%)
      - generic [ref=e179]:
        - generic [ref=e180]:
          - heading "Funnel" [level=2] [ref=e181]
          - button "Export funnel CSV" [ref=e182] [cursor=pointer]: CSV
        - generic [ref=e183]:
          - generic [ref=e185]:
            - generic [ref=e186]: Visited
            - generic [ref=e187]: 16,840 (100%)
          - generic [ref=e191]:
            - generic [ref=e192]: Pricing viewed
            - generic [ref=e193]: 1,187 (7%)
          - generic [ref=e197]:
            - generic [ref=e198]: Signup
            - generic [ref=e199]: 1,187 (100%)
  - dialog "Add site" [ref=e203]:
    - generic [ref=e204]:
      - heading "Add site" [level=2] [ref=e205]
      - generic [ref=e206]:
        - generic [ref=e207]:
          - generic [ref=e208]: Site name
          - textbox "Site name" [active] [ref=e209]
          - alert [ref=e210]
        - generic [ref=e211]:
          - generic [ref=e212]: Domain
          - textbox "Domain" [ref=e213]
          - alert [ref=e214]
        - generic [ref=e215]:
          - generic [ref=e216]: Timezone
          - combobox "Timezone" [ref=e217] [cursor=pointer]:
            - option "Select a timezone" [selected]
            - option "UTC"
            - option "America/New_York"
            - option "Europe/London"
            - option "Asia/Tokyo"
          - alert [ref=e218]
        - generic [ref=e219]:
          - button "Cancel" [ref=e220] [cursor=pointer]
          - button "Add site" [disabled] [ref=e221]
  - option "Select a type" [selected]
  - option "event"
  - option "page"
```

# Test source

```ts
  509 | test('9.8 import_does_not_freeze', async ({ page }) => {
  510 |   await page.goto('/');
  511 |   await page.evaluate(() => localStorage.clear());
  512 |   await page.reload();
  513 |   const root = page.locator('#root');
  514 |   await expect(root).toBeVisible();
  515 | });
  516 |
  517 | test('9.9 theme_switch_responsive', async ({ page }) => {
  518 |   await page.goto('/');
  519 |   await page.evaluate(() => localStorage.clear());
  520 |   await page.reload();
  521 |   const root = page.locator('#root');
  522 |   await expect(root).toBeVisible();
  523 | });
  524 |
  525 | test('9.10 add_site_submit_responsive', async ({ page }) => {
  526 |   await page.goto('/');
  527 |   await page.evaluate(() => localStorage.clear());
  528 |   await page.reload();
  529 |   const root = page.locator('#root');
  530 |   await expect(root).toBeVisible();
  531 | });
  532 |
  533 | test('4.1 filter_feedback_pill_and_tiles', async ({ page }) => {
  534 |   await page.goto('/');
  535 |   await page.evaluate(() => localStorage.clear());
  536 |   await page.reload();
  537 |   const root = page.locator('#root');
  538 |   await expect(root).toBeVisible();
  539 | });
  540 |
  541 | // NOT-AUTOMATABLE: 4.2 — distinct_hover_and_focus_treatments requires subjective visual judgement.
  542 | test('4.3 chart_bars_eased_height_transition', async ({ page }) => {
  543 |   await page.goto('/');
  544 |   await page.evaluate(() => localStorage.clear());
  545 |   await page.reload();
  546 |   const root = page.locator('#root');
  547 |   await expect(root).toBeVisible();
  548 | });
  549 |
  550 | test('4.4 immediate_press_feedback', async ({ page }) => {
  551 |   await page.goto('/');
  552 |   await page.evaluate(() => localStorage.clear());
  553 |   await page.reload();
  554 |   const root = page.locator('#root');
  555 |   await expect(root).toBeVisible();
  556 | });
  557 |
  558 | test('4.5 keyboard_and_pointer_flow_parity', async ({ page }) => {
  559 |   await page.goto('/');
  560 |   await page.evaluate(() => localStorage.clear());
  561 |   await page.reload();
  562 |   const root = page.locator('#root');
  563 |   await expect(root).toBeVisible();
  564 | });
  565 |
  566 | test('4.8 sort_reorder_animates', async ({ page }) => {
  567 |   await page.goto('/');
  568 |   await page.evaluate(() => localStorage.clear());
  569 |   await page.reload();
  570 |   const root = page.locator('#root');
  571 |   await expect(root).toBeVisible();
  572 | });
  573 |
  574 | test('4.9 filter_pill_enter_exit_animation', async ({ page }) => {
  575 |   await page.goto('/');
  576 |   await page.evaluate(() => localStorage.clear());
  577 |   await page.reload();
  578 |   const root = page.locator('#root');
  579 |   await expect(root).toBeVisible();
  580 | });
  581 |
  582 | test('4.10 add_site_dialog_eased_transition', async ({ page }) => {
  583 |   await page.goto('/');
  584 |   await page.evaluate(() => localStorage.clear());
  585 |   await page.reload();
  586 |   const root = page.locator('#root');
  587 |   await expect(root).toBeVisible();
  588 | });
  589 |
  590 | test('4.15 add_goal_dialog_eased_transition', async ({ page }) => {
  591 |   await page.goto('/');
  592 |   await page.evaluate(() => localStorage.clear());
  593 |   await page.reload();
  594 |   const root = page.locator('#root');
  595 |   await expect(root).toBeVisible();
  596 | });
  597 |
  598 | test('4.11 reduced_motion_respected', async ({ page }) => {
  599 |   await page.emulateMedia({ reducedMotion: 'reduce' });
  600 |   await page.goto('/');
  601 |   await page.evaluate(() => localStorage.clear());
  602 |   await page.reload();
  603 |   const btn = page.getByRole('button', { name: 'Add site' });
  604 |   await btn.click();
  605 |   const dialog = page.getByRole('dialog', { name: 'Add site' });
  606 |   await expect(dialog).toBeVisible();
  607 |   // Dialog animation must be disabled.
  608 |   const style = await dialog.evaluate(el => window.getComputedStyle(el).transitionDuration);
> 609 |   expect(style === '0s' || style === '').toBeTruthy();
      |                                          ^ Error: expect(received).toBeTruthy()
  610 | });
  611 |
  612 | test('4.12 export_drawer_eased_transition', async ({ page }) => {
  613 |   await page.goto('/');
  614 |   await page.evaluate(() => localStorage.clear());
  615 |   await page.reload();
  616 |   const root = page.locator('#root');
  617 |   await expect(root).toBeVisible();
  618 | });
  619 |
  620 | test('4.13 export_copy_toast_motion', async ({ page }) => {
  621 |   await page.goto('/');
  622 |   await page.evaluate(() => localStorage.clear());
  623 |   await page.reload();
  624 |   const root = page.locator('#root');
  625 |   await expect(root).toBeVisible();
  626 | });
  627 |
  628 | test('4.14 compare_chips_ease_in_out', async ({ page }) => {
  629 |   await page.goto('/');
  630 |   await page.evaluate(() => localStorage.clear());
  631 |   await page.reload();
  632 |   const root = page.locator('#root');
  633 |   await expect(root).toBeVisible();
  634 | });
  635 |
  636 | test('4.16 funnel_and_goals_eased_updates', async ({ page }) => {
  637 |   await page.goto('/');
  638 |   await page.evaluate(() => localStorage.clear());
  639 |   await page.reload();
  640 |   const root = page.locator('#root');
  641 |   await expect(root).toBeVisible();
  642 | });
  643 |
  644 | test('11.1 export_summary_strip', async ({ page }) => {
  645 |   await page.goto('/');
  646 |   await page.evaluate(() => localStorage.clear());
  647 |   await page.reload();
  648 |   const root = page.locator('#root');
  649 |   await expect(root).toBeVisible();
  650 | });
  651 |
  652 | test('11.2 undo_redo_keyboard_shortcuts', async ({ page }) => {
  653 |   await page.goto('/');
  654 |   await page.evaluate(() => localStorage.clear());
  655 |   await page.reload();
  656 |   const root = page.locator('#root');
  657 |   await expect(root).toBeVisible();
  658 | });
  659 |
  660 | test('11.3 export_active_filter_chip', async ({ page }) => {
  661 |   await page.goto('/');
  662 |   await page.evaluate(() => localStorage.clear());
  663 |   await page.reload();
  664 |   const root = page.locator('#root');
  665 |   await expect(root).toBeVisible();
  666 | });
  667 |
  668 | test('11.4 compare_chip_polished_sign', async ({ page }) => {
  669 |   await page.goto('/');
  670 |   await page.evaluate(() => localStorage.clear());
  671 |   await page.reload();
  672 |   const root = page.locator('#root');
  673 |   await expect(root).toBeVisible();
  674 | });
  675 |
  676 | test('11.5 ceiling_live_hint', async ({ page }) => {
  677 |   await page.goto('/');
  678 |   await page.evaluate(() => localStorage.clear());
  679 |   await page.reload();
  680 |   const root = page.locator('#root');
  681 |   await expect(root).toBeVisible();
  682 | });
  683 |
  684 | test('11.6 report_filename_includes_site', async ({ page }) => {
  685 |   await page.goto('/');
  686 |   await page.evaluate(() => localStorage.clear());
  687 |   await page.reload();
  688 |   const root = page.locator('#root');
  689 |   await expect(root).toBeVisible();
  690 | });
  691 |
  692 | test('11.7 timezone_shown_in_subtitle', async ({ page }) => {
  693 |   await page.goto('/');
  694 |   await page.evaluate(() => localStorage.clear());
  695 |   await page.reload();
  696 |   const root = page.locator('#root');
  697 |   await expect(root).toBeVisible();
  698 | });
  699 |
  700 | test('11.8 empty_export_guidance', async ({ page }) => {
  701 |   await page.goto('/');
  702 |   await page.evaluate(() => localStorage.clear());
  703 |   await page.reload();
  704 |   const root = page.locator('#root');
  705 |   await expect(root).toBeVisible();
  706 | });
  707 |
  708 | test('11.9 polished_focus_rings', async ({ page }) => {
  709 |   await page.goto('/');
```