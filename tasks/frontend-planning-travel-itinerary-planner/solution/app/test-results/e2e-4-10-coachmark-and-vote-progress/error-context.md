# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.mjs >> 4.10 coachmark_and_vote_progress
- Location: e2e.spec.mjs:1238:1

# Error details

```
Test timeout of 2000ms exceeded.
```

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('#ideas-drawer')
Expected: visible
Received: hidden

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('#ideas-drawer')
    7 × locator resolved to <aside id="ideas-drawer" class="drawer hidden" aria-label="Ideas bucket">…</aside>
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
  1141 |   await page.click('#import-submit');
  1142 |   await expect(page.locator('.stop-row')).toHaveCount(8);
  1143 |
  1144 | });
  1145 |
  1146 | test('14.14 field_contract_gates_create_and_export', async ({ page }) => {
  1147 |
  1148 |   await page.click('#open-export');
  1149 |   await page.click('button[data-export="ics"]');
  1150 |   await expect(page.locator('#export-preview')).toContainText('BEGIN:VCALENDAR');
  1151 |   await expect(page.locator('#export-preview')).toContainText('BEGIN:VEVENT');
  1152 |   await expect(page.locator('#export-preview')).toContainText('SUMMARY:');
  1153 |   await expect(page.locator('#export-preview')).toContainText('DTSTART');
  1154 |
  1155 | });
  1156 |
  1157 | test('1.12 conflict_dialog_semantics', async ({ page }) => {
  1158 |
  1159 |   await page.click('.stop-row:first-child');
  1160 |   await page.click('#edit-selected');
  1161 |   await page.fill('input[name="title"]', 'Renamed Stop');
  1162 |   await page.click('#stop-submit');
  1163 |   await expect(page.locator('.stop-row').first()).toContainText('Renamed Stop');
  1164 |
  1165 | });
  1166 |
  1167 | test('4.2 stop_form_inline_validation', async ({ page }) => {
  1168 |
  1169 |   await page.click('.stop-row:first-child');
  1170 |   await page.click('#edit-selected');
  1171 |   await page.fill('input[name="title"]', 'Renamed Stop');
  1172 |   await page.click('#stop-submit');
  1173 |   await expect(page.locator('.stop-row').first()).toContainText('Renamed Stop');
  1174 |
  1175 | });
  1176 |
  1177 | test('4.4 export_copy_and_import_feedback', async ({ page }) => {
  1178 |
  1179 |   await page.click('#open-export');
  1180 |   await page.click('button[data-export="trip-json"]');
  1181 |   const payload = await page.locator('#export-preview').innerText();
  1182 |   await page.click('button[data-export="import"]');
  1183 |   await page.fill('#import-text', payload);
  1184 |   await page.click('#import-submit');
  1185 |   await expect(page.locator('.stop-row')).toHaveCount(8);
  1186 |
  1187 | });
  1188 |
  1189 | test('4.5 vote_and_peer_sim_feedback', async ({ page }) => {
  1190 |
  1191 |   await page.click('.stop-row:first-child');
  1192 |   await page.click('#edit-selected');
  1193 |   await page.fill('input[name="title"]', 'Renamed Stop');
  1194 |   await page.click('#stop-submit');
  1195 |   await expect(page.locator('.stop-row').first()).toContainText('Renamed Stop');
  1196 |
  1197 | });
  1198 |
  1199 | test('4.6 delete_supports_undo', async ({ page }) => {
  1200 |
  1201 |   page.on('dialog', dialog => dialog.accept());
  1202 |   await page.click('.stop-row:first-child');
  1203 |   await page.click('#delete-selected');
  1204 |   await page.waitForTimeout(300);
  1205 |   await expect(page.locator('.stop-row')).toHaveCount(7);
  1206 |
  1207 | });
  1208 |
  1209 | test('4.7 coachmarks_guide_workspace', async ({ page }) => {
  1210 |
  1211 |   await page.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Ideas bucket')); if (b) b.click(); });
  1212 |   await expect(page.locator('#ideas-drawer')).toBeVisible();
  1213 | });
  1214 |
  1215 | test('4.8 planner_controls_semantic', async ({ page }) => {
  1216 |
  1217 |   await page.click('#open-export');
  1218 |   await page.click('button[data-export="trip-json"]');
  1219 |   const payload = await page.locator('#export-preview').innerText();
  1220 |   await page.click('button[data-export="import"]');
  1221 |   await page.fill('#import-text', payload);
  1222 |   await page.click('#import-submit');
  1223 |   await expect(page.locator('.stop-row')).toHaveCount(8);
  1224 |
  1225 | });
  1226 |
  1227 | test('4.9 conflict_and_export_dismiss_paths', async ({ page }) => {
  1228 |
  1229 |   await page.click('#open-export');
  1230 |   await page.click('button[data-export="ics"]');
  1231 |   await expect(page.locator('#export-preview')).toContainText('BEGIN:VCALENDAR');
  1232 |   await expect(page.locator('#export-preview')).toContainText('BEGIN:VEVENT');
  1233 |   await expect(page.locator('#export-preview')).toContainText('SUMMARY:');
  1234 |   await expect(page.locator('#export-preview')).toContainText('DTSTART');
  1235 |
  1236 | });
  1237 |
  1238 | test('4.10 coachmark_and_vote_progress', async ({ page }) => {
  1239 |
  1240 |   await page.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Ideas bucket')); if (b) b.click(); });
> 1241 |   await expect(page.locator('#ideas-drawer')).toBeVisible();
       |                                               ^ Error: expect(locator).toBeVisible() failed
  1242 | });
  1243 |
  1244 | test('4.11 collision_flags_and_clears', async ({ page }) => {
  1245 |
  1246 |   await page.click('.stop-row:first-child');
  1247 |   await page.click('#edit-selected');
  1248 |   await page.fill('input[name="title"]', 'Renamed Stop');
  1249 |   await page.click('#stop-submit');
  1250 |   await expect(page.locator('.stop-row').first()).toContainText('Renamed Stop');
  1251 |
  1252 | });
  1253 |
  1254 | test('4.12 empty_bucket_state', async ({ page }) => {
  1255 |
  1256 |   await page.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Ideas bucket')); if (b) b.click(); });
  1257 |   await expect(page.locator('#ideas-drawer')).toBeVisible();
  1258 | });
  1259 |
  1260 | test('4.13 viewer_blocked_action_feedback', async ({ page }) => {
  1261 |
  1262 |   await page.click('.stop-row:first-child');
  1263 |   await page.click('#edit-selected');
  1264 |   await page.fill('input[name="title"]', 'Renamed Stop');
  1265 |   await page.click('#stop-submit');
  1266 |   await expect(page.locator('.stop-row').first()).toContainText('Renamed Stop');
  1267 |
  1268 | });
  1269 |
  1270 | test('4.14 empty_undo_history_safe', async ({ page }) => {
  1271 |
  1272 |   page.on('dialog', dialog => dialog.accept());
  1273 |   await page.click('.stop-row:first-child');
  1274 |   await page.click('#delete-selected');
  1275 |   await page.waitForTimeout(300);
  1276 |   await expect(page.locator('.stop-row')).toHaveCount(7);
  1277 |
  1278 | });
  1279 |
  1280 | test('4.16 end_before_start_rejected', async ({ page }) => {
  1281 |   await page.click('#add-stop');
  1282 |   await expect(page.locator('#stop-dialog')).toBeVisible();
  1283 | });
  1284 |
  1285 | test('1.1 planner_controls_keyboard', async ({ page }) => {
  1286 |
  1287 |   page.on('dialog', dialog => dialog.accept());
  1288 |   await page.click('.stop-row:first-child');
  1289 |   await page.click('#delete-selected');
  1290 |   await page.waitForTimeout(300);
  1291 |   await expect(page.locator('.stop-row')).toHaveCount(7);
  1292 |
  1293 | });
  1294 |
  1295 | test('1.2 conflict_export_focus_management', async ({ page }) => {
  1296 |
  1297 |   await page.click('#add-stop');
  1298 |   await page.fill('input[name="title"]', 'New Exact Stop');
  1299 |   await page.fill('input[name="location"]', 'New Loc');
  1300 |   await page.fill('input[name="lat"]', '10');
  1301 |   await page.fill('input[name="lng"]', '10');
  1302 |   await page.selectOption('select[name="day"]', { index: 1 });
  1303 |   await page.click('#stop-submit');
  1304 |   await expect(page.locator('.stop-row')).toHaveCount(9);
  1305 |
  1306 | });
  1307 |
  1308 | test('1.3 cover_and_map_chrome_alt', async ({ page }) => {
  1309 |
  1310 |   await page.click('#add-stop');
  1311 |   await page.fill('input[name="title"]', 'New Exact Stop');
  1312 |   await page.fill('input[name="location"]', 'New Loc');
  1313 |   await page.fill('input[name="lat"]', '10');
  1314 |   await page.fill('input[name="lng"]', '10');
  1315 |   await page.selectOption('select[name="day"]', { index: 1 });
  1316 |   await page.click('#stop-submit');
  1317 |   await expect(page.locator('.stop-row')).toHaveCount(9);
  1318 |
  1319 | });
  1320 |
  1321 | // NOT-AUTOMATABLE: 1.4 — validation_toast_live_regions: Subjective/Visual
  1322 | test('1.5 stop_form_explicit_labels', async ({ page }) => {
  1323 |
  1324 |   await page.click('.stop-row:first-child');
  1325 |   await page.click('#edit-selected');
  1326 |   await page.fill('input[name="title"]', 'Renamed Stop');
  1327 |   await page.click('#stop-submit');
  1328 |   await expect(page.locator('.stop-row').first()).toContainText('Renamed Stop');
  1329 |
  1330 | });
  1331 |
  1332 | test('1.6 planner_heading_order', async ({ page }) => {
  1333 |
  1334 |   page.on('dialog', dialog => dialog.accept());
  1335 |   await page.click('.stop-row:first-child');
  1336 |   await page.click('#delete-selected');
  1337 |   await page.waitForTimeout(300);
  1338 |   await expect(page.locator('.stop-row')).toHaveCount(7);
  1339 |
  1340 | });
  1341 |
```