# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.mjs >> 4.1 empty_new_site_state
- Location: e2e.spec.mjs:732:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('option', { name: 'New Site' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('option', { name: 'New Site' })

```

```yaml
- banner:
  - text: Plausible Analytics example.com · America/New_York · Last 30 days Site
  - combobox "Site" [expanded]: example.com
  - listbox "Site":
    - listitem:
      - option "example.com" [selected]
    - listitem:
      - option "blog.example.com"
    - listitem:
      - option "shop.example.com"
    - listitem:
      - option "new.example.com"
  - text: Date range
  - combobox "Date range": Last 30 days
  - text: Sort
  - combobox "Sort breakdowns": Most visitors
  - text: Bounce ceiling
  - spinbutton "Bounce ceiling": "60"
  - text: now 44%
  - alert
  - text: Visitor floor
  - spinbutton "Visitor floor": "0"
  - alert
  - text: Theme
  - button "Switch to dark theme": Dark
  - button "Undo": ↶
  - button "Redo" [disabled]: ↷
  - button "Compare previous"
  - button "Save segment"
  - button "Segments"
  - button "Export report"
  - button "Add site"
  - button "Add goal"
- main:
  - text: Unique visitors 16,840 Total pageviews 47,220 Bounce rate 44% Visit duration 98s
  - heading "Visitors" [level=2]
  - img "Visitors trend, 10 buckets, peak 2,346 visitors"
  - heading "Top sources" [level=2]
  - button "Export Top sources CSV": CSV
  - list:
    - button "Filter by source Google, 7,200 visitors": Google 7,200
    - button "Filter by source Direct, 4,800 visitors": Direct 4,800
    - button "Filter by source Twitter, 1,600 visitors": Twitter 1,600
    - button "Filter by source Newsletter, 980 visitors": Newsletter 980
  - heading "Top pages" [level=2]
  - button "Export Top pages CSV": CSV
  - list:
    - button "Filter by page /, 12,800 visitors": / 12,800
    - button "Filter by page /pricing, 5,600 visitors": /pricing 5,600
    - button "Filter by page /blog, 3,900 visitors": /blog 3,900
    - button "Filter by page /docs, 2,800 visitors": /docs 2,800
  - heading "Countries" [level=2]
  - button "Export Countries CSV": CSV
  - list:
    - button "Filter by country United States, 6,400 visitors": United States 6,400
    - button "Filter by country United Kingdom, 2,400 visitors": United Kingdom 2,400
    - button "Filter by country Germany, 1,900 visitors": Germany 1,900
    - button "Filter by country Canada, 1,200 visitors": Canada 1,200
  - heading "Goals" [level=2]
  - button "Export goals CSV": CSV
  - list:
    - listitem: Signup 1,403 (8.3%)
    - listitem: Pricing viewed 1,187 (7%)
    - listitem: Docs read 3,477 (20.6%)
  - heading "Funnel" [level=2]
  - button "Export funnel CSV": CSV
  - text: Visited 16,840 (100%) Pricing viewed 1,187 (7%) Signup 1,187 (100%)
```

# Test source

```ts
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
  710 |   await page.evaluate(() => localStorage.clear());
  711 |   await page.reload();
  712 |   const root = page.locator('#root');
  713 |   await expect(root).toBeVisible();
  714 | });
  715 |
  716 | test('11.10 trusted_artifact_affordance', async ({ page }) => {
  717 |   await page.goto('/');
  718 |   await page.evaluate(() => localStorage.clear());
  719 |   await page.reload();
  720 |   const root = page.locator('#root');
  721 |   await expect(root).toBeVisible();
  722 | });
  723 |
  724 | test('innovation.catchall innovation_catchall', async ({ page }) => {
  725 |   await page.goto('/');
  726 |   await page.evaluate(() => localStorage.clear());
  727 |   await page.reload();
  728 |   const root = page.locator('#root');
  729 |   await expect(root).toBeVisible();
  730 | });
  731 |
  732 | test('4.1 empty_new_site_state', async ({ page }) => {
  733 |   await page.goto('/');
  734 |   await page.evaluate(() => localStorage.clear());
  735 |   await page.reload();
  736 |   const btn = page.getByRole('button', { name: 'Add site' });
  737 |   await btn.click();
  738 |   const dialog = page.getByRole('dialog', { name: 'Add site' });
  739 |   await dialog.getByLabel('Site name').fill('New Site');
  740 |   await dialog.getByLabel('Domain').fill('new.example.com');
  741 |   await dialog.getByLabel('Timezone').selectOption('UTC');
  742 |   await dialog.getByRole('button', { name: 'Add site' }).click({ force: true });
  743 |   const siteTrigger = page.getByRole('combobox', { name: 'Site' });
  744 |   await siteTrigger.click();
> 745 |   await expect(page.getByRole('option', { name: 'New Site' })).toBeVisible();
      |                                                                ^ Error: expect(locator).toBeVisible() failed
  746 |   await page.getByRole('option', { name: 'New Site' }).click();
  747 |   await expect(page.getByText('No data for this segment').first()).toBeVisible();
  748 | });
  749 |
  750 | test('4.2 add_site_inline_validation_all_fields', async ({ page }) => {
  751 |   await page.goto('/');
  752 |   await page.evaluate(() => localStorage.clear());
  753 |   await page.reload();
  754 |   const root = page.locator('#root');
  755 |   await expect(root).toBeVisible();
  756 | });
  757 |
  758 | test('4.3 validation_messages_name_fields', async ({ page }) => {
  759 |   await page.goto('/');
  760 |   await page.evaluate(() => localStorage.clear());
  761 |   await page.reload();
  762 |   const root = page.locator('#root');
  763 |   await expect(root).toBeVisible();
  764 | });
  765 |
  766 | test('4.4 export_copy_confirmation', async ({ page }) => {
  767 |   await page.goto('/');
  768 |   await page.evaluate(() => localStorage.clear());
  769 |   await page.reload();
  770 |   const root = page.locator('#root');
  771 |   await expect(root).toBeVisible();
  772 | });
  773 |
  774 | test('4.5 same_dimension_replaces_cross_stacks', async ({ page }) => {
  775 |   await page.goto('/');
  776 |   await page.evaluate(() => localStorage.clear());
  777 |   await page.reload();
  778 |   const root = page.locator('#root');
  779 |   await expect(root).toBeVisible();
  780 | });
  781 |
  782 | test('4.6 undo_available_after_mutation', async ({ page }) => {
  783 |   await page.goto('/');
  784 |   await page.evaluate(() => localStorage.clear());
  785 |   await page.reload();
  786 |   const root = page.locator('#root');
  787 |   await expect(root).toBeVisible();
  788 | });
  789 |
  790 | test('4.7 ceiling_bounds_help', async ({ page }) => {
  791 |   await page.goto('/');
  792 |   await page.evaluate(() => localStorage.clear());
  793 |   await page.reload();
  794 |   const root = page.locator('#root');
  795 |   await expect(root).toBeVisible();
  796 | });
  797 |
  798 | test('4.8 semantic_controls', async ({ page }) => {
  799 |   await page.goto('/');
  800 |   await page.evaluate(() => localStorage.clear());
  801 |   await page.reload();
  802 |   const root = page.locator('#root');
  803 |   await expect(root).toBeVisible();
  804 | });
  805 |
  806 | test('4.9 dialogs_close_on_escape', async ({ page }) => {
  807 |   await page.goto('/');
  808 |   await page.evaluate(() => localStorage.clear());
  809 |   await page.reload();
  810 |   const root = page.locator('#root');
  811 |   await expect(root).toBeVisible();
  812 | });
  813 |
  814 | test('4.10 empty_breakdown_csv_header_only', async ({ page }) => {
  815 |   await page.goto('/');
  816 |   await page.evaluate(() => localStorage.clear());
  817 |   await page.reload();
  818 |   const root = page.locator('#root');
  819 |   await expect(root).toBeVisible();
  820 | });
  821 |
  822 | test('4.11 empty_segment_save_names_filters_field', async ({ page }) => {
  823 |   await page.goto('/');
  824 |   await page.evaluate(() => localStorage.clear());
  825 |   await page.reload();
  826 |   const root = page.locator('#root');
  827 |   await expect(root).toBeVisible();
  828 | });
  829 |
  830 | test('4.12 add_goal_invalid_match_key_rejected', async ({ page }) => {
  831 |   await page.goto('/');
  832 |   await page.evaluate(() => localStorage.clear());
  833 |   await page.reload();
  834 |   const root = page.locator('#root');
  835 |   await expect(root).toBeVisible();
  836 | });
  837 |
  838 | test('4.13 zero_intersection_empty_goals_message', async ({ page }) => {
  839 |   await page.goto('/');
  840 |   await page.evaluate(() => localStorage.clear());
  841 |   await page.reload();
  842 |   const root = page.locator('#root');
  843 |   await expect(root).toBeVisible();
  844 | });
  845 |
```