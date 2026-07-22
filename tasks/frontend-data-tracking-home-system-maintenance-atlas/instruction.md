<summary>
The user maps assets onto a floor/system diagram, records symptoms and readings, branches diagnostic hypotheses, schedules recurring maintenance, allocates parts, executes and recovers service steps, verifies inspections, compares before/after evidence, and exports a transferable maintenance dossier. Planned work, observed condition, diagnosis, performed action, and verified outcome must remain distinct.

This is a hard browser app / spatial maintenance ledger with no backend. The signature interaction is selecting or moving an asset node in a linked floor/system graph while symptom timelines, dependency paths, maintenance schedule, parts reservations, work-order state, health matrix, and dossier update together.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
Feature: Floor and system topology —
- The fictional Juniper House has two floors, 16 rooms/zones, 22 assets, 28 plumbing/electrical/HVAC dependency edges.
- Assets drag among valid room anchor points and connect with supplies, drains-to, powers, controls, vents-to, or located-in edges.
- The floor plan and abstract system graph share selection. Edge types enforce source/target classes and acyclicity where declared.
- Keyboard node move/link and mobile source-target/room sheets equal pointer gestures.
Feature: Condition and symptom timeline —
- Readings store measure, value, unit, observed time, provenance, and note.
- Symptoms store type, severity, interval, affected asset/zone, and evidence.
- Values display against fixture-specific normal bands without giving advice.
- Brushing time highlights graph nodes, work orders, and health cells. Missing, not-measured, and zero remain distinct.
Feature: Diagnostic hypothesis branches —
- Users connect symptoms/readings to possible causes and tests in a branch graph.
- Tests have deterministic fixture outcomes and costs/durations.
- Accepting a test result prunes incompatible branches only after explicit review; rejected hypotheses remain historical.
- A hypothesis cannot be marked confirmed without required evidence, and changing upstream evidence marks diagnosis/work stale.
Feature: Recurring maintenance planner —
- Each asset supports interval- or date-based service series with this, this-and-future, or all exceptions, seasonal windows, dependencies, and parts requirements.
- Generated occurrences appear on a calendar and asset timeline.
- Completing or rescheduling one occurrence preserves recurrence identity and never rewrites prior service history.
Feature: Parts and tool reservation —
- Work orders reserve quantities from the fixture inventory with lot, compatibility, and expiry.
- Reservations are tentative until work begins, release on cancel, and consume only on an explicit step.
- Substitution requires compatibility evidence and creates a work-order revision.
- Available, reserved, consumed, returned, and expired quantities reconcile exactly.
Feature: Resumable work-order execution —
- The workflow is inspect → isolate fixture state → diagnose/test → approve plan → reserve → perform steps → verify → close.
- Steps show queued, active, paused, awaiting evidence, failed, skipped-allowed, complete, or rolled back.
- Deterministic failures include a failed test and incompatible part.
- Retry, revise branch, rollback reversible step, or abandon preserve attempts and inventory/service history.
Feature: Verification and certification —
- Before/after readings, symptom resolution, step evidence, parts, and inspection checklist feed a review.
- Closing requires declared criteria; exceptions need type/note and cannot waive fixture hard checks.
- Certification freezes asset/topology/diagnosis/work/evidence checksums and becomes stale after relevant edits.
Feature: Responsive atlas and artifacts —
- Desktop shows floor/system graph, condition timeline, planner, and diagnostic/work rail.
- Mobile becomes room/asset cards, vertical system lineage, reading/symptom sheets, agenda occurrences, parts cards, and work-order stepper.
- Export produces canonical JSON, CSV asset/service/reading ledger, SVG floor/system maps, and Markdown handoff report; import reconstructs state exactly.
</core_features>

<visual_design>
- Inspect normal/abnormal/missing, suspected/rejected/confirmed/stale, due/exception, available/reserved/consumed, work/cert states → hierarchy stays legible.
- UI must accurately display fixed service intervals, 12 parts, nine historic readings, three active symptoms, two ambiguous diagnostic paths, one overdue inspection.
</visual_design>

<motion>
- Causal motion: Node/edge travel, evidence propagation, schedule split, reservation flow, work recovery, and health/cert changes explain consequences.
- Reduced motion retains persistent deltas but disables travel animations.
</motion>

<requirements>
- Artifact contract (HomeMaintenanceDossier): Uses schemaVersion "home-maintenance-dossier/v1". Stores fixture/hash/timezone, floors/rooms/anchors, assets/topology edges, readings/symptoms/evidence, diagnostic branch DAG/tests/results/reviews, maintenance series/occurrences/exceptions, parts/lots/reservations/movements, work orders/revisions/steps/attempts, verification/certifications, filters/annotations/history, derived health/dependency/schedule/inventory/artifact checksums, CSV, SVG maps, Markdown, and UTC exportedAt.
- Asset anchors stay in valid zones; typed edges reference compatible assets and obey declared cycle rules.
- Reading units/bounds and symptom intervals are exact; provenance/time are append-only after use in a closed order.
- Diagnostic graph is acyclic and confirmed state has all required evidence; stale propagation is deterministic.
- Series expansion/scope edits preserve occurrence identity under exact local-date rules.
- Inventory movements conserve integer quantities per lot; reservations cannot exceed available/compatible/unexpired stock.
- Work attempts follow the state machine; rollback only reverses declared steps and cannot resurrect consumed nonreturnable parts.
- CSV rows, SVG nodes/edges/anchors, and Markdown chronology/checksums agree with canonical certified state.
- Import rejects fixture/timezone mismatch, invalid topology/anchor, unit/bound error, diagnostic cycle/forgery, recurrence overlap, inventory imbalance, impossible attempt/certification, unsafe SVG, or artifact disagreement atomically.
- Canonical re-export changes only exportedAt; CSV, SVG, and Markdown remain byte-identical.
- npm-local/no-CDN
- Use Tailwind CSS 4.3.2 installed via npm.
</requirements>

<delivery>
- The solution MUST be built entirely in the browser using in-memory state. No backend persistence.
- Do NOT use localStorage or indexedDB.
- Everything must be contained in the tasks/frontend-data-tracking-home-system-maintenance-atlas/solution/app directory and served via `npm start` on port 3000.
</delivery>

<webmcp_action_contract>
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
    "No raw files, filesystem paths, blobs, base64, or artifact contents in WebMCP arguments or results."
  ],
  "tool_name_prefix": "artifact"
}
</module_spec>

<module_spec id="entity-collection-v1">
{
  "id": "entity-collection-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Entity Collection",
  "purpose": "CRUD and selection on domain collections.",
  "permitted_operations": ["create", "select", "update", "delete", "toggle"],
  "binding_keys": {
    "required_any_of": [["entity_operations", "entity_fields"]],
    "optional": ["entity_name"]
  },
  "restrictions": [],
  "tool_name_prefix": "entity"
}
</module_spec>

Bindings:
- Artifact operations: export; import
- Export formats: session-json; csv; svg; markdown
- Import modes: session-json
- Entity: asset; reading; symptom; hypothesis; series; occurrence; part; workorder; certification
- Entity operations: select; create; update; delete
</webmcp_action_contract>
