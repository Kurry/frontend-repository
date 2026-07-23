<summary>
Build a Fictional Discussion Report Context Reconciler, a hard browser threaded-context review and resumable queue app. A reviewer resizes a committed context window over a braided threaded conversation. That one browser-native mutation must preserve stable message identity while changing included topology, role completeness, duplicate similarity, decision eligibility, the queue's exact blocking reason, selection, history, approval freshness, persistence, UI/WebMCP parity, and independently parseable GraphML/SVG/HTML evidence. The app uses deterministic local simulation over benign fictional club discussions without any backend network requests. The app uses in-memory state only (no localStorage). Built with React 19, Vite, Zustand, Tailwind CSS 4.3.2, Framer Motion, and Zod.
</summary>

<reference_screenshots>
Screenshots of the reference application are provided in-container at
/reference-screenshots/: overview.png is a full-page desktop-layout
overview (downscaled); overview-tablet.png and overview-mobile.png are full-page responsive
reflows at 1024x768 (tablet) and 390x844 (mobile) viewports; segment-NN.png are full-resolution 1440x900 sections
in top-to-bottom order with slight overlap. They are part of this instruction:
recreate what they show. Where a screenshot and the text conflict, the text
wins. Do not copy the images into /app or ship them as app assets.
</reference_screenshots>

<core_features>
Feature: Synchronized thread graph and chronology —
- Render the selected discussion as an SVG reply tree linked to a proportional chronology ribbon and semantic transcript.
- Nodes show stable message ID, author pseudonym, sequence, status, target/pinned/included role, and reply count without color-only meaning.
- Selecting or focusing a graph node, chronology tick, transcript card, role chip, duplicate row, queue packet, or artifact locus synchronizes the same message/report IDs, graph neighborhood, timeline position, and transcript scroll.
- Search supports exact id:, author:, status:, report:, and quoted-text tokens. Filters never change authored context.
- Navigating workspaces and browser back/forward preserves isolated case state and stable selection; deleting/tombstoning a visible message recomputes filtered counts and fallback representation without leaking another workspace.

Feature: Context-window brush and exact alternate input —
- Drag left/right handles or the interval body on the chronology ribbon.
- During movement, show old/new interval ghosts, included/pinned/promoted counts, role checklist, newly entering/leaving tree nodes and edges, duplicate-similarity deltas, decision/approval effects, and packet hash preview.
- Valid release opens a confirmation when required ancestry promotion is needed. Invalid release returns handles, graph expansion, transcript scroll, focus, and event count exactly.
- Keyboard users focus a handle, move one sequence with Arrow or five with Shift+Arrow, move the whole interval with Alt+Arrow, and confirm with Enter.
- An exact sheet accepts startSequence, endSequence, and promoted required IDs. Compact touch uses start/end steppers and a mini thread neighborhood. All routes commit the same request body.

Feature: Role evidence and duplicate-report reconciliation —
- The role checklist maps each requirement to a stable message locus and explains missing versus merely pinned evidence.
- A duplicate cluster view shows exact intersection, union, Jaccard fraction/percentage, targets, sources, decisions, note states, and queue effects.
- Merge preview highlights retained and superseded fields across graph, transcript, timeline, rules, notes, history, and artifacts.
- Confirm preserves both source identities and per-field lineage; decline records a reason without changing similarity.

Feature: Decision matrix, tombstone recovery, and actor history —
- The fixed rule matrix maps decisions to required evidence roles and selected citations.
- Reviewer notes attach to report or message IDs and remain stable through merge and selective undo.
- Advance logical time to reveal MSG-14's tombstone; graph/transcript/timeline/role/duplicate/decision/approval/packet surfaces update together.
- Rebase preview shows exact fallback, affected hashes, unchanged topology, stale/current approvals, and queue consequences before confirmation.

