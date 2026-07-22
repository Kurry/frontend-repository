<summary>
Build a Board Game Scenario Builder featuring a Forecast Ribbon and GitHub Issue Fields pattern, operating entirely in-memory as a good-app evaluation without a backend. Manage a collection of scenario cards where a selected record is modified on a forecast ribbon, projecting derived outcomes. Provide a linked summary, GitHub-style issue-fields sidebars, and an exact JSON artifact round-trip import/export that preserves authored state and generated history.
</summary>

<core_features>
Feature: Scenario Cards collection —
- Primary collection: a finite list of Scenario Cards showing titles and domain states (e.g. draft, ready, changed, conflict, archived).
- GitHub Issue Fields pattern: each card provides typed fields in a linked sidebar for detailed editing, including explicit statuses, bounds, required fields, and duplicate handling.
- Edit flow updates all linked views: renaming or changing a card immediately updates the main collection list, the active sidebar, and the Forecast Ribbon if it is the selected card.
- Filtering: the collection can be filtered by domain state without breaking active selections or requiring a reload.

Feature: Forecast Ribbon —
- The Forecast Ribbon surface allows adjusting the selected scenario card (e.g. modifying projected resource costs or likelihoods) along a visual track or ribbon.
- Changing a value on the Forecast Ribbon immediately triggers derived calculations (e.g. projected outcomes, total cost limits, or scenario viability metrics) visible on a linked summary surface.
- Changes to a record on the Forecast Ribbon sync instantly back to the card issue fields and list representation.
- A conflicting or out-of-bounds ribbon mutation prevents the update, showing field-level recovery and retaining the prior valid state.
- Undo: the application allows reverting the last forecast ribbon adjustment, restoring the prior numerical state, selection, and derived summary view perfectly.

Feature: Portable work artifact —
- Export: a user can export the entire session state as a downloadable JSON file.
- The exported JSON precisely captures the authored records (including all issue fields), the derived state (summary metrics), forecast-ribbon history, and a generated timestamp.
- Import: a user can load a valid JSON file to restore the entire collection, selected ribbon state, derived summary, and history.
- Invalid imports (wrong schema, missing fields, out-of-bounds data) are rejected with a visible validation error, making no change to the current application state.
</core_features>

<visual_design>
- Distinctive domain-specific workbench using GitHub-like density for the issue fields sidebar, paired with a visual Forecast Ribbon track.
- Clear visual hierarchy distinguishing the active scenario card from the rest of the collection list.
- Explicit visual states for scenarios: draft, ready, changed, conflict, and archived.
- Form controls present clear validation states when exact bounds are violated.
</visual_design>

<motion>
- Causal motion: when adjusting a record on the forecast ribbon, the visual track element moves or morphs into its new position, smoothly connecting the prior and next state.
- A reduced-motion equivalent ensures that the final state change is still clear without animation if reduced motion is preferred.
</motion>

<requirements>
- The JSON artifact must use the specific schema-version string declared in the data contract.
- Mobile transformation: On narrow viewports, the multi-column workbench (list, ribbon, sidebar) collapses into a usable stack or drawer model without horizontal overflow.
- Full keyboard and alternate touch parity for the primary forecast ribbon adjustment, achieving the identical state change as pointing devices.
- High performance: The system remains responsive when seeded with up to 100 scenario records; modifying one record avoids rebuilding unrelated DOM elements.
- Build the app with Tailwind CSS 4.3.2.
- No CDN dependencies; strictly use npm-local dependencies.
</requirements>

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
  "restrictions": []
}
</module_spec>
<module_spec id="entity-collection-v1">
{
  "id": "entity-collection-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Entity collection",
  "purpose": "List, table, gallery, and queryable data collections.",
  "permitted_operations": ["query", "create", "read", "update", "delete", "batch_update", "reorder"],
  "binding_keys": {
    "required_any_of": [["collection_entities"]],
    "optional": ["collection_fields", "collection_queries", "sort_fields", "pagination_type"]
  },
  "restrictions": []
}
</module_spec>
<module_spec id="artifact-transfer-v1">
{
  "id": "artifact-transfer-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Artifact transfer",
  "purpose": "Session state, structured exports, and media downloads.",
  "permitted_operations": ["export", "import", "copy", "clear_state"],
  "binding_keys": {
    "required_any_of": [["artifact_formats"]],
    "optional": ["artifact_schemas", "artifact_types", "import_validation", "state_reset_scope"]
  },
  "restrictions": []
}
</module_spec>

Bindings:
<binding module="structured-editor-v1">
{
  "editor_operations": ["update_property", "select", "switch_mode"],
  "editor_object_types": ["forecast-ribbon", "scenario-card"],
  "editor_properties": ["cost", "likelihood", "state"],
  "value_bounds": {"cost": "0-100", "likelihood": "0-100"},
  "visible_postconditions": ["summary-updates", "history-appends", "issue-fields-sync"]
}
</binding>
<binding module="entity-collection-v1">
{
  "collection_entities": ["scenario"],
  "collection_fields": ["id", "title", "state", "cost", "likelihood", "description"],
  "collection_queries": ["filter_by_state"],
  "sort_fields": ["title", "cost"]
}
</binding>
<binding module="artifact-transfer-v1">
{
  "artifact_formats": ["scenario-builder-v1-forecast-ribbon.json"],
  "artifact_schemas": ["scenario-builder-v1"],
  "artifact_types": ["session", "collection", "history"],
  "import_validation": "strict",
  "state_reset_scope": "full"
}
</binding>
</webmcp_action_contract>
