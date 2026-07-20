<summary>
Build a storyboard getting-started tutorial using Preact, Signals, Tailwind CSS 4.3.2, and DaisyUI. The app produces the operator's portable storyboard artifact: a downloadable and copyable Storyboard JSON document (plus a Markdown shot list and a Printable outline) compiled live from the scenes collection, view mode, and derived duration rollup, conforming to the same API-shaped field contracts as create/edit forms, with Import that round-trips that JSON, and a Presenter mode that plays the board with per-scene timing.
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
Feature: Workspace shell —
- First load opens directly into the storyboard workspace — product header plus a multi-column scene grid — with no login, admin, or marketing gate
- The header shows a logo mark, a Demo Projects project label, the storyboard title 1. Getting Started, a kebab menu, and utility tools (notifications bell, dashboard, account) rendered with icons from one consistent icon set; clicking any inert header control raises a demo only toast instead of navigating
- The header also exposes Undo, Redo, Export, and Import controls; Undo and Redo stay visibly disabled when their stacks are empty
Feature: Seeded board —
- The board seeds at least 8 imaged scenes, each numbered with a thumbnail, an editable description (the Scene body field), a shot-type badge, and a duration readout in seconds; scene 1's body opens with the line Welcome to Docs! and later scenes carry sequential getting-started copy (header tools, view modes, three-dot menu, Add Scene)
- Beyond the imaged scenes the grid ends with at least 2 empty placeholder scenes showing a centered camera add-image affordance, followed by an Add Scene control pairing a primary button with a dropdown chevron
- A live Total duration readout in the nav bar equals the sum of every scene's duration in seconds and recomputes immediately when a scene is created, edited, deleted, or reordered
Feature: View modes —
- The storyboard nav bar exposes Tile, List, and Slide view toggles; the active toggle is visibly pressed and switching modes re-lays out the same scene set without reloading the document (switching may toast the mode name)
- Tile mode arranges scenes in a multi-column grid; List mode stacks the same scenes in a single vertical column; Slide mode collapses to one centered active scene with a previous/next control pair and an N / total scene counter
- In Slide mode, previous/next controls and the Left/Right arrow keys advance the centered scene and the counter tracks position
Feature: Scene field contract —
- Creating or editing a scene produces a Scene record that IS the would-be scene upsert request body a storyboard API would accept. Scene field contract (API-shaped create/update payload; all keys required; example values illustrative only; enforced with inline errors naming the offending field before submit, and with submit disabled until every field is valid):
  - title: required string of 1 to 80 characters after trim
  - body: required string of 1 to 500 characters after trim (UI label Description; stores and exports as body)
  - duration: required integer from 1 to 300 inclusive (seconds)
  - shotType: required closed enum wide / medium / close-up / insert / pov (UI labels Wide, Medium, Close-up, Insert, POV map to these values)
