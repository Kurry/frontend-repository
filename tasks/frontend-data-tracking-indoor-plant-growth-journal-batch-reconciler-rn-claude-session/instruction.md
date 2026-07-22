<summary>
Build an "Indoor Plant Growth Journal — Batch Reconciler" using React and Tailwind CSS. The app features a domain-native UI for managing plant observations, derived batch reconciliation, and portable session artifacts (plant-growth-v1.json). The app strictly uses in-memory state, ensuring no localStorage or other persistence mechanisms are employed.
</summary>

<core_features>
- Direct workspace entry: first load shows an empty state or draft records; no backend connection or authentication is required.
- Plant Observations collection: User can create, edit, delete, and filter one plant observation record at a time by its domain status.
- Batch Reconciler surface: User groups selected records into a batch and reconciles aggregate totals. This mutation updates the primary record, linked views, and statuses together.
- Connected views: The batch reconciler surface, derived summary, and artifact query all share one canonical state.
- Undo: The last mutation (including the batch reconciliation) can be undone via UI or keyboard (Ctrl/Cmd+Z), restoring ordering, selection, and derived values.
- Artifact Export: The user can export the session work as an interoperable JSON artifact ("plant-growth-v1-batch-reconciler.json") compiled directly from the in-memory shared state.
- Artifact Import: The user can clear the current state and import an artifact with field-level validation, preserving authored state, regenerating the "exportedAt" timestamp, and ignoring corrupted/invalid values.
</core_features>

<user_flows>
- Complete User Flow: Create a record, edit its values, group it with others using the batch reconciler, undo the mutation, redo/mutate again, and finally export the completed artifact. The end-to-end job must be recoverable and functional without reloading the page.
</user_flows>

<edge_cases>
- Exact field boundaries: Adjacent out-of-range values are rejected with field-level error messages while exact minimum and maximum bounds are accepted.
- Invalid Required Fields: An attempt to save a missing required field preserves the prior valid state and explains the recovery action precisely.
- Malformed Import: Uploading a JSON with unknown references, duplicate IDs, or missing required fields makes zero state mutations and throws a targeted error.
</edge_cases>

<visual_design>
- Distinctive workbench: The design uses clear state tokens, intentional density, and a calm, focused canvas to differentiate the current state from the next logical action.
- Layout mapping: The UI features a desktop primary surface combined with a summary and detail panel.
</visual_design>

<motion>
- Causal parity: A record acted upon moves or morphs into its new state (e.g. into the batch reconciler).
- Reduced Motion: Implementing "prefers-reduced-motion" provides the same state feedback without transforms or disruptive animations.
</motion>

<responsiveness>
- Mobile viewport mapping: At a narrow viewport (e.g. mobile), the desktop surface naturally transforms into a usable stack, drawer, or stepper without horizontal overflow or clipped targets.
</responsiveness>

<accessibility>
- Alternate Input: Keyboard navigation and touch-equivalent controls produce identical state mutations with visible focus styles and live feedback.
</accessibility>

<performance>
- Large Collection: The signature interaction (batch reconciliation) remains responsive and acknowledges manipulation within 100ms when seeded with 100+ records, avoiding unrelated layout jumps.
</performance>

<writing>
- Domain copy: Field labels, states, empty states, and error messages use precise domain-native phrasing. Error messages explicitly identify the field, rejected rule, and recovery action required.
</writing>

<requirements>
- Shared application state must use React Context, Zustand, or a similar in-memory state manager.
- The state must reset on a page reload. Do NOT use localStorage or sessionStorage.
- Form validations must utilize a schema validator like Zod to ensure proper formatting, exact-boundary checks, and uniqueness.
- The useful end state is the portable session artifact "plant-growth-v1-batch-reconciler.json".
- The application must use Tailwind CSS 4.3.2.
- All libraries must be npm-local (no CDNs).
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed. `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000.
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
  "permitted_operations": ["create", "select", "update", "delete", "toggle", "quantity", "reorder", "mutate"],
  "binding_keys": {
    "required_any_of": [["entity"], ["entity_operations"]],
    "optional": ["entity_fields", "value_bounds", "visible_postconditions"]
  }
}
</module_spec>

<module_spec id="artifact-transfer-v1">
{
  "id": "artifact-transfer-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Artifact transfer",
  "purpose": "Import, export, copy, print, and conversion workflows.",
  "permitted_operations": ["import", "export", "copy"],
  "binding_keys": {
    "required_any_of": [["artifact_operations"]],
    "optional": ["import_modes", "export_formats", "conversion_modes", "visible_postconditions"]
  }
}
</module_spec>

Bindings:
- Entity: record
- Entity operations: create; select; update; delete; mutate
- Entity fields: id; name; status; quantity; type; notes
- Artifact operations: export; import
- Export formats: plant-growth-v1-batch-reconciler.json
- Import modes: plant-growth-v1-batch-reconciler.json

Mechanics exclusions:
- Raw file paths/blobs forbidden in WebMCP args
- Gestures, keyboard, focus, hover, motion, and responsive transformation remain browser-graded.
</webmcp_action_contract>
