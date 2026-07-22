# Task proposal: Release Impact Reconciliation Board

**Proposed slug:** `frontend-workflow-release-impact-reconciliation-board`
**Genre:** `good-app`
**Target users:** Product operations leads and frontend platform teams reviewing how shipped changes affect user-facing surfaces

## Whole job

Reconcile changes from consecutive product release notes into an impact graph and rollout timeline, then export an auditable release-impact pack that preserves every mapping, duplicate merge, risk decision, and recovery action.

Release notes are chronological prose, while rollout decisions are relational: one change may affect several surfaces, duplicate an earlier note, invalidate a saved workflow, or require a guarded rollout. Teams need a browser-native way to map those consequences and prove that the map, timeline, summaries, automation contract, and exported review pack all describe the same decisions.

### Source inspiration

- https://github.com/harbor-framework/harbor/releases
- https://github.com/anthropics/claude-code/releases
- https://linear.app/changelog
- https://github.blog/changelog/label/projects-and-issues/
- https://help.figma.com/hc/en-us/articles/40219873508247-Release-notes-roundup-May-2026
- https://2025.stateofjs.com/en-US/libraries/

### Why this belongs in the corpus

- The source products contribute concrete patterns rather than branding: Harbor contributes job/file navigation and explicit failure surfaces; Claude Code contributes transcript/resume health; Linear and GitHub contribute filtered views, duplicate lineage, typed fields, and release provenance; Figma contributes linked variable/state previews.
- State of JavaScript 2025 is used only to keep the proposed environment and verifier assumptions mainstream (browser-native UI, common build tooling, and Playwright-style testing); framework choice is deliberately not graded.
- The canonical operation is not editing a release-note row. The user maps one change to an affected product surface and rollout stage, causing an edge, timeline block, risk summary, saved view, WebMCP state, and export payload to change atomically.
- The verifier directly targets prior Sonnet 5 overclaims: visible validation, list/detail coherence, delete-to-empty behavior, exact hover evidence, compound-filter recomputation, console cleanliness, and UI/tool/artifact parity.

## Frontier-model loss evidence

**Job roots:** /Users/kurrytran/frontend-repository/jobs/2026-07-18__19-39-42, /Users/kurrytran/frontend-repository/jobs/2026-07-19__01-18-07, /Users/kurrytran/frontend-repository/jobs/trial-codex-sol-xhigh-max-50-concurrent

**Model/run roles**

- anthropic/claude-sonnet-5 frontend builder: daily-planner-board 0.8773, trip-itinerary 0.8468, expense-breakdown-reports 0.8358
- openai/gpt-5.6-sol frontend builder: 103 completed trials, 101 capability-eligible

**Comparability limits:** The three Sonnet runs are healthy frontend-builder examples but cover only four rubric dimensions and are not a sweep comparable to the 103-run GPT matrix. They establish concrete observable misses, not a Sonnet-wide failure rate. Claude Code and Harbor release notes are tooling/product sources and are not scored capability evidence.

**Strong-model baseline:** The comparable GPT-5.6-sol slice contains 101 capability-eligible trials after two preseeded-completion integrity floors; mean 0.7526, median 0.7752, p10 0.6334, p90 0.8441.

**Selected loss cluster:** A plausible, polished primary surface passes shallow smoke tests while validation feedback, linked-state propagation, delete-to-empty transitions, compound derived views, exact hover evidence, console health, WebMCP parity, or the exported artifact remains incomplete.

**Frequency:** Across healthy GPT trials, handlers_match_visible_ui_logic failed explicitly in 25, contract_is_automation_exercisable in 22, artifact_export_import_copy_bound in 17, and shared_state_coherence variants in 16.

**Failed-criterion evidence**

- Sonnet daily-planner-board (0.8773): empty-title submission correctly added no task, but produced no visible validation message; a specified task card also lacked hover feedback.
- Sonnet trip-itinerary (0.8468): selecting Wednesday changed the active day while detail remained on Thursday; deleting every stop left three visible stops instead of an empty plan; the required title was neither exact nor editable.
- Sonnet expense-breakdown-reports (0.8358): the agent claimed amount/percentage doughnut tooltips, zero console errors, reactive category plus income/expense filters, and empty states, but the verifier could not confirm tooltips, observed a favicon 404, and could not complete the compound recomputation/no-match flow.

