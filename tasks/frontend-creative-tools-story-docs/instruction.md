<summary>
Build a storyboard getting-started tutorial using Astro with React islands, Nanostores, Tailwind CSS 4.3.2, and DaisyUI. The app produces the writer's portable storyboard documentation: a compiled Markdown document, a compact outline, and a re-importable StoryboardPackage JSON, all compiled live from the scenes collection and conforming to the same API-shaped field contracts as the create/edit forms, with Import that round-trips the JSON, per-scene markdown notes with live checklists, scene version history with diff and restore, a freeform card-sorting canvas, and a template injector.
</summary>

<reference_screenshots>
Screenshots of the reference application are provided in-container at
/reference-screenshots/: overview.png is a full-page desktop-layout
overview (downscaled); overview-tablet.png and overview-mobile.png are full-page responsive
reflows at 1024x768 (tablet) and 390x844 (mobile) viewports; segment-NN.png are full-resolution 1440x900 sections
in top-to-bottom order with slight overlap. They are part of this instruction:
recreate what they show. Where a screenshot and the text conflict, the text
wins. Do not copy the images into /app or ship them as app assets.
</reference_screenshots>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
Feature: Direct tutorial entry —
- First load opens the storyboard workspace directly (header + left storyboard nav + scene grid); no login or admin gate appears at any point
Feature: Product header —
- The header shows a logo mark, the project label Demo Projects, the storyboard title 1. Getting Started, a kebab menu, and inert utility tools (notifications bell, dashboard, account) that toast demo only instead of navigating
Feature: Left sidebar —
- The sidebar lists the active Getting Started row plus sibling demo storyboards, an Add Storyboard control, and a footer Help control; every sidebar row is inert and toasts demo only on click
Feature: Scene collection —
- The board seeds at least 8 imaged scenes; each scene shows a number, a title/description, an image, an optional camera note, a status badge (draft, review, or ready), and a per-scene kebab menu with edit and delete actions
- Clicking Add Scene opens a create form with the scene fields; submitting a valid scene adds it to the board
- A scene's description can be focused and edited in place, and the edited text is what the board shows afterward
- The per-scene kebab menu's delete action removes that scene from the board
Feature: Scene create/edit field contract —
- The create form and the edit form submit exactly this payload; the record a successful create/edit produces IS the would-be scene API request body; export and import share this scene object shape. All keys required unless marked optional; example values are illustrative only:
  - title: trimmed non-empty string, length 2 to 80
  - body: trimmed non-empty string, length 8 to 2000 (the scene description shown on the board)
  - cameraNote: optional trimmed string, length at most 200 when present; empty string is treated as absent
  - status: exactly one of draft, review, ready (closed enum; default draft on create when omitted from the form default)
  - order: integer greater than or equal to 1 reflecting board position after renumber; the app assigns the next contiguous order on create
  - Cross-field: whitespace-only title or body is rejected as empty; status outside the closed enum is rejected; when cameraNote is present and longer than 200 characters it is rejected with an inline error naming cameraNote. Invalid create/edit shows inline errors naming the offending field, keeps submit disabled until valid, and leaves the scene count unchanged
