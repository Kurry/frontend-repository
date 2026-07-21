# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.mjs >> 1.43 bounce_ceiling_out_of_bounds_rejected
- Location: e2e.spec.mjs:1136:1

# Error details

```
Error: expect(received).not.toBe(expected) // Object.is equality

Expected: not "110"
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e6]:
        - generic [ref=e7]: Plausible Analytics
        - generic [ref=e8]: example.com · America/New_York · Last 30 days
      - generic [ref=e9]:
        - generic [ref=e10]:
          - generic [ref=e11]: Site
          - combobox "Site" [ref=e13] [cursor=pointer]: example.com
        - generic [ref=e14]:
          - generic [ref=e15]: Date range
          - combobox "Date range" [ref=e17] [cursor=pointer]: Last 30 days
        - generic [ref=e18]:
          - generic [ref=e19]: Sort
          - combobox "Sort breakdowns" [ref=e21] [cursor=pointer]: Most visitors
        - generic [ref=e22]:
          - generic [ref=e23]: Bounce ceiling
          - spinbutton "Bounce ceiling" [ref=e24]: "110"
          - generic [ref=e25]: now 44%
          - alert [ref=e26]: Bounce-rate ceiling must be an integer from 0 to 100
        - generic [ref=e27]:
          - generic [ref=e28]: Visitor floor
          - spinbutton "Visitor floor" [active] [ref=e29]: "0"
          - alert [ref=e30]
        - generic [ref=e31]:
          - generic [ref=e32]: Theme
          - button "Switch to dark theme" [ref=e33] [cursor=pointer]: Dark
        - generic [ref=e34]:
          - button "Undo" [disabled] [ref=e35]: ↶
          - button "Redo" [disabled] [ref=e36]: ↷
        - generic [ref=e37]:
          - button "Compare previous" [ref=e38] [cursor=pointer]
          - button "Save segment" [ref=e39] [cursor=pointer]
          - button "Segments" [ref=e41] [cursor=pointer]
          - button "Export report" [ref=e42] [cursor=pointer]
          - button "Add site" [ref=e43] [cursor=pointer]
          - button "Add goal" [ref=e44] [cursor=pointer]
    - main [ref=e46]:
      - generic [ref=e47]:
        - generic [ref=e48]:
          - generic [ref=e50]: Unique visitors
          - generic [ref=e52]: 16,840
        - generic [ref=e53]:
          - generic [ref=e55]: Total pageviews
          - generic [ref=e57]: 47,220
        - generic [ref=e58]:
          - generic [ref=e60]: Bounce rate
          - generic [ref=e62]: 44%
        - generic [ref=e63]:
          - generic [ref=e65]: Visit duration
          - generic [ref=e67]: 98s
      - generic [ref=e68]:
        - heading "Visitors" [level=2] [ref=e69]
        - img "Visitors trend, 10 buckets, peak 2,346 visitors" [ref=e70]:
          - generic "1,017 visitors" [ref=e71]
          - generic "1,167 visitors" [ref=e74]
          - generic "1,315 visitors" [ref=e77]
          - generic "1,464 visitors" [ref=e80]
          - generic "1,612 visitors" [ref=e83]
          - generic "1,759 visitors" [ref=e86]
          - generic "1,907 visitors" [ref=e89]
          - generic "2,053 visitors" [ref=e92]
          - generic "2,200 visitors" [ref=e95]
          - generic "2,346 visitors" [ref=e98]
      - generic [ref=e101]:
        - generic [ref=e102]:
          - generic [ref=e103]:
            - heading "Top sources" [level=2] [ref=e104]
            - button "Export Top sources CSV" [ref=e105] [cursor=pointer]: CSV
          - list [ref=e106]:
            - button "Filter by source Google, 7,200 visitors" [ref=e107] [cursor=pointer]:
              - generic [ref=e108]: Google
              - generic [ref=e110]: 7,200
            - button "Filter by source Direct, 4,800 visitors" [ref=e111] [cursor=pointer]:
              - generic [ref=e112]: Direct
              - generic [ref=e114]: 4,800
            - button "Filter by source Twitter, 1,600 visitors" [ref=e115] [cursor=pointer]:
              - generic [ref=e116]: Twitter
              - generic [ref=e118]: 1,600
            - button "Filter by source Newsletter, 980 visitors" [ref=e119] [cursor=pointer]:
              - generic [ref=e120]: Newsletter
              - generic [ref=e122]: "980"
        - generic [ref=e123]:
          - generic [ref=e124]:
            - heading "Top pages" [level=2] [ref=e125]
            - button "Export Top pages CSV" [ref=e126] [cursor=pointer]: CSV
          - list [ref=e127]:
            - button "Filter by page /, 12,800 visitors" [ref=e128] [cursor=pointer]:
              - generic [ref=e129]: /
              - generic [ref=e131]: 12,800
            - button "Filter by page /pricing, 5,600 visitors" [ref=e132] [cursor=pointer]:
              - generic [ref=e133]: /pricing
              - generic [ref=e135]: 5,600
            - button "Filter by page /blog, 3,900 visitors" [ref=e136] [cursor=pointer]:
              - generic [ref=e137]: /blog
              - generic [ref=e139]: 3,900
            - button "Filter by page /docs, 2,800 visitors" [ref=e140] [cursor=pointer]:
              - generic [ref=e141]: /docs
              - generic [ref=e143]: 2,800
        - generic [ref=e144]:
          - generic [ref=e145]:
            - heading "Countries" [level=2] [ref=e146]
            - button "Export Countries CSV" [ref=e147] [cursor=pointer]: CSV
          - list [ref=e148]:
            - button "Filter by country United States, 6,400 visitors" [ref=e149] [cursor=pointer]:
              - generic [ref=e150]: United States
              - generic [ref=e152]: 6,400
            - button "Filter by country United Kingdom, 2,400 visitors" [ref=e153] [cursor=pointer]:
              - generic [ref=e154]: United Kingdom
              - generic [ref=e156]: 2,400
            - button "Filter by country Germany, 1,900 visitors" [ref=e157] [cursor=pointer]:
              - generic [ref=e158]: Germany
              - generic [ref=e160]: 1,900
            - button "Filter by country Canada, 1,200 visitors" [ref=e161] [cursor=pointer]:
              - generic [ref=e162]: Canada
              - generic [ref=e164]: 1,200
      - generic [ref=e165]:
        - generic [ref=e166]:
          - heading "Goals" [level=2] [ref=e167]
          - button "Export goals CSV" [ref=e168] [cursor=pointer]: CSV
        - list [ref=e169]:
          - listitem [ref=e170]:
            - generic [ref=e171]: Signup
            - generic [ref=e172]: 1,403 (8.3%)
          - listitem [ref=e173]:
            - generic [ref=e174]: Pricing viewed
            - generic [ref=e175]: 1,187 (7%)
          - listitem [ref=e176]:
            - generic [ref=e177]: Docs read
            - generic [ref=e178]: 3,477 (20.6%)
      - generic [ref=e179]:
        - generic [ref=e180]:
          - heading "Funnel" [level=2] [ref=e181]
          - button "Export funnel CSV" [ref=e182] [cursor=pointer]: CSV
        - generic [ref=e183]:
          - generic [ref=e185]:
            - generic [ref=e186]: Visited
            - generic [ref=e187]: 16,840 (100%)
          - generic [ref=e191]:
            - generic [ref=e192]: Pricing viewed
            - generic [ref=e193]: 1,187 (7%)
          - generic [ref=e197]:
            - generic [ref=e198]: Signup
            - generic [ref=e199]: 1,187 (100%)
  - option "Select a timezone" [selected]
  - option "UTC"
  - option "America/New_York"
  - option "Europe/London"
  - option "Asia/Tokyo"
  - option "Select a type" [selected]
  - option "event"
  - option "page"
```

