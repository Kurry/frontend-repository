<summary>
Build a user-directory admin dashboard using Preact, Preact Signals, Tailwind CSS 4.3.2, and DaisyUI. The app produces the operator's directory artifacts: a Directory JSON document and a Users CSV compiled live from the active users, archive, activity log, KPIs, filters, sort, theme, and active view — downloadable and copyable, reflecting every session mutation.
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
- The app opens into a drawer shell: a branded sidebar (Pineapple Tech) with at least 14 collapsible nav groups — including a Users group containing All Users, Add User, Roles, Permissions, User Logs, User Stats, User Payments, User Products, and Archive — a top-level Dashboard item, and a sticky account footer (online avatar, name Ari Lane, role Admin) whose click opens a popover upward listing Profile settings / Docs / API settings / Logout
- Clicking sidebar items swaps the main canvas between Operations Overview and the Users module views without a full page reload; no backend routes exist, and the active sidebar item reflects the current view
- Expanding a sidebar nav group opens it as an accordion where only one group stays open at a time and its chevron rotates
Feature: Utility header —
- The utility header shows: a search field that filters the All Users list, a light/dark theme toggle that recolors the app, a notifications popover seeded with 4 avatar rows (New message, Reminder, and two New payment entries) plus an error indicator on the bell, a profile popover listing Profile / Inbox (with badge) / Settings / Logout, and a Command palette control
Feature: Command palette —
- Pressing Control+K or Meta+K, or activating the Command palette control, opens a centered elevated overlay with a search field and a scrollable command list
- Choosing All Users, Archive, or Operations Overview closes the palette and switches the main canvas to that view without a reload
- Choosing Export directory closes the palette and opens the export drawer; choosing Toggle theme flips light/dark without a reload; Escape closes the palette and returns focus to the control that opened it
Feature: All Users list —
- All Users opens non-empty with at least 8 seeded users; every seeded user is reachable in the table (paging through the pagination chrome counts as reachable), and each row shows name, email, role badge, status badge (Active | Invited | Suspended), payments total, products count, and last-active label
- The All Users view shows a KPI strip (Total / Active / Paying / Suspended) whose numbers track the collection and whose cards each render a small inline trend chart that redraws when its number changes, role and status filters, a sort control (Last active / Newest / Highest spend / Name A-Z), bulk actions (Export / Change status / Change role / Delete) that apply to checkbox-selected rows, a data table (User / Role / Status / Payments / Products / Last active + row actions Edit / Duplicate / Delete), and pagination chrome
Feature: Add and edit users (API-shaped create/update payload) —
- The Add User and Edit User forms present Profile (firstName, lastName, email, phone, notes), Access (temporaryPassword, accountSegment, send invitation), Account settings (status, role, 2FA / product-access toggles), and Permissions checkboxes
- UserCreate field contract (the form submit IS the would-be request body a directory API would accept; the created record IS that request body; Directory JSON users entries and Users CSV rows use the same field names and enums; all keys required unless marked optional; example values illustrative only):
  - firstName: required trimmed non-empty string, length 1 through 40 inclusive
  - lastName: required trimmed non-empty string, length 1 through 40 inclusive
  - email: required string containing a domain dot after the at-sign (for example name@example.com)
  - phone: optional; when present, digits only with length 7 through 15 inclusive
  - notes: optional; when present, max 280 characters
  - temporaryPassword: required on create only, min 8 characters; optional on edit
  - accountSegment: required closed enum exactly one of Internal, Partner, External
  - role: required closed enum exactly one of Admin, Manager, Member, Viewer
  - status: required closed enum exactly one of Active, Invited, Suspended
  - sendInvitation: optional boolean; when true on create, the new user appears with status Invited unless status was explicitly set
  - twoFactorEnabled: optional boolean
  - productAccess: optional boolean
  - permissions: optional array of closed permission ids drawn only from users.read, users.write, billing.view, products.manage, settings.edit — no free-text permission strings
