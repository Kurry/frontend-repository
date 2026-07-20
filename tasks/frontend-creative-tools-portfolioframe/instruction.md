<summary>
Build a resume-and-portfolio builder using Qwik, Qwik stores, Tailwind CSS 4.3.2, and DaisyUI.
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
Feature: Builder shell —
- The app opens at / into a two-pane PortfolioFrame builder with no login: a left editor panel and a right live preview panel, plus a top bar showing the PortfolioFrame wordmark, a Download PDF button, and an Export package control. It starts completely empty — no seeded content and no saved drafts — so the preview shows a friendly "start building" prompt and empty-state hints on first load
- The app never navigates away from /: all controls act through in-app state and there are no outbound navigational links in the chrome
- Pressing Ctrl+K (Cmd+K on macOS) opens a command palette with a focused search input; typing narrows results across sections, layout presets, drafts, themes, and actions, each result showing a kind label; Enter activates the highlighted result and Escape closes the palette; a query with no matches shows an empty-state line inside the palette rather than a blank overlay

Feature: Profile Header (API-shaped profile payload) —
- The Profile Header editor has Name, Title/Tagline, and Bio fields; typing into any of them updates the assembled preview's header block immediately, with the typed text appearing in the preview without a reload
- Profile field contract (the editor binds exactly this payload; edits ARE the would-be profile API request body; all keys required unless marked optional; example values illustrative only): name (required string after trim, 1 to 80 characters), title (optional string, at most 120 characters), bio (optional string, at most 600 characters). An empty or over-length name shows an inline error naming the name field

Feature: Projects (API-shaped project create/update payload) —
- An Add Project form appends a project card to the preview's project grid when submitted; each project has Edit and Delete controls in the editor, editing a project updates its card in the preview, and deleting it removes the card from the preview
- Project field contract (the create and edit form submits exactly this payload; the record the form creates IS the request body a portfolio API would accept; all keys required unless marked optional; example values illustrative only): title (required string after trim, 1 to 80 characters), description (optional string, at most 500 characters), categoryTag (required string after trim, 1 to 32 characters), linkLabel (optional string, at most 40 characters), status (required closed enum string, exactly one of shipped, wip, concept), featured (boolean, default false). Out-of-enum status, empty title, empty categoryTag, or over-length fields keep submit disabled and show an inline error naming that field; submitting with an empty Title shows an inline error naming the Title field next to that field and appends no card
- Submitting a project with Status wip shows a WIP chip on its preview card; status shipped and concept each show their own status chip using the closed enum value
- Pinning Featured on a project renders it first in the preview grid with a Featured treatment, and pinning a different project moves the Featured treatment so exactly one featured project is visible; the featured boolean on the created record matches that pin
- Each project row exposes a selection checkbox; selecting one or more projects reveals a bulk actions bar with the live selected count and a Delete selected control; Delete selected removes every selected project from the preview grid and clears the selection; with no projects checked the bulk actions bar is hidden or Delete selected is disabled and produces no change

Feature: Skills —
- A Skills input adds a skill chip when the user presses Enter or clicks Add; the chip appears in the preview's Skills section; each skill string is at most 40 characters after trim, and empty input adds no chip

Feature: Testimonials (API-shaped testimonial create payload) —
- An Add Testimonial form appends an entry to a horizontally scrollable testimonials row in the preview; each testimonial has a Delete control that removes it
- Testimonial field contract (the create form submits exactly this payload; the record the form creates IS the would-be request body; all keys required; example values illustrative only): quote (required string after trim, 1 to 400 characters), name (required string after trim, 1 to 80 characters), role (required string after trim, 1 to 80 characters). Empty or over-length fields keep submit disabled and show an inline error naming that field; a valid submit appends exactly one entry

Feature: Section layout —
- Each content section — Profile Header, Projects, Skills, Testimonials, and Contact — has a labeled show/hide toggle; turning a section off immediately removes it from the preview and turning it back on restores it in its existing position rather than appending it at the end
- Each section has Move Up and Move Down controls that reorder the sections shown in the preview
- A Layout presets control offers three named packs — Classic, Compact stack, and Spotlight — each applying a packed change to section order, visibility, theme, and density together in the preview; Undo restores the prior layout state exactly

