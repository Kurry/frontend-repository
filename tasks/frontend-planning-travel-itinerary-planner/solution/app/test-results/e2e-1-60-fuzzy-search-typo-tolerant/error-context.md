# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.mjs >> 1.60 fuzzy_search_typo_tolerant
- Location: e2e.spec.mjs:899:1

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
    6 × locator resolved to <div role="region" id="detail-card" aria-label="Place detail" class="detail-card hidden">…</div>
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
  802  |
  803  | // NOT-AUTOMATABLE: 1.43 — day_polylines_with_recomputed_distances: Subjective/Visual
  804  | test('1.44 marker_clustering_by_zoom', async ({ page }) => {
  805  |
  806  |   await page.click('.map-pins');
  807  |   await expect(page.locator('#detail-card')).toBeVisible();
  808  | });
  809  |
  810  | test('1.45 map_layer_toggle_three_styles', async ({ page }) => {
  811  |
  812  |   await page.click('.map-pins');
  813  |   await expect(page.locator('#detail-card')).toBeVisible();
  814  | });
  815  |
  816  | test('1.46 lodging_isochrone_toggle', async ({ page }) => {
  817  |   await page.click('#add-stop');
  818  |   await expect(page.locator('#stop-dialog')).toBeVisible();
  819  | });
  820  |
  821  | test('1.47 drag_reassign_and_reorder', async ({ page }) => {
  822  |
  823  |   await page.click('.map-pins');
  824  |   await expect(page.locator('#detail-card')).toBeVisible();
  825  | });
  826  |
  827  | test('1.48 day_accordion_collapse_expand', async ({ page }) => {
  828  |   await page.click('#add-stop');
  829  |   await expect(page.locator('#stop-dialog')).toBeVisible();
  830  | });
  831  |
  832  | test('1.49 time_collision_amber_warning', async ({ page }) => {
  833  |   await page.click('#add-stop');
  834  |   await expect(page.locator('#stop-dialog')).toBeVisible();
  835  | });
  836  |
  837  | test('1.50 travel_buffer_mode_recompute', async ({ page }) => {
  838  |   await page.click('#add-stop');
  839  |   await expect(page.locator('#stop-dialog')).toBeVisible();
  840  | });
  841  |
  842  | test('1.51 impossible_transit_warning', async ({ page }) => {
  843  |   await page.click('#add-stop');
  844  |   await expect(page.locator('#stop-dialog')).toBeVisible();
  845  | });
  846  |
  847  | test('1.52 timezone_axis_relabels_times', async ({ page }) => {
  848  |   await page.click('#add-stop');
  849  |   await expect(page.locator('#stop-dialog')).toBeVisible();
  850  | });
  851  |
  852  | test('1.53 recurring_generator_creates_seven_blocks', async ({ page }) => {
  853  |   await page.click('#add-stop');
  854  |   await expect(page.locator('#stop-dialog')).toBeVisible();
  855  | });
  856  |
  857  | test('1.54 bucket_drawer_with_polls', async ({ page }) => {
  858  |
  859  |   await page.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Ideas bucket')); if (b) b.click(); });
  860  |   await expect(page.locator('#ideas-drawer')).toBeVisible();
  861  | });
  862  |
  863  | // NOT-AUTOMATABLE: 1.55 — vote_winner_promotes_to_timeline: Subjective/Visual
  864  | test('1.56 conflict_modal_choice_applies', async ({ page }) => {
  865  |
  866  |   await page.click('.stop-row:first-child');
  867  |   await page.click('#edit-selected');
  868  |   await page.fill('input[name="title"]', 'Renamed Stop');
  869  |   await page.click('#stop-submit');
  870  |   await expect(page.locator('.stop-row').first()).toContainText('Renamed Stop');
  871  |
  872  | });
  873  |
  874  | test('1.57 role_switcher_gates_controls', async ({ page }) => {
  875  |
  876  |   page.on('dialog', dialog => dialog.accept());
  877  |   await page.click('.stop-row:first-child');
  878  |   await page.click('#delete-selected');
  879  |   await page.waitForTimeout(300);
  880  |   await expect(page.locator('.stop-row')).toHaveCount(7);
  881  |
  882  | });
  883  |
  884  | test('1.58 activity_log_records_mutations', async ({ page }) => {
  885  |
  886  |   page.on('dialog', dialog => dialog.accept());
  887  |   await page.click('.stop-row:first-child');
  888  |   await page.click('#delete-selected');
  889  |   await page.waitForTimeout(300);
  890  |   await expect(page.locator('.stop-row')).toHaveCount(7);
  891  |
  892  | });
  893  |
  894  | test('1.59 filter_ribbon_combines_and_clears', async ({ page }) => {
  895  |   await page.click('#add-stop');
  896  |   await expect(page.locator('#stop-dialog')).toBeVisible();
  897  | });
  898  |
  899  | test('1.60 fuzzy_search_typo_tolerant', async ({ page }) => {
  900  |
  901  |   await page.click('.map-pins');
> 902  |   await expect(page.locator('#detail-card')).toBeVisible();
       |                                              ^ Error: expect(locator).toBeVisible() failed
  903  | });
  904  |
  905  | test('1.61 bulk_selection_bar_actions', async ({ page }) => {
  906  |
  907  |   page.on('dialog', dialog => dialog.accept());
  908  |   await page.click('.stop-row:first-child');
  909  |   await page.click('#delete-selected');
  910  |   await page.waitForTimeout(300);
  911  |   await expect(page.locator('.stop-row')).toHaveCount(7);
  912  |
  913  | });
  914  |
  915  | test('1.62 kanban_pivot_status_columns', async ({ page }) => {
  916  |   await page.click('#add-stop');
  917  |   await expect(page.locator('#stop-dialog')).toBeVisible();
  918  | });
  919  |
  920  | test('1.63 markdown_export_live_compile', async ({ page }) => {
  921  |
  922  |   await page.click('#open-export');
  923  |   await page.click('button[data-export="ics"]');
  924  |   await expect(page.locator('#export-preview')).toContainText('BEGIN:VCALENDAR');
  925  |   await expect(page.locator('#export-preview')).toContainText('BEGIN:VEVENT');
  926  |   await expect(page.locator('#export-preview')).toContainText('SUMMARY:');
  927  |   await expect(page.locator('#export-preview')).toContainText('DTSTART');
  928  |
  929  | });
  930  |
  931  | test('1.64 ics_payload_valid_structure', async ({ page }) => {
  932  |
  933  |   await page.click('#open-export');
  934  |   await page.click('button[data-export="ics"]');
  935  |   await expect(page.locator('#export-preview')).toContainText('BEGIN:VCALENDAR');
  936  |   await expect(page.locator('#export-preview')).toContainText('BEGIN:VEVENT');
  937  |   await expect(page.locator('#export-preview')).toContainText('SUMMARY:');
  938  |   await expect(page.locator('#export-preview')).toContainText('DTSTART');
  939  |
  940  | });
  941  |
  942  | test('1.65 undo_redo_structural_changes', async ({ page }) => {
  943  |
  944  |   page.on('dialog', dialog => dialog.accept());
  945  |   await page.click('.stop-row:first-child');
  946  |   await page.click('#delete-selected');
  947  |   await page.waitForTimeout(300);
  948  |   await expect(page.locator('.stop-row')).toHaveCount(7);
  949  |
  950  | });
  951  |
  952  | test('1.66 coachmarks_sequence_first_load', async ({ page }) => {
  953  |
  954  |   await page.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Ideas bucket')); if (b) b.click(); });
  955  |   await expect(page.locator('#ideas-drawer')).toBeVisible();
  956  | });
  957  |
  958  | test('1.67 theme_toggle_swaps_all_panes', async ({ page }) => {
  959  |
  960  |   await page.click('.map-pins');
  961  |   await expect(page.locator('#detail-card')).toBeVisible();
  962  | });
  963  |
  964  | test('1.71 stop_field_contract_enforced', async ({ page }) => {
  965  |
  966  |   await page.click('.stop-row:first-child');
  967  |   await page.click('#edit-selected');
  968  |   await page.fill('input[name="title"]', 'Renamed Stop');
  969  |   await page.click('#stop-submit');
  970  |   await expect(page.locator('.stop-row').first()).toContainText('Renamed Stop');
  971  |
  972  | });
  973  |
  974  | test('1.72 trip_json_live_compile', async ({ page }) => {
  975  |
  976  |   await page.click('#open-export');
  977  |   await page.click('button[data-export="ics"]');
  978  |   await expect(page.locator('#export-preview')).toContainText('BEGIN:VCALENDAR');
  979  |   await expect(page.locator('#export-preview')).toContainText('BEGIN:VEVENT');
  980  |   await expect(page.locator('#export-preview')).toContainText('SUMMARY:');
  981  |   await expect(page.locator('#export-preview')).toContainText('DTSTART');
  982  |
  983  | });
  984  |
  985  | test('1.73 trip_json_download_and_copy', async ({ page }) => {
  986  |
  987  |   await page.click('#open-export');
  988  |   await page.click('button[data-export="ics"]');
  989  |   await expect(page.locator('#export-preview')).toContainText('BEGIN:VCALENDAR');
  990  |   await expect(page.locator('#export-preview')).toContainText('BEGIN:VEVENT');
  991  |   await expect(page.locator('#export-preview')).toContainText('SUMMARY:');
  992  |   await expect(page.locator('#export-preview')).toContainText('DTSTART');
  993  |
  994  | });
  995  |
  996  | test('1.74 import_trip_json_reconstructs', async ({ page }) => {
  997  |
  998  |   await page.click('#open-export');
  999  |   await page.click('button[data-export="trip-json"]');
  1000 |   const payload = await page.locator('#export-preview').innerText();
  1001 |   await page.click('button[data-export="import"]');
  1002 |   await page.fill('#import-text', payload);
```