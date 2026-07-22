# Interactive Fiction Branch Board — Scenario Weaver

<summary>
You are building an Interactive Fiction Branch Board with a "Scenario Weaver" interaction, inspired by Spotify Playlists' release patterns. The goal is to manage story nodes through a domain-native browser surface where one meaningful mutation (branch a selected record into a scenario) updates linked views and an interoperable artifact. It must be a purely frontend application using in-memory state (NO localStorage) that serves on port 3000. All assets must be loaded locally without CDNs. You must use Tailwind CSS 4.3.2.
</summary>

<core_features>
The application must provide a Story Nodes Collection view displaying a list of story nodes with multi-select ordering, filtering, and explicit statuses like empty, draft, ready, changed, and archived.
It must implement a Scenario Weaver Mutation, a signature interaction to branch a selected record into a scenario and compare linked outcomes. This updates the primary record, linked views, and status simultaneously.
Linked Utility ensures the scenario weaver surface, derived summary, and artifact query all share one real-time state. Mutating a record immediately updates the linked representation for making the next decision.
Undo Capability allows users to undo the last mutation to restore ordering, selection, and derived values.
Portable Work Artifact functionality lets users export the current session to a file named fiction-branches-v1-scenario-weaver.json and restore it. Invalid imports must not mutate the state.
</core_features>

<visual_design>
The UI requires a distinctive, domain-specific workbench with clear state tokens and intentional density.
There must be a calm, focused canvas with clear visual hierarchy showing the current state and the next action.
It should use semantic controls, high contrast, and accessible focus management.
</visual_design>

<motion>
Causal Motion must be used so the acted-on item moves or morphs into its new state.
Reduced Motion provides a non-animated equivalent fallback.
</motion>

<requirements>
In-memory state only: The application must not use localStorage or external APIs.
Styling: Tailwind CSS 4.3.2 or equivalent, loaded locally. All assets must be loaded locally without CDNs.
Responsive Mode: On narrow viewports, the desktop surface becomes a usable stack/drawer/stepper without horizontal overflow.
Accessibility: Support keyboard-equivalent interactions and touch controls.
Performance: Capable of handling over 100 records without UI freezing.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- The solution must be in the `solution/app` directory.
- Start the app with `npm start` on port 3000.
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
- Entity: story-node
- Entity operations: create; select; update; delete; reorder
- Entity fields: status; scenario; outcomes
- Artifact operations: export; import
- Export formats: fiction-branches-v1
- Import modes: fiction-branches-v1

Mechanics exclusions:
- Raw file paths/blobs forbidden in WebMCP args

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
