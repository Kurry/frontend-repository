# Board Game Scenario Builder — Recovery Board — Canva Live Preview

<summary>
Manage scenario cards through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: move a failed record into a recovery path and repair its downstream consequences. Release-derived concept: a design workspace where desktop edits update mobile preview, timing notes, and a portable share artifact.

Existing tools split scenario cards editing, derived decisions, and portable evidence. This task makes the connected user job observable in one frontend-only product. This concept adapts Canva's shipped pattern of live mobile previews, speaker-time notes, whiteboard pan shortcuts, charts, and custom short links into a self-contained frontend job. Stack: React with Zustand, Tailwind CSS 4.3.2 (pinned), and Framer Motion.
</summary>

<core_features>
Scenario Cards collection: Create, edit, archive, and filter scenario cards with explicit domain statuses (e.g. draft, ready, failed, recovered, archived).
Recovery Board surface: Move a failed record into a recovery path and repair its downstream consequences. Undo the last mutation and inspect the linked representation. A conflicting or incomplete mutation is rejected without partial updates. Undo restores ordering, selection, and derived values.
Portable work artifact: Export and restore the actual session work in a fresh state. Export the current artifact; clear and import it with field-level validation. Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change. A valid import restores authored structure and regenerates exportedAt.
</core_features>

<visual_design>
Visual Thesis: A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
Layout: Desktop primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps. Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
Visual Hierarchy: The visual hierarchy makes current state and next action clear.
</visual_design>

<motion>
Causal Motion: The acted-on item moves or morphs into its new state; reduced motion preserves feedback without transforms.
</motion>

<writing>
Domain Copy: Copy names the domain consequence and recovery action precisely (e.g. labels, statuses, errors, and empty-state text).
Action labels use specific verbs.
Validation messages name the offending field-contract key.
No placeholder or lorem-ipsum text.
</writing>

<innovation>
Optional enhancements the builder may add.
</innovation>

<requirements>
Persistence: In-memory state only. No localStorage, sessionStorage, or external databases. Export/import is the persistence boundary.
Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it. Visible focus and live feedback.
Linked Views: The recovery board surface, derived summary, and artifact query share one state. Mutating a record automatically updates the derived view.
Boundaries and Recovery: Exact field boundaries are accepted while adjacent out-of-range values are rejected. Invalid required fields preserve the prior valid record and explain recovery.
Performance: Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set (npm-local/no-CDN rule).
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright.
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
- Entity: record
- Entity operations: create; select; update; delete
- Entity fields: id; title; description; status; recoveryBoardState; difficulty; linkedScenarioId
- Artifact operations: export; import; copy
- Export formats: scenario-builder-v1-recovery-board.json
- Import modes: scenario-builder-v1-recovery-board.json
</webmcp_action_contract>