**Trajectory evidence**

- Daily planner final claim: the agent said it verified empty-title validation and that one Pinia store drove board/calendar state. The verifier observed blocking without feedback, demonstrating that mutation prevention alone is not a complete validation experience.
- Trip itinerary final claim: the agent reported all 15 WebMCP tools and create/edit/delete/reorder/full-delete flows worked through the same store. The verifier observed selected-day/detail divergence and no delete-to-empty transition.
- Expense report final claim: the agent wrote 'All checks pass', 'The empty state renders perfectly', and 'zero console errors', then listed tooltips and compound filters as verified. The verifier found the exact opposite on those named checks, exposing shallow test coverage rather than missing implementation volume.

**Confounds ruled out**

- All three Sonnet examples completed, served, and received nonzero passing rewards; none is an API-rate-limit or missing-artifact run.
- The failure claims cite exercised positive criteria, not blocked criteria or implementation-only requirements; Zustand verification is excluded from the proposed capability mechanism because browser observers cannot reliably prove a library choice.
- Claude Code v2.1.217 transcript/MCP/session fixes and Harbor v0.20.0 upload/error handling are retained as pilot-health guardrails, not attributed to Sonnet model capability.
- State of JavaScript library usage/sentiment is ecosystem context, not capability evidence and not a requirement to use React, Vite, Next.js, or any named library.
- The two GPT totals below 0.35 were preseeded-completion integrity floors and are used only to require a clean initial state.

**High-scoring counterexample:** The same Sonnet runs scored 0.8358-0.8773 and completed most primary flows, while high GPT examples solve linked-state tasks under the same browser harness. This shows the proposed job is feasible and isolates completion discipline rather than raw coding endurance.

## Sub-0.35 score-floor audit

| Model / role | Task | Reward | Classification | Capability evidence |
|---|---|---:|---|---|
| openai/gpt-5.6-sol / frontend builder | tasks/frontend-data-tracking-calibration-matrix | 0.0000 | integrity-floor | no |
| openai/gpt-5.6-sol / frontend builder | tasks/frontend-workflow-ab-experiments | 0.0000 | integrity-floor | no |
| anthropic/claude-sonnet-5 / frontend builder | tasks/frontend-css-theme-builder | 0.0000 | experiment-fidelity | no |
| anthropic/claude-sonnet-5 / frontend builder | tasks/frontend-travel-itinerary-planner | 0.0000 | experiment-fidelity | no |

### Per-run attribution

- **tasks/frontend-data-tracking-calibration-matrix primary cause:** preseeded_completion: the initial UI already presented credited completed work
- **Evidence:** `/Users/kurrytran/frontend-repository/jobs/trial-codex-sol-xhigh-max-50-concurrent/frontend-data-tracking-calibrati__fmM4Qua/result.json`
- **Paired rerun:** No same-task healthy rerun in the inspected root; excluded from capability attribution.

- **tasks/frontend-workflow-ab-experiments primary cause:** preseeded_completion: experiments were already completed at initial load
- **Evidence:** `/Users/kurrytran/frontend-repository/jobs/trial-codex-sol-xhigh-max-50-concurrent/frontend-workflow-ab-experiments__NwVcUrN/result.json`
- **Paired rerun:** No same-task healthy rerun in the inspected root; excluded from capability attribution.

- **tasks/frontend-css-theme-builder primary cause:** ApiRateLimitError rather than an attempted frontend build
- **Evidence:** `/Users/kurrytran/frontend-repository/jobs`
- **Paired rerun:** Same-task healthy rerun scored 0.8800 and supersedes the zero for capability attribution.

- **tasks/frontend-travel-itinerary-planner primary cause:** ApiRateLimitError rather than an attempted frontend build
- **Evidence:** `/Users/kurrytran/frontend-repository/jobs`
- **Paired rerun:** Same-task healthy rerun scored 0.8693 and supersedes the zero for capability attribution.


**Attribution conclusion:** Zero capability-eligible runs fall below 0.35. Difficulty is derived from explicit exercised failures in healthy 0.8358-0.8773 Sonnet runs and recurrent healthy GPT criteria, not from excluded score floors.

**Capability-eligible audited runs:** 0

