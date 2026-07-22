# Interactive Fiction Branch Board — Recovery Board — Canva Live Preview

<summary>
Manage story nodes through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: move a failed record into a recovery path and repair its downstream consequences. Release-derived concept: a design workspace where desktop edits update mobile preview, timing notes, and a portable share artifact.

Existing tools split story nodes editing, derived decisions, and portable evidence. This task makes the connected user job observable in one frontend-only product. This concept adapts Canva's shipped pattern of live mobile previews, speaker-time notes, whiteboard pan shortcuts, charts, and custom short links into a self-contained frontend job.
</summary>

<core_features>
- Story Nodes collection: Create, edit, archive, and filter story nodes with explicit domain statuses (empty, draft, ready, changed, archived). Invalid required fields preserve the prior valid record and explain recovery. Exact field boundaries are accepted. Mutates records and status fields.
- Recovery Board surface: Use the recovery board interaction to derive a decision about the collection. Signature interaction: move a failed record into a recovery path and repair its downstream consequences. Undo the last mutation and inspect the linked representation. Visible states: idle, selected, changed, conflict, resolved. A conflicting or incomplete mutation is rejected without partial updates. Undo restores ordering, selection, and derived values. Updates recovery-board geometry/selection, derived summaries, and event history.
- Portable work artifact: Export and restore the actual session work in a fresh state. Export the current artifact, clear and import it with field-level validation. Visible states: unsaved, exported, validated, replayed. Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change. A valid import restores authored structure and regenerates exportedAt. Produces fiction-branches-v1.json with schemaVersion, exportedAt, records, derived state, and history.
</core_features>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- Desktop primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps.
- Visual hierarchy makes current state and next action clear.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state; reduced motion preserves feedback without transforms.
- Motion connects the acted-on item to its new state and has a reduced-motion equivalent.
</motion>

<requirements>
Shared application state must use Solid stores, the state library named in summary (in-memory only). Do not use localStorage, sessionStorage, or other browser storage APIs; a page reload returns the app to its seeded state.
State contracts:
- Seed a deterministic collection with at least 100 records (empty, boundary, valid, and conflict states). No target outcome is pre-completed.
- Record shape: InteractiveFictionBranchBoardSession with schemaVersion, exportedAt, records[], derived{}, and history[]; each record is an API-shaped would-be request body.
- Validation rules: schemaVersion is a task-specific v1 enum ('v1') and exportedAt is RFC3339. Record IDs are unique and status values are explicit enums ('empty', 'draft', 'ready', 'changed', 'archived', 'conflict', 'resolved'). Required fields, numeric/date bounds, and cross-record references validate together.
- Interoperable format: exported as fiction-branches-v1-recovery-board.json.
- Import/export uses the recovery-board schema for export and import, rejects invalid records without mutation, and regenerates exportedAt.
- Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
- Linked views: The recovery board surface, derived summary, and artifact query share one state.
- Responsive behavior: Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping (desktop surface becomes a usable stack/drawer/stepper without horizontal overflow).
- Accessibility: Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support. Alternate input produces identical state with visible focus and live feedback.
- Performance: Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces. The signature interaction remains responsive and unrelated rows stay stable.
- All forms are driven by TanStack Form for Solid paired with a Zod schema.
Stack: Solid.js with Solid stores, Tailwind CSS 4.3.2 (pinned), and Kobalte as the single component library (Vite or equivalent); frontend-only.
- Motion (the vanilla motion.dev package) is the allowed animation library.
- Tabler icons via the @tabler/icons-solidjs package only; no raw copy-pasted SVGs, no icon fonts or CDNs.
- All assets must be loaded locally without CDNs.
- Product naming: Recovery Board Tool; serve over local HTTP for verification.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
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
- Entity: story-node
- Entity operations: create; select; update; delete
- Entity fields: id; title; status; content; links
- Artifact operations: export; import; copy
- Export formats: fiction-branches-v1-recovery-board.json
- Import modes: fiction-branches-v1-recovery-board.json

Mechanics exclusions:
- Drag-and-drop or physical motion stays Playwright (gesture mechanics)
- Raw file paths/blobs forbidden in WebMCP args
- File picker interaction stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