Feature: Theme and density —
- A Theme Picker offers four named color themes labeled Sunrise, Slate, Forest, and Blossom; selecting one instantly recolors the headings, chips, and accent text inside the preview's content blocks only, while the surrounding editor chrome keeps its own colors
- A Density control toggles the preview between Compact and Spacious spacing presets, visibly changing the padding and gaps between the preview's blocks

Feature: Contact (API-shaped contact payload) —
- A Contact editor has Email and Location fields plus up to 3 custom labeled links (for example Portfolio or Writing); the Email, Location, and each custom link render together in the preview's Contact section with each link showing its own label
- Contact field contract (the editor binds exactly this payload; edits ARE the would-be contact API request body; all keys required unless marked optional; example values illustrative only): email (optional string; when non-empty must contain exactly one @ with non-empty local and domain parts), location (optional string, at most 120 characters), links (array of at most 3 objects, each with label required string 1 to 40 characters and href required non-empty string). An invalid email, over-length location or label, empty href, or more than 3 links shows an inline error naming that field and does not commit the invalid values

Feature: Print export —
- A Download PDF button in the top bar triggers the browser's native print flow to export the assembled single-page document; the print output shows only the assembled preview content and hides the editor chrome

Feature: Export package and Import (useful end state; API-shaped portfolio package) —
- An Export package panel shows a live-compiled monospaced preview with Portfolio JSON and Markdown resume tabs; every profile, project, skill, testimonial, contact, section order/visibility, theme, and density mutation regenerates both tabs without a reload — an export that omits session work is incorrect
- Portfolio JSON field contract (Copy, Download, and Import all conform to this same shape; field names and enum values are visible in the JSON preview text; all keys and nesting REQUIRED unless marked optional; example values illustrative only): schemaVersion (required string exactly portfolioframe-v1), profile (required object matching the Profile field contract), projects (required array of objects each matching the Project field contract), skills (required array of strings, each 1 to 40 characters), testimonials (required array of objects each matching the Testimonial field contract), contact (required object matching the Contact field contract), sections (required array of objects each with id closed enum exactly one of profile, projects, skills, testimonials, contact and visible boolean, listing every section exactly once in display order), theme (required closed enum exactly one of sunrise, slate, forest, blossom), density (required closed enum exactly one of compact, spacious). At most one project may have featured true. The JSON is compiled LIVE from the store
- The Markdown resume tab shows a live-compiled plain-text resume whose visible text includes the current profile name and every project title
- Copy export puts the exact visible Export package preview text on the clipboard and shows a visible confirmation that reverts after a moment; Download export produces a real file whose contents match the currently visible tab (portfolio.json or resume.md)
- Import package accepts a previously exported Portfolio JSON file or pasted JSON and reconstructs profile, projects, skills, testimonials, contact, section order and visibility, theme, and density so the editor, preview, Completeness count, and both export tabs match the imported document; malformed JSON or a payload that violates the Portfolio JSON field contract shows a visible error naming the import problem (or the offending field) and leaves the current session unchanged
- Exporting then re-importing a valid Portfolio JSON reconstructs the same visible state; the useful end state is this portable package plus the MCP query surface

Feature: Drafts (API-shaped draft save payload) —
- A Drafts panel saves the current content under a typed name via Save As Draft, lists every saved draft, and lets the user Load a draft (replacing the current editor and preview content) or Delete it from the list
- Draft field contract (Save As Draft submits exactly this payload; the record created IS the would-be draft API request body): name (required string after trim, 1 to 60 characters, unique among existing drafts ignoring letter case). An empty, over-length, or duplicate name keeps save disabled and shows an inline error naming the name field; a valid save adds exactly one list entry whose stored snapshot includes the full working portfolio package fields above

Feature: Completeness —
- A Completeness panel lists recommended fields and sections with a live "x of y complete" count that increases the moment a previously empty recommended field is filled, without a reload; a summary strip near Export package shows the same count