Feature: Markdown notes with checklists —
- Scene bodies are markdown source: rendered scene cards and the active slide show headings, bold text, and bullet lists formatted rather than as raw markup
- Checklist lines in a body (- [ ] and - [x]) render as real checkboxes; clicking a rendered checkbox toggles it and updates the stored body source, and a per-scene checklist progress readout (for example 2/5) appears on every scene whose body contains a checklist and updates immediately on toggle
- Checkbox toggles update the current scene body without creating a version snapshot
Feature: View modes —
- The storyboard nav bar offers Tile, List, Slide, and Canvas toggles; Tile and List re-lay the same scene set as a card grid and a stacked list respectively
- Slide mode collapses the board to a single centered active scene with prev and next controls that advance the active scene
- Canvas mode is a freeform card-sorting tabletop: every scene renders as a draggable card on an open surface; dragging moves only that card and its position is kept while the session lasts, including when switching to another mode and back; canvas positions never change board order, numbering, or each scene's order field; a Reset layout control returns the cards to a tidy grid arrangement
Feature: Status filter and search —
- A status filter control offers All plus draft, review, and ready; selecting a status hides scenes whose status does not match; All restores the full set
- A search control filters the board by case-insensitive substring match against title or body; clearing search restores the prior filtered set
- Tile, List, and Slide all show the same filtered subset and the same count
Feature: Scene reorder —
- Scenes can be reordered by drag on the Tile or List board; after a successful reorder the visible numbers renumber contiguously from 1 and each scene's order field matches its new position; Slide prev/next follows the new order without a reload
Feature: Undo and redo —
- After a create, edit, delete, status change, reorder, version restore, or template injection, an Undo control restores the previous board state (same scene count, titles/bodies, statuses, and order); Redo re-applies the undone mutation; both leave Tile/List/Slide consistent without a reload
Feature: Scene version history with diff —
- Every committed create or edit of a scene's title, body, cameraNote, or status appends a version snapshot with a timestamp to that scene's history (the create is version 1); a version history action on the per-scene kebab menu opens a Version history panel for that scene listing its versions newest first with their timestamps
- Selecting an older version shows a diff against the current scene: added text is marked as an addition and removed text as a removal, each carrying a visible plus or minus mark as well as color
- A Restore control on an older version makes that version's content the current scene (recorded as a new version); the board, slide view, and export previews show the restored content everywhere without a reload
- Comparing a version with itself, or a version identical to the current scene, shows an explicit no-differences state; a scene with only one version shows no Restore action (or a disabled one)
Feature: Template injector —
- A Templates control lists at least two named scene templates (for example Feature Walkthrough and Release Announcement), each showing its scene count; injecting a template appends all of that template's scenes — each valid under the scene field contract with status draft — to the end of the board in one atomic step, renumbering contiguously, with a toast naming the template and the number of scenes added; a single Undo removes the entire injection
Feature: Command palette —
- A Command palette control (and the keyboard chord Ctrl/Cmd+K) opens a searchable command list with at least: Add Scene, Export storyboard, Switch to Tile, Switch to List, Switch to Slide, Undo, and Redo; activating a command runs the same handler as the matching visible control and closes the palette
Feature: Scene copy —
- Scene descriptions carry tutorial copy about the product itself: header tools, notifications, view modes, scene menus, and add-scene flows
Feature: Export drawer and schema-mirrored artifacts —
- An Export control opens the export drawer with three live-derived format tabs (markdown, json, outline) plus Download and Copy for the active tab. Every tab regenerates from the current scenes collection without a reload; creating, editing, deleting, reordering, or changing status updates all three artifacts. Download and Copy emit the visible text; Copy shows visible confirmation (icon swap or toast). Format contracts (field names and tokens visible in the preview text):
  - markdown: a compiled document whose headings include each scene's order number and title, with the scene's body markdown under each heading verbatim (including checklist marks - [ ] / - [x] in their current toggled state), status noted per scene, and the camera note when present; a session-created or edited scene's title and body must appear
  - json: a StoryboardPackage object with REQUIRED keys schemaVersion (number exactly 1), project (exactly the string Demo Projects), storyboard (exactly the string 1. Getting Started), scenes (array of scene request-body objects in board order, each conforming to the create/edit field contract including title, body, status, and order; cameraNote present only when set), and generatedAt (ISO-8601 datetime ending in Z). All keys and nesting are REQUIRED unless marked optional; example values are illustrative only
  - outline: a plain indented outline listing each scene as order. title — status on its own line in board order
  - An export that omits a session create/edit/delete/reorder/status change, a checkbox toggle, a version restore, or a template injection is invalid. Version histories and canvas positions are session-local working state and are not part of any export format
