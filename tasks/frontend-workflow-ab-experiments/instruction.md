<summary>
Build an A/B experimentation studio for a prompt-engineering platform using React, Zustand, Tailwind CSS 4.3.2, IBM Carbon Design System, and Recharts. The app PRODUCES the operator's experiment report: a downloadable and copyable Experiment Report JSON document compiled live from the selected experiment's design, sample counts, statistics (excluding flagged outliers), and decision, conforming to the same API-shaped field contracts as the designer, criterion, and decision forms, with Import that round-trips a contract-valid report.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Experiment library —
- On first load the library lists the seeded experiments in a data table with columns: name, variants (the variant titles), sample size, status badge, started timestamp, and actions; at least 3 seeded experiments are completed and at least 2 are pending
- Status filter controls above the table narrow the visible rows to a chosen status (pending, running, paused, completed, decided, archived); each active filter appears as a removable indicator and the visible row count updates immediately when a filter is added or removed
- Typing in the library search field narrows the visible rows incrementally to experiments whose names match; clearing the field restores the previously filtered set exactly
- Selecting the checkbox on two or more rows reveals a bulk action bar showing the selected count with Archive selected and Delete selected actions; confirming a bulk archive moves every selected experiment to the archived status in one action, and confirming a bulk delete removes exactly the selected rows
- An Archived toggle reveals archived experiments; an archived experiment can be unarchived from its row actions and returns to its prior status
- When the active filters and search match no experiments, the table region shows an empty state with a message and a Clear filters control that restores the full list

Feature: Experiment designer (API-shaped ExperimentUpsert) —
- Clicking New Experiment opens a modal whose submitted record IS the would-be experiment-create API request body and must conform to the ExperimentUpsert field contract below; Edit on a pending experiment submits the same shape as an update
- ExperimentUpsert field contract (all keys required unless marked optional; example values illustrative only; enforced with inline errors naming the offending field before submit, and with Submit disabled until every field is valid):
  - name: required string after trim, 1 to 120 characters (library rows truncate display with an ellipsis when longer than 60 characters; the full name remains visible in the results panel header)
  - hypothesis: required string after trim, 1 to 2000 characters
  - successMetric: required string naming one existing scoring criterion (seeded or user-added)
  - minimumSampleSize: required integer from 1 through 500 inclusive
  - variants: required array of 2 to 4 objects in order A then B then optional C then optional D; each object requires title (string after trim, 1 to 40 characters), promptId (non-empty string naming one of the seeded prompts), model (closed enum string, exactly one of Larkspur-2, Cobalt-Mini, Meridian-XL, Fernwave-1), temperature (number from 0 through 2 inclusive), and trafficAllocation (number from 0 through 100 inclusive)
  - Cross-field rules: variants length is never fewer than 2 or more than 4; the sum of every variant trafficAllocation equals exactly 100; successMetric must equal a criterion name present in the criteria collection; each promptId must equal a seeded prompt id
- An Add variant control appends variants C and then D, and a remove control on variants C and D deletes that variant; removing a variant never auto-redistributes allocations
- Each variant has a traffic allocation slider; a live validation indicator shows the current sum, turning to an error treatment with a message naming the allocation rule whenever the sum is not 100
- Adjusting one allocation slider updates the displayed total immediately without submitting the form
- Submitting a valid designer form closes the modal, adds exactly one new experiment to the library with a Pending status badge, and increases the visible experiment count by one; the created record matches the ExperimentUpsert payload
- Submitting with an empty name or hypothesis, a model outside the closed enum, a temperature outside 0 to 2, a minimumSampleSize outside 1 to 500, or allocations not summing to 100 shows an inline validation message naming the offending field or rule and adds no experiment
- Choosing a pending experiment's Edit action reopens the designer prefilled with its ExperimentUpsert fields; saving updates the library row without a reload

Feature: Scoring criteria configuration (API-shaped CriterionUpsert) —
- A Criteria view lists the seeded scoring criteria (at least 4, such as factual accuracy, tone, completeness, formatting), each with a name, a description, and a pass threshold value
- A New Criterion form submits a record that IS the would-be criterion-create API request body and must conform to this CriterionUpsert field contract (all keys required; example values illustrative only): name (required string after trim, 1 to 60 characters, unique among criteria case-insensitively), description (required string after trim, 1 to 400 characters), passThreshold (required integer from 0 through 100 inclusive)
- Inline validation names any missing, duplicate, or out-of-range field and an invalid submit adds nothing
- A newly added criterion immediately appears as a choice in the designer's successMetric select without a reload

