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
- A cookie-consent banner appears after boot offering Accept and Decline; choosing either updates in-memory consent, dismisses the banner, and is reflected when /privacy is run (status reads accepted or declined); choosing must not throw when no analytics library is present
- Typing a slash command echoes the input line and appends staggered output; the shell resolves the section commands /help, /about, /work, /clients, /skills, /philosophy, /social, /articles, /testimonials, /awards, /contact, /privacy, and /clear (which wipes prior output)
- /help lists the available commands grouped by category; /about prints a multi-line generic designer bio; /clients prints a client list; /articles lists published articles grouped by topic; /philosophy prints a design-philosophy statement
- /skills renders labeled skill bars (at least ten named skills) that animate from zero to their target percentage width
- /awards renders inert award rows (at least the reference four: Awwwards, The FWA, CSS Design Awards, CSS Winner); /testimonials renders quote cards with anonymized attributions
- Quick-info commands /linkedin, /facebook, /instagram, /phone, /email, /agency, /location each print their placeholder value inline and never navigate
- Primary collection — projects (case studies): seed at least 6 projects (the reference ships 12 named case studies — Signals, Anylyze, LiveU, TUIASI, ResNet AI, Socyal, App4Home, CyberGhost VPN, CognitiveSEO, Big5 American Diner, Darnic, Crafting Social Stories); each has name, slug/shortcut, blurb, status (shipped | wip | archived), tags, and stat chips; the collection supports create, edit, and delete via shell commands and/or an in-terminal form
- Each seeded project has a slash shortcut (e.g. /signals, /anylyze, /liveu) that prints a project detail block with its type/year, blurb, tags, and stat chips in the terminal
- The project create and edit form validates every field against its rules and shows inline per-field error messages naming the offending field before submit; submit stays disabled or rejects while required fields are invalid
- Autocomplete dropdown suggests matching commands as you type and Tab completes the highlighted one; ↑/↓ arrows walk command history; command aliases (e.g. /portfolio, /projects, /me, /hire, /mail), bare-word fuzzy matches, and natural-language phrases all resolve to the correct command
- Theme switching via /themes (browse list), /dark, /light, /retro, /glass applies a session-scoped theme class on the document root and restyles the terminal without reloading; /retro reads as a CRT look and /glass as translucent glass
- Hidden easter-egg commands work and are discoverable via /secrets (or /easter-eggs): /matrix starts a green matrix-rain canvas, /konami (and the ↑↑↓↓←→←→BA keyboard code) fires a confetti-canvas party, the command "sudo hire designer" runs a fake-contract progress bar, and extras (/coffee, /figma, whoami, ls, git log, cat readme.md, ping designer, rm -rf doubts) each print themed output
- macOS-style window chrome: red close opens an exit overlay ("kill -9 …" lines, inert LinkedIn/Instagram buttons, and a Reopen terminal control that restores the window); yellow minimize swaps the blurred wallpaper for the sharp one; green maximize expands the terminal window
- Running a section command updates the document title to reflect the active route without rewriting the URL or navigating
- At least two interaction modes: Terminal CLI mode (command prompt + output) and Projects Board mode (list/grid of projects with status/tag filters, reachable via /work board or a mode toggle); switching modes updates the terminal body without a full reload
- Domain behavior beyond CRUD: filter projects by status or tag; /work lists all seeded projects; project shortcuts open detail blocks
- All link-like controls (social rows, email/phone, award rows, close-overlay CTAs) are inert buttons — no real navigation, no new tabs, no mailto/tel
</core_features>

<user_flows>
End-to-end flows (each step names its visible state evidence):
- Create flow: running the project create command or form with a valid name adds exactly one project — the /work listing grows by one entry, the Projects Board shows one more card with the new name and status badge, and the new project's slash shortcut immediately prints its detail block, all without a reload
- Edit flow: editing a seeded project's name or tags updates that same record everywhere it appears — the Projects Board card, the /work list line, and the project's shortcut detail block all show the edited values without a reload
- Delete flow: deleting a project removes it from the Projects Board (card count decreases by exactly one), removes its line from subsequent /work output, drops it from status/tag filter results, and its former shortcut no longer prints a detail block
- Filter flow: applying a status or tag filter in Projects Board recomputes the visible cards from the shared collection; clearing the filter restores the full set exactly; a project whose status is edited moves between filter results accordingly
- Consent flow: choosing Accept on the cookie banner dismisses it, and a subsequent /privacy run reads accepted; before any choice /privacy reads not set; the same holds for Decline reading declined
- Theme and mode flow: switching theme via /retro then toggling into Projects Board keeps the retro theme applied; switching back to Terminal CLI mode preserves the output buffer and command history; none of these steps reloads the document
- Reload baseline: reloading the page returns the app to its seeded state — the boot sequence replays and /work lists exactly the seeded projects, with any created, edited, or deleted projects reverted
</user_flows>

<edge_cases>
- Invalid create: submitting the project create form or command with an empty project name must not add a project — the count stays the same and visible validation feedback naming the field appears in the terminal output or form
- Double-activating the project create submit adds exactly one project: the board card count increases by one and one new /work entry appears
- Deleting every project shows an empty projects state in both Projects Board and /work output, with a hint for how to create one
- Typing an unrecognized command echoes the input and prints a command-not-found style message pointing at /help, without throwing or clearing existing output
- /clear wipes prior output but leaves the prompt, command history recall (↑), and the seeded collection intact
</edge_cases>

