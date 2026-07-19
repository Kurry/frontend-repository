<summary>
Build a storyboard getting-started tutorial using Astro with React islands, Nanostores, Tailwind CSS 4.3.2, and DaisyUI.
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
Feature: Direct tutorial entry —
- First load opens the storyboard workspace directly (header + left storyboard nav + scene grid); no login or admin gate appears at any point
Feature: Product header —
- The header shows a logo mark, the project label Demo Projects, the storyboard title 1. Getting Started, a kebab menu, and inert utility tools (notifications bell, dashboard, account) that toast demo only instead of navigating
Feature: Left sidebar —
- The sidebar lists the active Getting Started row plus sibling demo storyboards, an Add Storyboard control, and a footer Help control; every sidebar row is inert and toasts demo only on click
Feature: Scene collection —
- The board seeds at least 8 imaged scenes; each scene shows a number, a title/description, an image, an optional camera note, and a per-scene kebab menu with edit and delete actions
- Clicking Add Scene opens a create form with the scene fields; submitting a valid scene adds it to the board
- A scene's description can be focused and edited in place, and the edited text is what the board shows afterward
- The per-scene kebab menu's delete action removes that scene from the board
Feature: View modes —
- The storyboard nav bar offers Tile, List, and Slide toggles; Tile and List re-lay the same scene set as a card grid and a stacked list respectively
- Slide mode collapses the board to a single centered active scene with prev and next controls that advance the active scene
Feature: Scene copy —
- Scene descriptions carry tutorial copy about the product itself: header tools, notifications, view modes, scene menus, and add-scene flows
Feature: Inert chrome —
- Every non-navigational control toasts demo only instead of leaving the page; the app has zero outbound navigation
- Right drawers for notifications and account/storyboards open as demo chrome with seeded rows
</core_features>

<user_flows>
End-to-end flows with tracked state (every step names its visible evidence):
- Create flow: submitting a valid new scene from Add Scene closes the create form, adds exactly one new card to the board so the visible scene count increases by one, assigns the next scene number in sequence, and switching to List mode and then Slide mode shows the same new scene without a reload, with the slide prev/next range extended to include it
- Edit flow: editing a scene's description in Tile mode updates that same scene's text, then switching to List mode shows the edited text on the same record and Slide mode shows the edited text when that scene is the active slide, all without a reload
- Delete flow: deleting a scene through its kebab menu removes its card, decreases the visible scene count by one, renumbers the remaining scenes so numbering stays contiguous, and shrinks the Slide-mode range so prev/next never lands on the deleted scene
- View-mode flow: toggling Tile to List to Slide and back re-lays the same scene set with an identical scene count in each mode; switching modes never reloads the document, and switching may toast the mode name
- Reload baseline: reloading the page returns the app to its seeded state — the seeded scenes, Tile mode, and slide index at the first scene — because all state is in-memory
</user_flows>

<edge_cases>
- Submitting the create form with a required field (title/description) empty adds no scene: the scene count is unchanged and an inline validation message names the empty field; the submit control stays disabled until the required fields are valid
- Double-activating a valid create submit adds exactly one scene: the count increases by one and one new card appears
- After deleting the last remaining scene the board shows a clearly visible empty state with a message and an Add Scene path back into the create flow
- In Slide mode the prev control is disabled on the first scene and the next control is disabled on the last scene; neither wraps around
- Deleting the scene currently shown in Slide mode moves the active slide to a valid neighboring scene rather than showing a blank slide
</edge_cases>

<visual_design>
- Light workspace with Gabarito UI type and yellow accent
- Top header: logo mark, Demo Projects + 1. Getting Started titles, kebab menu, utility tools
- Left storyboard sidebar listing the current and sibling storyboards with an Add Storyboard control and a footer Help control
- Storyboard nav bar with Tile / List / Slide toggles; scene cards in a multi-column grid
- Welcome line Welcome to Docs!; product chrome density of a docs/storyboard app — not a marketing landing
- Icons come from one consistent icon set used across header tools, kebab menus, view-mode toggles, and drawers
- Empty board state is visually clear when no scenes remain
- Component states: buttons, toggles, and form fields show distinct default, hover, focus (visible ring), disabled, and error treatments
</visual_design>

