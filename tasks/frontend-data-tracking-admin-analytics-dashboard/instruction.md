<summary>
Build a commerce operations admin analytics dashboard using React with Next.js static-export delivery, Redux Toolkit, Tailwind CSS 4.3.2, and DaisyUI. The app produces the operator's session artifacts: a Session JSON document and a Users CSV compiled live from the active users, KPIs, filters, sort, theme, and active view — downloadable and copyable, reflecting every session mutation.
</summary>

<reference_screenshots>
Screenshots of the reference application are provided in-container at
/reference-screenshots/: overview.png is a full-page desktop-layout
overview (downscaled); segment-NN.png are full-resolution 1440x900 sections
in top-to-bottom order with slight overlap. They are part of this instruction:
recreate what they show. Where a screenshot and the text conflict, the text
wins. Do not copy the images into /app or ship them as app assets.
</reference_screenshots>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
Feature: Drawer shell and navigation —
- The app opens into a drawer shell: a branded sidebar (Pineapple Tech) with at least 14 collapsible nav groups — including a Users group containing All Users, Add User, Roles, Permissions, User Logs, User Stats, User Payments, User Products — a top-level Dashboard item, and a sticky account footer (online avatar, name, role) whose click opens a popover upward
- Clicking sidebar items swaps the main canvas between Operations Overview and the Users module views without a full page reload; no backend routes exist
Feature: Utility header —
- The utility header shows: a search field that filters the All Users list, a light/dark theme toggle that recolors the app, a notifications popover seeded with 4 avatar rows plus an error indicator on the bell, and a profile popover listing Profile / Inbox (with badge) / Settings / Logout
Feature: All Users list —
- All Users opens non-empty with at least 8 seeded users; every seeded user is reachable in the table (paging through the pagination chrome counts as reachable), and each row shows name, email, role badge, status badge (Active | Invited | Suspended), payments total, products count, and last-active label
- The All Users view shows a KPI strip (Total / Active / Paying / Suspended) whose numbers track the collection, role and status filters, a sort control (Last active / Newest / Highest spend / Name A-Z), bulk actions (Export / Change status / Change role / Delete) that apply to checkbox-selected rows, a data table (User / Role / Status / Payments / Products / Last active + row actions), and pagination chrome
Feature: Add and edit users (API-shaped create/update payload) —
- The Add User and Edit User forms present grouped fields — Profile (firstName, lastName, email, phone, notes), Access (temporaryPassword, accountSegment, send invitation), Account settings (status, role, 2FA / product-access toggles), Permissions checkboxes
- UserCreate field contract (the form submit IS the would-be request body a directory API would accept; Session JSON users entries and Users CSV rows use the same field names and enums; all keys required unless marked optional; example values illustrative only):
  - firstName: required trimmed non-empty string, length 1 through 40 inclusive
  - lastName: required trimmed non-empty string, length 1 through 40 inclusive
  - email: required string containing a domain dot after the at-sign (for example name@example.com)
  - phone: optional; when present, digits only with length 7 through 15 inclusive
  - notes: optional; when present, max 280 characters
  - temporaryPassword: required on create only, min 8 characters; optional on edit
  - accountSegment: required closed enum exactly one of Internal, Partner, External
  - role: required closed enum exactly one of Admin, Manager, Member, Viewer
  - status: required closed enum exactly one of Active, Invited, Suspended
