<summary>
Build a Coffee Brew Experiment Log using React, Zustand, and Tailwind CSS 4.3.2. The app uses npm-local/no-CDN installation and manages brew experiments through a domain-native browser surface where one meaningful mutation (adjusting a selected record on a forecast ribbon and comparing projected outcomes) updates linked views and an interoperable artifact. The app produces the operator's session artifact: a downloadable JSON document compiled live from the experiments, conforming to API-shaped field contracts, with an Import that round-trips that JSON.
</summary>

<core_features>
- Brew Experiments collection: Create, edit, archive, and filter brew experiments with explicit domain statuses (empty, draft, ready, changed, archived). Exact field boundaries are accepted while adjacent out-of-range values are rejected. Invalid required fields preserve the prior valid record and explain recovery.
- Forecast Ribbon surface: A forecast ribbon interaction to derive a decision about the collection. Adjust a selected record on the forecast ribbon and compare projected outcomes. Undo the last mutation and inspect the linked representation. States include idle, selected, changed, conflict, resolved. A conflicting or incomplete mutation is rejected without partial updates. Undo restores ordering, selection, and derived values.
- Portable work artifact: Export and restore the actual session work in a fresh state. Export the current artifact; clear and import it with field-level validation. Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change. A valid import restores authored structure and regenerates exportedAt.
</core_features>

<visual_design>
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- The visual hierarchy makes current state and next action clear.
- Desktop primary surface plus summary and inspector.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state.
- Motion connects the acted-on item to its new state and has a reduced-motion equivalent.
</motion>

<requirements>
- Must use npm-local/no-CDN installation.
- Responsive behavior: Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping. The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow at a narrow viewport.
- Accessibility: Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support. Alternate input (keyboard and touch-equivalent controls) produces identical state with visible focus and live feedback.
- Performance: Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces. The signature interaction remains responsive and unrelated rows stay stable when exercising a seeded collection with at least 100 records.
- Persistence is in-memory only; export/import is the persistence boundary. No local storage.
- Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
- Linked views: The forecast ribbon surface, derived summary, and artifact query share one state.
- Record shape: CoffeeBrewExperimentLogSession with schemaVersion, exportedAt, records[], derived{}, and history[]; each record is an API-shaped would-be request body. schemaVersion is a task-specific v1 enum and exportedAt is RFC3339.
- Import/export format: brew-experiment-v1-forecast-ribbon.json.
</requirements>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1
--
Module: Data Operations
<module_spec>
{
  "name": "data_operations",
  "description": "Standardize entity data fetching, creation, updating, deletion, and query operations in WebMCP.",
  "binding_keys": {
    "required_any_of": [["entity_operations"], ["entity_types"]],
    "optional": ["query_parameters", "entity_properties", "visible_postconditions"]
  },
  "restrictions": [
    "No DOM querying, coordinate targeting, or UI inspection via WebMCP.",
    "Form filling, focus management, drag-and-drop, and scrolling remain Playwright responsibilities."
  ],
  "tool_name_prefix": "data"
}
</module_spec>
--
Module: Editor
<module_spec>
{
  "name": "editor",
  "description": "Standardize structured authoring, timeline management, and configuration panel operations in WebMCP.",
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
--
Module: Artifact
<module_spec>
{
  "name": "artifact",
  "description": "Standardize export, import, conversion, format detection, and round-trip operations in WebMCP.",
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
- Entity types: brew-experiment
- Entity operations: query, create, update, delete
- Editor object types: forecast-ribbon-record
- Editor operations: select, adjust, undo
- Artifact operations: export, import, query, clear
- Export formats: brew-experiment-v1-forecast-ribbon.json
- Import modes: json

Mechanics exclusions:
- Drag/touch manipulation of the forecast ribbon stays Playwright
- File picker interaction stays Playwright

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
