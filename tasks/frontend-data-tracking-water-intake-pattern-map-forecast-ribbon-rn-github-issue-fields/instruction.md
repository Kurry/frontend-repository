<summary>
Create a React frontend application for managing water intake events. The application functions as a project evidence surface where users can track hydration patterns, adjust a selected record on a forecast ribbon, and compare projected outcomes. The app must manage a bounded collection of intake events with typed fields and explicit domain statuses. It must support exporting and importing the session state as a specific JSON artifact, with all persistence strictly in-memory.
</summary>

<core_features>
The application must allow users to create, edit, archive, and filter water intake events. The primary interaction must allow a user to adjust a selected record on a forecast ribbon and compare projected outcomes, with the changes updating the primary record, linked views, and statuses simultaneously. The application must support undoing the last mutation to restore the prior state, including selection, derived values, and ordering. It must provide an export function that downloads the current artifact and an import function that fully validates the imported schema, restoring the authored structure and regenerating the export timestamp.
</core_features>

<user_flows>
- Creating an intake event: The user inputs details for a new water intake event, and it appears in the primary surface.
- Signature interaction: The user selects a record on the forecast ribbon, adjusts it, and observes the projected outcomes update in the derived summary immediately.
- Export and import: The user exports the current work session to a JSON file. The user clears the local state, then imports the file. The original state, including selections and derived views, is exactly restored.
</user_flows>

<edge_cases>
- Field boundaries: Exact bounds are accepted, but adjacent out-of-range values are rejected with explicit field-level error recovery copy, preserving the prior valid state.
- Invalid imports: A malformed schema, unknown references, or invalid bounds during import are rejected with zero state mutation.
- Empty states: Appropriate empty state copy is displayed when no records exist.
</edge_cases>

<visual_design>
The visual thesis is a distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas. It features a desktop primary surface, a summary panel, and an inspector. The visual hierarchy must make the current state and the next action clear without simply copying unrelated screens.
</visual_design>

<motion>
Motion must causally connect the acted-on item to its new state, morphing or moving elements during transitions. A reduced-motion mode must be supported, preserving feedback without transforms.
</motion>

<responsiveness>
At narrow viewports, the desktop surface must transform into a usable stack, drawer, or stepper without any horizontal overflow or sub-44px touch targets. The signature interaction must remain fully functional on mobile layouts.
</responsiveness>

<accessibility>
The interface must provide semantic controls, keyboard parity, and focus management. The signature interaction must be entirely executable via keyboard and touch-equivalent controls with live feedback.
</accessibility>

<performance>
The signature interaction and general edits must remain responsive with a seeded collection of at least 100 records. Direct manipulation must acknowledge within 100ms, and linked views must settle within 500ms without layout jumps.
</performance>

<writing>
Copy must precisely name the domain consequence and the exact recovery action needed during errors.
</writing>

<innovation>
Linked utility is required. Mutating a record must provide domain utility beyond a simple CRUD table by updating a derived summary or linked decision surface, reflecting the impact of the change.
</innovation>

<requirements>
The application must use Tailwind CSS 4.3.2.
All libraries must be npm-local (no CDNs).
The application must maintain strictly in-memory state with no usage of localStorage or other browser persistence.
The application must not use any external network APIs.
</requirements>

<integrity>
- Clean state: No authored work or success evidence is preseeded.
- Canonical event: Alternate input paths must converge to the identical state mutation.
- Isolation: Previews and drafts do not leak into persisted state.
</integrity>

<delivery>
A fully working application served from the local build output, along with an exported `evidence.webm` demonstrating the core capabilities.
</delivery>

<webmcp_action_contract>
{
  "window.webmcp_session_info": {
    "description": "Returns session info containing the task slug.",
    "signature": "async () => ({ task_id: string })"
  },
  "window.webmcp_list_tools": {
    "description": "Lists standard WebMCP modules supported by the application.",
    "signature": "async () => Tool[]"
  },
  "window.webmcp_invoke_tool": {
    "description": "Executes WebMCP module actions (e.g., entity_create_record, artifact_export_session_json) and mutates app state.",
    "signature": "async (name: string, args: any) => any"
  }
}
</webmcp_action_contract>
