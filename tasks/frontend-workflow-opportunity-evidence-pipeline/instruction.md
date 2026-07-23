# Opportunity Evidence Pipeline

<summary>
The user captures opportunity requirements, binds them to verified experience evidence, branches a tailored resume/cover packet, routes the application through a constrained stage board, freezes submission snapshots, schedules interview/follow-up obligations, records outcomes, and exports a portable application dossier. Profile truth, tailored wording, submitted artifacts, and post-submission history must remain distinct.

This is not a resume builder or card-only job tracker. The signature interaction is dragging requirement chips onto evidence cards while a fit lattice, packet outline, unsupported-claim rail, stage eligibility, deadline timeline, submission diff, and artifacts update together.
</summary>

<core_features>
- Users select exact spans from an immutable opportunity brief and classify each as must-have, preferred, responsibility, domain, logistics, or unknown, with priority and note. Duplicate/overlapping spans require merge or separate justification. Every active must-have appears in the fit lattice and packet review.
- Evidence cards drag onto requirements as direct, transferable, contextual, gap, or excluded. Bindings cite exact immutable fact/artifact spans and may include a bounded interpretation note. Selecting a requirement highlights evidence, packet blocks, risks, and stage gate. Keyboard source-target binding and mobile selectors match drag behavior.
- The user assembles ordered resume blocks and cover sections from evidence-bound facts, then edits wording under exact character/section/page-budget rules. New factual metrics, dates, technologies, employers, or outcomes not represented in bound evidence are blocked. Users fork variants, compare wording/order/evidence/coverage deltas, and merge each conflict explicitly.
- The fit view exposes weighted coverage, unsupported wording, evidence reuse, chronology, unexplained gap, and logistics conflicts; it never promises hiring likelihood. A deterministic reviewer names exact requirement/evidence/text spans and labels ready, needs-evidence, needs-edit, or intentional-gap. Exceptions require a note and cannot authorize fabricated facts.
- Opportunity cards move through discovered, researching, tailoring, ready, submitted, screen, interview, offer, declined, withdrawn, and archived. Transitions require declared packet/review/deadline conditions. Invalid drag snaps back with blockers. WIP limits, mutually exclusive terminal states, and stage-specific fields are exact.
- Submitting freezes opportunity revision, packet variant, requirement/evidence bindings, rendered documents, answers, and timestamp/checksum. Later candidate/profile or opportunity edits mark current drafts changed but never mutate the snapshot. Correcting a submission creates an amendment linked to the original and requires a reason.
- Stage events generate preparation, interview, thank-you, response-window, and follow-up tasks with dependencies. Users reschedule by timeline drag under deadline and no-overlap rules, log completion evidence, and branch an answer note from a bound requirement/evidence pair. Outcome events reconcile outstanding tasks without deleting history.
- Desktop shows stage board, requirement/evidence lattice, packet composer, and review/timeline rail. Mobile becomes lane stacks, requirement/evidence cards, packet-block sheets, vertical submission/task lineage, and review drawer. Export produces canonical JSON, JSON Resume-compatible tailored resume, Markdown cover letter, ICS obligations, and CSV application/submission ledger; import reconstructs state exactly.
</core_features>

<visual_design>
- Inspect requirement/evidence/gap/unsupported, variant/diff, blocked/ready/submitted/terminal, task/overdue/snapshot states; provenance stays legible.
</visual_design>

<motion>
- Bind, reorder/branch, propagate readiness, move/reject card, freeze/diff snapshot, reschedule task, then repeat reduced; endpoints/state agree.
</motion>

<requirements>
Dashboard-derived hardness contract:
- Begin from a genuinely clean state: no authored work, completion, approval, export, or success evidence may be preseeded. Each milestone must become observable only after its real UI action, with exact before/after entity and event-count deltas.
- For every pointer or direct-manipulation path the proposal names, make the keyboard/exact-value path converge to one canonical event with identical stable IDs, derived values, linked-view selection, history, WebMCP-observable state, persistence, and export bytes after normalization. No-op, invalid, cancelled, and double activation paths must create zero extra events.
- Exercise adversarial orderings, including canonical edit before/after the proposal's merge, repair, reconciliation, or approval action; undo followed by branch; cancel after a transient preview; and import after divergent local edits. Equivalent orders must converge, while cancelled actions restore the complete prior snapshot including selection, viewport, filters, focus, and history anchor.
- Treat every import mode as an atomic transaction over the same API-shaped schema used by create/edit/export. Validate all records and fields before commit; report every file/record/field diagnostic together; reject unknown enums, exact-boundary violations, duplicate or dangling IDs, cross-field contradictions, stale derived values, and corrupted manifests with zero state mutation.
- Make the useful end state an interoperable downloadable artifact of the session's actual work. Specify exact filenames, schemas, required keys/columns, units, precision, stable sort order, relationship integrity, and regenerated exportedAt values. A successful import must restore authored and derived state, and re-export must be semantically identical except for explicitly allowed regenerated metadata.
- Verify genre-correct reload behavior and isolation: state that the PRD promises to persist must survive reload exactly; transient previews, dialogs, hover, drag, and invalid drafts must not leak into persistence. Separate sessions/import attempts must not silently share or overwrite state.
- Cover exact minimum, maximum, just-inside, and just-outside values for every bounded field, plus enum, format, uniqueness, and cross-field rules. Error copy must identify the field, rejected value or rule, and recovery action; correcting the value must clear only the corresponding error.
- Require real browser mechanics for graded interactions: normal pointer actionability, computed style while actually hovered, keyboard traversal and named shortcuts (including undo and command/search where promised), modal focus trap and opener return, live announcements, non-color evidence, reduced-motion causal parity, and the full canonical flow at the stated mobile viewport without page-level overflow or sub-44px targets.
- At the proposal's maximum declared fixture, direct manipulation must acknowledge within 100 ms, linked/derived views must settle within 500 ms, and export/import must complete within 2 s without dropped interactions, stale views, layout jumps, console errors, page errors, or non-local network dependence.

