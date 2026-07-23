<summary>
Manage air readings through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: adjust a selected record on a forecast ribbon and compare projected outcomes. The application must operate purely in-memory and provide a downloadable artifact of the session's actual work.
</summary>

<reference_screenshots>
None provided.
</reference_screenshots>

<core_features>
Air Readings collection: Create, edit, archive, and filter air readings with explicit domain statuses (e.g., draft, ready, changed, archived).
Forecast Ribbon surface: A linked surface that displays an interactive ribbon forecast. Users can adjust a selected record on a forecast ribbon and compare projected outcomes.
Linked utilities: Mutating a record on the forecast ribbon updates the primary record, linked view, and status together.
Export and Import: Export the current artifact as an interoperable JSON file. Clear the application state and import it with field-level validation.
</core_features>

<user_flows>
End-to-End Flow: Create a record, edit its properties, mutate its projection on the forecast ribbon, undo the mutation, and complete/archive the record. The state must be fully recoverable within the session (no reload required).
Export/Import Flow: Export the current state, clear the session data, then re-import the file to resume the exact authored order, selection, geometry, and domain state.
</user_flows>

<edge_cases>
Invalid Imports: Reject malformed imports (e.g., schema mismatch, unknown enums, duplicate/dangling IDs, cross-field contradictions, out-of-bounds values). Malformed imports result in no state mutation.
Boundaries: Entering exact bounds for fields is accepted. Entering adjacent out-of-range values is rejected with field-level error messages indicating the rejected value and the recovery action. Correcting the field clears only the corresponding error.
</edge_cases>

<visual_design>
Domain Workbench: A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
Visual Hierarchy: The primary work surface, linked summary, and detail panel feature clear hierarchy denoting current state and next action.
</visual_design>

<motion>
Causal Motion: Motion connects the acted-on item to its new state (e.g., sliding or morphing into place on the forecast ribbon).
Reduced Motion: Respects prefers-reduced-motion: reduce by replacing spatial animations with instant state transitions.
</motion>

<responsiveness>
Mobile Mode: At narrow viewports, the desktop surface becomes a usable stack, drawer, or stepper. Horizontal overflow must be avoided, and hit areas must remain large enough (44px min).
</responsiveness>

<accessibility>
Keyboard Parity: Alternate input (keyboard and touch) produces identical canonical mutations. Visible focus management must be maintained.
Semantic HTML: Live announcements (ARIA) for dynamic changes, proper modal focus trapping, and sufficient color contrast.
Undo: Ctrl/Cmd+Z undoes the canonical mutation.
</accessibility>

<performance>
Large Collection: The application must remain responsive and stable when rendering 100+ records. Edits to the selected item must not cause unrelated rows to rebuild unnecessarily.
</performance>

<writing>
Domain Copy: Copy for labels, statuses, errors, and empty states must precisely name the domain consequence and the corresponding recovery action.
</writing>

<innovation>
Linked View Context: Linked views provide domain utility beyond basic CRUD by updating intelligently when the forecast ribbon is adjusted.
</innovation>

<requirements>
The application must use Tailwind CSS 4.3.2.
All libraries must be npm-local (no CDNs).
Do not use localStorage or sessionStorage. All persistence is bounded by file export/import.
</requirements>

<integrity>
Clean state initialization. No authored work, completion, or pre-seeded success state is allowed initially.
Import is an atomic transaction.
Generated export artifact must exactly match the internal schema with accurate regenerable metadata (like exportedAt).
</integrity>

<delivery>
The delivery consists of a working React/Vite implementation served via `npm start`, which strictly avoids any console or page errors.
</delivery>

<webmcp_action_contract>
{
  "tools": [
    {
      "name": "entity_create_record",
      "description": "Create a new air reading record.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "status": { "type": "string" },
          "value": { "type": "number" },
          "date": { "type": "string" }
        },
        "required": ["status", "value", "date"]
      }
    },
    {
      "name": "entity_update_record",
      "description": "Update an existing air reading record.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "status": { "type": "string" },
          "value": { "type": "number" }
        },
        "required": ["id"]
      }
    },
    {
      "name": "artifact_export_session_json",
      "description": "Export the current session as JSON.",
      "inputSchema": {
        "type": "object",
        "properties": {}
      }
    },
    {
      "name": "artifact_import_session_json",
      "description": "Import a JSON payload to overwrite the current session.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "payload": {
            "type": "object"
          }
        },
        "required": ["payload"]
      }
    }
  ]
}
</webmcp_action_contract>