**Selected loss uses excluded runs:** no

**Proposal guardrails derived from excluded score floors**

- Initial release entries are illustrative but contain no completed impact mappings, resolved duplicates, approved rollout, or exported review pack.
- Provider, transcript, resume, upload, or verifier failures are quarantined and retried before interpreting a pilot score.

## Feature groups

### Release-note intake and duplicate lineage

**Outcome:** Import two deterministic release snapshots, edit normalized entries, and merge a duplicate into its canonical change while preserving source lineage.

**Interactions**

- Drag one entry onto another to propose a duplicate merge, then confirm or reject the lineage decision
- Create, edit, archive, restore, and filter entries by product, release, type, and rollout state

**Visible states:** unreviewed, normalized, duplicate_candidate, merged, archived, invalid

**Boundaries and recovery**

- Titles are 1..160 characters; submitting 0 or 161 characters displays an inline and announced error and performs no partial mutation
- A duplicate merge cannot target itself or form a lineage cycle; rejection leaves both entries and all current filters unchanged

**Shared-state/artifact effect:** Mutates entries[], duplicateMergeLog[], sourceReleaseId, canonicalEntryId, and status fields in release-impact-pack-v1.json.

### Impact graph and rollout replay

**Outcome:** Map a release entry to one or more affected product surfaces and rollout stages, then replay how the decision changes risk and readiness.

**Interactions**

- Drag an unmapped release entry onto an affected surface node and then into planned, canary, paused, shipped, or rolled_back timeline lanes
- Use the keyboard mapping palette to perform the identical surface/stage mutation, undo it, and redo it

**Visible states:** unmapped, planned, canary, paused, shipped, rolled_back, conflicted

**Boundaries and recovery**

- A canary percentage must be integer 1..99; 0 and 100 are rejected with visible field feedback while planned and shipped use explicit stage transitions
- Deleting the final impact link produces a genuine empty graph, zeroed risk summary, empty saved-view result, and no stale detail selection

**Shared-state/artifact effect:** The canonical mutation updates impactLinks[], graph geometry, rolloutEvents[], selectedEntryId, riskSummary, savedView counts, and change history atomically.

### Review views and interoperable impact pack

**Outcome:** Use compound filters, hover evidence, and saved views to review risk, then export and restore the exact session decisions.

**Interactions**

- Combine product, change type, rollout stage, and risk filters; hover a risk segment to inspect exact count and percentage; save the filtered view
- Export JSON plus CHANGELOG.md, clear the session, import JSON, and verify graph, timeline, duplicate lineage, saved views, and summaries

**Visible states:** unfiltered, filtered, no_match, saved, exported, validated, restored

**Boundaries and recovery**

- A compound filter with no matches renders a named no-match state and zero values without retaining the previous graph/detail selection
- Malformed schemaVersion, duplicate IDs, unknown surface references, lineage cycles, or invalid percentages report per-field errors and make no state change

**Shared-state/artifact effect:** Produces release-impact-pack-v1.json and CHANGELOG.md from current session state; imported JSON reconstructs authored ordering, graph positions, links, stages, saved views, and history.

## Data and artifact contract

**Record shape:** ReleaseImpactPack { schemaVersion, generatedAt, releases[], entries[], surfaces[], impactLinks[], rolloutEvents[], duplicateMergeLog[], savedViews[], riskSummary, history[] }. Entry is the would-be API request body with id, releaseId, title, body, changeType, sourceUrl, status, canonicalEntryId, and tags.

**Validation rules**

- schemaVersion equals release-impact-pack-v1; generatedAt and release dates are RFC3339; ids are unique non-empty strings
- entry.title is 1..160 characters; changeType is feature|improvement|fix|security|breaking|deprecated; status is unreviewed|normalized|duplicate_candidate|merged|archived|invalid
- impact links reference existing entry and surface IDs; rollout stage is planned|canary|paused|shipped|rolled_back; canaryPercent is required and 1..99 only for canary
- duplicate canonicalEntryId references an existing non-self entry and the directed duplicate lineage must remain acyclic
- riskSummary counts and percentages are derived from current filtered canonical entries and must total the visible population

**Persistence:** In-memory only. No localStorage, sessionStorage, authentication, network requests, or external product APIs.