Feature: Resumable simulated queue and progress lens —
- Queue cards show packet/report IDs, revision, approval hash, enqueue time, token state, next eligible time, attempt count, and status.
- A token gauge and event rail animate enqueue, dispatch, retry wait, refill, stale, cancel, and simulated send.
- Pause/resume affects only future dispatch. Search/filtering cannot reorder FIFO semantics.
- A dispatch preview names the exact token/result before confirmation; cancel changes nothing. Reload restores queue/event state without restarting a consumed attempt.

Feature: Atomic casebook import and compact workflow —
- Import accepts discussion-casebook.json alone or the exact ZIP.
- A staging surface lists all file/record/field diagnostics before a separate confirmation.
- Successful import restores workspace, branch, selected report/message/rule/packet, graph viewport, chronology window, transcript scroll, filters, duplicate expansion, inspector, history cursor, queue cursor, note state, tomtombs, approval, and proof.
</core_features>

<user_flows>
- Open unfinished case CS-04 / Lantern Regatta Thread. Report RP-07 targets MSG-17 but initially contains only target MSG-17 and parent MSG-13, so its six-role context completeness is 2/6 = 33.33%.
- On the synchronized chronology ribbon, drag the left context handle from sequence 17 to 9 and the right handle from 17 to 22.
- The preview must include exactly fourteen interval messages MSG-09..MSG-22, preserve their nested reply topology, show five of six roles satisfied, and ask whether to promote required root MSG-01.
- Confirm that promotion once; stored context becomes fifteen messages, completeness becomes 6/6 = 100.00%, and duplicate candidate RP-03 reaches Jaccard 11/16 = 68.75%.
- Thread graph, transcript, role checklist, duplicate cluster, rule matrix, queue gate, history, WebMCP snapshot, and artifact previews must converge; the queue's blocking reason must change from context-incomplete to duplicate-merge-required, not incorrectly become dispatchable.
- Preview and cancel an invalid context window that omits the target.
- Merge RP-07 into RP-03 without erasing either source identity, record fictional decision guidance, add a later reviewer note.
- Selectively undo and redo the canonical window without losing that note, approve and enqueue the merged packet.
- Advance logical time until MSG-14 becomes a tombstone, observe the packet become stale.
- Rebase it while retaining the tombstone and topology, and dispatch it through a local two-token queue simulation.
- Export a nine-file casebook that restores the exact authored window, message tree, merge lineage, tombstone, decision, queue history, viewport, and proof.
</user_flows>

<edge_cases>
- Treat JSON-alone and ZIP imports as atomic transactions over the same API-shaped records used by create/edit/merge/queue/export.
- Validate every file, record, field, relation, formula, history edge, derived value, and hash before commit. Report all diagnostics together.
- Reject bad schema, duplicate/dangling IDs, broken tree ancestry, target-excluding windows, forged role/Jaccard values, invalid merge lineage, missing tombstones, stale decisions, impossible queue transitions, contradictory CSV/GraphML/SVG/HTML/NDJSON/Markdown, and manifest faults without mutation.
</edge_cases>

<visual_design>
- At 1440x900, inspect fresh, selected, dragging, valid/promotion preview, invalid target omission, committed, filtered, merge preview, suspended note, tombstone, stale/rebased, queued/retry/sent, approved, and branch states.
- Thread-to-packet hierarchy dominates and no distinction is color-only.
</visual_design>

<motion>
- Handles resize the interval while newly included nodes/edges join the graph, transcript cards enter, role gaps close, similarity bar crosses threshold, and the queue gate changes to the exact next blocker.
- Reduced motion preserves old/new outlines, numbered endpoints, signed counts, patterns, focus, and live text without spatial travel.
</motion>

<responsiveness>
- At 390x844, perform the exact canonical window through focused stage/steppers/promotion sheet, inspect roles/duplicate/decision, cancel invalid and queue previews, merge, approve, rebase, dispatch, and export with 44x44 targets, no page overflow, hidden action, or desktop-only gesture.
- The compact flow uses graph/chronology/transcript stage toggles, boundary steppers, role/duplicate/decision cards, queue stepper, and artifact sheet; it does not shrink or horizontally scroll the desktop workspace.
</responsiveness>