Feature: History —
- An Undo control reverts the most recent content change — adding, editing, or deleting a project, testimonial, or skill, editing a Profile Header or Contact field, bulk delete, layout preset apply, or Import — and a Redo control reapplies the last undone change; undo history spans multiple consecutive changes so repeated Undo walks back through them one at a time
- A visible History panel models edits to the content as explicit transitions: it shows a region labelled History state with the current snapshot, a selectable list of past and future snapshots, and an Apply Scenario Change action that records the current content as a new explicit transition
- Undoing one or more steps and then making a different change — Apply Scenario Change, or a new create, edit, or delete — creates a separate selectable branch rather than silently discarding or flattening the abandoned states; the History panel lists the alternate branch, and selecting a branch restores the exact prior visible state that branch represents
</core_features>

<user_flows>
- After submitting a valid project through the Add Project form with Title, Category Tag, and Status, the preview's project grid shows exactly one more card with the matching status chip, the Completeness panel's "x of y complete" count reflects the projects section the moment it first gains content, and after a full page reload the same project card is still present without re-entering it
- Adding a skill through the Skills input shows the new chip in the preview's Skills section immediately; pressing Undo removes exactly that chip and enables Redo, pressing Redo restores the same chip, and the History panel lists these transitions as selectable snapshots
- Saving the current content under a typed name via Save As Draft adds exactly one entry to the drafts list right away; after a full page reload the draft is still listed, and choosing Load on it replaces the editor fields, the preview content, the section order and visibility, and the active theme and density with that draft's exact values without a reload
- Hiding the Testimonials section removes it from the preview while its entries remain in the editor; using Move Up to reorder another section visibly changes the preview's section order; turning Testimonials back on restores it in its remembered position, and after a full page reload the committed order and visibility are unchanged
- Selecting the Forest theme recolors the preview's headings, chips, and accent text in place and switching Density to Compact tightens the preview's padding and gaps; both selections survive a full page reload and the editor chrome's own colors never change
- Export package flow: filling Profile Header Name with a unique string, adding a uniquely titled project, switching to Portfolio JSON, and activating Copy export puts text containing both unique strings plus schemaVersion portfolioframe-v1 on the clipboard with visible confirmation; Markdown resume shows the same Name and project title; Download export matches the visible tab
- Import round trip: after building content, downloading Portfolio JSON, clearing or replacing working state, and importing that JSON, the preview, editor fields, theme, density, section order, statuses, Completeness count, and both export tabs match the pre-export state
- Bulk delete with undo: selecting three projects and choosing Delete selected removes all three from the preview and from both export tabs; pressing Undo restores all three cards, their statuses, and the export text exactly as before the bulk delete
- Layout preset and palette flow: applying Compact stack changes section order, visibility, theme, and density together and updates Export package preview; Undo restores the prior layout; opening the command palette with Ctrl+K, typing part of Export package, and pressing Enter opens the Export package panel
</user_flows>

<edge_cases>
- Attempting to add a skill that duplicates an existing one ignoring letter case is rejected with a visible inline message and creates no second chip
- Move Up is disabled for the first visible section and Move Down for the last, and the disabled controls read as non-interactive
- Undo is disabled when there is nothing to undo and Redo is disabled when there is nothing to redo
- Deleting a draft removes it from the drafts list immediately, and a reload does not revive a draft that was deleted before the reload
- Rapid duplicate submissions of the Add Project or Add Testimonial form create exactly one record, not two
- Deleting the last project, testimonial, or skill returns that region of the preview to its explicit empty-state hint rather than a blank area, and the projects grid, testimonials row, and drafts list each show a hint whenever they are empty
- Submitting Add Project with an empty Title, empty Category Tag, Status outside shipped|wip|concept, or over-length Title shows an inline error naming that field and appends no card
- Submitting Add Testimonial with empty Quote, Name, or Role, or a Quote longer than 400 characters, shows an inline error naming that field and appends no entry
- Save As Draft with an empty name, a name longer than 60 characters, or a case-insensitive duplicate name shows an inline error naming the name field and adds no draft
- Contact email that is non-empty but missing @ shows an inline error naming the email field and does not commit the invalid email
- Importing malformed or undecodable Portfolio JSON, or JSON that violates the Portfolio JSON field contract (wrong schemaVersion, missing required keys, status outside the closed enum, more than one featured true, theme or density outside their closed enums), shows a visible error naming the import problem or offending field, leaves the current session state unchanged, and produces no console errors
- With no projects checked, the bulk actions bar is hidden or Delete selected is disabled and produces no change to the project list
- Pinning a second featured project leaves exactly one Featured treatment visible; the previous featured project loses the treatment immediately
- A command palette query with no matches shows an empty-state line inside the palette rather than a blank overlay
</edge_cases>

