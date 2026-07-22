<summary>
Manage layover activities through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: move a failed record into a recovery path and repair its downstream consequences. Release-derived concept: a design workspace where desktop edits update mobile preview, timing notes, and a portable share artifact.
</summary>

<reference_screenshots>
</reference_screenshots>

<core_features>
- Create, edit, archive, and filter layover activities with explicit domain statuses.
- Use the recovery board interaction to derive a decision about the collection.
- Move a failed record into a recovery path and repair its downstream consequences.
- Undo the last mutation and inspect the linked representation.
</core_features>

<user_flows>
- Create, edit, mutate, undo, and complete one record.
- Use the signature interaction at a narrow viewport.
- Repeat the signature interaction with keyboard and touch-equivalent controls.
</user_flows>

<edge_cases>
- Exact field boundaries are accepted while adjacent out-of-range values are rejected.
- Invalid required fields preserve the prior valid record and explain recovery.
- A conflicting or incomplete mutation is rejected without partial updates.
- Undo restores ordering, selection, and derived values.
- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
</edge_cases>

<visual_design>
- The visual hierarchy makes current state and next action clear.
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- Desktop primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state; reduced motion preserves feedback without transforms.
</motion>

<responsiveness>
- Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
- The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow on mobile viewports.
</responsiveness>

<accessibility>
- Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
- Alternate input produces identical state with visible focus and live feedback.
</accessibility>

<performance>
- Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
- At the maximum declared fixture (100+ records), direct manipulation must acknowledge within 100 ms, linked/derived views must settle within 500 ms, and export/import must complete within 2 s without dropped interactions, stale views, layout jumps, console errors, page errors, or non-local network dependence.
</performance>

<writing>
- Copy names the domain consequence and recovery action precisely.
- Error copy must identify the field, rejected value or rule, and recovery action; correcting the value must clear only the corresponding error.
</writing>

<innovation>
- Linked views provide domain utility beyond CRUD.
</innovation>

<requirements>
- The application must use Tailwind CSS 4.3.2.
- All libraries must be npm-local (no CDNs).
</requirements>

<integrity>
- Begin from a genuinely clean state: no authored work, completion, approval, export, or success evidence may be preseeded.
- Treat every import mode as an atomic transaction over the same API-shaped schema used by create/edit/export.
- Verify genre-correct reload behavior and isolation: state that the PRD promises to persist must survive reload exactly; transient previews, dialogs, hover, drag, and invalid drafts must not leak into persistence.
- Do not use localStorage or other persistence mechanisms; in-memory state only.
</integrity>

<delivery>
- The whole job is incomplete unless the implementation proves every clause through the proposal's own named entities, canonical mutation, linked views, and portable artifact.
- Artifact format must be layover-plan-v1-recovery-board.json.
- Include a useful downloadable end state and API-shaped data schemas.
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
  "purpose": "Lists, tables, boards, and galleries managing homogeneous items.",
  "permitted_operations": ["list", "get", "create", "update", "delete", "batch_update"],
  "binding_keys": {
    "required_any_of": [["entity_schema", "entity_type"]],
    "optional": ["allowed_filters", "allowed_sorts", "visible_postconditions"]
  },
  "restrictions": [
    "No operations on unrelated singletons"
  ]
}
</module_spec>

<module_spec id="artifact-transfer-v1">
{
  "id": "artifact-transfer-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Artifact transfer",
  "purpose": "Import and export of meaningful domain states (JSON, markdown, proprietary formats).",
  "permitted_operations": ["export", "import", "download", "clear", "undo"],
  "binding_keys": {
    "required_any_of": [["supported_formats", "schema_names"]],
    "optional": ["destructive_import", "preserves_history", "validation_strictness"]
  },
  "restrictions": [
    "No partial exports without an explicit query language",
    "No destructive import without warning or mode flag"
  ]
}
</module_spec>

Bindings:
- Layover Activities collection -> CRUD, status, validation, and query module (entity-collection-v1).
- Linked decision surface -> canonical mutation, derived state, undo, and query module (entity-collection-v1).
- Portable work artifact -> export/import and artifact query module (artifact-transfer-v1).
</webmcp_action_contract>