Feature: Import storyboard-json round-trip —
- Import accepts a previously exported StoryboardPackage JSON (file pick or paste). A valid import replaces the scenes collection so Tile/List/Slide counts, titles/bodies/statuses/order, and a fresh export match the imported document without a reload. Malformed JSON, schemaVersion other than 1, project not exactly Demo Projects, storyboard not exactly 1. Getting Started, or any scene object that fails the create/edit field contract shows a visible error naming the offending field (or that the package is invalid) and changes nothing; each successfully imported scene starts a fresh version history at version 1
Feature: Inert chrome —
- Every non-navigational control toasts demo only instead of leaving the page; the app has zero outbound navigation
- Right drawers for notifications and account/storyboards open as demo chrome with seeded rows
</core_features>

<user_flows>
End-to-end flows with tracked state (every step names its visible evidence):
- Create flow: submitting a valid new scene from Add Scene closes the create form, adds exactly one new card to the board so the visible scene count increases by one, assigns the next scene number in sequence with status draft (unless another valid status was chosen), and switching to List mode and then Slide mode shows the same new scene without a reload, with the slide prev/next range extended to include it
- Edit flow: editing a scene's description in Tile mode updates that same scene's text, then switching to List mode shows the edited text on the same record and Slide mode shows the edited text when that scene is the active slide, all without a reload
- Delete flow: deleting a scene through its kebab menu removes its card, decreases the visible scene count by one, renumbers the remaining scenes so numbering stays contiguous, and shrinks the Slide-mode range so prev/next never lands on the deleted scene
- View-mode flow: toggling Tile to List to Slide and back re-lays the same scene set with an identical scene count in each mode; switching modes never reloads the document, and switching may toast the mode name
- Filter/search flow: set status to review so only review scenes remain, then type a unique substring from one remaining title into search; the board shows only that match across Tile/List/Slide; clearing search and setting status to All restores the full seeded-plus-session set without a reload
- Reorder flow: drag a middle scene above the first scene in Tile or List; confirm numbers renumber contiguously, the moved scene's title is now first, and Slide prev/next walks the new order
- Undo/redo flow: create a valid scene, confirm count increased by one, activate Undo and confirm the scene is gone and the count restored, activate Redo and confirm the same scene returns with the same title
- Command-palette flow: open the palette with Ctrl/Cmd+K, run Switch to List, confirm List mode is active; run Add Scene and confirm the create form opens
- Export session flow: create a valid scene with a unique title, open Export, confirm markdown/json/outline previews include that title (and the json scenes array entry matches the field contract), Download or Copy the active format, then delete the scene and confirm the next export omits it
- Import round-trip flow: export the json package after a create, note the scenes length, delete scenes to diverge, Import the JSON, and confirm the collection count, Tile/List/Slide contents, and a fresh export reconstruct to match the imported package
- Checklist flow: on a scene whose body contains a checklist, click an unchecked rendered checkbox — the box checks, the scene's checklist progress readout increments by one, and the next markdown export shows that line as - [x]; toggling it back restores - [ ] and the prior readout
- Version flow: edit a scene's body twice with distinct texts, open its Version history — three versions list newest first with timestamps; selecting version 1 shows the removed and added text marked with minus and plus; Restore on version 1 makes its body current on the board and in Slide mode, and the next markdown and json exports carry the restored body
- Canvas flow: switch to Canvas, drag one card to a clearly different spot, switch to List and confirm numbering and order are unchanged, switch back to Canvas and confirm the card kept its dragged position; Reset layout returns all cards to a tidy grid
- Template flow: note the scene count, inject a named template — the count increases by exactly that template's scene count, the new scenes appear at the end with status draft and contiguous numbers, a toast names the template and count, the next json export includes them, and a single Undo removes the whole injection
- Reload baseline: reloading the page returns the app to its seeded state — the seeded scenes with their seeded version histories, Tile mode, All status, empty search, default canvas layout, and slide index at the first scene — because all state is in-memory
</user_flows>

