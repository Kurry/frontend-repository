# Ceramic Glaze Test Atlas — Spatial Composer — Artifact Provenance

<summary>
Build a Ceramic Glaze Test Atlas application focused on spatial composition of glaze tests, preserving authored state and derived consequences for a clean round trip. The app lets users create, edit, archive, and filter glaze tests with explicit domain statuses, and use a spatial composer interaction to rebalance capacity. Built with React, Vite, and Tailwind CSS 4.3.2.
</summary>

<core_features>
- Create, edit, archive, and filter glaze tests with explicit domain statuses (empty, draft, ready, changed, archived).
- Exact field boundaries are accepted while adjacent out-of-range values are rejected. Invalid required fields preserve the prior valid record and explain recovery.
- Place a selected record in a spatial composer and rebalance capacity. This is the canonical mutation.
- A conflicting or incomplete mutation in the spatial composer is rejected without partial updates.
- Undo the last mutation and inspect the linked representation. Undo restores ordering, selection, and derived values.
- Export the current artifact (glaze-atlas-v1.json). It produces a JSON file with schemaVersion, exportedAt, records, derived state, and history.
- Clear the current session and import a saved artifact with field-level validation. Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change. A valid import restores authored structure and regenerates exportedAt.
</core_features>

<visual_design>
- Distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- The visual hierarchy makes current state and next action clear.
- Layout: Desktop primary surface plus summary and inspector.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state.
- Reduced motion preserves feedback without transforms.
</motion>

<requirements>
- The tool result and artifact contain the declared API-shaped fields (CeramicGlazeTestAtlasSession with schemaVersion, exportedAt, records, derived, and history).
- Export, clear, import, and re-open the edited record; authored structure, derived state, and history must match exactly.
- Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
- Narrow layouts change interaction model (stack/drawer/stepper), preserve touch targets, and avoid horizontal clipping.
- Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it. Semantic controls, keyboard parity, focus management, live updates, and contrast are required.
- The spatial composer surface, derived summary, and artifact query share one state.
- Seed a deterministic collection with empty, boundary, valid, and conflict states; no target outcome is pre-completed.
- No localStorage or external persistence; export/import is the persistence boundary.
- Do not use CDNs or remote dependencies; all packages must be locally installed via npm.
- Built with Tailwind CSS 4.3.2.
- WebMCP contract: window.webmcp_session_info / webmcp_list_tools / webmcp_invoke_tool implementing the standard modules.
</requirements>

<webmcp_action_contract>
Action 1: seed_collection
Action 2: query_state
Action 3: import_artifact
</webmcp_action_contract>