- Cross-field rules: values outside the closed shotType enum are invalid; a non-integer duration, a duration below 1 or above 300, or an empty/over-length title or body is invalid; invalid payloads create or update nothing
Feature: Create scene —
- Activating Add Scene opens a create form with required title, Description (body), duration, and shot-type fields matching the Scene field contract; the submit control stays disabled until every field is valid
- Typing an invalid or empty value in a create-form field shows an inline validation message directly under that field, naming the field, before any submit occurs
- Submitting a valid scene closes the form and shows the new scene on the board with its title, body, duration, and shot-type badge matching the submitted payload
Feature: Edit scenes —
- Focusing a scene description shows an edit affordance while editing; typing updates the body text in place; each scene also exposes edit controls for title, duration, and shot type that apply the same Scene field contract; drawers for notifications/account may remain inert demo chrome
Feature: Search and shot-type filter —
- The storyboard nav bar exposes a search field and a row of shot-type filter chips (All plus Wide, Medium, Close-up, Insert, POV); typing in search narrows the visible scenes to those whose title or body contains the query case-insensitively, selecting a shot-type chip narrows to scenes of that shot type, and using both together shows only scenes matching both
- While a search or filter is active, a filtered-count readout shows N of M scenes; the Tile, List, and Slide modes all show the same filtered subset (the Slide counter total equals the filtered count), while the Total duration readout keeps the sum over the full collection
- Clearing the search field and selecting All restores the full scene set exactly; when search and filter match nothing, the board shows a filtered-empty state naming that no scenes match with a Clear filters control that restores the full set
- Export always compiles from the full scenes collection regardless of any active search or filter
Feature: Multi-select and bulk actions —
- Each scene card exposes a selection checkbox; selecting two or more scenes reveals a bulk action bar with Delete selected and Duplicate selected controls; confirming bulk delete removes every selected scene at once, renumbers the remaining scenes sequentially with no gaps, and updates the Slide counter total and Total duration in one step
- Duplicate selected appends one copy of each selected scene at the end of the board in board order, each copy keeping the source's body, duration, and shot type with its title suffixed (copy); the board renumbers sequentially, Total duration increases by the sum of the duplicated durations, and the whole duplication is one undoable step
Feature: Reorder —
- Each scene exposes Move earlier and Move later controls (and drag-reorder on the card handle in Tile/List); moving a scene updates board order, renumbers sequentially, and keeps Total duration unchanged while the Slide sequence follows the new order
Feature: Undo and redo —
- Undo restores the previous scenes collection, selection, and derived Total duration after create, edit, delete, bulk delete, or reorder; Redo reapplies the undone mutation; both controls disable at empty stack ends; Ctrl+Z and Ctrl+Shift+Z (or Ctrl+Y) drive the same history; performing a new mutation after undo clears the redo branch
Feature: Presenter mode —
- A Present control in the storyboard nav bar starts a presentation of the board (the currently filtered subset, in board order): the workspace is replaced by a presenter view showing one scene at a time — image, number, title, body, and shot-type badge — with a visible countdown that starts at that scene's duration in seconds
- When a scene's countdown reaches zero the presenter auto-advances to the next scene and the countdown resets to the new scene's duration; Right and Left arrow keys (and visible next/previous controls) advance manually, resetting the countdown to the shown scene's duration
- A Pause control freezes the countdown in place and becomes Resume; resuming continues from the remaining time rather than restarting the scene
- The presenter shows a progress readout Scene N of total plus an overall progress bar that fills as the presentation advances through the total duration
- After the last scene's time elapses (or advancing past the last scene) the presenter shows a finished state with Restart and Exit controls instead of wrapping; End presentation and the Escape key exit at any point, returning to the previous view mode with the board, selection, and undo history intact
- With no scenes on the board (or an empty filtered subset), the Present control is disabled
Feature: Export center (useful end state) —
- An Export control opens a center or drawer with live previews of three formats compiled from the current store — Storyboard JSON, Markdown shot list, and Printable outline — with format tabs or section labels, plus Copy and Download on the active format
- Copy places the exact visible preview text on the clipboard and shows a transient Copied! confirmation; Download starts a real file download of that same text
- Storyboard JSON is a single StoryboardDocument object API-shaped like a storyboard upsert payload. Normative shape (all keys and nesting required; example values illustrative only; field names must be visible in the preview text): schemaVersion exactly storyboard-tutorial-v1; title (non-empty string, seeded as 1. Getting Started); viewMode exactly one of tile / list / slide matching the active toggle; totalDuration (non-negative integer equal to the sum of scene durations); scenes (array of Scene objects each with id, title, body, duration, shotType, and order). Array order of scenes is the board order; order is a 1-based integer with no gaps. The preview derives live from session state: after creating, editing, deleting, bulk-deleting, or reordering a scene, or switching view mode, reopening Export shows those values under the field-contract keys; an export that omits a session mutation is incorrect
- Markdown shot list is a human-readable document compiled from the same store: it names the board title, states the Total duration, and lists each scene in order with its number, title, shotType label, duration in seconds, and body — enough that a reader can reconstruct the board without opening the JSON
- Printable outline is a print-optimized one-page outline compiled from the same store: the board title and Total duration at the top, then one compact row per scene in board order with its number, title, shotType label, and duration in seconds; a Print control on the outline tab opens the browser print preview showing that outline layout; like the other formats it reflects every session mutation, and Copy and Download work on its text
Feature: Import storyboard —
- An Import control accepts pasted or file-picked Storyboard JSON matching the StoryboardDocument field contract. A valid import replaces the scenes collection, view mode, and derived Total duration so the UI and the next Export previews match the imported document without a reload. Malformed JSON, or JSON that fails the field contract (schemaVersion not storyboard-tutorial-v1, missing required keys, viewMode or shotType outside their closed sets, duration outside 1–300, empty title/body, duplicate or gapped order values), shows a visible inline error naming the offending field, leaves scenes and view mode unchanged, and rejects the whole document rather than applying a partial subset of scenes
Feature: Board navigation —
- A back-to-top control appears after the board is scrolled down and returns the board to the top
</core_features>