Feature: Variant preview playground —
- A Preview control inside the designer opens a playground that renders one synchronized column per configured variant (2 to 4 columns); a single shared prompt-input row sits above the columns
- Activating Preview run fills every column with a simulated response for its variant simultaneously; each column shows its variant title, model name, and a latency and token readout, and the responses differ between columns whose configurations differ
- Editing the shared input and running again replaces every column's response; the columns never show responses from different preview runs at the same time

Feature: Run execution —
- Clicking Run on a pending experiment starts a simulated evaluation: every variant executes against the same seeded input set, and a per-variant progress bar fills as that variant's samples complete, with a numeric progress fraction (for example 23 of 50 samples) beside each bar
- While running, the experiment row shows an inline loading indicator and the run's overall progress fraction; the status badge reads Running
- A running experiment can be paused and resumed: pausing freezes every variant's sample count at its current value and the status badge reads Paused; resuming continues from exactly those counts, and samples collected before the pause are never recollected or changed
- Each run has an event timeline: an ordered log of run transitions (started, sample milestones, paused, resumed, completed) with timestamps, filterable by entry type; the timeline gains entries live as the run progresses
- When every variant reaches the sample target the status badge changes to Completed and the results panel for that experiment populates

Feature: Results and significance —
- Clicking a completed experiment opens a results panel with a grouped bar chart comparing every variant's mean score on each scoring criterion; criteria are on the x-axis and each variant renders as its own consistently colored series
- A distribution strip shows a per-variant score distribution (a histogram or equivalent per variant); variants configured with different prompts or models show visibly different distributions — two differently configured variants never render identical distributions
- A difference chart plots the score delta between the leading variant and the baseline with a shaded 95 percent confidence band around the delta line
- A summary strip below the charts shows four labeled stat cells: winner badge (a variant letter or Tie), win rate percentage, p-value, and the 95 percent confidence interval for the score delta — all computed from the current sample scores
- The significance indicator only activates once every variant has reached the experiment's minimum sample size: below the threshold the summary shows an explicit Underpowered state naming the remaining sample count still needed, and no significant/not-significant verdict is displayed; at or past the threshold, a p-value below 0.05 renders the winner badge in the success treatment and a p-value of 0.05 or above renders it in the warning treatment labeled Not significant
- A sample-level table lists each input with every variant's score for it, sortable by score delta; clicking the delta header a second time reverses the order

Feature: Sequential monitoring —
- A Monitoring tab in the results panel plots each variant's cumulative mean score against samples collected, so the lines visibly converge or separate as the sample count grows along the x-axis
- The monitoring chart marks the minimum-sample-size threshold with a reference line; hovering a point with the real pointer shows a tooltip with the variant, sample count, and cumulative mean

Feature: Comparison matrix —
- A Matrix tab shows a side-by-side table with one column per variant and rows for mean score, mean latency, mean tokens per sample, token efficiency (score per hundred tokens), and win rate; each metric cell shows its value and the best variant's cell in each row carries a highlight treatment
- The values in the matrix agree with the same quantities shown in the summary strip and sample table

Feature: Radial criterion analytics —
- An Analytics tab renders a radial pass/fail wheel per scoring criterion: each criterion's ring fills proportionally to its pass rate (samples meeting that criterion's pass threshold) with the numeric percentage in the center
- Flagging or unflagging outliers (below) visibly changes any affected criterion's ring fill and percentage

Feature: Response inspector and outlier flags —
- An Inspector tab lists every simulated response for a chosen variant with its input, response text, per-criterion scores, latency, and tokens; a variant switcher flips the list between variants without a reload
- A Flag outlier control on each response marks it as an outlier with a visible flag treatment; flagged responses are excluded from every statistic, and flagging one immediately recomputes the summary strip, charts, matrix, and radial wheels with a visible change
- Unflagging a response restores it to the statistics and the derived surfaces recompute again
- A flagged-only filter narrows the inspector list to flagged responses; an empty flagged list shows an empty state message