- Role and status controls on Add/Edit and bulk change only offer those closed enums — no free-text role or status entry
- UserBulkUpdate field contract (bulk Change status / Change role dialogs): required selection of at least one checkbox-selected user; status when provided is exactly one of Active, Invited, Suspended; role when provided is exactly one of Admin, Manager, Member, Viewer; submit disabled until the chosen enum is valid
- Submit stays disabled until every required field is valid; each invalid field shows an inline message naming that field; correcting an invalid field clears that field's inline error without a reload
- Submitting Add User with values that satisfy the field contract adds exactly one user whose stored record matches that request body: the new row appears on All Users, KPI Total increases by one, User Logs gains a create entry for that email, and both export previews include the new user with the same field names
- Choosing a row's Edit action opens the form prefilled with that user's data; saving updates the row everywhere it appears (list, badges, filtered views, User Logs, and export previews)
- Choosing Duplicate on a row opens Add User prefilled from that user's payload with email cleared and status Invited; submitting with a new valid email adds exactly one new Invited row and leaves the source row unchanged
Feature: Archive vault (soft delete) —
- Choosing Delete on a row, or bulk Delete on checkbox-selected rows, archives rather than hard-erasing: those users leave All Users and KPI Total, clear from selection and active filtered views, and appear in Archive with name, email, and a Restore action
- Choosing Restore on an Archive row returns that user to All Users, increases Total by one, and removes the row from Archive without a reload
- After archiving every active user, or when filters match nothing, the All Users list region shows an empty state
Feature: Status, role, filters, and bulk actions —
- Changing a user's status or role updates its badge and its filter membership; applying filters or sort recomputes which rows are visible from the shared collection; running a bulk status/role/delete affects every checkbox-selected row (bulk Export with zero selected still opens the export drawer; bulk Change status/role/Delete with zero selected is disabled or a no-op)
Feature: User Logs —
- User Logs is a live feed derived from the shared store: after creating a user, archiving a user, restoring a user, or changing a user's status or role, new top-of-list entries name those actions and the target user email or display name — not a static seed-only decorative list that ignores mutations
Feature: Additional Users modes —
- At least two additional Users modes from Roles, Permissions, Logs, Stats, Payments, Products open from the Users sidebar group, each rendering its own filters/table
Feature: Operations Overview —
- Operations Overview renders as a distinct view: breadcrumbs (Dashboard › Operations Overview) and header actions (New product / Export / System health), a KPI stats strip (Revenue / Orders / Active users / Support SLA), chart cards (revenue/demand column, order-status pie, revenue run-rate primary inverse column, acquisition mix pie, marketing line, fulfillment line), and operational panels (activity table, governance radial + progress, priority queue, promotions, uptime bars, satisfaction, inventory, plugins, automation, security watch, cash movement). Overview metrics may be seeded; Users stays fully interactive
Feature: Directory export (useful end state) —
- Export directory (from the header, Operations Overview Export, bulk Export, or command palette) opens an export drawer with two format tabs — Directory JSON and Users CSV — each regenerated live from the store whenever users, archive, logs, KPIs, filters, sort, theme, or active view change
- Directory JSON is API-shaped like a directory-service snapshot response — a single object whose field names and values are visible in the preview text and must conform to this field contract:
  - Required schemaVersion: the exact string pineapple-directory-v1
  - Required exportedAt: ISO-8601 timestamp string that updates when the preview regenerates
  - Required users: array of active user objects; each entry requires firstName, lastName, email, role (Admin|Manager|Member|Viewer), status (Active|Invited|Suspended), payments (number greater than or equal to 0), products (non-negative integer), and lastActive (non-empty string); phone, notes, accountSegment, sendInvitation, twoFactorEnabled, productAccess, and permissions optional under the same bounds and closed sets as UserCreate
  - Required archive: array of archived user objects using the same user field rules as users
  - Required activityLog: array of log objects each requiring id (non-empty string), timestamp (ISO-8601), action (non-empty string), and target (non-empty string naming the user email or display name)
  - Required kpis: object requiring total, active, paying, and suspended as non-negative integers matching the All Users KPI strip
  - Required filters: object requiring role and status (each either null or a closed-enum value from the role/status sets)
  - Required sort: exactly one of last-active, newest, highest-spend, name-az
  - Required theme: exactly one of light, dark
  - Required activeView: non-empty string matching the current main-canvas destination
