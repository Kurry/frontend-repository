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
- A slash-command shell resolves section commands — /help, /about, /work, /clients, /skills, /philosophy, /social, /articles, /testimonials, /awards, /contact, /clear, /export, /import, /config, /profiles, /undo, /redo — echoing each typed command and printing its formatted output block after a short thinking indicator
- Quick-info commands (/email, /phone, /linkedin, /facebook, /instagram, /agency, /location, /privacy) and per-project shortcuts (one slug per seeded project) print their own focused cards
- /help lists commands grouped by section; /skills prints expertise rows whose proficiency bars animate from zero to their target width; /themes lists selectable theme swatches marking the active theme
- The input supports an autocomplete dropdown that filters as you type (Tab/Enter completes), up/down arrow command history, command aliases, bare-word fuzzy matching, and natural-language intent matching that maps a typed phrase to the closest command

Feature: Themes and modes —
- Theme switching via /themes, /dark, /light, /retro, /glass swaps session-scoped theme classes on the document element and recolors the terminal without reloading; running a section command also updates the document title
- At least three interaction modes switchable without full page navigation: Terminal CLI mode (command prompt + output), Projects Board mode (list/grid of projects with status/tag/featured filters and name sort, reachable via /work board or a mode toggle), and Config Studio mode (identity, skills, featured pins, profiles, and Config Diff, reachable via /config or a mode toggle)

Feature: Projects collection (API-shaped Project record) —
- Primary collection — projects (case studies): seed at least 6 projects; the collection supports create, edit, delete, and duplicate via shell commands and/or an in-terminal form
- Project field contract (the record create/edit produces IS the would-be request body; Export Portfolio JSON and Import use this same shape for each projects[] element; all keys required unless marked optional; example values illustrative only): name (required string, 1 to 80 characters), slug (required string, 1 to 48 characters, lowercase letters digits and hyphens only — pattern ^[a-z0-9]+(?:-[a-z0-9]+)*$; must be unique among projects), summary (required string, 1 to 280 characters), status (required closed enum exactly one of shipped, wip, archived), tags (required array of 0 to 5 strings; each tag 1 to 24 characters), year (required integer from 2000 to 2100 inclusive), featured (required boolean). Cross-field: at most 3 projects may have featured true at once; featuring a fourth is rejected with a featured-limit message naming the featured field; duplicate must copy name with a " (copy)" suffix, keep status/tags/summary/year, set featured false, and assign a unique slug
- The project create and edit form validates every field against the Project field contract before submit: an inline message names each invalid field and its rule (empty name, uppercase slug, status outside the closed enum, year outside 2000 to 2100, more than 5 tags), and the submit control stays disabled or inert until all required fields are valid
- Domain behavior beyond CRUD: filter projects by status, tag, or featured; sort the board by name A to Z or Z to A (switching directions reverses visible order); /work lists the collection; a project shortcut opens that project's detail; multi-select checkboxes enable Batch featured and Batch delete (Batch featured toggles featured on all selected under the three-featured cap; Batch delete with confirm removes exactly the selected cards and drops them from export previews)

Feature: Config Studio —
- Config Studio edits designer identity and skills against API-shaped contracts. Identity field contract (save IS the would-be request body; mirrored under Portfolio JSON identity and Terminal Config key = value lines): displayName (required string, 1 to 60 characters), email (required string matching a visible email pattern with @ and a dot in the domain), location (required string, 1 to 80 characters), tagline (optional string, 0 to 120 characters). Saving a valid identity updates /about and /email output and the identity fields in Portfolio JSON and Terminal Config without a reload
- Skill field contract (create/edit IS the would-be request body; mirrored in Portfolio JSON skills[]): name (required string, 1 to 40 characters, unique among skills), proficiency (required integer from 0 to 100 inclusive). Creating or editing a skill with proficiency 72 adds or updates a /skills bar that reaches that width and appears with proficiency 72 in the Portfolio JSON skills array
- Config Diff marks changed identity, projects, skills, theme, and featured pins versus the seeded baseline with a distinct changed treatment; with no mutations it shows an explicit no-differences state
- Named shell profiles: Profile field contract (save IS the would-be request body; mirrored in Portfolio JSON profiles[]): name (required string, 1 to 40 characters, unique among profiles), theme (required closed enum exactly one of dark, light, retro, glass), featuredSlugs (required array of project slugs currently featured, length 0 to 3). Saving a named profile with a non-default theme and at least one featured project, then changing theme and clearing featured pins, then applying that profile restores theme, featured pins, and matching export preview values; an empty profile name creates no profile and shows validation naming the name field

