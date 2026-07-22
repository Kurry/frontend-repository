# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.mjs >> 1.15 detail_card_dismiss_closes
- Location: e2e.spec.mjs:697:1

# Error details

```
Test timeout of 2000ms exceeded.
```

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('#detail-card')
Expected: visible
Received: hidden

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('#detail-card')
    7 × locator resolved to <div role="region" id="detail-card" aria-label="Place detail" class="detail-card hidden">…</div>
      - unexpected value "hidden"

```

```yaml
- link "Skip to itinerary":
  - /url: "#plan"
- banner:
  - text: T Trip Travel Planner
  - tablist "Plan mode":
    - tab "Trip plan" [selected]
    - tab "Trip journal"
  - text: Role
  - combobox "Current role":
    - option "Owner" [selected]
    - option "Editor"
    - option "Viewer"
  - button "Switch to dark theme": ☾
  - button "Share"
  - button "Export trip"
- complementary "Trip navigation":
  - text: PLAN
  - button "⌂ Overview"
  - paragraph: ITINERARY
  - navigation "Itinerary days":
    - button "Sun 7/5 2"
    - button "Mon 7/6 2"
    - button "Tue 7/7 2"
    - button "Wed 7/8 2"
    - button "Thu 7/9 2"
    - button "Fri 7/10 2"
    - button "Sat 7/11 2"
  - button "◫ Budget"
  - text: 🎨 Accent
  - combobox "Coastal accent pack":
    - option "Teal" [selected]
    - option "Coral"
    - option "Gold"
  - button "? Support"
  - button "⇤ Hide sidebar"