**Import/export:** JSON import/export uses the same ReleaseImpactPack schema. Export regenerates generatedAt. CHANGELOG.md groups canonical entries by release and change type and includes rollout/risk annotations but excludes archived duplicates. Invalid import is a no-op with per-field diagnostics.

**Useful end artifact:** Auditable release-impact review pack

**Interoperable format:** release-impact-pack-v1.json plus generated CHANGELOG.md

**Round trip:** Export, clear, import, and re-export preserves entries, duplicate lineage, impact links, graph positions, rollout stages, saved filter definitions, and history; only generatedAt may differ.

## Experience direction

**20-second demo:** In 20 seconds, the user drags one release change onto an affected surface and into the canary lane, watches the dependency graph, rollout timeline, saved-view count, and risk doughnut update, then exports the review pack.

- **Signature interaction:** Map one release entry to an affected surface and rollout stage by direct manipulation, producing one atomic canonical mutation.
- **Alternate input parity:** A keyboard mapping palette selects entry, surface, and stage and produces byte-equivalent domain state; Ctrl/Cmd+Z and Shift+Ctrl/Cmd+Z undo/redo the same mutation.
- **Linked views:** Release feed, impact graph, rollout timeline, risk summary, saved filtered views, WebMCP query, and exported artifact all derive from one canonical state.
- **Visual thesis:** A release-control room combining Linear-like information density, GitHub-like provenance, Harbor-like artifact inspection, and Figma-like linked state previews without copying product chrome.
- **Layout:** Desktop uses a tri-pane release feed, central graph/timeline switcher, and persistent evidence inspector; the risk/saved-view strip stays visible above the work surface.
- **Motion:** Creating or moving an impact link animates spatial continuity from feed to graph to timeline; risk segments interpolate from old to new values. Reduced motion removes travel/interpolation and uses immediate highlight plus announced text.
- **Responsive behavior:** Below 720px the tri-pane canvas becomes a three-step Feed → Map → Review flow with a bottom action tray; graph connections become an ordered impact list rather than a horizontally scrolling desktop canvas.
- **Accessibility:** Semantic lists, graph-node buttons, labels, live validation/risk updates, visible focus, keyboard mapping, focus-trapped dialogs with return, non-color status tokens, and reduced-motion behavior.
- **Performance:** Interactions remain responsive with 300 entries, 60 surfaces, 600 impact links, and 20 saved views; derived summaries recompute only from current canonical state.

### Frontend-native gate

- **Canonical mutation:** Map one selected release entry to an affected surface and rollout stage, atomically changing the impact edge, graph placement, timeline lane, risk summary, saved-view result, WebMCP state, and export payload.
- **Artifact-preserved state:** impactLinks[].entryId/surfaceId, impactLinks[].graphPosition, rolloutEvents[].stage/canaryPercent, riskSummary, savedViews[].resultEntryIds, history[]
- **CRUD substitution test:** Forms and tables cannot satisfy graph edge creation, cross-surface spatial continuity, stage replay, exact keyboard equivalence, delete-to-empty propagation, compound risk recomputation, or preservation of authored graph/timeline state in the artifact.
- **Dedicated criteria:** signature_interaction=AC-01, alternate_input=AC-08, linked_views=AC-11, causal_motion=AC-03, mobile_transformation=AC-07, artifact_round_trip=AC-13

## Browser-observable acceptance contract

