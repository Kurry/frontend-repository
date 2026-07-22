<summary>
Build a Palette Harmony Matrix Batch Reconciler using React, Tailwind CSS 4.3.2, and Lucide React. The app manages a colors collection through a domain-native browser surface where grouping selected records into a batch reconciles aggregate totals. It produces an interoperable artifact (palette-harmony-v1.json) containing the session ledger and exposes save health, tool-output retention, safe resume, and recovery states. All state is entirely in-memory using a local store with no localStorage or network dependencies. All assets must be loaded locally without CDNs.
</summary>

<core_features>
- Signature interaction: Group selected records into a batch and reconcile aggregate totals. The batch reconciler mutation changes the primary record, linked view, and status together.
- Colors collection: Create, edit, archive, and filter colors with explicit domain statuses (empty, draft, ready, changed, archived).
- Validation: Exact field boundaries are accepted (hex codes, max lengths). Invalid required fields show inline validation and preserve the prior valid record without submitting.
- Shared-state effect: Mutations update the records list, their status fields, the derived summary, and the history log.
- Batch Reconciler surface: A linked decision surface that displays selection counts and detects conflicts (e.g., archived items cannot be reconciled). A conflicting mutation is rejected and marked as a conflict state.
- Undo mechanism: Undo the last mutation (Ctrl/Cmd+Z or UI button) to restore ordering, selection, and derived values.
- Portable work artifact: Export and restore the session. Export provides the exact session JSON structure. Import clears the state and restores it if valid, regenerating exportedAt.
- Artifact validation: Malformed schema, duplicate IDs, unknown references, and invalid bounds in an import result in no state change.
</core_features>

<user_flows>
- Complete user flow: Create a new color record, edit its name, toggle its selection for the batch reconciler, successfully reconcile it to a "ready" state, undo the reconciliation, and observe the end-to-end job recover without a page reload.
- Linked utility: Mutate a record and use the linked representation (Batch Reconciler surface and Derived Summary) to make the next decision based on immediate live aggregate totals.
- Artifact round trip: Export the state, clear/reload the app, import the edited record, and verify authored structure, derived state, and history match precisely.
</user_flows>

<edge_cases>
- Boundaries recovery: Submit a new color with an invalid hex code or empty name to trigger field-level recovery, preserving prior valid state.
- Invalid import: Attempt to import a JSON payload with an incorrect schemaVersion or missing required arrays; the import acts as a no-op, preserving current application state and showing an inline error.
- Conflict rejection: Attempt to reconcile a batch containing an 'archived' status item; the reconciler identifies the conflict and does not apply partial updates.
</edge_cases>

<visual_design>
- Visual hierarchy: The primary work surface, linked summary, and detail panel are distinct, making current state and next action clear.
- Layout: Desktop primary surface with summary and inspector panels on the side.
- Styling: High contrast, clean minimalist palette management layout using Tailwind CSS.
</visual_design>

<motion>
- Causal motion: The acted-on item transitions or highlights its new state. Reduced-motion equivalent exists.
- Smooth transitions for validation feedback and hover states.
</motion>

<responsiveness>
- Mobile mode: At narrow viewports, the desktop surface reflows into a usable stack or drawer layout without horizontal overflow.
- Interaction transformations: Touch targets are preserved and interaction models adapt to touch.
</responsiveness>

<accessibility>
- Alternate input: Repeat the signature interaction (batch selection and reconcile) with keyboard and touch-equivalent controls. Produces identical state with visible focus and live feedback.
- Semantic controls: Button, form, and interactive elements use native semantic tags.
</accessibility>

<performance>
- Large collection: The signature interaction remains responsive on a seeded collection of at least 100 records, and unrelated rows stay stable.
</performance>

<writing>
- Domain copy: Labels, statuses, errors, and empty-state text name the domain consequence and recovery action precisely (e.g., "Archived items cannot be reconciled").
</writing>

<requirements>
- Stack: React, Tailwind CSS 4.3.2 (pinned), Lucide React.
- State: Entirely in-memory custom store. No localStorage or external APIs.
- All assets must be loaded locally without CDNs.
- solution/app/package.json must include a start+verify:build script.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`. `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000.
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
  "permitted_operations": ["switch_mode"],
  "binding_keys": {
    "required_any_of": [["editor_operations"]],
    "optional": ["editor_modes"]
  },
  "restrictions": [
    "No arbitrary coordinate, DOM, or storage mutation via WebMCP."
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
  "permitted_operations": ["create", "update", "delete", "toggle"],
  "binding_keys": {
    "required_any_of": [["entity_operations"]],
    "optional": ["entity_fields"]
  },
  "restrictions": [
    "Closed entity and field enums only.",
    "Bounded string and numeric values."
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
  "permitted_operations": ["import", "export"],
  "binding_keys": {
    "required_any_of": [["artifact_operations"]],
    "optional": ["import_modes", "export_formats"]
  },
  "restrictions": [
    "No raw files, filesystem paths, blobs, base64, or artifact contents in WebMCP arguments or results."
  ],
  "tool_name_prefix": "artifact"
}
</module_spec>

Bindings:
- Editor modes: reconcile
- Editor operations: switch_mode
- Entity operations: create; update; delete; toggle; archive
- Entity fields: name; hex; status
- Artifact operations: export; import
- Export formats: session-json
- Import modes: session-json
</webmcp_action_contract>
