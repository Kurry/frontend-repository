# Pineapple Tech Dashboard — Product Requirements Document (PRD)

This PRD specifies the **exact** static DaisyUI commerce dashboard page delivered in this folder (`Dashboard.html`, `Dashboard.css`, `Dashboard.js`). An implementer or AI given only this document must be able to recreate the same page: layout, copy, components, charts, theme behavior, popovers, microinteractions, and the **no-navigation** constraint.

**Visual / behavioral reference:** [https://html-dashboard.daisyui.com/](https://html-dashboard.daisyui.com/)  
**Local acceptance target:** the files in this directory after link removal and polish (not a multi-page app).

---

## 1. Goal

Build a single-page **admin commerce operations dashboard** for the fictional product **Pineapple Tech**. It is a visual demo shell: every control that looks like a link or CTA must remain interactive in appearance (hover, focus, cursor) but **must not navigate** anywhere.

---

## 2. Non-goals

- No real routing, multi-page site, or backend APIs.
- No authentication, form submission, or data mutation.
- No external “Docs” / DaisyUI marketing navigation.
- Do not reset or touch any database.

---

## 3. Hard constraint: no navigational links

### MUST

- The document MUST contain **zero** `<a href="...">` (and zero `<a>` elements used as nav affordances).
- The only allowed `href` in the document is the stylesheet reference: `<link href="./Dashboard.css" rel="stylesheet" />`.
- Asset URLs on `<img src>`, `<svg data-src>`, and CDN `<script src>` are allowed (they load resources; they do not navigate the page).
- Replace every former link with a non-navigating control that preserves look and feel:
  - CTAs and table actions that used `class="btn ..."` → `<button type="button" class="btn ...">`
  - Priority-queue rows that used `class="list-row"` → `<button type="button" class="list-row">`
  - Sidebar items, breadcrumbs, notification rows, profile/account menu items → `<button type="button" class="inert-nav">` (plus any existing utility classes such as `tw-qg`)
- Clicks on these controls MUST NOT change `location`, open new tabs, or load other HTML pages.

### CSS support for inert controls

Append (or equivalent) resets so DaisyUI menu / list / breadcrumb hover styles still apply after removing `<a>`:

- Reset UA button chrome for `button.inert-nav`, menu item buttons (not `.btn`), breadcrumb buttons, and `button.list-row` (`appearance: none`, transparent background, no border, inherit font/color, `cursor: pointer`).
- `button.list-row` → `width: 100%; display: grid; align-items: center;`
- Menu item buttons → `width: 100%`
- Breadcrumb buttons → hover underline + slight opacity (match DaisyUI breadcrumb link hover)

---

## 4. Tech stack & file layout

| File | Role |
|------|------|
| `Dashboard.html` | Single page markup |
| `Dashboard.css` | Compiled Tailwind v4 + DaisyUI bundle (obfuscated `tw-*` utilities) + sidebar FOUC guard + inert-nav polish |
| `Dashboard.js` | Sidebar scroll restore + FOUC reveal |

### CDN dependencies (exact versions)

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@weblogin/trendchart-elements@1.1.0/dist/index.js/+esm" async></script>
<script src="https://cdn.jsdelivr.net/npm/external-svg-loader@1.6.10/svg-loader.min.js" async></script>
<script src="https://cdn.jsdelivr.net/npm/theme-change@3/index.js"></script>
```

- **Charts:** `@weblogin/trendchart-elements` custom elements: `tc-column`, `tc-pie`, `tc-line`
- **Icons:** Heroicons 20 solid via `external-svg-loader` and `data-src="https://unpkg.com/heroicons/20/solid/<name>.svg"`
- **Theme:** `theme-change` with `data-set-theme` on a checkbox (`value="light"`)

Prefer **relative paths** for local CSS/JS (`./Dashboard.css`, `./Dashboard.js`).

Serve via local HTTP when verifying (CDN + module scripts):

```bash
cd DaisyUI && python3 -m http.server 8765
# open http://127.0.0.1:8765/Dashboard.html
```

---

## 5. Document shell

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Dashboard</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="Pineapple Tech dashboard for commerce operations, orders, products, customers, analytics, and system tools." />
  <!-- CSS + CDN scripts as above -->
</head>
<body class="drawer lg:drawer-open tw-sc bg-base-200">
  ...
</body>
</html>
```

- Default theme: DaisyUI root theme (no `data-theme` until user toggles).
- Light theme: `data-theme="light"` on `<html>` when theme toggle is checked (via `theme-change`).
- Both `light` and `dark` theme tokens exist in CSS; toggle uses `value="light"` with `data-set-theme`.

---

## 6. Layout architecture

### 6.1 DaisyUI drawer shell

1. Hidden checkbox: `<input id="my-drawer" type="checkbox" class="drawer-toggle" aria-label="Toggle sidebar" />`
2. `<main class="drawer-content bg-base-100 tw-qf tw-nd tw-md lg:border-base-300 tw-pa tw-p tw-a">` — main canvas with top/left border, large top-start radius (squircle), subtle radial gradient wash
3. `<aside class="drawer-side tw-bj">` — sidebar; overlay label `for="my-drawer"` with `drawer-overlay`
4. At `lg` and up: `lg:drawer-open` keeps the sidebar persistently open

### 6.2 Main content grid

Inside main, a 12-column CSS grid:

- Container: `class="grid tw-pc tw-sg tw-lj tw-rf"`
  - `tw-pc` → `grid-template-columns: repeat(12, minmax(0, 1fr))`
  - `tw-sg` → `gap: 1.5rem` (spacing × 6)
  - Padding utilities resolve so effective padding is `2.5rem` (`tw-rf` wins over `tw-lj` in cascade)
- Full-width rows use `tw-cd` (`grid-column: span 12`)
- Card spans (desktop):
  - `tw-lc` → span 8
  - `tw-hc` → span 4
  - `tw-kc` → span 7
  - `tw-ic` → span 5
  - `tw-jc` → span 6
- Soft card elevation: `tw-xe` (subtle shadow)

### 6.3 Sidebar FOUC guard

CSS:

```css
aside.drawer-side { visibility: hidden; }
html[data-dashboard-sidebar-ready] aside.drawer-side { visibility: visible; }
```

JS (`Dashboard.js`) restores `sessionStorage` key `dashboard:sidebar-scroll-top`, then sets `document.documentElement.dataset.dashboardSidebarReady = ""` (on rAF and a 100ms fallback). Do not remove this — matches live demo.

---

## 7. Chrome: top headers

### 7.1 Utility header (full width)

Left → right:

1. Sidebar open control (mobile drawer button): `label.btn.btn-square.btn-ghost.drawer-button` with bars-3 icon; utility `tw-ue` hides it when sidebar is permanently open (`display: none` in this build, matching live).
2. Growing title: `<h1 class="page-title tw-be tw-yb tw-ee">Dashboard</h1>` (light weight, muted opacity).
3. Search: `<input type="text" placeholder="Search" class="input input-sm tw-uc" aria-label="Search" />` (pill radius).
4. **Theme toggle:** `label.btn.btn-circle.btn-sm.btn-ghost.swap.swap-rotate`
   - Checkbox: `value="light" data-set-theme`
   - `svg.swap-on` = sun path; `svg.swap-off` = moon path
   - Behavior: checking applies light theme; unchecking returns to default/dark DaisyUI theme. Swap rotate animates icon exchange.
5. **Notifications:** button `btn btn-circle btn-sm btn-ghost` with `popovertarget="header-notifications-dropdown"`, CSS anchor `--header-notifications-anchor`, indicator + error status ping + bell icon.
6. **Profile:** avatar button `popovertarget="header-profile-dropdown"`, anchor `--header-profile-anchor`, avatar image `https://picsum.photos/80/80?5`.

### 7.2 Context header (breadcrumbs + CTAs)

- Breadcrumbs: `Dashboard` (inert button) → `Operations Overview` (`h1`)
- CTA group (inert buttons, keep icons):
  - Primary: `btn btn-sm btn-primary` — “New product” (plus icon)
  - `btn btn-sm` — “Export” (arrow-down-tray)
  - `btn btn-sm` — “System health” (server)

---

## 8. Popovers (notifications, profile, account)

Use native **Popover API** + CSS **anchor positioning**:

| Trigger | Popover id | Placement notes |
|---------|------------|-----------------|
| Notifications bell | `header-notifications-dropdown` | `menu dropdown rounded-box bg-base-100`, width ~20rem (`tw-aj`), large shadow (`tw-me`) |
| Header avatar | `header-profile-dropdown` | width ~13rem (`tw-wi`) |
| Sidebar account | `sidebar-account-dropdown` | `dropdown-top`, width ~15rem (`tw-yi`), z-index elevated |

### Notification items (4) — inert menu buttons

Each row: avatar (`picsum` 80×80 `?1`–`?4`) + bold title + body line:

1. **New message** — Alice: Hi, did you get my files?
2. **Reminder** — Your meeting is at 10am
3. **New payment** — Received $2500 from John Doe
4. **New payment** — Received $1900 from Alice

### Header profile menu items

Profile · Inbox (badge `12`) · Settings · Logout — all inert buttons.

### Sidebar account sticky footer

- Button shows online avatar, name **Ari Lane**, role **Admin**, chevron-up
- Menu: Profile settings · Docs · API settings · Logout — inert buttons with icons (user-circle, book-open, code-bracket, arrow-right-on-rectangle)

Opening a popover MUST show the menu anchored to the trigger; closing via light dismiss / re-toggle MUST work. Items must not navigate.

---

## 9. Sidebar navigation

Brand row: globe-style outline SVG + text **Pineapple Tech**.

Menu: DaisyUI `ul.menu` with accordion groups via `<details name="sidebar-group">` (only one group open at a time by shared `name`).

Top item (not in details): **Dashboard** (home icon) — inert.

Groups and children (all inert buttons; labels exact):

| Group | Badge | Children |
|-------|-------|----------|
| Users | — | All Users, Add User, Roles, Permissions, User Logs, User Stats, User Payments, User Products |
| Products | — | All Products, Add Product, Categories, Tags, Inventory, Product Logs, Product Stats |
| Transactions | — | All Transactions, Transaction Detail, Refunds, Transaction Logs |
| Orders | — | All Orders, Order Detail, Fulfillment, Returns, Abandoned Checkouts |
| Customers | — | All Customers, Customer Detail, Segments, Customer Notes |
| Messages | badge `12` | Conversations, Conversation Detail, Support Agents, Canned Replies, Departments |
| Media | — | Library, Upload, Folders, Media Settings |
| Pages | — | All Pages, Page Editor, Revisions |
| Blog | — | Posts, Add Post, Categories, Tags, Comments |
| Promotions | — | Coupons, Discounts, Campaigns, Gift Cards |
| Analytics | — | Overview, Sales, Users, Products, Support, Traffic, Reports |
| Marketing | — | Campaigns, Email, Automations, Audiences |
| Plugins | — | Installed Plugins, Add Plugin, Plugin Settings, Plugin Logs |
| Tools | — | Import, Export, Scheduled Jobs, System Health, Audit Logs |
| Settings | — | General, Commerce, Payments, Shipping, Taxes, Notifications, Integrations, Security |

Microinteractions:

- Menu item hover/focus background via DaisyUI `.menu` rules (works on `button` children).
- `<details>/<summary>` expand/collapse with chevron rotation.
- Sidebar scroll position persisted across reloads (sessionStorage).

Sidebar width: `tw-zi` → `16rem`. Nav is column flex, scrollable menu, sticky account footer.

---

## 10. Main content sections (order & content)

All metric copy, table rows, and chart values below are **normative** (must match).

### 10.1 Stats strip (full width)

`section.stats.stats-vertical.bg-base-200.xl:stats-horizontal.tw-cd.tw-xe`

| Title | Value | Desc | Icon |
|-------|-------|------|------|
| Revenue | $842K | +12.8% vs prior period | banknotes |
| Orders | 18.2K | 624 awaiting fulfillment | shopping-cart |
| Active users | 284K | 24.8K new this month | users |
| Support SLA | 94.2% | 7 high-priority threads | chat-bubble-left-right |

Stat values use semibold + tabular nums; figures at ~opacity 0.4.

### 10.2 Revenue and demand (span 8)

- Title + chart-bar icon; subtitle: “Commerce revenue, product demand, and checkout activity”
- Inert CTA: “Open sales analytics”
- `tc-column`: values `[42,48,52,49,61,68,74,78,84,92,88,101,112,118,124,132,141,148]`, labels Jan 1 … Feb 4 (18 labels as in HTML), `shape-gap="8" shape-radius="4" min="0"`, height ~18rem, primary shape color, area opacity 0
- Footer metrics: $842K Revenue · 18.2K Orders · 4.8% Checkout lift

### 10.3 Order status (span 4)

- Subtitle: “Current order volume by fulfillment stage”
- `tc-pie` values `[9482,1820,1240,864]`, labels Delivered / In Progress / In distribution / Returned; colors teal-400, orange-500, orange-300, rose-400; `shape-size="34" shape-gap="5"`
- Legend list (Delivered 9,482 · In Progress 1,820)
- Inert CTA: “Open orders”

### 10.4 Recent commerce activity (span 7)

- Inert CTA: “All orders”
- Table columns: Record, Customer, Status, Amount, (action)
- Rows:

| Record | Customer | Status | Amount | Action |
|--------|----------|--------|--------|--------|
| Order #12092 | Mina Park | badge Refund review | $124,735 | Open |
| Transaction #TRX-8842 | Arman Bell | Paid | $8,180 | Open |
| Return #RET-221 | Nora Quinn | Received | $640 | Open |
| Checkout #CHK-492 | Tessa Cole | badge-error Abandoned | $420 | Open |

Actions are `btn btn-ghost btn-xs` inert buttons.

### 10.5 Governance and risk (span 5)

- Subtitle about payment/data/security/compliance
- Radial progress `--value: 91; --size: 7rem; --thickness: 0.65rem` → **91%**
- Progress bars: Gateway verification 96% · Admin permission review 84% · Webhook signing coverage 78%
- Inert CTA: “Review controls”

### 10.6 Priority queue (span 6)

- Badge soft: “7 queued”
- List of 4 `list-row` inert buttons with icon box, title, description, soft badge:

1. Refund review: order #PS5-248 — Accidental 248 PlayStation 5 order… — Support
2. Media processor backlog — 5K derivatives waiting… — Ops
3. Plugin updates — 6 updates available, 2 security related — Platform
4. Warehouse cutoff risk — West dock needs 84 labels before 5 PM — Orders

### 10.7 Revenue run rate (span 6, primary card)

- `card bg-primary text-primary-content`
- Subtitle about daily booked revenue
- Badge: “$1.04M forecast”
- `tc-column` values `[58,64,71,62,79,88,92,96,104,112,121,118,127,136]`, gap 7, radius 4, shapes/area use primary-content colors
- Metrics: $842K Booked · $197K Pipeline · 18.6% Margin lift

### 10.8 Acquisition mix (span 4)

- `tc-pie` values `[42,24,18,16]`, size 30, gap 6; colors teal / amber / sky / rose via utilities
- Legend status dots: Organic, Direct, Email, Referral
- Inert CTA: “Traffic analytics”

### 10.9 Marketing performance (span 4)

- `tc-line` values `[12,18,24,21,28,35,40,38,46,52,49,58,66,62,71,78]`, `shape-size="3" min="0"`
- Metrics: 42.8% Open rate · $118K Attributed
- Inert CTA: “Open email studio”

### 10.10 Promotions health (span 4)

Progress rows: Coupon margin 72% · Gift card redemption 56% · Fraud pressure 11% · Offer health 88%  
Inert CTA: “Manage offers”

### 10.11 Infrastructure uptime (span 4)

- Storefront 100% — 12 uptime bars (muted heights varying)
- API 99.9% — same pattern with one `bg-error` short bar (incident)
- Inert CTA: “Open uptime”

### 10.12 Satisfaction (span 4)

- Radial 86%
- Rows: Net revenue retention 112% · Refund pressure 3.8% · VIP escalations 14 · Stock on hand 42800
- Inert CTA: “Customer center”

### 10.13 Inventory pressure (span 4)

Nested base-100 boxes + progress: Low stock 42 SKUs (42) · Oversold 7 SKUs (7) · Healthy stock 1,284 SKUs (92)  
Inert CTA: “Inventory board”

### 10.14 Plugin and tool status (span 6)

Inert CTA “Plugins”; table:

| Component | Status | Signal |
|-----------|--------|--------|
| Fraud Shield | Active | 426 coupon blocks |
| Media Optimizer | Update | Backlog impact |
| Backup Vault | Active | Last snapshot 18m ago |
| Import queue | Ready | 3 validated files |

### 10.15 Fulfillment throughput (span 6)

- Badge: 94% on time
- `tc-line` values `[34,38,44,42,51,58,63,59,66,72,78,74,82,88,91]`
- Metrics: 9,482 Packed · 624 Queued · 118 Returns

### 10.16 Automation coverage (span 4)

Email flows 82% · Scheduled jobs 68% · Inert CTA “Automation center”

### 10.17 Security watch (span 4)

Nested stats: Blocked attempts **1,284** with pinging success status + desc deltas (−8% / −2% / −5.5%); Risky sessions **4** with error status ping + “4 need review” / “1 suspicious”  
Inert CTA: “Audit logs”

### 10.18 Cash movement (span 4)

List rows: In $428K captured · Hold $22K under review · Out $18K refunds (with subtitles as in HTML)  
Inert CTA: “Transactions”

---

## 11. Visual design system

- **Framework:** Tailwind CSS v4.3.x utilities compiled into `Dashboard.css` + DaisyUI component classes (`btn`, `card`, `menu`, `stats`, `table`, `badge`, `progress`, `radial-progress`, `avatar`, `drawer`, `swap`, `indicator`, `status`, `list`, `breadcrumbs`, `dropdown`, `input`).
- **Surfaces:** Page `bg-base-200`; main content `bg-base-100`; most cards `bg-base-200`; one primary inverse card; lists often `bg-base-100`.
- **Typography:** DaisyUI semantic text; titles use card-title; muted copy `text-base-content/60` or opacity utilities (`tw-fe` ≈ 0.6).
- **Spacing:** Consistent gap scale via `tw-sg` / `tw-pg` / `tw-og`.
- **Radius:** DaisyUI `--radius-*`; inputs/avatars often fully rounded (`tw-uc`).
- **Icons:** 16px (`tw-ig`) in chrome/menus; larger for stat figures (`tw-kg`).
- **Avatars:** picsum.photos 80×80 with query seeds `?1`–`?5`.

Do not invent a different color theme (no purple-on-white redesign). Match DaisyUI default + light themes from the compiled CSS.

---

## 12. Microinteractions & polish checklist

MUST match the live demo as closely as possible:

| Interaction | Expected behavior |
|-------------|-------------------|
| Theme toggle | Swap rotate sun/moon; `theme-change` flips `data-theme`; surfaces/charts recolor via CSS variables |
| Notification popover | Anchor-positioned menu; indicator red status; hover items highlight like DaisyUI menu |
| Profile / account popovers | Same popover pattern; account opens upward |
| Sidebar accordion | `<details name="sidebar-group">` exclusive open; summary hover |
| Menu / inert buttons | Hover background, focus-visible rings from DaisyUI menu/btn |
| `.btn` CTAs | Hover brightness / border transitions from DaisyUI `.btn:hover` |
| Priority `list-row` buttons | Hoverable rows, grid layout intact |
| Charts | Trendchart tooltips/hover on shapes (library default); column/pie/line render with given values |
| Status ping | `.status` with `tw-mc` (`animation: ping`) on security watch |
| Drawer | Overlay + side translate on small screens; persistent open at `lg` |
| Sidebar reveal | Hidden until `data-dashboard-sidebar-ready`; no flash of wrong scroll |
| Focus | Visible focus rings on buttons/inputs (DaisyUI defaults) |

Regressions from link removal are unacceptable: if a hover only applied to `a`, port it to `button` / `.inert-nav` / `.list-row`.

---

## 13. Accessibility notes

- Provide `aria-label` on icon-only controls (sidebar, theme, notifications, profile, account).
- Radial progress: `role="progressbar"` + `aria-valuenow` + `aria-label`.
- Prefer real `<button type="button">` over clickable divs for inert affordances.
- Do not use fake `href="#"` (that still navigates / focuses hash).

---

## 14. Acceptance criteria

The implementation is **done** when all of the following hold:

1. **Pixel/structure parity:** Same section order, copy, numbers, badges, table rows, and chart datasets as this PRD / current local `Dashboard.html`.
2. **No navigation:** Zero `<a>` nav elements; clicking any former link target does not leave the page.
3. **Visual parity:** DaisyUI drawer dashboard with sidebar brand “Pineapple Tech”, 12-column card mosaic, stats strip, primary revenue card, matching spacing/shadows.
4. **Behavior parity:** Theme toggle, three popovers, sidebar accordion + scroll restore, charts mount (`tc-column`×2, `tc-pie`×2, `tc-line`×2), icons load via svg-loader.
5. **File split:** HTML + `./Dashboard.css` + `./Dashboard.js`; CDN deps as specified.
6. **Verify locally:** `python3 -m http.server` from `DaisyUI/`, open `Dashboard.html`, exercise theme, notifications, sidebar groups, and confirm chart rendering.

---

## 15. Out-of-scope polish (do not add)

- Real search filtering, toast systems, or chart drill-down pages
- Additional pages under `products/`, `orders/`, etc.
- Replacing compiled `tw-*` class names with source Tailwind (keep the compiled approach matching the live demo)
)
