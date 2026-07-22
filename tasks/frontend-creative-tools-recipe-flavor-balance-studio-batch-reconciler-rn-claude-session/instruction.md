<summary>
Build a Recipe Flavor Balance Studio (Batch Reconciler variant) using React, Zustand, and Tailwind CSS 4.3.2 (npm-local/no-CDN). The app manages flavor components and allows users to group selected records into a batch and reconcile aggregate totals. It maintains an in-memory session ledger that exposes save health, tool-output retention, safe resume, and recovery states, exporting to a portable flavor-balance-v1-batch-reconciler.json artifact.
</summary>

<core_features>Flavor Components collection: Create, edit, archive, and filter flavor components with explicit domain statuses (empty, draft, ready, changed, archived). Invalid required fields preserve the prior valid record and explain recovery.
Batch Reconciler surface: Group selected records into a batch and reconcile aggregate totals. Undo the last mutation and inspect the linked representation. Visible states include idle, selected, changed, conflict, and resolved. A conflicting or incomplete mutation is rejected without partial updates. Undo restores ordering, selection, and derived values.
Portable work artifact: Export and restore the actual session work in a fresh state. Malformed schema, duplicate IDs, unknown references, and invalid bounds make no state change. A valid import restores authored structure and regenerates exportedAt. Produces an interoperable format named flavor-balance-v1-batch-reconciler.json.
</core_features>

<visual_design>A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
The visual hierarchy makes current state and next action clear, with desktop primary surface plus summary and inspector.
</visual_design>

<motion>The acted-on item moves or morphs into its new state.
Reduced motion preserves feedback without transforms.
</motion>

<requirements>Tailwind CSS 4.3.2 installed locally (npm-local/no-CDN).
Keyboard and touch-equivalent controls produce the identical canonical mutation; Ctrl/Cmd+Z undoes it.
Narrow layouts change interaction model, preserve touch targets, and avoid horizontal clipping (mobile mode transforms desktop surface into a stack/drawer/stepper).
Semantic controls, keyboard parity, focus management, live updates, contrast, and reduced-motion support.
Keep edits responsive on 100+ records and avoid rebuilding unrelated surfaces.
Copy names the domain consequence and recovery action precisely.
No network dependency; pure local browser APIs. Persistence via export/import JSON only (no localStorage).
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`.
- `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds).
- WebMCP is a required delivery step; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- entity-collection-v1
- artifact-transfer-v1
- command-session-v1

Bindings:
- Entity: flavor-component
- Entity fields: status, name, intensity, notes
- Entity operations: create, update, delete, select, toggle
- Artifact operations: export, import
- Export formats: flavor-balance-v1-batch-reconciler.json
- Session operations: start, stop, restart, advance (undo)
- Workflow completion: grouping selected records into a batch reconciles aggregate totals and updates the session ledger.
</webmcp_action_contract>
