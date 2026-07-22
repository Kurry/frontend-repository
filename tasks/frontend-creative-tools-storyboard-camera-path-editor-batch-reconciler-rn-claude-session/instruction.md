# Storyboard Camera Path Editor

<summary>
Manage story beats through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. You must use Tailwind CSS 4.3.2 installed via npm-local/no-CDN (no CDN). Variant focus: group selected records into a batch and reconcile aggregate totals. Release-derived concept: a local session ledger that exposes save health, tool-output retention, safe resume, and recovery states.
</summary>

<core_features>
- Create, edit, archive, and filter story beats with explicit domain statuses (draft, ready, changed, archived).
- Group selected records into a batch and reconcile aggregate totals.
- Undo the last mutation and inspect the linked representation.
- Export the current artifact, clear, and import it with field-level validation.
</core_features>

<visual_design>
- The visual hierarchy makes current state and next action clear.
- A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
</visual_design>

<motion>
- Motion connects the acted-on item to its new state and has a reduced-motion equivalent.
</motion>

<requirements>
- You must use Tailwind CSS 4.3.2 installed via npm-local/no-CDN.
- The batch reconciler mutation changes the primary record, linked view, and status together.
- The visual hierarchy makes current state and next action clear.
- Motion connects the acted-on item to its new state and has a reduced-motion equivalent.
- The tool result and artifact contain the declared API-shaped fields.
- The end-to-end job is recoverable without reload.
- Each invalid action gives field-level recovery and preserves prior valid state.
- The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow.
- Alternate input produces identical state with visible focus and live feedback.
- The signature interaction remains responsive and unrelated rows stay stable on a seeded collection with at least 100 records.
- Copy names the domain consequence and recovery action precisely.
- Linked views provide domain utility beyond CRUD.
- The visual and interaction thesis is coherent without copying unrelated screens.
- Authored order/selection/geometry and domain state survive; invalid import is a no-op.
</requirements>

<webmcp_action_contract>
window.webmcp_session_info = { version: "1.0", description: "Camera Path Editor session" };
window.webmcp_list_tools = () => [
  { name: "createBeat", description: "...", inputSchema: { ... } },
  { name: "updateBeat", description: "...", inputSchema: { ... } },
  { name: "archiveBeat", description: "...", inputSchema: { ... } },
  { name: "batchReconcileRecords", description: "...", inputSchema: { ... } },
  { name: "undo", description: "...", inputSchema: { ... } },
  { name: "exportSession", description: "...", inputSchema: { ... } },
  { name: "importSession", description: "...", inputSchema: { ... } },
  { name: "queryState", description: "...", inputSchema: { ... } }
];
window.webmcp_invoke_tool = (name, args) => { ... };
</webmcp_action_contract>