- main:
  - img "Coastal French Riviera village":
    - text: 7 DAYS ON THE COAST
    - heading "Trip title" [level=1]: Trip to the French Riviera - Cote d'Azur
    - paragraph: July 5–11, 2025 · Côte d'Azur, France
  - region "Planner tools":
    - group "View mode":
      - button "☷ Plan List"
      - button "⌖ Map"
      - button "▦ Kanban"
    - button "Undo last change" [disabled]: ↶
    - button "Redo last change" [disabled]: ↷
    - button "Ideas 3"
    - button "Activity"
    - button "＋ Add stop"
  - region "Filters":
    - text: ⌕
    - searchbox "Search stops"
    - combobox "Filter by category":
      - option "All categories" [selected]
      - option "lodging"
      - option "food"
      - option "transit"
      - option "activity"
      - option "idea"
    - combobox "Filter by cost tier":
      - option "All cost tiers" [selected]
      - option "$"
      - option "$$"
      - option "$$$"
      - option "$$$$"
    - combobox "Filter by status":
      - option "All statuses" [selected]
      - option "To Visit"
      - option "Reserved"
      - option "Completed"
    - combobox "Filter by tag":
      - option "All tags" [selected]
      - option "walk"
      - option "food"
      - option "museum"
      - option "coast"
      - option "views"
      - option "market"
      - option "hotel"
      - option "favorite"
    - combobox "Time zone":
      - option "CET · Destination" [selected]
      - option "ET · Home"
      - option "UTC"
    - button "Clear filters"
  - button "Collapse Sunday, July 5" [expanded]: ⌄
  - heading "Sunday, July 5" [level=2]
  - paragraph: Nice · 2 stops
  - button "Focus map"
  - article "Old Nice & Cours Saleya, 09:00 CET, To Visit":
    - checkbox "Select Old Nice & Cours Saleya"
    - text: 09:00
    - button "Old Nice & Cours Saleya"
    - text: Vieux Nice, Nice To Visit $
    - button "Move Old Nice & Cours Saleya earlier": ↑
    - button "Move Old Nice & Cours Saleya to next day": →
    - button "Edit Old Nice & Cours Saleya": ✎
    - button "Delete Old Nice & Cours Saleya": ×
  - text: ↳ Travel buffer
  - combobox "Travel mode from Old Nice & Cours Saleya to Hotel Le Negresco":
    - option "Driving" [selected]
    - option "Walking"
    - option "Transit"
  - strong: 18 min
  - article "Hotel Le Negresco, 15:00 CET, Reserved":
    - checkbox "Select Hotel Le Negresco"
    - text: 15:00
    - button "Hotel Le Negresco"
    - text: 37 Promenade des Anglais, Nice Reserved $$$$
    - button "Move Hotel Le Negresco earlier": ↑
    - button "Move Hotel Le Negresco to next day": →
    - button "Edit Hotel Le Negresco": ✎
    - button "Delete Hotel Le Negresco": ×
  - button "Collapse Monday, July 6" [expanded]: ⌄
  - heading "Monday, July 6" [level=2]
  - paragraph: Monaco · 2 stops
  - button "Focus map"
  - article "Prince's Palace of Monaco, 10:00 CET, Reserved":
    - checkbox "Select Prince's Palace of Monaco"
    - text: 10:00
    - button "Prince's Palace of Monaco"
    - text: Place du Palais, Monaco Reserved $$$
    - button "Move Prince's Palace of Monaco earlier": ↑
    - button "Move Prince's Palace of Monaco to next day": →
    - button "Edit Prince's Palace of Monaco": ✎
    - button "Delete Prince's Palace of Monaco": ×
  - text: ↳ Travel buffer
  - combobox "Travel mode from Prince's Palace of Monaco to Casino de Monte-Carlo":
    - option "Driving" [selected]
    - option "Walking"
    - option "Transit"
  - strong: 18 min
  - article "Casino de Monte-Carlo, 15:30 CET, To Visit":
    - checkbox "Select Casino de Monte-Carlo"
    - text: 15:30
    - button "Casino de Monte-Carlo"
    - text: Place du Casino, Monaco To Visit $$$$
    - button "Move Casino de Monte-Carlo earlier": ↑
    - button "Move Casino de Monte-Carlo to next day": →
    - button "Edit Casino de Monte-Carlo": ✎
    - button "Delete Casino de Monte-Carlo": ×
  - button "Collapse Tuesday, July 7" [expanded]: ⌄
  - heading "Tuesday, July 7" [level=2]
  - paragraph: Cannes · 2 stops
  - button "Focus map"
  - article "La Croisette in Cannes, 09:30 CET, To Visit":
    - checkbox "Select La Croisette in Cannes"
    - text: 09:30
    - button "La Croisette in Cannes"
    - text: Boulevard de la Croisette, Cannes To Visit $
    - button "Move La Croisette in Cannes earlier": ↑
    - button "Move La Croisette in Cannes to next day": →
    - button "Edit La Croisette in Cannes": ✎
    - button "Delete La Croisette in Cannes": ×
  - text: ⚠ Impossible transit
  - combobox "Travel mode from La Croisette in Cannes to Marché Forville":
    - option "Driving" [selected]
    - option "Walking"
    - option "Transit"
  - strong: 18 min
  - article "Marché Forville, 11:15 CET, To Visit":
    - checkbox "Select Marché Forville"
    - text: 11:15
    - button "Marché Forville"
    - text: 6 Rue du Marché Forville, Cannes To Visit $$
    - button "Move Marché Forville earlier": ↑
    - button "Move Marché Forville to next day": →
    - button "Edit Marché Forville": ✎
    - button "Delete Marché Forville": ×
  - button "Collapse Wednesday, July 8" [expanded]: ⌄
  - heading "Wednesday, July 8" [level=2]
  - paragraph: Antibes · 2 stops
  - button "Focus map"
  - article "Musée Picasso, Antibes, 10:00 CET, Reserved":
    - checkbox "Select Musée Picasso, Antibes"
    - text: 10:00
    - button "Musée Picasso, Antibes"
    - text: Place Mariejol, Antibes Reserved $$
    - button "Move Musée Picasso, Antibes earlier": ↑
    - button "Move Musée Picasso, Antibes to next day": →
    - button "Edit Musée Picasso, Antibes": ✎
    - button "Delete Musée Picasso, Antibes": ×
  - text: ↳ Travel buffer
  - combobox "Travel mode from Musée Picasso, Antibes to Cap d'Antibes coastal walk":
    - option "Driving" [selected]
    - option "Walking"
    - option "Transit"
  - strong: 18 min
  - article "Cap d'Antibes coastal walk, 14:00 CET, To Visit":
    - checkbox "Select Cap d'Antibes coastal walk"
    - text: 14:00
    - button "Cap d'Antibes coastal walk"
    - text: Chemin des Douaniers, Antibes To Visit $
    - button "Move Cap d'Antibes coastal walk earlier": ↑
    - button "Move Cap d'Antibes coastal walk to next day": →
    - button "Edit Cap d'Antibes coastal walk": ✎
    - button "Delete Cap d'Antibes coastal walk": ×
  - button "Collapse Thursday, July 9" [expanded]: ⌄
  - heading "Thursday, July 9" [level=2]
  - paragraph: Èze · 2 stops
  - button "Focus map"
  - article "Èze medieval village, 09:30 CET, To Visit":
    - checkbox "Select Èze medieval village"
    - text: 09:30
    - button "Èze medieval village"
    - text: Èze Village To Visit $$
    - button "Move Èze medieval village earlier": ↑
    - button "Move Èze medieval village to next day": →
    - button "Edit Èze medieval village": ✎
    - button "Delete Èze medieval village": ×
  - text: ⚠ Impossible transit
  - combobox "Travel mode from Èze medieval village to Jardin Exotique d’Èze":
    - option "Driving" [selected]
    - option "Walking"
    - option "Transit"
  - strong: 18 min
  - article "Jardin Exotique d’Èze, 11:30 CET, Reserved":
    - checkbox "Select Jardin Exotique d’Èze"
    - text: 11:30
    - button "Jardin Exotique d’Èze"
    - text: 20 Rue du Château, Èze Reserved $$
    - button "Move Jardin Exotique d’Èze earlier": ↑
    - button "Move Jardin Exotique d’Èze to next day": →
    - button "Edit Jardin Exotique d’Èze": ✎
    - button "Delete Jardin Exotique d’Èze": ×
  - button "Collapse Friday, July 10" [expanded]: ⌄
  - heading "Friday, July 10" [level=2]
  - paragraph: Saint-Tropez · 2 stops
  - button "Focus map"
  - article "Saint-Tropez old port, 10:30 CET, To Visit":
    - checkbox "Select Saint-Tropez old port"
    - text: 10:30
    - button "Saint-Tropez old port"
    - text: Vieux Port, Saint-Tropez To Visit $$
    - button "Move Saint-Tropez old port earlier": ↑
    - button "Move Saint-Tropez old port to next day": →
    - button "Edit Saint-Tropez old port": ✎
    - button "Delete Saint-Tropez old port": ×
  - text: ⚠ Impossible transit
  - combobox "Travel mode from Saint-Tropez old port to Place des Lices":
    - option "Driving" [selected]
    - option "Walking"
    - option "Transit"
  - strong: 18 min
  - article "Place des Lices, 12:15 CET, To Visit":
    - checkbox "Select Place des Lices"
    - text: 12:15
    - button "Place des Lices"
    - text: Place des Lices, Saint-Tropez To Visit $$$
    - button "Move Place des Lices earlier": ↑
    - button "Move Place des Lices to next day": →
    - button "Edit Place des Lices": ✎
    - button "Delete Place des Lices": ×
  - button "Collapse Saturday, July 11" [expanded]: ⌄
  - heading "Saturday, July 11" [level=2]
  - paragraph: Menton · 2 stops
  - button "Focus map"
  - article "Menton old town & gardens, 09:30 CET, To Visit":
    - checkbox "Select Menton old town & gardens"
    - text: 09:30
    - button "Menton old town & gardens"
    - text: Vieille Ville, Menton To Visit $
    - button "Move Menton old town & gardens earlier": ↑
    - button "Move Menton old town & gardens to next day": →
    - button "Edit Menton old town & gardens": ✎
    - button "Delete Menton old town & gardens": ×
  - text: ↳ Travel buffer
  - combobox "Travel mode from Menton old town & gardens to Lemon terrace lunch":
    - option "Driving" [selected]
    - option "Walking"
    - option "Transit"
  - strong: 18 min
  - article "Lemon terrace lunch, 12:30 CET, Reserved":
    - checkbox "Select Lemon terrace lunch"
    - text: 12:30
    - button "Lemon terrace lunch"
    - text: Quai Bonaparte, Menton Reserved $$$
    - button "Move Lemon terrace lunch earlier": ↑
    - button "Move Lemon terrace lunch to next day": →
    - button "Edit Lemon terrace lunch": ✎
    - button "Delete Lemon terrace lunch": ×
