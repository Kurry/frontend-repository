<summary>
Build a frontend-only browser application: Palette Harmony Matrix — Provenance Atlas. This is a local workflow tool to manage colors. It adapts a collaborative canvas concept into a finite local artifact with embedded state transitions, approval gates, and usage evidence. The primary interaction is to "trace a selected record to source evidence and quarantine a bad lineage" within a provenance atlas surface.

The job consists of managing a bounded collection of colors, examining their derived state in a linked provenance atlas view, and exporting/importing a portable work artifact, palette-harmony-v1.json.

The stack is React 19, Vite, Zustand for in-memory shared state, Tailwind CSS 4.3.2, and Framer Motion for animations. No external APIs, no backend sync, and no persistent storage like localStorage (in-memory only; reloading resets state to seed). All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
</summary>

<core_features>
Colors collection:
- Create, edit, archive, and filter colors with explicit domain statuses (empty, draft, ready, changed, archived).
- Exact field boundaries are accepted while adjacent out-of-range values are rejected.
- Invalid required fields preserve the prior valid record and explain recovery.
- Shared-state effect: Mutates records and status fields in the in-memory shared state.

Provenance Atlas surface:
- Trace a selected record to source evidence and quarantine a bad lineage. This is the signature mutation.
- A provenance atlas surface where the user selects a record, sees its connected source evidence, and applies a quarantine action to mark bad lineage.
- Undo the last mutation and inspect the linked representation.
- A conflicting or incomplete mutation is rejected without partial updates.
- Undo restores ordering, selection, and derived values.
- Shared-state effect: Updates provenance-atlas geometry/selection, derived summaries, and event history.

Portable work artifact:
- Export the current artifact, palette-harmony-v1.json.
- Clear the current collection and import it with field-level validation.
- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
- A valid import restores authored structure and regenerates exportedAt.
</core_features>

<visual_design>
- Distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- Desktop layout has a primary surface plus summary and inspector panels.
- Visual hierarchy makes current state and next action clear.
- The visual and interaction thesis is coherent without merely copying unrelated screens.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state.
- Motion connects the acted-on item to its new state and has a reduced-motion equivalent.
</motion>

<requirements>
- Use React 19, Vite, Zustand for shared in-memory state, Tailwind CSS 4.3.2, and Framer Motion.
- Do not use localStorage or sessionStorage. All state must be in-memory.
- Seed a deterministic collection with at least 100 records in various states (empty, boundary, valid, conflict) to ensure performance testing can be run.
- Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
- Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
- Responsive layout: The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow on narrow viewports.
- Accessibility: Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
- Writing: Domain copy must precisely name the domain consequence and recovery action.
- Ensure Vite is set up to run on port 3000 (npm start must run on port 3000).
- Produce a verify:build script that builds the application successfully.
- All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set.

Data Schema PaletteHarmonyMatrixSession:
- schemaVersion: strictly palette-harmony-v1
- exportedAt: RFC3339 timestamp
- records: Array of color records. Each record must have: id (unique), name, status (enum: empty, draft, ready, changed, archived), colorValue (string), evidence (string), lineage (string: good or bad).
- derived: Object containing summary data (e.g. counts).
- history: Array of past mutations for undo.
</requirements>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- structured-editor-v1
- entity-collection-v1
- artifact-transfer-v1

Bindings:
- Editor object types: provenance-node
- Editor properties: quarantine-state
- Editor modes: trace, inspect
- Editor operations: select, update_property
- Entity: color-record
- Entity operations: create, select, update, delete, filter
- Entity fields: name, status, colorValue, lineage
- Artifact operations: export, import, copy
- Export formats: palette-harmony-v1.json
- Import modes: palette-harmony-v1.json

Implementation:
- Implement window.webmcp_session_info, window.webmcp_list_tools, and window.webmcp_invoke_tool conforming to the contract logic and exposing tools for the defined operations.
- Tool handlers must call the identical Zustand state actions that the visible UI uses.
</webmcp_action_contract>
