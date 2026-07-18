<summary>
Build a storyboard getting-started tutorial using Preact, Signals, and Tailwind CSS.
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
- First load opens directly into the storyboard workspace — product header plus a multi-column scene grid — with no login, admin, or marketing gate
- The header shows a logo mark, a Demo Projects project label, the storyboard title 1. Getting Started, a kebab menu, and utility tools (notifications bell, dashboard, account); clicking any inert header control raises a demo only toast instead of navigating
- The board seeds at least 8 imaged scenes, each numbered with a thumbnail and an editable description; scene 1's description opens with the line Welcome to Docs! and later scenes carry sequential getting-started copy (header tools, view modes, three-dot menu, Add Scene)
- Beyond the imaged scenes the grid ends with at least 2 empty placeholder scenes showing a centered camera add-image affordance, followed by an Add Scene control pairing a primary button with a dropdown chevron
- The storyboard nav bar exposes Tile, List, and Slide view toggles; the active toggle is visibly pressed and switching modes re-lays out the same scene set without reloading the document (switching may toast the mode name)
- Tile mode arranges scenes in a multi-column grid; List mode stacks the same scenes in a single vertical column; Slide mode collapses to one centered active scene with a previous/next control pair and an N / total scene counter
- In Slide mode, previous/next controls and the Left/Right arrow keys advance the centered scene, the counter tracks position, and the controls disable at the first and last scene
- Creating a scene via Add Scene increases the collection and shows the new scene on the board; submitting an empty required title/description adds no scene and surfaces visible validation feedback
- Editing a scene's description/title updates that same record across Tile, List, and Slide; deleting a scene removes it, renumbers the remaining scenes, and updates the slide bounds
- Focusing a scene description shows an edit affordance while editing; drawers for notifications/account may remain inert demo chrome
- Deleting every scene leaves a visible empty-board state
- A back-to-top control appears after the board is scrolled down and smoothly returns the board to the top
</core_features>

<visual_design>
- Light workspace with Gabarito UI type and yellow accent
- Top header: logo mark, Demo Projects + 1. Getting Started titles, kebab menu, utility tools
- Storyboard nav bar with Tile / List / Slide toggles; scene cards in a multi-column grid; imaged cards reveal a three-dot actions button on hover
- Placeholder scenes render an empty tile with a centered camera add-image button; the trailing Add Scene control shows a primary button plus a dropdown chevron
- Welcome line Welcome to Docs!; product chrome density of a docs/storyboard app — not a marketing landing
- Slide mode presents a single centered scene with a previous/next control pair and an N / total counter
- Empty board state is visually clear when no scenes remain
</visual_design>

<motion>
- Scene enter: on first load, scene cards stagger in with a short fade and slight upward settle
- Hover animations (required): scene cards ease upward with soft shadow; scene images brighten on hover; header and mode toggles ease background/press; per-scene actions may fade in on card hover
- View modes: Tile / List / Slide toggles re-layout the same scene set; switching modes may toast the mode name
- Slide mode: board collapses to a single centered active scene; prev/next advance the active scene
- Description edit: focusing a scene description applies a soft yellow wash and dashed outline while editing
</motion>

<requirements>
Shared application state must use the stack state library named in summary (in-memory only): scenes collection, view mode, slide index, drawers/toast, and edit focus. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a valid scene increases the collection and shows it on the board
- Editing a scene updates that same record in Tile/List/Slide
- Deleting a scene removes it from the board, renumbers as needed, and updates slide bounds
- View mode and slide index are shared client state; switching modes does not reload the document
Stack: Preact + Signals + Tailwind CSS (Vite or equivalent SPA); frontend-only. Local Gabarito fonts. No external component libraries.
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

Bindings:
- Browsable entity: scenes
- Destinations: scene-list; scene-editor; tutorial-steps
- Entity: scene
- Entity operations: create; select; update; delete
- Entity fields: title; body
- Form fields: title; body
- Form operations: validate; submit; cancel; advance; return
- Workflow steps: intro; edit; review

Mechanics exclusions:
- None

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