<edge_cases>
- Submitting the create form with a required field (title/body) empty, a title shorter than 2 characters, a body shorter than 8 characters, or a status outside draft/review/ready adds no scene: the scene count is unchanged and an inline validation message names the empty or invalid field; the submit control stays disabled until the required fields are valid
- Double-activating a valid create submit adds exactly one scene: the count increases by one and one new card appears
- After deleting the last remaining scene the board shows a clearly visible empty state with a message and an Add Scene path back into the create flow
- In Slide mode the prev control is disabled on the first scene and the next control is disabled on the last scene; neither wraps around
- Deleting the scene currently shown in Slide mode moves the active slide to a valid neighboring scene rather than showing a blank slide
- When the status filter or search matches nothing, the board shows an empty filtered state explaining that no scenes match and how to clear the filter or search
- Importing malformed StoryboardPackage JSON, schemaVersion other than 1, project other than Demo Projects, storyboard other than 1. Getting Started, or a scene that fails the create/edit field contract leaves the collection unchanged and shows a visible error naming the problem
- Undo with no prior mutation leaves the board unchanged; Redo with nothing undone is a no-op (controls disabled or inert with no board change)
- A scene with a single version shows no enabled Restore action, and comparing identical versions shows the explicit no-differences state rather than an empty or broken diff
- Toggling a rendered checkbox never creates a version snapshot and never changes the scene count or order
- Dragging a card on the Canvas never renumbers scenes or changes any scene's order field; template injection is atomic — a template whose scenes cannot all be added adds none
</edge_cases>

<visual_design>
- Light workspace with Gabarito UI type and yellow accent
- Top header: logo mark, Demo Projects + 1. Getting Started titles, kebab menu, utility tools
- Left storyboard sidebar listing the current and sibling storyboards with an Add Storyboard control and a footer Help control
- Storyboard nav bar with Tile / List / Slide / Canvas toggles and a Templates control; scene cards in a multi-column grid; status badges, checklist progress readouts, and filter/search controls sit in the board chrome
- Canvas mode reads as a tabletop: an open work surface visually distinct from the Tile grid, scene cards with a lifted shadow while dragging, and a visible Reset layout control
- The Version history panel lists versions with timestamps and shows diffs with green-tinted additions and red-tinted removals, each prefixed with a plus or minus mark so the change reads without color
- Welcome line Welcome to Docs!; product chrome density of a docs/storyboard app — not a marketing landing
- Icons come from one consistent icon set used across header tools, kebab menus, view-mode toggles, and drawers
- Empty board state is visually clear when no scenes remain; filtered-empty state is distinct from the fully empty board
- Export drawer presents format tabs (markdown, json, outline) and a monospace code preview; command palette reads as a centered overlay list
- Component states: buttons, toggles, and form fields show distinct default, hover, focus (visible ring), disabled, and error treatments
</visual_design>

<motion>
- Scene enter: on first load, scene cards stagger in with a short fade and slight upward settle
- Scroll reveals: on a fresh load, scene cards below the fold reveal with a short fade and rise as they scroll into view
- Hover animations (required): scene cards ease upward with soft shadow; scene images brighten on hover; header and mode toggles ease background/press; per-scene actions may fade in on card hover
- List microinteractions: a newly created scene card animates into place, a deleted card animates out while the remaining cards ease into their new positions and numbers, and the same applies in List mode; reorder settles cards into their new slots rather than snapping
- View modes: Tile / List / Slide toggles re-layout the same scene set with a brief transition; switching modes may toast the mode name
- Slide mode: board collapses to a single centered active scene; prev/next advance the active scene with a short slide/fade transition
- Description edit: focusing a scene description applies a soft yellow wash and dashed outline while editing
- Toasts: demo-only and feedback toasts slide in, remain readable, and auto-dismiss with a fade
- Drawers: the notifications, account, and export drawers slide in from the right and slide out on close; the command palette opens with a brief fade rather than a hard cut; the Version history panel slides or fades in rather than snapping
- Canvas: a dragged card lifts with a shadow while dragging and settles into place on release; Reset layout eases the cards back to the grid rather than teleporting
- Checklist checkboxes tick with a brief transition, and template-injected scenes animate into the board rather than appearing in a single frame
- With prefers-reduced-motion set, staggers, reveals, and card transitions are removed and state changes apply instantly while every feature stays reachable
</motion>

