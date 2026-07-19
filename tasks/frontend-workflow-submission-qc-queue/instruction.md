<summary>
Build a quality-control triage queue for contributor task submissions on an evaluation platform using Vue 3, Pinia, Tailwind CSS 4.3.2, and Naive UI.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Submission queue —
- The app opens into a queue view: a data table seeded with at least 12 submissions spread across at least 4 fictional contributors (for example Mara Voss, Ilya Brandt, Tessa Okafor, Ruben Calla), with columns for submission title, contributor, stage, findings, and payout state
- The stage column renders one of exactly four stages — submitted, in-review, needs-revision, approved — each as a visually distinct status tag; the payout state column renders one of pending, held, or released
- The findings column shows triage tier chips summarizing that submission's open findings by tier — blocker, major, minor — with a count per tier present; submissions with zero open findings show a clear zero-findings indicator
- Filter controls above the table narrow the rows by stage, by tier (submissions having at least one open finding of that tier), and by contributor; active filters combine, each active filter is visibly indicated, and clearing filters restores all rows exactly
- A sort control orders the table by open finding count, ascending and descending; switching direction reverses the row order relative to the other direction without changing the visible row count
- When filters combine to match nothing, the table region shows a designed empty state with a message and a control that clears the filters

Feature: Submission detail and the gate banner —
- Clicking a queue row opens that submission's detail view without a full page reload, showing its title, contributor, current stage, payout state, and a findings list
- Each finding shows a tier chip (blocker, major, or minor), a category label, a description, and a collapsed evidence disclosure; activating the disclosure expands it with a rotating chevron cue to reveal the evidence text
- A gate banner at the top of the detail view derives live from the open findings: it reads gate failed while at least one blocker finding is open and gate passed otherwise, with visibly different failed and passed treatments
- Adding, removing, re-tiering, or overriding a finding flips the gate banner immediately when the blocker condition changes, without a reload

Feature: Review actions —
- An Add finding control opens a form with tier (required), category (required), and description (required, at least 10 characters); each invalid field shows an inline message naming that field before submit, the submit control stays disabled until all required fields are valid, and submitting a valid form appends exactly one finding and updates the queue row's tier chips
- A Request revision control opens a form requiring a summary comment of at least 20 characters; a shorter comment shows an inline message with the minimum length and blocks submit; submitting moves the submission's stage to needs-revision in the detail view and the queue row, and appends the comment to the submission's history
- An Approve control is enabled only when the submission is in-review and has zero open blocker findings; while any blocker is open, or the stage is not in-review, the control is disabled with an inline explanation naming the reason (open blocker findings, or wrong stage); approving from a valid state moves the stage to approved and the payout state to released
- Each finding offers an Override action that opens a form requiring justification text of at least 10 characters; an overridden finding renders struck-through with an overridden label and its justification, stops counting toward the gate banner and the queue tier chips, and can flip the gate to passed when it was the last open blocker
- A Mark revised control on a needs-revision submission returns its stage to in-review, and the stage tag updates in both the detail view and the queue row

Feature: Failure-profile panel —
- The detail view (or an adjoining panel) shows a per-criterion failure profile computed from at least 8 seeded trial results: one horizontal bar per criterion, sorted by failure rate descending, each showing the criterion name, its failure rate as a percentage, and its mean score
- Criteria with weight 3 or more render their bar and name in a distinct load-bearing accent color that lower-weight criteria do not use
- A date-range control filters which seeded trial results feed the panel; narrowing the range recomputes the bars, percentages, and mean scores to different values (the seeded results span at least two distinct date buckets), and restoring the full range restores the original values exactly

Feature: Contributor detail drawer —
- Clicking a contributor's name (in the queue or a detail view) opens a slide-in drawer listing that contributor's submissions with their current stages, plus a stage-history timeline of ordered, timestamped events (for example submitted, moved to in-review, revision requested) shown newest first or oldest first consistently
- Stage changes made from review actions append matching timeline events immediately: requesting a revision adds a revision-requested event with a timestamp to that contributor's timeline without a reload
- The drawer closes via its close control and by clicking outside it, returning to the underlying view unchanged

