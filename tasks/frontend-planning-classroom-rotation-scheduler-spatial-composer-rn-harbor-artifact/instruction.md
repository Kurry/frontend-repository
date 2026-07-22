<summary>
Create a Classroom Rotation Scheduler web application where users can manage learning stations, assign records to a spatial composer to rebalance capacity, and export or import the session state. The application features a canonical mutation that updates the primary record, linked views, and domain statuses simultaneously, ensuring an exact artifact round trip.
</summary>

<reference_screenshots>
None
</reference_screenshots>

<core_features>
The user can manage a collection of stations, filter by domain status, and create, edit, or delete records.
The user can place a selected record in a spatial composer to rebalance capacity, updating both the individual record and the derived overview.
The user can interact with linked representations where editing the spatial composer immediately updates the collection summary and record statuses.
The user can undo the last mutation, accurately reverting the primary record, linked views, and derived states.
The user can export the session to an interoperable classroom-rotations-v1.json artifact and restore the state via import.
</core_features>

<user_flows>
The user creates a new draft station record and fills in the necessary details.
The user selects a ready station and places it into the spatial composer to resolve a conflict.
The user reviews the updated capacity summary and sees that the station state has transitioned.
The user exports the session to a JSON artifact to preserve the state.
The user clears the session and imports the artifact, verifying that all records and derived states are exactly restored.
</user_flows>

<edge_cases>
Invalid bound inputs are rejected, and the previous valid state is maintained with an inline recovery message.
Attempting to import a malformed or invalid schema file results in no state changes and clear error messaging.
A conflicting or incomplete mutation in the spatial composer is rejected without partial updates.
Empty states are gracefully handled, guiding the user on how to add their first station.
</edge_cases>

<visual_design>
The application presents a focused domain-specific workbench with a calm canvas and clear state tokens for statuses.
Layouts maintain a distinct hierarchy with a primary desktop surface, a summary view, and an inspector panel.
Density is intentional, ensuring that data is readable while allowing room for drag-and-drop or spatial interactions.
Colors and typography distinguish between draft, ready, changed, and archived states.
</visual_design>

<motion>
When a record is acted upon in the spatial composer, it visually transitions or morphs into its new state.
Feedback for actions is immediate, smoothly animating list reordering and state updates.
The application respects reduced-motion preferences by omitting transforms while preserving clarity.
</motion>

<responsiveness>
At narrow viewports, the desktop primary surface converts into a usable stack, drawer, or stepper.
Interactions adjust to prevent horizontal clipping while maintaining large touch targets for mobile usability.
The spatial composer remains fully functional via touch or alternative input.
</responsiveness>

<accessibility>
All signature interactions, including the spatial composer, have complete keyboard parity and semantic controls.
Focus is properly managed during modal or drawer transitions and after undo actions.
Live regions announce significant state changes, such as resolving a conflict or an invalid import attempt.
</accessibility>

<performance>
The application remains highly responsive when populated with a seeded collection of at least 100 records.
Updating a single station in the spatial composer does not cause full re-renders of unrelated list items.
</performance>

<writing>
Labels, statuses, and error messages use precise domain language, avoiding generic technical jargon.
Empty states explain the required domain action to proceed.
</writing>

<innovation>
The application provides domain utility beyond basic CRUD by tightly linking the spatial composer decisions to the collection summary.
The artifact export mechanism implements a Provenance pattern, cleanly handling validation, redaction concepts, and exact lineage tracing.
</innovation>

<requirements>
The state must be managed entirely in-memory with no localStorage or backend network dependencies.
The application must export and import a classroom-rotations-v1.json artifact containing schemaVersion, exportedAt, records array, derived state, and history.
The spatial composer must be fully operable using keyboard and touch equivalents.
The application must expose a WebMCP contract on window.webmcp_session_info matching the required tool schemas.
Dependencies like Tailwind CSS 4.3.2 must be installed locally via npm. Do not use CDNs.
</requirements>

<integrity>
Work only from this instruction and /app; do not use /solution, /tests, or verifier artifacts.
</integrity>

<delivery>
The application must be a functional React application served on port 3000.
Run npm start to serve the application.
Ensure zero console errors and strict handling of edge cases as defined.
</delivery>

<webmcp_action_contract>
{
  "entity_create_record": {
    "description": "Create a new entity record",
    "payload_schema": {
      "type": "object",
      "properties": {
        "title": { "type": "string" },
        "status": { "type": "string" }
      },
      "required": ["title", "status"]
    }
  },
  "entity_update_record": {
    "description": "Update an existing entity record",
    "payload_schema": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "status": { "type": "string" }
      },
      "required": ["id"]
    }
  },
  "artifact_export_session_json": {
    "description": "Export the current session as a JSON artifact",
    "payload_schema": {
      "type": "object",
      "properties": {},
      "required": []
    }
  },
  "artifact_import_session_json": {
    "description": "Import a JSON artifact to restore the session",
    "payload_schema": {
      "type": "object",
      "properties": {
        "json_string": { "type": "string" }
      },
      "required": ["json_string"]
    }
  }
}
</webmcp_action_contract>