<accessibility>
- Without pointer input, find RP-07, set 9..22, promote root, confirm, inspect graph/transcript/roles, cancel invalid, merge, decide, undo/redo, rebase, enqueue/dispatch, and export.
- Focus/trap/return, announcements, event/hash/files equal pointer use.
- Grade real pointer actionability and computed hover, keyboard traversal and shortcuts, dialog focus trap/opener return, live announcements, non-color evidence.
</accessibility>

<performance>
- At the maximum fixture, acknowledge handle movement within 100 ms, settle linked derivations within 500 ms, and finish import/export within 2 s without stale selection, dropped input, layout shift, console/page error, or nonlocal request.
</performance>

<writing>
- Copy names stable case/thread/message/report/packet/file, exact fictional value/rule, unchanged state, and recovery without real moderation, safety, or legal claims.
</writing>

<innovation>
- One context-window commit reconciles chronological range, reply topology, required-role provenance, exact duplicate similarity, decision/queue eligibility, branch/history, WebMCP, and independent GraphML/SVG/HTML proof from one model.
- (Evidence of innovation not covered elsewhere must be observable)
</innovation>

<requirements>
- Casebook CB-01 has four isolated workspaces, twelve discussion threads, 240 messages, 26 reports, six rule cards, eight duplicate candidates, four reviewers, 39 retained events, two interpretation branches, and a deterministic token-bucket queue. The canonical thread TH-04 has exactly 24 messages with sequence numbers 1..24, stable parent IDs, fictional authors, UTC fixture instants, and original benign text. A message's sequence is chronological and immutable; reply edges form one rooted acyclic tree.
- MSG-01 is the root. MSG-13 is parent of target MSG-17. The six distinct required roles for RP-07 are target MSG-17, root MSG-01, parent MSG-13, nearest preceding sibling MSG-15, nearest following sibling MSG-18, and referenced message MSG-10.
- A context window stores inclusive sequence boundaries plus every thread message whose sequence lies inside them. Required ancestors/reference messages outside the chronological interval appear as locked provenance chips but are not counted as included context until the interval covers them.
- Initial window 17..17 contains the target plus a separately pinned parent, so included IDs are MSG-17,MSG-13 and completeness is 2/6 = 33.33%.
- The canonical window 9..22 includes exactly fourteen sequential messages plus the root as a locked provenance chip. Because MSG-01 is outside the interval, canonical confirmation explicitly promotes it into includedMessageIds as required ancestry, yielding fifteen stored context messages and all six roles. The authored interval remains 9..22; promotedRequiredIds:["MSG-01"] preserves why the root is included.
- Completeness is satisfied distinct required roles / 6, displayed to two decimals using half-away-from-zero rounding.
- A window is committable only when it includes the target, every pinned ID still belongs to the thread, boundary order is valid, total stored context is 2..40, and required promoted ancestry is explicitly confirmed. Omitting the target, crossing threads, reversing boundaries, selecting more than forty stored messages, or declining required ancestry rejects with no mutation.
- RP-03 stores twelve context messages: eleven are shared with canonical RP-07, and one lies outside it. Canonical RP-07 stores fifteen, so Jaccard is 11 / (15 + 12 - 11) = 11/16 = 68.75%. The duplicate-review threshold is >= 65.00%. Initial similarity is 1/13 = 7.69%. Similarity is derived from stable stored message IDs, never display text or hidden embeddings.
- Merge preview compares target, context IDs, role evidence, rule selections, notes, decisions, attachments, queue state, and revisions. Confirm creates canonical merged report RP-03, retains sourceReportIds:["RP-03","RP-07"], records per-field provenance, unions context IDs, retains both targets, and tombstones RP-07 as merged-into:RP-03.
- Rule cards are fixed fixture labels with descriptions and required evidence roles. Decision enum is guidance|no-action|archive|needs-context. Canonical merged decision is guidance with rationale 8..240 Unicode scalars and citations to MSG-10,MSG-17,MSG-18.
- At logical time 50, MSG-14 changes from visible to tombstone with reason enum author-removed|fixture-expired; its text becomes unavailable, but ID, author pseudonym, parent, sequence, timestamp, content hash, and deletion event remain. Any approved packet containing it becomes stale. Rebase must retain the tombstone node and edge, replace visible text with the exact fallback "Message unavailable in fixture", refresh derived hashes, and require approval again.
- The local queue uses capacity 20, token capacity 2, refill 2 tokens every 60 logical seconds, FIFO order by enqueue time then packet ID, and states draft|queued|sending|sent-simulated|retry-wait|stale|canceled. No network request occurs. Enqueue consumes no token; dispatch consumes one. A third dispatch before refill enters retry-wait with exact next eligible logical time.
- Actors are reviewer-aya, reviewer-ren, system-fixture, and queue-simulator. Event 40 commits the canonical window; event 41 appends reviewer note NT-04 to RP-07. Selectively undoing event 40 restores the prior context and derived similarity while keeping NT-04 suspended against stable RP-07; redo reconnects it without changing note ID/text.
- Approval requires completeness 100.00%, valid tree/provenance, resolved duplicate merge, decision/rationale/citations, all active notes resolved or accepted, no stale message content, a confirmed branch comparison, and matching artifact preview hashes.
- Treat JSON-alone and ZIP imports as atomic transactions over the same API-shaped records used by create/edit/merge/queue/export.
- API-shaped canonical records:
  - Message = {id,threadId,sequence,parentId:null|string,authorId,createdAt,status:"visible"|"tombstone",text:null|string,textHash,referenceIds:string[],deletion:null|{eventId,reason,logicalTime}}
  - ContextWindow = {reportId,startSequence,endSequence,includedMessageIds:string[],pinnedMessageIds:string[],promotedRequiredIds:string[],requiredRoles:RoleEvidence[],completenessNumerator,completenessDenominator,revision}
  - RoleEvidence = {role:"target"|"root"|"parent"|"preceding-sibling"|"following-sibling"|"referenced",messageId,satisfied:boolean,source:"interval"|"pinned"|"promoted"}
  - Report = {id,threadId,targetMessageIds:string[],sourceReportIds:string[],contextWindow,ruleIds:string[],decision,rationale,citationMessageIds:string[],status:"open"|"merged"|"approved"|"queued"|"stale"|"closed",mergedIntoId:null|string,revision}
  - DuplicateCandidate = {id,aReportId,bReportId,intersectionIds:string[],unionIds:string[],jaccardNumerator,jaccardDenominator,jaccardPercent,thresholdPercent,eligibility:"below"|"eligible"|"merged"|"declined",revision}
  - Note = {id,targetType:"report"|"message",targetId,actorId,text,logicalTime,state:"active"|"suspended"|"resolved"|"accepted"}
  - Decision = {reportId,value:"guidance"|"no-action"|"archive"|"needs-context",rationale,citationMessageIds:string[],actorId,logicalTime,revision}
  - QueuePacket = {id,reportId,reportRevision,approvalHash,enqueuedLogicalTime,status,attemptCount,nextEligibleLogicalTime:null|int,lastEventId}
  - TokenBucket = {capacity:2,tokens:0|1|2,lastRefillLogicalTime,refillEverySeconds:60}
  - Event = {id,logicalTime,actorId,operation,targetIds,beforeHash,afterHash,supersedesEventId:null|string}
  - HistoryAnchor = {throughLogicalTime,stateHash,previousAnchorHash}
  - Approval = {reportId,revision,stateHash,artifactHash,actorId,logicalTime,status:"current"|"stale"}