Feature: Undo and redo —
- Undo and Redo controls (and /undo, /redo) step through structural mutations (create, edit, delete, duplicate, batch delete, featured toggle, identity/skill/profile saves); after deleting a project via the UI path, Undo restores that project card, shortcut, prior visible count, and its entry in the Portfolio JSON export preview; after Undo, performing a new create clears the redo stack so Redo is disabled; Undo with an empty history and Redo with an empty redo stack are disabled and produce no console errors

Feature: Export Center and import (useful end-state artifacts) —
- The app produces the user's portfolio files: Export Center (via /export or an Export control) offers three live-compiled monospaced format tabs — Portfolio JSON, Terminal Config, and Theme CSS — regenerated from the current store on every open and after every mutation; each tab has Copy (writes the visible preview text to the clipboard with a brief copied confirmation) and Download (starts a file download of that same preview text: portfolio.json, terminal.config, or theme.css)
- PortfolioDocument field contract (Copy, Download JSON, and Import declared-portfolio all conform to this same shape; field names and enum values are visible in the JSON preview text; all keys and nesting required unless marked optional; example values illustrative only): schemaVersion (required string exactly 1.0), identity (required object matching the Identity field contract), theme (required closed enum exactly one of dark, light, retro, glass), consent (required closed enum exactly one of not_set, accepted, declined), projects (required array of Project records matching the Project field contract), skills (required array of Skill records matching the Skill field contract), featuredSlugs (required array of strings — the slugs of projects with featured true, length 0 to 3, each slug must exist in projects), profiles (required array of Profile records matching the Profile field contract; may be empty). Cross-field: featuredSlugs must equal the set of projects where featured is true; consent must match the cookie-consent choice (/privacy reads the same value). An export that omits a session create, edit, delete, duplicate, featured toggle, batch action, identity save, skill edit, or theme change is invalid
- Terminal Config preview starts with the comment line # terminal-portfolio config and shows key = value lines for theme, display_name, email, location, and featured (comma-separated featured slugs)
- Theme CSS preview shows a :root[data-theme=...] custom-properties block for the active theme with background, text, accent, and chrome token declarations
- Import (via /import or an Import control, mode declared-portfolio) accepts pasted or loaded Portfolio JSON; a conforming document replaces the collection so visible project names, statuses, tags, years, featured flags, skills, and identity match the imported payload and all three export tabs match that imported state; exporting then re-importing reconstructs the same visible state
- Import rejects non-conforming payloads without mutating state: malformed JSON, missing required schemaVersion/identity/theme/consent/projects/skills/featuredSlugs/profiles keys, schemaVersion not exactly 1.0, a project status outside shipped|wip|archived, year outside 2000 to 2100, featuredSlugs longer than 3 or referencing missing slugs, or skill proficiency outside 0 to 100 shows a visible validation message naming the offending field and leaves /work and the board unchanged

Feature: Window chrome and extras —
- macOS-style window chrome: the red dot closes the terminal to an exit overlay with a Reopen control; yellow minimizes; green maximizes
- A cookie-consent banner appears after boot with Accept/Decline recording the choice in memory; /privacy and Portfolio JSON consent reflect not_set before any choice and accepted or declined after
- Hidden easter-egg commands are supported (for example a Konami key sequence ↑↑↓↓←→←→BA or /konami that fires a confetti canvas burst, and /matrix green-rain canvas); all link-like controls stay inert with no real navigation
</core_features>

<user_flows>
- Create flow: submitting a valid new project through the in-terminal create path adds exactly one project — the /work listing count increases by one, a new card with the correct status badge appears in Projects Board, a new per-project shortcut command resolves to the new project's detail card, and the project name appears in the Portfolio JSON export preview, all without a reload; reloading the page returns the app to its seeded projects only
- Edit flow: renaming a seeded project updates that same record everywhere it appears — the Projects Board card, the /work listing row, the project's detail card, its autocomplete entry, and the export previews — without a reload
- Delete flow: deleting a project removes its card from Projects Board, drops the /work listing count by exactly one, makes its former shortcut print a command-not-found line, and removes its name from Portfolio JSON and Terminal Config previews
- Filter and sort flow: applying a status, tag, or featured filter in Projects Board narrows the visible cards to matching projects; clearing the filter restores the full collection exactly; switching name sort A to Z versus Z to A reverses order; a project created while a matching filter is active appears in the filtered view immediately
- Theme and mode flow: running /retro recolors the terminal, /themes then marks retro as the active swatch, switching through Projects Board and Config Studio keeps the retro theme applied, and Theme CSS export shows the retro data-theme block — no step reloads the document
- Export then import round-trip: create a project named Northline Atlas with valid required fields, confirm Portfolio JSON contains Northline Atlas and schemaVersion 1.0, Copy the JSON, delete Northline Atlas, Import that payload, and confirm Northline Atlas returns on the board and in /work with the same status, tags, and year
- Undo round-trip: delete a project via the UI, confirm it is gone from board and export, Undo once to restore card, shortcut, and export entry, then perform a new create and confirm Redo is disabled
- Config Studio flow: saving a valid new displayName and email updates /about and /email plus identity fields in Portfolio JSON and Terminal Config; creating a skill with proficiency 72 updates /skills and the Portfolio JSON skills array
- Featured and profile flow: featuring two projects shows them in featuredSlugs; Batch delete of two selected projects removes exactly those two; Save profile then change theme and re-apply restores the saved theme and featured pins
</user_flows>