<user_flows>
- After creating a scene with a valid Scene field-contract payload via Add Scene, the scene count on the board increases by exactly one, the new scene appears numbered at the end of the grid in Tile mode with matching title, body, duration, and shot-type badge, Total duration increases by that scene's duration, and switching to List and then Slide shows the same new scene with the Slide N / total counter total increased by one — all without a reload
- Editing a scene's body, duration, or shot type in Tile mode and then switching to List and Slide shows the updated values on that same numbered scene in every mode without a reload, and Total duration reflects the new duration sum
- Deleting a scene removes its card from the board, renumbers the remaining scenes sequentially with no gaps, reduces the Slide counter total by one so the previous/next controls disable at the new first and last scene, and decreases Total duration by that scene's duration
- Selecting at least two scenes and confirming Delete selected removes every selected scene in one step, renumbers the survivors with no gaps, and updates Slide total and Total duration together
- Entering Slide mode and pressing the Right arrow repeatedly advances through every scene in order while the N / total counter increments each step; pressing Left walks back the same sequence
- After create, edit, or delete, Undo restores the prior board (scene set, numbering, and Total duration) and enables Redo; Redo reapplies the mutation; a new mutation after Undo disables Redo
- Mutation-to-export: after creating a scene with a distinctive title and duration, editing another scene's shot type, and switching to List, open Export — Storyboard JSON shows schemaVersion storyboard-tutorial-v1, viewMode list, those session values under the field-contract keys, and totalDuration equal to the live sum; the Markdown shot list names the same title, shot type, and duration; Copy on the active format shows a Copied! confirmation
- Export then import round-trip: after a board mutation, Download or Copy the Storyboard JSON, change the board further if desired, then Import that same document — scenes, view mode, and Total duration reconstruct to match the export, and the Export previews match the restored state without a reload
- Search and filter flow: creating a scene with a distinctive title and the POV shot type, typing a unique part of that title into search shows only that scene in Tile and List with the filtered count reading 1 of M; clearing search and selecting the POV chip shows only POV scenes including the new one; selecting All and clearing search restores the full set exactly, all without a reload
- Duplicate flow: selecting two scenes with known durations and activating Duplicate selected increases the scene count by exactly two, appends the copies at the end with (copy) titles, and increases Total duration by exactly the sum of the two durations; Undo removes both copies and restores the prior count and Total duration
- Presenter flow: activating Present shows the first scene with its countdown at that scene's duration; Pause freezes the remaining seconds and Resume continues from them; letting a short scene's countdown reach zero auto-advances to the next scene with Scene N of total incrementing; advancing past the last scene shows the finished state, and Exit returns to the previous view mode with the board unchanged
- Presenter timing follows the data: two scenes whose durations clearly differ show correspondingly different countdown lengths before auto-advance, and editing a scene's duration changes its countdown on the next presentation run
- Outline export flow: after creating a distinctive scene and reordering another, the Printable outline preview lists the session's scenes in the current board order with their numbers, titles, shot types, and durations, and the Print control opens a print preview of that outline
- A page reload returns the app to its seeded state: the seeded scenes, Tile mode active, the first slide position, no active search or filter, presenter closed, empty undo/redo stacks, and the seeded Total duration
</user_flows>

