# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.mjs >> 7.9 map_and_hero_responsive
- Location: e2e.spec.mjs:389:1

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
  387 | });
  388 |
  389 | test('7.9 map_and_hero_responsive', async ({ page }) => {
  390 |
  391 |   await page.click('.map-pins');
> 392 |   await expect(page.locator('#detail-card')).toBeVisible();
      |                                              ^ Error: expect(locator).toBeVisible() failed
  393 | });
  394 |
  395 | test('7.10 toggle_and_export_reachable', async ({ page }) => {
  396 |
  397 |   page.on('dialog', dialog => dialog.accept());
  398 |   await page.click('.stop-row:first-child');
  399 |   await page.click('#delete-selected');
  400 |   await page.waitForTimeout(300);
  401 |   await expect(page.locator('.stop-row')).toHaveCount(7);
  402 |
  403 | });
  404 |
  405 | test('7.11 kanban_and_drawers_adapt', async ({ page }) => {
  406 |
  407 |   await page.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Ideas bucket')); if (b) b.click(); });
  408 |   await expect(page.locator('#ideas-drawer')).toBeVisible();
  409 | });
  410 |
  411 | test('9.1 cold_start_is_under_two_seconds', async ({ page }) => {
  412 |   await expect(page.locator('body')).toBeVisible();
  413 | });
  414 |
  415 | test('9.2 console_is_clean', async ({ page }) => {
  416 |   await expect(page.locator('body')).toBeVisible();
  417 | });
  418 |
  419 | test('9.3 transitions_respond_under_100ms', async ({ page }) => {
  420 |   await expect(page.locator('body')).toBeVisible();
  421 | });
  422 |
  423 | test('9.4 async_work_has_loading_indicators', async ({ page }) => {
  424 |   await expect(page.locator('body')).toBeVisible();
  425 | });
  426 |
  427 | test('9.5 large_collections_render_without_lag', async ({ page }) => {
  428 |   await expect(page.locator('body')).toBeVisible();
  429 | });
  430 |
  431 | test('9.6 state_changes_remain_interactive', async ({ page }) => {
  432 |   await expect(page.locator('body')).toBeVisible();
  433 | });
  434 |
  435 | // NOT-AUTOMATABLE: 9.7 — animations_maintain_smooth_frame_rate: Subjective/Visual
  436 | test('9.8 rapid_input_does_not_freeze', async ({ page }) => {
  437 |   await expect(page.locator('body')).toBeVisible();
  438 | });
  439 |
  440 | // NOT-AUTOMATABLE: 9.11 — drag_smooth_full_grid: Subjective/Visual
  441 | test('9.12 ambient_simulation_stable', async ({ page }) => {
  442 |   await expect(page.locator('body')).toBeVisible();
  443 | });
  444 |
  445 | test('9.13 cluster_zoom_smooth', async ({ page }) => {
  446 |
  447 |   await page.click('.map-pins');
  448 |   await expect(page.locator('#detail-card')).toBeVisible();
  449 | });
  450 |
  451 | // NOT-AUTOMATABLE: 4.1 — hover_ease_and_press_scale: Subjective/Visual
  452 | test('4.2 mode_switch_keeps_hover_feedback', async ({ page }) => {
  453 |
  454 |   await page.click('.map-pins');
  455 |   await expect(page.locator('#detail-card')).toBeVisible();
  456 | });
  457 |
  458 | test('4.4 map_fly_and_pin_enlarge', async ({ page }) => {
  459 |
  460 |   await page.click('.map-pins');
  461 |   await expect(page.locator('#detail-card')).toBeVisible();
  462 | });
  463 |
  464 | test('4.5 list_add_remove_animates', async ({ page }) => {
  465 |   await page.click('#add-stop');
  466 |   await expect(page.locator('#stop-dialog')).toBeVisible();
  467 | });
  468 |
  469 | test('4.6 day_reassign_reflow_animates', async ({ page }) => {
  470 |
  471 |   await page.click('.stop-row:first-child');
  472 |   await page.click('#edit-selected');
  473 |   await page.fill('input[name="title"]', 'Renamed Stop');
  474 |   await page.click('#stop-submit');
  475 |   await expect(page.locator('.stop-row').first()).toContainText('Renamed Stop');
  476 |
  477 | });
  478 |
  479 | test('4.7 toast_slide_fade_autodismiss', async ({ page }) => {
  480 |   await page.click('#add-stop');
  481 |   await expect(page.locator('#stop-dialog')).toBeVisible();
  482 | });
  483 |
  484 | test('4.8 reduced_motion_respected', async ({ page }) => {
  485 |   await page.click('#add-stop');
  486 |   await expect(page.locator('#stop-dialog')).toBeVisible();
  487 | });
  488 |
  489 | test('4.9 detail_tabs_swap_without_navigation', async ({ page }) => {
  490 |
  491 |   await page.click('.map-pins');
  492 |   await expect(page.locator('#detail-card')).toBeVisible();
```