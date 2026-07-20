<summary>
Build a CLI terminal product designer portfolio using Angular, NgRx, Tailwind CSS 4.3.2, and Angular Material.
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
- On load the terminal plays a boot sequence of sequential status lines ending in a ready line such as "designer.portfolio v10.0 — ready." and a "Press Enter to continue" prompt; pressing Enter, clicking, or touching dismisses boot and reveals the post-boot terminal
- After boot, ASCII name art ("YOUR NAME") renders above a two-column welcome box: the left column shows a greeting, a pixel/ASCII rocket, and a designer subtitle plus a placeholder email line; the right column shows a Capabilities list and a Navigation list of starter commands; the command input then receives focus
- A cookie-consent banner appears after boot offering Accept and Decline; choosing either updates in-memory consent, dismisses the banner, and is reflected when /privacy is run (status reads accepted or declined); choosing must not throw when no analytics library is present; Portfolio JSON export consent matches /privacy
- Typing a slash command echoes the input line and appends staggered output; the shell resolves the section commands /help, /about, /work, /clients, /skills, /philosophy, /social, /articles, /testimonials, /awards, /contact, /privacy, /stats, /export, /import, /archive, /undo, /redo, and /clear (which wipes prior output)
- /help lists the available commands grouped by category including section, project, theme, export, archive, undo, and utility commands; /about prints a multi-line generic designer bio; /clients prints a client list; /articles lists published articles grouped by topic; /philosophy prints a design-philosophy statement
- /skills renders labeled skill bars (at least ten named skills) that animate from zero to their target percentage width
- /awards renders inert award rows (at least the reference four: Awwwards, The FWA, CSS Design Awards, CSS Winner); /testimonials renders quote cards with anonymized attributions
- Quick-info commands /linkedin, /facebook, /instagram, /phone, /email, /agency, /location each print their placeholder value inline and never navigate
- Primary collection — projects (case studies): seed at least 6 projects (the reference ships 12 named case studies — Signals, Anylyze, LiveU, TUIASI, ResNet AI, Socyal, App4Home, CyberGhost VPN, CognitiveSEO, Big5 American Diner, Darnic, Crafting Social Stories); each has name, slug, blurb, status, tags, stats, type, and year; the collection supports create, edit, and delete via shell commands and/or an in-terminal form
- Project field contract (the create and edit form submits exactly this payload; the record the form creates IS the request body a portfolio case-study API would accept; all keys required unless marked optional; example values illustrative only): name (required string after trim, 1 to 80 characters), slug (required string after trim, 1 to 48 characters, lowercase letters, digits, and hyphens only, unique among active projects ignoring letter case), blurb (required string after trim, 1 to 280 characters), status (required closed enum string, exactly one of shipped, wip, archived), tags (required array of 1 to 8 unique strings after trim, each 1 to 24 characters), stats (required array of 1 to 4 strings after trim, each 1 to 32 characters — the visible stat chips), type (required string after trim, 1 to 40 characters — case-study type label), year (required integer from 1990 through 2100 inclusive). Empty name, empty or illegal slug, duplicate slug, status outside the closed enum, tags outside 1–8 unique entries, empty blurb, empty type, or year outside 1990–2100 keeps submit disabled or rejects and shows an inline error naming that field; submit does not add or mutate a record while any field fails the contract
- Each seeded project has a slash shortcut (e.g. /signals, /anylyze, /liveu) that prints a project detail block with its type/year, blurb, tags, and stat chips in the terminal
- Autocomplete dropdown suggests matching commands as you type and Tab completes the highlighted one; ↑/↓ arrows walk command history; command aliases (e.g. /portfolio, /projects, /me, /hire, /mail), bare-word fuzzy matches, and natural-language phrases all resolve to the correct command
- Theme switching via /themes (browse list), /dark, /light, /retro, /glass applies a session-scoped theme class on the document root and restyles the terminal without reloading; /retro reads as a CRT look and /glass as translucent glass
- Hidden easter-egg commands work and are discoverable via /secrets (or /easter-eggs): /matrix starts a green matrix-rain canvas, /konami (and the ↑↑↓↓←→←→BA keyboard code) fires a confetti-canvas party, the command "sudo hire designer" runs a fake-contract progress bar, and extras (/coffee, /figma, whoami, ls, git log, cat readme.md, ping designer, rm -rf doubts) each print themed output
- macOS-style window chrome: red close opens an exit overlay ("kill -9 …" lines, inert LinkedIn/Instagram buttons, and a Reopen terminal control that restores the window); yellow minimize swaps the blurred wallpaper for the sharp one; green maximize expands the terminal window
- Running a section command updates the document title to reflect the active route without rewriting the URL or navigating
- At least two interaction modes: Terminal CLI mode (command prompt + output) and Projects Board mode (list/grid of projects with status/tag filters, reachable via /work board or a mode toggle); switching modes updates the terminal body without a full reload
- Domain behavior beyond CRUD: filter projects by status or tag; /work lists all seeded active projects; project shortcuts open detail blocks; a search field on the board or via /work accepts status:shipped / status:wip / status:archived and tag:Name syntax; applying a query recomputes visible projects and clearing restores the full set exactly; a filter control and a syntax query that express the same constraint show the same visible set
- /stats prints total active count, per-status counts, and top tag frequencies derived from the current active collection; creating, editing status or tags, deleting, bulk-archiving, restoring, importing, or undoing changes the figures on the next /stats run without reload; the Projects Board stats strip status counts always match /stats for the current active collection
- Bulk select on Projects Board: each card/row has a checkbox; Select all checks every visible card; a bulk actions bar appears with the live selected count whenever at least one project is selected; Archive selected removes those projects from the board and /work, places them in the archive vault, drops /stats total by the selected count, clears selection, and removes them from the Portfolio JSON export preview without reload
- Archive vault: /archive or Archive view lists archived projects; Restore on a row returns that project to the active collection with its prior fields, increases board card count by exactly one, and removes it from the vault; restoring the last archived project leaves an empty-vault hint
- Command palette: Ctrl+K (Cmd+K) opens a focused command palette; typing fuzzy-matches commands, projects, themes, and views; each result row shows a kind label (Command, Project, Theme, or View); arrow keys move the highlight and Enter activates; Escape closes and returns focus to the command input; a query matching nothing shows an empty-state line rather than a blank list
- Undo and Redo (toolbar controls, /undo and /redo, and Ctrl+Z / Ctrl+Shift+Z) reverse and reapply create, edit, delete, bulk archive, restore, and import mutations; empty undo or redo stacks disable those controls; a new mutation after undo clears the redo stack; Undo restores the exact prior state across Projects Board, /work, shortcuts, filters, /stats, Archive vault, and the export preview
- Feature: Export and Import (useful end state; API-shaped portfolio package) —
- /export or Export view (export-center) shows Portfolio JSON and Resume Markdown tabs compiled live from session state; every create, edit, delete, archive, restore, theme change, consent choice, undo, or import regenerates both tabs without a reload — an export that omits session work is incorrect
- Portfolio JSON field contract (Copy, Download, and Import all conform to this same shape; field names and enum values are visible in the JSON preview text; all keys and nesting REQUIRED unless marked optional; example values illustrative only): version (required string exactly 1.0), theme (required closed enum string, exactly one of dark, light, retro, glass — matches the active session theme), consent (required closed enum string, exactly one of accepted, declined, not-set — matches /privacy), projects (required array of objects each matching the Project field contract above for every active project). Cross-field rules: theme must equal the root theme class currently applied; consent must equal the in-memory cookie-consent choice; projects length and per-status tallies must match /stats for the active collection
- Resume Markdown is derived from the same store: a readable resume-style document listing active project names, blurbs, statuses, tags, and years; it updates live with the same mutations as Portfolio JSON
- Copy export puts the exact visible Export preview text on the clipboard and shows a visible confirmation that reverts after a moment; Download export produces a real file whose contents match the currently visible tab (portfolio.json or resume.md)
- /import or Export Import accepts a previously exported Portfolio JSON file or pasted JSON and replaces the active projects collection so board, /work, /stats, and both export tabs match the imported projects; malformed JSON or a payload that violates the Portfolio JSON field contract shows a visible error naming the import problem or offending field and leaves the current session unchanged
- Exporting then re-importing a valid Portfolio JSON reconstructs the same visible project names, statuses, tags, slugs, stats, type, and year; the useful end state is this portable package plus the MCP query surface
- All link-like controls (social rows, email/phone, award rows, close-overlay CTAs) are inert buttons — no real navigation, no new tabs, no mailto/tel
</core_features>

