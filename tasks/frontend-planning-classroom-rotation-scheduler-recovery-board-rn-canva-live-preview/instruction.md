<summary>
Build a Classroom Rotation Scheduler app using React, Vite, and Tailwind CSS 4.3.2. The app features a domain-native browser surface to manage stations, allowing users to move a failed record into a recovery path and repair its downstream consequences. The workspace provides a live desktop-to-mobile preview paradigm inspired by Canva, keeping linked views (Recovery Board, derived summaries) and a portable JSON artifact (classroom-rotations-v1.json) perfectly synced. All state must be purely in-memory.
</summary>

<reference_screenshots>
Reference screenshots are not provided for this task. Focus entirely on the visual and interaction thesis defined in this specification.
</reference_screenshots>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
Feature: Stations collection —
Create, edit, archive, and filter station records by their domain status (e.g., draft, ready, changed, archived).
Exact field boundaries are accepted; invalid out-of-range values or cross-field violations are rejected immediately with field-level recovery guidance.
Feature: Recovery Board surface —
Provide a Recovery Board interaction: move a failed record into a recovery path and repair its downstream consequences.
Conflicting or incomplete mutations are rejected with no partial updates to the state.
Support an Undo action that restores the exact prior state, including ordering, selection, and derived values.
Feature: Portable work artifact —
Implement an Export control that generates a downloadable classroom-rotations-v1.json matching the API shape.
Implement an Import control that validates and completely restores the authored structure, regenerating exportedAt. Invalid files (malformed schema, duplicate IDs, unknown references, or invalid bounds) cause no state change.
</core_features>

<user_flows>
User flows (each line is an observable behavior the finished app must exhibit):
Users can create, edit, mutate, undo, and complete one record seamlessly without needing a page reload.
</user_flows>

<edge_cases>
Edge cases (each line is an observable behavior the finished app must exhibit):
Provide field-level recovery for out-of-bounds inputs, invalid cross-field values, empty states, and malformed imports while preserving the prior valid state.
</edge_cases>

<visual_design>
Visual design (each line is an observable behavior the finished app must exhibit):
The visual hierarchy clearly differentiates the primary work surface, linked summary, and detail panel, making the current state and next action obvious.
</visual_design>

<motion>
Motion (each line is an observable behavior the finished app must exhibit):
Causal motion connects the acted-on item to its new state visually. Provide a reduced-motion equivalent that preserves feedback without transforms.
</motion>

<responsiveness>
Responsiveness (each line is an observable behavior the finished app must exhibit):
Narrow viewports transform the desktop primary surface into usable stacked steps, drawers, or steppers without horizontal clipping.
</responsiveness>

<accessibility>
Accessibility (each line is an observable behavior the finished app must exhibit):
Support alternate input parity: keyboard and touch controls must produce the identical canonical mutation as mouse interactions, showing visible focus and live feedback.
</accessibility>

<performance>
Performance (each line is an observable behavior the finished app must exhibit):
The app handles collections of at least 100 records smoothly. Unrelated surfaces and rows remain stable and do not needlessly re-render during mutations.
</performance>

<writing>
Writing (each line is an observable behavior the finished app must exhibit):
Domain copy precisely names domain consequences, recovery actions, labels, statuses, errors, and empty states.
</writing>

<innovation>
Innovation (each line is an observable behavior the finished app must exhibit):
Linked utility ensures derived views give domain value beyond CRUD operations. Mutating a record in the primary surface allows making decisions via the linked representations.
</innovation>

<requirements>
Requirements (each line is an observable behavior the finished app must exhibit):
The application state must be entirely in-memory. Never use localStorage or remote network calls.
The classroom-rotations-v1.json artifact uses the shape: schemaVersion (task-specific v1 enum), exportedAt (RFC3339 timestamp), records (array of objects), derived, and history.
Record IDs are unique and status values are explicit enums. Required fields, numeric/date bounds, and cross-record references validate together.
Use only npm-local packages; do not load scripts or CSS from CDNs.
</requirements>

<integrity>
- Work only from this instruction and /app; do not use /solution, /tests, or verifier artifacts.
</integrity>

<delivery>
Deliver the application in /app, ready to run on port 3000 via npm start.
</delivery>

<webmcp_action_contract>
# WebMCP action contract

**Contract version:** `zto-webmcp-v1`

**Allowed tool registry**
(These are the only tools the host is permitted to register.)
- `entity_create_record`
- `entity_update_record`
- `artifact_export_session_json`
- `artifact_import_session_json`

**Field schema types**
- `ActionId`: String matching `^[a-zA-Z0-9_-]{1,64}$`.
- `StatusEnum`: String matching exactly `draft`, `ready`, `changed`, or `archived`.

**Tool: `entity_create_record`**
- **Description**: Creates a new station record.
- **Input parameters**:
  - `name`: (string) The name of the station.
  - `status`: (`StatusEnum`) The status of the station.
- **Expected effect**: A new record is added to the collection and becomes visible on the primary work surface.

**Tool: `entity_update_record`**
- **Description**: Updates an existing station record, typically to move a failed record into a recovery path.
- **Input parameters**:
  - `id`: (string) The ID of the station to update.
  - `name`: (string, optional) The new name.
  - `status`: (`StatusEnum`, optional) The new status.
- **Expected effect**: The record is updated. The recovery board and derived summaries update immediately to reflect the repaired downstream consequences.

**Tool: `artifact_export_session_json`**
- **Description**: Exports the current application state matching the API-shaped artifact contract.
- **Input parameters**: None.
- **Expected effect**: Returns the `classroom-rotations-v1.json` object.

**Tool: `artifact_import_session_json`**
- **Description**: Imports and completely replaces the in-memory application state using a provided artifact.
- **Input parameters**:
  - `artifact`: (object) The complete `classroom-rotations-v1.json` payload.
- **Expected effect**: The UI re-renders immediately to match the newly imported state.
</webmcp_action_contract>
