<summary>
Build an Emergency Drill Evacuation Planner with a forecast ribbon, built with React and Tailwind CSS 4.3.2. The app manages drill checkpoints through a domain-native browser surface where one meaningful mutation (adjusting a selected record on a forecast ribbon) updates linked views and an interoperable artifact. It produces the operator's session artifact: a downloadable and copyable JSON document compiled live from the record collection and derived state, conforming to a strict API-shaped schema, with Import that round-trips that JSON. The application must use strictly in-memory state; NO localStorage or other persistence mechanisms are allowed.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
Feature: Drill Checkpoints collection —
- Direct entry: first load shows the drill checkpoints list and a fresh session context with no setup, login, or backend. The data must be in-memory only. No localStorage or external persistence is allowed.
- The user can create, edit, archive, and filter drill checkpoints with explicit domain statuses (e.g., draft, ready, changed, archived).
- Exact field boundaries are accepted while adjacent out-of-range values are rejected.
- Invalid required fields preserve the prior valid record and explain recovery.
Feature: Forecast Ribbon surface —
- The signature interaction: adjust a selected record on a forecast ribbon and compare projected outcomes. When adjusting a parameter on the ribbon (e.g., predicted clearance time or headcount), the app immediately projects outcomes and compares them against target bounds.
- Undo: the user can undo the last mutation and inspect the linked representation, which restores ordering, selection, and derived values.
- A conflicting or incomplete mutation is rejected without partial updates.
- Linked views (the forecast ribbon surface, derived summary, and artifact query) share one canonical state and react together.
Feature: Portable work artifact —
- Export: the user can export the current artifact containing the full drill checkpoint list, their forecast states, derived outcome statistics, and event history into evacuation-drill-v1.json.
- Clear: the user can clear the current state back to empty.
- Import: the user can import a JSON file. A valid import restores authored structure and regenerates exportedAt.
- Import boundary: Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
</core_features>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- The visual hierarchy makes current state and next action clear, linking the primary work surface, linked summary, and detail panel.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state.
- Reduced motion preserves feedback without transforms (i.e. if prefers-reduced-motion is active, disable animations).
</motion>

<responsiveness>
- Narrow layouts change the interaction model, preserving touch targets and avoiding horizontal clipping.
- The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow on mobile viewports.
</responsiveness>

<accessibility>
- Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
- Visible focus, semantic controls, and live updates are required.
</accessibility>

<performance>
- Exercise a seeded collection with at least 100 records.
- The signature interaction remains responsive (direct manipulation acknowledged within 100 ms) and unrelated rows stay stable.
</performance>

<requirements>
- The application must use React and Tailwind CSS 4.3.2.
- All libraries must be npm-local (no CDNs).
- In-memory state only (NO localStorage).
</requirements>

<integrity>
- Zero page errors or console errors during normal usage.
- All described validations must trigger appropriately on bad input.
</integrity>

<delivery>
- The application must run via npm start on port 3000, serving from dist/ (which must be committed).
- The solution folder structure should have the app in solution/app.
</delivery>

<webmcp_action_contract>
<module_spec id="entity-collection-v1">
{
  "id": "entity-collection-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Entity collection",
  "purpose": "CRUD over uniform business records.",
  "permitted_operations": ["create", "read", "update", "delete", "list", "reorder"],
  "binding_keys": {
    "required_any_of": [["entity_name", "entity_fields"]],
    "optional": ["validation_rules", "status_enums", "reorder_rules"]
  },
  "restrictions": [
    "No bulk actions without explicit loop handling.",
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
- Entity: checkpoint
- Entity operations: create, read, update, delete, list
- Entity fields: id, name, status, predicted_time, target_time, headcount
- Artifact operations: export, import, copy
- Export formats: evacuation-drill-v1.json
Mechanics exclusions:
- Drag/touch geometry stays Playwright-observed
Implementation:
- Register browser WebMCP tools for permitted operations.
- Tool handlers must call the same application logic as the UI.
</webmcp_action_contract>
