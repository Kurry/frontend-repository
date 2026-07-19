<summary>
Build a CLI terminal product designer portfolio using Preact, Preact Signals, Tailwind CSS 4.3.2, and DaisyUI.
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
Feature: Boot and shell —
- A boot sequence prints sequential status lines inside the terminal; pressing Enter (or click/touch) dismisses boot and reveals ASCII name art, a two-column welcome box (capabilities + navigation), and a focused command prompt
- A slash-command shell resolves section commands — /help, /about, /work, /clients, /skills, /philosophy, /social, /articles, /testimonials, /awards, /contact, /clear — echoing each typed command and printing its formatted output block after a short thinking indicator
- Quick-info commands (/email, /phone, /linkedin, /facebook, /instagram, /agency, /location, /privacy) and per-project shortcuts (one slug per seeded project) print their own focused cards
- /help lists commands grouped by section; /skills prints expertise rows whose proficiency bars animate from zero to their target width; /themes lists selectable theme swatches marking the active theme
- The input supports an autocomplete dropdown that filters as you type (Tab/Enter completes), up/down arrow command history, command aliases, bare-word fuzzy matching, and natural-language intent matching that maps a typed phrase to the closest command
Feature: Themes and modes —
- Theme switching via /themes, /dark, /light, /retro, /glass swaps session-scoped theme classes on the document element and recolors the terminal without reloading; running a section command also updates the document title
- At least two interaction modes: Terminal CLI mode (command prompt + output) and Projects Board mode (list/grid of projects with status/tag filters, reachable via /work board or a mode toggle)
Feature: Projects collection —
- Primary collection — projects (case studies): seed at least 6 projects; each has name, slug/shortcut, blurb, status (shipped | wip | archived), and tags; the collection supports create, edit, and delete via shell commands and/or an in-terminal form
- The project create and edit form validates per field before submit: an inline message names each invalid field, and the submit control stays disabled or inert until all required fields are valid
- Domain behavior beyond CRUD: filter projects by status or tag; /work lists the collection; a project shortcut opens that project's detail in the terminal
Feature: Window chrome and extras —
- macOS-style window chrome: the red dot closes the terminal to an exit overlay with a Reopen control; yellow minimizes; green maximizes
- A cookie-consent banner appears after boot with Accept/Decline recording the choice in memory
- Hidden easter-egg commands are supported (for example a Konami key sequence ↑↑↓↓←→←→BA or /konami that fires a confetti canvas burst, and /matrix green-rain canvas); all link-like controls stay inert with no real navigation
</core_features>

<user_flows>
- Create flow: submitting a valid new project through the in-terminal create path adds exactly one project — the /work listing count increases by one, a new card with the correct status badge appears in Projects Board, and a new per-project shortcut command resolves to the new project's detail card, all without a reload; reloading the page returns the app to its seeded projects only
- Edit flow: renaming a seeded project updates that same record everywhere it appears — the Projects Board card, the /work listing row, the project's detail card, and its autocomplete entry — without a reload
- Delete flow: deleting a project removes its card from Projects Board, drops the /work listing count by exactly one, and makes its former shortcut print a command-not-found line; deleting every project shows the empty projects state in both Projects Board and /work output
- Filter flow: applying a status or tag filter in Projects Board narrows the visible cards to matching projects; clearing the filter restores the full collection exactly; a project created while a matching filter is active appears in the filtered view immediately
- Theme and mode flow: running /retro recolors the terminal, /themes then marks retro as the active swatch, and switching to Projects Board and back keeps the retro theme applied — no step reloads the document
</user_flows>

<edge_cases>
- An unknown command prints a visible command-not-found line with a hint rather than failing silently
- Invalid create: an empty project name must not add a project; show visible validation feedback in the terminal output naming the field
- Double-activating the create submit adds exactly one project: the collection count increases by one and one new card appears
- After deleting all projects, Projects Board and /work output show an empty state with a message and a way to create a project
- Closing the terminal with the red dot and pressing Reopen restores the terminal with its output history and theme intact
- Pressing the up arrow before any command has been typed leaves the prompt unchanged with no errors
</edge_cases>

<visual_design>
- Full-bleed atmospheric wallpaper behind a centered terminal window with macOS traffic-light titlebar
- JetBrains Mono throughout, bundled with the app
- Four visual themes — dark (default), light, retro, and glass — each recolors the terminal background, text, accents, and chrome consistently from shared design tokens
- Projects Board mode uses dense project cards/rows inside the terminal body with status badges
- A single consistent icon style across social cards, window controls, and board badges
- One terminal-over-wallpaper composition — not a marketing multi-section landing
</visual_design>

