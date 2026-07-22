# Community Workshop Toolboard — Forecast Ribbon — GitHub Issue Fields

<summary>
Manage workshop stations through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: adjust a selected record on a forecast ribbon and compare projected outcomes. Release-derived concept: a project evidence surface with typed fields, duplicate merges, saved queries, and release provenance. Tailwind CSS 4.3.2 is required.
</summary>

<reference_screenshots>
</reference_screenshots>

<core_features>
The application serves as a self-contained local workspace to manage workshop stations, featuring:
1. Workshop Stations collection: Create, edit, archive, and filter workshop stations with explicit domain statuses.
2. Forecast Ribbon surface: Adjust a selected record on a forecast ribbon and compare projected outcomes.
3. Undo functionality: Undo the last mutation and inspect the linked representation.
4. Portable work artifact: Export and restore the actual session work in a fresh state via JSON.
</core_features>

<user_flows>
1. Create a workshop station record.
2. Edit its fields to valid values.
3. Adjust the record on the forecast ribbon to project outcomes.
4. Export the artifact to a file.
5. Clear the application state and import the artifact to restore the authored structure and derived state.
</user_flows>

<edge_cases>
1. Attempting to input out-of-range boundaries or invalid cross-field values preserves the prior valid record and explains recovery.
2. A conflicting or incomplete forecast ribbon mutation is rejected without partial updates.
3. Malformed schema, duplicate IDs, unknown references, and invalid bounds during import make no state change.
</edge_cases>

<visual_design>
A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas. The layout includes a primary surface plus summary and inspector on desktop. Visual hierarchy makes current state and next action clear.
</visual_design>

<motion>
The acted-on item moves or morphs into its new state when adjusting a selected record on a forecast ribbon. Reduced motion preserves feedback without transforms.
</motion>

<responsiveness>
Narrow layouts change the interaction model, preserving touch targets and avoiding horizontal clipping by turning secondary surfaces into drawers or stacked steps.
</responsiveness>

<accessibility>
Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support. Alternate input (keyboard/touch) produces the identical canonical mutation as mouse interactions.
</accessibility>

<performance>
The signature interaction remains responsive on 100+ records, avoiding rebuilding unrelated surfaces.
</performance>

<writing>
Copy precisely names the domain consequence and recovery actions (e.g., in errors, labels, statuses, empty states).
</writing>

<innovation>
Linked views provide domain utility beyond basic CRUD by integrating a forecast ribbon surface, derived summary, and artifact query sharing one state.
</innovation>

<requirements>
1. Implement the entire application purely in-memory (no localStorage, no external backend).
2. Ensure the state represents a CommunityWorkshopToolboardSession with schemaVersion, exportedAt, records, derived, and history.
3. Support export to workshop-toolboard-v1-forecast-ribbon.json and import from it, validating data during import.
4. Expose WebMCP standard tooling interfaces for manipulating and querying the data.
5. Use only local npm dependencies; no CDNs allowed.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
Please provide a full, working React-based application that can be run locally on port 3000. Do not implement any mock backends or use browser storage; keep all state strictly in-memory.
</delivery>

<webmcp_action_contract>
[
  {
    "name": "entity_create_record",
    "description": "Create a new workshop station record.",
    "input_schema": {
      "type": "object",
      "properties": {
        "title": { "type": "string" },
        "status": { "type": "string" },
        "forecastValue": { "type": "number" }
      },
      "required": ["title", "status", "forecastValue"]
    }
  },
  {
    "name": "entity_update_record",
    "description": "Update an existing workshop station record's status or forecast value.",
    "input_schema": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "status": { "type": "string" },
        "forecastValue": { "type": "number" }
      },
      "required": ["id"]
    }
  },
  {
    "name": "artifact_export_session_json",
    "description": "Export the current session state to JSON.",
    "input_schema": {
      "type": "object",
      "properties": {},
      "required": []
    }
  },
  {
    "name": "artifact_import_session_json",
    "description": "Import a session state from a JSON string.",
    "input_schema": {
      "type": "object",
      "properties": {
        "payload_json": { "type": "string" }
      },
      "required": ["payload_json"]
    }
  }
]
</webmcp_action_contract>
