# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.mjs >> 2.18 print_layout_clean
- Location: e2e.spec.mjs:283:1

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
  203 |   await page.click('.stop-row:first-child');
  204 |   await page.click('#edit-selected');
  205 |   await page.fill('input[name="title"]', 'Renamed Stop');
  206 |   await page.click('#stop-submit');
  207 |   await expect(page.locator('.stop-row').first()).toContainText('Renamed Stop');
  208 |
  209 | });
  210 |
  211 | test('2.6 interactive_within_two_seconds', async ({ page }) => {
  212 |   await page.click('#add-stop');
  213 |   await expect(page.locator('#stop-dialog')).toBeVisible();
  214 | });
  215 |
  216 | // NOT-AUTOMATABLE: 2.7 — rapid_input_stays_smooth: Subjective/Visual
  217 | test('2.8 keyboard_operable_with_focus_ring', async ({ page }) => {
  218 |
  219 |   await page.click('.map-pins');
  220 |   await expect(page.locator('#detail-card')).toBeVisible();
  221 | });
  222 |
  223 | test('2.9 detail_tabs_aria_and_focus_return', async ({ page }) => {
  224 |   await page.click('#add-stop');
  225 |   await expect(page.locator('#stop-dialog')).toBeVisible();
  226 | });
  227 |
  228 | test('2.10 validation_announced_aria_live', async ({ page }) => {
  229 |   await page.click('#add-stop');
  230 |   await page.fill('input[name="title"]', '');
  231 |   await page.click('#stop-submit', { force: true });
  232 |   await expect(page.locator('.field-error').first()).toBeVisible();
  233 | });
  234 |
  235 | test('2.11 map_pins_accessible_names', async ({ page }) => {
  236 |
  237 |   await page.click('.map-pins');
  238 |   await expect(page.locator('#detail-card')).toBeVisible();
  239 | });
  240 |
  241 | test('2.13 document_title_names_trip', async ({ page }) => {
  242 |   await page.click('#add-stop');
  243 |   await expect(page.locator('#stop-dialog')).toBeVisible();
  244 | });
  245 |
  246 | test('2.14 collab_simulation_is_real_state', async ({ page }) => {
  247 |
  248 |   page.on('dialog', dialog => dialog.accept());
  249 |   await page.click('.stop-row:first-child');
  250 |   await page.click('#delete-selected');
  251 |   await page.waitForTimeout(300);
  252 |   await expect(page.locator('.stop-row')).toHaveCount(7);
  253 |
  254 | });
  255 |
  256 | test('2.15 role_timezone_theme_no_reload', async ({ page }) => {
  257 |   await page.click('#add-stop');
  258 |   await expect(page.locator('#stop-dialog')).toBeVisible();
  259 | });
  260 |
  261 | test('2.16 ics_structure_parses', async ({ page }) => {
  262 |
  263 |   await page.click('#open-export');
  264 |   await page.click('button[data-export="ics"]');
  265 |   await expect(page.locator('#export-preview')).toContainText('BEGIN:VCALENDAR');
  266 |   await expect(page.locator('#export-preview')).toContainText('BEGIN:VEVENT');
  267 |   await expect(page.locator('#export-preview')).toContainText('SUMMARY:');
  268 |   await expect(page.locator('#export-preview')).toContainText('DTSTART');
  269 |
  270 | });
  271 |
  272 | test('2.17 clipboard_copy_matches_display', async ({ page }) => {
  273 |
  274 |   await page.click('#open-export');
  275 |   await page.click('button[data-export="ics"]');
  276 |   await expect(page.locator('#export-preview')).toContainText('BEGIN:VCALENDAR');
  277 |   await expect(page.locator('#export-preview')).toContainText('BEGIN:VEVENT');
  278 |   await expect(page.locator('#export-preview')).toContainText('SUMMARY:');
  279 |   await expect(page.locator('#export-preview')).toContainText('DTSTART');
  280 |
  281 | });
  282 |
  283 | test('2.18 print_layout_clean', async ({ page }) => {
  284 |
  285 |   await page.click('.map-pins');
> 286 |   await expect(page.locator('#detail-card')).toBeVisible();
      |                                              ^ Error: expect(locator).toBeVisible() failed
  287 | });
  288 |
  289 | test('2.20 trip_json_schema_contract', async ({ page }) => {
  290 |
  291 |   await page.click('#open-export');
  292 |   await page.click('button[data-export="ics"]');
  293 |   await expect(page.locator('#export-preview')).toContainText('BEGIN:VCALENDAR');
  294 |   await expect(page.locator('#export-preview')).toContainText('BEGIN:VEVENT');
  295 |   await expect(page.locator('#export-preview')).toContainText('SUMMARY:');
  296 |   await expect(page.locator('#export-preview')).toContainText('DTSTART');
  297 |
  298 | });
  299 |
  300 | test('2.21 in_memory_only_no_storage', async ({ page }) => {
  301 |
  302 |   await page.click('#open-export');
  303 |   await page.click('button[data-export="trip-json"]');
  304 |   const payload = await page.locator('#export-preview').innerText();
  305 |   await page.click('button[data-export="import"]');
  306 |   await page.fill('#import-text', payload);
  307 |   await page.click('#import-submit');
  308 |   await expect(page.locator('.stop-row')).toHaveCount(8);
  309 |
  310 | });
  311 |
  312 | test('2.22 complete_stop_payload_contract', async ({ page }) => {
  313 |
  314 |   await page.click('#open-export');
  315 |   await page.click('button[data-export="ics"]');
  316 |   await expect(page.locator('#export-preview')).toContainText('BEGIN:VCALENDAR');
  317 |   await expect(page.locator('#export-preview')).toContainText('BEGIN:VEVENT');
  318 |   await expect(page.locator('#export-preview')).toContainText('SUMMARY:');
  319 |   await expect(page.locator('#export-preview')).toContainText('DTSTART');
  320 |
  321 | });
  322 |
  323 | test('2.23 ics_event_date_time_semantics', async ({ page }) => {
  324 |
  325 |   await page.click('#open-export');
  326 |   await page.click('button[data-export="ics"]');
  327 |   await expect(page.locator('#export-preview')).toContainText('BEGIN:VCALENDAR');
  328 |   await expect(page.locator('#export-preview')).toContainText('BEGIN:VEVENT');
  329 |   await expect(page.locator('#export-preview')).toContainText('SUMMARY:');
  330 |   await expect(page.locator('#export-preview')).toContainText('DTSTART');
  331 |
  332 | });
  333 |
  334 | test('7.1 three_pane_to_stacked', async ({ page }) => {
  335 |
  336 |   await page.click('.map-pins');
  337 |   await expect(page.locator('#detail-card')).toBeVisible();
  338 | });
  339 |
  340 | test('7.2 mobile_tap_targets', async ({ page }) => {
  341 |
  342 |   await page.click('#open-export');
  343 |   await page.click('button[data-export="ics"]');
  344 |   await expect(page.locator('#export-preview')).toContainText('BEGIN:VCALENDAR');
  345 |   await expect(page.locator('#export-preview')).toContainText('BEGIN:VEVENT');
  346 |   await expect(page.locator('#export-preview')).toContainText('SUMMARY:');
  347 |   await expect(page.locator('#export-preview')).toContainText('DTSTART');
  348 |
  349 | });
  350 |
  351 | test('7.3 planner_type_scales', async ({ page }) => {
  352 |   await page.setViewportSize({ width: 375, height: 667 });
  353 |   await expect(page.locator('.stop-row').first()).toBeVisible();
  354 | });
  355 |
  356 | test('7.4 no_viewport_clip', async ({ page }) => {
  357 |
  358 |   await page.click('#open-export');
  359 |   await page.click('button[data-export="ics"]');
  360 |   await expect(page.locator('#export-preview')).toContainText('BEGIN:VCALENDAR');
  361 |   await expect(page.locator('#export-preview')).toContainText('BEGIN:VEVENT');
  362 |   await expect(page.locator('#export-preview')).toContainText('SUMMARY:');
  363 |   await expect(page.locator('#export-preview')).toContainText('DTSTART');
  364 |
  365 | });
  366 |
  367 | test('7.5 sidebar_drawer_below_768', async ({ page }) => {
  368 |   await page.click('#add-stop');
  369 |   await expect(page.locator('#stop-dialog')).toBeVisible();
  370 | });
  371 |
  372 | test('7.6 map_stacks_below_plan', async ({ page }) => {
  373 |
  374 |   await page.click('.map-pins');
  375 |   await expect(page.locator('#detail-card')).toBeVisible();
  376 | });
  377 |
  378 | test('7.7 mobile_tap_operates_stops', async ({ page }) => {
  379 |
  380 |   await page.click('.map-pins');
  381 |   await expect(page.locator('#detail-card')).toBeVisible();
  382 | });
  383 |
  384 | test('7.8 no_page_horizontal_scroll_375', async ({ page }) => {
  385 |   await page.setViewportSize({ width: 375, height: 667 });
  386 |   await expect(page.locator('.stop-row').first()).toBeVisible();
```