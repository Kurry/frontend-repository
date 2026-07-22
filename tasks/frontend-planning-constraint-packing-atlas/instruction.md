<summary>
Build Constraint Packing Atlas, a hard browser app/spatial packing planner. Uses Tailwind CSS 4.3.2. No CDN links, all dependencies must be locally installed in package.json.
The user arranges rectangular item footprints inside layered bag compartments, rotates and groups items, assigns ownership, enforces mass/volume/access/incompatibility rules, verifies kit completeness, branches and compares layouts, rehearses checkpoint removal/repacking, and exports exact bag diagrams plus manifests.
</summary>

<core_features>
Feature: Compartment packing canvas
Items drag, rotate by 90 degrees, and move between top/bottom layers and compartments. Footprints cannot overlap, cross bounds, or occupy a reserved zone. Keyboard arrows/rotate/layer controls and mobile numeric placement sheets equal pointer actions. Invalid placement remains a translucent preview and snaps back with exact conflict ids.

Feature: Containment and grouping
Pouches are bounded child containers whose contents move with them and contribute aggregate mass. A group may require co-location but not overlap. Nesting depth is at most two; cycles reject. Removing a pouch from a bag removes its contents from bag readiness without deleting assignments.

Feature: Mass, balance, and carrying constraints
Each bag and compartment has mass capacity; each carrier has a personal limit. The canvas shows center of mass and left/right imbalance under an exact 10 percent threshold. Assigning a bag to an owner updates personal load and shared-weight equity. Geometry, not item order, determines center of mass.

Feature: Kit and ownership graph
Items belong to required kits such as shelter, first aid, cooking, navigation, and documents. The graph shows missing, packed, inaccessible, duplicated, and owner-conflicted nodes. Selecting a kit highlights exact canvas items and manifest rows. One item may satisfy multiple kits but exists in one physical location.

Feature: Incompatibility, fragility, and access rules
Declared pairs cannot share a bag; fragile items cannot have occupied top-layer footprint above them; liquids require sealed compartments. Checkpoint items need a collision-free removal path from their layer to the compartment opening and may not require removing more than a fixed number of blockers. An access lens animates removal order without mutating layout.

Feature: Checkpoint rehearsal workflow
The route has departure, security, trailhead, camp, and return checkpoints. Users rehearse take-out/use/repack events against a logical sequence. Failed access, missing kit, wrong owner, or forgotten repack pauses the run. Retry step, choose another valid removal order, branch the layout, or abandon preserves attempts and cannot duplicate/loss an item.

Feature: Layout branches and comparison
Users fork named layouts, compare item positions, bags/layers, owner loads, balance, kit readiness, access blockers, and checkpoint results, then merge nonconflicting item placements property-by-property. A certified layout freezes fixture/layout/checkpoint checksums and becomes stale after any material change.

Feature: Responsive planner and artifacts
Desktop shows bag canvases, item/kit rail, owner/conflict matrix, and checkpoint timeline. Mobile becomes bag mini-maps, item cards, coordinate/layer sheets, vertical access/rehearsal steps, and kit/owner drawers. Export produces canonical JSON, one SVG cutaway per bag, CSV item manifest, and Markdown checkpoint checklist; import reconstructs the layout exactly.
</core_features>

<visual_design>
State inspection of selected/preview/overlap/bounds/layer/nested/fragile/incompatible/overweight/unbalanced/missing/blocked/certified states remains legible in hierarchy.
Grid geometry is explicit, cells track 1-cm blocks.
</visual_design>

<motion>
Item travel, mass/balance shifts, kit edges, blocker removal, and checkpoint progression explain consequences.
Reduced motion retains explicit delta outlines/order labels without animation.
</motion>

<requirements>
ConstraintPackingPlan uses schemaVersion constraint-packing-plan/v1 and stores fixture/hash/grid, bag/compartment geometry/capacity/opening, items/footprints/mass/properties, container nesting, placements/layers/rotations, owner/bag assignments, kits/rules, access paths/removal orders, layout branch DAG/merge choices, rehearsal runs/attempts, certification, annotations/view state/history, derived collision/mass/balance/readiness/access/artifact checksums, SVGs, CSV, Markdown, and UTC exportedAt.
Positions/dimensions are integer centimeters; rotations are 0/90; every item has exactly one location.
Container graph acyclic, depth bounded to 2, mass/capacity limits hold.
Incompatibility, sealed, fragile, kits, access limits strictly follow rules.
Rehearsal events are append-only.
Import rejects invalid fixture, mismatching checks, etc.
No CDN dependencies; all dependencies local.
Uses Tailwind CSS 4.3.2.
Must run cleanly with npm start on port 3000, build into dist/.
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
- command-session-v1
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

<module_spec id="command-session-v1">
{
  "id": "command-session-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Command / session",
  "purpose": "Media, games, presentations, simulations, demos, and remote-control shells.",
  "permitted_operations": ["start", "pause", "resume", "stop", "restart", "advance", "trigger_demo", "connect", "disconnect"],
  "binding_keys": {
    "required_any_of": [["session_operations"]],
    "optional": ["demos", "visible_postconditions"]
  },
  "restrictions": [
    "No batching or replay of gameplay.",
    "Timing, animation, collision, repeated input, and transient UI require immediate Playwright observation.",
    "Tool output cannot prove successful playback or connection."
  ],
  "tool_name_prefix": "session"
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
- Editor object types: item; bag; compartment
- Editor operations: select; add; delete; update_property
- Editor properties: layer; rotation; pouch
- Entity: layout-branch
- Entity operations: create; select
- Entity fields: name; certified
- Session operations: start; advance; restart
- Demos: checkpoint-rehearsal
- Artifact operations: export; import; copy
- Export formats: constraint-packing-plan-json; svg; csv; markdown
- Import modes: constraint-packing-plan
- Workflow completion: bag-canvases
- Workflow completion: item-rail
- Workflow completion: conflict-matrix
- Workflow completion: checkpoint-timeline

Mechanics exclusions:
- Drag and drop item placement, rotate snapping, and layer toggles remain Playwright-driven when mechanism matters.
- Checkpoint access animation and delta outlines stay Playwright-observed.
- Export download blob creation remains Playwright responsibilities.

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
