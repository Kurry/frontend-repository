<summary>
A frontend-only React application for a Coffee Brew Experiment Log featuring a Provenance Atlas. Users manage brew experiments through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. The core feature allows users to trace a selected record to source evidence and quarantine a bad lineage. Built with React, Vite, Tailwind CSS 4.3.2 npm-local/no-CDN, and Zustand for in-memory state.
</summary>

<core_features>
Brew Experiments collection: Create, edit, archive, and filter brew experiments with explicit domain statuses (empty, draft, ready, changed, archived).
Provenance Atlas surface: Trace a selected record to source evidence and quarantine a bad lineage. Undo the last mutation and inspect the linked representation.
Portable work artifact: Export and restore the session work in a fresh state without partial updates using brew-experiment-v1.json.
</core_features>

<visual_design>
Distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
Layout features a desktop primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps.
The visual hierarchy makes current state and next action clear.
</visual_design>

<motion>
The acted-on item moves or morphs into its new state.
Reduced motion preserves feedback without transforms.
</motion>

<requirements>
Bounded local workflow with in-memory state only; no localStorage.
Artifact schema: brew-experiment-v1.json with schemaVersion (v1), exportedAt (RFC3339), records (unique IDs, explicit enum statuses), derived, and history.
Built using React, Vite, Tailwind CSS 4.3.2 npm-local/no-CDN installation, and Zustand.
The artifact must survive a complete round trip: export, clear, and import, restoring authored structure and regenerating exportedAt.
</requirements>

<webmcp_action_contract>
```json
{
  "tools": [
    {
      "name": "create_experiment",
      "description": "Create a new brew experiment",
      "inputSchema": {
        "type": "object",
        "properties": {
          "title": { "type": "string" },
          "beanOrigin": { "type": "string" },
          "roastDate": { "type": "string" }
        },
        "required": ["title"]
      }
    },
    {
      "name": "update_experiment",
      "description": "Update an existing brew experiment",
      "inputSchema": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "title": { "type": "string" },
          "status": { "type": "string" }
        },
        "required": ["id"]
      }
    },
    {
      "name": "trace_lineage",
      "description": "Trace a selected record to source evidence and quarantine a bad lineage",
      "inputSchema": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "quarantineReason": { "type": "string" }
        },
        "required": ["id"]
      }
    },
    {
      "name": "undo_last_action",
      "description": "Undo the last mutation",
      "inputSchema": {
        "type": "object",
        "properties": {}
      }
    },
    {
      "name": "export_artifact",
      "description": "Export the current session state as a JSON artifact",
      "inputSchema": {
        "type": "object",
        "properties": {}
      }
    },
    {
      "name": "import_artifact",
      "description": "Import a session state JSON artifact",
      "inputSchema": {
        "type": "object",
        "properties": {
          "artifact": { "type": "string" }
        },
        "required": ["artifact"]
      }
    }
  ]
}
```
</webmcp_action_contract>