<user_flows>
End-to-end flows (each step names its visible state evidence):
- Create flow: after boot, create a valid project named Northline Studio with a project field-contract payload; the /work listing grows by exactly one entry, Projects Board shows one more card with that name and a status badge, the new project's slash shortcut immediately prints its detail block, /stats total increases by one, and Portfolio JSON contains the new name under projects[] — all without a reload
- Edit flow: editing a seeded project's name or tags updates that same record everywhere it appears — the Projects Board card, the /work list line, the project's shortcut detail block, and the export preview all show the edited values without a reload
- Delete flow: deleting a project decreases the Projects Board card count by exactly one, removes its line from subsequent /work output, drops it from status/tag filter results and the export preview, and its former shortcut no longer prints a detail block
- Filter flow: applying a status or tag filter or status:shipped syntax query in Projects Board recomputes the visible cards from the shared collection; clearing the filter restores the full set exactly; a project whose status is edited moves between filter results accordingly
- Consent flow: before any choice /privacy reads not set; choosing Accept dismisses the banner and a subsequent /privacy reads accepted; the same holds for Decline reading declined; Portfolio JSON consent matches /privacy
- Theme and mode flow: switching theme via /retro then toggling into Projects Board keeps the retro theme applied; switching back to Terminal CLI mode preserves the output buffer and command history; none of these steps reloads the document
- Bulk archive with undo: selecting three visible board projects and choosing Archive selected moves all three to /archive, drops /stats by three, and removes them from export; Ctrl+Z restores all three to the board, prior /stats, and Portfolio JSON
- Export then import: create Northline Atlas with a valid project field-contract payload, confirm Portfolio JSON contains it under projects[] with required version/theme/consent/projects keys, copy the JSON, delete Northline Atlas, import that payload, and confirm Northline Atlas returns on the board and in /work with the same status, tags, slug, and stats
- Artifact field-contract flow: after creating or editing a project and switching to /retro with consent accepted, open Export and confirm Portfolio JSON shows version exactly 1.0, theme exactly retro, consent exactly accepted, and a projects entry whose name, slug, blurb, status, tags, stats, type, and year match the form values
- Palette navigation: Ctrl+K, type part of a seeded project name, Enter on the Project result opens that detail; reopen palette and choose Export view to open the export preview
- Window chrome: yellow minimize swaps the blurred wallpaper for the sharp one; green maximize expands the terminal; red close opens the exit overlay and Reopen restores the terminal without a full page reload
- Reload baseline: after creating or editing a project, archiving, switching theme/mode, and opening Export, reloading the page returns the app to its seeded state — the boot sequence replays and /work lists exactly the seeded projects, with any created, edited, deleted, archived, theme, consent, undo, or export session state reverted
</user_flows>