| ID | Dimension | Criterion | User action | Required evidence |
|---|---|---|---|---|
| AC-01 | core_features | impact_mapping_atomic_mutation | Drag one seeded unmapped entry onto Surface A and then the canary lane at 20%. | Exactly one impact edge appears; graph and detail select Surface A; timeline shows canary 20%; risk and saved-view counts recompute; WebMCP query and export expose the same entry/surface/stage. |
| AC-02 | visual_design | release_control_room_hierarchy | Inspect the feed, graph/timeline, risk strip, and evidence inspector with seeded releases. | Change type, rollout state, selection, duplicates, risks, and primary actions are distinguishable without relying on color alone. |
| AC-03 | motion | mapping_motion_and_reduced_motion | Perform AC-01 normally and again with prefers-reduced-motion enabled. | Normal mode shows early and settled spatial continuity plus risk interpolation; reduced mode removes travel while preserving immediate highlight and announced result. |
| AC-04 | technical | ui_webmcp_console_parity | Interleave one UI mapping, one declared WebMCP stage change, undo from UI, and export while observing console and network errors. | Visible state, tool-readable state, history, and artifact agree after every step; there are no console/page errors or phantom tool acknowledgements. |
| AC-05 | user_flows | intake_to_review_flow | Normalize an entry, merge a duplicate, map impact, pause and resume rollout, save a filtered view, and export. | Each transition has visible feedback, remains reversible where specified, and contributes to the final review pack. |
| AC-06 | edge_cases | validation_empty_and_filter_boundaries | Submit empty and 161-character titles, canary 0/1/99/100, a duplicate cycle, delete the final link, and apply a no-match compound filter. | Only 1 and 99 are accepted canary bounds; invalid actions show inline/live errors with no partial mutation; final deletion and no-match filters clear graph/detail/summaries instead of retaining stale state. |
| AC-07 | responsiveness | mobile_mapping_step_flow | Repeat AC-01 at 390×844 using Feed → Map → Review and touch-sized controls. | The interaction becomes an ordered step flow with no horizontal canvas overflow; all mutation fields and linked consequences remain reachable. |
| AC-08 | accessibility | keyboard_mapping_equivalence | Use keyboard only to map the same entry/surface/stage as AC-01, inspect focus/live feedback, undo, and redo. | The resulting domain fields match pointer state exactly; dialogs trap and return focus; validation and mapping results are announced. |
| AC-09 | performance | large_release_set_responsiveness | Filter, map, undo, and hover risk segments with 300 entries and 600 links. | The active interaction remains responsive, layout stays stable, and summaries do not visibly lag or show the previous mutation. |
| AC-10 | writing | release_decision_copy | Inspect statuses, validation, duplicate explanations, no-match state, tooltip text, and export confirmations. | Copy names what changed, why an action failed, and how to recover; risk tooltip includes exact count and percentage. |
| AC-11 | innovation | linked_release_views | Perform AC-01, then combine product + change type + stage + risk filters and hover the changed risk segment. | Feed membership, graph edges, timeline blocks, exact tooltip count/percentage, saved-view result, and detail selection all reflect the same mutation immediately. |
| AC-12 | design_fidelity | source_pattern_fidelity | Compare the completed workbench with the stated release-source patterns. | The app coherently adapts keyboard navigation, artifact inspection, duplicate provenance, filtered views, and linked previews while retaining an original visual identity. |
| AC-13 | behavioral | release_impact_round_trip | Complete AC-01, merge a duplicate, save a compound view, move graph positions, export JSON/Markdown, clear, import JSON, and re-export. | Entry/order/geometry/link/stage/risk/view/history fields reconstruct exactly; CHANGELOG.md reflects canonical current work; invalid import changes nothing; only generatedAt may differ. |

## Verification approach

**Setup**

- Seed two immutable release snapshots containing 12 entries, including one duplicate candidate and three unmapped changes; no entry is mapped, merged, approved, or exported at load.
- Use a deterministic clock and fixture IDs so counts, percentages, history order, and generated artifacts can be asserted exactly.

**Observable checks**

- Exercise drag, keyboard mapping, hover, filters, focus, reduced motion, and mobile transformation through real UI controls.
- Immediately around each mutation compare visible feed/graph/timeline/detail/risk state, WebMCP query results, history, and parsed downloads.
- Capture console/page errors throughout and verify exact tooltip text while actually hovering the rendered segment.

**Adversarial/negative cases**

- No visible validation despite blocked mutation, stale detail after selection, stale graph after delete-all, tooltip without exact evidence, incomplete compound-filter recomputation, console errors, and no-match views retaining old values all fail.
- A WebMCP handler that acknowledges success without changing the same visible state, or an export one mutation behind, fails the critical contract.

**Deterministic checks**

- Assert exact title and canary boundaries, acyclic duplicate lineage, current filtered population totals, generatedAt regeneration, JSON schema, Markdown grouping, and export-clear-import equivalence.

### WebMCP authoring plan

**Feature bindings**

