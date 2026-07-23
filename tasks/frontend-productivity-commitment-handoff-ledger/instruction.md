<summary>
The task targets healthy frontier weaknesses in ownership state machines, transactional handoff, dependency propagation, revision/response lineage, deadline negotiation, evidence verification, responsive transformation, UI/tool parity, and exact artifacts. Both healthy model medians below 0.35 is a prospective controlled-pilot target. Build using React, Zustand, Tailwind CSS 4.3.2, and a standard component library.

The fictional Neighborhood Guide project has six collaborators, 14 commitments, four dependency chains, fixed skills/availability, three ambiguous requests, two waiting-on-external states, one rejected handoff, one partial delivery, and deterministic response events. No real messages or people are used.
</summary>

<core_features>
Commitment contract
Each commitment requires outcome, acceptance evidence, requester, current owner, evaluator, due instant, effort, priority, dependencies, and status. Ambiguous verbs or missing evidence criteria trigger fixture-based findings. Commitments may split into children whose evidence collectively satisfies the parent; deleting completed/history-bound work is forbidden.

Responsibility and dependency graph
Commitment nodes occupy owner lanes and connect by blocks, informs, contributes-to, or verifies edges. Cycles reject for blocks/contributes-to. Selecting a node/edge highlights calendar bars, handoff packet fields, waiting queue, and workload. Keyboard source-target binding and mobile selectors equal graph gestures.

Handoff packet composer
A proposed handoff contains scope snapshot, relevant dependency/evidence ids, constraints, current progress, open questions, due date, verification rule, and fallback owner. Users include/exclude cards from a spatial packet tray with exact completeness rules. Sensitive fixture notes can be redacted only with a reason and may render the packet incomplete.

Transactional transfer workflow
States are draft, requested, clarification-needed, revised, accepted, rejected, expired, withdrawn, transfer-ready, transferred, delivered, verification-failed, verified, renegotiating, cancelled, or closed. Requesting reserves capacity but leaves canonical ownership unchanged. Only current-revision acceptance plus complete packet and valid dependencies transfers ownership atomically.

Clarification and revision lineage
The proposed owner may ask bounded fixture questions, propose deadline/scope edits, accept, or reject. Editing a field after response creates a revision and resets only responses invalidated by the changed field set. Compare shows packet/contract/deadline differences. Expiry releases capacity and creates a follow-up decision without mutating ownership.

Workload and deadline negotiation
Owner lanes show committed, reserved, waiting, and available effort by day. Moving a due date or accepting a handoff previews overload, dependency lateness, and evaluator availability. A deterministic suggestion may split, resequence, move deadline, or choose fallback; it remains a proposal with rule evidence.

Delivery and verification
The owner attaches fixture evidence items to acceptance criteria and marks delivered. The evaluator accepts, rejects specific criteria, or requests revision. Partial delivery preserves satisfied criteria and creates a revision loop for the remainder. Verification changes downstream dependency eligibility; closing requires all criteria and follow-up obligations resolved.

Responsive ledger and artifacts
Desktop shows owner lanes/graph, commitment detail/packet tray, timeline/workload, and response/verification rail. Mobile becomes owner/commitment cards, vertical dependency/handoff lineage, packet checklist sheets, deadline/workload drilldowns, and response/verification stepper. Export produces canonical JSON, CSV commitment/ownership event ledger, ICS deadlines/follow-ups, and Markdown handoff/verification packets; import reconstructs state exactly.
</core_features>

<visual_design>
Inspect owner/proposed/reserved/waiting, packet complete/redacted, response/revision/expired, delivered/partial/rejected/verified states -> responsibility stays legible.
Desktop shows owner lanes/graph, commitment detail/packet tray, timeline/workload, and response/verification rail.
</visual_design>

<motion>
Build packet, reserve/transfer, shift workload/dependencies, deliver/reopen/verify, then repeat reduced -> causal endpoints and owner/status agree.
Packet cards, reservation overlay, ownership transfer, workload/dependency propagation, and verification reopening animate cause; reduced motion retains explicit before/after owner/status/deltas.
</motion>