Feature: Re-check run —
- A Run re-check control on a submission starts a simulated check run rendered as a task progress list of at least 4 named steps that tick to completion one by one with per-step status icons and an overall progress indicator; while running, a loading affordance is visible
- When the run completes, a summary line reports the outcome and the list remains visible until dismissed; starting a new run resets the list to pending and replays the progression
</core_features>

<user_flows>
- Triage end to end: open a submitted submission, move it to in-review, add a blocker finding and observe the gate banner read gate failed and the queue row gain a blocker chip, then override that finding with justification and observe the finding struck-through, the gate flip to passed, and the queue chips update — all without a reload
- Revision loop: on an in-review submission add a major finding, request a revision with a valid 20-plus-character summary, observe the stage move to needs-revision in the detail view, the queue row, and the contributor timeline (new timestamped event), then mark it revised and observe the stage return to in-review
- Approval gate: attempt to approve an in-review submission that has an open blocker and observe the disabled control with its explanation; resolve the blocker by override, approve, and observe stage approved and payout released in both detail and queue
- Profile sensitivity: record two criteria's failure rates in the failure-profile panel, narrow the date range and observe the bars and percentages change, then restore the full range and observe the original values return exactly
- A page reload returns the app to its seeded state: the seeded submissions at their seeded stages, findings, and payout states, with no filters active
</user_flows>

<edge_cases>
- Submitting Add finding with an empty tier, category, or a description under 10 characters shows inline messages naming those fields and appends no finding; the finding count is unchanged
- Submitting Request revision with a comment under 20 characters shows an inline message stating the minimum and does not change the stage
- Overriding every finding on a submission leaves the findings list showing all entries struck-through, the gate banner passed, and the queue row's tier chips at zero
- A submission with zero findings shows a designed empty state in its findings region naming what belongs there and offering the Add finding control
- Approve remains disabled on submitted, needs-revision, and approved stages even with zero blockers, with the wrong-stage explanation
- Double-activating the Add finding submit control appends exactly one finding
</edge_cases>

<visual_design>
- Ops-console composition: a full-width queue table with a filter toolbar above it, a detail view with the gate banner spanning the top, the findings list on the leading side, and the failure-profile panel adjoining it; regions separate with hairline borders or elevation
- Stage tags use four consistent, distinguishable treatments (submitted, in-review, needs-revision, approved) and payout states three (pending, held, released); the same stage always renders the same treatment in the queue, detail view, drawer, and timeline
- Tier chips escalate visually: blocker reads most severe (strongest hue), major intermediate, minor subdued, consistently everywhere they appear
- The gate banner's failed and passed states are visibly different beyond color alone (icon or label change) and readable at a glance
- Load-bearing criteria in the failure-profile panel use one distinct accent color that other bars never use
- Typography hierarchy: submission titles are visibly larger than section headings, which are larger than metadata and body text; numeric columns and percentages align consistently
- Buttons, selects, inputs, and toggles show distinct default, hover, focus (visible ring), disabled, and error treatments; the disabled Approve control is visibly muted beside its inline explanation
</visual_design>

<motion>
- Hover animations (required): buttons ease background and shadow with a slight press effect; table rows take a full-width hover wash; chips and tags lift subtly on hover; form controls show focus rings
- The contributor drawer slides in from the edge with an eased transition and slides out on close; the queue-to-detail switch transitions without a full page reload
- A newly added finding animates into the findings list and an overridden finding animates its struck-through state in rather than snapping; queue tier chips update with a brief eased change
- The gate banner animates its failed/passed swap with a short cross-fade or slide of roughly 200 to 300 milliseconds through the real add/override/re-tier control path
- Failure-profile bars ease to their new widths when the date range changes rather than jumping
- Re-check steps tick with an animated status transition (icon swap plus eased progress indicator), and the completion summary fades in
- Evidence disclosures expand and collapse with an animated height transition and rotating chevron
- Feedback toasts after add finding, request revision, approve, and override slide in, remain readable, and auto-dismiss with a fade
- With prefers-reduced-motion set, animations are removed and state changes apply instantly while every flow remains available
</motion>