- Role and status controls on Add/Edit and bulk change only offer those closed enums — no free-text role or status entry
- Each invalid field shows a per-field message naming that field before submit, and the submit control stays disabled until required fields are valid; correcting an invalid field clears that field's inline error without a reload
- Submitting Add User with values that satisfy the field contract adds exactly one user: the new row appears on All Users, KPI Total increases by one, and both export previews include the new user
- Choosing a row's Edit action opens the form prefilled with that user's data; saving updates the row everywhere it appears (list, badges, filtered views, and export previews)
- Choosing Delete removes the user from the table, selection, KPI counts, and both export previews in the same interaction
Feature: Status, role, filters, and bulk actions —
- Changing a user's status or role updates its badge immediately; applying filters or sort recomputes which rows are visible from the shared collection; running a bulk status/role/delete affects every checkbox-selected row (bulk Export with zero selected still opens the export drawer; bulk Change status/role/Delete with zero selected is disabled or a no-op)
Feature: Additional Users modes —
- At least two additional Users modes from Roles, Permissions, Logs, Stats, Payments, Products open from the Users sidebar group, each rendering its own filters/table
Feature: Operations Overview —
- Operations Overview renders as a distinct view: breadcrumbs and actions, KPI stats, chart cards (revenue/demand column, order-status pie, revenue run-rate primary inverse column, acquisition mix pie, marketing line, fulfillment line), and operational panels (activity table, governance radial + progress, priority queue, promotions, uptime bars, satisfaction, inventory, plugins, automation, security watch, cash movement). Overview metrics may be seeded; Users stays fully interactive
- Overview chart cards render from their seeded series: hovering a column, slice, or line point shows a tooltip with the underlying value, and toggling the theme redraws every chart in the new theme's accent colors without a reload
Feature: Session export (useful end state) —
- Export session (from the header, Operations Overview Export, or bulk Export) opens an export drawer with two format tabs — Session JSON and Users CSV — each regenerated live from the store whenever users, KPIs, filters, sort, theme, or active view change
- Session JSON is API-shaped like an admin-analytics session snapshot response — a single object whose field names and values are visible in the preview text and must conform to this field contract:
  - Required schemaVersion: the exact string pineapple-admin-analytics-v1
  - Required exportedAt: ISO-8601 timestamp string that updates when the preview regenerates
  - Required users: array of user objects; each entry requires firstName, lastName, email, role (Admin|Manager|Member|Viewer), status (Active|Invited|Suspended), payments (number greater than or equal to 0), products (non-negative integer), and lastActive (non-empty string); phone and notes optional under the same bounds as UserCreate
  - Required kpis: object requiring total, active, paying, and suspended as non-negative integers matching the All Users KPI strip
  - Required filters: object requiring role and status (each either null or a closed-enum value from the role/status sets)
  - Required sort: exactly one of last-active, newest, highest-spend, name-az
  - Required theme: exactly one of light, dark
  - Required activeView: non-empty string matching the current main-canvas destination
