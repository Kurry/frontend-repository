<summary>
Manage stations through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Adjust a selected record on a forecast ribbon and compare projected outcomes. A project evidence surface with typed fields, duplicate merges, saved queries, and release provenance.
</summary>

<reference_screenshots>
</reference_screenshots>

<core_features>
The user can create, edit, archive, and filter stations with explicit domain statuses.
The user can adjust a selected record on a forecast ribbon and compare projected outcomes.
The user can undo the last mutation and inspect the linked representation.
The user can export and restore the actual session work in a fresh state.
</core_features>

<user_flows>
Create, edit, mutate, undo, and complete one record. The end-to-end job is recoverable without reload.
</user_flows>

<edge_cases>
Try exact bounds, an invalid cross-field value, an empty state, and malformed import. Each invalid action gives field-level recovery and preserves prior valid state.
A conflicting or incomplete mutation is rejected without partial updates.
Undo restores ordering, selection, and derived values.
Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
A valid import restores authored structure and regenerates exportedAt.
</edge_cases>

<visual_design>
Inspect the primary work surface, linked summary, and detail panel. The visual hierarchy makes current state and next action clear.
A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
</visual_design>

<motion>
Adjust a selected record on a forecast ribbon and compare projected outcomes. Motion connects the acted-on item to its new state and has a reduced-motion equivalent.
The acted-on item moves or morphs into its new state; reduced motion preserves feedback without transforms.
</motion>

<responsiveness>
Use the signature interaction at a narrow viewport. The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow.
Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
</responsiveness>

<accessibility>
Repeat the signature interaction with keyboard and touch-equivalent controls. Alternate input produces identical state with visible focus and live feedback.
Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
</accessibility>

<performance>
Exercise a seeded collection with at least 100 records. The signature interaction remains responsive and unrelated rows stay stable.
Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
</performance>

<writing>
Inspect labels, statuses, errors, and empty-state text. Copy names the domain consequence and recovery action precisely.
</writing>

<innovation>
Mutate a record and use the linked representation to make the next decision. Linked views provide domain utility beyond CRUD.
</innovation>

<requirements>
The app must be implemented using entirely in-memory state. No localStorage or remote network calls are permitted.
The artifact export must produce classroom-rotations-v1-forecast-ribbon.json with schemaVersion, exportedAt as RFC3339, records, derived state, and history.
The import functionality must reject invalid records without mutation and regenerate the exportedAt timestamp.
The app must be built using local NPM dependencies including Tailwind CSS 4.3.2; no external CDNs are permitted.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
</delivery>

<!-- The previous command completed successfully but didn't modify this file because the task isn't in assignments. That is expected. Manually adding boilerplate. -->
<webmcp_action_contract>
The application must expose a `window.webmcp_session_info` function that returns a Promise resolving to an object with `contract_version: "zto-webmcp-v1"`, an array of `modules` and an array of `tools`.
It must expose a `window.webmcp_list_tools` function that returns a Promise resolving to an array of tools.
It must expose a `window.webmcp_invoke_tool` function that accepts a tool name and arguments, and returns a Promise resolving to the tool execution result.
</webmcp_action_contract>