<responsiveness>
- At desktop widths the queue table shows all columns; at widths of 768 pixels and below the table condenses (stacked or horizontally scrollable within its own container) and the detail view stacks the findings list above the failure-profile panel
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; the contributor drawer becomes full-width
</responsiveness>

<accessibility>
- Every interactive control — queue rows, filters, sort, review action controls, finding disclosures, drawer, date-range control, re-check control — is reachable and operable with the keyboard alone, with a visible focus indicator
- The contributor drawer traps focus while open, closes on Escape, and returns focus to the control that opened it
- Stage, tier, and gate states are not conveyed by color alone: each carries a text label or icon; form validation messages are associated with their fields so each message names the field it belongs to
- Evidence disclosures expose their expanded or collapsed state to assistive technology
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of the app
- Filtering, sorting, gate recomputation, and profile recomputation respond instantly with no visible lag, and the UI stays responsive under rapid repeated filter and toggle input with no hangs
</performance>

<requirements>
Shared application state must live in Pinia (in-memory only): the submissions collection with findings, stages, payout states, and stage-history events, the seeded trial results, queue filters and sort, the active submission and view, drawer and disclosure state, re-check run progress, and UI chrome. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Adding a valid finding grows that submission's findings and updates the queue row's tier chips and the gate banner
- Stage changes (request revision, mark revised, approve) update the stage tag everywhere it appears (queue, detail, drawer, timeline) and append matching timeline events
- Overriding a finding updates its rendering, the gate banner, and queue chips from the same shared record
- Filters and sort recompute the visible queue from the shared collection; they do not create a second disconnected copy
- The failure-profile panel derives from the shared trial results and the selected date range; it never renders from a frozen copy
- Active view and drawer state are shared client state; switching them does not reload the document
- WebMCP tool handlers, where required by delivery, invoke the same store commands as the visible controls
Build tooling: Vite or an equivalent SPA setup. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer. Naive UI is the component library for the data table, tags, drawer, dialogs, selects, date-range control, progress indicators, and toasts; no other component library. @vueuse/motion and AutoAnimate allowed for animation; no other animation libraries. One icon set only, installed via unplugin-icons from its npm packages — no raw copy-pasted SVG icon sets. All forms — Add finding, Request revision, Override, and any filter/settings forms — are driven by VeeValidate validating through a Zod schema: the schema defines the rules and inline per-field errors render before submit. All libraries installed via npm and bundled locally; no CDN imports. No backend or authentication.
- Seed at least 12 submissions across at least 4 contributors covering all four stages and all three payout states, with findings spanning all three tiers, and at least 8 trial results spanning at least two date buckets, so every view is non-empty on first load
- Invalid form submissions must not change any submission; show visible validation feedback
- Empty findings regions and zero-match filter results show designed empty states
- Zero navigational outbound links for app chrome — in-app controls only; view changes via shared client state
- All contributor, criterion, and platform names are fictional; no real product, company, or model names appear anywhere in the UI
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- browse-query-v1
- entity-collection-v1
- form-workflow-v1
- command-session-v1

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

Bindings:
- Browsable entity: submissions
- Destinations: queue; submission-detail; contributor-drawer
- Filters: stage; tier; contributor; date-range
- Sorts: open-finding-count-asc; open-finding-count-desc
- Entity: submission
- Entity operations: select; update
- Entity fields: stage; payout-state
- Value bounds: stage in {submitted, in-review, needs-revision, approved}; payout-state in {pending, held, released}; approve only from in-review with zero open blockers
- Form fields: tier; category; description; revision-summary; override-justification
- Form operations: validate; submit; cancel
- Workflow steps: add-finding; request-revision; override-finding; approve; mark-revised
- Session operations: start; restart
- Demos: re-check-run
- Workflow completion: gate banner flips when blocker condition changes
- Workflow completion: queue tier chips and contributor timeline update after stage/finding changes

Mechanics exclusions:
- Contributor drawer slide-in/out easing stays Playwright-observed
- Gate banner cross-fade and struck-through override animate-in stay Playwright-observed
- Failure-profile bar width easing on date-range change stays Playwright-observed
- Re-check step tick animation timing stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