<edge_cases>
- An unknown command prints a visible command-not-found line with a hint rather than failing silently
- Invalid create: an empty project name, an uppercase slug, or year 1999 or 2101 must not add a project; show visible validation feedback naming the field and the contract rule
- Double-activating the create submit adds exactly one project: the collection count increases by one and one new card appears
- After deleting all projects, Projects Board and /work output show an empty state with a message and a way to create a project
- Closing the terminal with the red dot and pressing Reopen restores the terminal with its output history and theme intact
- Pressing the up arrow before any command has been typed leaves the prompt unchanged with no errors
- Featuring a fourth project while three are already featured shows a featured-limit message and does not set the fourth flag
- Importing malformed Portfolio JSON shows a visible validation message naming the problem, changes no projects, and leaves /work and the board unchanged
- Saving a profile with an empty name creates no profile and shows validation naming the name field
- Undo with an empty history and Redo with an empty redo stack are disabled; activating them does nothing and produces no console errors
- Config Diff with no session mutations shows a no-differences state rather than a blank or broken panel
</edge_cases>

<visual_design>
- Full-bleed atmospheric wallpaper behind a centered terminal window with macOS traffic-light titlebar
- JetBrains Mono throughout, bundled with the app
- Four visual themes — dark (default), light, retro, and glass — each recolors the terminal background, text, accents, and chrome consistently from shared design tokens
- Projects Board mode uses dense project cards/rows inside the terminal body with status badges and a featured indicator when featured
- Config Studio shows a dense identity form, skills list with proficiency controls, featured pin summary, Profiles list, and Config Diff inside the terminal body rather than a separate marketing layout
- Export Center presents Portfolio JSON, Terminal Config, and Theme CSS as monospaced preview tabs with Copy and Download affordances inside the terminal composition
- A single consistent icon style across social cards, window controls, and board badges
- One terminal-over-wallpaper composition — not a marketing multi-section landing
</visual_design>

<motion>
- Boot: sequential status lines print with a typewriter cadence; Enter/click/touch dismisses boot
- Post-boot enter: ASCII art and welcome box fade/slide in; prompt takes focus
- CLI thinking + staggered output reveal for command results; skill bars animate to width
- Creating a project animates its new card into the Projects Board; deleting a project animates its card out
- Validation and confirmation feedback lines appear with a brief fade rather than popping in
- Mode switch among Terminal CLI, Projects Board, and Config Studio updates without full reload
- Export Center and Config Studio enter with a short opacity transition rather than appearing instantly
- Hover animations (required): titlebar dots ease opacity on hover; project cards/rows ease border-color and background on hover; autocomplete rows highlight on hover/active; social/close buttons ease on hover
- Easter-egg canvases (confetti burst on the Konami sequence, matrix green-rain on /matrix) animate over the wallpaper for a moment and then clear
- Respect prefers-reduced-motion by disabling staggered/enter animations where practical
</motion>

<responsiveness>
- At widths of 768 pixels and below the terminal window expands to nearly the full viewport width and the two-column welcome box stacks into one column
- At 375 pixel width no content clips or overflows the viewport, no horizontal scrolling appears, and the command input remains visible and usable
- Projects Board reduces its card grid to a single column at narrow widths without losing status badges or filters
- Export Center tabs and Config Studio forms stay fully visible and operable at 375 pixel width rather than rendering off-screen
</responsiveness>

