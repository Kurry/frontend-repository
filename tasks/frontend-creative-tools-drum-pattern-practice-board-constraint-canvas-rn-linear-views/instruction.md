<summary>
Build a Drum Pattern Practice Board using React, React Context/Reducer, and Tailwind CSS 4.3.2. The application features a Constraint Canvas and Linear-style Filtered Views to manage drum patterns. It produces a portable session artifact (a downloadable JSON document) that preserves the authored state and derived consequences without using any local storage. All assets must be loaded locally without CDNs.
</summary>

<core_features>
Feature: Drum Patterns Collection —
- Create, edit, and delete drum pattern records. Each record has an id, name, and status (empty, draft, ready, changed, archived).
- View records in a Linear-style filtered workflow view where records are grouped by their domain status.
- Exact field boundaries are accepted (e.g., name max length 50); adjacent out-of-range values are rejected. Invalid required fields preserve the prior valid record and explain recovery.
Feature: Constraint Canvas —
- A drag-and-drop surface (Constraint Canvas) with constraint lanes: Unconstrained, Timing, Velocity, Polyphony.
- Signature interaction: drag a selected record across constraint lanes and resolve a conflict. Dropping a record into a new lane triggers a conflict state. The record enters a "conflict" state visibly.
- The user must resolve the conflict (by clicking a "Resolve" button on the record) to finalize the mutation into the "resolved" state.
- A conflicting or incomplete mutation cannot be partially applied to the derived state.
- Undo the last canvas mutation (restoring ordering, selection, and derived values).
Feature: Linked Views & Derived State —
- A live derived summary displays the count of records in each constraint lane and status group. This summary updates immediately upon mutation (creation, status change, or canvas drag/resolve).
Feature: Portable work artifact —
- Export the current session as drum-pattern-v1-constraint-canvas.json.
- The JSON contains schemaVersion (exactly "drum-pattern-v1"), exportedAt (RFC3339), records (array of drum patterns with their constraint-canvasState), derived (the summary), and history (event history).
- Clear the session (resetting to empty) and import a valid JSON file to restore the authored structure and regenerate exportedAt.
- Import validation: malformed schema, duplicate IDs, or invalid bounds make no state change.
</core_features>

<user_flows>
- Collection Flow: Create a new record, set its status to draft, then to ready. Verify it moves between groups in the filtered view.
- Constraint Canvas Flow: Drag a record from Unconstrained to Timing lane. Resolve the conflict if it occurs. Verify the linked derived summary updates to reflect the new lane counts.
- Undo Flow: After resolving a canvas mutation, press Undo. The record returns to its previous lane and the summary reverts.
- Export and Import Flow: Export the session to JSON. Clear the board. Import the JSON. The records, their lane placements, and the derived summary must perfectly match the pre-export state.
- Invalid Import Flow: Import a JSON with an unknown schemaVersion. The app shows an inline error and leaves the current state unchanged.
</user_flows>

<edge_cases>
- Submitting an empty record name shows an inline error naming the field and prevents creation.
- Importing an artifact with duplicate record IDs or invalid status enums rejects the entire import and preserves the prior state.
- Dragging a record but cancelling the drop leaves the record in its original lane and state.
</edge_cases>

<visual_design>
- Distinctive, domain-specific workbench with clear state tokens and intentional density.
- Linear-inspired filtered view with clear grouping headers.
- Constraint canvas has visible lane boundaries.
- Records in a "conflict" state show a clear visual warning (e.g., an amber or red border and a warning icon) with a primary "Resolve" action.
- Statuses (empty, draft, ready, changed, archived) have distinct color badges.
</visual_design>

<motion>
- Dragging a record moves smoothly across the screen.
- The acted-on item morphs or transitions into its new state (e.g., from selected to conflict to resolved) with a clear visual effect.
- With prefers-reduced-motion set, these animations are skipped but functionality remains identical.
</motion>

<responsiveness>
- At desktop widths, the application displays the filtered view, constraint canvas, and derived summary side-by-side or in a spacious layout.
- At narrow viewports, secondary surfaces transform into stacked steps or drawers to prevent horizontal overflow, while maintaining full interaction capabilities.
</responsiveness>

<accessibility>
- Alternate input parity: The signature interaction (drag a selected record across constraint lanes and resolve a conflict) must be fully achievable via keyboard (e.g., using Tab to focus, Space/Enter to select, Arrow keys to move between lanes, and Enter to drop/resolve).
- Semantic controls, clear focus management, and live ARIA region updates for derived state changes.
</accessibility>

<performance>
- Adding over 100 seeded records must not degrade the performance of the drag-and-drop interaction. Unrelated rows should stay stable without unnecessary re-renders.
</performance>

<writing>
- Copy must name the domain consequence and recovery action precisely.
- No placeholder or dummy text in the final application.
</writing>

<innovation>
- Optional enhancements: Advanced search/filter combinations or a timeline visualization of the history events.
</innovation>

<requirements>
- React and React Context/Reducer for all shared state. State must be strictly in-memory (NO localStorage, sessionStorage, or external APIs).
- Tailwind CSS 4.3.2 for styling.
- All assets must be loaded locally without CDNs.
- The app produces the user's session files (JSON export) matching the described DrumPatternPracticeBoardSession schema.
- Vite for building the application.
- The signature interaction (drag across constraint lanes and resolve) must be the primary mechanic for state transition in the canvas.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/solution/app`.
- `/solution/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds). Run via `npm start` on port 3000.
- WebMCP is required. Register tools `webmcp_session_info`, `webmcp_list_tools`, `webmcp_invoke_tool` conforming to `<webmcp_action_contract>`.
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
- Editor object types: pattern-record
- Editor properties: lane; conflict
- Editor modes: constraint-canvas
- Editor operations: select; update_property
- Entity: record
- Entity operations: create; select; update; delete
- Entity fields: name; status; lane
- Artifact operations: export; import; copy
- Export formats: session-json
- Import modes: session-json

Mechanics exclusions:
- Drag across constraint lanes stays Playwright-observed
- Conflict state rendering stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