<edge_cases>
- Invalid create: submitting the project create form or command with an empty project name, illegal slug, status outside shipped|wip|archived, tags outside 1–8 unique entries, or year outside 1990–2100 must not add a project — the count stays the same and visible validation feedback naming the field appears in the terminal output or form
- Double-activating the project create submit adds exactly one project: the board card count increases by one and one new /work entry appears
- Deleting every active project shows an empty projects state in both Projects Board and /work output, with a hint for how to create one, and /stats shows zero active projects
- Typing an unrecognized command echoes the input and prints a command-not-found style message pointing at /help, without throwing or clearing existing output
- /clear wipes prior output but leaves the prompt, command history recall (↑), and the seeded collection intact
- Undo with an empty history and Redo with an empty redo stack are disabled; activating them does nothing and produces no console errors
- Importing malformed Portfolio JSON shows a visible validation message naming the problem, changes no projects, and leaves /work and the board unchanged
- Importing parseable JSON that fails the Portfolio JSON field contract — missing required version/theme/consent/projects keys, version not exactly 1.0, theme outside dark|light|retro|glass, consent outside accepted|declined|not-set, or a project entry that breaks the project field contract — leaves the collection unchanged and shows validation naming the offending field
- A syntax query or filter that matches nothing shows an empty-results state on the board with a clear way to clear the query; clearing restores the full set
- Restoring the last archived project leaves /archive showing an empty-vault hint while the restored project appears on the board
</edge_cases>

