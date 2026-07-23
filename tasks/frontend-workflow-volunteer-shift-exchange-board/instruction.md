<summary>
Build a browser app for a Volunteer Shift Exchange Board that allows a coordinator and fictional volunteers to maintain event coverage through multi-person shift exchanges. The app handles constraint-aware roster exchange, graph cycles, transactional state, temporal constraints, approvals/expiry, partial-failure rollback, shared views, alternate input, responsive transformation, UI/tool parity, and ICS/CSV fidelity. Use Tailwind CSS 4.3.2.
</summary>

<core_features>
Feature: Roster and coverage canvas —
- Shift cards occupy time lanes by volunteer and venue.
- Dragging a card to another volunteer proposes reassignment; drawing successive edges creates a two- to five-person exchange loop.
- Keyboard source-target selection and mobile exchange sheets equal pointer gestures.
- Coverage cells show required versus assigned role counts and select exact shifts.

Feature: Exchange transaction composer —
- Each exchange stores offered shift, requested/received shift, role assignment, participants, rationale, expiry, and optional coordinator override.
- Open chains are invalid; duplicate shift/participant roles and self-loops reject.
- The composer previews before/after roster, coverage, hours, fairness, travel, and conflicts without mutating committed ownership.

Feature: Constraint graph —
- Hard rules cover availability, skill/certification, accessibility-compatible venue, overlapping time, 11-hour rest, 20-hour cap, role coverage, and cross-venue travel.
- Soft rules cover preferences and fairness.
- Selecting a conflict highlights exact volunteer, shifts, edge, threshold, and remediation.
- Overrides are allowed only for declared soft rules and require a note.

Feature: Participant response workflow —
- Sending a proposal creates tentative shift reservations and response tasks for every participant.
- States are draft, sent, viewed, accepted, declined, expired, withdrawn, awaiting coordinator, approved, committing, committed, rolled-back, or failed.
- One decline or expiry releases all reservations.
- Editing after acceptance creates a revision and resets affected responses with visible lineage.

Feature: Coordinator approval and atomic commit —
- When all participants accept and hard constraints pass, the coordinator compares the current roster checksum against the proposal base.
- If current state changed, approval becomes stale and requires rebase/review.
- Commit changes all shift owners simultaneously and appends ownership history; no intermediate roster may appear as committed.

Feature: Partial-failure simulation and rollback —
- The fixture can fail after two internal ownership writes.
- The UI must expose the failed commit attempt while canonical roster remains at the pretransaction snapshot, then allow retry atomic commit, rebase, edit revision, or cancel.
- Retry is idempotent and cannot duplicate audit events or responses.

Feature: Fairness and waitlist routing —
- Charts show desirable/undesirable hours, total hours, preference match, and recent swap burden per volunteer.
- A waitlist routes open shifts to eligible volunteers in deterministic priority order and produces proposals only.
- Accepting one invitation still passes through reservation/approval/commit.
</core_features>

<visual_design>
- Inspect committed, proposed, reserved, conflicted, responded, expired, stale, committing, and rolled-back states; ownership and transaction provenance must stay legible.
</visual_design>

<motion>
- Draw loop, reserve/release, propagate coverage, commit/rollback, then repeat reduced; causal endpoints and ownership agree.
- Exchange edges, reservation overlays, coverage/fairness shifts, expiry release, atomic commit/rollback animate cause; reduced motion retains explicit before/after ownership traces.
</motion>

