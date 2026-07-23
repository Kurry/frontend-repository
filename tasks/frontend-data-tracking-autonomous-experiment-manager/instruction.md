<summary>
Build Autonomous Experiment Manager, a framework-agnostic AI-assisted enterprise browser application that helps a research engineering lead define one objective metric, immutable constraints, a fixed per-run budget, and an incumbent; establish a valid baseline; review AI-proposed hypotheses and inspectable patch hunks; stream one deterministic experiment at a time; compare its measurement with the incumbent under a fixed policy; and atomically keep or revert the patch. The product interacts with an infrastructure dependency on port 4317.
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
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Goal, objective metric, target, constraints, and budget —
- Bootstrap presents seeded program.md, campaign goal, metric, direction, bounds, threshold, target, constraints, experiment/time budgets, and state
- Users edit only while no baseline or through a governed policy version after baseline
- Program editor validates length and required objective/constraint references; it is context, not executable instruction
- Constraint editor offers finite kinds and typed values
- Budget summary shows per-run, remaining total, max experiments, and stop conditions
- Invalid decimal/bounds, direction change after baseline, threshold exact bounds, max runs below completed count, conflicting immutable regions, empty program, budget oversubscription, and disconnected unsaved input are treated
- Completion requires a valid persisted campaign and versioned policy

Feature: Baseline establishment and incumbent validation —
- Run baseline streams task, reasoning, tool, checkpoint, samples, and terminal validation under the fixed budget
- The plot labels simulated time
- Valid baseline creates generation zero only after metric/constraint validation
- Invalid/missing/non-finite/out-of-bound sample leaves no incumbent
- Cancel stops later samples and creation
- Retry creates a new attempt; disconnect/resume keeps prefix and cursor
- Baseline content/hash and metric evidence remain visible and immutable
- Users inspect the inert target file, baseline trace, samples, aggregation, and evidence hash
- Duplicate request cannot create two baselines
- Completion requires exactly one current valid incumbent and matching lineage/header/plot/ledger/export state

Feature: Hypothesis and inspectable patch proposal —
- Propose experiment opens persisted chat and streams form_hypothesis then draft_patch
- Hypothesis card fills before patch, citing current incumbent/ledger evidence
- Patch structured object must bind base hash and validate constraints before canonical creation
- Unified/split diff shows every hunk, line counts, rationale, risk, and approval status
- Users may accept/reject/edit a hunk as inert text; edits recompute candidate hash and revalidate all hunks
- Any high-risk hunk enters server approval
- Malformed diff, overlapping hunks, immutable-region touch, max-line limit, empty/no-op patch, base mismatch, canceled proposal, denied hunk, stale assistant proposal, transient 429, and disconnect/resume have explicit outcomes
- Completion requires a valid approved candidate hash and persisted hypothesis linked to the current incumbent

Feature: Fixed-budget experiment execution and live evidence —
- Queueing creates one experiment and reserves budget
- Starting locks patch and budget
- The chamber streams deterministic phases, checkpoint events, metric samples, test-result/tool parts, and terminal status
- Pause persists checkpoint and stops simulated progress; resume uses the same attempt/cursor
- Cancel retains evidence and prevents decision/keep
- Crash scenario marks experiment crashed, exposes checkpoint integrity, and offers recover or retry; recover resumes same identity, retry records another attempt
- Progress is derived from consumed/budget, never local timer
- User can inspect samples, checkpoint, tool/result, and candidate content while running but not mutate policy/patch
- Duplicate sample/cursor, out-of-order event, concurrency start, total-budget boundary, background tab, disconnect, transient error, terminal error, and evaluator reset are handled
- Completion requires one terminal evidence hash and exact budget/sample/checkpoint/ledger agreement

Feature: Metric comparison and automatic keep/revert —
- After valid completion, the comparison panel shows incumbent/candidate value, direction, aggregation inputs, delta, improvement basis points, threshold, target progress, constraint/risk status, and automatic action with reason code
- Plot includes samples and threshold line
- Moving threshold creates a policy version and counterfactual historical labels; only unresolved current decision recomputes
- Keep/revert is automatic when no risk approval; the UI still shows a short countdown with cancel-to-review, then server transaction
- Needs approval shows evidence and a 10..1000 note
- Keep atomically changes lineage/header/current hash and ledger; revert preserves incumbent
- Double action, tie, exact threshold, zero baseline, invalid sample, policy changed during completion, approval accept/deny, cancel during countdown, stale incumbent, and disconnect are treated
- Completion requires one final decision, one or zero new incumbent as specified, and matching report/artifact preview

