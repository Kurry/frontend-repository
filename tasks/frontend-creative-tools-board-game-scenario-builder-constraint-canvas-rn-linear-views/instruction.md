# Board Game Scenario Builder — Constraint Canvas

<summary>
A single-page React application for managing scenario cards using a domain-native Constraint Canvas and Linear-inspired filtered views. Users can create scenario cards, organize them in constraint lanes (e.g., Draft, Ready, Changed, Conflict, Resolved), resolve conflicts, and export the entire session as a portable artifact. State is strictly in-memory.
</summary>

<core_features>
Scenario Cards Collection: Create, edit, delete, archive, and filter scenario cards. Cards have properties like id, title, description, requiredPlayers, duration, and status.
Constraint Canvas Surface: A Kanban-like view to drag a selected record across constraint lanes and resolve a conflict. Explicit lanes: Draft, Ready, Changed, Conflict, Resolved.
Linear Filtered Views: The UI provides a shareable filtered workflow view whose grouping, context, and generated update remain linked. Users can switch between Constraint Canvas and Filtered Views.
Conflict Resolution: Attempting to drag certain cards (e.g., invalid duration or player counts) into "Ready" or "Resolved" creates a "Conflict". Users must explicitly resolve the conflict via a UI dialog before it can be placed in "Resolved".
Portable Work Artifact: Export the session state as scenario-builder-v1-constraint-canvas.json. Clear and import the state with field-level validation.
Undo/Redo: Undo the last mutation to restore ordering, selection, and derived values.
</core_features>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- Linear-inspired shareable filtered views: clean lists, clear typography, explicit lane groupings, minimalist color palette.
- The visual hierarchy makes current state and next action clear. Detail panels slide in or appear alongside the canvas.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state (causal motion). Use framer-motion for layout transitions when moving cards between lanes.
- Reduced-motion equivalent preserves feedback without transforms (e.g., instant snap).
</motion>

<requirements>
- All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
- Shared application state using Zustand (in-memory only). No localStorage, sessionStorage, or other browser APIs.
- Creating/editing/deleting a card updates the main collection.
- Dragging a card across lanes updates its status and derived summaries.
- A conflicting or incomplete mutation is rejected without partial updates.
- Export Session JSON compiles live from the shared state. Import replaces shared state from a validated document.
- Stack: React 19, Vite, Tailwind CSS 4.3.2, Zustand, @dnd-kit/core, lucide-react. framer-motion is allowed. No other UI component libraries (build your own).
- Seed at least 100 scenario records initially to test performance on large collections.
The artifact scenario-builder-v1-constraint-canvas.json must include schemaVersion: v1, exportedAt (RFC3339), records[], derived{}, and history[]
- Form validation should be strictly checked (e.g., boundaries, cross-field validation, max duration).
- Alternate input parity: keyboard and touch-equivalent controls for dragging across lanes.
Serve via npm start on port 3000. verify:build script required in package.json
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`. `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds).
- WebMCP is a required delivery step. Implement the standard modules (structured-editor, entity-collection, artifact-transfer).
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
- Editor object types: scenario-card
- Editor properties: status; conflict-resolution
- Editor modes: constraint-canvas; filtered-view
- Editor operations: select; update_property; switch_mode; preview
- Entity: record
- Entity operations: create; select; update; delete; toggle
- Entity fields: title; description; status; archived
- Artifact operations: export; import; copy
- Export formats: scenario-builder-v1-constraint-canvas.json
- Import modes: scenario-builder-v1-constraint-canvas.json

Mechanics exclusions:
- Dragging a card across lanes stays Playwright (gesture mechanics)
- File picker interaction and downloaded artifacts stay Playwright-observed
</webmcp_action_contract>
