# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.mjs >> 7.10 toggle_and_export_reachable
- Location: e2e.spec.mjs:395:1

# Error details

```
Test timeout of 2000ms exceeded.
```

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  locator('.stop-row')
Expected: 7
Received: 13

Call log:
  - Expect "toHaveCount" with timeout 5000ms
  - waiting for locator('.stop-row')
    6 × locator resolved to 13 elements
      - unexpected value "13"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to itinerary" [ref=e2] [cursor=pointer]:
    - /url: "#plan"
  - generic [ref=e3]:
    - banner [ref=e4]:
      - generic [ref=e5]:
        - generic [ref=e6]: T
        - generic [ref=e7]:
          - generic [ref=e8]: Trip
          - generic [ref=e9]: Travel Planner
      - tablist "Plan mode" [ref=e10]:
        - tab "Trip plan" [selected] [ref=e11] [cursor=pointer]
        - tab "Trip journal" [ref=e12] [cursor=pointer]
      - generic [ref=e13]:
        - generic [ref=e14]:
          - text: Role
          - combobox "Current role" [ref=e15] [cursor=pointer]:
            - option "Owner" [selected]
            - option "Editor"
            - option "Viewer"
        - button "Switch to dark theme" [ref=e16] [cursor=pointer]: ☾
        - button "Share" [ref=e17] [cursor=pointer]
        - button "Export trip" [ref=e18] [cursor=pointer]
    - complementary "Trip navigation" [ref=e19]:
      - generic [ref=e21]: PLAN
      - button "⌂ Overview" [ref=e22] [cursor=pointer]:
        - generic [ref=e23]: ⌂
        - text: Overview
      - paragraph [ref=e24]: ITINERARY
      - navigation "Itinerary days" [ref=e25]:
        - button "Sun 7/5 1" [ref=e26] [cursor=pointer]:
          - generic [ref=e28]: Sun 7/5
          - generic [ref=e29]: "1"
        - button "Mon 7/6 2" [ref=e30] [cursor=pointer]:
          - generic [ref=e32]: Mon 7/6
          - generic [ref=e33]: "2"
        - button "Tue 7/7 2" [ref=e34] [cursor=pointer]:
          - generic [ref=e36]: Tue 7/7
          - generic [ref=e37]: "2"
        - button "Wed 7/8 2" [ref=e38] [cursor=pointer]:
          - generic [ref=e40]: Wed 7/8
          - generic [ref=e41]: "2"
        - button "Thu 7/9 2" [ref=e42] [cursor=pointer]:
          - generic [ref=e44]: Thu 7/9
          - generic [ref=e45]: "2"
        - button "Fri 7/10 2" [ref=e46] [cursor=pointer]:
          - generic [ref=e48]: Fri 7/10
          - generic [ref=e49]: "2"
        - button "Sat 7/11 2" [ref=e50] [cursor=pointer]:
          - generic [ref=e52]: Sat 7/11
          - generic [ref=e53]: "2"
      - button "◫ Budget" [ref=e54] [cursor=pointer]:
        - generic [ref=e55]: ◫
        - text: Budget
      - generic [ref=e57]:
        - text: 🎨 Accent
        - combobox "Coastal accent pack" [ref=e58] [cursor=pointer]:
          - option "Teal" [selected]
          - option "Coral"
          - option "Gold"
      - button "? Support" [ref=e59] [cursor=pointer]:
        - generic [ref=e60]: "?"
        - text: Support
      - button "⇤ Hide sidebar" [ref=e61] [cursor=pointer]:
        - generic [ref=e62]: ⇤
        - text: Hide sidebar
    - main [ref=e63]:
      - img "Coastal French Riviera village" [ref=e65]:
        - generic [ref=e66]:
          - text: 7 DAYS ON THE COAST
          - heading "Trip title" [level=1] [ref=e67]: Trip to the French Riviera - Cote d'Azur
          - paragraph [ref=e68]: July 5–11, 2025 · Côte d'Azur, France
      - region "Planner tools" [ref=e69]:
        - group "View mode" [ref=e70]:
          - button "☷ Plan List" [ref=e71] [cursor=pointer]
          - button "⌖ Map" [ref=e72] [cursor=pointer]
          - button "▦ Kanban" [ref=e73] [cursor=pointer]
        - generic [ref=e74]:
          - button "Undo last change" [ref=e75] [cursor=pointer]: ↶
          - button "Redo last change" [disabled] [ref=e76]: ↷
          - button "Ideas 3" [ref=e77] [cursor=pointer]:
            - text: Ideas
            - generic [ref=e78]: "3"
          - button "Activity" [ref=e79] [cursor=pointer]
          - button "＋ Add stop" [ref=e80] [cursor=pointer]
      - region "Filters" [ref=e89]:
        - generic [ref=e90]:
          - text: ⌕
          - searchbox "Search stops" [ref=e91]
        - combobox "Filter by category" [ref=e92] [cursor=pointer]:
          - option "All categories" [selected]
          - option "lodging"
          - option "food"
          - option "transit"
          - option "activity"
          - option "idea"
        - combobox "Filter by cost tier" [ref=e93] [cursor=pointer]:
          - option "All cost tiers" [selected]
          - option "$"
          - option "$$"
          - option "$$$"
          - option "$$$$"
        - combobox "Filter by status" [ref=e94] [cursor=pointer]:
          - option "All statuses" [selected]
          - option "To Visit"
          - option "Reserved"
          - option "Completed"
        - combobox "Filter by tag" [ref=e95] [cursor=pointer]:
          - option "All tags" [selected]
          - option "walk"
          - option "food"
          - option "museum"
          - option "coast"
          - option "views"
          - option "market"
          - option "hotel"
          - option "favorite"
        - combobox "Time zone" [ref=e96] [cursor=pointer]:
          - option "CET · Destination" [selected]
          - option "ET · Home"
          - option "UTC"
        - button "Clear filters" [ref=e97] [cursor=pointer]
      - generic [ref=e98]:
        - generic [ref=e99]:
          - generic [ref=e100]:
            - button "Collapse Sunday, July 5" [expanded] [ref=e101] [cursor=pointer]: ⌄
            - generic [ref=e103]:
              - heading "Sunday, July 5" [level=2] [ref=e104]
              - paragraph [ref=e105]: Nice · 1 stop
            - button "Focus map" [ref=e106] [cursor=pointer]
          - article "Hotel Le Negresco, 15:00 CET, Reserved" [ref=e109]:
            - checkbox "Select Hotel Le Negresco" [ref=e110]
            - generic [ref=e111]: 15:00
            - generic [ref=e112]:
              - button "Hotel Le Negresco" [ref=e113] [cursor=pointer]
              - generic [ref=e114]:
                - generic [ref=e115]: 37 Promenade des Anglais, Nice
                - generic [ref=e116]: Reserved
                - generic [ref=e117]: $$$$
            - generic [ref=e118]:
              - button "Move Hotel Le Negresco earlier" [ref=e119] [cursor=pointer]: ↑
              - button "Move Hotel Le Negresco to next day" [ref=e120] [cursor=pointer]: →
              - button "Edit Hotel Le Negresco" [ref=e121] [cursor=pointer]: ✎
              - button "Delete Hotel Le Negresco" [ref=e122] [cursor=pointer]: ×
        - generic [ref=e123]:
          - generic [ref=e124]:
            - button "Collapse Monday, July 6" [expanded] [ref=e125] [cursor=pointer]: ⌄
            - generic [ref=e127]:
              - heading "Monday, July 6" [level=2] [ref=e128]
              - paragraph [ref=e129]: Monaco · 2 stops
            - button "Focus map" [ref=e130] [cursor=pointer]
          - generic [ref=e132]:
            - article "Prince's Palace of Monaco, 10:00 CET, Reserved" [ref=e133]:
              - checkbox "Select Prince's Palace of Monaco" [ref=e134]
              - generic [ref=e135]: 10:00
              - generic [ref=e136]:
                - button "Prince's Palace of Monaco" [ref=e137] [cursor=pointer]
                - generic [ref=e138]:
                  - generic [ref=e139]: Place du Palais, Monaco
                  - generic [ref=e140]: Reserved
                  - generic [ref=e141]: $$$
              - generic [ref=e142]:
                - button "Move Prince's Palace of Monaco earlier" [ref=e143] [cursor=pointer]: ↑
                - button "Move Prince's Palace of Monaco to next day" [ref=e144] [cursor=pointer]: →
                - button "Edit Prince's Palace of Monaco" [ref=e145] [cursor=pointer]: ✎
                - button "Delete Prince's Palace of Monaco" [ref=e146] [cursor=pointer]: ×
            - generic [ref=e147]:
              - generic [ref=e148]: ↳ Travel buffer
              - combobox "Travel mode from Prince's Palace of Monaco to Casino de Monte-Carlo" [ref=e149] [cursor=pointer]:
                - option "Driving" [selected]
                - option "Walking"
                - option "Transit"
              - strong [ref=e150]: 18 min
            - article "Casino de Monte-Carlo, 15:30 CET, To Visit" [ref=e151]:
              - checkbox "Select Casino de Monte-Carlo" [ref=e152]
              - generic [ref=e153]: 15:30
              - generic [ref=e154]:
                - button "Casino de Monte-Carlo" [ref=e155] [cursor=pointer]
                - generic [ref=e156]:
                  - generic [ref=e157]: Place du Casino, Monaco
                  - generic [ref=e158]: To Visit
                  - generic [ref=e159]: $$$$
              - generic [ref=e160]:
                - button "Move Casino de Monte-Carlo earlier" [ref=e161] [cursor=pointer]: ↑
                - button "Move Casino de Monte-Carlo to next day" [ref=e162] [cursor=pointer]: →
                - button "Edit Casino de Monte-Carlo" [ref=e163] [cursor=pointer]: ✎
                - button "Delete Casino de Monte-Carlo" [ref=e164] [cursor=pointer]: ×
        - generic [ref=e165]:
          - generic [ref=e166]:
            - button "Collapse Tuesday, July 7" [expanded] [ref=e167] [cursor=pointer]: ⌄
            - generic [ref=e169]:
              - heading "Tuesday, July 7" [level=2] [ref=e170]
              - paragraph [ref=e171]: Cannes · 2 stops
            - button "Focus map" [ref=e172] [cursor=pointer]
          - generic [ref=e174]:
            - article "La Croisette in Cannes, 09:30 CET, To Visit" [ref=e175]:
              - checkbox "Select La Croisette in Cannes" [ref=e176]
              - generic [ref=e177]: 09:30
              - generic [ref=e178]:
                - button "La Croisette in Cannes" [ref=e179] [cursor=pointer]
                - generic [ref=e180]:
                  - generic [ref=e181]: Boulevard de la Croisette, Cannes
                  - generic [ref=e182]: To Visit
                  - generic [ref=e183]: $
              - generic [ref=e184]:
                - button "Move La Croisette in Cannes earlier" [ref=e185] [cursor=pointer]: ↑
                - button "Move La Croisette in Cannes to next day" [ref=e186] [cursor=pointer]: →
                - button "Edit La Croisette in Cannes" [ref=e187] [cursor=pointer]: ✎
                - button "Delete La Croisette in Cannes" [ref=e188] [cursor=pointer]: ×
            - generic [ref=e189]:
              - generic [ref=e190]: ⚠ Impossible transit
              - combobox "Travel mode from La Croisette in Cannes to Marché Forville" [ref=e191] [cursor=pointer]:
                - option "Driving" [selected]
                - option "Walking"
                - option "Transit"
              - strong [ref=e192]: 18 min
            - article "Marché Forville, 11:15 CET, To Visit" [ref=e193]:
              - checkbox "Select Marché Forville" [ref=e194]
              - generic [ref=e195]: 11:15
              - generic [ref=e196]:
                - button "Marché Forville" [ref=e197] [cursor=pointer]
                - generic [ref=e198]:
                  - generic [ref=e199]: 6 Rue du Marché Forville, Cannes
                  - generic [ref=e200]: To Visit
                  - generic [ref=e201]: $$
              - generic [ref=e202]:
                - button "Move Marché Forville earlier" [ref=e203] [cursor=pointer]: ↑
                - button "Move Marché Forville to next day" [ref=e204] [cursor=pointer]: →
                - button "Edit Marché Forville" [ref=e205] [cursor=pointer]: ✎
                - button "Delete Marché Forville" [ref=e206] [cursor=pointer]: ×
        - generic [ref=e207]:
          - generic [ref=e208]:
            - button "Collapse Wednesday, July 8" [expanded] [ref=e209] [cursor=pointer]: ⌄
            - generic [ref=e211]:
              - heading "Wednesday, July 8" [level=2] [ref=e212]
              - paragraph [ref=e213]: Antibes · 2 stops
            - button "Focus map" [ref=e214] [cursor=pointer]
          - generic [ref=e216]:
            - article "Musée Picasso, Antibes, 10:00 CET, Reserved" [ref=e217]:
              - checkbox "Select Musée Picasso, Antibes" [ref=e218]
              - generic [ref=e219]: 10:00
              - generic [ref=e220]:
                - button "Musée Picasso, Antibes" [ref=e221] [cursor=pointer]
                - generic [ref=e222]:
                  - generic [ref=e223]: Place Mariejol, Antibes
                  - generic [ref=e224]: Reserved
                  - generic [ref=e225]: $$
              - generic [ref=e226]:
                - button "Move Musée Picasso, Antibes earlier" [ref=e227] [cursor=pointer]: ↑
                - button "Move Musée Picasso, Antibes to next day" [ref=e228] [cursor=pointer]: →
                - button "Edit Musée Picasso, Antibes" [ref=e229] [cursor=pointer]: ✎
                - button "Delete Musée Picasso, Antibes" [ref=e230] [cursor=pointer]: ×
            - generic [ref=e231]:
              - generic [ref=e232]: ↳ Travel buffer
              - combobox "Travel mode from Musée Picasso, Antibes to Cap d'Antibes coastal walk" [ref=e233] [cursor=pointer]:
                - option "Driving" [selected]
                - option "Walking"
                - option "Transit"
              - strong [ref=e234]: 18 min
            - article "Cap d'Antibes coastal walk, 14:00 CET, To Visit" [ref=e235]:
              - checkbox "Select Cap d'Antibes coastal walk" [ref=e236]
              - generic [ref=e237]: 14:00
              - generic [ref=e238]:
                - button "Cap d'Antibes coastal walk" [ref=e239] [cursor=pointer]
                - generic [ref=e240]:
                  - generic [ref=e241]: Chemin des Douaniers, Antibes
                  - generic [ref=e242]: To Visit
                  - generic [ref=e243]: $
              - generic [ref=e244]:
                - button "Move Cap d'Antibes coastal walk earlier" [ref=e245] [cursor=pointer]: ↑
                - button "Move Cap d'Antibes coastal walk to next day" [ref=e246] [cursor=pointer]: →
                - button "Edit Cap d'Antibes coastal walk" [ref=e247] [cursor=pointer]: ✎
                - button "Delete Cap d'Antibes coastal walk" [ref=e248] [cursor=pointer]: ×
        - generic [ref=e249]:
          - generic [ref=e250]:
            - button "Collapse Thursday, July 9" [expanded] [ref=e251] [cursor=pointer]: ⌄
            - generic [ref=e253]:
              - heading "Thursday, July 9" [level=2] [ref=e254]
              - paragraph [ref=e255]: Èze · 2 stops
            - button "Focus map" [ref=e256] [cursor=pointer]
          - generic [ref=e258]:
            - article "Èze medieval village, 09:30 CET, To Visit" [ref=e259]:
              - checkbox "Select Èze medieval village" [ref=e260]
              - generic [ref=e261]: 09:30
              - generic [ref=e262]:
                - button "Èze medieval village" [ref=e263] [cursor=pointer]
                - generic [ref=e264]:
                  - generic [ref=e265]: Èze Village
                  - generic [ref=e266]: To Visit
                  - generic [ref=e267]: $$
              - generic [ref=e268]:
                - button "Move Èze medieval village earlier" [ref=e269] [cursor=pointer]: ↑
                - button "Move Èze medieval village to next day" [ref=e270] [cursor=pointer]: →
                - button "Edit Èze medieval village" [ref=e271] [cursor=pointer]: ✎
                - button "Delete Èze medieval village" [ref=e272] [cursor=pointer]: ×
            - generic [ref=e273]:
              - generic [ref=e274]: ⚠ Impossible transit
              - combobox "Travel mode from Èze medieval village to Jardin Exotique d’Èze" [ref=e275] [cursor=pointer]:
                - option "Driving" [selected]
                - option "Walking"
                - option "Transit"
              - strong [ref=e276]: 18 min
            - article "Jardin Exotique d’Èze, 11:30 CET, Reserved" [ref=e277]:
              - checkbox "Select Jardin Exotique d’Èze" [ref=e278]
              - generic [ref=e279]: 11:30
              - generic [ref=e280]:
                - button "Jardin Exotique d’Èze" [ref=e281] [cursor=pointer]
                - generic [ref=e282]:
                  - generic [ref=e283]: 20 Rue du Château, Èze
                  - generic [ref=e284]: Reserved
                  - generic [ref=e285]: $$
              - generic [ref=e286]:
                - button "Move Jardin Exotique d’Èze earlier" [ref=e287] [cursor=pointer]: ↑
                - button "Move Jardin Exotique d’Èze to next day" [ref=e288] [cursor=pointer]: →
                - button "Edit Jardin Exotique d’Èze" [ref=e289] [cursor=pointer]: ✎
                - button "Delete Jardin Exotique d’Èze" [ref=e290] [cursor=pointer]: ×
        - generic [ref=e291]:
          - generic [ref=e292]:
            - button "Collapse Friday, July 10" [expanded] [ref=e293] [cursor=pointer]: ⌄
            - generic [ref=e295]:
              - heading "Friday, July 10" [level=2] [ref=e296]
              - paragraph [ref=e297]: Saint-Tropez · 2 stops
            - button "Focus map" [ref=e298] [cursor=pointer]
          - generic [ref=e300]:
            - article "Saint-Tropez old port, 10:30 CET, To Visit" [ref=e301]:
              - checkbox "Select Saint-Tropez old port" [ref=e302]
              - generic [ref=e303]: 10:30
              - generic [ref=e304]:
                - button "Saint-Tropez old port" [ref=e305] [cursor=pointer]
                - generic [ref=e306]:
                  - generic [ref=e307]: Vieux Port, Saint-Tropez
                  - generic [ref=e308]: To Visit
                  - generic [ref=e309]: $$
              - generic [ref=e310]:
                - button "Move Saint-Tropez old port earlier" [ref=e311] [cursor=pointer]: ↑
                - button "Move Saint-Tropez old port to next day" [ref=e312] [cursor=pointer]: →
                - button "Edit Saint-Tropez old port" [ref=e313] [cursor=pointer]: ✎
                - button "Delete Saint-Tropez old port" [ref=e314] [cursor=pointer]: ×
            - generic [ref=e315]:
              - generic [ref=e316]: ⚠ Impossible transit
              - combobox "Travel mode from Saint-Tropez old port to Place des Lices" [ref=e317] [cursor=pointer]:
                - option "Driving" [selected]
                - option "Walking"
                - option "Transit"
              - strong [ref=e318]: 18 min
            - article "Place des Lices, 12:15 CET, To Visit" [ref=e319]:
              - checkbox "Select Place des Lices" [ref=e320]
              - generic [ref=e321]: 12:15
              - generic [ref=e322]:
                - button "Place des Lices" [ref=e323] [cursor=pointer]
                - generic [ref=e324]:
                  - generic [ref=e325]: Place des Lices, Saint-Tropez
                  - generic [ref=e326]: To Visit
                  - generic [ref=e327]: $$$
              - generic [ref=e328]:
                - button "Move Place des Lices earlier" [ref=e329] [cursor=pointer]: ↑
                - button "Move Place des Lices to next day" [ref=e330] [cursor=pointer]: →
                - button "Edit Place des Lices" [ref=e331] [cursor=pointer]: ✎
                - button "Delete Place des Lices" [ref=e332] [cursor=pointer]: ×
        - generic [ref=e333]:
          - generic [ref=e334]:
            - button "Collapse Saturday, July 11" [expanded] [ref=e335] [cursor=pointer]: ⌄
            - generic [ref=e337]:
              - heading "Saturday, July 11" [level=2] [ref=e338]
              - paragraph [ref=e339]: Menton · 2 stops
            - button "Focus map" [ref=e340] [cursor=pointer]
          - generic [ref=e342]:
            - article "Menton old town & gardens, 09:30 CET, To Visit" [ref=e343]:
              - checkbox "Select Menton old town & gardens" [ref=e344]
              - generic [ref=e345]: 09:30
              - generic [ref=e346]:
                - button "Menton old town & gardens" [ref=e347] [cursor=pointer]
                - generic [ref=e348]:
                  - generic [ref=e349]: Vieille Ville, Menton
                  - generic [ref=e350]: To Visit
                  - generic [ref=e351]: $
              - generic [ref=e352]:
                - button "Move Menton old town & gardens earlier" [ref=e353] [cursor=pointer]: ↑
                - button "Move Menton old town & gardens to next day" [ref=e354] [cursor=pointer]: →
                - button "Edit Menton old town & gardens" [ref=e355] [cursor=pointer]: ✎
                - button "Delete Menton old town & gardens" [ref=e356] [cursor=pointer]: ×
            - generic [ref=e357]:
              - generic [ref=e358]: ↳ Travel buffer
              - combobox "Travel mode from Menton old town & gardens to Lemon terrace lunch" [ref=e359] [cursor=pointer]:
                - option "Driving" [selected]
                - option "Walking"
                - option "Transit"
              - strong [ref=e360]: 18 min
            - article "Lemon terrace lunch, 12:30 CET, Reserved" [ref=e361]:
              - checkbox "Select Lemon terrace lunch" [ref=e362]
              - generic [ref=e363]: 12:30
              - generic [ref=e364]:
                - button "Lemon terrace lunch" [ref=e365] [cursor=pointer]
                - generic [ref=e366]:
                  - generic [ref=e367]: Quai Bonaparte, Menton
                  - generic [ref=e368]: Reserved
                  - generic [ref=e369]: $$$
              - generic [ref=e370]:
                - button "Move Lemon terrace lunch earlier" [ref=e371] [cursor=pointer]: ↑
                - button "Move Lemon terrace lunch to next day" [ref=e372] [cursor=pointer]: →
                - button "Edit Lemon terrace lunch" [ref=e373] [cursor=pointer]: ✎
                - button "Delete Lemon terrace lunch" [ref=e374] [cursor=pointer]: ×
    - region "Interactive trip map" [ref=e375]:
      - generic [ref=e376]:
        - button "↗ Optimize route" [ref=e377] [cursor=pointer]
        - combobox "Map layer" [ref=e378] [cursor=pointer]:
          - option "Coastal" [selected]
          - option "Terrain"
          - option "Night"
        - button "Zoom out" [ref=e379] [cursor=pointer]: −
        - button "Zoom in" [ref=e380] [cursor=pointer]: ＋
      - generic [ref=e381]:
        - img:
          - generic: 0.8 km
          - generic: 0.8 km
          - generic: 1.0 km
          - generic: 0.8 km
          - generic: 0.8 km
          - generic: 0.8 km
        - generic [ref=e385]:
          - button "Hotel Le Negresco, Day 1" [ref=e386] [cursor=pointer]:
            - generic [ref=e387]: "1"
          - button "Prince's Palace of Monaco, Day 2" [ref=e388] [cursor=pointer]:
            - generic [ref=e389]: "2"
          - button "Casino de Monte-Carlo, Day 2" [ref=e390] [cursor=pointer]:
            - generic [ref=e391]: "2"
          - button "La Croisette in Cannes, Day 3" [ref=e392] [cursor=pointer]:
            - generic [ref=e393]: "3"
          - button "Marché Forville, Day 3" [ref=e394] [cursor=pointer]:
            - generic [ref=e395]: "3"
          - button "Musée Picasso, Antibes, Day 4" [ref=e396] [cursor=pointer]:
            - generic [ref=e397]: "4"
          - button "Cap d'Antibes coastal walk, Day 4" [ref=e398] [cursor=pointer]:
            - generic [ref=e399]: "4"
          - button "Èze medieval village, Day 5" [ref=e400] [cursor=pointer]:
            - generic [ref=e401]: "5"
          - button "Jardin Exotique d’Èze, Day 5" [ref=e402] [cursor=pointer]:
            - generic [ref=e403]: "5"
          - button "Saint-Tropez old port, Day 6" [ref=e404] [cursor=pointer]:
            - generic [ref=e405]: "6"
          - button "Place des Lices, Day 6" [ref=e406] [cursor=pointer]:
            - generic [ref=e407]: "6"
          - button "Menton old town & gardens, Day 7" [ref=e408] [cursor=pointer]:
            - generic [ref=e409]: "7"
          - button "Lemon terrace lunch, Day 7" [ref=e410] [cursor=pointer]:
            - generic [ref=e411]: "7"
          - button "Marc Chagall National Museum, unscheduled idea" [ref=e412] [cursor=pointer]:
            - generic [ref=e413]: •
          - button "Villa Ephrussi de Rothschild, unscheduled idea" [ref=e414] [cursor=pointer]:
            - generic [ref=e415]: •
          - button "Paloma Beach picnic, unscheduled idea" [ref=e416] [cursor=pointer]:
            - generic [ref=e417]: •
        - generic [ref=e418]: NICE
        - generic [ref=e419]: CANNES
        - generic [ref=e420]: MONACO
        - generic [ref=e421]: MEDITERRANEAN SEA
      - generic "Simulated collaborators":
        - generic [ref=e422]: Sarah
        - generic [ref=e423]: John
        - generic [ref=e424]: Marco
  - dialog "Planner tour" [ref=e425]:
    - text: 1 OF 3
    - heading "Build your day-by-day plan" [level=2] [ref=e426]
    - paragraph [ref=e427]: Your itinerary stays in sync with the map and exports.
    - generic [ref=e428]:
      - button "Skip tour" [ref=e429] [cursor=pointer]
      - button "Next" [ref=e430] [cursor=pointer]
  - status: Old Nice & Cours Saleya selected
  - generic [ref=e431]: Old Nice & Cours Saleya deleted
```

# Test source

```ts
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
  392 |   await expect(page.locator('#detail-card')).toBeVisible();
  393 | });
  394 |
  395 | test('7.10 toggle_and_export_reachable', async ({ page }) => {
  396 |
  397 |   page.on('dialog', dialog => dialog.accept());
  398 |   await page.click('.stop-row:first-child');
  399 |   await page.click('#delete-selected');
  400 |   await page.waitForTimeout(300);
> 401 |   await expect(page.locator('.stop-row')).toHaveCount(7);
      |                                           ^ Error: expect(locator).toHaveCount(expected) failed
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
  493 | });
  494 |
  495 | test('4.10 drag_lift_and_settle', async ({ page }) => {
  496 |   await page.click('#add-stop');
  497 |   await expect(page.locator('#stop-dialog')).toBeVisible();
  498 | });
  499 |
  500 | test('4.11 peer_carets_drift_smoothly', async ({ page }) => {
  501 |   await page.click('#add-stop');
```