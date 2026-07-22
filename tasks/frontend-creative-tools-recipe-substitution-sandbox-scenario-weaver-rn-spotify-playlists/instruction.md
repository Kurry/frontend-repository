<summary>
Build a Recipe Substitution Sandbox — Scenario Weaver using React 19, Zustand, Tailwind CSS 4.3.2, Zod, framer-motion, and lucide-react. The app manages recipe ingredients through a domain-native browser surface where one meaningful mutation (branch a selected record into a scenario and compare linked outcomes) updates linked views and an interoperable artifact. It produces an interoperable recipe-substitution-v1-scenario-weaver.json Session JSON document (conforming to API-shaped field contracts) that can be imported to perfectly round-trip the authored state and derived consequences. This represents a collection editor where multi-select ordering, folders, queue state, and progress artifacts agree, adapted into a finite local artifact.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
Feature: Recipe Ingredients collection —
- Direct studio entry: first load shows a clean workbench layout containing a recipe ingredients collection list, the Scenario Weaver surface, and an export/import panel.
- Recipe ingredients collection supports creating, editing, archiving, and filtering records.
- Records have explicit domain statuses: empty, draft, ready, changed, and archived.
- Fields validate immediately upon entry. Invalid required fields or out-of-bounds adjacent values are rejected, preserving the prior valid record and showing an inline recovery explanation.
- Filter or reorder records by domain state.
Feature: Scenario Weaver surface (Signature Interaction) —
- Branch a selected record into a scenario and compare linked outcomes. This signature mutation updates the primary record, linked view, and status together.
- The weaver surface displays idle, selected, changed, conflict, or resolved states.
- A conflicting or incomplete mutation is immediately rejected without partial updates.
- Undo (Ctrl/Cmd+Z or UI button) restores the previous state, including ordering, selection, and derived values.
- Mutating records in the collection or the scenario weaver updates the shared geometry/selection, derived summaries, and event history everywhere.
Feature: Portable work artifact (Export/Import) —
- Export button downloads the actual session work as a JSON file in a fresh state (recipe-substitution-v1-scenario-weaver.json).
- Import clears the current state and restores the work with field-level validation.
- Malformed schema, duplicate IDs, unknown references, or invalid bounds during import make no state change.
- A valid import restores the authored structure and regenerates the exportedAt timestamp.
</core_features>

<requirements>
- The app must produce the session artifact recipe-substitution-v1-scenario-weaver.json upon export.
- Record shape contract (RecipeSubstitutionSandboxSession):
  - schemaVersion: exactly "v1"
  - exportedAt: RFC3339 timestamp
  - records: Array of ingredient objects. Each record must have a unique ID, explicit enum status ("empty", "draft", "ready", "changed", "archived"), and scenario-weaverState.
  - derived: Object containing summary (e.g., total items, modified items).
  - history: Array of event history objects.
- The UI must adapt to narrow viewports: the desktop primary surface, summary, and inspector become a usable stack, drawer, or stepper on mobile without horizontal clipping.
- Alternate input parity: Keyboard and touch-equivalent controls must produce the identical canonical mutation as mouse interactions. Focus management and live updates must be present.
- Motion: framer-motion connects the acted-on item to its new state (causal motion) and has a reduced-motion equivalent (preserves feedback without transforms).
- Seed the app deterministically with a collection containing at least empty, boundary, valid, and conflict states (at least 4 records). No target outcome is pre-completed.
- Performance: The signature interaction remains responsive on 100+ seeded records; unrelated rows stay stable and avoid rebuilding.
- Copy must precisely name the domain consequence and recovery actions (e.g., in errors or empty states).
- Stack: React 19, Zustand (for all shared state), Tailwind CSS 4.3.2, Zod, framer-motion, lucide-react, react-hook-form. (Vite template).
- All libraries installed via npm and bundled locally (npm-local/no-CDN rule); no CDN imports of any library, font, or icon set.
</requirements>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- entity-collection-v1
- artifact-transfer-v1
- structured-editor-v1

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
- Entity: recipe-ingredient
- Entity operations: create, select, update, delete
- Entity fields: name, status, substitute, substituteRatio
- Editor object types: scenario-weaver
- Editor operations: set_content, switch_mode, update_property
- Editor properties: activeScenario, traceId
- Artifact operations: export, import
- Export formats: session-json
- Import modes: session-json

Implementation:
- Provide window.webmcp_session_info, window.webmcp_list_tools, window.webmcp_invoke_tool binding to Zustand store actions.
- Expose all specific state manipulation tools (create, update, delete, trace, quarantine, undo) with proper inputSchema formats, not just basic query handlers.
</webmcp_action_contract>
