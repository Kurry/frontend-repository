<summary>
Build a Community Garden Workday Planner using React, Tailwind CSS 4.3.2, and frontend-only in-memory state. The application features a Work Tasks collection, a Constraint Canvas for dragging records across lanes to resolve conflicts, and a portable session artifact system. The app produces the operator's session artifact: a downloadable JSON document compiled live from the tasks, constraint canvas state, derived summary, and history, conforming to a strict API-shaped schema, with an Import function that round-trips that JSON perfectly.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
Feature: Work Tasks collection —
- Create, edit, delete, and archive work tasks. Each record has a title, description, domain status (empty, draft, ready, changed, archived), and a unique ID.
- Filter records by domain state.
- Create/edit validate fields: title is required and cannot be empty; status must be one of the enums. Invalid fields preserve the prior valid record and explain recovery (inline error).
Feature: Constraint Canvas surface —
- A drag-and-drop workbench (lanes) representing constraint dimensions (e.g., equipment, volunteers, time, resolved).
- Drag a selected record across constraint lanes and resolve a conflict. Records dropped in conflicting states show a conflict indicator, which can be resolved by mutating the record.
- Undo the last mutation and inspect the linked representation: pressing Undo restores the previous ordering, selection, and derived values.
- Visible states on the canvas: idle, selected, changed, conflict, resolved.
Feature: Linked Views and Derived State —
- The primary work tasks list, the constraint canvas, and a derived summary view (showing stats like total tasks, conflicts, and resolved items) share one state. Mutating a record in the canvas updates the list and the summary immediately.
Feature: Portable work artifact —
- Export the current artifact: compiles to `garden-workday-v1-constraint-canvas.json` containing schemaVersion (exactly 'garden-workday-v1'), exportedAt (RFC3339), records[], derived{}, and history[].
- Import an artifact with field-level validation. Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change and show an inline error. A valid import restores authored structure and regenerates exportedAt.
- Clear the current session to a fresh empty state.
- Download the JSON file directly.
</core_features>

<user_flows>
End-to-end flows:
- Creation and canvas flow: Create a task, see it in the list. Drag it into a constraint lane on the canvas. If dropped in a conflict lane, observe conflict state. Resolve conflict.
- Linked utility flow: Mutate a record on the canvas, then use the linked summary to make the next decision based on the derived stats.
- Artifact round trip flow: Export the session, Clear the app, Import the downloaded JSON file, and inspect the edited variant record and derived state to ensure authored order/selection/geometry and domain state survive.
</user_flows>

<edge_cases>
- Exact boundaries are accepted; adjacent out-of-range or invalid required fields (e.g., empty title) are rejected without partial updates and explain recovery.
- Undo restores complete prior snapshot including selection, viewport (if applicable), filters, focus, and history anchor.
- Malformed import (wrong schema, bad types) is a no-op and shows validation error.
</edge_cases>

<visual_design>
- Distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- The visual hierarchy makes current state and next action clear.
- Layout: Desktop primary surface plus summary and inspector.
</visual_design>

<motion>
- Causal motion: Motion connects the acted-on item to its new state (e.g., drag and drop animation).
- Reduced motion preserves feedback without transforms (e.g., direct state change without animation if prefers-reduced-motion is active).
</motion>

<responsiveness>
- Desktop layout features side-by-side or layered canvas and lists.
- Mobile mode: The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow at narrow viewports (e.g., 375px).
</responsiveness>

<accessibility>
- Alternate input: Repeat the signature interaction (drag across lanes) with keyboard and touch-equivalent controls. Alternate input produces identical state with visible focus and live feedback.
- Semantic controls, keyboard parity, focus management, live announcements.
</accessibility>

<performance>
- Large collection: Exercise a seeded collection with at least 100 records; the signature interaction remains responsive and unrelated rows stay stable.
</performance>

<writing>
- Domain copy: Inspect labels, statuses, errors, and empty-state text. Copy names the domain consequence and recovery action precisely.
</writing>

<innovation>
Optional enhancements the builder may add (not required for passing): keyboard shortcut map displayed in a dialog, advanced search query language for filtering.
</innovation>

<requirements>
The application must use strictly in-memory state; NO localStorage, sessionStorage, or other browser storage APIs are allowed.
The application must use Tailwind CSS 4.3.2.
All libraries must be npm-local (no CDNs).
Frontend-only architecture: use React (Vite).
State changes must be fully synchronous and reactive across all linked views.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- entity-collection-v1
- artifact-transfer-v1

Module specs:
<module_spec id="entity-collection-v1">
{
  "id": "entity-collection-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Entity collection",
  "purpose": "Carts, records, favorites, calendar events, list items, and local entities.",
  "permitted_operations": ["create", "select", "update", "delete", "toggle", "quantity", "reorder"],
  "binding_keys": {
    "required_any_of": [["entity"], ["entity_operations"]],
    "optional": ["entity_fields", "value_bounds", "visible_postconditions"]
  },
  "restrictions": [
    "Closed entity and field enums only.",
    "Bounded string and numeric values.",
    "No generic state setter or arbitrary patch object.",
    "Invokes the same domain command used by the visible control.",
    "Delete requires explicit confirm=true.",
    "Reorder only when gesture mechanics are not being evaluated."
  ],
  "tool_name_prefix": "entity"
}
</module_spec>

<module_spec id="artifact-transfer-v1">
{
  "id": "artifact-transfer-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Artifact transfer",
  "purpose": "Import, export, copy, print, and conversion workflows.",
  "permitted_operations": ["import", "export", "copy", "print_preview", "convert"],
  "binding_keys": {
    "required_any_of": [["artifact_operations"]],
    "optional": ["import_modes", "export_formats", "conversion_modes", "visible_postconditions"]
  },
  "restrictions": [
    "No raw files, filesystem paths, blobs, base64, or artifact contents in WebMCP arguments or results.",
    "File picker interaction, clipboard contents, and downloaded artifacts remain Playwright responsibilities."
  ],
  "tool_name_prefix": "artifact"
}
</module_spec>

Bindings:
- Entity: task
- Entity operations: create; select; update; delete
- Entity fields: title; description; status
- Artifact operations: export; import; copy
- Export formats: session-json
- Import modes: session-json

Mechanics exclusions:
- Drag-and-drop gesture mechanics stay Playwright-observed.
- Raw file paths/blobs forbidden in WebMCP args.

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs.
- Tool handlers must call the same application logic as the visible UI.
</webmcp_action_contract>
