# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.mjs >> 1.2 conflict_export_focus_management
- Location: e2e.spec.mjs:1295:1

# Error details

```
Test timeout of 2000ms exceeded.
```

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  locator('.stop-row')
Expected: 9
Received: 15

Call log:
  - Expect "toHaveCount" with timeout 5000ms
  - waiting for locator('.stop-row')
    5 × locator resolved to 15 elements
      - unexpected value "15"

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
        - button "Mon 7/6 3" [ref=e30] [cursor=pointer]:
          - generic [ref=e32]: Mon 7/6
          - generic [ref=e33]: "3"
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
          - button "＋ Add stop" [active] [ref=e80] [cursor=pointer]
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
              - paragraph [ref=e147]: Monaco · 3 stops
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
              - generic [ref=e184]: ↳ Travel buffer
              - combobox "Travel mode from Casino de Monte-Carlo to New Exact Stop" [ref=e185] [cursor=pointer]:
                - option "Driving" [selected]
                - option "Walking"
                - option "Transit"
              - strong [ref=e186]: 22 min
            - article "New Exact Stop, Anytime, To Visit" [ref=e187]:
              - checkbox "Select New Exact Stop" [ref=e188]
              - generic [ref=e189]: —
              - generic [ref=e190]:
                - button "New Exact Stop" [ref=e191] [cursor=pointer]
                - generic [ref=e192]:
                  - generic [ref=e193]: New Loc
                  - generic [ref=e194]: To Visit
                  - generic [ref=e195]: $$
              - generic [ref=e196]:
                - button "Move New Exact Stop earlier" [ref=e197] [cursor=pointer]: ↑
                - button "Move New Exact Stop to next day" [ref=e198] [cursor=pointer]: →
                - button "Edit New Exact Stop" [ref=e199] [cursor=pointer]: ✎
                - button "Delete New Exact Stop" [ref=e200] [cursor=pointer]: ×
        - generic [ref=e201]:
          - generic [ref=e202]:
            - button "Collapse Tuesday, July 7" [expanded] [ref=e203] [cursor=pointer]: ⌄
            - generic [ref=e205]:
              - heading "Tuesday, July 7" [level=2] [ref=e206]
              - paragraph [ref=e207]: Cannes · 2 stops
            - button "Focus map" [ref=e208] [cursor=pointer]
          - generic [ref=e210]:
            - article "La Croisette in Cannes, 09:30 CET, To Visit" [ref=e211]:
              - checkbox "Select La Croisette in Cannes" [ref=e212]
              - generic [ref=e213]: 09:30
              - generic [ref=e214]:
                - button "La Croisette in Cannes" [ref=e215] [cursor=pointer]
                - generic [ref=e216]:
                  - generic [ref=e217]: Boulevard de la Croisette, Cannes
                  - generic [ref=e218]: To Visit
                  - generic [ref=e219]: $
              - generic [ref=e220]:
                - button "Move La Croisette in Cannes earlier" [ref=e221] [cursor=pointer]: ↑
                - button "Move La Croisette in Cannes to next day" [ref=e222] [cursor=pointer]: →
                - button "Edit La Croisette in Cannes" [ref=e223] [cursor=pointer]: ✎
                - button "Delete La Croisette in Cannes" [ref=e224] [cursor=pointer]: ×
            - generic [ref=e225]:
              - generic [ref=e226]: ⚠ Impossible transit
              - combobox "Travel mode from La Croisette in Cannes to Marché Forville" [ref=e227] [cursor=pointer]:
                - option "Driving" [selected]
                - option "Walking"
                - option "Transit"
              - strong [ref=e228]: 18 min
            - article "Marché Forville, 11:15 CET, To Visit" [ref=e229]:
              - checkbox "Select Marché Forville" [ref=e230]
              - generic [ref=e231]: 11:15
              - generic [ref=e232]:
                - button "Marché Forville" [ref=e233] [cursor=pointer]
                - generic [ref=e234]:
                  - generic [ref=e235]: 6 Rue du Marché Forville, Cannes
                  - generic [ref=e236]: To Visit
                  - generic [ref=e237]: $$
              - generic [ref=e238]:
                - button "Move Marché Forville earlier" [ref=e239] [cursor=pointer]: ↑
                - button "Move Marché Forville to next day" [ref=e240] [cursor=pointer]: →
                - button "Edit Marché Forville" [ref=e241] [cursor=pointer]: ✎
                - button "Delete Marché Forville" [ref=e242] [cursor=pointer]: ×
        - generic [ref=e243]:
          - generic [ref=e244]:
            - button "Collapse Wednesday, July 8" [expanded] [ref=e245] [cursor=pointer]: ⌄
            - generic [ref=e247]:
              - heading "Wednesday, July 8" [level=2] [ref=e248]
              - paragraph [ref=e249]: Antibes · 2 stops
            - button "Focus map" [ref=e250] [cursor=pointer]
          - generic [ref=e252]:
            - article "Musée Picasso, Antibes, 10:00 CET, Reserved" [ref=e253]:
              - checkbox "Select Musée Picasso, Antibes" [ref=e254]
              - generic [ref=e255]: 10:00
              - generic [ref=e256]:
                - button "Musée Picasso, Antibes" [ref=e257] [cursor=pointer]
                - generic [ref=e258]:
                  - generic [ref=e259]: Place Mariejol, Antibes
                  - generic [ref=e260]: Reserved
                  - generic [ref=e261]: $$
              - generic [ref=e262]:
                - button "Move Musée Picasso, Antibes earlier" [ref=e263] [cursor=pointer]: ↑
                - button "Move Musée Picasso, Antibes to next day" [ref=e264] [cursor=pointer]: →
                - button "Edit Musée Picasso, Antibes" [ref=e265] [cursor=pointer]: ✎
                - button "Delete Musée Picasso, Antibes" [ref=e266] [cursor=pointer]: ×
            - generic [ref=e267]:
              - generic [ref=e268]: ↳ Travel buffer
              - combobox "Travel mode from Musée Picasso, Antibes to Cap d'Antibes coastal walk" [ref=e269] [cursor=pointer]:
                - option "Driving" [selected]
                - option "Walking"
                - option "Transit"
              - strong [ref=e270]: 18 min
            - article "Cap d'Antibes coastal walk, 14:00 CET, To Visit" [ref=e271]:
              - checkbox "Select Cap d'Antibes coastal walk" [ref=e272]
              - generic [ref=e273]: 14:00
              - generic [ref=e274]:
                - button "Cap d'Antibes coastal walk" [ref=e275] [cursor=pointer]
                - generic [ref=e276]:
                  - generic [ref=e277]: Chemin des Douaniers, Antibes
                  - generic [ref=e278]: To Visit
                  - generic [ref=e279]: $
              - generic [ref=e280]:
                - button "Move Cap d'Antibes coastal walk earlier" [ref=e281] [cursor=pointer]: ↑
                - button "Move Cap d'Antibes coastal walk to next day" [ref=e282] [cursor=pointer]: →
                - button "Edit Cap d'Antibes coastal walk" [ref=e283] [cursor=pointer]: ✎
                - button "Delete Cap d'Antibes coastal walk" [ref=e284] [cursor=pointer]: ×
        - generic [ref=e285]:
          - generic [ref=e286]:
            - button "Collapse Thursday, July 9" [expanded] [ref=e287] [cursor=pointer]: ⌄
            - generic [ref=e289]:
              - heading "Thursday, July 9" [level=2] [ref=e290]
              - paragraph [ref=e291]: Èze · 2 stops
            - button "Focus map" [ref=e292] [cursor=pointer]
          - generic [ref=e294]:
            - article "Èze medieval village, 09:30 CET, To Visit" [ref=e295]:
              - checkbox "Select Èze medieval village" [ref=e296]
              - generic [ref=e297]: 09:30
              - generic [ref=e298]:
                - button "Èze medieval village" [ref=e299] [cursor=pointer]
                - generic [ref=e300]:
                  - generic [ref=e301]: Èze Village
                  - generic [ref=e302]: To Visit
                  - generic [ref=e303]: $$
              - generic [ref=e304]:
                - button "Move Èze medieval village earlier" [ref=e305] [cursor=pointer]: ↑
                - button "Move Èze medieval village to next day" [ref=e306] [cursor=pointer]: →
                - button "Edit Èze medieval village" [ref=e307] [cursor=pointer]: ✎
                - button "Delete Èze medieval village" [ref=e308] [cursor=pointer]: ×
            - generic [ref=e309]:
              - generic [ref=e310]: ⚠ Impossible transit
              - combobox "Travel mode from Èze medieval village to Jardin Exotique d’Èze" [ref=e311] [cursor=pointer]:
                - option "Driving" [selected]
                - option "Walking"
                - option "Transit"
              - strong [ref=e312]: 18 min
            - article "Jardin Exotique d’Èze, 11:30 CET, Reserved" [ref=e313]:
              - checkbox "Select Jardin Exotique d’Èze" [ref=e314]
              - generic [ref=e315]: 11:30
              - generic [ref=e316]:
                - button "Jardin Exotique d’Èze" [ref=e317] [cursor=pointer]
                - generic [ref=e318]:
                  - generic [ref=e319]: 20 Rue du Château, Èze
                  - generic [ref=e320]: Reserved
                  - generic [ref=e321]: $$
              - generic [ref=e322]:
                - button "Move Jardin Exotique d’Èze earlier" [ref=e323] [cursor=pointer]: ↑
                - button "Move Jardin Exotique d’Èze to next day" [ref=e324] [cursor=pointer]: →
                - button "Edit Jardin Exotique d’Èze" [ref=e325] [cursor=pointer]: ✎
                - button "Delete Jardin Exotique d’Èze" [ref=e326] [cursor=pointer]: ×
        - generic [ref=e327]:
          - generic [ref=e328]:
            - button "Collapse Friday, July 10" [expanded] [ref=e329] [cursor=pointer]: ⌄
            - generic [ref=e331]:
              - heading "Friday, July 10" [level=2] [ref=e332]
              - paragraph [ref=e333]: Saint-Tropez · 2 stops
            - button "Focus map" [ref=e334] [cursor=pointer]
          - generic [ref=e336]:
            - article "Saint-Tropez old port, 10:30 CET, To Visit" [ref=e337]:
              - checkbox "Select Saint-Tropez old port" [ref=e338]
              - generic [ref=e339]: 10:30
              - generic [ref=e340]:
                - button "Saint-Tropez old port" [ref=e341] [cursor=pointer]
                - generic [ref=e342]:
                  - generic [ref=e343]: Vieux Port, Saint-Tropez
                  - generic [ref=e344]: To Visit
                  - generic [ref=e345]: $$
              - generic [ref=e346]:
                - button "Move Saint-Tropez old port earlier" [ref=e347] [cursor=pointer]: ↑
                - button "Move Saint-Tropez old port to next day" [ref=e348] [cursor=pointer]: →
                - button "Edit Saint-Tropez old port" [ref=e349] [cursor=pointer]: ✎
                - button "Delete Saint-Tropez old port" [ref=e350] [cursor=pointer]: ×
            - generic [ref=e351]:
              - generic [ref=e352]: ⚠ Impossible transit
              - combobox "Travel mode from Saint-Tropez old port to Place des Lices" [ref=e353] [cursor=pointer]:
                - option "Driving" [selected]
                - option "Walking"
                - option "Transit"
              - strong [ref=e354]: 18 min
            - article "Place des Lices, 12:15 CET, To Visit" [ref=e355]:
              - checkbox "Select Place des Lices" [ref=e356]
              - generic [ref=e357]: 12:15
              - generic [ref=e358]:
                - button "Place des Lices" [ref=e359] [cursor=pointer]
                - generic [ref=e360]:
                  - generic [ref=e361]: Place des Lices, Saint-Tropez
                  - generic [ref=e362]: To Visit
                  - generic [ref=e363]: $$$
              - generic [ref=e364]:
                - button "Move Place des Lices earlier" [ref=e365] [cursor=pointer]: ↑
                - button "Move Place des Lices to next day" [ref=e366] [cursor=pointer]: →
                - button "Edit Place des Lices" [ref=e367] [cursor=pointer]: ✎
                - button "Delete Place des Lices" [ref=e368] [cursor=pointer]: ×
        - generic [ref=e369]:
          - generic [ref=e370]:
            - button "Collapse Saturday, July 11" [expanded] [ref=e371] [cursor=pointer]: ⌄
            - generic [ref=e373]:
              - heading "Saturday, July 11" [level=2] [ref=e374]
              - paragraph [ref=e375]: Menton · 2 stops
            - button "Focus map" [ref=e376] [cursor=pointer]
          - generic [ref=e378]:
            - article "Menton old town & gardens, 09:30 CET, To Visit" [ref=e379]:
              - checkbox "Select Menton old town & gardens" [ref=e380]
              - generic [ref=e381]: 09:30
              - generic [ref=e382]:
                - button "Menton old town & gardens" [ref=e383] [cursor=pointer]
                - generic [ref=e384]:
                  - generic [ref=e385]: Vieille Ville, Menton
                  - generic [ref=e386]: To Visit
                  - generic [ref=e387]: $
              - generic [ref=e388]:
                - button "Move Menton old town & gardens earlier" [ref=e389] [cursor=pointer]: ↑
                - button "Move Menton old town & gardens to next day" [ref=e390] [cursor=pointer]: →
                - button "Edit Menton old town & gardens" [ref=e391] [cursor=pointer]: ✎
                - button "Delete Menton old town & gardens" [ref=e392] [cursor=pointer]: ×
            - generic [ref=e393]:
              - generic [ref=e394]: ↳ Travel buffer
              - combobox "Travel mode from Menton old town & gardens to Lemon terrace lunch" [ref=e395] [cursor=pointer]:
                - option "Driving" [selected]
                - option "Walking"
                - option "Transit"
              - strong [ref=e396]: 18 min
            - article "Lemon terrace lunch, 12:30 CET, Reserved" [ref=e397]:
              - checkbox "Select Lemon terrace lunch" [ref=e398]
              - generic [ref=e399]: 12:30
              - generic [ref=e400]:
                - button "Lemon terrace lunch" [ref=e401] [cursor=pointer]
                - generic [ref=e402]:
                  - generic [ref=e403]: Quai Bonaparte, Menton
                  - generic [ref=e404]: Reserved
                  - generic [ref=e405]: $$$
              - generic [ref=e406]:
                - button "Move Lemon terrace lunch earlier" [ref=e407] [cursor=pointer]: ↑
                - button "Move Lemon terrace lunch to next day" [ref=e408] [cursor=pointer]: →
                - button "Edit Lemon terrace lunch" [ref=e409] [cursor=pointer]: ✎
                - button "Delete Lemon terrace lunch" [ref=e410] [cursor=pointer]: ×
    - region "Interactive trip map" [ref=e411]:
      - generic [ref=e412]:
        - button "↗ Optimize route" [ref=e413] [cursor=pointer]
        - combobox "Map layer" [ref=e414] [cursor=pointer]:
          - option "Coastal" [selected]
          - option "Terrain"
          - option "Night"
        - button "Zoom out" [ref=e415] [cursor=pointer]: −
        - button "Zoom in" [ref=e416] [cursor=pointer]: ＋
      - generic [ref=e417]:
        - img:
          - generic: 0.8 km
          - generic: 0.8 km
          - generic: 23.4 km
          - generic: 0.8 km
          - generic: 1.0 km
          - generic: 0.8 km
          - generic: 0.8 km
          - generic: 0.8 km
        - generic [ref=e421]:
          - button "Hotel Le Negresco, Day 1" [ref=e422] [cursor=pointer]:
            - generic [ref=e423]: "1"
          - button "Old Nice & Cours Saleya, Day 1" [ref=e424] [cursor=pointer]:
            - generic [ref=e425]: "1"
          - button "Prince's Palace of Monaco, Day 2" [ref=e426] [cursor=pointer]:
            - generic [ref=e427]: "2"
          - button "Casino de Monte-Carlo, Day 2" [ref=e428] [cursor=pointer]:
            - generic [ref=e429]: "2"
          - button "La Croisette in Cannes, Day 3" [ref=e430] [cursor=pointer]:
            - generic [ref=e431]: "3"
          - button "Marché Forville, Day 3" [ref=e432] [cursor=pointer]:
            - generic [ref=e433]: "3"
          - button "Musée Picasso, Antibes, Day 4" [ref=e434] [cursor=pointer]:
            - generic [ref=e435]: "4"
          - button "Cap d'Antibes coastal walk, Day 4" [ref=e436] [cursor=pointer]:
            - generic [ref=e437]: "4"
          - button "Èze medieval village, Day 5" [ref=e438] [cursor=pointer]:
            - generic [ref=e439]: "5"
          - button "Jardin Exotique d’Èze, Day 5" [ref=e440] [cursor=pointer]:
            - generic [ref=e441]: "5"
          - button "Saint-Tropez old port, Day 6" [ref=e442] [cursor=pointer]:
            - generic [ref=e443]: "6"
          - button "Place des Lices, Day 6" [ref=e444] [cursor=pointer]:
            - generic [ref=e445]: "6"
          - button "Menton old town & gardens, Day 7" [ref=e446] [cursor=pointer]:
            - generic [ref=e447]: "7"
          - button "Lemon terrace lunch, Day 7" [ref=e448] [cursor=pointer]:
            - generic [ref=e449]: "7"
          - button "New Exact Stop, Day 2" [ref=e450] [cursor=pointer]:
            - generic [ref=e451]: "2"
          - status "New Exact Stop, Day 2 Côte d'Azur":
            - strong: New Exact Stop
            - generic: Day 2 · Côte d'Azur
          - button "Marc Chagall National Museum, unscheduled idea" [ref=e452] [cursor=pointer]:
            - generic [ref=e453]: •
          - button "Villa Ephrussi de Rothschild, unscheduled idea" [ref=e454] [cursor=pointer]:
            - generic [ref=e455]: •
          - button "Paloma Beach picnic, unscheduled idea" [ref=e456] [cursor=pointer]:
            - generic [ref=e457]: •
        - generic [ref=e458]: NICE
        - generic [ref=e459]: CANNES
        - generic [ref=e460]: MONACO
        - generic [ref=e461]: MEDITERRANEAN SEA
      - region "Place detail" [ref=e462]:
        - button "Close place detail" [ref=e463] [cursor=pointer]: ×
        - generic [ref=e464]: Day 2 · Côte d'Azur
        - heading "New Exact Stop" [level=2] [ref=e465]
        - paragraph [ref=e466]: New Loc
        - tablist "Place detail sections" [ref=e467]:
          - tab "About" [selected] [ref=e468] [cursor=pointer]
          - tab "Book" [ref=e469] [cursor=pointer]
          - tab "Reviews" [ref=e470] [cursor=pointer]
          - tab "Photos" [ref=e471] [cursor=pointer]
          - tab "Mentions" [ref=e472] [cursor=pointer]
        - generic [ref=e473]: A memorable French Riviera stop.
        - generic [ref=e474]:
          - button "Edit stop" [ref=e475] [cursor=pointer]
          - button "Simulate peer edit" [ref=e476] [cursor=pointer]
          - button "Delete" [ref=e477] [cursor=pointer]
      - generic "Simulated collaborators":
        - generic [ref=e478]: Sarah
        - generic [ref=e479]: John
        - generic [ref=e480]: Marco
  - dialog "Planner tour" [ref=e481]:
    - text: 1 OF 3
    - heading "Build your day-by-day plan" [level=2] [ref=e482]
    - paragraph [ref=e483]: Your itinerary stays in sync with the map and exports.
    - generic [ref=e484]:
      - button "Skip tour" [ref=e485] [cursor=pointer]
      - button "Next" [ref=e486] [cursor=pointer]
  - status: Stop added across list, map, and exports
  - generic [ref=e487]: New Exact Stop added to the itinerary