- Download lantern-regatta-discussion-casebook.zip with exactly nine entries:
  1. manifest.json — schema fictional-discussion-manifest/1.0
  2. discussion-casebook.json — schema fictional-discussion-casebook/1.0
  3. messages.csv — exact columns workspaceId,threadId,messageId,sequence,parentId,authorId,createdAt,status,text,textHash,referenceIds,reportIds,roleNames
  4. reports.csv — exact columns reportId,threadId,targetMessageIds,sourceReportIds,startSequence,endSequence,includedMessageIds,promotedRequiredIds,completeness,jaccardCandidateIds,ruleIds,decision,citationMessageIds,status,mergedIntoId,revision
  5. thread-context.graphml
  6. context-timeline.svg — standalone 1400x520 SVG
  7. review-packet.html — standalone semantic HTML with inline safe CSS only
  8. queue-events.ndjson
  9. decision-record.md
- UI, WebMCP handlers, persistence, JSON, CSV, GraphML, SVG, HTML, NDJSON, Markdown, validation, and re-export consume these records and the same pure derivations.
- State is entirely in-memory. NO localStorage or backend.
- Stack: React 19, Vite, Zustand, Tailwind CSS 4.3.2 (pinned), Framer Motion, and Zod.
- All libraries must be installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
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
Contract version: zto-webmcp-v1