<edge_cases>
- Submitting the create form with an empty required title or body, a duration outside 1–300, or a missing shot type adds no scene: the visible scene count is unchanged and an inline validation message names the offending field
- Double-activating the create form's submit control adds exactly one scene: the count increases by one and one new card appears
- In Slide mode the previous control is disabled at the first scene and the next control is disabled at the last scene; arrow keys at the bounds do not wrap
- Deleting every scene leaves a visible empty-board state that explains the board is empty and offers a way to add a scene; Total duration shows 0
- With nothing to undo or redo, Undo and Redo stay disabled and Ctrl+Z / Ctrl+Y change nothing
- Bulk delete with fewer than two scenes selected does not show an enabled Delete selected action, or the control stays disabled
- Importing malformed Storyboard JSON, or JSON that fails the StoryboardDocument field contract, leaves scenes and view mode unchanged and shows a visible error naming the offending field — it must reject the whole document rather than applying a partial subset of scenes
- When search and shot-type filter together match no scene, the board shows a filtered-empty state naming that no scenes match with a Clear filters control; the Total duration readout still shows the full-collection sum
- With an empty board or an empty filtered subset, the Present control is disabled; starting a presentation is impossible rather than opening a blank presenter
- In the presenter, manual advance at the last scene and the last countdown reaching zero both land on the finished state — the presentation never wraps to the first scene
- The bulk action bar (Delete selected and Duplicate selected) appears only with two or more scenes selected; with fewer selected its actions are absent or disabled
</edge_cases>

<visual_design>
- Light workspace with a rounded geometric sans-serif UI face and yellow accent
- Top header: logo mark, Demo Projects + 1. Getting Started titles, kebab menu, utility tools, plus Undo, Redo, Export, and Import
- Storyboard nav bar with Tile / List / Slide toggles, a Present control, a search field, shot-type filter chips with the active chip visibly selected and a filtered-count readout while filtering, a live Total duration readout, and scene cards in a multi-column grid; imaged cards reveal a three-dot actions button on hover and show a shot-type badge plus duration seconds
- The presenter view is visually distinct from the board: one scene dominates the viewport with its number, title, body, and shot-type badge, a per-scene countdown, a Scene N of total readout, and an overall progress bar, with Pause/Resume, previous/next, and End presentation controls in a compact control strip
- Placeholder scenes render an empty tile with a centered camera add-image button; the trailing Add Scene control shows a primary button plus a dropdown chevron
- Welcome line Welcome to Docs!; product chrome density of a docs/storyboard app — not a marketing landing
- Slide mode presents a single centered scene with a previous/next control pair and an N / total counter
- Empty board state is visually clear when no scenes remain
- Multi-select checkboxes and the bulk action bar are visually distinct from scene content; selected cards show a clear selected treatment
- The Export center shows monospaced Storyboard JSON and Markdown shot list preview blocks plus a print-styled Printable outline preview, with clear format tabs or section labels and visible Copy and Download controls (and Print on the outline tab); the Import surface uses the same visual language for its paste or file area
- Buttons, toggles, and form fields show distinct default, hover, focus (visible ring), disabled, and error treatments
- Icons across the header, nav bar, and scene actions come from one visually consistent set at a consistent size
</visual_design>

