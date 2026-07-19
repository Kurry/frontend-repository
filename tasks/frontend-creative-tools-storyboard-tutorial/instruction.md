<summary>
Build a storyboard getting-started tutorial using Preact, Signals, Tailwind CSS 4.3.2, and DaisyUI.
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
Feature: Seeded board —
- The board seeds at least 8 imaged scenes, each numbered with a thumbnail and an editable description; scene 1's description opens with the line Welcome to Docs! and later scenes carry sequential getting-started copy (header tools, view modes, three-dot menu, Add Scene)
- Beyond the imaged scenes the grid ends with at least 2 empty placeholder scenes showing a centered camera add-image affordance, followed by an Add Scene control pairing a primary button with a dropdown chevron
Feature: View modes —
- The storyboard nav bar exposes Tile, List, and Slide view toggles; the active toggle is visibly pressed and switching modes re-lays out the same scene set without reloading the document (switching may toast the mode name)
- Tile mode arranges scenes in a multi-column grid; List mode stacks the same scenes in a single vertical column; Slide mode collapses to one centered active scene with a previous/next control pair and an N / total scene counter
- In Slide mode, previous/next controls and the Left/Right arrow keys advance the centered scene and the counter tracks position
Feature: Create scene —
- Activating Add Scene opens a create form with a required title and a required description field; the submit control stays disabled until both fields are valid
- Typing an invalid or empty value in a create-form field shows an inline validation message directly under that field, naming the field, before any submit occurs
- Submitting a valid scene closes the form and shows the new scene on the board
Feature: Edit scenes —
- Focusing a scene description shows an edit affordance while editing; typing updates the description text in place; drawers for notifications/account may remain inert demo chrome
Feature: Board navigation —
- A back-to-top control appears after the board is scrolled down and returns the board to the top
</core_features>

<user_flows>
- After creating a scene with a valid title and description via Add Scene, the scene count on the board increases by exactly one, the new scene appears numbered at the end of the grid in Tile mode, and switching to List and then Slide shows the same new scene with the Slide N / total counter total increased by one — all without a reload
- Editing a scene's description in Tile mode and then switching to List and Slide shows the updated text on that same numbered scene in every mode without a reload
- Deleting a scene removes its card from the board, renumbers the remaining scenes sequentially with no gaps, and reduces the Slide counter total by one so the previous/next controls disable at the new first and last scene
- Entering Slide mode and pressing the Right arrow repeatedly advances through every scene in order while the N / total counter increments each step; pressing Left walks back the same sequence
- A page reload returns the app to its seeded state: the seeded scenes, Tile mode active, and the first slide position
</user_flows>

<edge_cases>
- Submitting the create form with an empty required title or description adds no scene: the visible scene count is unchanged and an inline validation message names the empty field
- Double-activating the create form's submit control adds exactly one scene: the count increases by one and one new card appears
- In Slide mode the previous control is disabled at the first scene and the next control is disabled at the last scene; arrow keys at the bounds do not wrap
- Deleting every scene leaves a visible empty-board state that explains the board is empty and offers a way to add a scene
</edge_cases>

<visual_design>
- Light workspace with a rounded geometric sans-serif UI face and yellow accent
- Top header: logo mark, Demo Projects + 1. Getting Started titles, kebab menu, utility tools
- Storyboard nav bar with Tile / List / Slide toggles; scene cards in a multi-column grid; imaged cards reveal a three-dot actions button on hover
- Placeholder scenes render an empty tile with a centered camera add-image button; the trailing Add Scene control shows a primary button plus a dropdown chevron
- Welcome line Welcome to Docs!; product chrome density of a docs/storyboard app — not a marketing landing
- Slide mode presents a single centered scene with a previous/next control pair and an N / total counter
- Empty board state is visually clear when no scenes remain
- Buttons, toggles, and form fields show distinct default, hover, focus (visible ring), disabled, and error treatments
- Icons across the header, nav bar, and scene actions come from one visually consistent set at a consistent size
</visual_design>

<motion>
- Scene enter: on first load, scene cards stagger in with a short fade and slight upward settle
- Hover animations (required): scene cards ease upward with soft shadow; scene images brighten on hover; header and mode toggles ease background/press; per-scene actions may fade in on card hover
- View modes: Tile / List / Slide toggles re-layout the same scene set, and the cards animate to their new positions rather than snapping; switching modes may toast the mode name
- Slide mode: board collapses to a single centered active scene; prev/next advance the active scene with a brief transition
- List microinteractions: a newly created scene animates into the grid, a deleted scene animates out, and the remaining cards slide smoothly into their renumbered positions
- Toasts (demo only and mode-name) slide in, remain readable, and auto-dismiss with a fade
- Description edit: focusing a scene description applies a soft yellow wash and dashed outline while editing
- The back-to-top control scrolls the board smoothly to the top rather than jumping
- With prefers-reduced-motion set, entrance staggers and layout animations are removed and state changes apply instantly while every feature stays usable
</motion>

<responsiveness>
- At desktop widths Tile mode shows a multi-column grid; at widths of 768 pixels and below the grid reflows to fewer columns and the header condenses without losing the title or utility tools
- At 375 pixel width no content clips or overflows the viewport and no horizontal scrolling appears in any view mode
</responsiveness>

<accessibility>
- Every interactive control — header tools, view toggles, scene actions, create form, slide navigation — is reachable and operable with the keyboard alone, with a visible focus indicator
- The active view toggle exposes its pressed state to assistive technology, not just visually
- Create-form validation messages are announced via an aria-live polite region as well as shown inline
- Every scene thumbnail image carries descriptive alternative text
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear during a full exercise of the app (view switching, create, edit, delete, slide navigation)
- Rapidly switching view modes or advancing slides stays responsive with no hangs or dropped interactions
</performance>

<writing>
- Scene descriptions carry the sequential getting-started tutorial copy as complete instructional sentences; no lorem ipsum or placeholder text appears anywhere in the shipped UI
- Headings, buttons, and toggles use one consistent capitalization convention throughout the app
- The empty-board state and validation messages name the problem and the fix in plain language
</writing>

<requirements>
Shared application state must use Signals, the state library named in summary (in-memory only): scenes collection, view mode, slide index, drawers/toast, and edit focus. Views derive from that one shared store — never a second disconnected copy. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a valid scene increases the collection and shows it on the board
- Editing a scene updates that same record in Tile/List/Slide
- Deleting a scene removes it from the board, renumbers as needed, and updates slide bounds
- View mode and slide index are shared client state; switching modes does not reload the document
Stack: Preact + Signals + Tailwind CSS 4.3.2 (pinned; Vite or equivalent SPA); frontend-only. DaisyUI is the component library for buttons, toggles, dropdowns, toasts, form controls, and the empty state; no other component libraries. AutoAnimate allowed for animation (scene add/remove/renumber and view-mode re-layout); no other animation libraries. Iconify icons only (via @iconify/tailwind4 or unplugin-icons), one set used consistently; no raw pasted SVGs and no icon CDN. All forms validate through a Zod schema driven by a form library (React Hook Form via preact/compat, or TanStack Form), rendering inline per-field errors before submit. Gabarito bundled locally (@fontsource or vendored woff2); no font CDNs. All libraries installed via npm and bundled locally; no CDN imports.
- Seed at least eight imaged scenes plus at least two camera placeholder scenes and a trailing Add Scene control
- Slide mode advances via previous/next controls and Left/Right arrow keys, tracks position with an N / total counter, and disables the controls at the first and last scene
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
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
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
