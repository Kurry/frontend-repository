<summary>
Build a frontend-only Soundscape Scene Composer with a Replay Timeline adapted from Lightroom editing concepts. The app manages sound layers in a linked, local-first workflow where selections, timeline scrubbing, batch edits, and sequence exports stay synchronized. A canonical mutation—scrubbing a selected record through its timeline and restoring a prior checkpoint—drives updates across a linked summary, detail panel, and interoperable soundscape-scene-v1-replay-timeline.json artifact. The app runs completely in-memory, requiring no database or localStorage.
</summary>

<reference_screenshots>
</reference_screenshots>

<core_features>
Create, edit, archive, and filter sound layers with domain statuses (empty, draft, ready, changed, archived)
A replay timeline surface where the user can scrub a selected record through its timeline and restore a prior checkpoint
An undo stack allowing the reversal of the last timeline mutation
Export and import functionality for a portable work artifact (soundscape-scene-v1-replay-timeline.json) that preserves authored structure, derived state, and history
All linked views (primary surface, summary, inspector, tool outcomes) update synchronously from a shared canonical state
</core_features>

<user_flows>
Creating and editing a record correctly updates the shared state and summary
Selecting a record, scrubbing it on the replay timeline, and changing its timeline checkpoint reflects instantly in the linked summary and history
Hitting undo correctly restores the ordering, selection, and derived values of the prior state
Exporting the session yields a fully valid JSON matching the schema, and importing a valid JSON seamlessly replaces the session state
</user_flows>

<edge_cases>
Exact timeline boundaries are respected; inputs outside valid ranges are rejected
Invalid cross-field combinations preserve the last valid state and show field-level recovery instructions
An invalid or malformed artifact import results in a strict no-op with no partial state updates
Conflicting mutations are rejected cleanly
</edge_cases>

<visual_design>
A calm, focused canvas suitable for a media board
Clear state tokens (e.g., status badges for draft, changed, archived) and intentional data density
Visual hierarchy distinguishes the primary timeline workspace from the summary and detail panels
UI controls distinctly match the source interaction vocabulary (Lightroom-inspired media board)
</visual_design>

<motion>
Reduced-motion equivalents exist for all transforms
Replay timeline mutations and item state transitions (e.g., draft to changed) include coherent, causal motion feedback
</motion>

<responsiveness>
The primary desktop layout adapts into a stack, drawer, or stepper at narrow viewports without horizontal clipping
Interaction models change gracefully to preserve touch targets on mobile
</responsiveness>

<accessibility>
All interactive timeline scrubbing and restoring can be performed with keyboard and touch-equivalent controls
Focus is visibly managed, and live feedback is provided upon checkpoint changes
Semantic controls and ARIA attributes announce state transitions correctly
</accessibility>

<performance>
Updating a record smoothly updates linked views without rebuilding unrelated surfaces
The signature timeline scrubbing interaction remains responsive even with a seeded collection of at least 100 records
</performance>

<writing>
Domain copy precisely names consequences and recovery actions (e.g., timeline checkpoints, sound layer statuses)
No placeholder or lorem ipsum text is used
Export labels clearly reflect the domain interoperable artifact
</writing>

<innovation>
Linked views provide domain utility beyond a simple CRUD grid, directly deriving decisions from the selected record
</innovation>

<requirements>
Stack: React, Vite, Tailwind CSS 4.3.2, TypeScript
Pure frontend, in-memory state only. localStorage, sessionStorage, or backend calls are strictly prohibited.
State is managed via a shared context/store so all views read from the same source of truth.
Seed at least 4 sound layers and 100 total records in memory on load to demonstrate performance.
The artifact soundscape-scene-v1-replay-timeline.json uses the replay-timeline schema, containing schemaVersion (v1 enum), exportedAt (RFC3339), records, derived, and history.
All standard WebMCP tools map exactly to the same domain mutations used by the visible UI.
All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
</requirements>

<integrity>
Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
Produce an original self-contained app in `/app`. `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000.
WebMCP is a required delivery step; implement exactly the `<webmcp_action_contract>` below.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
structured-editor-v1
entity-collection-v1
artifact-transfer-v1

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
Editor object types: timeline-checkpoint
Editor properties: timestamp; status
Editor modes: replay; scrub
Editor operations: select; update_property; set_content
Entity: sound-layer
Entity operations: create; select; update; delete
Entity fields: name; status
Artifact operations: export; import; copy
Export formats: soundscape-scene-json
Import modes: soundscape-scene-json

Mechanics exclusions:
Drag scrubbing geometry and timeline interaction stays Playwright (gesture mechanics)

Implementation:
Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
Tool handlers must call the same application logic as the visible UI.
WebMCP tools must use exactly the format specified in standard modules.
</webmcp_action_contract>