<motion>
- Scene enter: on first load, scene cards stagger in with a short fade and slight upward settle
- Hover animations (required): scene cards ease upward with soft shadow; scene images brighten on hover; header and mode toggles ease background/press; per-scene actions may fade in on card hover
- View modes: Tile / List / Slide toggles re-layout the same scene set, and the cards animate to their new positions rather than snapping; switching modes may toast the mode name
- Slide mode: board collapses to a single centered active scene; prev/next advance the active scene with a brief transition
- List microinteractions: a newly created scene animates into the grid, a deleted scene animates out, and the remaining cards slide smoothly into their renumbered positions; bulk delete animates all removed cards out together
- Toasts (demo only, mode-name, and Copied!) slide in, remain readable, and auto-dismiss with a fade
- Description edit: focusing a scene description applies a soft yellow wash and dashed outline while editing
- The Export center and Import surface enter and exit with a brief opacity and scale transition of roughly 200 to 300 milliseconds
- Applying or clearing search and shot-type filters animates the affected cards out of and into the grid rather than snapping the layout
- Presenter: entering and exiting the presenter uses a brief transition, scene advances (manual or auto) transition with a short slide or fade, and the per-scene countdown and overall progress bar deplete or fill smoothly rather than jumping only in whole steps
- The back-to-top control scrolls the board smoothly to the top rather than jumping
- With prefers-reduced-motion set, entrance staggers and layout animations are removed and state changes apply instantly while every feature stays usable
</motion>

<responsiveness>
- At desktop widths Tile mode shows a multi-column grid; at widths of 768 pixels and below the grid reflows to fewer columns and the header condenses without losing the title, utility tools, or Export / Import
- At 375 pixel width no content clips or overflows the viewport and no horizontal scrolling appears in any view mode; the create form, Export center, Import surface, search field, filter chips, and bulk action bar remain readable and operable
- At 375 pixel width the presenter remains fully usable: the scene content, countdown, progress readouts, and Pause/Resume, previous/next, and End presentation controls stay visible and operable without horizontal scrolling
</responsiveness>

<accessibility>
- Every interactive control — header tools, Undo/Redo, Export/Import, view toggles, the search field, shot-type filter chips, Present, presenter controls, scene actions, create form, slide navigation, multi-select checkboxes, and bulk actions — is reachable and operable with the keyboard alone, with a visible focus indicator
- The search field carries a programmatically associated label, each shot-type filter chip exposes its selected state to assistive technology, and in the presenter the Escape key always exits while scene changes are announced through an aria-live polite region
- The active view toggle exposes its pressed state to assistive technology, not just visually
- Create-form and Import validation messages are announced via an aria-live polite region as well as shown inline
- Every scene thumbnail image carries descriptive alternative text
- Ctrl+Z, Ctrl+Shift+Z, and Ctrl+Y operate undo and redo from the keyboard without requiring pointer use
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear during a full exercise of the app (view switching, create, edit, delete, bulk delete, duplicate, undo/redo, slide navigation, search and filter, presenter runs, Export, Import, Print)
- Rapidly switching view modes, advancing slides, or typing quickly in the search field stays responsive with no hangs or dropped interactions
- A full presenter run across several scenes ticks its countdown and auto-advances without console errors, UI hangs, or layout jumps
- Total duration recomputes in place without layout jumps when scenes change
</performance>

<writing>
- Scene bodies carry the sequential getting-started tutorial copy as complete instructional sentences; no lorem ipsum or placeholder text appears anywhere in the shipped UI
- Headings, buttons, and toggles use one consistent capitalization convention throughout the app
- The empty-board state and validation messages name the problem and the fix in plain language; field-contract errors name the offending field (title, body, duration, shotType, schemaVersion, viewMode, or order)
- Export and Import labels use specific verbs (Export, Import, Copy, Download, Print) rather than generic OK or Go
- Presenter and filter controls use specific labels (Present, Pause, Resume, End presentation, Clear filters); the filtered-empty state explains that no scenes match and how to clear the search or filter
</writing>

<innovation>
Optional enhancements the builder may add, none required for a passing build: a brief coachmark that points at Export after the first scene edit; a rehearsal summary after a completed presenter run (for example total time presented or per-scene overrun cues); keyboard multi-select with Shift+click range selection.
</innovation>