<visual_design>
- Full-bleed atmospheric wallpaper behind a centered terminal window with a macOS traffic-light titlebar reading "designer@portfolio ~ /portfolio"
- JetBrains Mono monospace throughout; CSS variable themes — dark default, light, retro CRT (scanline/glow feel), and translucent glass variants
- Post-boot layout: monospace ASCII name art over a two-column welcome box (left: greeting + pixel/ASCII rocket + subtitle/email; right: Capabilities and Navigation lists)
- Command output area shows echoed prompt lines, headings, skill bars, award/testimonial rows, and project detail blocks with tag and stat chips
- Buttons, overlays, snackbars/tooltips, and dense controls share one consistent, accessible component treatment that fits the terminal chrome rather than reading as a separate design system
- Projects Board mode uses dense project cards/rows inside the terminal body with status badges
- A close overlay reproduces the titlebar text "… ~ /exit" and shows red exit lines plus inert reconnect CTAs; full-viewport matrix-rain and confetti canvases overlay the page during easter eggs
- One terminal-over-wallpaper composition — not a marketing multi-section landing
</visual_design>

<motion>
- Boot: sequential status lines reveal one after another; Enter/click/touch dismisses boot
- Post-boot enter: ASCII art and welcome box fade/slide in; prompt takes focus
- CLI thinking indicator + staggered output reveal for command results; /skills bars animate from zero to their target width
- Creating a project animates its new card/row into the Projects Board; deleting one animates it out; the board never snaps rows in or out with no transition
- Theme switch recolors the terminal instantly without reloading; minimize crossfades the wallpaper from blurred to sharp; maximize expands the window
- /matrix animates a continuous green character-rain canvas; /konami (or the keyboard code) bursts a confetti canvas; the command "sudo hire designer" advances a progress bar to 100%
- Mode switch between Terminal CLI and Projects Board updates without full reload
- Validation feedback and confirmation messages appear with a brief transition rather than popping in with no motion
- Hover animations (required): titlebar dots ease opacity on hover; project cards/rows ease border-color and background on hover; autocomplete rows highlight on hover/active; social/close buttons ease on hover
- Respect prefers-reduced-motion by disabling staggered/enter and canvas animations where practical
</motion>

<responsiveness>
- At desktop widths the terminal window is centered over the wallpaper with visible margins; at widths of 768 pixels and below the window expands toward full width and the two-column welcome box stacks into a single column
- Projects Board cards reflow from a multi-column grid at desktop widths to a single column at narrow widths without clipping card content
- At 375 pixel width no content clips or overflows the viewport and no horizontal scrolling appears; the command input remains visible and usable
</responsiveness>

<accessibility>
- Every interactive control (command input, autocomplete rows, board cards and filters, banner buttons, titlebar dots, overlay CTAs) is reachable and operable with the keyboard alone, with a visible focus indicator
- The autocomplete dropdown is keyboard operable: arrow keys move the highlight and Tab or Enter completes the highlighted command without requiring the pointer
- The exit overlay can be dismissed and the terminal restored from the keyboard; while an overlay is open, focus stays within it
- Form and command validation messages are exposed to assistive technology via a polite live region as well as shown visually
- The matrix-rain and confetti canvases are decorative: they are hidden from the accessibility tree and never trap focus or block the command input
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load, with boot animation starting promptly
- No console errors or warnings appear during boot, command entry, CRUD, theme switching, mode switching, or easter eggs
- Rapid repeated command entry stays responsive with no hangs, dropped keystrokes, or frozen output
- The matrix-rain canvas animates smoothly while the command input remains responsive; running /clear or dismissing the effect stops its work
</performance>

<writing>
- Terminal output, /help descriptions, and section copy use one consistent capitalization and tone; command descriptions say what each command does in specific terms
- Error and validation messages name the problem and the fix (e.g. which field is empty), never a bare failure word
- Rendered copy is free of lorem ipsum and template filler; identity details (name, email, phone, socials) are clearly placeholder values, never real personal data
</writing>

<requirements>
Shared application state must use the stack state library named in summary (in-memory only): projects collection, command history, theme class, autocomplete, output buffer, active mode, filters, and cookie-consent choice. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a valid project increases the collection and shows it in /work and Projects Board
- Editing a project updates that same record in board, list output, and detail
- Deleting a project removes it from board, shortcuts, and filters
- Status/tag filters recompute the visible board from the shared collection
- Theme and mode are shared client state; toggling them does not reload the document
- Cookie-consent choice is shared state; /privacy reflects the current accepted/declined/not-set status
Stack: Angular with NgRx, built with the Angular CLI or an equivalent SPA setup; frontend-only. Styling is Tailwind CSS 4.3.2 (pinned), with design tokens in @theme, JetBrains Mono, and Angular Material components for light terminal chrome such as buttons, overlays, snackbars, tooltips, and dense controls; no other external component library. GSAP is allowed for terminal typing, staggered output, boot and entry motion, skill bars, window transitions, and canvas-effect orchestration; no other animation libraries. Material Symbols icons only; no raw pasted SVG icon sets and no icon CDNs. All forms, including project create and edit, use Angular Reactive Forms with a Zod schema layer and render inline per-field errors before submit. All libraries are installed via npm and bundled locally; no CDN imports.
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
