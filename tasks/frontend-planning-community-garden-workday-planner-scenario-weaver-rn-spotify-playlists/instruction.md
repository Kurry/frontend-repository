<summary>
Build the Community Garden Workday Planner Scenario Weaver app, a frontend-only React application to manage work tasks in a bounded local workflow. The signature interaction allows the user to branch a selected record into a scenario and compare linked outcomes. This single meaningful mutation updates linked views (the Scenario Weaver surface, derived summary) and an interoperable artifact (garden-workday-v1-scenario-weaver.json). State is entirely in-memory (no localStorage). Build using Tailwind CSS 4.3.2.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
Feature: Work Tasks collection —
- Create, edit, delete, archive, and filter work tasks with explicit domain statuses (empty, draft, ready, changed, archived).
- Exact field boundaries (e.g. estimated hours must be > 0 and <= 24) are accepted while adjacent out-of-range values are rejected.
- Invalid required fields preserve the prior valid record and explain recovery.
- Filter or reorder records by domain state.
Feature: Scenario Weaver surface —
- Branch a selected record into a scenario and compare linked outcomes: The scenario weaver mutation changes the primary record, linked view, and status together.
- The user can select a task and branch it (creating a parallel variant). The UI immediately displays a side-by-side or stacked comparison of the base scenario and the branched scenario, along with derived summaries (e.g., total estimated hours change).
- Undo the last mutation (e.g. via Cmd/Ctrl+Z) restores ordering, selection, and derived values.
- A conflicting or incomplete mutation is rejected without partial updates.
- Seed a deterministic collection of at least 100 records with various valid states. The UI must remain responsive.
Feature: Portable work artifact —
- Export the current artifact to garden-workday-v1-scenario-weaver.json.
- Clear the session and import a file with field-level validation.
- Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change.
- A valid import restores authored structure and regenerates exportedAt.
</core_features>

<visual_design>
Visual design constraints:
- The visual hierarchy makes current state and next action clear, with a distinctive, domain-specific workbench with clear state tokens.
- Intentional density and a calm focused canvas.
- Desktop layout features a primary surface plus summary and inspector panels.
</visual_design>

<motion>
Motion constraints:
- The acted-on item moves or morphs into its new state.
- Motion connects the acted-on item to its new state and has a reduced-motion equivalent.
</motion>

<responsiveness>
Responsiveness constraints:
- Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping.
- The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow at a narrow viewport.
</responsiveness>

<accessibility>
Accessibility constraints:
- Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
- Alternate input parity: Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it with visible focus and live feedback.
</accessibility>

<performance>
Performance constraints:
- Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
- Exercise a seeded collection with at least 100 records; the signature interaction remains responsive and unrelated rows stay stable.
</performance>

<writing>
Writing constraints:
- Inspect labels, statuses, errors, and empty-state text. Copy names the domain consequence and recovery action precisely.
</writing>

<innovation>
Innovation constraints:
- Mutate a record and use the linked representation to make the next decision. Linked views provide domain utility beyond CRUD.
- [catch-all] Not covered by specific evidence but essential for the task's spirit.
</innovation>

<requirements>
Requirements:
- Build a standard React app (Vite) running on port 3000.
- schemaVersion is a task-specific v1 enum and exportedAt is RFC3339.
- Record IDs are unique and status values are explicit enums (empty, draft, ready, changed, archived).
- Data model matches CommunityGardenWorkdayPlannerSession with schemaVersion, exportedAt, records[], derived{}, and history[].
- All state must be in-memory; DO NOT use localStorage.
- No external network calls (e.g. no analytics, no remote APIs).
- Must use npm-installed local dependencies only (no CDN links).
- Tailwind CSS 4.3.2 must be used.
</requirements>

<integrity>
- Work only from this instruction and /app; do not use /solution, /tests, or verifier artifacts.
</integrity>

<delivery>
- Provide the oracle app in solution/app.
- Support npm start which will serve on port 3000.
</delivery>

<webmcp_action_contract>
    <module name="entity_create_record">
        <description>Creates a new task record in the collection.</description>
        <arguments>
            <arg name="record" type="object" required="true">
                <description>The record to create, omitting the ID (which will be generated).</description>
            </arg>
        </arguments>
    </module>
    <module name="entity_update_record">
        <description>Updates an existing task record in the collection.</description>
        <arguments>
            <arg name="id" type="string" required="true">
                <description>The ID of the record to update.</description>
            </arg>
            <arg name="record" type="object" required="true">
                <description>The fields to update.</description>
            </arg>
        </arguments>
    </module>
    <module name="artifact_export_session_json">
        <description>Exports the entire session artifact, including records, derived state, and history.</description>
        <arguments />
    </module>
    <module name="artifact_import_session_json">
        <description>Imports a full session artifact JSON to completely replace the current state.</description>
        <arguments>
            <arg name="artifact" type="object" required="true">
                <description>The valid artifact structure.</description>
            </arg>
        </arguments>
    </module>
</webmcp_action_contract>
