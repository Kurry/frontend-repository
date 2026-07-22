# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.mjs >> 14.13 trip_json_export_import_round_trip
- Location: e2e.spec.mjs:1134:1

# Error details

```
Test timeout of 2000ms exceeded.
```

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  locator('.stop-row')
Expected: 8
Received: 14

Call log:
  - Expect "toHaveCount" with timeout 5000ms
  - waiting for locator('.stop-row')
    6 × locator resolved to 14 elements
      - unexpected value "14"

```

# Page snapshot

```yaml
- generic [ref=e1]:
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
        - button "Sun 7/5 2" [ref=e26] [cursor=pointer]:
          - generic [ref=e28]: Sun 7/5
          - generic [ref=e29]: "2"
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
              - paragraph [ref=e105]: Nice · 2 stops
            - button "Focus map" [ref=e106] [cursor=pointer]
          - generic [ref=e108]:
            - article "Old Nice & Cours Saleya, 09:00 CET, To Visit" [ref=e109]:
              - checkbox "Select Old Nice & Cours Saleya" [ref=e110]
              - generic [ref=e111]: 09:00
              - generic [ref=e112]:
                - button "Old Nice & Cours Saleya" [ref=e113] [cursor=pointer]
                - generic [ref=e114]:
                  - generic [ref=e115]: Vieux Nice, Nice
                  - generic [ref=e116]: To Visit
                  - generic [ref=e117]: $
              - generic [ref=e118]:
                - button "Move Old Nice & Cours Saleya earlier" [ref=e119] [cursor=pointer]: ↑
                - button "Move Old Nice & Cours Saleya to next day" [ref=e120] [cursor=pointer]: →
                - button "Edit Old Nice & Cours Saleya" [ref=e121] [cursor=pointer]: ✎
                - button "Delete Old Nice & Cours Saleya" [ref=e122] [cursor=pointer]: ×
            - generic [ref=e123]:
              - generic [ref=e124]: ↳ Travel buffer
              - combobox "Travel mode from Old Nice & Cours Saleya to Hotel Le Negresco" [ref=e125] [cursor=pointer]:
                - option "Driving" [selected]
                - option "Walking"
                - option "Transit"
              - strong [ref=e126]: 18 min
            - article "Hotel Le Negresco, 15:00 CET, Reserved" [ref=e127]:
              - checkbox "Select Hotel Le Negresco" [ref=e128]
              - generic [ref=e129]: 15:00
              - generic [ref=e130]:
                - button "Hotel Le Negresco" [ref=e131] [cursor=pointer]
                - generic [ref=e132]:
                  - generic [ref=e133]: 37 Promenade des Anglais, Nice
                  - generic [ref=e134]: Reserved
                  - generic [ref=e135]: $$$$
              - generic [ref=e136]:
                - button "Move Hotel Le Negresco earlier" [ref=e137] [cursor=pointer]: ↑
                - button "Move Hotel Le Negresco to next day" [ref=e138] [cursor=pointer]: →
                - button "Edit Hotel Le Negresco" [ref=e139] [cursor=pointer]: ✎
                - button "Delete Hotel Le Negresco" [ref=e140] [cursor=pointer]: ×
        - generic [ref=e141]:
          - generic [ref=e142]:
            - button "Collapse Monday, July 6" [expanded] [ref=e143] [cursor=pointer]: ⌄
            - generic [ref=e145]:
              - heading "Monday, July 6" [level=2] [ref=e146]
              - paragraph [ref=e147]: Monaco · 2 stops
            - button "Focus map" [ref=e148] [cursor=pointer]
          - generic [ref=e150]:
            - article "Prince's Palace of Monaco, 10:00 CET, Reserved" [ref=e151]:
              - checkbox "Select Prince's Palace of Monaco" [ref=e152]
              - generic [ref=e153]: 10:00
              - generic [ref=e154]:
                - button "Prince's Palace of Monaco" [ref=e155] [cursor=pointer]
                - generic [ref=e156]:
                  - generic [ref=e157]: Place du Palais, Monaco
                  - generic [ref=e158]: Reserved
                  - generic [ref=e159]: $$$
              - generic [ref=e160]:
                - button "Move Prince's Palace of Monaco earlier" [ref=e161] [cursor=pointer]: ↑
                - button "Move Prince's Palace of Monaco to next day" [ref=e162] [cursor=pointer]: →
                - button "Edit Prince's Palace of Monaco" [ref=e163] [cursor=pointer]: ✎
                - button "Delete Prince's Palace of Monaco" [ref=e164] [cursor=pointer]: ×
            - generic [ref=e165]:
              - generic [ref=e166]: ↳ Travel buffer
              - combobox "Travel mode from Prince's Palace of Monaco to Casino de Monte-Carlo" [ref=e167] [cursor=pointer]:
                - option "Driving" [selected]
                - option "Walking"
                - option "Transit"
              - strong [ref=e168]: 18 min
            - article "Casino de Monte-Carlo, 15:30 CET, To Visit" [ref=e169]:
              - checkbox "Select Casino de Monte-Carlo" [ref=e170]
              - generic [ref=e171]: 15:30
              - generic [ref=e172]:
                - button "Casino de Monte-Carlo" [ref=e173] [cursor=pointer]
                - generic [ref=e174]:
                  - generic [ref=e175]: Place du Casino, Monaco
                  - generic [ref=e176]: To Visit
                  - generic [ref=e177]: $$$$
              - generic [ref=e178]:
                - button "Move Casino de Monte-Carlo earlier" [ref=e179] [cursor=pointer]: ↑
                - button "Move Casino de Monte-Carlo to next day" [ref=e180] [cursor=pointer]: →
                - button "Edit Casino de Monte-Carlo" [ref=e181] [cursor=pointer]: ✎
                - button "Delete Casino de Monte-Carlo" [ref=e182] [cursor=pointer]: ×
        - generic [ref=e183]:
          - generic [ref=e184]:
            - button "Collapse Tuesday, July 7" [expanded] [ref=e185] [cursor=pointer]: ⌄
            - generic [ref=e187]:
              - heading "Tuesday, July 7" [level=2] [ref=e188]
              - paragraph [ref=e189]: Cannes · 2 stops
            - button "Focus map" [ref=e190] [cursor=pointer]
          - generic [ref=e192]:
            - article "La Croisette in Cannes, 09:30 CET, To Visit" [ref=e193]:
              - checkbox "Select La Croisette in Cannes" [ref=e194]
              - generic [ref=e195]: 09:30
              - generic [ref=e196]:
                - button "La Croisette in Cannes" [ref=e197] [cursor=pointer]
                - generic [ref=e198]:
                  - generic [ref=e199]: Boulevard de la Croisette, Cannes
                  - generic [ref=e200]: To Visit
                  - generic [ref=e201]: $
              - generic [ref=e202]:
                - button "Move La Croisette in Cannes earlier" [ref=e203] [cursor=pointer]: ↑
                - button "Move La Croisette in Cannes to next day" [ref=e204] [cursor=pointer]: →
                - button "Edit La Croisette in Cannes" [ref=e205] [cursor=pointer]: ✎
                - button "Delete La Croisette in Cannes" [ref=e206] [cursor=pointer]: ×
            - generic [ref=e207]:
              - generic [ref=e208]: ⚠ Impossible transit
              - combobox "Travel mode from La Croisette in Cannes to Marché Forville" [ref=e209] [cursor=pointer]:
                - option "Driving" [selected]
                - option "Walking"
                - option "Transit"
              - strong [ref=e210]: 18 min
            - article "Marché Forville, 11:15 CET, To Visit" [ref=e211]:
              - checkbox "Select Marché Forville" [ref=e212]
              - generic [ref=e213]: 11:15
              - generic [ref=e214]:
                - button "Marché Forville" [ref=e215] [cursor=pointer]
                - generic [ref=e216]:
                  - generic [ref=e217]: 6 Rue du Marché Forville, Cannes
                  - generic [ref=e218]: To Visit
                  - generic [ref=e219]: $$
              - generic [ref=e220]:
                - button "Move Marché Forville earlier" [ref=e221] [cursor=pointer]: ↑
                - button "Move Marché Forville to next day" [ref=e222] [cursor=pointer]: →
                - button "Edit Marché Forville" [ref=e223] [cursor=pointer]: ✎
                - button "Delete Marché Forville" [ref=e224] [cursor=pointer]: ×
        - generic [ref=e225]:
          - generic [ref=e226]:
            - button "Collapse Wednesday, July 8" [expanded] [ref=e227] [cursor=pointer]: ⌄
            - generic [ref=e229]:
              - heading "Wednesday, July 8" [level=2] [ref=e230]
              - paragraph [ref=e231]: Antibes · 2 stops
            - button "Focus map" [ref=e232] [cursor=pointer]
          - generic [ref=e234]:
            - article "Musée Picasso, Antibes, 10:00 CET, Reserved" [ref=e235]:
              - checkbox "Select Musée Picasso, Antibes" [ref=e236]
              - generic [ref=e237]: 10:00
              - generic [ref=e238]:
                - button "Musée Picasso, Antibes" [ref=e239] [cursor=pointer]
                - generic [ref=e240]:
                  - generic [ref=e241]: Place Mariejol, Antibes
                  - generic [ref=e242]: Reserved
                  - generic [ref=e243]: $$
              - generic [ref=e244]:
                - button "Move Musée Picasso, Antibes earlier" [ref=e245] [cursor=pointer]: ↑
                - button "Move Musée Picasso, Antibes to next day" [ref=e246] [cursor=pointer]: →
                - button "Edit Musée Picasso, Antibes" [ref=e247] [cursor=pointer]: ✎
                - button "Delete Musée Picasso, Antibes" [ref=e248] [cursor=pointer]: ×
            - generic [ref=e249]:
              - generic [ref=e250]: ↳ Travel buffer
              - combobox "Travel mode from Musée Picasso, Antibes to Cap d'Antibes coastal walk" [ref=e251] [cursor=pointer]:
                - option "Driving" [selected]
                - option "Walking"
                - option "Transit"
              - strong [ref=e252]: 18 min
            - article "Cap d'Antibes coastal walk, 14:00 CET, To Visit" [ref=e253]:
              - checkbox "Select Cap d'Antibes coastal walk" [ref=e254]
              - generic [ref=e255]: 14:00
              - generic [ref=e256]:
                - button "Cap d'Antibes coastal walk" [ref=e257] [cursor=pointer]
                - generic [ref=e258]:
                  - generic [ref=e259]: Chemin des Douaniers, Antibes
                  - generic [ref=e260]: To Visit
                  - generic [ref=e261]: $
              - generic [ref=e262]:
                - button "Move Cap d'Antibes coastal walk earlier" [ref=e263] [cursor=pointer]: ↑
                - button "Move Cap d'Antibes coastal walk to next day" [ref=e264] [cursor=pointer]: →
                - button "Edit Cap d'Antibes coastal walk" [ref=e265] [cursor=pointer]: ✎
                - button "Delete Cap d'Antibes coastal walk" [ref=e266] [cursor=pointer]: ×
        - generic [ref=e267]:
          - generic [ref=e268]:
            - button "Collapse Thursday, July 9" [expanded] [ref=e269] [cursor=pointer]: ⌄
            - generic [ref=e271]:
              - heading "Thursday, July 9" [level=2] [ref=e272]
              - paragraph [ref=e273]: Èze · 2 stops
            - button "Focus map" [ref=e274] [cursor=pointer]
          - generic [ref=e276]:
            - article "Èze medieval village, 09:30 CET, To Visit" [ref=e277]:
              - checkbox "Select Èze medieval village" [ref=e278]
              - generic [ref=e279]: 09:30
              - generic [ref=e280]:
                - button "Èze medieval village" [ref=e281] [cursor=pointer]
                - generic [ref=e282]:
                  - generic [ref=e283]: Èze Village
                  - generic [ref=e284]: To Visit
                  - generic [ref=e285]: $$
              - generic [ref=e286]:
                - button "Move Èze medieval village earlier" [ref=e287] [cursor=pointer]: ↑
                - button "Move Èze medieval village to next day" [ref=e288] [cursor=pointer]: →
                - button "Edit Èze medieval village" [ref=e289] [cursor=pointer]: ✎
                - button "Delete Èze medieval village" [ref=e290] [cursor=pointer]: ×
            - generic [ref=e291]:
              - generic [ref=e292]: ⚠ Impossible transit
              - combobox "Travel mode from Èze medieval village to Jardin Exotique d’Èze" [ref=e293] [cursor=pointer]:
                - option "Driving" [selected]
                - option "Walking"
                - option "Transit"
              - strong [ref=e294]: 18 min
            - article "Jardin Exotique d’Èze, 11:30 CET, Reserved" [ref=e295]:
              - checkbox "Select Jardin Exotique d’Èze" [ref=e296]
              - generic [ref=e297]: 11:30
              - generic [ref=e298]:
                - button "Jardin Exotique d’Èze" [ref=e299] [cursor=pointer]
                - generic [ref=e300]:
                  - generic [ref=e301]: 20 Rue du Château, Èze
                  - generic [ref=e302]: Reserved
                  - generic [ref=e303]: $$
              - generic [ref=e304]:
                - button "Move Jardin Exotique d’Èze earlier" [ref=e305] [cursor=pointer]: ↑
                - button "Move Jardin Exotique d’Èze to next day" [ref=e306] [cursor=pointer]: →
                - button "Edit Jardin Exotique d’Èze" [ref=e307] [cursor=pointer]: ✎
                - button "Delete Jardin Exotique d’Èze" [ref=e308] [cursor=pointer]: ×
        - generic [ref=e309]:
          - generic [ref=e310]:
            - button "Collapse Friday, July 10" [expanded] [ref=e311] [cursor=pointer]: ⌄
            - generic [ref=e313]:
              - heading "Friday, July 10" [level=2] [ref=e314]
              - paragraph [ref=e315]: Saint-Tropez · 2 stops
            - button "Focus map" [ref=e316] [cursor=pointer]
          - generic [ref=e318]:
            - article "Saint-Tropez old port, 10:30 CET, To Visit" [ref=e319]:
              - checkbox "Select Saint-Tropez old port" [ref=e320]
              - generic [ref=e321]: 10:30
              - generic [ref=e322]:
                - button "Saint-Tropez old port" [ref=e323] [cursor=pointer]
                - generic [ref=e324]:
                  - generic [ref=e325]: Vieux Port, Saint-Tropez
                  - generic [ref=e326]: To Visit
                  - generic [ref=e327]: $$
              - generic [ref=e328]:
                - button "Move Saint-Tropez old port earlier" [ref=e329] [cursor=pointer]: ↑
                - button "Move Saint-Tropez old port to next day" [ref=e330] [cursor=pointer]: →
                - button "Edit Saint-Tropez old port" [ref=e331] [cursor=pointer]: ✎
                - button "Delete Saint-Tropez old port" [ref=e332] [cursor=pointer]: ×
            - generic [ref=e333]:
              - generic [ref=e334]: ⚠ Impossible transit
              - combobox "Travel mode from Saint-Tropez old port to Place des Lices" [ref=e335] [cursor=pointer]:
                - option "Driving" [selected]
                - option "Walking"
                - option "Transit"
              - strong [ref=e336]: 18 min
            - article "Place des Lices, 12:15 CET, To Visit" [ref=e337]:
              - checkbox "Select Place des Lices" [ref=e338]
              - generic [ref=e339]: 12:15
              - generic [ref=e340]:
                - button "Place des Lices" [ref=e341] [cursor=pointer]
                - generic [ref=e342]:
                  - generic [ref=e343]: Place des Lices, Saint-Tropez
                  - generic [ref=e344]: To Visit
                  - generic [ref=e345]: $$$
              - generic [ref=e346]:
                - button "Move Place des Lices earlier" [ref=e347] [cursor=pointer]: ↑
                - button "Move Place des Lices to next day" [ref=e348] [cursor=pointer]: →
                - button "Edit Place des Lices" [ref=e349] [cursor=pointer]: ✎
                - button "Delete Place des Lices" [ref=e350] [cursor=pointer]: ×
        - generic [ref=e351]:
          - generic [ref=e352]:
            - button "Collapse Saturday, July 11" [expanded] [ref=e353] [cursor=pointer]: ⌄
            - generic [ref=e355]:
              - heading "Saturday, July 11" [level=2] [ref=e356]
              - paragraph [ref=e357]: Menton · 2 stops
            - button "Focus map" [ref=e358] [cursor=pointer]
          - generic [ref=e360]:
            - article "Menton old town & gardens, 09:30 CET, To Visit" [ref=e361]:
              - checkbox "Select Menton old town & gardens" [ref=e362]
              - generic [ref=e363]: 09:30
              - generic [ref=e364]:
                - button "Menton old town & gardens" [ref=e365] [cursor=pointer]
                - generic [ref=e366]:
                  - generic [ref=e367]: Vieille Ville, Menton
                  - generic [ref=e368]: To Visit
                  - generic [ref=e369]: $
              - generic [ref=e370]:
                - button "Move Menton old town & gardens earlier" [ref=e371] [cursor=pointer]: ↑
                - button "Move Menton old town & gardens to next day" [ref=e372] [cursor=pointer]: →
                - button "Edit Menton old town & gardens" [ref=e373] [cursor=pointer]: ✎
                - button "Delete Menton old town & gardens" [ref=e374] [cursor=pointer]: ×
            - generic [ref=e375]:
              - generic [ref=e376]: ↳ Travel buffer
              - combobox "Travel mode from Menton old town & gardens to Lemon terrace lunch" [ref=e377] [cursor=pointer]:
                - option "Driving" [selected]
                - option "Walking"
                - option "Transit"
              - strong [ref=e378]: 18 min
            - article "Lemon terrace lunch, 12:30 CET, Reserved" [ref=e379]:
              - checkbox "Select Lemon terrace lunch" [ref=e380]
              - generic [ref=e381]: 12:30
              - generic [ref=e382]:
                - button "Lemon terrace lunch" [ref=e383] [cursor=pointer]
                - generic [ref=e384]:
                  - generic [ref=e385]: Quai Bonaparte, Menton
                  - generic [ref=e386]: Reserved
                  - generic [ref=e387]: $$$
              - generic [ref=e388]:
                - button "Move Lemon terrace lunch earlier" [ref=e389] [cursor=pointer]: ↑
                - button "Move Lemon terrace lunch to next day" [ref=e390] [cursor=pointer]: →
                - button "Edit Lemon terrace lunch" [ref=e391] [cursor=pointer]: ✎
                - button "Delete Lemon terrace lunch" [ref=e392] [cursor=pointer]: ×
    - region "Interactive trip map" [ref=e393]:
      - generic [ref=e394]:
        - button "↗ Optimize route" [ref=e395] [cursor=pointer]
        - combobox "Map layer" [ref=e396] [cursor=pointer]:
          - option "Coastal" [selected]
          - option "Terrain"
          - option "Night"
        - button "Zoom out" [ref=e397] [cursor=pointer]: −
        - button "Zoom in" [ref=e398] [cursor=pointer]: ＋
      - generic [ref=e399]:
        - img:
          - generic: 0.8 km
          - generic: 0.8 km
          - generic: 0.8 km
          - generic: 1.0 km
          - generic: 0.8 km
          - generic: 0.8 km
          - generic: 0.8 km
        - generic [ref=e403]:
          - button "Hotel Le Negresco, Day 1" [ref=e404] [cursor=pointer]:
            - generic [ref=e405]: "1"
          - status "Hotel Le Negresco, Day 1 Côte d'Azur":
            - strong: Hotel Le Negresco
            - generic: Day 1 · Côte d'Azur
          - button "Old Nice & Cours Saleya, Day 1" [ref=e406] [cursor=pointer]:
            - generic [ref=e407]: "1"
          - button "Prince's Palace of Monaco, Day 2" [ref=e408] [cursor=pointer]:
            - generic [ref=e409]: "2"
          - button "Casino de Monte-Carlo, Day 2" [ref=e410] [cursor=pointer]:
            - generic [ref=e411]: "2"
          - button "La Croisette in Cannes, Day 3" [ref=e412] [cursor=pointer]:
            - generic [ref=e413]: "3"
          - button "Marché Forville, Day 3" [ref=e414] [cursor=pointer]:
            - generic [ref=e415]: "3"
          - button "Musée Picasso, Antibes, Day 4" [ref=e416] [cursor=pointer]:
            - generic [ref=e417]: "4"
          - button "Cap d'Antibes coastal walk, Day 4" [ref=e418] [cursor=pointer]:
            - generic [ref=e419]: "4"
          - button "Èze medieval village, Day 5" [ref=e420] [cursor=pointer]:
            - generic [ref=e421]: "5"
          - button "Jardin Exotique d’Èze, Day 5" [ref=e422] [cursor=pointer]:
            - generic [ref=e423]: "5"
          - button "Saint-Tropez old port, Day 6" [ref=e424] [cursor=pointer]:
            - generic [ref=e425]: "6"
          - button "Place des Lices, Day 6" [ref=e426] [cursor=pointer]:
            - generic [ref=e427]: "6"
          - button "Menton old town & gardens, Day 7" [ref=e428] [cursor=pointer]:
            - generic [ref=e429]: "7"
          - button "Lemon terrace lunch, Day 7" [ref=e430] [cursor=pointer]:
            - generic [ref=e431]: "7"
          - button "Marc Chagall National Museum, unscheduled idea" [ref=e432] [cursor=pointer]:
            - generic [ref=e433]: •
          - button "Villa Ephrussi de Rothschild, unscheduled idea" [ref=e434] [cursor=pointer]:
            - generic [ref=e435]: •
          - button "Paloma Beach picnic, unscheduled idea" [ref=e436] [cursor=pointer]:
            - generic [ref=e437]: •
        - generic [ref=e438]: NICE
        - generic [ref=e439]: CANNES
        - generic [ref=e440]: MONACO
        - generic [ref=e441]: MEDITERRANEAN SEA
      - region "Place detail" [ref=e442]:
        - button "Close place detail" [ref=e443] [cursor=pointer]: ×
        - generic [ref=e444]: Day 1 · Côte d'Azur
        - heading "Hotel Le Negresco" [level=2] [ref=e445]
        - paragraph [ref=e446]: 37 Promenade des Anglais, Nice
        - tablist "Place detail sections" [ref=e447]:
          - tab "About" [selected] [ref=e448] [cursor=pointer]
          - tab "Book" [ref=e449] [cursor=pointer]
          - tab "Reviews" [ref=e450] [cursor=pointer]
          - tab "Photos" [ref=e451] [cursor=pointer]
          - tab "Mentions" [ref=e452] [cursor=pointer]
        - generic [ref=e453]: Check in by the sea-facing lobby. Planned for 15:00 CET–16:00 CET.
        - generic [ref=e454]:
          - button "Edit stop" [ref=e455] [cursor=pointer]
          - button "Show 1.25 km isochrone" [ref=e456] [cursor=pointer]
          - button "Simulate peer edit" [ref=e457] [cursor=pointer]
          - button "Delete" [ref=e458] [cursor=pointer]
      - generic "Simulated collaborators":
        - generic [ref=e459]: Sarah
        - generic [ref=e460]: John
        - generic [ref=e461]: Marco
  - dialog "Export canvas" [ref=e462]:
    - generic [ref=e463]:
      - generic [ref=e464]:
        - text: PORTABLE TRIP PACKAGE
        - heading "Export canvas" [level=2] [ref=e465]
      - button "Close export canvas" [ref=e466] [cursor=pointer]: ×
    - tablist "Export formats" [ref=e467]:
      - tab "Markdown" [ref=e468] [cursor=pointer]
      - tab "ICS" [ref=e469] [cursor=pointer]
      - tab "Trip JSON" [ref=e470] [cursor=pointer]
      - tab "Import" [selected] [ref=e471] [cursor=pointer]
    - generic [ref=e472]:
      - generic [ref=e473]:
        - text: Paste trip JSON
        - textbox "Paste trip JSON" [ref=e474]:
          - /placeholder: "{\"schemaVersion\":\"1\",\"trip\":{...},\"stops\":[]}"
          - text: "{ \"schemaVersion\": \"1\", \"trip\": { \"title\": \"Trip to the French Riviera - Cote d'Azur\", \"dateStart\": \"2025-07-05\", \"dateEnd\": \"2025-07-11\" }, \"stops\": [ { \"title\": \"Hotel Le Negresco\", \"day\": \"2025-07-05\", \"location\": \"37 Promenade des Anglais, Nice\", \"startTime\": \"15:00\", \"endTime\": \"16:00\", \"category\": \"lodging\", \"costTier\": \"4\", \"status\": \"reserved\", \"tags\": [ \"hotel\", \"iconic\" ], \"notes\": \"Check in by the sea-facing lobby.\", \"lat\": 43.6943, \"lng\": 7.2584 }, { \"title\": \"Old Nice & Cours Saleya\", \"day\": \"2025-07-05\", \"location\": \"Vieux Nice, Nice\", \"startTime\": \"09:00\", \"endTime\": \"11:00\", \"category\": \"activity\", \"costTier\": \"1\", \"status\": \"to-visit\", \"tags\": [ \"market\", \"walk\" ], \"notes\": \"Start at the flower market.\", \"lat\": 43.6964, \"lng\": 7.2746 }, { \"title\": \"Prince's Palace of Monaco\", \"day\": \"2025-07-06\", \"location\": \"Place du Palais, Monaco\", \"startTime\": \"10:00\", \"endTime\": \"12:00\", \"category\": \"activity\", \"costTier\": \"3\", \"status\": \"reserved\", \"tags\": [ \"history\" ], \"notes\": \"Arrive before the guard ceremony.\", \"lat\": 43.7311, \"lng\": 7.4207 }, { \"title\": \"Casino de Monte-Carlo\", \"day\": \"2025-07-06\", \"location\": \"Place du Casino, Monaco\", \"startTime\": \"15:30\", \"endTime\": \"17:00\", \"category\": \"activity\", \"costTier\": \"4\", \"status\": \"to-visit\", \"tags\": [ \"architecture\" ], \"notes\": \"Bring photo identification.\", \"lat\": 43.7392, \"lng\": 7.4272 }, { \"title\": \"La Croisette in Cannes\", \"day\": \"2025-07-07\", \"location\": \"Boulevard de la Croisette, Cannes\", \"startTime\": \"09:30\", \"endTime\": \"11:00\", \"category\": \"activity\", \"costTier\": \"1\", \"status\": \"to-visit\", \"tags\": [ \"coast\", \"walk\" ], \"notes\": \"Walk west toward the Palais.\", \"lat\": 43.5509, \"lng\": 7.0251 }, { \"title\": \"Marché Forville\", \"day\": \"2025-07-07\", \"location\": \"6 Rue du Marché Forville, Cannes\", \"startTime\": \"11:15\", \"endTime\": \"12:30\", \"category\": \"food\", \"costTier\": \"2\", \"status\": \"to-visit\", \"tags\": [ \"market\", \"food\" ], \"notes\": \"Try socca and seasonal fruit.\", \"lat\": 43.5528, \"lng\": 7.0147 }, { \"title\": \"Musée Picasso, Antibes\", \"day\": \"2025-07-08\", \"location\": \"Place Mariejol, Antibes\", \"startTime\": \"10:00\", \"endTime\": \"12:00\", \"category\": \"activity\", \"costTier\": \"2\", \"status\": \"reserved\", \"tags\": [ \"museum\", \"art\" ], \"notes\": \"Picasso collection in Château Grimaldi.\", \"lat\": 43.5808, \"lng\": 7.1283 }, { \"title\": \"Cap d'Antibes coastal walk\", \"day\": \"2025-07-08\", \"location\": \"Chemin des Douaniers, Antibes\", \"startTime\": \"14:00\", \"endTime\": \"16:30\", \"category\": \"activity\", \"costTier\": \"1\", \"status\": \"to-visit\", \"tags\": [ \"coast\", \"walk\" ], \"notes\": \"Bring water and sun protection.\", \"lat\": 43.5551, \"lng\": 7.1302 }, { \"title\": \"Èze medieval village\", \"day\": \"2025-07-09\", \"location\": \"Èze Village\", \"startTime\": \"09:30\", \"endTime\": \"11:30\", \"category\": \"activity\", \"costTier\": \"2\", \"status\": \"to-visit\", \"tags\": [ \"village\", \"views\" ], \"notes\": \"Climb to the panoramic garden.\", \"lat\": 43.7277, \"lng\": 7.3617 }, { \"title\": \"Jardin Exotique d’Èze\", \"day\": \"2025-07-09\", \"location\": \"20 Rue du Château, Èze\", \"startTime\": \"11:30\", \"endTime\": \"12:30\", \"category\": \"activity\", \"costTier\": \"2\", \"status\": \"reserved\", \"tags\": [ \"garden\", \"views\" ], \"notes\": \"Ticket saved with trip documents.\", \"lat\": 43.7281, \"lng\": 7.3614 }, { \"title\": \"Saint-Tropez old port\", \"day\": \"2025-07-10\", \"location\": \"Vieux Port, Saint-Tropez\", \"startTime\": \"10:30\", \"endTime\": \"12:00\", \"category\": \"activity\", \"costTier\": \"2\", \"status\": \"to-visit\", \"tags\": [ \"port\", \"walk\" ], \"notes\": \"Coffee near the waterfront.\", \"lat\": 43.2726, \"lng\": 6.6374 }, { \"title\": \"Place des Lices\", \"day\": \"2025-07-10\", \"location\": \"Place des Lices, Saint-Tropez\", \"startTime\": \"12:15\", \"endTime\": \"13:15\", \"category\": \"food\", \"costTier\": \"3\", \"status\": \"to-visit\", \"tags\": [ \"food\", \"square\" ], \"notes\": \"Lunch beneath the plane trees.\", \"lat\": 43.2693, \"lng\": 6.6404 }, { \"title\": \"Menton old town & gardens\", \"day\": \"2025-07-11\", \"location\": \"Vieille Ville, Menton\", \"startTime\": \"09:30\", \"endTime\": \"12:00\", \"category\": \"activity\", \"costTier\": \"1\", \"status\": \"to-visit\", \"tags\": [ \"garden\", \"walk\" ], \"notes\": \"Follow the ochre stairways uphill.\", \"lat\": 43.7765, \"lng\": 7.5049 }, { \"title\": \"Lemon terrace lunch\", \"day\": \"2025-07-11\", \"location\": \"Quai Bonaparte, Menton\", \"startTime\": \"12:30\", \"endTime\": \"14:00\", \"category\": \"food\", \"costTier\": \"3\", \"status\": \"reserved\", \"tags\": [ \"food\", \"sea\" ], \"notes\": \"Ask for the lemon tasting menu.\", \"lat\": 43.7737, \"lng\": 7.5088 }, { \"title\": \"Marc Chagall National Museum\", \"day\": \"unscheduled\", \"location\": \"Avenue Docteur Ménard, Nice\", \"startTime\": \"\", \"endTime\": \"\", \"category\": \"idea\", \"costTier\": \"2\", \"status\": \"to-visit\", \"tags\": [ \"museum\", \"art\" ], \"notes\": \"Possible rainy-day stop.\", \"lat\": 43.7092, \"lng\": 7.2698 }, { \"title\": \"Villa Ephrussi de Rothschild\", \"day\": \"unscheduled\", \"location\": \"Saint-Jean-Cap-Ferrat\", \"startTime\": \"\", \"endTime\": \"\", \"category\": \"idea\", \"costTier\": \"3\", \"status\": \"to-visit\", \"tags\": [ \"garden\", \"villa\" ], \"notes\": \"Leave room for the musical fountains.\", \"lat\": 43.6961, \"lng\": 7.3282 }, { \"title\": \"Paloma Beach picnic\", \"day\": \"unscheduled\", \"location\": \"Saint-Jean-Cap-Ferrat\", \"startTime\": \"\", \"endTime\": \"\", \"category\": \"idea\", \"costTier\": \"2\", \"status\": \"to-visit\", \"tags\": [ \"beach\", \"food\" ], \"notes\": \"Bring a light picnic and towels.\", \"lat\": 43.6876, \"lng\": 7.3356 } ] }"
      - generic [ref=e475]:
        - text: Or choose a trip JSON file
        - button "Or choose a trip JSON file" [ref=e476]
      - button "Import trip JSON" [active] [ref=e479] [cursor=pointer]
  - dialog "Planner tour" [ref=e480]:
    - text: 1 OF 3
    - heading "Build your day-by-day plan" [level=2] [ref=e481]
    - paragraph [ref=e482]: Your itinerary stays in sync with the map and exports.
    - generic [ref=e483]:
      - button "Skip tour" [ref=e484] [cursor=pointer]
      - button "Next" [ref=e485] [cursor=pointer]
  - status: Imported 17 stops; replaced previous 17
