<summary>
Manage books through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: scrub a selected record through its timeline and restore a prior checkpoint. Release-derived concept: a media board where selections, batch edits, histogram ranges, and sequence exports remain synchronized.

This task makes the connected user job observable in one frontend-only product. This concept adapts Adobe Lightroom's shipped pattern of interactive histogram, batch editing, photo-to-video, and assisted culling into a self-contained frontend job.

Key Concepts:
- Home Library Lending Ledger
- Replay Timeline
- Lightroom Editing Concept applied to Book Management
</summary>

<reference_screenshots>
*(No reference screenshots provided for this task)*
</reference_screenshots>

<core_features>
- Books Collection: Create, edit, archive, and filter books with explicit domain statuses.
- Replay Timeline: Scrub a selected record through its timeline and restore a prior checkpoint. Undo the last mutation and inspect the linked representation.
- Portable Work Artifact: Export and restore the actual session work in a fresh state. Clear and import it with field-level validation.
</core_features>

<user_flows>
- Create, edit, mutate, undo, and complete one record.
- Use the replay timeline interaction to derive a decision about the collection.
- Mutate a record and use the linked representation to make the next decision.
- Export, clear, import, and inspect the edited variant record and derived state.
</user_flows>

<edge_cases>
- Exact field boundaries are accepted while adjacent out-of-range values are rejected.
- Invalid required fields preserve the prior valid record and explain recovery.
- A conflicting or incomplete mutation is rejected without partial updates.
- Undo restores ordering, selection, and derived values.
- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
- A valid import restores authored structure and regenerates exportedAt.
</edge_cases>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- Desktop primary surface plus summary and inspector.
- The visual hierarchy makes current state and next action clear.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state; reduced motion preserves feedback without transforms.
</motion>

<responsiveness>
- Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
- The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow.
</responsiveness>

<accessibility>
- Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
- Alternate input produces identical state with visible focus and live feedback.
</accessibility>

<performance>
- Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
- The signature interaction remains responsive and unrelated rows stay stable.
</performance>

<writing>
- Copy names the domain consequence and recovery action precisely.
</writing>

<innovation>
Optional enhancements the builder may add, none required for a passing build.
</innovation>

<requirements>
- The whole job is incomplete unless the implementation proves every clause through the proposal's own named entities, canonical mutation, linked views, and portable artifact.
- Begin from a genuinely clean state: no authored work, completion, approval, export, or success evidence may be preseeded. Each milestone must become observable only after its real UI action, with exact before/after entity and event-count deltas.
- For every pointer or direct-manipulation path the proposal names, make the keyboard/exact-value path converge to one canonical event with identical stable IDs, derived values, linked-view selection, history, WebMCP-observable state, persistence, and export bytes after normalization.
- Treat every import mode as an atomic transaction over the same API-shaped schema used by create/edit/export.
- Make the useful end state an interoperable downloadable artifact of the session's actual work (library-lending-v1-replay-timeline-json).
- Verify genre-correct reload behavior and isolation: state that the PRD promises to persist must survive reload exactly; transient previews, dialogs, hover, drag, and invalid drafts must not leak into persistence. Separate sessions/import attempts must not silently share or overwrite state. (Good-app genre means in-memory state only, NO localStorage).
- Cover exact minimum, maximum, just-inside, and just-outside values for every bounded field, plus enum, format, uniqueness, and cross-field rules.
- Require real browser mechanics for graded interactions.
- At the proposal's maximum declared fixture (100+ records), direct manipulation must acknowledge within 100 ms.
- Record shape: HomeLibraryLendingLedgerSession with schemaVersion, exportedAt, records, derived, and history. schemaVersion is a task-specific v1 enum and exportedAt is RFC3339.
- The application must use Tailwind CSS 4.3.2.
- All libraries must be npm-local (no CDNs).
</requirements>

<integrity>
- Work only from this instruction and /app; do not use /solution, /tests, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in /app. /app/package.json MUST define npm scripts named exactly start (serves the app on port 3000) and verify:build (exits 0 when the app entry/build is present and succeeds); run via npm start on port 3000.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the <webmcp_action_contract> below.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- structured-editor-v1
- entity-collection-v1
- artifact-transfer-v1

Module specs:
<module_spec id="structured-editor-v1">
{
  "id": "structured-editor-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Structured editor",
  "purpose": "Document, diagram, canvas, configuration, and property editors.",
  "permitted_operations": ["select", "add", "delete", "update_property", "set_content", "switch_mode", "preview"],
  "binding_keys": {
    "required_any_of": [["editor_operations"], ["editor_object_types"]],
    "optional": ["editor_properties", "editor_modes", "value_bounds", "visible_postconditions"]
  },
  "restrictions": [
    "No arbitrary coordinate, DOM, or storage mutation via WebMCP.",
    "Drag, resize, drawing, snapping, and keyboard movement remain Playwright-driven when mechanism matters."
  ],
  "tool_name_prefix": "editor"
}
</module_spec>

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
- Editor object types: timeline-checkpoint
- Editor properties: status; timestamp
- Editor modes: replay; edit
- Editor operations: select; update_property; set_content; switch_mode; preview
- Entity: book
- Entity operations: create; select; update; delete; toggle
- Entity fields: title; author; status; rating; borrowedBy
- Artifact operations: export; import; copy
- Export formats: library-lending-v1-replay-timeline-json
- Import modes: library-lending-v1-replay-timeline-json

Mechanics exclusions:
- Drag/scrub on timeline stays Playwright (gesture mechanics)
- Raw file paths/blobs forbidden in WebMCP args

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