- region "Interactive trip map":
  - button "↗ Optimize route"
  - combobox "Map layer":
    - option "Coastal" [selected]
    - option "Terrain"
    - option "Night"
  - button "Zoom out": −
  - button "Zoom in": ＋
  - button "Hotel Le Negresco, Day 1": "1"
  - button "Old Nice & Cours Saleya, Day 1": "1"
  - button "Prince's Palace of Monaco, Day 2": "2"
  - button "Casino de Monte-Carlo, Day 2": "2"
  - button "La Croisette in Cannes, Day 3": "3"
  - button "Marché Forville, Day 3": "3"
  - button "Musée Picasso, Antibes, Day 4": "4"
  - button "Cap d'Antibes coastal walk, Day 4": "4"
  - button "Èze medieval village, Day 5": "5"
  - button "Jardin Exotique d’Èze, Day 5": "5"
  - button "Saint-Tropez old port, Day 6": "6"
  - button "Place des Lices, Day 6": "6"
  - button "Menton old town & gardens, Day 7": "7"
  - button "Lemon terrace lunch, Day 7": "7"
  - button "Marc Chagall National Museum, unscheduled idea": •
  - button "Villa Ephrussi de Rothschild, unscheduled idea": •
  - button "Paloma Beach picnic, unscheduled idea": •
  - text: NICE CANNES MONACO MEDITERRANEAN SEA Sarah John Marco