<motion>
- Scene enter: on first load, scene cards stagger in with a short fade and slight upward settle
- Scroll reveals: on a fresh load, scene cards below the fold reveal with a short fade and rise as they scroll into view
- Hover animations (required): scene cards ease upward with soft shadow; scene images brighten on hover; header and mode toggles ease background/press; per-scene actions may fade in on card hover
- List microinteractions: a newly created scene card animates into place, a deleted card animates out while the remaining cards ease into their new positions and numbers, and the same applies in List mode
- View modes: Tile / List / Slide toggles re-layout the same scene set with a brief transition; switching modes may toast the mode name
- Slide mode: board collapses to a single centered active scene; prev/next advance the active scene with a short slide/fade transition
- Description edit: focusing a scene description applies a soft yellow wash and dashed outline while editing
- Toasts: demo-only and feedback toasts slide in, remain readable, and auto-dismiss with a fade
- Drawers: the notifications and account drawers slide in from the right and slide out on close
- With prefers-reduced-motion set, staggers, reveals, and card transitions are removed and state changes apply instantly while every feature stays reachable
</motion>

<responsiveness>
- At desktop widths the left sidebar is open beside the scene grid; at widths of 1024 pixels and below it collapses behind a toggle that opens it as an overlay drawer
- The scene grid steps down from multiple columns at desktop widths to fewer columns at tablet widths and a single column at 375 pixel width
- No content clips or overflows the viewport and no horizontal scrolling appears at 375 pixel width; header tools and view-mode toggles remain reachable at every width
</responsiveness>

<accessibility>
- Every interactive control (header tools, sidebar rows, view-mode toggles, kebab menus, create/edit fields, drawer and slide controls) is reachable and operable with the keyboard alone, with a visible focus indicator
- Per-scene kebab menus open as keyboard-operable menus: arrow keys move between the edit and delete items and Escape closes the menu
- The create form's inline validation messages are announced through a polite live region as well as shown visually
- Open drawers can be dismissed with Escape and return focus to the control that opened them
- Scene images carry descriptive alt text; icon-only controls carry accessible labels
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of the app, including no hydration errors or warnings on the workspace route
- The workspace renders its content directly on load with no post-load content flash or visible layout jump as fonts and scene images finish loading; image regions hold their space
- Rapid view-mode switching and repeated create/delete actions stay responsive with no hangs or dropped interactions
</performance>

<writing>
- Scene tutorial copy reads as clear instructional sentences that teach the product's own features; no lorem ipsum, TODO, or placeholder text appears anywhere in the shipped UI
- Headings, buttons, and toasts use one consistent capitalization convention; demo-only toasts use consistent wording across all inert controls
- The empty board state explains that no scenes remain and how to add one
</writing>

<requirements>
Stack: Astro with static output; the interactive workspace regions (header tools, sidebar, scene board, drawers, create/edit forms) are client islands built with React. All interactivity lives in client state after load; no server actions, loaders, or API routes.
Shared application state must live in Nanostores (in-memory only), shared across all islands: the scenes collection, view mode, slide index, drawers/toast state, and edit focus. Views derive from the one store — never a second disconnected copy. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a valid scene increases the collection and shows it on the board
- Editing a scene updates that same record in Tile/List/Slide
- Deleting a scene removes it from the board, renumbers as needed, and updates slide bounds
- View mode and slide index are shared client state; switching modes does not reload the document
Styling: Tailwind CSS 4.3.2 (pinned), with design tokens in the theme layer. DaisyUI is the component library for base chrome — buttons, kebab dropdown menus, drawers, toasts, and form controls — restyled with the app's own light/yellow tokens.
Animation: GSAP allowed for animation (load stagger, scroll reveals, card and view-mode microinteractions); no other animation libraries.
Icons: Remix Icon via the astro-icon package only; no other icon sets, no raw copy-pasted SVGs, no icon CDN.
Forms: the Add Scene create form and the scene edit flow are driven by React Hook Form with a Zod schema — the schema defines the required-field rules and the form surfaces inline per-field errors naming the field before submit, with submit disabled until valid.
All libraries installed via npm and bundled locally; no CDN imports. Local Gabarito fonts bundled in /app; no font CDN.
- Seed at least eight imaged scenes plus placeholders/Add Scene
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
- Destinations: scene-list; scene-detail; tutorial-steps
- Entity: scene
- Entity operations: create; select; update; delete; reorder
- Entity fields: title; body; order
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