```

# Test source

```ts
  1042 |   await expect(page.locator('.stop-row').first()).toContainText('Renamed Stop');
  1043 |
  1044 | });
  1045 |
  1046 | test('14.5 count_delta_is_exact', async ({ page }) => {
  1047 |
  1048 |   await page.click('#add-stop');
  1049 |   await page.fill('input[name="title"]', 'New Exact Stop');
  1050 |   await page.fill('input[name="location"]', 'New Loc');
  1051 |   await page.fill('input[name="lat"]', '10');
  1052 |   await page.fill('input[name="lng"]', '10');
  1053 |   await page.selectOption('select[name="day"]', { index: 1 });
  1054 |   await page.click('#stop-submit');
  1055 |   await expect(page.locator('.stop-row')).toHaveCount(9);
  1056 |
  1057 | });
  1058 |
  1059 | test('14.6 different_inputs_change_outcomes', async ({ page }) => {
  1060 |
  1061 |   await page.click('#add-stop');
  1062 |   await page.fill('input[name="title"]', 'New Exact Stop');
  1063 |   await page.fill('input[name="location"]', 'New Loc');
  1064 |   await page.fill('input[name="lat"]', '10');
  1065 |   await page.fill('input[name="lng"]', '10');
  1066 |   await page.selectOption('select[name="day"]', { index: 1 });
  1067 |   await page.click('#stop-submit');
  1068 |   await expect(page.locator('.stop-row')).toHaveCount(9);
  1069 |
  1070 | });
  1071 |
  1072 | test('14.7 interleaved_flows_preserve_state', async ({ page }) => {
  1073 |
  1074 |   await page.click('#open-export');
  1075 |   await page.click('button[data-export="ics"]');
  1076 |   await expect(page.locator('#export-preview')).toContainText('BEGIN:VCALENDAR');
  1077 |   await expect(page.locator('#export-preview')).toContainText('BEGIN:VEVENT');
  1078 |   await expect(page.locator('#export-preview')).toContainText('SUMMARY:');
  1079 |   await expect(page.locator('#export-preview')).toContainText('DTSTART');
  1080 |
  1081 | });
  1082 |
  1083 | test('14.8 empty_to_repopulated_round_trip', async ({ page }) => {
  1084 |
  1085 |   page.on('dialog', dialog => dialog.accept());
  1086 |   await page.click('.stop-row:first-child');
  1087 |   await page.click('#delete-selected');
  1088 |   await page.waitForTimeout(300);
  1089 |   await expect(page.locator('.stop-row')).toHaveCount(7);
  1090 |
  1091 | });
  1092 |
  1093 | test('14.9 vote_to_export_chain', async ({ page }) => {
  1094 |
  1095 |   await page.click('#open-export');
  1096 |   await page.click('button[data-export="ics"]');
  1097 |   await expect(page.locator('#export-preview')).toContainText('BEGIN:VCALENDAR');
  1098 |   await expect(page.locator('#export-preview')).toContainText('BEGIN:VEVENT');
  1099 |   await expect(page.locator('#export-preview')).toContainText('SUMMARY:');
  1100 |   await expect(page.locator('#export-preview')).toContainText('DTSTART');
  1101 |
  1102 | });
  1103 |
  1104 | test('14.10 merge_content_everywhere_chain', async ({ page }) => {
  1105 |
  1106 |   await page.click('.stop-row:first-child');
  1107 |   await page.click('#edit-selected');
  1108 |   await page.fill('input[name="title"]', 'Renamed Stop');
  1109 |   await page.click('#stop-submit');
  1110 |   await expect(page.locator('.stop-row').first()).toContainText('Renamed Stop');
  1111 |
  1112 | });
  1113 |
  1114 | test('14.11 undo_round_trip_multi_surface', async ({ page }) => {
  1115 |
  1116 |   page.on('dialog', dialog => dialog.accept());
  1117 |   await page.click('.stop-row:first-child');
  1118 |   await page.click('#delete-selected');
  1119 |   await page.waitForTimeout(300);
  1120 |   await expect(page.locator('.stop-row')).toHaveCount(7);
  1121 |
  1122 | });
  1123 |
  1124 | test('14.12 exports_recompile_from_live_state', async ({ page }) => {
  1125 |
  1126 |   await page.click('.stop-row:first-child');
  1127 |   await page.click('#edit-selected');
  1128 |   await page.fill('input[name="title"]', 'Renamed Stop');
  1129 |   await page.click('#stop-submit');
  1130 |   await expect(page.locator('.stop-row').first()).toContainText('Renamed Stop');
  1131 |
  1132 | });
  1133 |
  1134 | test('14.13 trip_json_export_import_round_trip', async ({ page }) => {
  1135 |
  1136 |   await page.click('#open-export');
  1137 |   await page.click('button[data-export="trip-json"]');
  1138 |   const payload = await page.locator('#export-preview').innerText();
  1139 |   await page.click('button[data-export="import"]');
  1140 |   await page.fill('#import-text', payload);
  1141 |   await page.click('#import-submit');
> 1142 |   await expect(page.locator('.stop-row')).toHaveCount(8);
       |                                           ^ Error: expect(locator).toHaveCount(expected) failed
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
  1241 |   await expect(page.locator('#ideas-drawer')).toBeVisible();
  1242 | });
```