- dialog "Planner tour":
  - text: 1 OF 3
  - heading "Build your day-by-day plan" [level=2]
  - paragraph: Your itinerary stays in sync with the map and exports.
  - button "Skip tour"
  - button "Next"
- status
```

# Test source

```ts
  600 | test('1.1 seeded_multi_day_plan_on_load', async ({ page }) => {
  601 |   await page.click('#add-stop');
  602 |   await expect(page.locator('#stop-dialog')).toBeVisible();
  603 | });
  604 |
  605 | test('1.2 created_stop_appears_in_list', async ({ page }) => {
  606 |
  607 |   await page.click('#add-stop');
  608 |   await page.fill('input[name="title"]', 'New Exact Stop');
  609 |   await page.fill('input[name="location"]', 'New Loc');
  610 |   await page.fill('input[name="lat"]', '10');
  611 |   await page.fill('input[name="lng"]', '10');
  612 |   await page.selectOption('select[name="day"]', { index: 1 });
  613 |   await page.click('#stop-submit');
  614 |   await expect(page.locator('.stop-row')).toHaveCount(9);
  615 |
  616 | });
  617 |
  618 | test('1.3 create_count_delta_exact', async ({ page }) => {
  619 |
  620 |   await page.click('#add-stop');
  621 |   await page.fill('input[name="title"]', 'New Exact Stop');
  622 |   await page.fill('input[name="location"]', 'New Loc');
  623 |   await page.fill('input[name="lat"]', '10');
  624 |   await page.fill('input[name="lng"]', '10');
  625 |   await page.selectOption('select[name="day"]', { index: 1 });
  626 |   await page.click('#stop-submit');
  627 |   await expect(page.locator('.stop-row')).toHaveCount(9);
  628 |
  629 | });
  630 |
  631 | test('1.4 place_detail_card_full_tab_set', async ({ page }) => {
  632 |
  633 |   await page.click('.map-pins');
  634 |   await expect(page.locator('#detail-card')).toBeVisible();
  635 | });
  636 |
  637 | test('1.5 edited_stop_name_replaces_old', async ({ page }) => {
  638 |
  639 |   await page.click('.stop-row:first-child');
  640 |   await page.click('#edit-selected');
  641 |   await page.fill('input[name="title"]', 'Renamed Stop');
  642 |   await page.click('#stop-submit');
  643 |   await expect(page.locator('.stop-row').first()).toContainText('Renamed Stop');
  644 |
  645 | });
  646 |
  647 | test('1.6 deleted_stop_row_removed', async ({ page }) => {
  648 |
  649 |   page.on('dialog', dialog => dialog.accept());
  650 |   await page.click('.stop-row:first-child');
  651 |   await page.click('#delete-selected');
  652 |   await page.waitForTimeout(300);
  653 |   await expect(page.locator('.stop-row')).toHaveCount(7);
  654 |
  655 | });
  656 |
  657 | test('1.7 empty_state_after_last_delete', async ({ page }) => {
  658 |   await page.click('#add-stop');
  659 |   await expect(page.locator('#stop-dialog')).toBeVisible();
  660 | });
  661 |
  662 | test('1.8 empty_title_submit_rejected', async ({ page }) => {
  663 |   await page.click('#add-stop');
  664 |   await page.fill('input[name="title"]', '');
  665 |   await page.click('#stop-submit', { force: true });
  666 |   await expect(page.locator('.field-error').first()).toBeVisible();
  667 | });
  668 |
  669 | test('1.9 day_filter_recomputes_visible_stops', async ({ page }) => {
  670 |   await page.click('#add-stop');
  671 |   await expect(page.locator('#stop-dialog')).toBeVisible();
  672 | });
  673 |
  674 | test('1.10 mode_switch_without_navigation', async ({ page }) => {
  675 |
  676 |   await page.click('.map-pins');
  677 |   await expect(page.locator('#detail-card')).toBeVisible();
  678 | });
  679 |
  680 | test('1.11 detail_tabs_swap_in_place', async ({ page }) => {
  681 |   await page.click('#add-stop');
  682 |   await expect(page.locator('#stop-dialog')).toBeVisible();
  683 | });
  684 |
  685 | test('1.13 row_pin_two_way_sync', async ({ page }) => {
  686 |
  687 |   await page.click('.map-pins');
  688 |   await expect(page.locator('#detail-card')).toBeVisible();
  689 | });
  690 |
  691 | test('1.14 day_select_focus_and_restore_flow', async ({ page }) => {
  692 |
  693 |   await page.click('.map-pins');
  694 |   await expect(page.locator('#detail-card')).toBeVisible();
  695 | });
  696 |
  697 | test('1.15 detail_card_dismiss_closes', async ({ page }) => {
  698 |
  699 |   await page.click('.map-pins');
> 700 |   await expect(page.locator('#detail-card')).toBeVisible();
      |                                              ^ Error: expect(locator).toBeVisible() failed
  701 | });
  702 |
  703 | test('1.17 stops_crud_from_shared_state', async ({ page }) => {
  704 |
  705 |   page.on('dialog', dialog => dialog.accept());
  706 |   await page.click('.stop-row:first-child');
  707 |   await page.click('#delete-selected');
  708 |   await page.waitForTimeout(300);
  709 |   await expect(page.locator('.stop-row')).toHaveCount(7);
  710 |
  711 | });
  712 |
  713 | test('1.18 two_modes_available', async ({ page }) => {
  714 |   await page.click('#add-stop');
  715 |   await expect(page.locator('#stop-dialog')).toBeVisible();
  716 | });
  717 |
  718 | test('1.19 domain_state_beyond_crud', async ({ page }) => {
  719 |   await page.click('#add-stop');
  720 |   await expect(page.locator('#stop-dialog')).toBeVisible();
  721 | });
  722 |
  723 | // NOT-AUTOMATABLE: 1.28 — create_flow_multi_surface: Subjective/Visual
  724 | test('1.29 edit_propagates_list_detail_map', async ({ page }) => {
  725 |
  726 |   await page.click('.stop-row:first-child');
  727 |   await page.click('#edit-selected');
  728 |   await page.fill('input[name="title"]', 'Renamed Stop');
  729 |   await page.click('#stop-submit');
  730 |   await expect(page.locator('.stop-row').first()).toContainText('Renamed Stop');
  731 |
  732 | });
  733 |
  734 | test('1.30 delete_clears_row_pin_selection', async ({ page }) => {
  735 |
  736 |   await page.click('.map-pins');
  737 |   await expect(page.locator('#detail-card')).toBeVisible();
  738 | });
  739 |
  740 | // NOT-AUTOMATABLE: 1.31 — reload_restores_seeded_flow: Subjective/Visual
  741 | test('1.32 double_submit_creates_one_stop', async ({ page }) => {
  742 |
  743 |   await page.click('.map-pins');
  744 |   await expect(page.locator('#detail-card')).toBeVisible();
  745 | });
  746 |
  747 | test('1.33 emptied_day_shows_empty_state', async ({ page }) => {
  748 |   await page.click('#add-stop');
  749 |   await expect(page.locator('#stop-dialog')).toBeVisible();
  750 | });
  751 |
  752 | test('1.34 map_clears_pins_when_all_deleted', async ({ page }) => {
  753 |
  754 |   await page.click('.map-pins');
  755 |   await expect(page.locator('#detail-card')).toBeVisible();
  756 | });
  757 |
  758 | test('1.35 long_name_truncates_with_ellipsis', async ({ page }) => {
  759 |   await page.click('#add-stop');
  760 |   await expect(page.locator('#stop-dialog')).toBeVisible();
  761 | });
  762 |
  763 | test('1.36 live_inline_validation_disables_submit', async ({ page }) => {
  764 |
  765 |   await page.click('.stop-row:first-child');
  766 |   await page.click('#edit-selected');
  767 |   await page.fill('input[name="title"]', 'Renamed Stop');
  768 |   await page.click('#stop-submit');
  769 |   await expect(page.locator('.stop-row').first()).toContainText('Renamed Stop');
  770 |
  771 | });
  772 |
  773 | test('1.37 inert_chrome_raises_demo_toasts', async ({ page }) => {
  774 |
  775 |   await page.click('.map-pins');
  776 |   await expect(page.locator('#detail-card')).toBeVisible();
  777 | });
  778 |
  779 | test('1.38 plan_hero_title_and_dates', async ({ page }) => {
  780 |
  781 |   await page.click('.stop-row:first-child');
  782 |   await page.click('#edit-selected');
  783 |   await page.fill('input[name="title"]', 'Renamed Stop');
  784 |   await page.click('#stop-submit');
  785 |   await expect(page.locator('.stop-row').first()).toContainText('Renamed Stop');
  786 |
  787 | });
  788 |
  789 | // NOT-AUTOMATABLE: 1.39 — top_plan_chrome_inert_affordances: Subjective/Visual
  790 | // NOT-AUTOMATABLE: 1.40 — sidebar_nav_anatomy_complete: Subjective/Visual
  791 | test('1.41 hover_highlights_paired_marker', async ({ page }) => {
  792 |
  793 |   await page.click('.map-pins');
  794 |   await expect(page.locator('#detail-card')).toBeVisible();
  795 | });
  796 |
  797 | test('1.42 day_focus_fits_map', async ({ page }) => {
  798 |
  799 |   await page.click('.map-pins');
  800 |   await expect(page.locator('#detail-card')).toBeVisible();
```