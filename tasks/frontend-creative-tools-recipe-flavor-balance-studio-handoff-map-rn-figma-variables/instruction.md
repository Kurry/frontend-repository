<summary>
Build a Recipe Flavor Balance Studio Handoff Map using React 19, Vite, Zustand, Tailwind CSS 4.3.2, Zod, and Framer Motion. The app produces the operator's session artifact: a downloadable and copyable Session JSON document (flavor-balance-v1-handoff-map.json) compiled live from the flavor components collection, the handoff map surface, linked decision summaries, and history. The artifact conforms to API-shaped field contracts and supports exact round-tripping via Import.
</summary>

<core_features>
Core features:
Feature: Flavor Components collection
- Seed a deterministic collection of flavor component records with empty, boundary, valid, and conflict states, avoiding pre-completed target outcomes.
- Display the records with explicit domain statuses: empty, draft, ready, changed, and archived.
- Create, edit, and delete one flavor component record.
- Filter or reorder flavor component records by domain state.
- Validate inputs using exact field boundaries while rejecting adjacent out-of-range values, providing field-level recovery explanations and preserving prior valid states for invalid required fields.
- Mutate the records array and status fields in the shared state and resulting artifact on every operation.

Feature: Handoff Map surface
- Present a visual handoff map interaction surface linked directly to the collection.
- Support selecting a record from the collection on the map (states: idle, selected).
- Connect a selected record to a handoff owner and update its readiness status (states: changed, conflict, resolved).
- Reject conflicting or incomplete mutations without partial updates.
- Undo the last mutation and inspect the linked representation, restoring ordering, selection, and derived values.
- Update handoff-map geometry/selection, derived summaries, and event history in the shared state on every mutation.

Feature: Portable work artifact
- Provide controls to Export the current artifact, resulting in a download of flavor-balance-v1-handoff-map.json containing schemaVersion, exportedAt, records, derived state, and history.
- Provide controls to Import an artifact, clearing the current state and loading the file with field-level validation.
- Reject malformed schema, duplicate IDs, unknown references, and invalid bounds during import, making no state change.
- Restore authored structure and regenerate exportedAt on a valid import.
- Show states: unsaved, exported, validated, replayed.
- Share one coherent state across the handoff map surface, derived summary, and artifact query.
</core_features>

<visual_design>
Visual design:
- Layout includes a desktop primary surface for the handoff map, plus a linked summary and an inspector detail panel.
- Establish a visual hierarchy that makes the current state and next action clear, with distinct domain-specific tokens and a calm focused canvas.
- Ensure the visual and interaction thesis is coherent and domain-specific without copying unrelated screens.
- Keep UI labels, statuses, errors, and empty-state text precise, naming the domain consequence and recovery action explicitly.
- Provide a responsive design where the desktop surface becomes a usable stack, drawer, or stepper at narrow viewports without horizontal overflow.
- Ensure adequate contrast and semantic controls.
- Maintain responsive edits on 100+ seeded records and avoid rebuilding unrelated surfaces during interaction.
</visual_design>

<motion>
Motion:
- Use framer-motion to animate transitions.
- The acted-on item must move or morph into its new state during the signature interaction connecting a selected record to a handoff owner.
- Implement reduced motion support that preserves feedback without transforms when preferred by the user.
</motion>

<requirements>
Requirements:
- Install Tailwind CSS 4.3.2 using npm-local/no-CDN; no external CDNs allowed.
- Use Vite and React 19 for the build setup.
- The application must be entirely client-side, running in-memory state only with no localStorage or backend dependencies.
- Implement a WebMCP contract exposing window.webmcp_session_info, webmcp_list_tools, and webmcp_invoke_tool to deterministic setup, query, and mutate state.
- Support complete keyboard parity and touch-equivalent controls for the signature mutation, producing identical state with visible focus and live feedback.
- Allow Ctrl/Cmd+Z to undo the signature mutation.
- Maintain shared state coherence across all linked views (handoff map, collection, summary) and the artifact export.
- The artifact flavor-balance-v1-handoff-map.json must contain schemaVersion set to a task-specific v1 enum, exportedAt as RFC3339, records array, derived object, and history array.
- Run locally on port 3000 via npm start.
</requirements>

<webmcp_action_contract>
Actions are synchronous tool invocations handled entirely by the browser-side oracle.
</webmcp_action_contract>
