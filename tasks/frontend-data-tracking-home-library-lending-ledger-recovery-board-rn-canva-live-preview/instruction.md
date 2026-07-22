<summary>
Manage books through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: move a failed record into a recovery path and repair its downstream consequences. Release-derived concept: a design workspace where desktop edits update mobile preview, timing notes, and a portable share artifact.

Existing tools split books editing, derived decisions, and portable evidence. This task makes the connected user job observable in one frontend-only product.
</summary>

<core_features>
The application must provide a complete books collection management interface, including:
- Viewing, adding, editing, and deleting book records.
- Each book record has fields such as title, author, isbn, pageCount, status, and condition. Valid statuses are empty, draft, ready, changed, archived.
- A Recovery Board interface that allows a user to select a "failed" or problematic book record, move it into a "recovery" status, and resolve its downstream consequences, such as missing ISBN or invalid pages.
- The recovery board mutation must instantly update the primary record, linked views, and summary statistics.
- Users must be able to undo the last mutation, which restores ordering, selection, and derived values.
</core_features>

<user_flows>
- The user can view a dashboard showing the collection and a summary of recovery board items.
- The user identifies a record that requires attention and clicks a "Move to Recovery" button.
- The UI reveals a recovery panel for the selected record, prompting the user to correct invalid or missing data.
- The user provides corrections and resolves the recovery state, returning the item to a "ready" status.
- The user can export their current session into an interoperable .json file (library-lending-v1-recovery-board.json).
</user_flows>

<edge_cases>
- Exact field boundaries (e.g. maximum page count, future dates) are accepted while adjacent out-of-range values are rejected.
- Invalid required fields preserve the prior valid record and explain recovery.
- A conflicting or incomplete mutation in the recovery board is rejected without partial updates.
- Malformed schema, duplicate IDs, unknown references, and invalid bounds on import make no state change.
</edge_cases>

<visual_design>
- The UI acts as a dedicated design workspace/workbench with clear state tokens.
- Intentional density and a calm, focused canvas.
- A visual hierarchy that clearly distinguishes the primary work surface, linked summary, and detail/recovery panel, making current state and next action apparent.
</visual_design>

<motion>
- The acted-on item animates (moves or morphs) into its new state during transitions (e.g. into and out of the recovery board).
- A reduced-motion mode must be respected; when prefers-reduced-motion is enabled, these transforms are removed while preserving immediate feedback.
</motion>

<responsiveness>
- Narrow layouts (mobile viewports) change the interaction model, transforming secondary desktop surfaces into drawers or stacked steps.
- Touch targets must be preserved (minimum 44px).
- There must be no horizontal clipping or page-level overflow.
</responsiveness>

<accessibility>
- All interactive elements must use semantic HTML controls.
- Keyboard and touch-equivalent controls must produce the identical canonical mutation (including Ctrl/Cmd+Z for undo).
- Modal interactions must trap focus and return focus on close.
- Live announcements must be used for dynamic state changes.
- Focus rings must be visible.
- Ensure sufficient color contrast.
</accessibility>

<performance>
- Edits must remain responsive on collections of 100+ records.
- Direct manipulation must acknowledge within 100 ms.
- Linked/derived views must settle within 500 ms.
- Unrelated rows and surfaces must not unnecessarily re-render or jump.
</performance>

<writing>
- Domain copy must clearly and precisely name the domain consequence and the recovery action.
- Error messages must identify the field, the rejected value or rule, and the necessary recovery action.
</writing>

<innovation>
- Linked views provide domain utility beyond a simple CRUD list, showing clear consequences of moving items to the recovery path.
- The design exhibits a strong functional thesis coherent with real-world lending ledge tools.
</innovation>

<requirements>
- The application must be a single-page React application built with Vite.
- The application must use Tailwind CSS 4.3.2.
- All libraries must be npm-local (no CDNs).
- State must be strictly in-memory (no localStorage, sessionStorage, or IndexedDB).
- The exported artifact must be named library-lending-v1-recovery-board.json and must have a specific schema including schemaVersion (set to v1), exportedAt (RFC3339 string), records, derived, and history.
</requirements>

<integrity>
- Begin from a genuinely clean state: no authored work, completion, approval, export, or success evidence may be preseeded.
- Treat every import mode as an atomic transaction. Validate all records and fields before commit.
</integrity>

<delivery>
- Complete implementation of the user job in the Oracle application.
- WebMCP standard modules must be exposed and functioning properly.
- All dependencies must be correctly declared in package.json.
</delivery>

<webmcp_action_contract>
{
  "window.webmcp_session_info": {
    "expected_return": {
      "task_id": "eval-intelligence/frontend-data-tracking-home-library-lending-ledger-recovery-board-rn-canva-live-preview"
    }
  },
  "modules": [
    {
      "name": "entity-collection-v1",
      "tools": [
        "entity_create_record",
        "entity_update_record",
        "entity_delete_record",
        "entity_list_records"
      ]
    },
    {
      "name": "artifact-transfer-v1",
      "tools": [
        "artifact_export_session_json",
        "artifact_import_session_json"
      ]
    }
  ]
}
</webmcp_action_contract>