<visual_design>
- Full-bleed atmospheric wallpaper behind a centered terminal window with a macOS traffic-light titlebar reading "designer@portfolio ~ /portfolio"
- JetBrains Mono monospace throughout; CSS variable themes — dark default, light, retro CRT (scanline/glow feel), and translucent glass variants
- Post-boot layout: monospace ASCII name art over a two-column welcome box (left: greeting + pixel/ASCII rocket + subtitle/email; right: Capabilities and Navigation lists)
- Command output area shows echoed prompt lines, headings, skill bars, award/testimonial rows, and project detail blocks with tag and stat chips
- Buttons, overlays, snackbars/tooltips, and dense controls share one consistent, accessible component treatment that fits the terminal chrome rather than reading as a separate design system
- Projects Board mode uses dense project cards/rows inside the terminal body with status badges, checkboxes, a stats strip, and a bulk actions bar
- Export preview, Archive vault, and command palette fit the same terminal-over-wallpaper composition with readable contrast and no clipped controls
- A close overlay reproduces the titlebar text "… ~ /exit" and shows red exit lines plus inert reconnect CTAs; full-viewport matrix-rain and confetti canvases overlay the page during easter eggs
- One terminal-over-wallpaper composition — not a marketing multi-section landing
</visual_design>

<motion>
- Boot: sequential status lines reveal one after another; Enter/click/touch dismisses boot
- Post-boot enter: ASCII art and welcome box fade/slide in; prompt takes focus
- CLI thinking indicator + staggered output reveal for command results; /skills bars animate from zero to their target width
- Creating a project animates its new card/row into the Projects Board; deleting one animates it out; bulk Archive selected uses the same exit motion; the board never snaps rows in or out with no transition
- Theme switch recolors the terminal instantly without reloading; minimize crossfades the wallpaper from blurred to sharp; maximize expands the window
- /matrix animates a continuous green character-rain canvas; /konami (or the keyboard code) bursts a confetti canvas; the command "sudo hire designer" advances a progress bar to 100%
- Mode switch between Terminal CLI and Projects Board updates without full reload
- Validation feedback, copy-export confirmation, and import success or error messages appear with a brief transition rather than popping in with no motion
- Hover animations (required): titlebar dots ease opacity on hover; project cards/rows ease border-color and background on hover; autocomplete and palette rows highlight on hover/active; social/close buttons ease on hover
- Respect prefers-reduced-motion by disabling staggered/enter and canvas animations where practical
</motion>

<responsiveness>
- At desktop widths the terminal window is centered over the wallpaper with visible margins; at widths of 768 pixels and below the window expands toward full width and the two-column welcome box stacks into a single column
- Projects Board cards reflow from a multi-column grid at desktop widths to a single column at narrow widths without clipping card content, checkboxes, or the bulk actions bar
- Export tabs, Archive vault rows, and the command palette remain usable at narrow widths without clipped controls or horizontal page scroll
- At 375 pixel width no content clips or overflows the viewport and no horizontal scrolling appears; the command input remains visible and usable
</responsiveness>

<accessibility>
- Every interactive control (command input, autocomplete rows, board cards and filters, checkboxes, bulk actions, banner buttons, titlebar dots, overlay CTAs, command palette, undo/redo, export Copy/Download, archive Restore) is reachable and operable with the keyboard alone, with a visible focus indicator
- The autocomplete dropdown is keyboard operable: arrow keys move the highlight and Tab or Enter completes the highlighted command without requiring the pointer
- The command palette is keyboard operable: arrow keys move the highlight, Enter activates, Escape closes and returns focus to the command input
- The exit overlay can be dismissed and the terminal restored from the keyboard; while an overlay is open, focus stays within it
- Form, command, and import validation messages are exposed to assistive technology via a polite live region as well as shown visually
- The matrix-rain and confetti canvases are decorative: they are hidden from the accessibility tree and never trap focus or block the command input
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load, with boot animation starting promptly
- No console errors or warnings appear during boot, command entry, CRUD, bulk archive, theme switching, mode switching, export/import, undo/redo, or easter eggs
- Rapid repeated command entry stays responsive with no hangs, dropped keystrokes, or frozen output
- After a project create, delete, or archive, the export preview recompiles promptly with no multi-second freeze of the shell or command input
- Rapid repeated undo/redo stays responsive with no hangs, dropped keystrokes, or frozen board/export surfaces
- The matrix-rain canvas animates smoothly while the command input remains responsive; running /clear or dismissing the effect stops its work
</performance>