<requirements>
- Use Tailwind CSS 4.3.2. All libraries installed via npm and bundled locally; no CDN imports.
- Begin from a genuinely clean state: no authored work, completion, approval, export, or success evidence may be preseeded. Each milestone must become observable only after its real UI action, with exact before/after entity and event-count deltas.
- For every pointer or direct-manipulation path the proposal names, make the keyboard/exact-value path converge to one canonical event with identical stable IDs, derived values, linked-view selection, history, WebMCP-observable state, persistence, and export bytes after normalization. No-op, invalid, cancelled, and double activation paths must create zero extra events.
- Exercise adversarial orderings, including canonical edit before/after the proposal's merge, repair, reconciliation, or approval action; undo followed by branch; cancel after a transient preview; and import after divergent local edits. Equivalent orders must converge, while cancelled actions restore the complete prior snapshot including selection, viewport, filters, focus, and history anchor.
- Treat every import mode as an atomic transaction over the same API-shaped schema used by create/edit/export. Validate all records and fields before commit; report every file/record/field diagnostic together; reject unknown enums, exact-boundary violations, duplicate or dangling IDs, cross-field contradictions, stale derived values, and corrupted manifests with zero state mutation.
- Make the useful end state an interoperable downloadable artifact of the session's actual work. Specify exact filenames, schemas, required keys/columns, units, precision, stable sort order, relationship integrity, and regenerated generatedAt/exportedAt values. A successful import must restore authored and derived state, and re-export must be semantically identical except for explicitly allowed regenerated metadata.
- Verify genre-correct reload behavior and isolation: state that the PRD promises to persist must survive reload exactly; transient previews, dialogs, hover, drag, and invalid drafts must not leak into persistence. Separate sessions/import attempts must not silently share or overwrite state.
- Cover exact minimum, maximum, just-inside, and just-outside values for every bounded field, plus enum, format, uniqueness, and cross-field rules. Error copy must identify the field, rejected value or rule, and recovery action; correcting the value must clear only the corresponding error.
- Require real browser mechanics for graded interactions: normal pointer actionability, computed style while actually hovered, keyboard traversal and named shortcuts (including undo and command/search where promised), modal focus trap and opener return, live announcements, non-color evidence, reduced-motion causal parity, and the full canonical flow at the stated mobile viewport without page-level overflow or sub-44px targets.
- At the proposal's maximum declared fixture (200 shifts, 80 volunteers, 50 exchanges, 100 responses/attempts), direct manipulation must acknowledge within 100 ms, linked/derived views must settle within 500 ms, and export/import must complete within 2 s without dropped interactions, stale views, layout jumps, console errors, page errors, or non-local network dependence.
- Artifact contract: VolunteerExchangeRoster uses schemaVersion: "volunteer-exchange-roster/v1" and stores fixture/hash/timezone, volunteers/skills/availability/preferences, shifts/roles/venues/requirements, committed ownership history, exchange transaction DAG/revisions/edges/reservations, validation/overrides, responses/logical clock/expiry, approvals/base checksums, commit/rollback attempts, waitlist proposals, view state/annotations/history, derived coverage/hours/rest/travel/fairness/artifact checksums, ICS, CSV, SVG, and UTC exportedAt.
- Import rejects fixture/timezone mismatch, invalid exchange cycle, duplicate reservation/ownership, hard-rule violation, impossible response/approval/attempt transition, forged derivation/checksum, unsafe SVG, or artifact disagreement atomically. Canonical re-export changes only exportedAt; ICS, CSV, and SVG remain byte-identical.
- Desktop shows roster canvas, exchange/constraint graph, response queue, and coverage/fairness rail. Mobile becomes day/venue shift cards, participant chips, vertical exchange lineage, conflict sheets, response stepper, and coverage drilldowns. Export produces canonical JSON, one ICS roster, CSV shift ownership/audit ledger, and SVG exchange diagram; import reconstructs transactions exactly.
- Complete 1440/768/375 responsiveness; shift/exchange/conflict/response/commit mobile flows retain every action, 44-pixel targets, no overflow.
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
- structured-editor-v1
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

<module_spec id="structured-editor-v1">
{
  "id": "structured-editor-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Structured editor",
  "purpose": "Document, diagram, canvas, configuration, and property editors.",
  "permitted_operations": ["select", "add", "delete", "update_property", "set_content", "switch_mode", "preview"],
  "binding_keys": {
    "required_any_of": [["editor_operations"], ["editor_object_types"]],
    "optional": ["editor_properties", "editor_modes", "value_bounds", "visible_postconditions"]
  },
  "restrictions": [
    "No arbitrary coordinate, DOM, or storage mutation via WebMCP.",
    "Drag, resize, drawing, snapping, and keyboard movement remain Playwright-driven when mechanism matters."
  ],
  "tool_name_prefix": "editor"
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
- Browsable entity: fixture queries, logical clock
- Destinations: roster canvas, exchange/constraint graph, response queue, transaction timeline, fairness/waitlist, history, artifacts
- Filters: volunteers, shifts, venue, role, state
- Editor object types: exchange, reservation, response, approval, waitlist proposal, timeline annotation
- Editor properties: status, constraint_override
- Editor operations: select, add, update_property, delete
- Editor modes: send, revise, respond, rebase, approve, commit, rollback, retry, waitlist
- Artifact operations: export, import
- Export formats: volunteer-exchange-roster-json, volunteer-exchange-roster-ics, volunteer-exchange-roster-csv, volunteer-exchange-roster-svg
- Visible postconditions: Exchange editing changes reservations, constraints, coverage/hours/fairness, responses, approval freshness, commit eligibility, history, WebMCP state, and artifacts.

Mechanics exclusions:
- Drag-and-drop shift assignment, drawing the exchange loop between shift cards, and keyboard source-target selection are graded via Playwright, never through a WebMCP snap to state.
- Interactive layout responsiveness (1440/768/375 breakpoints) and conflict highlight selection are graded via Playwright.

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
