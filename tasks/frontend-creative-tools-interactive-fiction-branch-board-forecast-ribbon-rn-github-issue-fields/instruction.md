<summary>
Build a frontend-only Interactive Fiction Branch Board with a Forecast Ribbon to manage story nodes. The signature interaction is to adjust a selected record on a forecast ribbon and compare projected outcomes. It includes a project evidence surface with typed fields, duplicate merges, saved queries, and release provenance.
</summary>

<core_features>
- A Story Nodes collection that allows users to create, edit, archive, and filter story nodes with explicit domain statuses (empty, draft, ready, changed, archived).
- A Forecast Ribbon surface where users can adjust a selected record on a forecast ribbon and compare projected outcomes, with support for resolving conflicts and undoing the last mutation.
- A portable work artifact system that exports and imports the current session as a fiction-branches-v1.json file, with field-level validation and preservation of authored state, derived consequences, and history.
- Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
- Linked views: The forecast ribbon surface, derived summary, and artifact query share one state.
- Responsive design: Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
- Performance: Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
</core_features>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- Desktop layout features a primary surface plus summary and inspector.
- The visual hierarchy makes current state and next action clear.
- Labels, statuses, errors, and empty-state text name the domain consequence and recovery action precisely.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state.
- Reduced motion preserves feedback without transforms.
</motion>

<requirements>
- Shared application state must be entirely in-memory (good-app genre); NO localStorage, sessionStorage, or other browser storage APIs. A page reload returns the app to its seeded state.
- Tech stack: React (Vite), Tailwind CSS 4.3.2, frontend-only.
- All assets and libraries must be loaded locally without CDNs.
- Forms should validate constraints (e.g. required fields, date bounds, valid cross-references, closed status enums) before accepting mutations. Invalid actions must provide field-level recovery and preserve prior valid state.
- Seed the collection with at least 100 records in various valid and conflict states for performance testing.
- The export artifact must be named fiction-branches-v1-forecast-ribbon.json containing schemaVersion (task-specific v1 enum), exportedAt (RFC3339), records[], derived{}, and history[].
- Import must validate the shape; malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change. A valid import restores authored structure and regenerates exportedAt.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `solution/app` (or `/app` relative to submission).
- `package.json` MUST define a script named `start+verify:build` (e.g. `npm run build && npm start`) that serves the app on port 3000.
- Implement WebMCP contract via `window.webmcp_session_info`, `window.webmcp_list_tools`, `window.webmcp_invoke_tool`.
</delivery>


<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- structured-editor-v1
- entity-collection-v1
- artifact-transfer-v1

Bindings:
- Editor object types: node
- Editor properties: status; forecastValue
- Editor operations: select; update_property; preview
- Entity: node
- Entity operations: create; select; update; delete
- Entity fields: title; status; forecastValue; description
- Artifact operations: export; import
- Export formats: session-json
- Import modes: session-json
</webmcp_action_contract>
