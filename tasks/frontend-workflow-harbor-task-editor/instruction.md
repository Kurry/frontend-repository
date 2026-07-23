# Workflow Review Editor Console

<summary>
Build a dedicated, browser-native task editor for creating, editing, validating, and versioning workflow task packages from deterministic fixtures. Built with React 19, Vite, Tailwind CSS 4.3.2, Framer Motion, and Zod.
</summary>

<core_features>
- Author and validate workflow task files with one canonical reducer state.
- Edit all key task surfaces in-app (metadata, prompt, rubrics, solution artifacts descriptors).
- Run synchronous, schema-based validation before saving.
- Export and re-import complete package state as a stable JSON transfer model.
- Keep reviewer workflow and exports in scope as downstream consumers.
</core_features>

<user_flows>
- Authoring journey: Open task -> edit -> inline validation -> save/export.
- Dispatch journey: User clicks run mocked stream -> worker stream events into live timeline.
- Approval branch journey: Event sets state to awaiting approval -> block until explicit action.
- Retry/cancel journey: Retryable failure uses bounded backoff. Cancel sets terminal state.
- Resume journey: Resume command loads last checkpoint and cursor.
- Review journey: Reviewer reconstructed state from runs, checkpoints, tool events.
- Round-trip journey: Export canonical artifact, import validates full shape.
</user_flows>

<edge_cases>
- Duplicate action IDs handled gracefully.
- Out-of-order events deduplicated.
- Action replay after resume correctly skips completed work.
- Malformed import preserves prior state unchanged.
</edge_cases>

<visual_design>
- Data-dense, analytical layout designed for power users.
- Clean separation between editor fields and live previews.
</visual_design>

<motion>
- Reduced-motion path with preserved state.
</motion>

<responsiveness>
- Full workflow operates correctly at desktop and 375px widths without horizontal overflow.
</responsiveness>

<accessibility>
- Full keyboard operation with visible focus states.
</accessibility>

<performance>
- Zero console/runtime errors during all journeys.
- Handle memory pressure on 60 trials gracefully.
</performance>

<writing>
- Precise validation messages.
- Clear error provenance.
</writing>

<innovation>
- Offline mode not covered by typical designs ensures mock stream fallback runs identically.
</innovation>

<requirements>
- App uses React 19, Vite, Tailwind CSS 4.3.2, and Framer Motion.
- Uses npm to install dependencies locally without fetching from CDNs at runtime.
- Run mocked stream action works.
- Export produces a stable JSON payload containing schemaVersion, exportedAt, taskSlug, task object, editor object, runs.
- Imported artifact bundles overwrite active state atomically only if fully valid.
- Approval UX blocks downstream mutations.
- Resume skips already-completed tool events.
</requirements>

<integrity>
- Zero network calls to external APIs.
- No direct mutations to DOM or local storage for app state.
</integrity>

<delivery>
- Provide a full React 19 app in solution/app starting on port 3000 via Vite.
- Provide a valid evidence.webm recording a user walking through authoring, mocked stream dispatch, approval, error states, and export.
</delivery>

<webmcp_action_contract>
- Implement window.webmcp_session_info, window.webmcp_list_tools, and window.webmcp_invoke_tool to interact with editor state.
</webmcp_action_contract>
