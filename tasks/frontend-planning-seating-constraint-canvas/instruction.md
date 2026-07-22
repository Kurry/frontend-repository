<summary>
Build a Seating Constraint Canvas hard browser app using React, Vite, and Tailwind CSS 4.3.2. The app is an advanced spatial event tool for planners arranging guests in a fictional 24x18m room under social, accessibility, and circulation constraints. The app produces the operator's session artifact: a downloadable JSON SeatingConstraintPlan and a print-ready SVG, compiling live from exact geometry, assignments, and lenses.
</summary>

<core_features>
Feature: Room and table geometry —
- A 24x18-meter room canvas grid with a stage, two doors, one accessible entrance, three columns, and a service zone. Grid scale is 0.25-meter units.
- Drag, rotate (15-degree increments), and resize tables (between allowed capacities: round 6/8, rectangle 6/10, accessible rectangle 6). Table collision, wall/column overlap, or leaving bounds blocks movement/resize and stays preview-only.
- Lasso selection supports group movement while preserving relative positions.
Feature: Seat generation and binding —
- Seats derive deterministically from table type, dimensions, rotation, and capacity.
- Drag guest cards onto seats or use source-target selectors to assign guests. A guest occupies at most one seat; declined guests cannot be seated; tentative guests are seated with a warning. Resizing a table below its occupied count blocks until guests are unassigned.
Feature: Relationship constraint graph —
- Guest cards connect with together, near, or apart edges. Together requires same table; near requires Euclidean seat distance <= 4 meters; apart requires different tables and distance >= 6 meters.
- Relationship graph shares selection with room lines and guest list. Contradictory edges between the same pair reject.
Feature: Accessibility and sightline lens —
- Mobility guests require accessible seats connected to the accessible entrance by an obstacle-free aisle polygon at least 1.2 meters wide.
- A sightline overlay raycasts seat centers to stage and flags columns/tables blocking priority guests. Toggling lenses changes analysis display only, not geometry.
Feature: Aisle and service flow editor —
- Draw up to six aisle centerlines (1.2m or 1.5m width) connecting entrance, tables, service zone, and exit. Snaps to grid, bends at handles, cannot cross obstacles or terminate orphaned.
- A flow graph identifies unreachable tables and bottlenecks.
Feature: Dietary/service distribution —
- Table summaries aggregate dietary flags without exposing sensitive detail. A service-load heatmap shows meals per table/zone.
- Tag one service station per dietary category; affected tables need a reachable aisle path.
Feature: RSVP, assignment, and conflict metrics —
- Concentric rings show confirmed/tentative/declined, assigned/unassigned, accessibility-ready, relationship-satisfied, and service-ready counts. Selecting a ring filters guests.
- Conflicts distinguish collision, capacity, relationship, mobility path, sightline, aisle, service, and unassigned confirmed guest.
Feature: Comparison, responsive mode, and artifact —
- Compare two named layouts in terms of geometry, assignments, aisles, conflicts, and metrics.
- Export produces a reproducible JSON and a print-ready SVG matching current geometry. Import recalculates all state atomically and rejects invalid payloads.
</core_features>

<user_flows>
- Arrange and Assign: Place/rotate/resize/lasso tables, then assign guests to seats. Ensure exact plan agrees.
- Constrain and Test: Bind relationships, draw aisles, test lenses (accessibility, sightlines) and service stations, and view exact metric changes.
- Causal Motion: Move one table -> observe seats, assignments, relationship graph distances, accessibility, service metrics, and compare views all updating synchronously.
- Comparison: Compare the active layout with an alternate layout and certify.
- Export and Import: Export the full JSON plan and SVG. Reset the board. Import the exact JSON and verify exact state reconstruction.
</user_flows>

<edge_cases>
- Try bounds/collision, occupied resize, duplicate/declined assignment, contradictory relation.
- Try exactly 4m/6m distance boundaries, 1.2m aisle crossing an obstacle, or orphaned path.
- Try importing malformed JSON or stale fixture mismatch. Verify it shows named recovery rather than crashing.
</edge_cases>

<visual_design>
- Desktop-first creative tool composition with linked spatial canvas and constraint/guest rails.
- Ensure spatial hierarchy stays legible when inspecting selected, occupied, tentative, collided, constrained, inaccessible, blocked, compared, and certified states.
- Artifact: SVG output has fixed viewBox, ordered groups (room, obstacle, aisle, table, seat, guest, legend) and visually reflects exact geometry.
</visual_design>

<motion>
- Smooth table/guest travel, edge/stretch, clearance and metric transitions explaining consequences.
- Reduced motion: instant endpoints plus persistent origin/delta outlines.
</motion>

<responsiveness>
- 1440/768/375 pixel modes. Mobile room/assignment/constraint flow retains every action through mini-map, table/guest cards, coordinate sheets, vertical lineage, and conflict drawer, with 44-pixel targets and no overflow.
</responsiveness>

<accessibility>
- Move/rotate/resize tables, assign seats, link constraints, edit aisle points, navigate graphs/conflicts, compare, and export using keyboard alone. Focus and state match pointer interaction.
</accessibility>

<performance>
- Dragging or lassoing 10 tables with 36 guests and live geometry lenses maintains responsive updates. Stale raycast/path calculations cancel appropriately.
</performance>

<writing>
- Trigger conflicts and ensure exact table/guest/seat/relation/distance/aisle/obstacle/service rules and concrete recovery actions are presented without placeholders.
</writing>

<innovation>
- Moving a table cascades updates to all connected visualizations (seats, graphs, metrics, history, artifact) seamlessly.
</innovation>

<requirements>
- State is exclusively in-memory (no localStorage or backend) using React state or a reducer store.
- Stack: React, Vite, Tailwind CSS 4.3.2 (no CDN allowed; all local npm).
- The deterministic fixture (36 guests, 5 household groups, 4 mobility needs, 6 dietary flags, 7 relations, 3 RSVP states) must seed the initial application.
- Artifact contract SeatingConstraintPlan uses schemaVersion: seating-constraint-plan/v1 with strict fields for tables, seats, assignments, RSVPs, relations, aisles, stations, layouts, lenses, history, checksums, and SVG.
- Serve over local HTTP port 3000.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`. `/app/package.json` MUST define npm scripts `start` (serves the app on port 3000) and `verify:build` (exits 0 when build succeeds).
- WebMCP is a required delivery step. Implement exactly the `<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

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
- Editor object types: table; aisle; guest
- Editor properties: x; y; rotation; width; height
- Editor operations: select; add; delete; update_property
- Editor modes: draw-aisle
- Entity: assignment
- Entity operations: create; select; update; delete
- Entity fields: guest-id; seat-id; relationship
- Artifact operations: export; import
- Export formats: seating-constraint-plan; svg
- Import modes: seating-constraint-plan

Mechanics exclusions:
- Drag and drop gesture geometry stays Playwright-driven
- Canvas redraw rendering is visually observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
