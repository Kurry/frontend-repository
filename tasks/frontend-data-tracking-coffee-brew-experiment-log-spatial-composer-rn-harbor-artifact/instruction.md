<summary>
Build a Coffee Brew Experiment Log using React 18, Vite, Zustand, Tailwind CSS 4.3.2 npm-local/no-CDN, and Framer Motion. The app provides a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: place a selected record in a spatial composer and rebalance capacity. The app must implement an evidence artifact inspector with redaction, source lineage, downloadable files, and no silent failure.
</summary>

<core_features>
Bounded local collection: Create, edit, archive, and filter brew experiments with explicit domain statuses (empty, draft, ready, changed, archived). Exact field boundaries are accepted while adjacent out-of-range values are rejected. Invalid required fields preserve the prior valid record and explain recovery.
Spatial Composer surface: Use the spatial composer interaction to derive a decision about the collection. Place a selected record in a spatial composer and rebalance capacity. Undo the last mutation and inspect the linked representation. A conflicting or incomplete mutation is rejected without partial updates. Undo restores ordering, selection, and derived values.
Portable work artifact: Export and restore the actual session work in a fresh state. Export the current artifact, clear, and import it with field-level validation. Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change. A valid import restores authored structure and regenerates exportedAt.
</core_features>

<visual_design>
A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
The visual hierarchy makes current state and next action clear.
Layout: Desktop primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps.
</visual_design>

<motion>
The acted-on item moves or morphs into its new state; reduced motion preserves feedback without transforms.
</motion>

<requirements>
Tailwind CSS 4.3.2 must be installed via npm-local/no-CDN.
The application state must be stored in-memory only (no localStorage).
The export must be a JSON artifact (brew-experiment-v1-spatial-composer.json) containing schemaVersion, exportedAt, records, derived, and history.
A CRUD table cannot satisfy the domain-native signature; the interaction must support alternate input parity (Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it).
The application must support a seeded collection of at least 100 records and remain responsive without rebuilding unrelated surfaces.
All WebMCP interactions must expose the tools under the window.webmcp_session_info, window.webmcp_list_tools, and window.webmcp_invoke_tool contract bindings.
</requirements>

<webmcp_action_contract>
The application must expose the following action contract bound to the global `window` object:
1. `window.webmcp_session_info()`: Returns an object `{ contract_version: "zto-webmcp-v1" }`.
2. `window.webmcp_list_tools()`: Returns a list of tools including `query_state`, `export_artifact`, `import_artifact`, and `place_in_spatial_composer`.
3. `window.webmcp_invoke_tool(request)`: Handles tool invocations and returns the corresponding data or executes the corresponding action.
</webmcp_action_contract>
