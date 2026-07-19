<summary>
Build a CLI terminal product designer portfolio using Angular, NgRx, and Angular Material.
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
- On load the terminal plays a boot sequence of sequential status lines ending in a "ready" line (e.g. `designer.portfolio v10.0 — ready.`) and a "Press Enter to continue" prompt; pressing Enter, clicking, or touching dismisses boot and reveals the post-boot terminal
- After boot, ASCII name art ("YOUR NAME") renders above a two-column welcome box: the left column shows a greeting, a pixel/ASCII rocket, and a designer subtitle plus a placeholder email line; the right column shows a Capabilities list and a Navigation list of starter commands; the command input then receives focus
- A cookie-consent banner appears after boot offering Accept and Decline; choosing either updates in-memory consent, dismisses the banner, and is reflected when /privacy is run (status reads accepted or declined); choosing must not throw when no analytics library is present
- Typing a slash command echoes the input line and appends staggered output; the shell resolves the section commands /help, /about, /work, /clients, /skills, /philosophy, /social, /articles, /testimonials, /awards, /contact, /privacy, and /clear (which wipes prior output)
- /help lists the available commands grouped by category; /about prints a multi-line generic designer bio; /clients prints a client list; /articles lists published articles grouped by topic; /philosophy prints a design-philosophy statement
- /skills renders labeled skill bars (at least ten named skills) that animate from zero to their target percentage width
- /awards renders inert award rows (at least the reference four: Awwwards, The FWA, CSS Design Awards, CSS Winner); /testimonials renders quote cards with anonymized attributions
- Quick-info commands /linkedin, /facebook, /instagram, /phone, /email, /agency, /location each print their placeholder value inline and never navigate
- Primary collection — projects (case studies): seed at least 6 projects (the reference ships 12 named case studies — Signals, Anylyze, LiveU, TUIASI, ResNet AI, Socyal, App4Home, CyberGhost VPN, CognitiveSEO, Big5 American Diner, Darnic, Crafting Social Stories); each has name, slug/shortcut, blurb, status (shipped | wip | archived), tags, and stat chips; the collection supports create, edit, and delete via shell commands and/or an in-terminal form
- Each seeded project has a slash shortcut (e.g. /signals, /anylyze, /liveu) that prints a project detail block with its type/year, blurb, tags, and stat chips in the terminal
- Autocomplete dropdown suggests matching commands as you type and Tab completes the highlighted one; ↑/↓ arrows walk command history; command aliases (e.g. /portfolio, /projects, /me, /hire, /mail), bare-word fuzzy matches, and natural-language phrases all resolve to the correct command
- Theme switching via /themes (browse list), /dark, /light, /retro, /glass applies a session-scoped theme class on the document root and restyles the terminal without reloading; /retro reads as a CRT look and /glass as translucent glass
- Hidden easter-egg commands work and are discoverable via /secrets (or /easter-eggs): /matrix starts a green matrix-rain canvas, /konami (and the ↑↑↓↓←→←→BA keyboard code) fires a confetti-canvas party, `sudo hire designer` runs a fake-contract progress bar, and extras (/coffee, /figma, whoami, ls, git log, cat readme.md, ping designer, rm -rf doubts) each print themed output
- macOS-style window chrome: red close opens an exit overlay ("kill -9 …" lines, inert LinkedIn/Instagram buttons, and a Reopen terminal control that restores the window); yellow minimize swaps the blurred wallpaper for the sharp one; green maximize expands the terminal window
- Running a section command updates the document title to reflect the active route without rewriting the URL or navigating
- At least two interaction modes: Terminal CLI mode (command prompt + output) and Projects Board mode (list/grid of projects with status/tag filters, reachable via /work board or a mode toggle); switching modes updates the terminal body without a full reload
- Domain behavior beyond CRUD: filter projects by status or tag; /work lists all seeded projects; project shortcuts open detail; deleting every project shows an empty projects state
- Invalid create: an empty project name must not add a project and shows visible validation feedback in the terminal output
- All link-like controls (social rows, email/phone, award rows, close-overlay CTAs) are inert buttons — no real navigation, no new tabs, no mailto/tel
</core_features>

<visual_design>
- Full-bleed atmospheric wallpaper behind a centered terminal window with a macOS traffic-light titlebar reading `designer@portfolio ~ /portfolio`
- JetBrains Mono monospace throughout; CSS variable themes — dark default, light, retro CRT (scanline/glow feel), and translucent glass variants
- Post-boot layout: monospace ASCII name art over a two-column welcome box (left: greeting + pixel/ASCII rocket + subtitle/email; right: Capabilities and Navigation lists)
- Command output area shows echoed prompt lines, headings, skill bars, award/testimonial rows, and project detail blocks with tag and stat chips
- Angular Material for buttons, overlays, snackbars/tooltips, and dense controls where they fit the terminal chrome
- Projects Board mode uses dense project cards/rows inside the terminal body with status badges
- A close overlay reproduces the titlebar (`… ~ /exit`) and shows red exit lines plus inert reconnect CTAs; full-viewport matrix-rain and confetti canvases overlay the page during easter eggs
- One terminal-over-wallpaper composition — not a marketing multi-section landing
</visual_design>

<motion>
- Boot: sequential status lines reveal one after another; Enter/click/touch dismisses boot
- Post-boot enter: ASCII art and welcome box fade/slide in; prompt takes focus
- CLI thinking indicator + staggered output reveal for command results; /skills bars animate from zero to their target width
- Theme switch recolors the terminal instantly without reloading; minimize crossfades the wallpaper from blurred to sharp; maximize expands the window
- /matrix animates a continuous green character-rain canvas; /konami (or the keyboard code) bursts a confetti canvas; `sudo hire designer` advances a progress bar to 100%
- Mode switch between Terminal CLI and Projects Board updates without full reload
- Hover animations (required): titlebar dots ease opacity on hover; project cards/rows ease border-color and background on hover; autocomplete rows highlight on hover/active; social/close buttons ease on hover
- Respect prefers-reduced-motion by disabling staggered/enter and canvas animations where practical
</motion>

<requirements>
Shared application state must use the stack state library named in summary (in-memory only): projects collection, command history, theme class, autocomplete, output buffer, active mode, filters, and cookie-consent choice. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a valid project increases the collection and shows it in /work and Projects Board
- Editing a project updates that same record in board, list output, and detail
- Deleting a project removes it from board, shortcuts, and filters
- Status/tag filters recompute the visible board from the shared collection
- Theme and mode are shared client state; toggling them does not reload the document
- Cookie-consent choice is shared state; /privacy reflects the current accepted/declined/not-set status
Stack: Angular + NgRx + Angular Material (CLI or equivalent SPA); frontend-only. Styling must use Angular Material plus authored theme CSS variables / JetBrains Mono — not Tailwind as the primary system.
- Seed at least 6 projects so /work and Projects Board are non-empty after boot; the reference ships 12 named case studies, each with type, year, blurb, tags, and stat chips
- Empty required fields on create must not increase the projects count; show visible validation feedback
- After deleting all projects, show an empty state in Projects Board / /work output
- Provide at least four themes (dark, light, retro, glass) applied as a session-scoped class on the document root; switching does not reload the document
- Provide the hidden easter-egg commands (at minimum /matrix rain, /konami confetti, and a /secrets listing) as working, discoverable behaviors — not decorative stubs
- Section commands update the document title but must not rewrite the URL or navigate away from the single page
- Zero navigational outbound links; placeholder identity only; all social/email/phone/award/close controls are inert buttons
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
- Entity fields: title; summary; tags

Mechanics exclusions:
- Terminal typing animation timing stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
