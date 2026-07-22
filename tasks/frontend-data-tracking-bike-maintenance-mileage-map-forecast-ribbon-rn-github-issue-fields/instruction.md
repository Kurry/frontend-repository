<summary>
Build a Bike Maintenance Mileage Map using React 19, Tailwind CSS 4.3.2, and Framer Motion. The application serves as a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. It must manage bike service records, providing a forecast ribbon to adjust selected records and compare projected outcomes, similar to GitHub Issue Fields. No localStorage should be used; rely on in-memory state and import/export of a JSON artifact. Ensure all local npm installs without CDNs.
</summary>

<core_features>
Bike Service Records collection: Users must be able to create, edit, archive, and filter bike service records with explicit domain statuses. Validation must preserve the prior valid state and reject adjacent out-of-range values. Invalid required fields explain recovery.
Forecast Ribbon surface: Users must be able to adjust a selected record on a forecast ribbon and compare projected outcomes. A conflicting or incomplete mutation is rejected without partial updates. The user can undo the last mutation and inspect the linked representation, restoring ordering, selection, and derived values.
Portable work artifact: Users must be able to export and restore the actual session work in a fresh state. Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change. A valid import restores authored structure and regenerates exportedAt.
</core_features>

<visual_design>
A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas. The layout includes a desktop primary surface plus summary and inspector. The visual hierarchy makes current state and next action clear.
</visual_design>

<motion>
The acted-on item moves or morphs into its new state. Reduced motion preserves feedback without transforms. Motion connects the acted-on item to its new state and has a reduced-motion equivalent.
</motion>

<requirements>
The app must be built with React 19, Vite, and Tailwind CSS 4.3.2 using local npm installs only with no CDNs.
The canonical mutation is to adjust a selected record on a forecast ribbon and compare projected outcomes.
The mutation changes the primary record, linked view, and status together.
The tool result and artifact contain the declared API-shaped fields.
The end-to-end job is recoverable without reload.
Each invalid action gives field-level recovery and preserves prior valid state.
The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow at narrow viewports.
Alternate input produces identical state with visible focus and live feedback.
The signature interaction remains responsive and unrelated rows stay stable when exercising a seeded collection with at least 100 records.
Copy names the domain consequence and recovery action precisely.
Linked views provide domain utility beyond CRUD.
The visual and interaction thesis is coherent without copying unrelated screens.
Authored order/selection/geometry and domain state survive export and import; invalid import is a no-op.
The exported artifact bike-maintenance-v1-forecast-ribbon.json must match the schema BikeMaintenanceMileageMapSession.
No backend or network dependencies; everything operates entirely in the browser.
Implement WebMCP bindings for window.webmcp_session_info, window.webmcp_list_tools, and window.webmcp_invoke_tool exposing create, update, delete, trace, quarantine, and undo capabilities.
</requirements>

<webmcp_action_contract>
The application exposes the WebMCP Action Contract on the global `window` object:
1. `window.webmcp_session_info()`: Returns `{ appName: "Bike Maintenance Mileage Map", version: "1.0.0", description: "Manage bike service records and forecast mileage.", schema: "bike-maintenance-v1" }`
2. `window.webmcp_list_tools()`: Exposes `query_state`, `create_record`, `update_record`, `delete_record`, `adjust_forecast`, `import_session`, and `undo`.
3. `window.webmcp_invoke_tool(toolName, args)`: Evaluates the requested tool and arguments, mutating internal application state equivalently to manual user interaction, returning a standard `{ result: { success: true } }` wrapper or state artifact where appropriate.
</webmcp_action_contract>
