<summary>
Build a Board Game Scenario Builder with a Handoff Map using React, Vite, and Tailwind CSS 4.3.2. The app manages scenario cards in a domain-native browser surface where one meaningful mutation connecting a record to a handoff owner updates linked views and an interoperable artifact. It operates entirely with in-memory state NO localStorage and produces a downloadable scenario-builder-v1-handoff-map.json session artifact.
</summary>

<core_features>
Feature: Scenario Cards collection —
- Create, edit, archive, and filter scenario cards with explicit domain statuses (empty, draft, ready, changed, archived).
- Exact field boundaries are accepted while adjacent out-of-range values are rejected.
- Invalid required fields preserve the prior valid record and explain recovery.
- Seed the collection with at least 100 deterministic records in various states (empty, boundary, valid, conflict) without the target outcome pre-completed.
Feature: Handoff Map surface —
- Use the handoff map interaction to connect a selected record to a handoff owner and update readiness.
- Undo the last mutation Ctrl/Cmd+Z and inspect the linked representation. Undo restores ordering, selection, and derived values.
- A conflicting or incomplete mutation is rejected without partial updates.
Feature: Portable work artifact —
- Export the current artifact scenario-builder-v1-handoff-map.json, containing schemaVersion, exportedAt, records[], derived{}, and history[].
- Clear the current session.
- Import an artifact with field-level validation. Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
- A valid import restores authored structure and regenerates exportedAt.
</core_features>

<visual_design>
- The visual hierarchy makes current state and next action clear.
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
- Desktop layout has a primary surface plus summary and inspector.
- Copy names the domain consequence and recovery action precisely for labels, statuses, errors, and empty-state text.
</visual_design>

<motion>
- The acted-on item moves or morphs into its new state.
- Reduced motion preserves feedback without transforms.
</motion>

<requirements>
- NO localStorage; entirely in-memory.
- Complete alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation with visible focus and live feedback.
- Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping (desktop surface becomes a usable stack/drawer/stepper).
- The signature interaction remains responsive on 100+ records and unrelated rows stay stable.
- All dependencies must be npm-local. Do NOT use CDNs.
</requirements>

<webmcp_action_contract>
- webmcp_session_info
- webmcp_list_tools
- webmcp_invoke_tool
</webmcp_action_contract>