<requirements>
Begin from a genuinely clean state: no authored work, completion, approval, export, or success evidence may be preseeded. Each milestone must become observable only after its real UI action, with exact before/after entity and event-count deltas.
For every pointer or direct-manipulation path the proposal names, make the keyboard/exact-value path converge to one canonical event with identical stable IDs, derived values, linked-view selection, history, WebMCP-observable state, persistence, and export bytes after normalization. No-op, invalid, cancelled, and double activation paths must create zero extra events.
Exercise adversarial orderings, including canonical edit before/after the proposal's merge, repair, reconciliation, or approval action; undo followed by branch; cancel after a transient preview; and import after divergent local edits. Equivalent orders must converge, while cancelled actions restore the complete prior snapshot including selection, viewport, filters, focus, and history anchor.
Treat every import mode as an atomic transaction over the same API-shaped schema used by create/edit/export. Validate all records and fields before commit; report every file/record/field diagnostic together; reject unknown enums, exact-boundary violations, duplicate or dangling IDs, cross-field contradictions, stale derived values, and corrupted manifests with zero state mutation.
Make the useful end state an interoperable downloadable artifact of the session's actual work. Specify exact filenames, schemas, required keys/columns, units, precision, stable sort order, relationship integrity, and regenerated generatedAt/exportedAt values. A successful import must restore authored and derived state, and re-export must be semantically identical except for explicitly allowed regenerated metadata.
Verify genre-correct reload behavior and isolation: state that the PRD promises to persist must survive reload exactly; transient previews, dialogs, hover, drag, and invalid drafts must not leak into persistence. Separate sessions/import attempts must not silently share or overwrite state.
Cover exact minimum, maximum, just-inside, and just-outside values for every bounded field, plus enum, format, uniqueness, and cross-field rules. Error copy must identify the field, rejected value or rule, and recovery action; correcting the value must clear only the corresponding error.
Require real browser mechanics for graded interactions: normal pointer actionability, computed style while actually hovered, keyboard traversal and named shortcuts (including undo and command/search where promised), modal focus trap and opener return, live announcements, non-color evidence, reduced-motion causal parity, and the full canonical flow at the stated mobile viewport without page-level overflow or sub-44px targets.
At the proposal's maximum declared fixture, direct manipulation must acknowledge within 100 ms, linked/derived views must settle within 500 ms, and export/import must complete within 2 s without dropped interactions, stale views, layout jumps, console errors, page errors, or non-local network dependence.

Artifact contract:
CommitmentHandoffLedger uses schemaVersion commitment-handoff-ledger/v1 and stores fixture/hash/timezone, collaborators/skills/availability, commitment contracts/criteria/status, dependency graph, handoff transaction DAG/revisions/packet membership/redactions, responses/logical clock/expiry/reservations, atomic ownership events, workload/deadline suggestions, delivery evidence/criterion decisions/revision loops, follow-up obligations, filters/annotations/history, derived completeness/dependency/workload/risk/artifact checksums, CSV, ICS, Markdown packets, and UTC exportedAt.
Commitment/dependency ids are unique; blocking/contribution graph is acyclic; parent/child evidence coverage rules hold.
Handoff revisions are acyclic, snapshot exact contract/packet ids, and response invalidation follows declared changed-field matrix.
Ownership event occurs only after current accepted revision, complete valid packet, reservation, and atomic transfer; requests/rejections/expiry never transfer.
Workload uses integer effort points by day and separates committed/reserved/waiting; deadline/dependency formulas are exact.
Delivery criteria decisions reference valid immutable fixture evidence; partial verification preserves prior satisfied decisions unless evidence is explicitly superseded.
CSV events/owners, ICS UID/times/status, and Markdown packet/criteria content agree with canonical selected transactions.
Import rejects fixture/timezone mismatch, graph/revision cycle, incomplete transfer, impossible state/response/ownership event, workload/evidence forgery, checksum or artifact disagreement atomically.
Canonical re-export changes only exportedAt; CSV, ICS, and Markdown remain byte-identical.
All libraries installed via npm and bundled locally; no CDN imports.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
- Self-test tooling is preinstalled and optional to use: `playwright@1.61.0` and `@playwright/mcp` are installed globally with browsers ready under `/ms-playwright`, a shared headless Chrome already exposes CDP at `http://127.0.0.1:9222`, and the same CDP bridge the verifier runs is baked at `/opt/webmcp/webmcp_stdio_server.mjs`. Drive your served app through that Chrome (playwright `connectOverCDP`, or `npx @playwright/mcp --cdp-endpoint http://127.0.0.1:9222`), and run `node /opt/webmcp/webmcp_stdio_server.mjs` (stdio MCP; defaults to that endpoint) to exercise your registered `window.webmcp_*` tools exactly as the verifier will.
</delivery>

<webmcp_action_contract>
</webmcp_action_contract>