Deterministic fixture constraints:
- The fictional candidate profile has 14 experience facts, eight project artifacts, six skill assertions, and fixed dates/metrics. Five fictional opportunities contain 32 requirements, three ambiguous phrases, application deadlines, stage rules, and deterministic reviewer/interview/outcome events. No real employers, network, or AI generation are used.

Artifact contract:
OpportunityEvidenceDossier uses schemaVersion: "opportunity-evidence-dossier/v1" and stores fixture/hash/timezone, immutable profile/opportunity revisions, requirement spans/classes/priorities, evidence bindings/notes, packet variant DAG/blocks/text/merge choices, reviewer runs/findings/exceptions, application cards/stage events, submission snapshots/amendments/render checksums, obligations/dependencies/completion evidence, outcomes/annotations/view state/history, derived coverage/integrity/readiness/artifact checksums, JSON Resume, Markdown, ICS, CSV, and UTC exportedAt.
- Requirement spans reference exact brief offsets and classifications; active ids are unique.
- Evidence bindings reference immutable facts/artifacts; packet factual tokens must resolve to bound evidence under declared fixture token map.
- Variant and obligation graphs are acyclic; merge conflicts resolved; page/section/character budgets exact.
- Board transitions follow the declared state machine and current prerequisite checks; terminal states are mutually exclusive.
- Submission snapshots are immutable and checksummed; amendments append and cannot replace prior files/events.
- ICS tasks/times, CSV stage/submission rows, JSON Resume facts/order, and Markdown content/citations agree with the selected snapshot.
- Import rejects fixture/revision mismatch, orphan span/binding/block, unsupported fact, graph cycle, invalid transition, mutated snapshot, forged review/derived/checksum, or artifact disagreement atomically.
- Canonical re-export changes only exportedAt; JSON Resume content, Markdown, ICS, and CSV remain byte-identical.
- Tailwind CSS 4.3.2 is required. All libraries installed via npm and bundled locally; no CDN imports.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- browse-query-v1
- entity-collection-v1
- artifact-transfer-v1

Module specs:
<module_spec id="browse-query-v1">
{
  "id": "browse-query-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Browse / query",
  "purpose": "Content sites, catalogs, feeds, dashboards, and navigation.",
  "permitted_operations": ["open", "search", "apply_filter", "clear_filter", "sort", "set_locale", "set_theme"],
  "binding_keys": {
    "required_any_of": [["destinations"]],
    "optional": ["browsable_entity", "filters", "sorts", "locales", "themes", "visible_postconditions"]
  },
  "restrictions": [
    "No arbitrary URL, selector, or undeclared route.",
    "Destinations and filters come from bounded PRD declarations.",
    "Visible navigation state must update via the same handlers as UI controls."
  ],
  "tool_name_prefix": "browse"
}
</module_spec>

<module_spec id="entity-collection-v1">
{
  "id": "entity-collection-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Entity collection",
  "purpose": "Carts, records, favorites, calendar events, list items, and local entities.",
  "permitted_operations": ["create", "select", "update", "delete", "toggle", "quantity", "reorder"],
  "binding_keys": {
    "required_any_of": [["entity"], ["entity_operations"]],
    "optional": ["entity_fields", "value_bounds", "visible_postconditions"]
  },
  "restrictions": [
    "Closed entity and field enums only.",
    "Bounded string and numeric values.",
    "No generic state setter or arbitrary patch object.",
    "Invokes the same domain command used by the visible control.",
    "Delete requires explicit confirm=true.",
    "Reorder only when gesture mechanics are not being evaluated."
  ],
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
- Browsable entity: opportunity; evidence; packet; stage; task
- Destinations: opportunity-brief; fit-lattice; packet-composer; stage-board; task-timeline
- Filters: stage; status
- Sorts: deadline; priority
- Themes: light; dark
- Entity: binding; packet-block; submission; obligation; outcome
- Entity operations: create; select; update; delete
- Entity fields: requirement-id; evidence-id; span-text; stage; outcome; due-date
- Artifact operations: export; import
- Export formats: json; json-resume; markdown; ics; csv
- Import modes: json

Mechanics exclusions:
- Drag-and-drop bindings must be observed through Playwright, not just WebMCP
- File interactions must not use raw file payloads in WebMCP args

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
