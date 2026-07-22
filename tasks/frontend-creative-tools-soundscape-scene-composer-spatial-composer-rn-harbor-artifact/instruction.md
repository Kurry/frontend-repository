<summary>
Build the Soundscape Scene Composer — an in-memory React application using Vite and Tailwind CSS 4.3.2 that allows users to manage sound layers, place them in a spatial composer, and export their session as an interoperable JSON artifact. The app acts as an evidence artifact inspector with strict validation, source lineage tracking, and explicit import failures.
</summary>

<reference_screenshots>
</reference_screenshots>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
Feature: Sound Layers collection —
- Render a list of sound layers with fields: id, name, status (draft, ready, changed, archived), capacity (0-100), and sourceLineage.
- Allow creating new layers, editing existing layer fields, and archiving layers.
- Provide a filter to view records by domain state (e.g., draft, ready, changed, archived).
- Exact field boundaries (e.g., capacity 0-100) must be accepted; out-of-range values are explicitly rejected with field-level errors while preserving the prior valid state.
Feature: Spatial Composer surface —
- Provide a 2D spatial composer canvas where a selected sound layer can be placed (assigning x, y coordinates).
- Implement the canonical mutation: place a selected record in a spatial composer and rebalance capacity. When a layer is placed, it is assigned the clicked coordinates, its status updates to 'changed', and the capacities of all placed layers are automatically rebalanced to sum to a maximum of 100.
- Ensure conflicting or incomplete mutations (e.g., placing an archived layer) are rejected without partial updates.
- Provide an Undo control (button and Ctrl/Cmd+Z) that restores the exact prior spatial ordering, selection, and derived capacity values.
Feature: Portable work artifact and Evidence Inspector —
- Include an Evidence Artifact Inspector panel showing source lineage and redaction status of layers.
- Export the session to soundscape-scene-v1.json with schemaVersion v1, exportedAt (RFC3339 date), records (array of layers), derived (summary of placed layers and capacities), and history (undo stack).
- Provide a Clear button to empty the session state.
- Provide an Import button that reads soundscape-scene-v1.json, strictly validates it (schemaVersion, bounds, duplicate IDs), and restores the session if valid.
- Invalid imports (malformed schema, invalid bounds) must display explicit field-level upload failures and result in zero state mutation.
</core_features>

<user_flows>
- The user creates exactly 3 sound layers, selects one, places it on the spatial composer, and observes the total capacity rebalancing automatically.
- The user exports the artifact to a JSON file.
- The user clears the board, modifies the exported JSON to have invalid bounds, and attempts to import it, observing explicit error messages and no state changes.
</user_flows>

<edge_cases>
- Attempting to set capacity < 0 or > 100 via the edit form rejects the change with an inline error.
- Undoing after placing a layer restores the previous capacity distribution exactly.
- Importing a file with a missing schemaVersion or duplicate record IDs fails safely.
</edge_cases>

<visual_design>
- The interface must use a domain-native workbench layout: a sidebar for the collection, a central canvas for the spatial composer, and an inspector panel for the artifact and lineage.
- Include clear state tokens (badges) for statuses (draft, ready, changed, archived).
</visual_design>

<motion>
- Placing a record in the spatial composer should have a slight translate or morph animation connecting it to its new location.
- Provide a reduced-motion fallback that skips the transform animation.
</motion>

<responsiveness>
- On desktop, show the three-pane layout (sidebar, canvas, inspector).
- On mobile (< 768px), stack the panels or use drawers to prevent horizontal scrolling and ensure tap targets are at least 44px.
</responsiveness>

<accessibility>
- Alternate input parity: the spatial composer must allow placing a layer via keyboard (e.g., using arrow keys to move a cursor and Enter to place).
- Use semantic HTML and ensure contrast ratios meet WCAG AA standards.
</accessibility>

<performance>
- The spatial composer must remain responsive (< 100ms interaction delay) even when 100+ sound layers are present.
</performance>

<writing>
- Use explicit, domain-specific terminology (e.g., "Rebalance Capacity", "Artifact Provenance", "Source Lineage").
</writing>

<innovation>
- The linked utility of the Evidence Inspector ensures that the user is always aware of the artifact's exact state, directly mapping the abstract JSON to a visual ledger.
</innovation>

<requirements>
- The application must use Tailwind CSS 4.3.2.
- All libraries must be npm-local (no CDNs).
- The state must be entirely in-memory (NO localStorage or IndexedDB).
</requirements>

<integrity>
- Do not pre-complete the canonical mutation; the user must perform the placement.
</integrity>

<delivery>
- The app must serve on port 3000 via npm start.
</delivery>

<webmcp_action_contract>
{
  "entity_create_record": {
    "description": "Create a new sound layer.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "status": { "type": "string" },
        "capacity": { "type": "number" },
        "sourceLineage": { "type": "string" }
      },
      "required": ["name", "status", "capacity"]
    }
  },
  "entity_update_record": {
    "description": "Update a sound layer.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "name": { "type": "string" },
        "status": { "type": "string" },
        "capacity": { "type": "number" }
      },
      "required": ["id"]
    }
  },
  "artifact_export_session_json": {
    "description": "Export the session to soundscape-scene-v1.json.",
    "inputSchema": {
      "type": "object",
      "properties": {}
    }
  },
  "artifact_import_session_json": {
    "description": "Import a session from JSON.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "file_content": { "type": "string" }
      },
      "required": ["file_content"]
    }
  }
}
</webmcp_action_contract>