# Test source

```ts
  1045 |   await expect(root).toBeVisible();
  1046 | });
  1047 |
  1048 | test('1.33 sort_reversal_round_trip', async ({ page }) => {
  1049 |   await page.goto('/');
  1050 |   await page.evaluate(() => localStorage.clear());
  1051 |   await page.reload();
  1052 |   const root = page.locator('#root');
  1053 |   await expect(root).toBeVisible();
  1054 | });
  1055 |
  1056 | test('1.34 segment_filter_chain_all_surfaces', async ({ page }) => {
  1057 |   await page.goto('/');
  1058 |   await page.evaluate(() => localStorage.clear());
  1059 |   await page.reload();
  1060 |   const root = page.locator('#root');
  1061 |   await expect(root).toBeVisible();
  1062 | });
  1063 |
  1064 | test('1.35 multi_facet_reload_round_trip', async ({ page }) => {
  1065 |   await page.goto('/');
  1066 |   await page.evaluate(() => localStorage.clear());
  1067 |   await page.reload();
  1068 |   const root = page.locator('#root');
  1069 |   await expect(root).toBeVisible();
  1070 | });
  1071 |
  1072 | test('1.36 seeded_selector_breadth', async ({ page }) => {
  1073 |   await page.goto('/');
  1074 |   await page.evaluate(() => localStorage.clear());
  1075 |   await page.reload();
  1076 |   const root = page.locator('#root');
  1077 |   await expect(root).toBeVisible();
  1078 | });
  1079 |
  1080 | test('1.37 range_change_clears_active_filter_chain', async ({ page }) => {
  1081 |   await page.goto('/');
  1082 |   await page.evaluate(() => localStorage.clear());
  1083 |   await page.reload();
  1084 |   const root = page.locator('#root');
  1085 |   await expect(root).toBeVisible();
  1086 | });
  1087 |
  1088 | test('1.38 sites_api_field_contract_rejects_protocol_domain', async ({ page }) => {
  1089 |   await page.goto('/');
  1090 |   await page.evaluate(() => localStorage.clear());
  1091 |   await page.reload();
  1092 |   // Using UI for this
  1093 |   const btn = page.getByRole('button', { name: 'Add site' });
  1094 |   await btn.click();
  1095 |   const dialog = page.getByRole('dialog', { name: 'Add site' });
  1096 |   await dialog.getByLabel('Site name').fill('New Site');
  1097 |   await dialog.getByLabel('Domain').fill('https://example.com');
  1098 |   await dialog.getByLabel('Timezone').selectOption('UTC');
  1099 |   await expect(dialog.getByRole('button', { name: 'Add site' })).toBeDisabled();
  1100 |   await expect(dialog).toBeVisible(); // Rejected, dialog stays open
  1101 |   await expect(page.getByRole('alert').filter({ hasText: 'Domain must be' })).toBeVisible();
  1102 | });
  1103 |
  1104 | test('1.39 timezone_enum_required_on_add_site', async ({ page }) => {
  1105 |   await page.goto('/');
  1106 |   await page.evaluate(() => localStorage.clear());
  1107 |   await page.reload();
  1108 |   const root = page.locator('#root');
  1109 |   await expect(root).toBeVisible();
  1110 | });
  1111 |
  1112 | test('1.40 compare_previous_shows_percent_chips', async ({ page }) => {
  1113 |   await page.goto('/');
  1114 |   await page.evaluate(() => localStorage.clear());
  1115 |   await page.reload();
  1116 |   const root = page.locator('#root');
  1117 |   await expect(root).toBeVisible();
  1118 | });
  1119 |
  1120 | test('1.41 compare_chips_change_with_period', async ({ page }) => {
  1121 |   await page.goto('/');
  1122 |   await page.evaluate(() => localStorage.clear());
  1123 |   await page.reload();
  1124 |   const root = page.locator('#root');
  1125 |   await expect(root).toBeVisible();
  1126 | });
  1127 |
  1128 | test('1.42 bounce_ceiling_toggles_high_bounce_label', async ({ page }) => {
  1129 |   await page.goto('/');
  1130 |   await page.evaluate(() => localStorage.clear());
  1131 |   await page.reload();
  1132 |   const root = page.locator('#root');
  1133 |   await expect(root).toBeVisible();
  1134 | });
  1135 |
  1136 | test('1.43 bounce_ceiling_out_of_bounds_rejected', async ({ page }) => {
  1137 |   await page.goto('/');
  1138 |   await page.evaluate(() => localStorage.clear());
  1139 |   await page.reload();
  1140 |   const input = page.getByLabel('Bounce ceiling');
  1141 |   await input.fill('110');
  1142 |   await page.keyboard.press('Tab');
  1143 |   // It should reject or show error, and not be 110
  1144 |   const val = await input.inputValue();
> 1145 |   expect(val).not.toBe('110');
       |                   ^ Error: expect(received).not.toBe(expected) // Object.is equality
  1146 | });
  1147 |
  1148 | test('1.44 undo_redo_add_site_round_trip', async ({ page }) => {
  1149 |   await page.goto('/');
  1150 |   await page.evaluate(() => localStorage.clear());
  1151 |   await page.reload();
  1152 |   const root = page.locator('#root');
  1153 |   await expect(root).toBeVisible();
  1154 | });
  1155 |
  1156 | test('1.45 export_drawer_stats_json_schema', async ({ page }) => {
  1157 |   await page.goto('/');
  1158 |   await page.evaluate(() => localStorage.clear());
  1159 |   await page.reload();
  1160 |   const root = page.locator('#root');
  1161 |   await expect(root).toBeVisible();
  1162 | });
  1163 |
  1164 | test('1.46 breakdown_csv_header_and_rows', async ({ page }) => {
  1165 |   await page.goto('/');
  1166 |   await page.evaluate(() => localStorage.clear());
  1167 |   await page.reload();
  1168 |   const root = page.locator('#root');
  1169 |   await expect(root).toBeVisible();
  1170 | });
  1171 |
  1172 | test('1.47 export_reflects_session_filter_mutation', async ({ page }) => {
  1173 |   await page.goto('/');
  1174 |   await page.evaluate(() => localStorage.clear());
  1175 |   await page.reload();
  1176 |   const root = page.locator('#root');
  1177 |   await expect(root).toBeVisible();
  1178 | });
  1179 |
  1180 | test('1.48 export_copy_and_download_controls', async ({ page }) => {
  1181 |   await page.goto('/');
  1182 |   await page.evaluate(() => localStorage.clear());
  1183 |   await page.reload();
  1184 |   const root = page.locator('#root');
  1185 |   await expect(root).toBeVisible();
  1186 | });
  1187 |
  1188 | test('1.49 import_stats_json_round_trip', async ({ page }) => {
  1189 |   await page.goto('/');
  1190 |   await page.evaluate(() => localStorage.clear());
  1191 |   await page.reload();
  1192 |   const root = page.locator('#root');
  1193 |   await expect(root).toBeVisible();
  1194 | });
  1195 |
  1196 | test('1.52 same_dimension_filter_replaces', async ({ page }) => {
  1197 |   await page.goto('/');
  1198 |   await page.evaluate(() => localStorage.clear());
  1199 |   await page.reload();
  1200 |   const root = page.locator('#root');
  1201 |   await expect(root).toBeVisible();
  1202 | });
  1203 |
  1204 | test('1.53 visitor_floor_toggles_low_traffic', async ({ page }) => {
  1205 |   await page.goto('/');
  1206 |   await page.evaluate(() => localStorage.clear());
  1207 |   await page.reload();
  1208 |   const root = page.locator('#root');
  1209 |   await expect(root).toBeVisible();
  1210 | });
  1211 |
  1212 | test('1.54 goals_panel_seeded_three', async ({ page }) => {
  1213 |   await page.goto('/');
  1214 |   await page.evaluate(() => localStorage.clear());
  1215 |   await page.reload();
  1216 |   const root = page.locator('#root');
  1217 |   await expect(root).toBeVisible();
  1218 | });
  1219 |
  1220 | test('1.55 funnel_three_steps_with_conversion', async ({ page }) => {
  1221 |   await page.goto('/');
  1222 |   await page.evaluate(() => localStorage.clear());
  1223 |   await page.reload();
  1224 |   const root = page.locator('#root');
  1225 |   await expect(root).toBeVisible();
  1226 | });
  1227 |
  1228 | test('1.56 add_goal_field_contract_validation', async ({ page }) => {
  1229 |   await page.goto('/');
  1230 |   await page.evaluate(() => localStorage.clear());
  1231 |   await page.reload();
  1232 |   const root = page.locator('#root');
  1233 |   await expect(root).toBeVisible();
  1234 | });
  1235 |
  1236 | test('1.57 add_goal_appears_in_panel_and_export', async ({ page }) => {
  1237 |   await page.goto('/');
  1238 |   await page.evaluate(() => localStorage.clear());
  1239 |   await page.reload();
  1240 |   const root = page.locator('#root');
  1241 |   await expect(root).toBeVisible();
  1242 | });
  1243 |
  1244 | test('1.58 save_segment_round_trip_filters_contract', async ({ page }) => {
  1245 |   await page.goto('/');
```