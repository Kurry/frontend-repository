# Weekly Review Evidence Deck

<summary>
Build a Weekly Review Evidence Deck app using React, React Context/reducers for state (in-memory only, no localStorage), and Tailwind CSS 4.3.2. The app provides a desktop, tablet, and mobile interface for reconciling commitments, classifying outcomes, explaining variances, branching decisions, planning capacity, closing reviews, and exporting session artifacts (JSON, CSV, ICS, SVG, Markdown).
</summary>

<core_features>
Planned-versus-observed ribbon: Each commitment renders planned intervals above observed activity intervals. Brush, resize, split, or link evidence; keyboard and mobile controls provide exact start/end edits. Overlap, gaps, over-attribution, and evidence outside the cutoff are explicit and never silently normalized.

Outcome and variance classification: Classify completed, partially completed, superseded, cancelled, blocked, or unverified. Required evidence and explanation rules depend on the class. Variance separates scope, duration, timing, interruption, and missing-evidence effects while preserving exact minutes.

Evidence provenance graph: Commitments, activity events, calendar blocks, outcomes, and goals form a selectable graph. One event may support multiple outcomes only through explicit allocation totaling at most 100 percent. Selecting any locus highlights every linked ribbon, variance, note, and artifact row.

Carry-forward scenario branches: Branch drop, defer, split, rescope, delegate, or schedule decisions. Compare branches by retained value, effort, due risk, dependency impact, and next-week load. Merge requires per-property conflict resolution and preserves abandoned alternatives in lineage.

Capacity terrain: Drag accepted carry-forwards into next-week day and energy bands. Fixed events, focus limits, dependency order, and buffer rules create visible constraints. Overload remains a preview until resolved; keyboard moves announce exact old/new slot and capacity delta.

Review close, late evidence, and recovery: Closing freezes a review revision and emits a digest. Advancing the clock introduces a late event that marks affected outcomes and exports stale. Reopen, accept-with-explanation, rebase, or ignore; each creates an append-only event and a new revision rather than rewriting history.

Responsive review deck and artifacts: Desktop links ribbon, cards, graph, variance, branches, and capacity. Tablet uses synchronized panes. Mobile uses commitment cards, interval editor sheet, evidence drilldown, branch carousel, and capacity day stack with no loss of actions.
</core_features>

<user_flows>
Inspect week, reconcile intervals, allocate evidence, classify variance, branch carry-forward choices, plan capacity, close review, handle late evidence, and export artifacts.
</user_flows>

<edge_cases>
Boundary-touching intervals, DST fixture, zero vs missing, duplicate evidence, 100/101% allocation, split outcome, cutoff event, overload, dependency cycle, stale close, forged import all handled safely.
</edge_cases>

<visual_design>
Visual hierarchy and distinctions remain legible across different states (planned, observed, linked, unlinked, overallocated).
Maintains legible hierarchy across outcome and variance states.
Maintains legible hierarchy across branch and capacity states.
Maintains legible hierarchy across stale and closed states.
</visual_design>

<motion>
Causal motion for links and allocations travels to affected totals.
Causal motion preserves provenance during branch merge.
Causal motion preserves provenance during stale rebase.
Reduced motion retains endpoints and values.
</motion>

<responsiveness>
Complete at 1440/768/375. Mobile interval, evidence, outcome, branch, capacity, close, recovery, and export retain every action, 44-pixel targets, no overflow.
</responsiveness>

<accessibility>
Reconcile, allocate, classify, compare, schedule, close/rebase, and export without pointer; focus, announcements, selection, and values match.
</accessibility>

<performance>
Operate 10,000 commitments, 1,000,000 events, 100,000 links, and 10,000 branches; brushing and selection remain responsive and superseded derivations cancel.
</performance>

<writing>
Trigger every interval/evidence/outcome/branch/capacity/revision conflict; copy names exact commitment, event, time, percent, minutes, dependency, revision, and recovery.
</writing>

<innovation>
Change one evidence allocation; outcome confidence, variance, branch value, capacity decision, close freshness, and artifacts remain coherent.
</innovation>

<requirements>
Artifact contract:
weekly-review.json: schema version, fixture hash, logical clock, commitments, evidence allocations, outcomes, variance, branches, capacity plan, notes, events, revisions, and provenance.
outcome-ledger.csv: one row per commitment with planned/observed minutes, class, variance components, carry-forward, and evidence ids.
next-week.ics: accepted scheduled carry-forwards with stable UIDs, UTC timestamps, descriptions, and revision ids.
review-map.svg: current linked ribbon/evidence/capacity selection with accessible labels.
review-digest.md: totals, unresolved evidence, explanations, branch choices, capacity, and source lineage.
Export is deterministic except regenerated exportedAt; reset/import must recreate the same canonical state and re-export equivalent files. Invalid hashes, ids, allocations, timestamps, derived totals, or event order fail atomically with a path-specific error.

Frontend-native gate:
Signature interaction: Brush planned/observed intervals and see linked evidence, variance, branch, capacity, and artifact effects.
Alternate input: Pointer, keyboard interval editor, and mobile numeric/date sheet are semantically equivalent.
Linked views: Ribbon, provenance graph, outcome ledger, branch compare, and capacity terrain share one canonical selection.
Causal motion: Links and allocations travel to affected totals; stale/rebase and branch merge have visible provenance-preserving transitions. Reduced motion keeps endpoints and values.
Mobile transformation: Cards, sheets, carousel, and day stack preserve the whole workflow.
CRUD substitution: Forms cannot express interval brushing, fractional evidence allocation, graph provenance, branch lineage, or constrained capacity placement.

Fixture Initialization:
Six fictional weeks contain 28 commitments, 146 immutable activity events, 12 calendar blocks, four goals, eight interruptions, three split outcomes, two duplicated evidence candidates, and a 40-hour next-week capacity budget. A logical clock controls review cutoff and late-arriving evidence.
Initial load presents these fixtures perfectly.

Technical constraints:
All packages must be installed locally via npm. Use no CDNs for CSS or JS.
</requirements>

<webmcp_action_contract>
<module_spec id="data-tracking-v1">
{
  "id": "data-tracking-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Data tracking",
  "purpose": "Query and track intervals, allocations, and events.",
  "permitted_operations": ["query", "update"],
  "binding_keys": {
    "required_any_of": [["entity_types"]],
    "optional": ["entity_operations", "entity_fields"]
  },
  "restrictions": [],
  "tool_name_prefix": "entity"
}
</module_spec>

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
    "No raw files, filesystem paths, blobs, base64, or artifact contents in WebMCP arguments or results.",
    "File picker interaction, clipboard contents, and downloaded artifacts remain Playwright responsibilities."
  ],
  "tool_name_prefix": "artifact"
}
</module_spec>

Bindings:
- Entity types: interval, allocation, outcome, branch, capacity, clock, close/rebase, history
- Entity operations: query, update
- Entity fields: minutes, event_id, outcome_id
- Artifact operations: export; import
- Export formats: weekly-review-json, outcome-ledger-csv, next-week-ics, review-map-svg, review-digest-md
- Import modes: weekly-review-json

Mechanics exclusions:
- Drag brushing / UI interaction logic stays Playwright
- Canvas rendering logic stays Playwright
- File downloading stays Playwright

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules.
</webmcp_action_contract>
