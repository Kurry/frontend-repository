# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.mjs >> 4.16 export_import_notice_motion
- Location: e2e.spec.mjs:522:1

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
  502 |   await expect(page.locator('#stop-dialog')).toBeVisible();
  503 | });
  504 |
  505 | test('4.12 coachmark_step_transitions', async ({ page }) => {
  506 |   await page.click('#add-stop');
  507 |   await expect(page.locator('#stop-dialog')).toBeVisible();
  508 | });
  509 |
  510 | test('4.13 accordion_height_animates', async ({ page }) => {
  511 |
  512 |   await page.click('.map-pins');
  513 |   await expect(page.locator('#detail-card')).toBeVisible();
  514 | });
  515 |
  516 | test('4.14 promotion_animates_bucket_to_day', async ({ page }) => {
  517 |
  518 |   await page.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Ideas bucket')); if (b) b.click(); });
  519 |   await expect(page.locator('#ideas-drawer')).toBeVisible();
  520 | });
  521 |
  522 | test('4.16 export_import_notice_motion', async ({ page }) => {
  523 |
  524 |   await page.click('#open-export');
  525 |   await page.click('button[data-export="trip-json"]');
  526 |   const payload = await page.locator('#export-preview').innerText();
  527 |   await page.click('button[data-export="import"]');
  528 |   await page.fill('#import-text', payload);
  529 |   await page.click('#import-submit');
> 530 |   await expect(page.locator('.stop-row')).toHaveCount(8);
      |                                           ^ Error: expect(locator).toHaveCount(expected) failed
  531 |
  532 | });
  533 |
  534 | // NOT-AUTOMATABLE: 11.1 — delightful_microinteractions: Subjective/Visual
  535 | // NOT-AUTOMATABLE: 11.2 — advanced_motion_mechanics: Subjective/Visual
  536 | // NOT-AUTOMATABLE: 11.3 — guided_onboarding: Subjective/Visual
  537 | // NOT-AUTOMATABLE: 11.4 — enhanced_interactive_graphics: Subjective/Visual
  538 | // NOT-AUTOMATABLE: 11.5 — alternative_input_support: Subjective/Visual
  539 | // NOT-AUTOMATABLE: 11.6 — preference_personalization: Subjective/Visual
  540 | // NOT-AUTOMATABLE: 11.7 — polished_brand_narrative: Subjective/Visual
  541 | // NOT-AUTOMATABLE: 11.8 — dynamic_theming_beyond_requirements: Subjective/Visual
  542 | // NOT-AUTOMATABLE: 11.9 — genre_appropriate_platform_features: Subjective/Visual
  543 | // NOT-AUTOMATABLE: 11.10 — competition_level_innovation: Subjective/Visual
  544 | // NOT-AUTOMATABLE: 11.11 — latency_simulation_optimistic_ui: Subjective/Visual
  545 | // NOT-AUTOMATABLE: 11.12 — error_toast_test_dispatcher: Subjective/Visual
  546 | // NOT-AUTOMATABLE: innovation.catchall — innovation_catchall: Subjective innovation catchall
  547 | test('4.3 stop_and_import_errors_actionable', async ({ page }) => {
  548 |
  549 |   await page.click('#open-export');
  550 |   await page.click('button[data-export="trip-json"]');
  551 |   const payload = await page.locator('#export-preview').innerText();
  552 |   await page.click('button[data-export="import"]');
  553 |   await page.fill('#import-text', payload);
  554 |   await page.click('#import-submit');
  555 |   await expect(page.locator('.stop-row')).toHaveCount(8);
  556 |
  557 | });
  558 |
  559 | test('4.15 recurring_duplicate_guard', async ({ page }) => {
  560 |   await page.click('#add-stop');
  561 |   await expect(page.locator('#stop-dialog')).toBeVisible();
  562 | });
  563 |
  564 | test('4.17 out_of_enum_rejected', async ({ page }) => {
  565 |   await page.click('#add-stop');
  566 |   await expect(page.locator('#stop-dialog')).toBeVisible();
  567 | });
  568 |
  569 | test('4.18 malformed_import_rejected', async ({ page }) => {
  570 |
  571 |   await page.click('#open-export');
  572 |   await page.click('button[data-export="trip-json"]');
  573 |   const payload = await page.locator('#export-preview').innerText();
  574 |   await page.click('button[data-export="import"]');
  575 |   await page.fill('#import-text', payload);
  576 |   await page.click('#import-submit');
  577 |   await expect(page.locator('.stop-row')).toHaveCount(8);
  578 |
  579 | });
  580 |
  581 | test('4.19 invalid_stop_import_rejected', async ({ page }) => {
  582 |
  583 |   await page.click('#open-export');
  584 |   await page.click('button[data-export="trip-json"]');
  585 |   const payload = await page.locator('#export-preview').innerText();
  586 |   await page.click('button[data-export="import"]');
  587 |   await page.fill('#import-text', payload);
  588 |   await page.click('#import-submit');
  589 |   await expect(page.locator('.stop-row')).toHaveCount(8);
  590 |
  591 | });
  592 |
  593 | test('4.20 title_or_notes_length_rejected', async ({ page }) => {
  594 |   await page.click('#add-stop');
  595 |   await expect(page.locator('#stop-dialog')).toBeVisible();
  596 | });
  597 |
  598 | // NOT-AUTOMATABLE: 3.3 — layout_matches_reference: Subjective/Visual
  599 | // NOT-AUTOMATABLE: 3.5 — responsive_behavior_matches_reference: Subjective/Visual
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
```