Feature: Decision workflow (API-shaped DecisionUpsert) —
- A Decide control on a completed experiment opens a decision dialog whose submitted record IS the would-be decision API request body and must conform to this DecisionUpsert field contract (all keys required unless marked optional; example values illustrative only): choice (required closed enum string, exactly one of declare-winner, inconclusive, stop-early), winnerVariant (required when choice is declare-winner: closed enum string naming one of the experiment's variant letters such as A, B, C, or D; omitted or null when choice is inconclusive or stop-early), rationale (required string after trim, 1 to 1000 characters)
- Cross-field rules: when choice is declare-winner, winnerVariant must name a variant present on that experiment; when choice is inconclusive or stop-early, winnerVariant must be null or omitted; Submit stays disabled until every required field is valid
- Confirming a decision sets the experiment status to Decided, shows the decision and rationale in the results panel header, and locks the experiment: its Edit action and Flag outlier controls become disabled, with a visible locked indicator explaining why
- Declaring a winner offers a Promote winner confirmation dialog; confirming records the winning variant's prompt as the new head version in the prompt library panel and shows a success toast naming the variant

Feature: Undo and redo —
- Undo and Redo controls in the header revert and reapply the most recent state edits — designer saves, outlier flag changes, archives, and deletions; each undo visibly restores the prior state in every affected surface, and redo reapplies it
- The controls disable when there is nothing to undo or redo; decisions are excluded from undo once confirmed (the locked state persists)

Feature: Export and import experiment report (useful end state; API-shaped payload) —
- The app PRODUCES the operator's experiment report: an Export report control on a completed or decided experiment opens a panel showing a structured Experiment Report JSON document compiled live from session state, with Download JSON, Copy, and Import controls
- The JSON IS the would-be request/response body for an experiment-report API: it is compiled and validated against an API-shaped field contract so every export and every successful import is a complete, schema-valid payload — not an ad-hoc bag of strings
- Experiment Report field contract (all top-level keys REQUIRED; no undeclared top-level keys; field names and enum values are visible in the JSON preview text; example values illustrative only):
  - schemaVersion: string, exactly ab-experiment-report-v1
  - experimentId: non-empty string identifying the experiment
  - design: object matching the ExperimentUpsert field contract (name, hypothesis, successMetric, minimumSampleSize, variants with title, promptId, model, temperature, trafficAllocation)
  - status: closed enum string, exactly one of completed, decided
  - sampleCounts: object keyed by variant letter; each value is a non-negative integer equal to the samples collected for that variant
  - statistics: object requiring winner (string naming a variant letter, or exactly Tie), winRate (number from 0 through 1 inclusive), pValue (number from 0 through 1 inclusive), confidenceInterval (array of exactly two numbers, lower then upper), and means (object keyed by variant letter with numeric mean scores); all statistics exclude flagged outliers and match the values currently visible in the results panel summary strip
  - decision: null when no decision exists; otherwise an object matching the DecisionUpsert field contract (choice, optional winnerVariant, rationale)
  - flaggedResponseIds: array of strings identifying currently flagged outlier responses for this experiment
  - generatedAt: string in ISO-8601 datetime form ending in Z (for example 2026-07-19T18:00:00.000Z) that updates whenever the exported document is regenerated
- Cross-field rules: every key in sampleCounts and statistics.means equals a variant letter present in design.variants order; trafficAllocation values in design.variants sum to exactly 100; when status is decided, decision is non-null and conforms to DecisionUpsert; when status is completed, decision is null; when decision.choice is declare-winner, decision.winnerVariant equals statistics.winner or the declared variant letter; flaggedResponseIds contains only ids that exist among the experiment's sample responses
- The designer, criterion, and decision forms create records that match the corresponding nested objects in this same field contract; form validation enforces the same required fields, enums, and bounds the export shape declares, always naming the offending field inline
- The export reflects session mutations: after flagging an outlier the statistics keys update and the response id appears under flaggedResponseIds; after deciding, status becomes decided and decision carries the choice and rationale; an export that omits those session changes is incorrect; the open JSON preview must still show every required top-level key from the field contract
- Activating Copy places exactly the panel's JSON text on the clipboard and shows visible confirmation; Download offers the same JSON as a downloadable file named experiment-report.json
- An Import control accepts a previously exported Experiment Report JSON only when it passes the field contract; on success it applies the report's decision and flaggedResponseIds onto the matching experiment (same experimentId when present in the library, otherwise the selected completed or decided experiment) so the results header, summary strip, charts, matrix, radial wheels, inspector flags, and a fresh export match the imported document without a reload; a payload that violates the field contract (missing schemaVersion or statistics, schemaVersion not ab-experiment-report-v1, status outside completed|decided, design.variants length outside 2 to 4, traffic allocations not summing to 100, model outside the closed enum, decision shape invalid for status, or non-array flaggedResponseIds) does not apply any partial state; the panel shows an inline import error that names the offending field or rule, and the experiment stays unchanged
</core_features>

<user_flows>
- Designing and running end to end: creating an experiment with three variants and distinct allocations that sum to 100, running it, watching per-variant progress fill to the sample target, then opening results shows charts, a summary strip, matrix, and radial wheels all populated from that run — without a reload
- Full pipeline: design an experiment via a valid ExperimentUpsert, run it to completion, flag one outlier response in the inspector and confirm the p-value, means, matrix cells, and radial percentages visibly change; declare a winner with a DecisionUpsert rationale and confirm the status badge, locked editing, and results header update; open Export report and confirm the JSON shows schemaVersion ab-experiment-report-v1, the post-flag statistics, the flaggedResponseIds entry, and the decision rationale; Copy places that exact JSON on the clipboard
- Export after mutations: flag one outlier on a completed experiment, open Export report, and confirm statistics and flaggedResponseIds reflect the flag; decide with a rationale, reopen Export, and confirm status is decided and decision carries the choice and rationale
- Import round trip: on a completed experiment, flag one outlier and declare a winner with a rationale, Download experiment-report.json, reload to seeded state, reopen that experiment (or the matching seeded completed experiment), Import that file, and confirm the decision header, locked controls, flagged inspector treatment, summary statistics, and a fresh export reconstruct to match the imported document; a second Import of a payload with schemaVersion other than ab-experiment-report-v1 or allocations not summing to 100 leaves the experiment unchanged and shows a named-field import error
- Underpowered to powered: opening results before every variant reaches the minimum sample size shows the Underpowered state with no verdict; once the run reaches the threshold the significance verdict appears
- Two experiments whose variants use different prompts or models produce visibly different distributions and different summary statistics — the results are not identical across differently configured experiments
- Pausing mid-run freezes every variant's progress fraction; resuming continues from those exact counts and the event timeline shows the pause and resume entries in order
- Sorting the sample-level table by score delta ascending then descending reverses the row order relative to ascending
- A page reload returns the app to its seeded state: the seeded experiments and criteria, default view, and no decisions or flags beyond those seeded
</user_flows>

<edge_cases>
- Setting allocations that sum to less or more than 100 keeps Submit disabled and shows the live sum in an error treatment with a message naming the allocation rule
- Submitting the designer with a model outside Larkspur-2|Cobalt-Mini|Meridian-XL|Fernwave-1, a temperature outside 0 to 2, a minimumSampleSize outside 1 to 500, or an empty hypothesis shows an inline message naming the offending field and creates no experiment
- Submitting the criterion form with a duplicate name (case-insensitive), empty description, or passThreshold outside 0 to 100 shows an inline message naming the offending field and adds nothing
- Submitting the decision dialog with an empty rationale, or with choice declare-winner and no winnerVariant, shows an inline message naming the offending field and records no decision
- Removing a variant in the designer redistributes nothing automatically: the remaining allocations keep their values and the sum indicator updates, requiring the user to rebalance before submitting
- Double-activating Run starts exactly one run: progress bars fill once and one completed result set appears
- Double-activating the designer's Submit creates exactly one experiment: the count increases by one and one new row appears
- Deleting or archiving the experiment whose results panel is open closes or empties the panel to an empty state with a message and a control to choose another experiment
- Flagging every response of a variant shows an explicit insufficient-data state in the summary strip instead of statistics computed from nothing
- An experiment name longer than 60 characters is truncated with an ellipsis in the library row and shown in full in the results panel header
- Filtering the event timeline to an entry type with no entries shows an empty state message in the timeline region rather than a blank area
- Opening Export report on a completed seeded experiment before any in-session flag or decision still produces valid JSON with schemaVersion ab-experiment-report-v1 and every required top-level key; the panel never shows an empty or broken region
- Importing malformed JSON, or parseable JSON that fails the Experiment Report field contract (missing schemaVersion, schemaVersion not ab-experiment-report-v1, status outside completed|decided, design.variants length outside 2 to 4, traffic allocations not summing to 100, model outside the closed enum, or decision non-null while status is completed), leaves the experiment unchanged and shows validation naming the offending field
</edge_cases>

<visual_design>
- Layout: the experiment library table fills the main area; opening an experiment slides a results panel in from the right containing the tabbed results surfaces (Results, Monitoring, Matrix, Analytics, Inspector); the designer and decision dialogs render as modal dialogs
- The library table shows columns name, variants, sample size, status, started, and actions in that order; status badges use tag treatments: gray for pending, blue for running, teal for paused, green for completed, purple for decided, and a muted treatment for archived
- The grouped bar chart uses one consistent series color per variant — the first variant in the brand accent and each additional variant in a distinct supporting accent — and the same variant-to-color mapping is used in the distribution strip, difference chart, monitoring chart, and matrix highlights
- The summary strip renders as a horizontal row of four labeled stat tiles; the winner badge renders green when significant, yellow with the Not significant label when not, and gray for Tie; the Underpowered state renders as a neutral informational treatment, never green or yellow
- The confidence band on the difference chart renders as a translucent fill around the delta line, visually distinct from the line itself
- Radial wheels render the pass percentage in the ring center with the ring fill proportional to the value; rings for different criteria are visually consistent in size and stroke
- Typography shows a clear hierarchy: the app title larger than panel and tab headings, which are larger than table body and label text, consistent across views
- Spacing follows a consistent rhythm: gaps between the table, panel, chart blocks, and stat tiles are visually regular, with no crowded or orphaned regions
- Buttons, inputs, selects, sliders, and toggles show distinct default, hover, focus (visible ring), disabled, and error treatments; one consistent icon set is used across the toolbar, row actions, tabs, and flags
</visual_design>

<motion>
- Per-variant progress bars fill continuously as samples complete, updating at least every 200 milliseconds during a run rather than jumping in large steps
- The results panel slides in from the right over roughly 250 milliseconds when an experiment row is clicked and slides out when closed
- Chart bars grow from zero height over roughly 400 milliseconds when a results tab first renders its chart, driven by the real tab switch
- Newly created library rows animate in, and bulk-archived rows animate out, rather than appearing or vanishing instantly
- Flagging an outlier animates the flag treatment on and the dependent stat tiles transition to their new values rather than snapping
- Hover animations (required): buttons ease background and shadow with a slight press effect; table rows, timeline entries, and inspector rows take a full-width hover wash; form controls show focus rings
- The designer and decision modals enter with a short opacity and scale transition of roughly 200 to 300 milliseconds and exit the same way
- Feedback toasts after creating, deciding, promoting, archiving, and exporting slide in, remain readable, and auto-dismiss with a fade
- With prefers-reduced-motion set, progress jumps directly to current values, the panel appears instantly, and all transitions apply instantly
</motion>

<responsiveness>
- At widths of 768 pixels and below, the results panel opens full-width over the library instead of beside it, with a visible back control returning to the table; at desktop widths the panel opens alongside
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; the library table, matrix, and sample table scroll within their own containers
</responsiveness>

<accessibility>
- Every interactive control — table rows and headers, filter and bulk controls, designer fields and sliders, tabs, flag controls, pause/resume, undo/redo, and export — is reachable and operable with the keyboard alone, with a visible focus indicator
- The designer, decision, and confirmation modals trap focus while open, close on Escape, and return focus to the control that opened them
- Run completion, a decision being recorded, and the significance verdict activating are announced through an aria-live region as well as shown visually
- The allocation sliders expose their current value to assistive technology and can be adjusted with the arrow keys; form fields have visible labels and validation messages name the field they belong to
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of the app
- The UI stays responsive under rapid repeated input — quick tab switches, rapid sort clicks, fast filter toggles — with no hangs or dropped interactions, including while a run is filling progress bars
</performance>

<writing>
- Headings, tabs, buttons, and status labels use one consistent capitalization convention throughout
- Action labels are specific verbs such as Run experiment, Flag outlier, and Declare winner rather than generic labels where a specific one is possible
- Validation and error messages name the field or rule and the fix; empty states explain what belongs in the region and how to get it there; no placeholder text appears anywhere in the shipped UI
- Statistical labels are written out where first shown (p-value, 95 percent confidence interval, minimum sample size) and the Underpowered message states the remaining sample count
</writing>

<requirements>
Shared application state must live in Zustand (in-memory only): the experiments collection with variants, allocations, hypotheses, metrics, and statuses; the scoring criteria; per-run per-variant sample records with scores, latencies, and tokens; run progress, pause checkpoints, and event timelines; outlier flags; decisions with rationales; the prompt library head versions; preview playground inputs and responses; undo/redo history; filters, search, sort, selection, active tabs, and UI chrome. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a valid experiment increases the collection and shows the new row; the visible count updates
- Editing a pending experiment updates its row and its designer prefill everywhere it appears
- Deleting or archiving removes or moves the experiment in the list, the selection, and any open panel
- Advancing samples updates the progress bars, event timeline, and any open monitoring chart from the same shared run state; pausing and resuming preserve collected samples exactly
- Flagging an outlier recomputes every derived statistic — summary strip, charts, matrix, radial wheels, and export content — from the same shared sample data
- A decision updates the status badge, locks editing, and feeds the export from the same shared record
- Filters, search, sort, and tab selection recompute the visible data from the shared collection; they do not create a second disconnected copy
Build tooling: Vite SPA. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer. IBM Carbon Design System (@carbon/react) is the component library for all UI chrome — modals, data tables, tags, tiles, sliders, inline loading, notifications, and form controls; no other component library. Recharts for the grouped bar, distribution, difference, monitoring, and radial charts. Motion for React and AutoAnimate allowed for animation; no other animation libraries. Icons from @carbon/icons-react only, installed via npm — no raw copy-pasted SVG icon sets. All forms — the experiment designer, the criterion form, the decision dialog, and Experiment Report Import when presented as a form — are driven by React Hook Form validating through a Zod schema that mirrors the ExperimentUpsert, CriterionUpsert, DecisionUpsert, and Experiment Report API field contracts above: the schema defines the rules (including the allocations-sum-to-100 rule, closed model and decision enums, and temperature 0 to 2) and inline per-field errors render before submit; the record a valid form creates IS the would-be request body, and Export and Import compile and validate against those same schemas. Statistical computation (p-value via a two-sample t-test, confidence intervals, win rate) is implemented in client JavaScript; no external stats library is required. All libraries installed via npm and bundled locally; no CDN imports. No backend or authentication; evaluation is simulated with realistic latency and scores drawn per variant configuration, so variants with different prompts or models produce visibly different score distributions and two runs are never byte-identical. Model names are fictional (for example Larkspur-2, Cobalt-Mini, Meridian-XL, Fernwave-1); do not use real provider or model names anywhere in the UI.
- Seed at least 5 experiments (at least 3 completed with full sample data and at least 2 pending), at least 6 prompts, at least 4 scoring criteria, and at least 3 fictional models, so the library, results surfaces, and selectors are non-empty on first load
- Submitting the designer with invalid fields or allocations must not increase the experiment count; show visible validation feedback
- The useful end state is the Experiment Report pack: Export must produce schema-valid JSON that reflects every flag and decision mutation made on the selected experiment and conforms to the API-shaped field contract (schemaVersion ab-experiment-report-v1 plus experimentId, design, status, sampleCounts, statistics, decision, flaggedResponseIds, generatedAt with the formats, enums, bounds, and cross-field rules above); Import round-trips a contract-valid report back into decision and flags and refuses contract-invalid payloads without partial mutation; persistence for this good-app genre is the portable report plus the MCP query surface — never browser storage
- Zero navigational outbound links for app chrome — in-app controls only; view changes via shared client state
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- form-workflow-v1
- command-session-v1
- entity-collection-v1
- artifact-transfer-v1

Module specs:
<module_spec id="form-workflow-v1">
{
  "id": "form-workflow-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Form workflow",
  "purpose": "Forms, setup flows, authentication shells, and multi-step workflows.",
  "permitted_operations": ["validate", "submit", "cancel", "reset", "advance", "return"],
  "binding_keys": {
    "required_any_of": [["form_fields"], ["form_operations"]],
    "optional": ["workflow_steps", "value_bounds", "visible_postconditions"]
  },
  "restrictions": [
    "Declared fields only.",
    "Normal validation and visible errors remain active.",
    "Cannot manufacture authentication or bypass guarded routes.",
    "Backend-free apps must surface honest unavailable state through product handlers."
  ],
  "tool_name_prefix": "form"
}
</module_spec>

<module_spec id="command-session-v1">
{
  "id": "command-session-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Command / session",
  "purpose": "Media, games, presentations, simulations, demos, and remote-control shells.",
  "permitted_operations": ["start", "pause", "resume", "stop", "restart", "advance", "trigger_demo", "connect", "disconnect"],
  "binding_keys": {
    "required_any_of": [["session_operations"]],
    "optional": ["demos", "visible_postconditions"]
  },
  "restrictions": [
    "No batching or replay of gameplay.",
    "Timing, animation, collision, repeated input, and transient UI require immediate Playwright observation.",
    "Tool output cannot prove successful playback or connection."
  ],
  "tool_name_prefix": "session"
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
- Form fields: experiment-name; hypothesis; success-metric; minimum-sample-size; variant-title; variant-prompt; variant-model; variant-temperature; traffic-allocation; criterion-name; criterion-description; pass-threshold; decision-choice; decision-rationale
- Form operations: validate; submit; cancel
- Workflow steps: experiment-designer; new-criterion-form; decision-dialog; promote-winner-confirm
- Value bounds: experiment-name required; over 60 chars truncates with ellipsis in the library row; hypothesis and decision-rationale required free text; minimum-sample-size integer 1 to 500; pass-threshold integer 0 to 100; variant count 2 to 4 (A and B fixed; C and D addable/removable); traffic allocations must sum to exactly 100 percent; Submit disabled otherwise and removing a variant never auto-redistributes; variant-model in {Larkspur-2, Cobalt-Mini, Meridian-XL, Fernwave-1}; variant-prompt one of the at least 6 seeded prompts; success-metric one of the judge criteria {factual-accuracy, tone, completeness, formatting} plus any user-added criterion; decision-choice in {declare-winner, inconclusive, stop-early}; experiment status in {pending, running, paused, completed, decided, archived}; outlier-flag boolean per response; flag controls disabled on decided (locked) experiments; delete and bulk delete require explicit confirm=true
- Session operations: start; pause; resume; trigger_demo
- Demos: preview-run
- Entity: experiment
- Entity operations: select; toggle; delete
- Entity fields: archived; outlier-flag
- Artifact operations: export
- Export formats: experiment-report
- Workflow completion: a valid designer submit adds exactly one Pending row and increments the visible experiment count; a newly added criterion appears in the success-metric select without a reload
- Workflow completion: start fills per-variant progress bars to the sample target and flips the badge to Completed, populating the results panel; pause freezes every variant's count and resume continues from exactly those counts with paused/resumed timeline entries in order
- Workflow completion: flagging an outlier recomputes the summary strip, charts, matrix cells, and radial percentages with a visible change; unflagging restores them; flagging every response of a variant yields the insufficient-data state
- Workflow completion: a confirmed decision sets status Decided, shows the rationale in the results header, and locks Edit and Flag controls with a visible locked indicator; Promote winner records the winning prompt as head in the prompt library with a toast naming the variant
- Workflow completion: below the minimum sample size the summary shows the Underpowered state naming remaining samples with no verdict; at threshold p<0.05 renders the success winner badge and p>=0.05 the Not significant warning
- Workflow completion: the exported report carries the design, per-variant sample counts, statistics excluding flagged outliers, and any decision with rationale, matching the results panel exactly

Mechanics exclusions:
- Library search-as-you-type narrowing, status filter chips, Archived toggle, and results-tab switching are single-click/typed navigation driven and observed via Playwright (no browse module assigned)
- Progress-bar fill cadence (updates at least every 200 ms) and the inline loading indicator are timing mechanics observed via Playwright
- Results-panel ~250 ms slide-in, chart grow-from-zero on tab switch, and stat-tile transitions on flag changes stay Playwright-observed
- Monitoring-chart point hover tooltips (variant, sample count, cumulative mean) are real-pointer chart mechanics
- Sample-table sort direction reversal via header clicks and row animate in/out on create/bulk-archive stay Playwright-driven
- Undo/Redo header controls are exercised through the real controls (decisions excluded from undo; disabled states observable)
- Downloaded report files remain Playwright responsibilities; no raw file contents in WebMCP results

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
