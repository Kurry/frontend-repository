# Community Fridge Restock Planner

<summary>
Manage restock tasks through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: adjust a selected record on a forecast ribbon and compare projected outcomes. Release-derived concept: a project evidence surface with typed fields, duplicate merges, saved queries, and release provenance.

Existing tools split restock tasks editing, derived decisions, and portable evidence. This task makes the connected user job observable in one frontend-only product. This concept adapts GitHub's shipped pattern of issue fields, duplicate detection, saved views, advanced project search, and release information in issue sidebars into a self-contained frontend job.
</summary>

<core_features>
Restock Tasks collection: Create, edit, archive, and filter restock tasks with explicit domain statuses (empty, draft, ready, changed, archived).
Forecast Ribbon surface: Use the forecast ribbon interaction to derive a decision about the collection. Adjust a selected record on a forecast ribbon and compare projected outcomes. Undo the last mutation and inspect the linked representation.
Portable work artifact: Export and restore the actual session work in a fresh state. Export the current artifact, clear and import it with field-level validation.
</core_features>

<user_flows>
- Create/edit/delete one record, filter or reorder records by domain state.
- Adjust a selected record on a forecast ribbon and compare projected outcomes, undo the last mutation and inspect the linked representation.
- Export the current artifact, clear and import it with field-level validation.
</user_flows>

<edge_cases>
- Exact field boundaries are accepted while adjacent out-of-range values are rejected. Invalid required fields preserve the prior valid record and explain recovery.
- A conflicting or incomplete mutation is rejected without partial updates. Undo restores ordering, selection, and derived values.
- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change. A valid import restores authored structure and regenerates exportedAt.
</edge_cases>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- Desktop primary surface plus summary and inspector.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state.
- Reduced motion preserves feedback without transforms.
</motion>

<responsiveness>
- Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
- Mobile transforms secondary surfaces into drawers or stacked steps.
</responsiveness>

<accessibility>
- Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
- Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
</accessibility>

<performance>
- Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
</performance>

<writing>
- Copy names the domain consequence and recovery action precisely. Identify the field, rejected value or rule, and recovery action for errors.
</writing>

<innovation>
- The tool result and artifact contain the declared API-shaped fields.
- Linked views provide domain utility beyond CRUD. The forecast ribbon surface, derived summary, and artifact query share one state.
</innovation>

<requirements>
The application must be a React frontend using Vite.
The application must use Tailwind CSS 4.3.2.
All libraries must be npm-local (no CDNs).
Good-app genre means in-memory state only, NO localStorage.
</requirements>

<integrity>
- Begin from a genuinely clean state: no authored work, completion, approval, export, or success evidence may be preseeded.
- State that the PRD promises to persist must survive reload exactly; transient previews, dialogs, hover, drag, and invalid drafts must not leak into persistence.
</integrity>

<delivery>
- The solution must be served on port 3000 via `npm start`.
- No page errors or console errors during normal usage.
</delivery>

<webmcp_action_contract>
window.webmcp_session_info = async () => ({
  task_id: "eval-intelligence/frontend-planning-community-fridge-restock-planner-forecast-ribbon-rn-github-issue-fields"
});
window.webmcp_list_tools = async () => ([
  {
    name: "entity_create_record",
    description: "Create a restock task",
    inputSchema: {
      type: "object",
      properties: {
        task: { type: "string" },
        status: { type: "string", enum: ["draft", "ready", "changed", "archived"] }
      },
      required: ["task", "status"]
    }
  },
  {
    name: "entity_update_record",
    description: "Update a restock task",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        task: { type: "string" },
        status: { type: "string", enum: ["draft", "ready", "changed", "archived"] }
      },
      required: ["id", "task", "status"]
    }
  },
  {
    name: "artifact_export_session_json",
    description: "Export the artifact",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "artifact_import_session_json",
    description: "Import the artifact",
    inputSchema: {
      type: "object",
      properties: {
        artifact: { type: "string" }
      },
      required: ["artifact"]
    }
  }
]);
window.webmcp_invoke_tool = async (name, args) => {
  if (name === "entity_create_record") {
    return window.__createRecord(args);
  }
  if (name === "entity_update_record") {
    return window.__updateRecord(args);
  }
  if (name === "artifact_export_session_json") {
    return window.__exportArtifact();
  }
  if (name === "artifact_import_session_json") {
    return window.__importArtifact(args.artifact);
  }
  throw new Error("Unknown tool");
};
</webmcp_action_contract>
