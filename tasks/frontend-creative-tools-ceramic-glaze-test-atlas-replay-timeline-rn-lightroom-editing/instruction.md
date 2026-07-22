# Ceramic Glaze Test Atlas — Replay Timeline — Lightroom Editing

<summary>
Build a Ceramic Glaze Test Atlas using React 18/19, Vite, Tailwind CSS 4.3.2, Framer Motion, and Zod. The app manages ceramic glaze tests and adapts a replay timeline concept into a self-contained local workspace. A user scrubs a selected record through its timeline, restores prior checkpoints, and watches the linked summary and JSON export update in real time. The app runs completely in-memory using React state and enforces API-shaped schema validation for exports/imports.
</summary>

<core_features>
Feature: Glaze Tests Collection —
- Create, edit, archive, and filter glaze tests. Each test requires a unique ID, a name, a status (draft, ready, changed, archived), and a history array.
Feature: Replay Timeline Surface (Signature Interaction) —
- Scrub a selected record's timeline and restore a prior checkpoint. If a checkpoint is restored, the record's state reverts to that point, and the derived summary updates. Invalid out-of-bounds inputs or conflicting states are rejected cleanly.
Feature: Linked Derived Views —
- Changes made via the Replay Timeline or standard editing update the collection, summary metrics, and the portable JSON artifact simultaneously.
Feature: Portable Work Artifact —
- Export the current session into a validated JSON structure, clear the session, and import it back. Import performs field-level validation and restores authored structures exactly.
Feature: Undo Capability —
- A dedicated "Undo" action reverts the very last mutation made to the collection, restoring selection, ordering, and derived values.
</core_features>

<visual_design>
- Layout: A cohesive, focused desktop surface containing a primary Replay Timeline canvas, a linked derived summary panel, and a detail/inspector view. Clear visual distinction between states.
- Domain Thesis: Uses a workbench aesthetic tailored for ceramic/glaze testing, conveying precise measurement and chronological steps.
- Responsive Behavior: Under narrow viewports, the secondary panels transform into drawers or stacked steps without horizontal clipping.
</visual_design>

<motion>
- Causal Motion: The acted-on item animates into its new state during a timeline scrub or status change.
- Reduced Motion Parity: Respects prefers-reduced-motion. If enabled, elements snap to their new states without transforms while preserving clarity and logical feedback.
</motion>

<requirements>
State contracts (behavioral, not storage keys):
- Use React state for central in-memory state. No localStorage or external persistence. A page reload wipes the session back to the seeded state.
- The imported/exported JSON must match the CeramicGlazeTestAtlasSession shape: schemaVersion (enum v1), exportedAt (RFC3339 timestamp), records array, derived object, and history array.
- Form inputs and imported JSON must be rigorously validated with Zod. A malformed import or duplicate ID results in a no-op (the prior valid state is preserved). Required fields and strict enums must be enforced.
- Seed the initial application state with at least 5 meaningful glaze test records in varied states to allow immediate interaction.
- Keyboard navigation and touch-equivalent controls must produce the identical canonical mutation as mouse gestures. Ctrl/Cmd+Z triggers the undo stack.
- Semantic HTML, proper focus management, contrast compliance, and polite announcements for status updates/validation messages.
- Operations (especially scrubbing) must remain responsive even if 100+ records exist; unrelated rows should not unnecessarily re-render.
Stack: React 18/19, Vite, Tailwind CSS 4.3.2 (pinned), Framer Motion, and Zod. Lucide React for icons.
- All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
Product Naming:
- Application title: Ceramic Glaze Test Atlas
- Export file name: glaze-atlas-v1-replay-timeline.json
</requirements>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
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
- Entity: glaze-test
- Entity operations: create; select; update; delete
- Entity fields: id; name; status
- Artifact operations: export; import; copy
- Export formats: glaze-atlas-v1.json
- Import modes: glaze-atlas-v1.json

Mechanics exclusions:
- Drag/scrub gestures on the timeline remain Playwright-driven.
- Raw file paths/blobs forbidden in WebMCP args.
- Clipboard copy and local file downloads remain Playwright-observed.

Implementation:
- Register browser WebMCP tools for permitted operations bound to the product values.
- Handlers must invoke the identical application logic as the UI.
</webmcp_action_contract>
