<summary>
Build a user management admin dashboard using Preact, Preact Signals, Tailwind CSS 4.3.2, and DaisyUI.
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
- The app opens into a drawer shell: a branded sidebar (Pineapple Tech) with at least 14 collapsible nav groups — including a Users group containing All Users, Add User, Roles, Permissions, User Logs, User Stats, User Payments, User Products — a top-level Dashboard item, and a sticky account footer (online avatar, name "Ari Lane", role "Admin") whose click opens a popover upward listing Profile settings / Docs / API settings / Logout
- Clicking sidebar items swaps the main canvas between Operations Overview and the Users module views without a full page reload; no backend routes exist, and the active sidebar item reflects the current view
- Expanding a sidebar nav group opens it as an accordion where only one group stays open at a time and its chevron rotates
Feature: Utility header —
- The utility header shows: a search field that filters the All Users list, a light/dark theme toggle that recolors the app, a notifications popover seeded with 4 avatar rows (New message, Reminder, and two New payment entries) plus an error indicator on the bell, and a profile popover listing Profile / Inbox (with badge) / Settings / Logout
Feature: All Users list —
- All Users opens non-empty with at least 8 seeded users; every seeded user is reachable in the table (paging through the pagination chrome counts as reachable), and each row shows name, email, role badge, status badge (Active | Invited | Suspended), payments total, products count, and last-active label
- The All Users view shows a KPI strip (Total / Active / Paying / Suspended) whose numbers track the collection and whose cards each render a small inline trend chart that redraws when its number changes, role and status filters, a sort control (Last active / Newest / Highest spend / Name A-Z), bulk actions (Export / Change status / Change role / Delete) that apply to checkbox-selected rows, a data table (User / Role / Status / Payments / Products / Last active + row actions), and pagination chrome
Feature: Add and edit users —
- The Add User form presents Profile (first name, last name, email, phone, notes), Access (temporary password, account segment, send invitation), Account settings (status, role, 2FA / product-access toggles), and Permissions checkboxes; its submit control stays disabled until every required field is valid, and correcting an invalid field clears that field's inline error without a reload
- Submitting Add User with valid fields adds the user: the new row appears on All Users and counts update
- Choosing a row's Edit action opens the form prefilled with that user's data; saving updates the row everywhere it appears. Choosing Delete removes the user from the list, selection, counts, and filtered views
Feature: Status, role, filters, and bulk actions —
- Changing a user's status or role updates its badge and its filter membership; applying filters or sort recomputes which rows are visible from the shared collection; running a bulk status/role/delete affects every checkbox-selected row
Feature: Additional Users modes —
- At least two additional Users modes from Roles, Permissions, Logs, Stats, Payments, Products open from the Users sidebar group, each rendering its own filters/table
Feature: Operations Overview —
- Operations Overview renders as a distinct view: breadcrumbs (Dashboard › Operations Overview) and header actions (New product / Export / System health), a KPI stats strip (Revenue / Orders / Active users / Support SLA), chart cards (revenue/demand column, order-status pie, revenue run-rate primary inverse column, acquisition mix pie, marketing line, fulfillment line), and operational panels (activity table, governance radial + progress, priority queue, promotions, uptime bars, satisfaction, inventory, plugins, automation, security watch, cash movement). Overview metrics may be seeded; Users stays fully interactive
</core_features>

<user_flows>
- After submitting Add User with valid fields, the All Users table gains exactly one row, the KPI strip Total increases by exactly one and its trend chart redraws, and the pagination total reflects the new count — all without a reload; the same collection backs the other Users modes, so their derived tables reflect the change when opened
- Changing a user's status from Active to Suspended immediately decreases the Active KPI by one and increases the Suspended KPI by one, swaps the row's status badge, and moves the user out of the Active status filter and into the Suspended one without a reload
- Editing a user's role from the row's Edit action updates that row's role badge, its membership under the role filter, and the KPI strip in the same session without a reload
- Deleting a user via the row action or a bulk Delete on checkbox-selected rows removes those rows, decreases Total by the number deleted, drops them from every active filtered view, and clears them from the selection
- Applying the Name A-Z sort orders the visible rows alphabetically by name; switching to Highest spend reorders the same rows by payments total from highest to lowest; switching back to Name A-Z restores the alphabetical order
- Toggling the theme recolors both Operations Overview and the Users views without reloading the document, and the chosen theme persists while switching views within the session
- A page reload returns the app to its seeded state: the seeded users, the default view, cleared filters and selection, and the default theme
</user_flows>

<edge_cases>
- Submitting Add User with empty required fields shows a visible inline validation message naming each offending field and adds no row; the users count stays unchanged
- Cancel on the Add or Edit form leaves the collection unchanged
- Double-activating the Add User submit control creates exactly one user: the count increases by one and one new row appears
- After deleting all users, or when filters match nothing, the list region shows an empty state
- Running a bulk action with no rows checked changes no data (the bulk controls are disabled or act as a no-op)
</edge_cases>

