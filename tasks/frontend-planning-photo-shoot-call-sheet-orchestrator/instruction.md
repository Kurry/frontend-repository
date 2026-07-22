<summary>
Build a Photo Shoot Call-Sheet Orchestrator, a framework-agnostic creative production scheduler for a one-day editorial photo shoot. The user builds a shot list, places shots on location diagrams and a time grid, binds resources, honors constraints, creates call times, rehearses disruptions, branches a recovery schedule, and exports artifacts.
</summary>

<core_features>
Feature: Shot requirement and coverage board —
- The app displays a shot list with shots defining composition, location zone, talent, wardrobe, prop, gear, lighting band, duration, priority, and dependencies.
- Cards can move through required, scheduled, captured-simulated, alternate, dropped-with-reason, and verified states.
- A coverage matrix tracks exact role/orientation/talent/location counts.

Feature: Location diagram placement —
- The app provides at least three location maps/floor polygons (for "Market at First Light").
- Shot markers can be dragged onto fixed floor/site polygons with camera/subject positions, facing direction, footprint, and access zone.
- Collision detection checks bounds, obstacles, restricted zones, crowd fixtures, and simultaneous-shot clearances.
- Keyboard coordinates/rotation and mobile placement sheets equal pointer gestures.

Feature: Timeline and resource lanes —
- Shots can be dragged and resized on five-minute slots.
- Setup, teardown, wardrobe change, meal/rest, and travel blocks derive from the sequence automatically.
- Talent/crew availability, gear ownership, wardrobe/prop continuity, and location hours prevent overlaps.
- Changing a shot previews all downstream blocks/call times.

Feature: Light and weather bands —
- Fixture light windows and weather suitability overlay timeline/location lanes.
- Each shot declares acceptable bands, and moving outside bounds is blocked or requires a declared alternate setup.
- Selecting a band highlights exact eligible/conflicted shots.

Feature: Release and readiness gates —
- Talent/location/prop releases bind exact shots and track states (draft, reviewed, approved, expired, revoked).
- Required releases and gear/wardrobe checks freeze checksums at schedule approval.
- Editing shot participation/location or advancing date marks affected readiness as stale.

Feature: Call-time and handoff graph —
- Call times derive from first needed block minus preparation/travel.
- Handoffs connect gear, wardrobe, prop, data-card, and location responsibility between personas.
- Missing or impossible handoff blocks shot readiness.
- Graph and timeline share selection.

Feature: Disruption rehearsal and repair —
- Rehearsal injects "rain closure" and "absent talent" after completed shots.
- Users can switch to alternate, swap future shots, move location, substitute talent/gear, shorten within bounds, drop optional shot, or branch a recovery schedule.
- Completed shots/resources/release history remain immutable across repair branches.

Feature: Export and Import —
- Export produces canonical JSON, ICS person/location schedule, CSV ledger, SVG location maps/timeline, and Markdown call sheets.
- Import reconstructs state exactly and rejects forged or invalid schedules.
</core_features>

<visual_design>
- Desktop shows shot board/coverage, location map, timeline/resource lanes, light/weather, releases/readiness, call/handoff graph, rehearsal/compare, and artifacts.
- Visual hierarchy clearly differentiates required, scheduled, captured, alternate, dropped, and verified states.
- Colors highlight conflicts, overlaps, out-of-band placements, and stale readiness.
</visual_design>

<motion>
- Drag-and-drop of shots between lanes and map placement uses smooth movement.
- Downstream blocks, call times, and readiness stales animate into their new positions.
- All motion respects prefers-reduced-motion media query by snapping immediately without transitions.
</motion>

<requirements>
- Shared application state must use an in-memory state manager (e.g. Zustand) and never use localStorage, sessionStorage, or other browser storage APIs. A page reload returns the app to its seeded state.
- Seed data: "Market at First Light" shoot with three local locations, 24 shot requirements, six talent/crew personas, 18 gear/wardrobe/prop items, fixed travel/setup times, deterministic light/weather bands, four release documents, and two disruption events. A valid 10-hour schedule exists in the seeded state.
- No real people, weather, or photography advice is used (fictional data only).
- Stack: React, Vite, Tailwind CSS 4.3.2, an accessible UI component library, and lucide-react or equivalent for icons.
- All dependencies must be locally bundled via npm. No CDN imports of any library, font, or icon set are allowed.
- Implement window.webmcp_session_info, webmcp_list_tools, and webmcp_invoke_tool to expose canonical state and actions.
</requirements>

<delivery>
- Produce an original self-contained app in `/app`.
- `npm run verify:build` must exit 0 and `npm start` must serve the app on port 3000.
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
    "Invokes the same domain command used by the visible control."
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
    "No raw files, filesystem paths, blobs, base64, or artifact contents in WebMCP arguments or results."
  ],
  "tool_name_prefix": "artifact"
}
</module_spec>

Bindings:
- Editor object types: shot-marker; timeline-block
- Editor properties: coordinates; duration
- Editor modes: place; schedule
- Editor operations: select; update_property; switch_mode; preview; set_content
- Entity: shot; resource; handoff; disruption
- Entity operations: create; select; update; delete; toggle
- Entity fields: name; state; assignee
- Artifact operations: export; import; copy
- Export formats: session-json; ics; csv; svg; markdown
- Import modes: session-json
</webmcp_action_contract>