<motion>
- Boot: sequential status lines print with a typewriter cadence; Enter/click/touch dismisses boot
- Post-boot enter: ASCII art and welcome box fade/slide in; prompt takes focus
- CLI thinking + staggered output reveal for command results; skill bars animate to width
- Creating a project animates its new card into the Projects Board; deleting a project animates its card out
- Validation and confirmation feedback lines appear with a brief fade rather than popping in
- Mode switch between Terminal CLI and Projects Board updates without full reload
- Hover animations (required): titlebar dots ease opacity on hover; project cards/rows ease border-color and background on hover; autocomplete rows highlight on hover/active; social/close buttons ease on hover
- Easter-egg canvases (confetti burst on the Konami sequence, matrix green-rain on /matrix) animate over the wallpaper for a moment and then clear
- Respect prefers-reduced-motion by disabling staggered/enter animations where practical
</motion>

<responsiveness>
- At widths of 768 pixels and below the terminal window expands to nearly the full viewport width and the two-column welcome box stacks into one column
- At 375 pixel width no content clips or overflows the viewport, no horizontal scrolling appears, and the command input remains visible and usable
- Projects Board reduces its card grid to a single column at narrow widths without losing status badges or filters
</responsiveness>

<accessibility>
- After boot the command prompt receives focus; every interactive control (traffic lights, mode toggle, filters, board cards, consent buttons) is reachable and operable with the keyboard alone with a visible focus indicator
- New command output is announced through an aria-live polite region as it is appended
- The autocomplete dropdown is navigable with up/down arrows, Enter or Tab selects the highlighted entry, and Escape closes it without changing the input
- The traffic-light window controls carry accessible labels describing close, minimize, and maximize
- Terminal text keeps readable contrast against the background in all four themes
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear during a full exercise of the app
- Rapid typing and quickly issued back-to-back commands stay responsive with no dropped characters or hangs
</performance>

<writing>
- /help command descriptions are specific to what each command prints, not generic filler
- Headings, command output labels, and button text use one consistent capitalization convention
- Error and validation messages name the problem and the fix; empty states explain what belongs there and how to add it; no lorem or placeholder filler text appears anywhere in the shipped UI
- Portfolio copy (about, philosophy, testimonials, project blurbs) reads as coherent original content for a fictional designer identity
</writing>

<requirements>
Shared application state must use Preact Signals (in-memory only): projects collection, command history, theme, autocomplete state, output buffer, active mode, filters, and cookie-consent choice. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a valid project increases the collection and shows it in /work and Projects Board
- Editing a project updates that same record in board, list output, and detail
- Deleting a project removes it from board, shortcuts, and filters
- Status/tag filters recompute the visible board from the shared collection
- Theme and mode are shared client state; toggling them does not reload the document
Stack: Preact + Preact Signals (Vite or equivalent SPA); frontend-only. Styling: Tailwind CSS 4.3.2 (pinned) with the theme design tokens defined in @theme; the dark, light, retro, and glass themes are token swaps on the document element. DaisyUI is the sole component library, used for the chrome: consent banner, badges, cards, buttons, and menus. GSAP allowed for animation (boot typewriter, staggered output reveal, skill bars); no other animation libraries. Tabler icons via the Iconify Tailwind plugin only; no other icon sets and no raw pasted SVGs. All forms (project create and edit) validate through a schema (Zod or Valibot) rendered by a form library with inline per-field errors before submit. JetBrains Mono is bundled locally via npm. All libraries installed via npm and bundled locally; no CDN imports. No MUI/Chakra/Ant Design.
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
- Browsable entity: projects
- Destinations: terminal-home; project-detail; about; config-studio; export-center; profiles
- Filters: status; tag; featured
- Sorts: name-asc; name-desc
- Themes: dark; light; retro; glass
- Entity: project
- Entity operations: create; select; update; delete; toggle
- Entity fields: title; summary; slug; status; tags; year; featured
- Artifact operations: export; import; copy
- Export formats: json; config; css
- Import modes: declared-portfolio

Mechanics exclusions:
- Terminal typing animation timing stays Playwright-observed
- Raw file paths/blobs forbidden in WebMCP args
- Export download bytes and clipboard contents stay Playwright-only per artifact-transfer restrictions

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
