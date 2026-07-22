<summary>
Build a Comic Panel Rhythm Board application using React and Tailwind CSS 4.3.2. The app implements a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. It manages a session of comic panels (with fields for content, status, and derived state), featuring a desktop workspace that updates a mobile preview, timing notes, and a portable share artifact. The state must be entirely in-memory with a downloadable Session JSON document conforming to a defined API-shaped field contract and Import that round-trips the JSON.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
Feature: Comic Panels collection —
- Provide a main collection view displaying a deterministic seed of at least 4 comic panel records with varying initial statuses (empty, draft, ready, changed, conflict, resolved).
- Each panel displays its status, content, and linked summary data.
- The collection supports creating a new blank panel, editing panel content inline, deleting a panel, and filtering the list by domain state.
- Creating, editing, archiving, or deleting a panel updates the internal memory store immediately.
Feature: Recovery Board surface —
- Provide a Recovery Board workspace separate from the main list.
- Selecting a failed or conflicting panel loads it into the Recovery Board.
- Within the Recovery Board, the user can execute the signature mutation: "move a failed record into a recovery path and repair its downstream consequences". This changes the primary record, its linked view, and its status together.
- The user can Undo the last mutation, which restores the panel's ordering, selection, and derived values to their prior state.
Feature: Connected Views & Derived Consequences —
- Changes made in the Recovery Board or main list immediately update linked views: a desktop primary surface, a derived summary (like timing notes or a status breakdown), and a mobile preview view.
- Generating a mutation updates the internal history trail.
Feature: Portable work artifact —
- The application provides an Export action that downloads the current session state as comic-rhythm-v1-recovery-board.json.
- The export includes schemaVersion (set to 'v1'), 'exportedAt' (RFC3339 timestamp), 'records' array, 'derived' state, and 'history' array.
- The application provides an Import action with field-level validation to load a session JSON.
- A valid import restores the authored structure, derived state, and history, while regenerating 'exportedAt'.
- Malformed schema, duplicate IDs, unknown references, or invalid bounds during import are rejected and make no state change.
</core_features>

<visual_design>
Visual design (each line is an observable behavior the finished app must exhibit):
- Layout: A distinctive domain-specific workbench. On desktop, it shows a primary surface plus summary and inspector.
- Typography and clear state tokens: Statuses use distinct colors and labels indicating the domain state.
- Density: Intentional density with a calm focused canvas.
</visual_design>

<motion>
Motion (each line is an observable behavior the finished app must exhibit):
- Causal motion: Motion connects the acted-on item to its new state (e.g., when moving a failed record into a recovery path).
- Reduced-motion support: The interface respects 'prefers-reduced-motion: reduce' by replacing transitions with instant feedback.
</motion>

<requirements>
Technical requirements (each line is an observable requirement):
- Use React 18+ and Tailwind CSS 4.3.2.
- The state must be entirely in-memory. NO localStorage or other persistence mechanisms.
- All assets must be loaded locally without CDNs.
- Forms must validate input: exact field boundaries are accepted, adjacent out-of-range values are rejected, and invalid required fields preserve the prior valid record while explaining recovery.
- Responsive behavior: Narrow layouts (mobile) transform the desktop surface into usable drawers or stacked steps without horizontal overflow. Interaction models change, preserving touch targets.
- Accessibility: Provide semantic controls, keyboard parity (equivalent controls to mouse interactions), focus management, live updates for screen readers, adequate contrast, and reduced-motion support. Alternate input must produce identical state with visible focus and live feedback.
- Performance: The application remains responsive and unrelated surfaces do not rebuild when editing a collection seeded with at least 100 records.
</requirements>

<integrity>
- Work only from this instruction and /app; do not use /solution, /tests, or verifier artifacts.
</integrity>

<delivery>
- The project runs on port 3000.
</delivery>

<webmcp_action_contract>
[
  {
    "name": "get_state",
    "description": "Returns the current state of the application",
    "input_schema": {
      "type": "object",
      "properties": {}
    }
  },
  {
    "name": "select_record",
    "description": "Selects a record into the Recovery Board",
    "input_schema": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        }
      },
      "required": [
        "id"
      ]
    }
  },
  {
    "name": "recover_record",
    "description": "Executes the signature mutation on a selected record",
    "input_schema": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "content": {
          "type": "string"
        },
        "timing": {
          "type": "number"
        }
      },
      "required": [
        "id",
        "content",
        "timing"
      ]
    }
  },
  {
    "name": "undo",
    "description": "Undoes the last action",
    "input_schema": {
      "type": "object",
      "properties": {}
    }
  },
  {
    "name": "import_session",
    "description": "Imports a session artifact payload",
    "input_schema": {
      "type": "object",
      "properties": {
        "session": {
          "type": "object"
        }
      },
      "required": [
        "session"
      ]
    }
  }
]
</webmcp_action_contract>
