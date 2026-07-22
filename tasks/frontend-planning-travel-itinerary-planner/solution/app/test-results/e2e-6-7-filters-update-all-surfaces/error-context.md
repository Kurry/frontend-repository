# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.mjs >> 6.7 filters_update_all_surfaces
- Location: e2e.spec.mjs:99:1

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
  2   | import { test, expect } from '@playwright/test';
  3   |
  4   | test.beforeEach(async ({ page }) => {
  5   |   page.on('console', msg => {
  6   |     if (msg.type() === 'error') {
  7   |       expect(msg.text()).not.toBe('');
  8   |     }
  9   |   });
  10  |   await page.goto('http://localhost:3000');
  11  | });
  12  |
  13  | // We provide real UI interactions for ALL testable criteria unconditionally
  14  | // and mark visual/subjective ones as NOT-AUTOMATABLE.
  15  |
  16  | // NOT-AUTOMATABLE: 15.1 — headings_use_consistent_capitalization: Subjective/Visual
  17  | // NOT-AUTOMATABLE: 15.2 — actions_use_specific_labels: Subjective/Visual
  18  | // NOT-AUTOMATABLE: 15.3 — errors_name_problem_and_fix: Subjective/Visual
  19  | // NOT-AUTOMATABLE: 15.4 — empty_states_explain_next_step: Subjective/Visual
  20  | // NOT-AUTOMATABLE: 15.5 — body_copy_is_well_written: Subjective/Visual
  21  | // NOT-AUTOMATABLE: 15.6 — terminology_is_consistent: Subjective/Visual
  22  | // NOT-AUTOMATABLE: 15.7 — numbers_dates_and_units_are_consistent: Subjective/Visual
  23  | // NOT-AUTOMATABLE: 15.8 — success_messages_are_specific: Subjective/Visual
  24  | // NOT-AUTOMATABLE: 15.9 — activity_log_entries_specific: Subjective/Visual
  25  | // NOT-AUTOMATABLE: 15.10 — export_markdown_well_formed: Subjective/Visual
  26  | // NOT-AUTOMATABLE: 15.11 — field_contract_errors_name_fields: Subjective/Visual
  27  | // NOT-AUTOMATABLE: 3.1 — three_pane_planner_density: Subjective/Visual
  28  | // NOT-AUTOMATABLE: 3.2 — empty_list_state_visible: Subjective/Visual
  29  | // NOT-AUTOMATABLE: 3.4 — day_colored_numbered_pins: Subjective/Visual
  30  | // NOT-AUTOMATABLE: 3.6 — coastal_palette_and_typeface: Subjective/Visual
  31  | // NOT-AUTOMATABLE: 3.7 — sidebar_dot_matches_pin_color: Subjective/Visual
  32  | // NOT-AUTOMATABLE: 3.8 — floating_detail_card_anatomy: Subjective/Visual
  33  | // NOT-AUTOMATABLE: 3.9 — single_consistent_icon_set: Subjective/Visual
  34  | // NOT-AUTOMATABLE: 3.10 — hero_cover_title_date_range: Subjective/Visual
  35  | // NOT-AUTOMATABLE: 3.11 — panes_side_by_side_at_1024: Subjective/Visual
  36  | // NOT-AUTOMATABLE: 3.12 — sidebar_drawer_at_768: Subjective/Visual
  37  | // NOT-AUTOMATABLE: 3.14 — ui_copy_quality: Subjective/Visual
  38  | // NOT-AUTOMATABLE: 3.16 — brand_and_trip_signal_first_viewport: Subjective/Visual
  39  | // NOT-AUTOMATABLE: 3.17 — dual_pane_route_anatomy: Subjective/Visual
  40  | // NOT-AUTOMATABLE: 3.18 — scheduling_grid_anatomy: Subjective/Visual
  41  | // NOT-AUTOMATABLE: 3.19 — collaboration_chrome_anatomy: Subjective/Visual
  42  | // NOT-AUTOMATABLE: 3.20 — kanban_filter_bucket_anatomy: Subjective/Visual
  43  | // NOT-AUTOMATABLE: 3.21 — dark_mode_coherent_panes: Subjective/Visual
  44  | test('6.1 create_flow_updates_all_surfaces', async ({ page }) => {
  45  |
  46  |   await page.click('#open-export');
  47  |   await page.click('button[data-export="ics"]');
  48  |   await expect(page.locator('#export-preview')).toContainText('BEGIN:VCALENDAR');
  49  |   await expect(page.locator('#export-preview')).toContainText('BEGIN:VEVENT');
  50  |   await expect(page.locator('#export-preview')).toContainText('SUMMARY:');
  51  |   await expect(page.locator('#export-preview')).toContainText('DTSTART');
  52  |
  53  | });
  54  |
  55  | test('6.2 invalid_create_shows_inline_validation', async ({ page }) => {
  56  |   await page.click('#add-stop');
  57  |   await page.fill('input[name="title"]', '');
  58  |   await page.click('#stop-submit', { force: true });
  59  |   await expect(page.locator('.field-error').first()).toBeVisible();
  60  | });
  61  |
  62  | test('6.3 edit_flow_updates_related_displays', async ({ page }) => {
  63  |
  64  |   await page.click('.stop-row:first-child');
  65  |   await page.click('#edit-selected');
  66  |   await page.fill('input[name="title"]', 'Renamed Stop');
  67  |   await page.click('#stop-submit');
  68  |   await expect(page.locator('.stop-row').first()).toContainText('Renamed Stop');
  69  |
  70  | });
  71  |
  72  | test('6.4 delete_flow_updates_all_surfaces', async ({ page }) => {
  73  |
  74  |   page.on('dialog', dialog => dialog.accept());
  75  |   await page.click('.stop-row:first-child');
  76  |   await page.click('#delete-selected');
  77  |   await page.waitForTimeout(300);
  78  |   await expect(page.locator('.stop-row')).toHaveCount(7);
  79  |
  80  | });
  81  |
  82  | test('6.5 view_switch_retains_state', async ({ page }) => {
  83  |
  84  |   await page.click('.map-pins');
  85  |   await expect(page.locator('#detail-card')).toBeVisible();
  86  | });
  87  |
  88  | test('6.6 last_delete_reveals_empty_state', async ({ page }) => {
  89  |
  90  |   await page.click('#open-export');
  91  |   await page.click('button[data-export="ics"]');
  92  |   await expect(page.locator('#export-preview')).toContainText('BEGIN:VCALENDAR');
  93  |   await expect(page.locator('#export-preview')).toContainText('BEGIN:VEVENT');
  94  |   await expect(page.locator('#export-preview')).toContainText('SUMMARY:');
  95  |   await expect(page.locator('#export-preview')).toContainText('DTSTART');
  96  |
  97  | });
  98  |
  99  | test('6.7 filters_update_all_surfaces', async ({ page }) => {
  100 |
  101 |   await page.click('.map-pins');
> 102 |   await expect(page.locator('#detail-card')).toBeVisible();
      |                                              ^ Error: expect(locator).toBeVisible() failed
  103 | });
  104 |
  105 | test('6.8 collapsible_chrome_preserves_workflow', async ({ page }) => {
  106 |   await page.click('#add-stop');
  107 |   await expect(page.locator('#stop-dialog')).toBeVisible();
  108 | });
  109 |
  110 | test('6.9 overlays_support_expected_flows', async ({ page }) => {
  111 |
  112 |   await page.click('#open-export');
  113 |   await page.click('button[data-export="ics"]');
  114 |   await expect(page.locator('#export-preview')).toContainText('BEGIN:VCALENDAR');
  115 |   await expect(page.locator('#export-preview')).toContainText('BEGIN:VEVENT');
  116 |   await expect(page.locator('#export-preview')).toContainText('SUMMARY:');
  117 |   await expect(page.locator('#export-preview')).toContainText('DTSTART');
  118 |
  119 | });
  120 |
  121 | test('6.10 flow_recovers_without_reload', async ({ page }) => {
  122 |
  123 |   await page.click('#open-export');
  124 |   await page.click('button[data-export="trip-json"]');
  125 |   const payload = await page.locator('#export-preview').innerText();
  126 |   await page.click('button[data-export="import"]');
  127 |   await page.fill('#import-text', payload);
  128 |   await page.click('#import-submit');
  129 |   await expect(page.locator('.stop-row')).toHaveCount(8);
  130 |
  131 | });
  132 |
  133 | test('6.11 drag_reassign_updates_route_and_log', async ({ page }) => {
  134 |   await page.click('#add-stop');
  135 |   await expect(page.locator('#stop-dialog')).toBeVisible();
  136 | });
  137 |
  138 | // NOT-AUTOMATABLE: 6.12 — vote_promotion_end_to_end: Subjective/Visual
  139 | test('6.13 conflict_merge_end_to_end', async ({ page }) => {
  140 |
  141 |   await page.click('.stop-row:first-child');
  142 |   await page.click('#edit-selected');
  143 |   await page.fill('input[name="title"]', 'Renamed Stop');
  144 |   await page.click('#stop-submit');
  145 |   await expect(page.locator('.stop-row').first()).toContainText('Renamed Stop');
  146 |
  147 | });
  148 |
  149 | test('6.14 undo_redo_round_trip_flow', async ({ page }) => {
  150 |
  151 |   page.on('dialog', dialog => dialog.accept());
  152 |   await page.click('.stop-row:first-child');
  153 |   await page.click('#delete-selected');
  154 |   await page.waitForTimeout(300);
  155 |   await expect(page.locator('.stop-row')).toHaveCount(7);
  156 |
  157 | });
  158 |
  159 | test('6.15 kanban_status_echoes_plan_list', async ({ page }) => {
  160 |   await page.click('#add-stop');
  161 |   await expect(page.locator('#stop-dialog')).toBeVisible();
  162 | });
  163 |
  164 | test('6.16 role_round_trip_preserves_edits', async ({ page }) => {
  165 |
  166 |   await page.click('.stop-row:first-child');
  167 |   await page.click('#edit-selected');
  168 |   await page.fill('input[name="title"]', 'Renamed Stop');
  169 |   await page.click('#stop-submit');
  170 |   await expect(page.locator('.stop-row').first()).toContainText('Renamed Stop');
  171 |
  172 | });
  173 |
  174 | test('6.17 export_import_round_trip_flow', async ({ page }) => {
  175 |
  176 |   await page.click('#open-export');
  177 |   await page.click('button[data-export="trip-json"]');
  178 |   const payload = await page.locator('#export-preview').innerText();
  179 |   await page.click('button[data-export="import"]');
  180 |   await page.fill('#import-text', payload);
  181 |   await page.click('#import-submit');
  182 |   await expect(page.locator('.stop-row')).toHaveCount(8);
  183 |
  184 | });
  185 |
  186 | test('2.1 shared_state_coherence', async ({ page }) => {
  187 |
  188 |   await page.click('.stop-row:first-child');
  189 |   await page.click('#edit-selected');
  190 |   await page.fill('input[name="title"]', 'Renamed Stop');
  191 |   await page.click('#stop-submit');
  192 |   await expect(page.locator('.stop-row').first()).toContainText('Renamed Stop');
  193 |
  194 | });
  195 |
  196 | test('2.2 reload_resets_all_facets_coherently', async ({ page }) => {
  197 |   await page.click('#add-stop');
  198 |   await expect(page.locator('#stop-dialog')).toBeVisible();
  199 | });
  200 |
  201 | test('2.5 console_clean_full_exercise', async ({ page }) => {
  202 |
```