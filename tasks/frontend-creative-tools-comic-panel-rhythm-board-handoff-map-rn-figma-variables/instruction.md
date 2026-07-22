# Comic Panel Rhythm Board — Handoff Map — Figma Variables

<summary>
Target users: People who manage comic panels in a bounded local workflow.
Objective: Manage comic panels through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: connect a selected record to a handoff owner and update readiness. Release-derived concept: a visual token/prototype editor where variable changes update modes, preview states, and export tokens.

This is a good-app genre task. All state must remain in-memory. Do not use localStorage, cookies, IndexedDB, or external network calls to persist state.

The UI should be built using Tailwind CSS 4.3.2. All assets must be loaded locally without CDNs.
</summary>

<core_features>
Comic Panels collection:
- Create, edit, archive, and filter comic panels with explicit domain statuses (e.g., draft, ready, changed, archived).
- Interact: Create/edit/delete one record. Filter or reorder records by domain state.
- Empty states are explicitly handled.

Handoff Map surface:
- Use the handoff map interaction to derive a decision about the collection.
- Interact: Connect a selected record to a handoff owner and update readiness.
- Undo the last mutation and inspect the linked representation.
- Visible states: idle, selected, changed, conflict, resolved.
- A conflicting or incomplete mutation is rejected without partial updates.
- Undo restores ordering, selection, and derived values.

Portable work artifact:
- Export and restore the actual session work in a fresh state.
- Export the current artifact, clear it, and import it with field-level validation.
- The artifact schema includes: schemaVersion (task-specific v1 enum), exportedAt (RFC3339 string), records (array of comic panel items), derived (object), and history (array).
</core_features>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- Desktop layout consists of a primary surface (handoff map/board) plus a summary and detail inspector.
- Visual hierarchy makes current state and next action clear.
- Domain-specific copy accurately names consequences and recovery actions.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state.
- Provide a reduced-motion equivalent that preserves feedback without transforms.
</motion>

<requirements>
- The application state must be strictly in-memory.
- You must support touch-equivalent controls and keyboard parity. Alternate input must produce the identical canonical mutation and update the UI accordingly.
- Narrow layouts (mobile) transform secondary surfaces into drawers or stacked steps, preserving interaction targets without horizontal clipping.
- The app must handle at least 100 records responsively, only rebuilding related surfaces.
- A valid import must restore authored structure and regenerate the exportedAt timestamp. Invalid imports must make no state changes.
- Provide standard WebMCP methods globally: window.webmcp_session_info, webmcp_list_tools, webmcp_invoke_tool.
- All assets must be loaded locally without CDNs.
- Tailwind CSS 4.3.2 is required.
</requirements>

<integrity>
- Work only from this instruction and /app; do not use /solution, /tests, or verifier artifacts.
</integrity>

<delivery>
The objective is to produce a working application in app that can be served using npm start on port 3000. It must fully implement the behaviors requested below, including WebMCP contract interoperability.
</delivery>

<webmcp_action_contract>
<module_spec>
</module_spec>
</webmcp_action_contract>