Feature: Risk approval, campaign control, history, import, and export —
- Campaign pause prevents new proposals/runs but preserves active checkpoint policy; resume is explicit
- Stop conditions (experiment count, total budget, target met, manual cancel) produce distinct terminal reasons
- Ledger is append-only, filterable, and links every entry to proposal/hunk/run/sample/decision
- Selecting an entry restores evidence without rewriting current state
- Import previews campaign identity, hashes, incumbents, experiments, decisions, and replacement impact, then commits atomically
- Final campaign report review lists goal/program, constraints, baseline, every hypothesis/patch/result/decision, incumbent lineage, failures, crash/recovery, budget, limitations, and artifact digests
- Approval is required only for risk decisions and final publication marker, not ordinary deterministic keep/revert
- Completion requires a coherent terminal or paused campaign and round-trip artifacts
</core_features>

<user_flows>
</user_flows>

<edge_cases>
</edge_cases>

<visual_design>
- Desktop is a “research conveyor”
- A 272-pixel left control rail contains goal, metric, target direction, constraints, budget, stop conditions, and program.md
- The center is a horizontal incumbent lineage above a single active experiment chamber: hypothesis, patch stack, timer/checkpoints, metric trace, and automatic decision gate flow left-to-right
- Completed experiment ledger runs vertically below with compact sparklines and keep/revert stamps
- A 380-pixel right evidence inspector shows selected hypothesis/hunk/sample/decision, baseline comparison, risk, tool trace, approval, and notes
- Top status distinguishes campaign, incumbent hash, active experiment, remaining budget, crash checkpoint, and server digest
- The signature direct manipulation is moving the governed improvement-threshold line over the paired baseline/candidate metric plot
- Pointer drag previews the new threshold; keyboard users focus the line and use arrows for 0.1 percentage point, Shift+Arrow for 1 point, Enter/Escape
- Use dark graphite and warm white with electric blue proposal, violet patch, cyan running, amber risk/approval, green keep/improvement, red revert/regression/error, and gray incumbent/unchanged
- Color has icon, label, plot marker, and line style equivalence
- Monospace is used for code diff, hashes, metric values, timestamps, and ledger; sans for explanation
- Spacing follows 4/8/12/16/24/32, plot and diff have strong focus boundaries, ledger rows ≥44 pixels, and elevation only for active chamber, drag threshold, sheets, and approvals
</visual_design>

<motion>
- Proposal parts fill the chamber in source order
- Starting a run locks the patch stack, advances a bounded progress sweep across fixed checkpoints, and adds metric samples without changing plot domain
- A keep decision moves the candidate hash into the incumbent node; revert returns the gate to the incumbent with a visible retained hash
- Reduced motion snaps and shows textual step changes with a persistent “incumbent changed/unchanged” summary
- Simulated time is labeled and must not imply real elapsed compute
</motion>

<responsiveness>
</responsiveness>

<accessibility>
</accessibility>

<performance>
</performance>

<writing>
</writing>

<innovation>
</innovation>

<requirements>
- Responsive transformations:
  - At ≥1280 pixels, control rail, conveyor/ledger, and inspector coexist
  - At 768–1279 pixels, control rail becomes a top campaign sheet, inspector a resizable bottom drawer, and lineage/active chamber remain primary
  - Below 768 pixels, the loop becomes Goal, Incumbent, Proposal, Run, Decision, Ledger
  - The metric threshold uses a numeric stepper plus a full-width plot; patch hunks are stacked cards; lineage becomes a previous/current/next trail. There is no squeezed desktop conveyor
  - Active hunk/sample/experiment, unsaved policy input, trace cursor, scroll, and pending approval survive breakpoint change
  - Touch targets are ≥44 pixels
- The app must interact with a deterministic infrastructure fixture server at http://127.0.0.1:4317/profiles/autonomous-experiment-manager
- Tools: validate_research_campaign, run_baseline, form_hypothesis, draft_patch, execute_fixed_budget_experiment, compare_experiment_metric, validate_keep_revert, and approval-gated approve_risky_patch/publish_research_campaign
- Downloads form autonomous-experiment-campaign/v1:
  - program.md: exact approved program text plus generated YAML comment block
  - results.tsv: UTF-8 tab-separated header
  - experiment-ledger.json: schema autonomous-experiment-ledger/v1
  - patches/experiment-<sequence>.patch: inert unified diff
  - research-report.md: report content
- Export → import → export preserves logical state/order/selection geometry/decisions except timestamps and derived byte checksums
- Do not use CDNs or external network requests; all assets and libraries must be loaded from local npm dependencies.
- Use Tailwind CSS 4.3.2.
- No standalone e2e work is required.
</requirements>

<integrity>
Any bypass of the required interaction logic or state model is a failure. Do not
hardcode metric values, outcomes, or transitions. The application must genuinely
parse, display, and respond to the provided tool and network conditions.
</integrity>

<delivery>
The solution must be a frontend-only application served from `solution/app`.
It must not require a custom backend or external database. All required data
should be managed locally or fetched via the specified deterministic endpoint.
</delivery>

<webmcp_action_contract>
# [Mechanics exclusions]
# mechanics_exclusions = ["unsupported_mechanic"]
</webmcp_action_contract>
