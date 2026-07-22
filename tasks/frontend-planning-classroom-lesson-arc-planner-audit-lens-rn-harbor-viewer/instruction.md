<summary>
Manage lesson blocks through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: attach evidence to a selected record and resolve an audit discrepancy. A browser workbench with keyboard job switching, a file/artifact inspector, and explicit failed-upload recovery.
</summary>

<reference_screenshots>
</reference_screenshots>

<core_features>
The user must be able to create, edit, archive, and filter lesson blocks with explicit domain statuses.
The application must provide an audit lens surface to derive a decision about the collection.
The user must be able to export and restore the actual session work in a fresh state.
The application must provide keyboard job switching, a file/artifact inspector, and explicit failed-upload recovery.
The signature interaction is: attach evidence to a selected record and resolve an audit discrepancy.
</core_features>

<user_flows>
Create, edit, mutate, undo, and complete one record. The end-to-end job is recoverable without reload.
Use the audit lens interaction to derive a decision about the collection.
Undo the last mutation and inspect the linked representation.
Export the current artifact.
Clear and import it with field-level validation.
</user_flows>

<edge_cases>
A conflicting or incomplete mutation is rejected without partial updates.
Undo restores ordering, selection, and derived values.
Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
A valid import restores authored structure and regenerates exportedAt.
Invalid required fields preserve the prior valid record and explain recovery.
</edge_cases>

<visual_design>
A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
Desktop primary surface plus summary and inspector.
The visual hierarchy makes current state and next action clear.
</visual_design>

<motion>
The acted-on item moves or morphs into its new state.
Reduced motion preserves feedback without transforms.
</motion>

<responsiveness>
Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
Mobile transforms secondary surfaces into drawers or stacked steps.
</responsiveness>

<accessibility>
Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation.
Ctrl/Cmd+Z undoes the last mutation.
</accessibility>

<performance>
Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
</performance>

<writing>
Copy names the domain consequence and recovery action precisely.
</writing>

<innovation>
Linked views provide domain utility beyond CRUD.
Mutate a record and use the linked representation to make the next decision.
</innovation>



<requirements>
- The solution must be implemented with Tailwind CSS 4.3.2.
- Only use npm-local dependencies; no CDN or external networks.
The state must be entirely in-memory. Never use localStorage or remote network calls.
The solution must implement the signature interaction: attach evidence to a selected record and resolve an audit discrepancy.
The solution must provide an exportable/importable artifact lesson-arc-v1-audit-lens.json.
The solution must expose WebMCP standard modules on window.

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- A working implementation serving on port 3000 via npm start.
- WebMCP contract implemented on window.
</delivery>

<webmcp_action_contract>
```json
[
  {
    "name": "webmcp_session_info",
    "description": "Returns information about the current session and schema.",
    "parameters": {
      "type": "object",
      "properties": {},
      "required": []
    }
  },
  {
    "name": "webmcp_list_tools",
    "description": "Returns a list of available tools.",
    "parameters": {
      "type": "object",
      "properties": {},
      "required": []
    }
  },
  {
    "name": "webmcp_invoke_tool",
    "description": "Invokes a specified tool.",
    "parameters": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "arguments": {
          "type": "object"
        }
      },
      "required": ["name"]
    }
  }
]
```
</webmcp_action_contract>

- The solution must be implemented with Tailwind CSS 4.3.2.
- Only use npm-local dependencies; no CDN or external networks.
The state must be entirely in-memory. Never use localStorage or remote network calls.
The solution must implement the signature interaction: attach evidence to a selected record and resolve an audit discrepancy.
The solution must provide an exportable/importable artifact lesson-arc-v1-audit-lens.json.
The solution must expose WebMCP standard modules on window.
</requirements>

- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

- A working implementation serving on port 3000 via npm start.
- WebMCP contract implemented on window.
</delivery>

```json
[
  {
    "name": "webmcp_session_info",
    "description": "Returns information about the current session and schema.",
    "parameters": {
      "type": "object",
      "properties": {},
      "required": []
    }
  },
  {
    "name": "webmcp_list_tools",
    "description": "Returns a list of available tools.",
    "parameters": {
      "type": "object",
      "properties": {},
      "required": []
    }
  },
  {
    "name": "webmcp_invoke_tool",
    "description": "Invokes a specified tool.",
    "parameters": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "arguments": {
          "type": "object"
        }
      },
      "required": ["name"]
    }
  }
]
```
</webmcp_action_contract>
