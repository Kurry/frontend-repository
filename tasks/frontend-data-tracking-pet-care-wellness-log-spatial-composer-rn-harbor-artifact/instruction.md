<summary>
Build a Pet Care Wellness Log with Spatial Composer and Provenance Artifact Provenance using React, Tailwind CSS 4.3.2, and standard browser APIs. The app manages a bounded collection of pet care events, provides a spatial composer surface to place a selected record and rebalance capacity, and produces the operator's session artifact: a downloadable and interoperable JSON document (pet-wellness-v1-spatial-composer.json) compiled live from the events, derived state, and history. The app uses exclusively in-memory state (no localStorage).
</summary>

<reference_screenshots>
Screenshots of the reference application are provided in-container at
/reference-screenshots/: overview.png is a full-page desktop-layout
overview; overview-mobile.png is a full-page responsive
reflow at 390x844 (mobile) viewport. They are part of this instruction:
recreate what they show. Where a screenshot and the text conflict, the text
wins. Do not copy the images into /app or ship them as app assets.
</reference_screenshots>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
Feature: Pet Care Events collection —
- Create, edit, archive, and filter pet care events with explicit domain statuses (empty, draft, ready, changed, archived)
- Exact field boundaries are accepted while adjacent out-of-range values are rejected.
- Invalid required fields preserve the prior valid record and explain recovery.
- Shared-state/artifact effect: Mutates records[] and status fields in pet-wellness-v1.json.
Feature: Spatial Composer surface —
- Place a selected record in a spatial composer and rebalance capacity
- Undo the last mutation and inspect the linked representation
- Visible states: idle, selected, changed, conflict, resolved
- A conflicting or incomplete mutation is rejected without partial updates.
- Undo restores ordering, selection, and derived values.
- Shared-state/artifact effect: Updates spatial-composer geometry/selection, derived summaries, and event history.
Feature: Portable work artifact —
- Export the current artifact
- Clear and import it with field-level validation
- Visible states: unsaved, exported, validated, replayed
- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
- A valid import restores authored structure and regenerates exportedAt.
- Shared-state/artifact effect: Produces pet-wellness-v1.json with schemaVersion, exportedAt, records, derived state, and history.
</core_features>

<user_flows>
- Create, edit, mutate, undo, and complete one record. The end-to-end job is recoverable without reload.
</user_flows>

<edge_cases>
- Try exact bounds, an invalid cross-field value, an empty state, and malformed import. Each invalid action gives field-level recovery and preserves prior valid state.
</edge_cases>

<visual_design>
- Inspect the primary work surface, linked summary, and detail panel. The visual hierarchy makes current state and next action clear.
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
</visual_design>

<motion>
- Place a selected record in a spatial composer and rebalance capacity. Motion connects the acted-on item to its new state and has a reduced-motion equivalent.
</motion>

<responsiveness>
- Use the signature interaction at a narrow viewport. The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow.
</responsiveness>

<accessibility>
- Repeat the signature interaction with keyboard and touch-equivalent controls. Alternate input produces identical state with visible focus and live feedback.
</accessibility>

<performance>
- Exercise a seeded collection with at least 100 records. The signature interaction remains responsive and unrelated rows stay stable.
</performance>

<writing>
- Inspect labels, statuses, errors, and empty-state text. Copy names the domain consequence and recovery action precisely.
</writing>

<innovation>
- Mutate a record and use the linked representation to make the next decision. Linked views provide domain utility beyond CRUD.
</innovation>

<requirements>
- The application must use React and Tailwind CSS 4.3.2.
- All libraries must be npm-local (no CDNs).
- In-memory state only (no localStorage).
- The portable work artifact uses the pet-wellness-v1-spatial-composer.json format containing schemaVersion (task-specific v1 enum), exportedAt (RFC3339), records, derived, and history.
</requirements>

<integrity>
- Begin from a genuinely clean state: no authored work, completion, approval, export, or success evidence may be preseeded.
- Treat every import mode as an atomic transaction over the same API-shaped schema used by create/edit/export. Validate all records and fields before commit.
- Reject unknown enums, exact-boundary violations, duplicate or dangling IDs, cross-field contradictions, stale derived values, and corrupted manifests with zero state mutation.
- A CRUD table cannot satisfy the domain-native signature, linked derived consequence, alternate input, causal motion, mobile transformation, or exact artifact round trip.
</integrity>

<delivery>
- The app must run on port 3000 (npm start).
</delivery>

<webmcp_action_contract>
{
  "tools": [
    {
      "name": "entity_create_record",
      "description": "Create a new pet care wellness log record",
      "inputSchema": {
        "type": "object",
        "properties": {
          "title": { "type": "string" },
          "status": { "type": "string", "enum": ["draft", "ready", "changed", "archived"] },
          "capacity": { "type": "number" }
        },
        "required": ["title", "status", "capacity"]
      }
    },
    {
      "name": "entity_update_record",
      "description": "Update an existing pet care wellness log record",
      "inputSchema": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "status": { "type": "string", "enum": ["draft", "ready", "changed", "archived"] },
          "capacity": { "type": "number" },
          "position": {
            "type": "object",
            "properties": {
              "x": { "type": "number" },
              "y": { "type": "number" }
            }
          }
        },
        "required": ["id"]
      }
    },
    {
      "name": "artifact_export_session_json",
      "description": "Export the current session state as JSON",
      "inputSchema": {
        "type": "object",
        "properties": {}
      }
    },
    {
      "name": "artifact_import_session_json",
      "description": "Import a session state from JSON",
      "inputSchema": {
        "type": "object",
        "properties": {
          "session_data": { "type": "string" }
        },
        "required": ["session_data"]
      }
    }
  ]
}
</webmcp_action_contract>
