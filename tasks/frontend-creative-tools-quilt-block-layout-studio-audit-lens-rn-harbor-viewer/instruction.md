# Quilt Block Layout Studio — Audit Lens

<summary>
Manage quilt blocks through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: attach evidence to a selected record and resolve an audit discrepancy. Release-derived concept: a browser workbench with keyboard job switching, a file/artifact inspector, and explicit failed-upload recovery. Tailwind CSS 4.3.2 is used for styling.
</summary>

<core_features>
- Quilt Blocks collection: Create, edit, archive, and filter quilt blocks with explicit domain statuses (empty, draft, ready, changed, archived). Validation preserves the prior valid record and explains recovery on invalid inputs. Shared-state/artifact effect: Mutates records array and status fields in the artifact.
- Audit Lens surface: Use the audit lens interaction to attach evidence to a selected record and resolve an audit discrepancy. A conflicting or incomplete mutation is rejected without partial updates. Undo restores ordering, selection, and derived values. Shared-state/artifact effect: Updates audit-lens geometry/selection, derived summaries, and event history.
- Portable work artifact: Export and restore the actual session work in a fresh state. Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change. A valid import restores authored structure and regenerates exportedAt. Shared-state/artifact effect: Produces quilt-layout-v1-audit-lens.json with schemaVersion, exportedAt, records, derived state, and history.
- WebMCP contract: Provide deterministic seed, query, and import capabilities alongside tools for the signature mutation and exporting the current artifact state.
</core_features>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- Visual hierarchy makes current state and next action clear.
- Explicit status tokens differentiate empty, draft, ready, changed, and archived items.
- Focus management shows live updates with strong contrast.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state.
- Motion connects the acted-on item to its new state and has a reduced-motion equivalent.
- Reduced motion preserves feedback without transforms or animation.
</motion>

<requirements>
- The user can attach evidence to a selected record and resolve an audit discrepancy, watches linked views react, then exports the completed artifact.
- Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
- The audit lens surface, derived summary, and artifact query share one state.
- Desktop primary surface plus summary and inspector; narrow layouts change interaction model (stack/drawer/stepper) and avoid horizontal clipping.
- Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
- Copy names the domain consequence and recovery action precisely.
- The UI relies strictly on in-memory state and the export/import JSON boundaries, with no localStorage or backend sync.
- The application exposes a standard WebMCP contract via window.webmcp_session_info, window.webmcp_list_tools, and window.webmcp_invoke_tool.
- Tailwind CSS 4.3.2 must be used.
- All dependencies must be installed locally via npm (no CDNs).
</requirements>

<webmcp_action_contract>
Window bindings for session information, tools list, and invocation. Expected tools include query, mutate, export, and import.
</webmcp_action_contract>