Modules:
- fictional-context-v1
- artifact-transfer-v1

Module specs:
<module_spec id="fictional-context-v1">
{
  "id": "fictional-context-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Fictional Context Review",
  "purpose": "Thread context boundary review and local simulator tools.",
  "permitted_operations": [
    "get_casebook_session", "list_workspaces", "list_threads", "get_thread", "list_messages", "get_message",
    "list_reports", "get_report", "get_role_evidence", "get_duplicate_candidates", "get_queue", "get_history",
    "get_artifact_preview", "preview_context_window", "commit_context_window", "cancel_context_window",
    "set_selection", "set_filters", "set_viewport", "preview_report_merge", "commit_report_merge",
    "cancel_report_merge", "decline_duplicate", "set_decision", "append_note", "resolve_note",
    "selective_undo", "selective_redo", "fork_branch", "compare_branch", "choose_branch",
    "advance_logical_time", "preview_tombstone_rebase", "commit_tombstone_rebase", "approve_report",
    "preview_enqueue", "commit_enqueue", "cancel_enqueue", "preview_dispatch", "commit_dispatch",
    "cancel_dispatch", "pause_queue", "resume_queue", "refill_tokens"
  ],
  "binding_keys": {
    "required_any_of": [["context_operations"]],
    "optional": []
  },
  "restrictions": [
    "Mechanics exclusions: Real handle drag, hover, keyboard focus, early/settled motion, reduced motion, invalid return, confirmation/cancel, compact transformation, and browser downloads are explicit mechanics exclusions graded through real UI paths."
  ],
  "tool_name_prefix": "context"
}
</module_spec>

<module_spec id="artifact-transfer-v1">
{
  "id": "artifact-transfer-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Artifact transfer",
  "purpose": "Import, export, copy, print, and conversion workflows.",
  "permitted_operations": ["import", "export", "copy", "print_preview", "convert", "validate_import", "confirm_import", "export_casebook", "reset_casebook"],
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
- Context operations: get_casebook_session, list_workspaces, list_threads, get_thread, list_messages, get_message, list_reports, get_report, get_role_evidence, get_duplicate_candidates, get_queue, get_history, get_artifact_preview, preview_context_window, commit_context_window, cancel_context_window, set_selection, set_filters, set_viewport, preview_report_merge, commit_report_merge, cancel_report_merge, decline_duplicate, set_decision, append_note, resolve_note, selective_undo, selective_redo, fork_branch, compare_branch, choose_branch, advance_logical_time, preview_tombstone_rebase, commit_tombstone_rebase, approve_report, preview_enqueue, commit_enqueue, cancel_enqueue, preview_dispatch, commit_dispatch, cancel_dispatch, pause_queue, resume_queue, refill_tokens
- Artifact operations: validate_import, confirm_import, export_casebook, reset_casebook

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
</webmcp_action_contract>