<visual_design>
- Clean single-page builder composition on a warm off-white app background (about #FAFAF9) with white surface cards and panels (#FFFFFF) separated by hairline borders (about #E7E5E4); the editor panel and the preview canvas read as distinct surfaces
- Heading text uses a Poppins-first stack (Poppins, then -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif) and body text uses an Inter-first stack (Inter, then the same system fallbacks); the preview's profile name renders at 30px semi-bold as the h1, section titles at 20px semi-bold as h2, and body copy at 15px regular
- Color tokens are applied through CSS custom properties and are visibly used, not merely declared: --color-primary #7C3AED (violet) for chrome buttons, links, and the active accent; --color-accent #F97316 (orange) for highlights; --color-background #FAFAF9; --color-surface #FFFFFF; --color-text-primary #1C1917; --color-text-muted #78716C; --color-border #E7E5E4
- The four preview themes each pair a content accent with a supporting tone, applied only inside the preview's content blocks: Sunrise #F97316 with supporting tone #FDE68A, Slate #475569 with #CBD5E1, Forest #15803D with #BBF7D0, and Blossom #DB2777 with #FBCFE8
- Shape system: an 8px base spacing unit, a 16px border radius for cards and panels, primary buttons filled with --color-primary and white text at a full 999px pill radius with no shadow, and secondary buttons white with --color-primary text and a 1px solid --color-border border at the same pill radius with no shadow
- Skill and category chips render as rounded pills tinted with the active theme's supporting tone; project cards and testimonial cards use the 16px card radius with hairline borders; status chips and the Featured treatment read as distinct accents on project cards
- Icons come from one consistent icon set used across the chrome — section toggles, reorder controls, delete controls, and the drafts panel share the same visual icon language
- The Completeness panel distinguishes complete from incomplete items by more than the count alone — for example a check mark and struck-through muted label for complete items versus a plain marker for incomplete ones
- Each section's show/hide toggle reads as an on/off switch by thumb position, not by color alone
- Friendly empty states: before any content exists the preview invites the user to start building rather than showing a blank page
- The Export package panel presents Portfolio JSON and Markdown resume as monospaced previews with Copy and Download controls — not a screenshot dead end; the bulk actions bar and command palette adopt the same spacing scale, radii, and accent as the builder chrome
</visual_design>

<motion>
- Buttons, theme swatches, section toggles, history entries, layout preset controls, and command palette results each show a visible hover state — a background, border, or shadow change — when the pointer is over them (hover feedback is required and is a common false done; do not omit it)
- Adding a project or testimonial animates the new card into the preview's grid or row, and deleting one animates it out rather than snapping instantly
- Adding a skill chip animates it into the Skills section, and a rejected duplicate produces no chip motion at all
- Using Move Up or Move Down animates the affected section to its new position in the preview through the real reorder controls
- Saving a draft animates the new entry into the drafts list and gives immediate transient feedback that the save succeeded — the new draft appears right away, or a brief confirmation message appears
- Selecting a theme recolors the preview's headings, chips, and accent text in place, and toggling Density visibly re-spaces the preview blocks, each without a reload
- Toggling a section's visibility updates the assembled preview immediately through the real editor controls
- Undo, Redo, Apply Scenario Change, and branch selection in the History panel update the visible preview through the panel's real controls; disabled Undo or Redo controls read as non-interactive
- Download PDF opens the browser's native print preview of the assembled document
- Copy export shows a brief confirmation that appears then reverts; Import success updates editor and preview without a reload; bulk Delete selected removes cards with the same exit motion as single deletes
- With prefers-reduced-motion set, list and reorder animations are removed and every state change still applies instantly
</motion>

<responsiveness>
- Responsive down to about 375px wide: the editor and preview stack into a single column with no horizontal page scrolling, and the preview's name heading, section headings, and the completeness count stay legible and reflow rather than clipping
- The testimonials row scrolls horizontally within its own container rather than overflowing the page, at every viewport width
- Export package tabs, the bulk actions bar, and the command palette remain fully visible and operable at about 375px rather than rendering off-screen
</responsiveness>

<accessibility>
- Keyboard Tab focus is visibly indicated on every interactive control, including form fields, theme swatches, section toggles, reorder buttons, bulk checkboxes, Export package controls, and command palette results
- Every editor control — form fields, Add and Delete controls, toggles, reorder buttons, theme swatches, Density, drafts controls, layout presets, bulk project checkboxes and bulk actions, Export package tabs/Copy/Download/Import, History panel, command palette, and Download PDF — is reachable and operable with the keyboard alone
- Inline validation, import errors, and duplicate-rejection messages render adjacent to the field or control they describe and name the offending field or contract rule; the transient save and copy confirmations are exposed to assistive technology as well as shown visually
- The command palette and Export package surfaces trap focus while open, close on Escape, and return focus to the control that opened them
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors appear during a full exercise of the builder — creating, editing, deleting, reordering, theming, saving and loading drafts, exporting and importing the portfolio package, and walking the history
- The primary content workflow stays exact and responsive under at least 25 rapid repetitions through its normal controls, without a blank screen, uncaught error, or sustained freeze
</performance>

<writing>
- Headings, buttons, and panel titles use one consistent capitalization convention throughout the app
- Empty states explain what belongs in the region and how to add it, and validation messages name the field and the fix including the field contract rule when validation fails (for example title length, status enum, schemaVersion, or email format); no placeholder or lorem text appears anywhere in the shipped UI
- Terminology for project, testimonial, draft, Export package, and Import stays consistent across the editor, preview, Completeness, and export surfaces
</writing>

<requirements>
Shared application state must live in Qwik stores: the content (profile, projects, skills, testimonials, contact), the section order and per-section visibility, the active theme and density, the saved drafts, the multi-select set, the Export package preview texts, and the transition history with its branches. A change made through any control must flow through these shared stores so the editor, the live preview, Completeness, and both export tabs update together without a reload.
Persistence is required: saved drafts and the current working content must survive a full page refresh by persisting to localStorage and restoring the exact committed state on reload. Guard storage access so the production build does not crash when storage is unavailable. A reload must not revive a draft that was deleted before the reload.
State contracts (behavioral, not storage keys):
- Editing a Profile Header, Contact, project, or testimonial field updates that same record in the preview everywhere it appears, and the created or edited record matches the corresponding field contract above
- Submitting the Add Project or Add Testimonial form adds exactly one card to the shared collection whose fields match the Project or Testimonial field contract; deleting one removes it from the preview; duplicate rapid submissions must not create duplicate records
- Adding a skill that case-insensitively duplicates an existing one is rejected with a visible inline message and adds no chip
- Section visibility toggles and Move Up / Move Down recompute the preview's rendered sections from the shared order and visibility state; they do not invent a second disconnected copy
- Selecting a theme or density updates shared client state and recolors or re-spaces only the preview, never reloading the document
- Saving a draft stores a named snapshot conforming to the Draft field contract; loading a draft replaces the current content, order, visibility, theme, and density with the draft's exact values; deleting a draft removes it from the list and it does not return after reload
- Edits to the content are recorded as explicit history transitions; Undo and Redo restore exact adjacent snapshots, invalid Undo or Redo is disabled, Apply Scenario Change and other changes made after an Undo create a selectable branch instead of flattening history, and selecting a branch restores that branch's exact visible state
- Print export uses the browser's native print flow: Download PDF calls window.print() against print-specific CSS (an @media print rule) that hides the editor chrome and shows only the assembled preview; there is no PDF-generation library
- Portfolio JSON export and Import compile and validate against the Portfolio JSON field contract; Markdown resume is derived from the same store; Copy and Download emit live-compiled text that reflects every mutation; Import round-trips a valid package back into the visible surfaces
Seeds and empty state: the app starts with no content and no drafts; the preview and lists show empty states until the user creates data.
Build tooling: a Vite single-page app built with Qwik, styled with Tailwind CSS 4.3.2 (pinned) via the Tailwind CSS Vite plugin, with design tokens declared in @theme. DaisyUI is the component library for the editor chrome — buttons, form controls, section toggles, chips, the drafts list, Export package, command palette, and confirmation feedback. AutoAnimate is allowed for animation; no other animation libraries. Iconify icons only, delivered through the @iconify/tailwind4 plugin as CSS icons, with one icon set used consistently. All forms — Add Project, Add Testimonial, the Skills input, Contact, Save As Draft, and Import paste when presented as a form — validate through a Valibot schema driven by Modular Forms for Qwik: the schema defines the rules and inline per-field errors appear before submit. Schemas are API-shaped: they model the payloads a real portfolio API would accept — the Profile, Project, Testimonial, Contact, Draft, and Portfolio JSON field contracts above — the record a form creates IS the would-be request body, and Portfolio JSON export/import use the same field names, enums, bounds, and cross-field rules. Field contracts are enforceable in the UI (named field errors), not only declared in schema code. All libraries are installed via npm and bundled locally; no CDN imports. No backend and no authentication. All controls act in-app with no outbound navigation.
Responsive: the layout reflows to a single column at about 375px wide with no horizontal page scrolling, and the testimonials row stays scrollable within its own container.
The useful end state is the portable portfolio package: Export package must produce Portfolio JSON and Markdown resume texts that contain the session's actual mutations and conform to the declared field contracts, with Copy and Download, and Portfolio JSON must round-trip through Import while remaining MCP-queryable.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
- Self-test tooling is preinstalled and optional to use: `playwright@1.61.0` and `@playwright/mcp` are installed globally with browsers ready under `/ms-playwright`, a shared headless Chrome already exposes CDP at `http://127.0.0.1:9222`, and the same CDP bridge the verifier runs is baked at `/opt/webmcp/webmcp_stdio_server.mjs`. Drive your served app through that Chrome (playwright `connectOverCDP`, or `npx @playwright/mcp --cdp-endpoint http://127.0.0.1:9222`), and run `node /opt/webmcp/webmcp_stdio_server.mjs` (stdio MCP; defaults to that endpoint) to exercise your registered `window.webmcp_*` tools exactly as the verifier will.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- structured-editor-v1
- entity-collection-v1
- artifact-transfer-v1

Module specs:
<module_spec id="structured-editor-v1">
{
  "id": "structured-editor-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Structured editor",
  "purpose": "Document, diagram, canvas, configuration, and property editors.",
  "permitted_operations": ["select", "add", "delete", "update_property", "set_content", "switch_mode", "preview"],
  "binding_keys": {
    "required_any_of": [["editor_operations"], ["editor_object_types"]],
    "optional": ["editor_properties", "editor_modes", "value_bounds", "visible_postconditions"]
  },
  "restrictions": [
    "No arbitrary coordinate, DOM, or storage mutation via WebMCP.",
    "Drag, resize, drawing, snapping, and keyboard movement remain Playwright-driven when mechanism matters."
  ],
  "tool_name_prefix": "editor"
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
- Editor object types: header; projects; skills; testimonials; contact; export-package
- Editor operations: select; update_property; switch_mode; preview
- Editor properties: name; title; bio; email; location; theme; density; visibility; order; status; featured
- Editor modes: compact; spacious
- Entity: portfolio-item
- Entity operations: create; select; update; delete
- Entity fields: project; testimonial; skill; draft
- Artifact operations: export; import; copy
- Export formats: portfolio-json; markdown-resume
- Import modes: portfolio-package
- Workflow completion: export package Portfolio JSON and Markdown resume previews reflect session mutations after create or edit
- Workflow completion: import of a valid portfolio-package restores editor, preview, theme, density, and section order

Mechanics exclusions:
- Undo/Redo/branch selection and History panel stay Playwright-driven via real controls
- Download PDF (window.print) stays Playwright-observed
- Horizontal testimonials scroll stays Playwright-observed
- Section reorder animation stays Playwright-observed when gesture matters
- Command palette keyboard navigation stays Playwright-observed
- Bulk-select checkbox gestures stay Playwright-observed
- File-picker Import and Blob download stay Playwright-observed; WebMCP must not return raw file/blob/base64 contents
- Raw file paths/blobs forbidden in WebMCP args

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