<visual_design>
- Dense ops-dashboard composition: drawer sidebar + view-specific main canvas. Operations Overview uses an asymmetric 12-column metric mosaic (mixed wide/medium/narrow spans, not equal-width stacks) with one primary inverse Revenue run rate spotlight
- Users views use dense admin tables, filter toolbars, KPI stats, badges for role/status, and form layouts for Add/Edit
- Light/dark theme surfaces with a soft radial accent wash on the main canvas
- Chart accent palette (teal / amber / sky / rose / orange) on overview chart cards
- Cards with subtle layered shadows and hairline borders; stats, badges, progress, radial-progress, tables, and list rows for density
- One consistent line-style icon family used across the sidebar, header, and tables; local avatar images; search pill and circular ghost icon buttons in the utility header
</visual_design>

<motion>
- Theme toggle: sun/moon icons cross-fade and rotate (~0.2s) while surfaces and chart accents recolor with the theme
- Popovers (notifications, profile, sidebar account): open anchored to their triggers; enter/exit with short opacity + scale; account menu opens upward; menu rows highlight on hover/focus
- Drawer: on smaller viewports the sidebar slides in with an overlay; on large screens it stays open
- Sidebar accordion: exclusive expand/collapse of nav groups; chevron rotates on open/close; summaries and items take a hover wash
- List microinteractions: a newly created user's row animates into the All Users table, a deleted row animates out, and rows animate to their new positions when a sort or filter change reorders the visible list
- View switches update the main canvas without full page reload; the active sidebar item matches the current view
- Hover animations (required): buttons ease background/border/shadow with a slight press; breadcrumbs underline on hover; table rows, list rows, and sidebar items take a full-width hover wash; form controls show focus rings
- Overview charts support hover/tooltips on seeded series; KPI trend charts redraw when their numbers change; security-watch status dots ping; notification bell keeps a static error indicator
</motion>

<responsiveness>
- Responsive drawer: open by default on large screens; hamburger + overlay drawer on smaller viewports
- At 375 pixel width no content clips and the page shows no horizontal scrolling; wide data tables scroll within their own region instead of overflowing the viewport
</responsiveness>

<accessibility>
- Every interactive control — sidebar items, header controls, table row actions, form fields — is reachable and operable with the keyboard alone, with a visible focus indicator
- Popovers (notifications, profile, sidebar account) close on Escape and return focus to the control that opened them
- Form validation messages are announced through an aria-live polite region as well as shown visually
- Row selection checkboxes and icon-only buttons carry accessible labels
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear during a full exercise of the app
- The UI stays responsive under rapid repeated input (fast filter toggling, quick sort switches) with no hangs or dropped interactions
</performance>

<writing>
- Headings, buttons, and menu items use one consistent capitalization convention throughout the app
- Action labels are specific verbs such as Add user and Export rather than generic labels where a specific one is possible
- Validation messages name the field and the fix; empty states explain what belongs in the region and how to add it; no placeholder text appears in the shipped UI
</writing>

<requirements>
Shared application state must use the stack state library named in summary (in-memory only): the users collection, active view, list filters/sort/selection, theme, and UI chrome. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a valid user increases the collection and shows the new row on All Users; KPIs update
- Editing a user updates that same record everywhere it appears (list, badges, filtered views)
- Deleting a user removes it from the list, selection, and derived counts
- Status and role changes update visible badges and participate in filters
- Filters and sort recompute the visible list from the shared collection; they do not invent a second disconnected copy
- Theme and active view are shared client state; toggling them does not reload the document
Stack: Preact + Preact Signals + Tailwind CSS 4.3.2 (pinned), built with Vite or an equivalent SPA setup. DaisyUI 5 is the component library, used for the drawer, tables, stats, badges, popovers/dropdowns, form controls, and pagination chrome. AutoAnimate allowed for animation (list add/remove/reorder and view microinteractions); no other animation libraries. Chart.js for the overview chart cards and the KPI trend sparklines; no other charting libraries. Heroicons icons only, installed via its npm package — no other icon libraries, no raw pasted SVG icon sets, no icon CDN.
Forms: every form (Add User, Edit User, bulk change dialogs) validates through a Zod schema driven by a form library (React Hook Form via preact/compat, or TanStack Form); the schema defines the rules and the form renders inline per-field errors before submit, with submit disabled until valid.
All libraries installed via npm and bundled locally; no CDN imports. No other external UI, animation, or icon libraries. No backend or authentication.
- Seed at least 8 users so All Users is non-empty on first load; seed overview analytics so Operations Overview is non-empty
- Empty required fields on Create user must not increase the users count; show visible validation feedback
- After deleting all users (or filtering to zero matches), show an empty state in the list region
- Zero navigational outbound links for app chrome — in-app controls only; view changes via shared client state
- Local avatar images; icons come only from the named icon package
- Operations Overview mosaic must stay asymmetric with mixed card spans; Users tables/forms must match DaisyUI admin density
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- browse-query-v1
- entity-collection-v1
- form-workflow-v1

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

Bindings:
- Browsable entity: users
- Destinations: operations-overview; all-users; add-user; roles; permissions; user-logs; user-stats; user-payments; user-products
- Filters: role; status
- Sorts: last-active; newest; highest-spend; name-az
- Themes: light; dark
- Entity: user
- Entity operations: create; select; update; delete
- Entity fields: name; email; role; status; payments; products; last-active
- Form fields: first-name; last-name; email; phone; role; status
- Form operations: validate; submit; cancel

Mechanics exclusions:
- Chart hover/tooltip mechanics stay Playwright-only
- Drawer overlay slide on small viewports stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