<requirements>
Shared application state must use Signals, the state library named in summary (in-memory only): scenes collection, view mode, slide index, selection set, search query, active shot-type filter, presenter state (open, current scene, remaining seconds, paused flag), undo/redo stacks, drawers/toast, edit focus, export preview text, and import draft. Views derive from that one shared store — never a second disconnected copy; the presenter countdown and filtered subsets derive from the same store as the board. Do not use localStorage, sessionStorage, or other browser storage APIs. A page reload returns the seeded board; the portable end-state artifact is the Storyboard JSON (with Markdown shot list and Printable outline) export; MCP artifact tools expose the same export/import/print surfaces.
State contracts (behavioral, not storage keys):
- Creating a valid scene increases the collection and shows it on the board with title, body, duration, and shotType
- Editing a scene updates that same record in Tile/List/Slide and recomputes Total duration
- Deleting or bulk-deleting scenes removes them from the board, renumbers as needed, and updates slide bounds and Total duration
- Reordering changes board order and Slide sequence without changing Total duration
- Undo/redo step through scene-collection snapshots; a new mutation after undo clears redo
- View mode and slide index are shared client state; switching modes does not reload the document
- Search and shot-type filter recompute the visible subset from the shared collection without mutating it; Total duration stays the full-collection sum while filtering
- Presenter playback derives from the shared collection: countdowns come from each scene's duration, pause/resume operates on remaining time, and exiting restores the prior view mode without losing state
- Storyboard JSON export is compiled live from the store and must include schemaVersion storyboard-tutorial-v1 plus every session mutation under the field-contract keys; the Markdown shot list and Printable outline compile from the same store; Import of a valid document reconstructs the same visible board; schema-invalid imports reject without mutating state
Stack: Preact + Signals + Tailwind CSS 4.3.2 (pinned; Vite or equivalent SPA); frontend-only. DaisyUI is the component library for buttons, toggles, dropdowns, toasts, form controls, dialogs, Export center, Import, and the empty state; no other component libraries. AutoAnimate allowed for animation (scene add/remove/renumber, bulk delete, and view-mode re-layout); no other animation libraries. Iconify icons only (via @iconify/tailwind4 or unplugin-icons), one set used consistently; no raw pasted SVGs and no icon CDN. All forms — scene create/edit and Storyboard JSON import — validate through a Zod or Valibot schema driven by a form library (React Hook Form via preact/compat, or TanStack Form), rendering inline per-field errors before submit. Those schemas model the Scene and StoryboardDocument field contracts above: the record a successful create or edit produces IS that request-body payload, and Storyboard JSON export plus a successful import conform to the same field names, enums, bounds, and cross-field rules. Gabarito bundled locally (@fontsource or vendored woff2); no font CDNs. All libraries installed via npm and bundled locally; no CDN imports.
- Seed at least eight imaged scenes plus at least two camera placeholder scenes and a trailing Add Scene control; each seeded imaged scene carries a valid duration and shotType, and the seeded shot types span at least three of the five enum values so filtering is non-trivial
- Slide mode advances via previous/next controls and Left/Right arrow keys, tracks position with an N / total counter, and disables the controls at the first and last scene
- Empty or out-of-contract fields on create must not increase the scenes count; show visible validation feedback
- After deleting all scenes, show an empty state on the board with Total duration 0
- Zero navigational outbound links; inert controls toast demo only
- Document title 1. Getting Started — Docs; welcome line Welcome to Docs!
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
- form-workflow-v1
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
- Browsable entity: scenes
- Destinations: scene-list; scene-editor; tutorial-steps; export-center
- Entity: scene
- Entity operations: create; select; update; delete; reorder; toggle
- Entity fields: title; body; duration; shot-type
- Form fields: title; body; duration; shot-type
- Form operations: validate; submit; cancel; advance; return
- Workflow steps: intro; edit; review
- Artifact operations: export; import; copy
- Export formats: json; markdown
- Import modes: storyboard-json

Mechanics exclusions:
- Raw file paths/blobs forbidden in WebMCP args
- Scene drag-reorder gesture mechanics stay Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