- Users CSV preview starts with the exact header firstName,lastName,email,phone,role,status,payments,products,lastActive and includes one data line per user; after creating a user with a distinctive firstName, that firstName appears in a CSV data line before copy or download
- Export content that omits session work is invalid: after creating a user with a distinctive email and deleting another user, reopening Export must show the new email under users, omit the deleted user, and match the on-screen KPI strip
- Each format tab offers Copy (writes that format's exact preview text to the clipboard with visible confirmation) and Download (triggers a real file download whose contents match the previewed text for that format)
Feature: Session import —
- An Import session control accepts pasted Session JSON text or Users CSV text matching the export field contracts (import modes session-json and users-csv)
- A valid Session JSON import replaces users, KPIs, filters, sort, theme, and active view so All Users, the KPI strip, and both export previews match the imported document
- A valid Users CSV import merges or replaces the users collection from CSV rows that satisfy the UserCreate field names and enums so All Users and the next Users CSV preview match
- Malformed JSON or CSV, or a document that violates the field contract (schemaVersion not exactly pineapple-admin-analytics-v1, missing required keys, role or status outside the closed enums, firstName or lastName outside 1 to 40 characters, email missing a domain dot, temporaryPassword shorter than 8 on a create-shaped row, notes longer than 280, phone outside 7 to 15 digits when present, or negative payments/products/kpi figures), shows an inline error naming the import field (or the payload when unparseable), leaves users count unchanged, and does not treat the attempt as a successful mutation
</core_features>

<user_flows>
- Creating a user end to end: submitting Add User with a valid API-shaped payload adds exactly one row to All Users, increases the KPI Total by one and the matching status KPI by one, typing the new user's name into the header search narrows the table to that row, and both Session JSON and Users CSV previews include the new user — all without a reload
- Editing a user: saving the Edit form updates that user's name, badges, and values in the table row, in the KPI strip, in every filtered view where the user appears, and in both export previews, without a reload
- Deleting a user removes it from the table, from any checkbox selection, from the KPI counts, and from both export previews in the same interaction; the visible row count decreases by exactly one
- Changing a user's status from Active to Suspended flips its status badge, moves the KPI strip (Active down by one, Suspended up by one), removes the row from the Active status-filter results, and updates that user's status in Session JSON without a reload
- Switching the sort control between two options (for example Newest and Name A-Z) reorders the same rows without changing the visible count; switching back restores the prior order
- Selecting three rows by checkbox and running a bulk Change status updates all three badges and shifts the KPI counts by three in one action
- Mutation-to-export: create a user with a distinctive email, delete a different user, open Export session, and confirm Session JSON shows schemaVersion exactly pineapple-admin-analytics-v1, the new email under users, the deleted user absent, and kpis matching the on-screen strip; Users CSV includes the new firstName; Copy and Download are available on the active tab
- Export then import round-trip: after create/edit plus at least one delete, Copy or Download Session JSON then Import that same text — All Users names/statuses, KPI totals, and both export previews match the pre-export mutated state
- A page reload returns the app to its seeded state: at least 8 seeded users, the default theme, and the default view
</user_flows>

<edge_cases>
- Submitting Add User with empty required fields, firstName longer than 40 characters, an email missing a domain dot, a temporaryPassword shorter than 8 characters, notes longer than 280 characters, or phone with fewer than 7 digits shows visible per-field validation messages naming each offending field and adds no row; the users count is unchanged
- Cancel on Add User or Edit leaves the collection unchanged
- Double-activating the Add User submit control creates exactly one user: the count increases by one and one new row appears
- After deleting all users, or when filters and search match nothing, the list region shows an empty state message instead of an empty table
- Running bulk Change status/role/Delete with no rows checked changes no data (disabled or no-op); bulk Export with zero selected still opens the export drawer
- Importing malformed Session JSON or Users CSV, or a document that breaks the field contract, shows an inline error naming the import field, leaves users count unchanged, and does not update export previews as if a successful import occurred
- Create, delete, export copy, and import show visible success or confirmation feedback
</edge_cases>

<visual_design>
- Dense ops-dashboard composition: drawer sidebar + view-specific main canvas. Operations Overview uses an asymmetric 12-column metric mosaic (mixed wide/medium/narrow spans, not equal-width stacks) with one primary inverse Revenue run rate spotlight
- Users views use dense admin tables, filter toolbars, KPI stats, badges for role/status, and form layouts for Add/Edit
- Light/dark theme surfaces with a soft radial accent wash on the main canvas
- Chart accent palette (teal / amber / sky / rose / orange) on overview chart cards
- Cards with subtle layered shadows and hairline borders; stats, badges, progress, radial-progress, tables, and list rows for density
- One consistent icon set used throughout the chrome, with local avatar images; search pill and circular ghost icon buttons in the utility header
- The export drawer shows Session JSON and Users CSV tabs with a monospaced preview and Copy/Download actions
</visual_design>

<motion>
- Theme toggle: sun/moon icons cross-fade and rotate (~0.2s) while surfaces and chart accents recolor with the theme
- Popovers (notifications, profile, sidebar account): open anchored to their triggers; enter/exit with short opacity + scale; account menu opens upward; menu rows highlight on hover/focus
- Drawer: on smaller viewports the sidebar slides in with an overlay; on large screens it stays open
- Sidebar accordion: exclusive expand/collapse of nav groups; chevron rotates on open/close; summaries and items take a hover wash
- View switches update the main canvas without full page reload; the active sidebar item matches the current view
- List microinteractions: a newly created user's row animates into the table, a deleted row animates out, and changing the sort animates rows to their new positions rather than snapping
- Feedback toasts after create, delete, and bulk actions slide in, remain readable, and auto-dismiss with a fade
- Hover animations (required): buttons ease background/border/shadow with a slight press; breadcrumbs underline on hover; table rows, list rows, and sidebar items take a full-width hover wash; form controls show focus rings
- Overview charts support hover/tooltips on seeded series; security-watch status dots ping; notification bell keeps a static error indicator
- Export drawer slides in from the side rather than snapping open when opened through the real UI controls
</motion>

<responsiveness>
- Drawer open by default on large screens; at smaller viewports the sidebar collapses to a hamburger control that opens an overlay drawer
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; dense tables scroll within their own containers
- At 375 pixel width the export drawer, Add User form, and All Users KPI strip stay fully visible and operable rather than rendering off-screen or overlapping unreadable
</responsiveness>

<accessibility>
- Every interactive control — sidebar items, header controls, table row actions, form fields, pagination, and export drawer controls — is reachable and operable with the keyboard alone, with a visible focus indicator
- Popovers and the export drawer close on Escape and return focus to the control that opened them; while open, the export drawer traps focus within its surface
- Add/Edit form fields have visible labels, and validation messages are associated with their fields so each message names the field it belongs to
- Form validation messages and create, delete, export copy, and import completion are announced through an aria-live polite region as well as shown visually
- Row selection checkboxes and icon-only buttons carry accessible labels
- Status and role badges convey state with text labels in addition to color
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors, warnings, or hydration mismatch messages appear on load or during a full exercise of the app
- After first paint there is no post-hydration content flash: the rendered shell does not visibly re-render or shift as the app becomes interactive
- Loading the served URL directly always renders the full dashboard shell; the UI stays responsive under rapid repeated input with no hangs
- Opening the export drawer and switching between Session JSON and Users CSV regenerates the preview without freezing the UI
</performance>

<writing>
- Headings, buttons, and menu items use one consistent capitalization convention throughout the app
- Action labels are specific verbs (Add user, Change status, Export session, Copy) rather than generic labels where a specific one is possible
- Validation and import errors name the field and the fix (for example firstName length or email format); empty states explain what belongs in the region and how to add it; no placeholder text appears anywhere in the shipped UI
- Export drawer tabs read Session JSON and Users CSV
- Confirmation messages after create, delete, copy, or import state what happened rather than vague affirmations
</writing>

<innovation>
- Optional: a structured export summary strip above the preview naming user count and KPI Total
- Optional: a compact last-mutation chip in the header or toolbar that echoes the newest create, delete, or status change
- Optional: export Copy feedback that includes an extra polished microinteraction beyond a bare copied state
- Optional: a live field-contract checklist beside Add User that lights each rule as the payload becomes valid
</innovation>

<requirements>
Shared application state must live in Redux Toolkit (in-memory only): the users collection, active view, list filters/sort/selection, theme, export preview text, import draft, and UI chrome. Do not use localStorage, sessionStorage, or other browser storage APIs. Persistence for this genre is the exportable Session JSON / Users CSV plus the MCP query surface.
State contracts (behavioral, not storage keys):
- Creating a valid user increases the collection and shows the new row on All Users; KPIs and both export previews update
- Editing a user updates that same record everywhere it appears (list, badges, filtered views, export)
- Deleting a user removes it from the list, selection, derived counts, and export previews
- Status and role changes update visible badges and participate in filters
- Filters and sort recompute the visible list from the shared collection; they do not invent a second disconnected copy
- Session JSON and Users CSV compile live from the same store the UI renders; a successful import mutates that same store
- Theme and active view are shared client state; toggling them does not reload the document
Build tooling: Next.js with static export (or SSR with client hydration); all interactivity lives in client state after load — no server actions, API routes, or data loaders. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer. DaisyUI is the component library for the drawer, tables, badges, stats, popovers/dropdowns, form controls, pagination, and toasts; no other component library. Motion for React and AutoAnimate allowed for animation; no other animation libraries. Heroicons only, installed via its npm package — no raw copy-pasted SVG icon sets. All forms — Add User, Edit User, bulk change dialogs, Import session, and any filter/settings forms — are driven by React Hook Form validating through a Zod schema: the schema defines the UserCreate and Session JSON / Users CSV field contracts above, inline per-field errors render before submit, a successful create record IS the would-be request body, and export/import validate through the same schemas. End-state contract: Download JSON / Download CSV / Copy MUST emit the session's actual users and KPIs — an export that omits session work is invalid; Import MUST restore the same visible users and KPIs (round-trip). @weblogin/trendchart-elements for the overview charts; TanStack Table for the users data table (sorting/filtering/pagination). All libraries installed via npm and bundled locally; no CDN imports. No backend or authentication.
- Seed at least 8 users so All Users is non-empty on first load; seed overview analytics so Operations Overview is non-empty
- Empty required fields or field-contract violations on Create user must not increase the users count; show visible validation feedback
- After deleting all users (or filtering to zero matches), show an empty state in the list region
- Session JSON and Users CSV export must be compiled live from the current store; after any session mutation that changes users or KPIs, reopening Export session must include that mutation
- Zero navigational outbound links for app chrome — in-app controls only; view changes via shared client state
- Icon set and avatar images bundled locally
- Responsive drawer: open by default on large screens; hamburger + overlay on smaller viewports
- Operations Overview mosaic must stay asymmetric with mixed card spans; Users tables/forms must match a dense admin register
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
- Self-test tooling is preinstalled: the same CDP bridge the verifier runs is baked at `/opt/webmcp/webmcp_stdio_server.mjs`, and a shared headless Chrome already exposes CDP at `http://127.0.0.1:9222`. Open your served app in that Chrome, then run `node /opt/webmcp/webmcp_stdio_server.mjs` (stdio MCP; defaults to that endpoint) to exercise your registered `window.webmcp_*` tools exactly as the verifier will.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- browse-query-v1
- entity-collection-v1
- artifact-transfer-v1

Module specs:
<module_spec id="browse-query-v1">
{
  "id": "browse-query-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Browse / query",
  "purpose": "Content sites, catalogs, feeds, dashboards, and navigation.",
  "permitted_operations": ["open", "search", "apply_filter", "clear_filter", "sort", "set_locale", "set_theme"],
  "binding_keys": {
    "required_any_of": [["destinations"]],
    "optional": ["browsable_entity", "filters", "sorts", "locales", "themes", "visible_postconditions"]
  },
  "restrictions": [
    "No arbitrary URL, selector, or undeclared route.",
    "Destinations and filters come from bounded PRD declarations.",
    "Visible navigation state must update via the same handlers as UI controls."
  ],
  "tool_name_prefix": "browse"
}
</module_spec>

<module_spec id="entity-collection-v1">
{
  "id": "entity-collection-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Entity collection",
  "purpose": "Carts, records, favorites, calendar events, list items, and local entities.",
  "permitted_operations": ["create", "select", "update", "delete", "toggle", "quantity", "reorder"],
  "binding_keys": {
    "required_any_of": [["entity"], ["entity_operations"]],
    "optional": ["entity_fields", "value_bounds", "visible_postconditions"]
  },
  "restrictions": [
    "Closed entity and field enums only.",
    "Bounded string and numeric values.",
    "No generic state setter or arbitrary patch object.",
    "Invokes the same domain command used by the visible control.",
    "Delete requires explicit confirm=true.",
    "Reorder only when gesture mechanics are not being evaluated."
  ],
  "tool_name_prefix": "entity"
}
</module_spec>

<module_spec id="artifact-transfer-v1">
{
  "id": "artifact-transfer-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Artifact transfer",
  "purpose": "Import, export, copy, print, and conversion workflows.",
  "permitted_operations": ["import", "export", "copy", "print_preview", "convert"],
  "binding_keys": {
    "required_any_of": [["artifact_operations"]],
    "optional": ["import_modes", "export_formats", "conversion_modes", "visible_postconditions"]
  },
  "restrictions": [
    "No raw files, filesystem paths, blobs, base64, or artifact contents in WebMCP arguments or results.",
    "File picker interaction, clipboard contents, and downloaded artifacts remain Playwright responsibilities."
  ],
  "tool_name_prefix": "artifact"
}
</module_spec>

Bindings:
- Browsable entity: users
- Destinations: operations-overview; all-users; add-user; roles; permissions; user-logs; user-stats; user-payments; user-products; export-drawer
- Filters: role; status
- Sorts: last-active; newest; highest-spend; name-az
- Themes: light; dark
- Entity: user
- Entity operations: create; select; update; delete
- Entity fields: name; email; role; status; payments; products; last-active
- Artifact operations: export; import; copy
- Export formats: json; csv
- Import modes: session-json; users-csv

Mechanics exclusions:
- Chart hover tooling stays Playwright-observed
- Raw file paths/blobs forbidden in WebMCP args
- Clipboard and downloaded artifact contents remain Playwright responsibilities

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
