<summary>
Build a user management admin dashboard using React, Zustand, and Tailwind CSS.
</summary>

<core_features>
Core features:
- Drawer shell with branded sidebar (Pineapple Tech), collapsible nav groups (at least 14 groups including Users with All Users, Add User, Roles, Permissions, User Logs, User Stats, User Payments, User Products), top-level Dashboard item, and sticky account footer (online avatar, name, role) with upward popover
- In-app view switching with no backend routes: sidebar items change the main canvas between Operations Overview and the Users module views
- Utility header with search (can filter the All Users list), light/dark theme toggle, notifications popover (4 seeded avatar rows + error indicator on the bell), and profile popover (Profile / Inbox with badge / Settings / Logout)
- Primary collection — Users: seed at least 8 users; each has name, email, role, status (Active | Invited | Suspended), payments total, products count, and last-active label; the list supports create, edit, and delete
- All Users view: KPI strip (Total / Active / Paying / Suspended), role filter, status filter, sort (Last active / Newest / Highest spend / Name A-Z), bulk actions (Export / Change status / Change role / Delete), data table (User / Role / Status / Payments / Products / Last active + row actions), and pagination chrome
- Add User view: form with Profile (first name, last name, email, phone, notes), Access (temporary password, account segment, send invitation), Account settings (status, role, 2FA / product-access toggles), and Permissions checkboxes; Cancel and Create user; invalid create does not add a row; successful create appears on All Users
- Edit and delete from All Users: edit opens prefilled fields and save updates that row; delete removes the user from the list and from counts/filters
- Domain behavior beyond CRUD: status badges (Active / Invited / Suspended), role changes, filters and sort that change which rows are visible, bulk status/role/delete on selected rows, empty list when filters match nothing or when all users are deleted
- At least two additional Users modes from: User Roles, User Permissions, User Logs, User Stats, User Payments, User Products (each with filters/tables), reachable from the Users sidebar
- Operations Overview as a distinct view: breadcrumbs and actions; KPI stats; chart cards (revenue/demand column, order-status pie, revenue run-rate primary inverse column, acquisition mix pie, marketing line, fulfillment line); operational panels (activity table, governance radial + progress, priority queue, promotions, uptime bars, satisfaction, inventory, plugins, automation, security watch, cash movement). Overview metrics may be seeded; Users remain fully interactive
- Zero outbound navigation — in-app controls only (no backend auth)
</core_features>

<visual_design>
- Dense ops-dashboard composition: drawer sidebar + view-specific main canvas. Operations Overview uses an asymmetric 12-column metric mosaic (mixed wide/medium/narrow spans, not equal-width stacks) with one primary inverse Revenue run rate spotlight
- Users views use dense admin tables, filter toolbars, KPI stats, badges for role/status, and form layouts for Add/Edit
- Light/dark theme surfaces with a soft radial accent wash on the main canvas
- Chart accent palette (teal / amber / sky / rose / orange) on overview chart cards
- Cards with subtle layered shadows and hairline borders; stats, badges, progress, radial-progress, tables, and list rows for density
- Local Heroicons-style SVGs and avatar images; search pill and circular ghost icon buttons in the utility header
- Responsive: drawer open by default on large screens; hamburger + overlay drawer on smaller viewports
</visual_design>

<motion>
- Theme toggle: sun/moon icons cross-fade and rotate (~0.2s) while surfaces and chart accents recolor with the theme
- Popovers (notifications, profile, sidebar account): open anchored to their triggers; enter/exit with short opacity + scale; account menu opens upward; menu rows highlight on hover/focus
- Drawer: on smaller viewports the sidebar slides in with an overlay; on large screens it stays open
- Sidebar accordion: exclusive expand/collapse of nav groups; chevron rotates on open/close; summaries and items take a hover wash
- View switches update the main canvas without full page reload; the active sidebar item matches the current view
- Hover animations (required): buttons ease background/border/shadow with a slight press; breadcrumbs underline on hover; table rows, list rows, and sidebar items take a full-width hover wash; form controls show focus rings
- Overview charts support hover/tooltips on seeded series; security-watch status dots ping; notification bell keeps a static error indicator
</motion>

<requirements>
Shared application state must use the stack state library named in summary (in-memory only): the users collection, active view, list filters/sort/selection, theme, and UI chrome. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a valid user increases the collection and shows the new row on All Users; KPIs update
- Editing a user updates that same record everywhere it appears (list, badges, filtered views)
- Deleting a user removes it from the list, selection, and derived counts
- Status and role changes update visible badges and participate in filters
- Filters and sort recompute the visible list from the shared collection; they do not invent a second disconnected copy
- Theme and active view are shared client state; toggling them does not reload the document
Stack: React + Zustand + Tailwind CSS (Vite or equivalent SPA). DaisyUI 5 allowed on Tailwind. @weblogin/trendchart-elements (or equivalent) allowed for overview charts. No other external component libraries. No backend or authentication.
- Seed at least 8 users so All Users is non-empty on first load; seed overview analytics so Operations Overview is non-empty
- Empty required fields on Create user must not increase the users count; show visible validation feedback
- After deleting all users (or filtering to zero matches), show an empty state in the list region
- Zero navigational outbound links for app chrome — in-app controls only; view changes via shared client state
- Local icons and avatar images
- Responsive drawer: open by default on large screens; hamburger + overlay on smaller viewports
- Operations Overview mosaic must stay asymmetric with mixed card spans; Users tables/forms must match DaisyUI admin density
</requirements>

## Delivery and integrity

- Integrity: work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
- Delivery: produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; run `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- WebMCP: required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.

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
