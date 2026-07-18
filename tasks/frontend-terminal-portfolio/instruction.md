<summary>
Build a CLI terminal product designer portfolio using React, Zustand, and CSS Modules.
</summary>

<reference_screenshots>
Screenshots of the reference application are provided in-container at
`/reference-screenshots/`: `overview.png` is a full-page desktop-layout
overview (downscaled); `segment-NN.png` are full-resolution 1440x900 sections
in top-to-bottom order with slight overlap. They are part of this instruction:
recreate what they show. Where a screenshot and the text conflict, the text
wins. Do not copy the images into `/app` or ship them as app assets.
</reference_screenshots>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
- A boot sequence prints sequential status lines inside the terminal; pressing Enter (or click/touch) dismisses boot and reveals ASCII name art, a two-column welcome box (capabilities + navigation), and a focused command prompt
- A slash-command shell resolves section commands — /help, /about, /work, /clients, /skills, /philosophy, /social, /articles, /testimonials, /awards, /contact, /clear — echoing each typed command and printing its formatted output block after a short thinking indicator
- Quick-info commands (/email, /phone, /linkedin, /facebook, /instagram, /agency, /location, /privacy) and per-project shortcuts (one slug per seeded project) print their own focused cards
- /help lists commands grouped by section; /skills prints expertise rows whose proficiency bars animate from zero to their target width; /themes lists selectable theme swatches marking the active theme
- The input supports an autocomplete dropdown that filters as you type (Tab/Enter completes), up/down arrow command history, command aliases, bare-word fuzzy matching, and natural-language intent matching that maps a typed phrase to the closest command
- An unknown command prints a visible command-not-found line with a hint rather than failing silently
- Theme switching via /themes, /dark, /light, /retro, /glass swaps session-scoped CSS classes on the document element and recolors the terminal without reloading; running a section command also updates the document title
- Primary collection — projects (case studies): seed at least 6 projects; each has name, slug/shortcut, blurb, status (shipped | wip | archived), and tags; the collection supports create, edit, and delete via shell commands and/or an in-terminal form
- At least two interaction modes: Terminal CLI mode (command prompt + output) and Projects Board mode (list/grid of projects with status/tag filters, reachable via /work board or a mode toggle)
- Domain behavior beyond CRUD: filter projects by status or tag; /work lists the collection; a project shortcut opens that project's detail in the terminal; deleting all projects shows an empty projects state; a cookie-consent banner appears after boot with Accept/Decline recording the choice in memory
- Invalid create: an empty project name must not add a project; show visible validation feedback in the terminal output
- macOS-style window chrome: the red dot closes the terminal to an exit overlay with a Reopen control; yellow minimizes; green maximizes
- Hidden easter-egg commands are supported (for example a Konami key sequence ↑↑↓↓←→←→BA or /konami that fires a confetti canvas burst, and /matrix green-rain canvas); all link-like controls stay inert with no real navigation
</core_features>

<visual_design>
- Full-bleed atmospheric wallpaper behind a centered terminal window with macOS traffic-light titlebar
- JetBrains Mono throughout; CSS variable themes — dark default, light, retro, and glass variants
- CSS Module + CSS variable themes for dark, light, retro, and glass variants
- Projects Board mode uses dense project cards/rows inside the terminal body with status badges
- One terminal-over-wallpaper composition — not a marketing multi-section landing
</visual_design>

<motion>
- Boot: sequential status lines; Enter/click/touch dismisses boot
- Post-boot enter: ASCII art and welcome box fade/slide in; prompt takes focus
- CLI thinking + staggered output reveal for command results; skill bars animate to width
- Mode switch between Terminal CLI and Projects Board updates without full reload
- Hover animations (required): titlebar dots ease opacity on hover; project cards/rows ease border-color and background on hover; autocomplete rows highlight on hover/active; social/close buttons ease on hover
- Easter-egg canvases (confetti burst on the Konami sequence, matrix green-rain on /matrix) animate over the wallpaper for a moment and then clear
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
Stack: React + Zustand + CSS Modules (Vite or equivalent SPA); frontend-only. Styling must use CSS Modules with JetBrains Mono and CSS variable themes — not Tailwind as the primary system, and no MUI/Chakra/Ant Design.
- Seed at least 6 projects so /work and Projects Board are non-empty after boot
- Empty required fields on create must not increase the projects count; show visible validation feedback
- After deleting all projects, show an empty state in Projects Board / /work output
- Zero navigational outbound links; placeholder identity only
- Cookie-consent Accept/Decline must update shared state and must not throw if analytics is absent
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
- Entity fields: title; summary

Mechanics exclusions:
- Terminal typing animation timing stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
