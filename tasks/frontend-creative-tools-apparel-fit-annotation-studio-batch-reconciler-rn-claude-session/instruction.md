# Apparel Fit Annotation Studio — Batch Reconciler

**Genre:** `good-app`
**Target users:** People who manage fit annotations in a bounded local workflow

<summary>
Manage fit annotations through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Focus: group selected records into a batch and reconcile aggregate totals. It implements a local session ledger that exposes save health, tool-output retention, safe resume, and recovery states. Built with Tailwind CSS 4.3.2. All dependencies must be installed locally via npm (npm-local/no-CDN rule).
</summary>

<core_features>
Create, edit, archive, and filter fit annotations with explicit domain statuses (empty, draft, ready, changed, archived).
Group selected records into a batch and reconcile aggregate totals. Reject conflicting or incomplete mutations without partial updates. Undo the last mutation to restore ordering, selection, and derived values. Visible states: idle, selected, changed, conflict, resolved.
Export and restore the actual session work in a fresh state. Artifact shape: ApparelFitAnnotationStudioSession with schemaVersion (task-specific v1 enum), exportedAt (RFC3339), records[] (ID unique, explicit enum status), derived{}, and history[]. Field-level validation on import.
</core_features>

<visual_design>
A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas.
Desktop primary surface plus summary and inspector.
The visual hierarchy makes current state and next action clear.
</visual_design>

<motion>
The acted-on item moves or morphs into its new state.
Reduced motion preserves feedback without transforms.
</motion>

<requirements>
1.  signature_interaction (AC-01): The user can group selected records into a batch and reconcile aggregate totals. The batch reconciler mutation changes the primary record, linked view, and status together.
2.  visual_hierarchy (AC-02): The visual hierarchy makes current state and next action clear when inspecting the primary work surface, linked summary, and detail panel.
3.  causal_motion (AC-03): Motion connects the acted-on item to its new state and has a reduced-motion equivalent when grouping selected records into a batch and reconciling aggregate totals.
4.  schema_contract (AC-04): The tool result and exported artifact contain the declared API-shaped fields (schemaVersion, exportedAt, records[], derived{}, history[]).
5.  complete_user_flow (AC-05): The user can create, edit, mutate, undo, and complete one record. The end-to-end job is recoverable without reload.
6.  boundaries_recovery (AC-06): Trying exact bounds, an invalid cross-field value, an empty state, and malformed import each gives field-level recovery and preserves prior valid state.
7.  mobile_mode (AC-07): The desktop surface becomes a usable stack/drawer/stepper without horizontal overflow when using the signature interaction at a narrow viewport.
8.  alternate_input (AC-08): Repeating the signature interaction with keyboard and touch-equivalent controls produces identical state with visible focus and live feedback.
9.  large_collection (AC-09): Exercising a seeded collection with at least 100 records leaves the signature interaction responsive and unrelated rows stable.
10. domain_copy (AC-10): Inspecting labels, statuses, errors, and empty-state text shows copy names the domain consequence and recovery action precisely.
11. linked_utility (AC-11): Mutating a record and using the linked representation provides domain utility beyond CRUD to make the next decision.
12. source_fidelity (AC-12): The visual and interaction thesis is coherent without copying unrelated screens compared to the cited source interaction vocabulary.
13. artifact_round_trip (AC-13): Exporting, clearing, importing, and inspecting the edited variant record and derived state shows authored order/selection/geometry and domain state survive; invalid import is a no-op.
14. All dependencies must be installed locally via npm (npm-local/no-CDN rule).
15. Built using Tailwind CSS 4.3.2.
</requirements>

<webmcp_action_contract>
{
  "webmcp_session_info": {
    "description": "Returns session context.",
    "parameters": {}
  },
  "webmcp_list_tools": {
    "description": "Lists available contract bindings.",
    "parameters": {}
  },
  "webmcp_invoke_tool": {
    "description": "Invokes a contract binding to interact with the batch reconciler.",
    "parameters": {
      "tool_name": "string",
      "args": "object"
    }
  }
}
</webmcp_action_contract>