<responsiveness>
- At desktop widths the left sidebar is open beside the scene grid; at widths of 1024 pixels and below it collapses behind a toggle that opens it as an overlay drawer
- The scene grid steps down from multiple columns at desktop widths to fewer columns at tablet widths and a single column at 375 pixel width
- No content clips or overflows the viewport and no horizontal scrolling appears at 375 pixel width; header tools and view-mode toggles remain reachable at every width
- At 375 pixel width Export, Import, Command palette, Undo/Redo, status filter, and search remain reachable and operable without overlay clipping
- At 375 pixel width the Canvas view, Templates control, and Version history panel remain usable without horizontal page scrolling; the version diff wraps or scrolls inside its own panel
</responsiveness>

<accessibility>
- Every interactive control (header tools, sidebar rows, view-mode toggles, kebab menus, create/edit fields, filter/search, Undo/Redo, Export/Import, command palette, drawer and slide controls) is reachable and operable with the keyboard alone, with a visible focus indicator
- Per-scene kebab menus open as keyboard-operable menus: arrow keys move between the edit and delete items and Escape closes the menu
- The create form's inline validation messages and import errors are announced through a polite live region as well as shown visually
- Open drawers and the command palette can be dismissed with Escape and return focus to the control that opened them; focus is trapped while they are open
- Scene images carry descriptive alt text; icon-only controls carry accessible labels
- Status badges are not color-only: each badge includes the status word draft, review, or ready
- Rendered checklist checkboxes are real keyboard-operable controls; the Version history panel and its Restore controls are keyboard reachable, and diff additions/removals carry plus and minus text marks rather than color alone
- Template injection announces its result (template name and scene count) through a polite live region as well as a toast
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of the app, including no hydration errors or warnings on the workspace route
- The workspace renders its content directly on load with no post-load content flash or visible layout jump as fonts and scene images finish loading; image regions hold their space
- Rapid view-mode switching, filter/search changes, and repeated create/delete/undo/export actions stay responsive with no hangs or dropped interactions
- Checklist toggles, canvas card drags, version diff rendering, and template injection complete without console errors, hangs, or dropped updates
</performance>

<writing>
- Scene tutorial copy reads as clear instructional sentences that teach the product's own features; no lorem ipsum, TODO, or placeholder text appears anywhere in the shipped UI
- Headings, buttons, and toasts use one consistent capitalization convention; demo-only toasts use consistent wording across all inert controls
- The empty board state explains that no scenes remain and how to add one; the filtered-empty state explains that no scenes match and how to clear filters
- Validation and import errors name the field and the fix
- Version timestamps use one consistent format throughout the Version history panel; checklist progress readouts use one consistent n/m format; template names and their toasts use the same wording in the Templates list and the confirmation
</writing>

