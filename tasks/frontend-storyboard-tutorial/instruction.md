<summary>
Build a storyboard getting-started tutorial using Preact, Signals, and Tailwind CSS.
</summary>

<core_features>
Core features:
- Direct tutorial entry — first load opens the storyboard workspace (header + scene grid); no login or admin gate
- Product header — logo mark, project label (Demo Projects), storyboard title (1. Getting Started), kebab menu, and inert utility tools
- Primary collection — scenes/frames: seed at least 8 imaged scenes; each has number, title/description, image, and optional camera note; the list supports create (Add Scene), edit (description/title), and delete
- At least two interaction modes: Board mode (Tile / List layouts of the scene set) and Tutorial/Slide mode (single centered active scene with prev/next)
- Domain behavior beyond CRUD: Tile/List/Slide view toggles; reorder or renumber after delete; empty board state; description focus/edit affordance; drawers for notifications/account may remain demo chrome
- Invalid create: empty scene title/description when required must not add a scene; show visible validation feedback
- Inert chrome — non-navigational controls toast demo only instead of leaving the page
- Slide navigation: when Slide mode is active, previous/next controls and a scene counter (N / total) advance the centered active scene
</core_features>

<visual_design>
- Light workspace with Gabarito UI type and yellow accent
- Top header: logo mark, Demo Projects + 1. Getting Started titles, kebab menu, utility tools
- Storyboard nav bar with Tile / List / Slide toggles; scene cards in a multi-column grid
- Welcome line Welcome to Docs!; product chrome density of a docs/storyboard app — not a marketing landing
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
- Seed at least eight imaged scenes plus placeholders/Add Scene
- Empty required fields on create must not increase the scenes count; show visible validation feedback
- After deleting all scenes, show an empty state on the board
- Zero navigational outbound links; inert controls toast demo only
- Document title 1. Getting Started — Docs; welcome line Welcome to Docs!
</requirements>

## Delivery and integrity

- Integrity: work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
- Delivery: produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; run `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- WebMCP: required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.

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