- Users CSV preview starts with the exact header firstName,lastName,email,phone,role,status,payments,products,lastActive and includes one data line per active user; after creating a user with a distinctive firstName, that firstName appears in a CSV data line before copy or download
- Export content that omits session work is invalid: after creating a user with a distinctive email and archiving another user, reopening Export must show the new email under users, the archived user under archive and not under users, and activityLog entries for those mutations, matching the on-screen surfaces
- Each format tab offers Copy (writes that format's exact preview text to the clipboard with visible confirmation) and Download (triggers a real file download whose contents match the previewed text for that format)
Feature: Directory import —
- An Import directory control accepts pasted Directory JSON text or Users CSV text matching the export field contracts (import modes directory-json and users-csv)
- A valid Directory JSON import replaces active users, archive, activity log, KPIs, filters, sort, theme, and active view so All Users, Archive, User Logs, the KPI strip, and both export previews match the imported document
- A valid Users CSV import merges or replaces the active users collection from CSV rows that satisfy the UserCreate field names and enums so All Users and the next Users CSV preview match
- Malformed JSON or CSV, or a document that violates the field contract (schemaVersion not exactly pineapple-directory-v1, missing required keys, role or status outside the closed enums, firstName or lastName outside 1 to 40 characters, email missing a domain dot, temporaryPassword shorter than 8 on a create-shaped row, notes longer than 280, phone outside 7 to 15 digits when present, or negative payments/products/kpi figures), shows an inline error naming the import field (or the payload when unparseable), leaves users count and Archive unchanged, and does not treat the attempt as a successful mutation
</core_features>

<user_flows>
- After submitting Add User with a valid API-shaped payload, the All Users table gains exactly one row, the KPI strip Total increases by exactly one and its trend chart redraws, User Logs gains a create entry for that email, pagination total reflects the new count, and both Directory JSON and Users CSV previews include the new user — all without a reload; the same collection backs the other Users modes
- Changing a user's status from Active to Suspended immediately decreases the Active KPI by one and increases the Suspended KPI by one, swaps the row's status badge, moves the user out of the Active status filter and into the Suspended one, appends a User Logs entry, and updates that user's status in Directory JSON — without a reload
- Editing a user's role from the row's Edit action updates that row's role badge, its membership under the role filter, the KPI strip, User Logs, and Directory JSON role in the same session without a reload
- Archiving a user via the row Delete action, or bulk Delete on checkbox-selected rows, removes those rows from All Users, decreases Total by the number archived, drops them from every active filtered view, clears them from the selection, lists them in Archive, and moves them from Directory JSON users into archive
- Restore flow: after archiving a user, Archive lists that user's name and email with Restore; choosing Restore returns the user to All Users, increases Total by one, removes the row from Archive, and updates both export previews without a reload
- Duplicate flow: Duplicate then submit with a new valid email adds exactly one Invited user, leaves the source unchanged, and keeps All Users, Archive, logs, and exports coherent
- Applying the Name A-Z sort orders the visible rows alphabetically by name; switching to Highest spend reorders the same rows by payments total from highest to lowest; switching back to Name A-Z restores the alphabetical order
- Command palette: open with Control+K or Meta+K, navigate to Archive or Export directory, and continue the workflow — palette closes and the target surface is usable without reload
- Mutation-to-export: create a user with a distinctive email, archive a different user, open Export directory, and confirm Directory JSON shows schemaVersion exactly pineapple-directory-v1, the new email under users, the archived user under archive and not under users, and activityLog entries for those mutations; Users CSV includes the new firstName; Copy and Download are available on the active tab
- Export then import round-trip: after create/edit plus at least one archive, Copy or Download Directory JSON then Import that same text — All Users names/statuses, Archive membership, KPI totals, and both export previews match the pre-export mutated state
- Toggling the theme recolors both Operations Overview and the Users views without reloading the document, and the chosen theme persists while switching views within the session
- A page reload returns the app to its seeded state: the seeded users, empty Archive, the default view, cleared filters and selection, the default theme, and closed export/import/command-palette surfaces
</user_flows>

<edge_cases>
- Submitting Add User with empty required fields, firstName longer than 40 characters, an email missing a domain dot, a temporaryPassword shorter than 8 characters, notes longer than 280 characters, phone with fewer than 7 digits, or a permission id outside the closed permissions set shows a visible inline validation message naming each offending field and adds no row; the users count stays unchanged
- Cancel on the Add or Edit form leaves the active users count, names, and Archive unchanged
- Double-activating the Add User submit control creates exactly one user: the count increases by one and one new row appears
- After archiving all users, or when filters match nothing, the list region shows an empty state
- Running bulk Change status/role/Delete with no rows checked changes no data (disabled or no-op); bulk Export with zero selected still opens the export drawer
- Importing malformed Directory JSON or Users CSV, or a document that breaks the field contract, shows an inline error naming the import field, leaves users count and Archive unchanged, and does not update export previews as if a successful import occurred
- Create, archive, restore, export copy, and import show visible success or confirmation feedback
</edge_cases>

<visual_design>
- Dense ops-dashboard composition: drawer sidebar + view-specific main canvas. Operations Overview uses an asymmetric 12-column metric mosaic (mixed wide/medium/narrow spans, not equal-width stacks) with one primary inverse Revenue run rate spotlight
- Users views use dense admin tables, filter toolbars, KPI stats, badges for role/status, and form layouts for Add/Edit
- Light/dark theme surfaces with a soft radial accent wash on the main canvas
- Chart accent palette (teal / amber / sky / rose / orange) on overview chart cards
- Cards with subtle layered shadows and hairline borders; stats, badges, progress, radial-progress, tables, and list rows for density
- One consistent line-style icon family used across the sidebar, header, and tables; local avatar images; search pill and circular ghost icon buttons in the utility header
- The export drawer shows Directory JSON and Users CSV tabs with a monospaced preview and Copy/Download actions; the command palette is a centered elevated overlay with a search field and scrollable command list; Archive rows use a quieter muted treatment distinct from active rows
</visual_design>

<motion>
- Theme toggle: sun/moon icons cross-fade and rotate (~0.2s) while surfaces and chart accents recolor with the theme
- Popovers (notifications, profile, sidebar account): open anchored to their triggers; enter/exit with short opacity + scale; account menu opens upward; menu rows highlight on hover/focus
- Drawer: on smaller viewports the sidebar slides in with an overlay; on large screens it stays open
- Sidebar accordion: exclusive expand/collapse of nav groups; chevron rotates on open/close; summaries and items take a hover wash
- List microinteractions: a newly created or restored user's row animates into the All Users table, an archived row animates out, and rows animate to their new positions when a sort or filter change reorders the visible list
- View switches update the main canvas without full page reload; the active sidebar item matches the current view
- Hover animations (required): buttons ease background/border/shadow with a slight press; breadcrumbs underline on hover; table rows, list rows, and sidebar items take a full-width hover wash; form controls show focus rings
- Overview charts support hover/tooltips on seeded series; KPI trend charts redraw when their numbers change; security-watch status dots ping; notification bell keeps a static error indicator
- Export drawer slides in from the side rather than snapping open; command palette enters and exits with short opacity/scale when opened through the real UI controls
</motion>

<responsiveness>
- Responsive drawer: open by default on large screens; hamburger + overlay drawer on smaller viewports
- At 375 pixel width no content clips and the page shows no horizontal scrolling; wide data tables scroll within their own region instead of overflowing the viewport
- At 375 pixel width the export drawer, command palette, Archive view, Add User form, and All Users KPI strip stay fully visible and operable rather than rendering off-screen or overlapping unreadable
</responsiveness>

<accessibility>
- Every interactive control — sidebar items, header controls, table row actions, form fields, command palette, export drawer controls, and Archive Restore — is reachable and operable with the keyboard alone, with a visible focus indicator
- Popovers, the command palette, and the export drawer close on Escape and return focus to the control that opened them; while open, the command palette and export drawer trap focus within their surfaces
- Form validation messages are announced through an aria-live polite region as well as shown visually
- Create, archive, restore, export copy, and import completion are announced through an aria-live region as well as shown visually
- Row selection checkboxes and icon-only buttons carry accessible labels
- Status and role badges convey state with text labels in addition to color; Add/Edit form fields have visible labels associated with their controls
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear during a full exercise of the app, including view switches, create/edit/archive/restore, filters, sort, bulk actions, command palette, export drawer, and theme toggle
- The UI stays responsive under rapid repeated input (fast filter toggling, quick sort switches, repeated command palette open/close, export tab switches) with no hangs or dropped interactions
- Opening the export drawer and switching between Directory JSON and Users CSV regenerates the preview without freezing the UI; creating or archiving a user redraws KPI trend charts without multi-second freezes
</performance>

<writing>
- Headings, buttons, and menu items use one consistent capitalization convention throughout the app
- Action labels are specific verbs such as Add user, Export directory, Restore, Duplicate, and Copy rather than generic labels where a specific one is possible
- Validation and import errors name the field and the fix (for example firstName length or email format); empty states for All Users or Archive explain what belongs in the region and how to add or restore it; no placeholder text appears in the shipped UI
- Export drawer tabs read Directory JSON and Users CSV; the command palette heading or search label uses Command palette
- Confirmation messages after create, archive, restore, copy, or import state what happened rather than vague affirmations
</writing>

<innovation>
- Optional: a structured export summary strip above the preview naming active and archived user counts
- Optional: a visible keyboard shortcut hint chip for Control+K or Meta+K in the header or palette
- Optional: a compact last-mutation chip in the header or toolbar that echoes the newest User Logs entry
- Optional: export Copy feedback that includes an extra polished microinteraction beyond a bare copied state
</innovation>

<requirements>
Shared application state must use the stack state library named in summary (in-memory only): the users collection, archive, activity log, active view, list filters/sort/selection, theme, export preview text, import draft, command palette open state, and UI chrome. Do not use localStorage, sessionStorage, or other browser storage APIs. Persistence for this genre is the exportable Directory JSON / Users CSV plus the MCP query surface.
State contracts (behavioral, not storage keys):
- Creating a valid user increases the collection and shows the new row on All Users; KPIs, User Logs, and both export previews update
- Editing a user updates that same record everywhere it appears (list, badges, filtered views, logs, export)
- Archiving a user removes it from All Users, selection, and derived counts and places it in Archive; Restore reverses that move
- Status and role changes update visible badges and participate in filters
- Filters and sort recompute the visible list from the shared collection; they do not invent a second disconnected copy
- Directory JSON and Users CSV compile live from the same store the UI renders; a successful import mutates that same store
- Theme and active view are shared client state; toggling them does not reload the document
Stack: Preact + Preact Signals + Tailwind CSS 4.3.2 (pinned), built with Vite or an equivalent SPA setup. DaisyUI 5 is the component library, used for the drawer, tables, stats, badges, popovers/dropdowns, form controls, and pagination chrome. AutoAnimate allowed for animation (list add/remove/reorder and view microinteractions); no other animation libraries. Chart.js for the overview chart cards and the KPI trend sparklines; no other charting libraries. Heroicons icons only, installed via its npm package — no other icon libraries, no raw pasted SVG icon sets, no icon CDN.
Forms: every form (Add User, Edit User, bulk change dialogs, and the import surface) validates through a Zod schema driven by a form library (React Hook Form via preact/compat, or TanStack Form); the schema defines the UserCreate, UserBulkUpdate, and Directory JSON / Users CSV field contracts above and the form renders inline per-field errors before submit, with submit disabled until valid. The record a successful Add User creates is exactly that UserCreate request body; Directory JSON export, Users CSV export, and a successful import conform to the same field names, enums, and bounds.
All libraries installed via npm and bundled locally; no CDN imports. No other external UI, animation, or icon libraries. No backend or authentication.
- Seed at least 8 users so All Users is non-empty on first load; seed overview analytics so Operations Overview is non-empty
- Empty required fields or field-contract violations on Create user must not increase the users count; show visible validation feedback
- After archiving all users (or filtering to zero matches), show an empty state in the list region
- Directory JSON and Users CSV export must be compiled live from the current store; after any session mutation that changes users, archive, logs, or KPIs, reopening Export directory must include that mutation
- Zero navigational outbound links for app chrome — in-app controls only; view changes via shared client state
- Local avatar images; icons come only from the named icon package
- Operations Overview mosaic must stay asymmetric with mixed card spans; Users tables/forms must match DaisyUI admin density
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- browse-query-v1
- entity-collection-v1
- form-workflow-v1
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

<module_spec id="form-workflow-v1">
{
  "id": "form-workflow-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Form workflow",
  "purpose": "Forms, setup flows, authentication shells, and multi-step workflows.",
  "permitted_operations": ["validate", "submit", "cancel", "reset", "advance", "return"],
  "binding_keys": {
    "required_any_of": [["form_fields"], ["form_operations"]],
    "optional": ["workflow_steps", "value_bounds", "visible_postconditions"]
  },
  "restrictions": [
    "Declared fields only.",
    "Normal validation and visible errors remain active.",
    "Cannot manufacture authentication or bypass guarded routes.",
    "Backend-free apps must surface honest unavailable state through product handlers."
  ],
  "tool_name_prefix": "form"
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
- Destinations: operations-overview; all-users; add-user; roles; permissions; user-logs; user-stats; user-payments; user-products; archive-vault; export-drawer
- Filters: role; status
- Sorts: last-active; newest; highest-spend; name-az
- Themes: light; dark
- Entity: user
- Entity operations: create; select; update; delete; toggle
- Entity fields: name; email; role; status; payments; products; last-active
- Form fields: first-name; last-name; email; phone; role; status; temporary-password; account-segment; notes
- Form operations: validate; submit; cancel
- Value bounds: first-name 1-40; last-name 1-40; temporary-password min-8; phone 7-15-digits; notes max-280; role Admin|Manager|Member|Viewer; status Active|Invited|Suspended; account-segment Internal|Partner|External
- Artifact operations: export; import; copy
- Export formats: json; csv
- Import modes: directory-json; users-csv

Mechanics exclusions:
- Chart hover/tooltip mechanics stay Playwright-only
- Drawer overlay slide on small viewports stays Playwright-observed
- Command palette open/close scale animation stays Playwright-observed
- Raw file paths/blobs forbidden in WebMCP args
- Clipboard and downloaded artifact contents remain Playwright responsibilities

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