<requirements>
Stack: Astro with static output; the interactive workspace regions (header tools, sidebar, scene board, drawers, create/edit forms, export drawer, command palette) are client islands built with React. All interactivity lives in client state after load; no server actions, loaders, or API routes.
Shared application state must live in Nanostores (in-memory only), shared across all islands: the scenes collection, per-scene version histories, canvas card positions, view mode, slide index, status filter, search query, undo/redo stacks, drawers/toast state, export artifact text, command-palette open state, and edit focus. Views derive from the one store — never a second disconnected copy. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a valid scene increases the collection and shows it on the board
- Editing a scene updates that same record in Tile/List/Slide
- Deleting a scene removes it from the board, renumbers as needed, and updates slide bounds
- Status filter and search recompute the visible subset from the shared collection; Tile/List/Slide agree on that subset
- Reorder updates order fields and renumbers contiguously; Undo/Redo restore prior collection snapshots
- View mode and slide index are shared client state; switching modes does not reload the document
- Rendered markdown (headings, bold, lists, checkboxes) derives from each scene's body source; toggling a rendered checkbox rewrites that line in the body source and updates the progress readout from the same store
- Version histories append on committed create/edit/restore (never on checkbox toggles); Restore writes a new current version and every surface follows
- Canvas positions are per-scene view state that never feeds numbering, order fields, or exports; template injection appends contract-valid scenes atomically and is one undo step
- End-state contract: Download/Copy of markdown, json, and outline MUST reflect the session's actual scenes under the field contracts above — an export that omits session work is invalid; Import of a previously exported StoryboardPackage MUST restore the same visible collection (round-trip). Persistence for this good-app genre is the portable StoryboardPackage plus the MCP query surface — never browser storage
Styling: Tailwind CSS 4.3.2 (pinned), with design tokens in the theme layer. DaisyUI is the component library for base chrome — buttons, kebab dropdown menus, drawers, toasts, and form controls — restyled with the app's own light/yellow tokens.
Animation: GSAP allowed for animation (load stagger, scroll reveals, card and view-mode microinteractions, canvas drag settle); no other animation libraries.
Markdown: a markdown parsing/rendering utility library (for example marked or markdown-it) is allowed for rendering scene bodies and compiling the markdown export; no other additions to the allowlist.
Icons: Remix Icon via the astro-icon package only; no other icon sets, no raw copy-pasted SVGs, no icon CDN.
Forms: the Add Scene create form, the scene edit flow, and Import package validation are driven by React Hook Form with a Zod schema — schemas are API-shaped and mirror the field contracts above (the record each form creates IS the would-be request body; markdown/json/outline exports and Import package conform to those same contracts). The schema defines the required-field rules and the form surfaces inline per-field errors naming the field before submit, with submit disabled until valid.
All libraries installed via npm and bundled locally; no CDN imports. Local Gabarito fonts bundled in /app; no font CDN.
- Seed at least eight imaged scenes plus placeholders/Add Scene; seeded statuses span draft, review, and ready, at least two seeded bodies contain markdown checklists with a mix of checked and unchecked items, and each seeded scene starts with a one-entry version history
- Ship at least two local named scene templates for the Templates control, each with at least three contract-valid scenes
- Empty required fields on create must not increase the scenes count; show visible validation feedback
- After deleting all scenes, show an empty state on the board
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
- Self-test tooling is preinstalled and optional to use: `playwright@1.61.0` and `@playwright/mcp` are installed globally with browsers ready under `/ms-playwright`, a shared headless Chrome already exposes CDP at `http://127.0.0.1:9222`, and the same CDP bridge the verifier runs is baked at `/opt/webmcp/webmcp_stdio_server.mjs`. Drive your served app through that Chrome (playwright `connectOverCDP`, or `npx @playwright/mcp --cdp-endpoint http://127.0.0.1:9222`), and run `node /opt/webmcp/webmcp_stdio_server.mjs` (stdio MCP; defaults to that endpoint) to exercise your registered `window.webmcp_*` tools exactly as the verifier will.
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
- Destinations: scene-list; scene-detail; tutorial-steps; export-drawer; command-palette
- Filters: status; search
- Entity: scene
- Entity operations: create; select; update; delete; toggle; reorder
- Entity fields: title; body; cameraNote; status; order
- Form fields: title; body; cameraNote; status
- Form operations: validate; submit; cancel; advance; return
- Workflow steps: intro; edit; review
- Artifact operations: export; import; copy
- Export formats: markdown; json; outline
- Import modes: storyboard-json

Mechanics exclusions:
- Scene drag-reorder gesture geometry stays Playwright-observed
- Command-palette keyboard shortcut chord stays Playwright-observed
- Raw file paths/blobs forbidden in WebMCP args

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