<writing>
- Terminal output, /help descriptions, and section copy use one consistent capitalization and tone; command descriptions say what each command does in specific terms
- Error and validation messages name the problem and the fix (for example which field is empty, illegal, or out of enum), never a bare failure word
- Export tab labels read Portfolio JSON and Resume Markdown; undo history labels use specific verbs such as Created, Edited, Archived, or Restored rather than generic Done
- Empty archive, empty filter results, and empty palette query states explain what belongs there and how to recover
- Rendered copy is free of lorem ipsum and template filler; identity details (name, email, phone, socials) are clearly placeholder values, never real personal data
- Terminology for project, archive, Export, Import, and Portfolio JSON stays consistent across the shell, board, and export surfaces
</writing>

<requirements>
Shared application state must use the stack state library named in summary (in-memory only): projects collection, archive vault, command history, theme class, autocomplete, output buffer, active mode, filters and search query, multi-select set, undo/redo stacks, export preview texts, and cookie-consent choice. Do not use localStorage, sessionStorage, or other browser storage APIs. Persistence for this good-app genre is the exportable Portfolio JSON / Resume Markdown package plus the MCP query surface — not browser storage.
State contracts (behavioral, not storage keys):
- Creating a valid project increases the collection and shows it in /work, Projects Board, /stats, and both export tabs
- Editing a project updates that same record in board, list output, detail, and export
- Deleting a project removes it from board, shortcuts, filters, /stats, and export
- Status/tag filters and syntax queries recompute the visible board from the shared collection
- Bulk archive and restore move projects between the active collection and the archive vault with matching /stats and export updates
- Theme, mode, and consent are shared client state; toggling them does not reload the document; Portfolio JSON theme and consent fields match those session values
- Undo and redo walk the mutation history and keep board, /work, /stats, archive, and export mutually coherent
- Importing a valid Portfolio JSON replaces the active projects collection across all surfaces; schema-invalid import leaves state unchanged
Stack: Angular with NgRx, built with the Angular CLI or an equivalent SPA setup; frontend-only. Styling is Tailwind CSS 4.3.2 (pinned), with design tokens in @theme, JetBrains Mono, and Angular Material components for light terminal chrome such as buttons, overlays, snackbars, tooltips, dense controls, and the command palette; no other external component library. GSAP is allowed for terminal typing, staggered output, boot and entry motion, skill bars, window transitions, and canvas-effect orchestration; no other animation libraries. Material Symbols icons only; no raw pasted SVG icon sets and no icon CDNs. All forms, including project create and edit and Import paste when presented as a form, use Angular Reactive Forms with a Zod schema layer and render inline per-field errors before submit. Schemas are API-shaped: they model the payloads a real portfolio API would accept — the Project field contract and the Portfolio JSON field contract above — the record a form creates IS the would-be request body, and Export and Import conform to those same schemas. All libraries are installed via npm and bundled locally; no CDN imports.
- Seed at least 6 projects so /work and Projects Board are non-empty after boot; the reference ships 12 named case studies, each with type, year, blurb, tags, and stat chips matching the Project field contract
- Empty or illegal required fields on create must not increase the projects count; show visible validation feedback naming the field and the contract rule
- After deleting all active projects, show an empty state in Projects Board / /work output
- Provide at least four themes (dark, light, retro, glass) applied as a session-scoped class on the document root; switching does not reload the document
- Provide the hidden easter-egg commands (at minimum /matrix rain, /konami confetti, and a /secrets listing) as working, discoverable behaviors — not decorative stubs
- Section commands update the document title but must not rewrite the URL or navigate away from the single page
- Zero navigational outbound links; placeholder identity only; all social/email/phone/award/close controls are inert buttons
- Cookie-consent Accept/Decline must update shared state and must not throw if analytics is absent
- Portfolio JSON export and Import compile and validate against the Portfolio JSON field contract; Resume Markdown is derived from the same store; Copy and Download emit live-compiled text that reflects every mutation; Import round-trips a valid package back into the visible surfaces
- The useful end state is the portable portfolio package: Export must produce Portfolio JSON and Resume Markdown texts that contain the session's actual mutations and conform to the declared field contracts, with Copy and Download, and Portfolio JSON must round-trip through Import while remaining MCP-queryable
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
- Browsable entity: projects
- Destinations: terminal-home; project-detail; about; export-center; archive-vault
- Filters: status; tag
- Themes: dark; light; retro; glass
- Entity: project
- Entity operations: create; select; update; delete
- Entity fields: title; summary; tags; status
- Artifact operations: export; import; copy
- Export formats: json; markdown
- Import modes: declared-portfolio

Mechanics exclusions:
- Terminal typing animation timing stays Playwright-observed
- Raw file paths/blobs forbidden in WebMCP args

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