- Release-note intake and duplicate lineage -> entry CRUD/query plus duplicate propose/confirm/reject operations with cycle validation.
- Impact graph and rollout replay -> impact-link create/move/delete, rollout-stage transition, selection, undo/redo, and state query operations.
- Review views and interoperable impact pack -> compound filter/saved-view, artifact export/import, schema diagnostics, and summary query operations.

**Mechanics exclusions**

- WebMCP may seed and query state but cannot substitute for graded drag geometry, hover tooltip evidence, keyboard focus, causal animation, or mobile step-flow mechanics.

## Scope boundary

**In scope**

- Two local release snapshots, release-entry CRUD, duplicate lineage, impact mapping, rollout stages, graph/timeline linked views, compound filters, saved views, undo/redo, WebMCP, JSON/Markdown export, and JSON import.

**Out of scope**

- Live GitHub/Linear/Harbor/Claude/Figma APIs, authentication, team collaboration, notifications, AI-generated summaries, deployment control, and backend persistence.

## Solvability and difficulty

**Reference-solution argument:** A frontend-only reducer with normalized entities, pure graph/rollout transitions, derived selectors, SVG/HTML graph rendering, deterministic fixtures, schema validation, and browser file APIs can implement the full job.

**Dependencies**

- Standard browser pointer/keyboard/file APIs and CSS/SVG; no network, proprietary assets, unusual codecs, or paid libraries.

**Risks and bounded mitigations**

- Dense graph motion can become flaky; constrain fixture geometry and grade early/settled states rather than pixel-perfect intermediate frames.
- Duplicate and rollout rules can become ambiguous; retain the exact enums, bounds, acyclic rule, and deterministic fixtures above.

**Core challenge:** Maintain one canonical mapping across direct manipulation, keyboard input, linked graph/timeline/detail/summary views, compound filters, undo/redo, WebMCP handlers, and two interoperable exports while making invalid and empty states visibly complete.

**Why a shallow build fails:** A polished release-note table will fail the graph mutation, exact hover proof, delete-to-empty propagation, compound recomputation, tool parity, mobile transformation, and round-trip criteria.

**Budget/stop condition:** Three feature groups, two small fixture releases, at most 300 stress-test entries, one JSON schema, one generated Markdown format, and one canonical mutation.

## Frontier pilot calibration

- **Discrimination hypothesis:** Sonnet 5 can likely build the attractive feed/graph shell and primary mapping flow, but may again declare completion after shallow tests while leaving visible validation, selection/detail propagation, delete-to-empty, exact hover evidence, compound summaries, tool handlers, or export state incomplete.
- **Expected failure signature:** The mapping appears in one surface but the detail, risk tooltip, saved view, WebMCP result, or JSON retains the previous value; invalid input blocks silently; or delete-all leaves stale content.
- **Shallow shortcut rejected:** The verifier interleaves pointer and keyboard mappings, filters, hover, delete-all, undo, WebMCP, export, clear, import, and console observation rather than testing isolated happy paths.
- **Reference gate:** The oracle must pass all 13 criteria, exact schema/Markdown checks, clean-start anticheat, zero console/page errors, reduced-motion and mobile mechanics, invalid-import no-op, and UI/tool/artifact parity.
- **Strong-model pilot:** Run three independent healthy Claude Sonnet 5 and three GPT-5.6-sol xhigh frontend-builder trials on the identical certified revision; separately record provider/tooling failures and rerun them.
- **Keep/rework rules:** Keep if the oracle passes and failures concentrate in the named completion-discipline contract. Deepen if both models pass it cleanly. Rework if failures arise from ambiguous graph mechanics, blocked judging, Claude Code/Harbor runtime defects, or packaging.

## Duplicate check

- **Task corpus checked:** Current tasks/, quarantined inventory, and all repository issue titles through 2026-07-22.
- **Issues checked:** Open and closed GitHub issues searched for release regression, release impact, dependency, changelog, and reconciliation concepts before drafting.
- **Closest existing work:** frontend-data-tracking-release-diff, Release Note Assembly Line proposal, Harbor trial viewer and trajectory-analysis tasks
- **Material distinction:** Release Diff compares textual releases, Release Note Assembly produces editorial notes, and Harbor viewers inspect trial artifacts. This task authors cross-product impact edges, duplicate lineage, rollout stage replay, exact risk/filter summaries, and a round-trippable decision pack.