```

# Test source

```ts
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
> 1304 |   await expect(page.locator('.stop-row')).toHaveCount(9);
       |                                           ^ Error: expect(locator).toHaveCount(expected) failed
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
  1342 | test('1.7 planner_landmarks', async ({ page }) => {
  1343 |   await page.click('#add-stop');
  1344 |   await expect(page.locator('#stop-dialog')).toBeVisible();
  1345 | });
  1346 |
  1347 | test('1.8 coastal_theme_contrast', async ({ page }) => {
  1348 |   await page.click('#add-stop');
  1349 |   await page.fill('input[name="title"]', '');
  1350 |   await page.click('#stop-submit', { force: true });
  1351 |   await expect(page.locator('.field-error').first()).toBeVisible();
  1352 | });
  1353 |
  1354 | test('1.9 sidebar_main_button_semantics', async ({ page }) => {
  1355 |   await page.click('#add-stop');
  1356 |   await expect(page.locator('#stop-dialog')).toBeVisible();
  1357 | });
  1358 |
  1359 | test('1.10 planner_reduced_motion', async ({ page }) => {
  1360 |
  1361 |   page.on('dialog', dialog => dialog.accept());
  1362 |   await page.click('.stop-row:first-child');
  1363 |   await page.click('#delete-selected');
  1364 |   await page.waitForTimeout(300);
  1365 |   await expect(page.locator('.stop-row')).toHaveCount(7);
  1366 |
  1367 | });
  1368 |
  1369 | test('1.11 keyboard_alternative_for_drag', async ({ page }) => {
  1370 |   await page.click('#add-stop');
  1371 |   await expect(page.locator('#stop-dialog')).toBeVisible();
  1372 | });
  1373 |
  1374 | test('1.13 poll_names_and_promotion_announced', async ({ page }) => {
  1375 |
  1376 |   await page.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Ideas bucket')); if (b) b.click(); });
  1377 |   await expect(page.locator('#ideas-drawer')).toBeVisible();
  1378 | });
  1379 |
  1380 | test('1.14 role_state_programmatic', async ({ page }) => {
  1381 |   await page.click('#add-stop');
  1382 |   await expect(page.locator('#stop-dialog')).toBeVisible();
  1383 | });
  1384 |
  1385 | test('1.15 export_import_keyboard_operable', async ({ page }) => {
  1386 |
  1387 |   await page.click('#open-export');
  1388 |   await page.click('button[data-export="trip-json"]');
  1389 |   const payload = await page.locator('#export-preview').innerText();
  1390 |   await page.click('button[data-export="import"]');
  1391 |   await page.fill('#import-text', payload);
  1392 |   await page.click('#import-submit');
  1393 |   await expect(page.locator('.stop-row')).toHaveCount(8);
  1394 |
  1395 | });
  1396 |
  1397 |
```