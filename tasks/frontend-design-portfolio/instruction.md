<summary>
Build a CLI terminal product designer portfolio using Angular, NgRx, and Angular Material.
</summary>

<core_features>
Core features:
- Boot sequence inside the terminal that yields, after Enter/click/touch, to ASCII name art, a two-column welcome box, and a live command prompt
- Slash-command shell for portfolio sections: /help, /about, /work, /clients, /skills, /philosophy, /social, /articles, /testimonials, /awards, /contact, /clear, plus quick-info and per-project shortcuts
- Autocomplete dropdown, up/down command history, aliases, bare-word fuzzy match, and natural-language intent matching to commands
- Theme switching via /themes, /dark, /light, /retro, /glass (session-scoped CSS classes on documentElement)
- Primary collection — projects (case studies): seed at least 6 projects; each has name, slug/shortcut, blurb, status (shipped | wip | archived), and tags; the collection supports create, edit, and delete via shell commands and/or an in-terminal form
- At least two interaction modes: Terminal CLI mode (command prompt + output) and Projects Board mode (list/grid of projects with filters, reachable via /work board or a mode toggle)
- Domain behavior beyond CRUD: filter projects by status or tag; run /work to list; project shortcuts open detail in the terminal; empty projects state; cookie-consent Accept/Decline in memory
- Invalid create: empty project name must not add a project; show visible validation feedback in the terminal output
- macOS-style window chrome: red close → exit overlay with reopen; yellow minimize; green maximize
- Hidden easter-egg commands and canvas effects allowed; inert link-like controls only — no real navigation
</core_features>

<visual_design>
- Full-bleed atmospheric wallpaper behind a centered terminal window with macOS traffic-light titlebar
- JetBrains Mono throughout; CSS variable themes — dark default, light, retro, and glass variants
- Angular Material for buttons, overlays, snackbars/tooltips, and dense controls where they fit the terminal chrome
- Projects Board mode uses dense project cards/rows inside the terminal body with status badges
- One terminal-over-wallpaper composition — not a marketing multi-section landing
</visual_design>

<motion>
- Boot: sequential status lines; Enter/click/touch dismisses boot
- Post-boot enter: ASCII art and welcome box fade/slide in; prompt takes focus
- CLI thinking + staggered output reveal for command results; skill bars animate to width
- Mode switch between Terminal CLI and Projects Board updates without full reload
- Hover animations (required): titlebar dots ease opacity on hover; project cards/rows ease border-color and background on hover; autocomplete rows highlight on hover/active; social/close buttons ease on hover
- Respect prefers-reduced-motion by disabling staggered/enter animations where practical
</motion>

<requirements>
Shared application state must use the stack state library named in summary (in-memory only): projects collection, command history, theme class, autocomplete, output buffer, active mode, filters, and cookie-consent choice. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a valid project increases the collection and shows it in /work and Projects Board
- Editing a project updates that same record in board, list output, and detail
- Deleting a project removes it from board, shortcuts, and filters
- Status/tag filters recompute the visible board from the shared collection
- Theme and mode are shared client state; toggling them does not reload the document
Stack: Angular + NgRx + Angular Material (CLI or equivalent SPA); frontend-only. Styling must use Angular Material plus authored theme CSS variables / JetBrains Mono — not Tailwind as the primary system.
- Seed at least 6 projects so /work and Projects Board are non-empty after boot
- Empty required fields on create must not increase the projects count; show visible validation feedback
- After deleting all projects, show an empty state in Projects Board / /work output
- Zero navigational outbound links; placeholder identity only
- Cookie-consent Accept/Decline must update shared state and must not throw if analytics is absent
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

Bindings:
- Browsable entity: projects
- Destinations: terminal-home; project-detail; about
- Entity: project
- Entity operations: create; select; update; delete
- Entity fields: title; summary; tags

Mechanics exclusions:
- Terminal typing animation timing stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
