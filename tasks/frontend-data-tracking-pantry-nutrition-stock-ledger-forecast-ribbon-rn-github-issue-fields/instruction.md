<summary>
Manage ingredients through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: adjust a selected record on a forecast ribbon and compare projected outcomes. Release-derived concept: a project evidence surface with typed fields, duplicate merges, saved queries, and release provenance.

The application must allow users to track pantry nutrition stock. It must include a forecast ribbon surface, a linked derived summary, and an artifact export/import flow.
</summary>

<core_features>
- Create, edit, archive, and filter ingredients with explicit domain statuses (empty, draft, ready, changed, archived).
- Adjust a selected record on a forecast ribbon and compare projected outcomes. The forecast ribbon mutation must change the primary record, linked view, and status together.
- Undo the last mutation and inspect the linked representation to see ordering, selection, and derived values restored.
- Export and restore the actual session work in a fresh state via nutrition-stock-v1.json.
</core_features>

<user_flows>
- The user can create, edit, mutate, undo, and complete one record.
- The user can adjust a selected record on a forecast ribbon and compare projected outcomes, watch linked views react, then export the completed artifact.
</user_flows>

<edge_cases>
- Exact field boundaries are accepted while adjacent out-of-range values are rejected.
- Invalid required fields preserve the prior valid record and explain recovery.
- A conflicting or incomplete mutation is rejected without partial updates.
- Malformed schema, duplicate IDs, unknown references, and invalid bounds on import make no state change.
</edge_cases>

<visual_design>
- The visual hierarchy makes the current state and next action clear.
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
</visual_design>

<motion>
- Motion connects the acted-on item to its new state and has a reduced-motion equivalent.
</motion>

<responsiveness>
- Narrow layouts change the interaction model, preserve touch targets, and avoid horizontal clipping.
- The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow at a narrow viewport.
</responsiveness>

<accessibility>
- Alternate input (keyboard and touch-equivalent controls) produces identical state with visible focus and live feedback.
</accessibility>

<performance>
- The signature interaction remains responsive on a seeded collection with at least 100 records, and unrelated rows stay stable.
</performance>

<writing>
- Copy names the domain consequence and recovery action precisely for labels, statuses, errors, and empty-state text.
</writing>

<innovation>
- Linked views provide domain utility beyond CRUD. Mutating a record allows the user to use the linked representation to make the next decision.
</innovation>

<requirements>
- The application must use strictly in-memory state; NO localStorage or other persistence mechanisms are allowed.
- All libraries must be npm-local (no CDNs).
- The application must use Tailwind CSS 4.3.2.
</requirements>

<integrity>
- A clean start must show no preseeded work completion.
- Equivalent ordering paths must converge, and cancelled actions must restore the complete prior snapshot.
</integrity>

<delivery>
- The tool result and artifact must contain the declared API-shaped fields.
- The useful end artifact must be an interoperable downloadable artifact of the session's actual work (nutrition-stock-v1-forecast-ribbon.json).
</delivery>

<webmcp_action_contract>
The application must expose a `window.webmcp_session_info` function and `window.webmcp_list_tools` / `window.webmcp_invoke_tool` methods for programmatic manipulation, complying with the standard WebMCP entity and artifact modules.
</webmcp_action_contract>
