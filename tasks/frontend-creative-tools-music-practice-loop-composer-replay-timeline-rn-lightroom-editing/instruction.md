# Music Practice Loop Composer — Replay Timeline

<summary>
A domain-native browser surface for managing practice segments where one meaningful mutation updates linked views and an interoperable artifact. The core workflow centers on a canonical variant mutation: scrub a selected record through its timeline and restore a prior checkpoint. Features a media board where selections, batch edits, histogram ranges, and sequence exports remain synchronized. The application state is fully in-memory, bounded to a local workflow, using React. Stack: React, Vite, Tailwind CSS 4.3.2.
</summary>

<core_features>
- Practice Segments collection: Create, edit, archive, and filter practice segments with explicit domain statuses (empty, draft, ready, changed, archived).
- Canonical Mutation (Replay Timeline): scrub a selected record through its timeline and restore a prior checkpoint. Includes states: idle, selected, changed, conflict, resolved. Undo the last mutation and inspect the linked representation.
- Linked Decision Surface: The replay timeline surface, derived summary, and artifact query share one coherent state.
- Portable Work Artifact: Export the actual session work in a fresh state and clear/import it with field-level validation. Produces interoperable `practice-loop-v1-replay-timeline.json`.
</core_features>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- The visual hierarchy makes current state and next action clear, with desktop primary surface plus summary and inspector.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state; reduced motion preserves feedback without transforms.
</motion>

<requirements>
- Shared application state must use React state or standard state management (in-memory only). Do not use localStorage, sessionStorage, or other browser storage APIs; a page reload returns the app to its seeded state.
- Stack: React, Tailwind CSS 4.3.2 (pinned), and standard UI components (Vite or equivalent); frontend-only.
- All forms are driven by structured state and show inline per-field errors. Required fields, numeric/date bounds, and cross-record references validate together.
- Seed a deterministic collection with at least empty, boundary, valid, and conflict states; no target outcome is pre-completed.
- All assets must be loaded locally without CDNs.
- Record shape: `MusicPracticeLoopComposerSession` with `schemaVersion` (task-specific v1 enum), `exportedAt` (RFC3339), `records[]`, `derived{}`, and `history[]`; each record is an API-shaped would-be request body. Record IDs are unique and status values are explicit enums.
- Import uses the replay-timeline schema, rejects invalid records without mutation, and regenerates `exportedAt`.
- Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
- Responsive behavior: Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping. The desktop surface becomes a usable stack/drawer/stepper on mobile.
- Accessibility: Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `start+verify:build` (builds the app and exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run start+verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000.
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
- Entity fields: status; checkpoint; duration
- Artifact operations: export; import; copy
- Export formats: session-json
- Import modes: session-json

Mechanics exclusions:
- Drag/scrub gestures remain Playwright-observed.

Implementation:
- Register browser WebMCP tools for every permitted operation.
</webmcp_action_contract>