<accessibility>
- After boot the command prompt receives focus; every interactive control (traffic lights, mode toggle, filters, board cards, selection checkboxes, batch actions, featured toggles, consent buttons, undo/redo, export Copy/Download, Config Studio fields) is reachable and operable with the keyboard alone with a visible focus indicator
- New command output is announced through an aria-live polite region as it is appended
- The autocomplete dropdown is navigable with up/down arrows, Enter or Tab selects the highlighted entry, and Escape closes it without changing the input
- The traffic-light window controls carry accessible labels describing close, minimize, and maximize
- Form and export validation messages are exposed through a polite live region as well as shown visually
- Featured indicators and status badges are conveyed by text or icon plus color, never color alone
- Terminal text keeps readable contrast against the background in all four themes
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear during a full exercise of the app including create/edit/delete, batch featured/delete, undo/redo, Config Studio, export/import, profiles, theme and mode switches, and cookie consent
- Rapid typing and quickly issued back-to-back commands stay responsive with no dropped characters or hangs
- Export preview recompiles promptly after project or identity mutations with no multi-second freeze of the shell or dropped prompt input
</performance>

<writing>
- /help command descriptions are specific to what each command prints, not generic filler
- Headings, command output labels, and button text use one consistent capitalization convention
- Error and validation messages name the problem and the fix including the field contract rule when validation fails (for example allowed slug pattern, year bounds, status enum, featured limit, or schemaVersion); empty states explain what belongs there and how to add it; no lorem or placeholder filler text appears anywhere in the shipped UI
- Export Center tab labels read Portfolio JSON, Terminal Config, and Theme CSS rather than generic Tab 1 / Export
- Portfolio copy (about, philosophy, testimonials, project blurbs) reads as coherent original content for a fictional designer identity
</writing>

<innovation>
Optional enhancements the builder may add, none required for a passing build: richer natural-language intent matching; denser Konami/matrix canvas craft; a brief boot narrative beat beyond status lines; numeric or tier readouts on /skills bars; reverse-search or recent-command chips in history/autocomplete; session-only personalization of last mode without browser storage; cohesive glass/retro craft beyond a bare token swap; Config Diff side-by-side changed treatments; Terminal Config and Theme CSS that read as drop-in interoperable artifacts.
</innovation>

<requirements>
Shared application state must use Preact Signals (in-memory only): projects collection, skills, identity, profiles, featured pins, command history, undo/redo stacks, theme, autocomplete state, output buffer, active mode, filters, sort, multi-selection, export preview derivations, Config Diff, and cookie-consent choice. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a valid project increases the collection and shows it in /work, Projects Board, and Portfolio JSON
- Editing a project updates that same record in board, list output, detail, and export
- Deleting a project removes it from board, shortcuts, filters, and export
- Status/tag/featured filters and name sort recompute the visible board from the shared collection
- Theme and mode are shared client state; toggling them does not reload the document
- Undo and redo operate on the same shared state the visible controls mutate; export previews regenerate from that state
- Cookie-consent choice is shared state; /privacy and Portfolio JSON consent reflect not_set, accepted, or declined
Stack: Preact + Preact Signals (Vite or equivalent SPA); frontend-only. Styling: Tailwind CSS 4.3.2 (pinned) with the theme design tokens defined in @theme; the dark, light, retro, and glass themes are token swaps on the document element. DaisyUI is the sole component library, used for the chrome: consent banner, badges, cards, buttons, and menus. GSAP allowed for animation (boot typewriter, staggered output reveal, skill bars); no other animation libraries. Tabler icons via the Iconify Tailwind plugin only; no other icon sets and no raw pasted SVGs. All forms (project create and edit, identity save, skill create/edit, profile save, and Import paste when presented as a form) validate through a schema (Zod or Valibot) rendered by a form library with inline per-field errors before submit. Schemas are API-shaped: they model the payloads a real portfolio/config API would accept — the Project, Identity, Skill, Profile, and PortfolioDocument field contracts above — the record a form creates IS the would-be request body, and Export/Import validate through the same schemas. JetBrains Mono is bundled locally via npm. All libraries installed via npm and bundled locally; no CDN imports. No MUI/Chakra/Ant Design.
- Seed at least 6 projects so /work and Projects Board are non-empty after boot
- Empty required fields or out-of-contract values on create must not increase the projects count; show visible validation feedback
- After deleting all projects, show an empty state in Projects Board / /work output
- The exportable end state is the Portfolio JSON (plus Terminal Config and Theme CSS companions) compiled live from the session; PortfolioDocument must conform to the declared field contract, and an export that omits session mutations or fails the contract is invalid; Import must restore the same visible state (round-trip)
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
