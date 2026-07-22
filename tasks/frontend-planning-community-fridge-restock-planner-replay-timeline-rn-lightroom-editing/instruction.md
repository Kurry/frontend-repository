# Community Fridge Restock Planner — Replay Timeline

<summary>
Manage restock tasks through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: scrub a selected record through its timeline and restore a prior checkpoint. Release-derived concept: a media board where selections, batch edits, histogram ranges, and sequence exports remain synchronized.
</summary>

<reference_screenshots>
</reference_screenshots>

<core_features>
1. Restock Tasks collection: Create, edit, archive, and filter restock tasks with explicit domain statuses.
2. Replay Timeline surface: scrub a selected record through its timeline and restore a prior checkpoint. Linked views remain synchronized.
3. Portable work artifact: Export and restore the actual session work in a fresh state via JSON.
</core_features>

<user_flows>
1. Create a restock task, edit details.
2. Mutate state: Scrub the record through its timeline using the replay timeline interaction. Linked views update immediately.
3. Undo the mutation and verify prior state is restored.
4. Export the resulting session as fridge-restock-v1.json.
5. Clear the application state and import the JSON to restore the session exactly.
</user_flows>

<edge_cases>
1. Exact field boundaries are accepted; adjacent out-of-range values are rejected.
2. Invalid required fields during edit preserve the prior valid record and display an error explaining recovery.
3. A conflicting or incomplete mutation during the replay timeline scrub is rejected without partial updates.
4. Import of a malformed schema, duplicate IDs, unknown references, or invalid bounds results in no state change.
</edge_cases>

<visual_design>
A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas. The visual hierarchy makes current state and next action clear.
</visual_design>

<motion>
The acted-on item moves or morphs into its new state. Reduced motion preferences preserve feedback without transforms.
</motion>

<responsiveness>
Desktop layout has primary surface plus summary and inspector. Mobile transforms secondary surfaces into drawers or stacked steps, preserving interaction models and touch targets without horizontal clipping.
</responsiveness>

<accessibility>
Keyboard and touch-equivalent controls produce the identical canonical mutation. Focus management, live updates, semantic controls, contrast, and reduced-motion support are required.
</accessibility>

<performance>
The application remains responsive with 100 or more seeded records. The signature interaction and filtering remain fast without rebuilding unrelated surfaces.
</performance>

<writing>
Copy for labels, statuses, errors, and empty states precisely names the domain consequence and recovery action.
</writing>

<innovation>
Linked utility: Mutating a record immediately updates a linked representation that is used to make the next decision, providing domain utility beyond standard CRUD operations.
</innovation>

<requirements>
1. The replay timeline mutation changes the primary record, linked view, and status together (AC-01).
2. The visual hierarchy makes current state and next action clear (AC-02).
3. Motion connects the acted-on item to its new state and has a reduced-motion equivalent (AC-03).
4. The tool result and artifact contain the declared API-shaped fields (AC-04).
5. The end-to-end job is recoverable without reload (AC-05).
6. Each invalid action gives field-level recovery and preserves prior valid state (AC-06).
7. The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow on mobile (AC-07).
8. Alternate input produces identical state with visible focus and live feedback (AC-08).
9. The signature interaction remains responsive and unrelated rows stay stable on a large collection (AC-09).
10. Copy names the domain consequence and recovery action precisely (AC-10).
11. Linked views provide domain utility beyond CRUD (AC-11).
12. The visual and interaction thesis is coherent without copying unrelated screens (AC-12).
13. Authored order/selection/geometry and domain state survive import/export; invalid import is a no-op (AC-13).
14. Use Tailwind CSS 4.3.2 installed via npm local dependencies; no remote CDNs.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
</delivery>

<webmcp_action_contract>
```javascript
/**
 * Executes a tool using the WebMCP protocol.
 * @param {string} tool - The name of the tool to execute.
 * @param {Object} args - The arguments for the tool.
 * @returns {Promise<any>} The result of the tool execution.
 */
window.webmcp_invoke_tool = async (tool, args) => {
  // Implementation will be provided by the environment
};

/**
 * Lists the available tools using the WebMCP protocol.
 * @returns {Promise<Array<Object>>} A list of available tools.
 */
window.webmcp_list_tools = async () => {
  return [
    {
      name: "entity_create_record",
      description: "Create a new restock task record.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          status: { type: "string", enum: ["draft", "ready", "changed", "archived"] },
          // other domain-specific fields
        },
        required: ["title", "status"]
      }
    },
    {
      name: "entity_update_record",
      description: "Update an existing restock task record.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          status: { type: "string", enum: ["draft", "ready", "changed", "archived"] },
        },
        required: ["id"]
      }
    },
    {
      name: "artifact_export_session_json",
      description: "Export the current session state as a JSON artifact.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    },
    {
      name: "artifact_import_session_json",
      description: "Import a session state from a JSON artifact.",
      parameters: {
        type: "object",
        properties: {
          artifact: { type: "object" }
        },
        required: ["artifact"]
      }
    }
  ];
};
```
</webmcp_action_contract>
