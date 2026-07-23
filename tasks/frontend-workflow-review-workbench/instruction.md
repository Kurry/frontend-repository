<summary>
Build a benchmark-task review workbench for certifying evaluation task bundles using React, Zustand, Tailwind CSS 4.3.2, and Mantine.
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

Feature: Portfolio dashboard —
- On first load the portfolio view lists 12 seeded review bundles in a table, each row showing the bundle's task slug (for example ember-relay-router, juniper-lint-fixer, drift-ledger-repair), a verdict hero state, six per-gate status chips in a fixed order, any stop-early flags as warning badges, and a review-progress indicator showing the count of completed reviewer steps out of the 5
- Every bundle carries exactly one verdict hero state, rendered as a prominent labeled banner treatment on its row: READY FOR THE BENCHMARK, NOT READY — BUT FIXABLE, or AT RISK — MAY NEED A RESTART; the seeds distribute as 4 READY FOR THE BENCHMARK, 5 NOT READY — BUT FIXABLE, and 3 AT RISK — MAY NEED A RESTART
- A rollup strip above the table shows the live count of bundles per hero state and the count of bundles carrying at least one stop-early flag; these counts always equal what the table currently proves and recompute when any bundle's derived state changes
- A hero-state filter and a gate-status filter (choose a gate plus a status) narrow the visible rows; active filters render as removable chips, combining both filters narrows further, and clearing all filters restores all 12 rows
- A calibration strip on the portfolio summarizes the Sable-4 scoring model's trial validity across bundles: one cell per bundle showing valid trials out of total Sable-4 trials for that bundle, plus an overall Sable-4 validity percentage; hovering a cell shows the bundle slug and its valid/total figures
- Selecting a bundle row opens that bundle's review workspace without a full page reload, and the portfolio remains reachable from a persistent control
- Stop-early flags are named conditions seeded on specific bundles: agent solved without runtime evidence, and oracle contradicts the task description; a flagged bundle shows the flag's name on hover or focus of its warning badge
- Bundles the reviewer has bundled (completed step 5) show a Bundled badge on their portfolio row alongside the hero state

Feature: Gate board —
- Each bundle's workspace shows a gate board with six gates in a fixed order: Admission, No-op, Oracle, Difficulty — Sable-4, Difficulty — Quartz-Mini, and Analysis; each gate card shows a status of pass, fail, errored, inconclusive, or missing, a one-line summary, and an expandable reasons list
- The gate board displays the certification thresholds as visible reference values: the difficulty bar of 0.80, the oracle comprehensiveness bar of 0.90, and the minimum of 3 valid trials; each difficulty gate card shows its measured score next to the 0.80 bar and the Oracle gate shows its comprehensiveness value next to the 0.90 bar
- Each gate card carries an evidence link; activating it jumps to the exact evidence record backing that gate — a difficulty gate's evidence link opens the trial inspector on that gate's trials, and the Oracle gate's evidence link opens its oracle transcript record — with the target record visibly highlighted on arrival
- Gate statuses derive from the seeded evidence: a difficulty gate shows pass only when its score meets the 0.80 bar with at least 3 valid trials, shows inconclusive when fewer than 3 of its trials are valid, and shows fail when the score misses the bar with 3 or more valid trials; at least one seeded bundle (ember-relay-router) ships its Difficulty — Quartz-Mini gate inconclusive with only 2 valid trials
- The bundle's verdict hero state derives from its gates and flags: all six gates pass yields READY FOR THE BENCHMARK; any non-passing gate with no stop-early flag and no unresolved REDESIGN fix item yields NOT READY — BUT FIXABLE; a stop-early flag or an unresolved REDESIGN fix item yields AT RISK — MAY NEED A RESTART
- Gate evidence is read-only: no control anywhere edits a gate's score, status, reasons, or evidence text directly

Feature: Gate re-run simulation —
- Each gate card has a Re-run gate control that starts a simulated re-evaluation decomposed into four named steps shown in order: provision harness, collect trials, evaluate checks, publish result; each step's status advances visibly through pending, running, and complete or failed
- Simulated step failures retry automatically with a visible backoff countdown and an attempt counter (for example, waiting before retry 2 of 3); a step that exhausts its retries is marked failed with an inline error summary and a manual Retry control
- Activating a failed step's Retry control resumes the re-run from that step: steps already complete keep their original timestamps and outputs and never re-execute
- A running re-run can be paused and resumed: pausing freezes progression at the current step and resuming continues from exactly that step
- When the publish result step completes, the gate receives a fresh result that can change its status — a re-run of ember-relay-router's Difficulty — Quartz-Mini gate gathers additional valid trials so the gate leaves inconclusive — and the gate card's status chip, summary, and score update in place
- A gate status change from a completed re-run recomputes every dependent surface without a reload: the bundle's verdict hero banner, the fix list's affected items, the allowed recommendation set and its explanation, the portfolio row's hero state and gate chips, the rollup counts, and the calibration strip when trial validity changed
- Each bundle has an event timeline: an ordered log with timestamps recording re-run step transitions, gate status changes, fix-item check-offs, recommendation changes, reviewer step completions, and bundling; the timeline is filterable by event kind and newest entries appear without a reload

Feature: Trial inspector —
- Opening a difficulty gate's evidence shows its trials as a selectable list; each bundle seeds at least 4 trials per scoring model, and each trial is labeled with its scoring model (Sable-4 or Quartz-Mini), trial number, and a valid or invalid badge
- The inspector for a selected trial is a three-pane linked view: the left pane lists the bundle's rubric criteria (at least 6 per bundle), each showing its id, name, weight, and a negated marker where the criterion is inverted; the middle pane shows the scorer's per-criterion reasoning text with an outcome chip of pass, fail, or not-applicable per criterion; the right pane shows the agent's answer text for that trial
- The middle pane also renders the trial's eight named validity checks, each with an outcome chip: answer-determinacy, runtime-evidence-used, grounded-in-trajectory, comprehensiveness-near-miss, difficulty-crux, honest-uncertainty, refusals, and low-timeout; a trial's valid badge derives from its checks — a trial is valid exactly when its answer-determinacy, refusals, and low-timeout checks all pass
- Selecting a criterion in the left pane highlights that criterion's reasoning block in the middle pane and highlights the passages of the agent's answer that the reasoning cites in the right pane; selecting a different criterion moves both highlights
- Selecting a reasoning block in the middle pane selects its criterion in the left pane, keeping all three panes on the same criterion
- Evidence passages in the agent's answer render with a visible highlight treatment distinct from body text, and the highlight for the currently selected criterion is visually distinct from other cited passages

Feature: Trial diff —
- A Compare trials control enters a diff mode where the reviewer picks two trials of the same gate; the inspector then shows both trials' check outcomes side by side, one column per trial, one row per named check
- Any check whose outcome differs between the two trials is flagged with a visible flip marker, and a flip-count summary states the count of flipped checks out of the eight
- Leaving diff mode restores the single-trial three-pane view on the previously selected trial

Feature: Ordered fix list —
- Each bundle's workspace shows an ordered fix list; every item shows its position, a category tag of RERUN, FIX, REDESIGN, or TALK-TO-LEAD, a title, a detail sentence, a remediation sentence, and an evidence link that jumps to the record backing the item; every non-READY bundle seeds at least 3 fix items
- Each fix item has a resolve checkbox; checking it marks the item resolved with a visible struck or dimmed treatment, and unchecking restores it
- Resolving or unresolving a fix item immediately recomputes the allowed recommendation set and its visible explanation, and — where a REDESIGN item's resolution state feeds the hero mapping — the verdict hero banner and portfolio row update too
- Fix items are ordered by severity with REDESIGN items above FIX and RERUN items and TALK-TO-LEAD pinned wherever seeded; the visible order is stable and the position numbers stay sequential

Feature: Constrained verdict —
- The Verdict step shows the four recommendations — APPROVE, APPROVE WITH CAVEATS, MAJOR CHANGES NEEDED, and REJECT-ESCALATE — with the currently allowed set enabled and the rest visibly disabled
- The allowed set derives live from the gates and fix list by ordered rules where the most severe applicable rule wins: all six gates passing with every fix item resolved allows APPROVE and APPROVE WITH CAVEATS; all gates passing with unresolved items limited to RERUN and FIX allows APPROVE WITH CAVEATS and MAJOR CHANGES NEEDED; any non-passing gate or any unresolved REDESIGN item allows MAJOR CHANGES NEEDED and REJECT-ESCALATE; any unresolved TALK-TO-LEAD item allows only REJECT-ESCALATE
- A constraint explanation panel beside the recommendations states, in plain language, which rule currently applies and which gates or fix items triggered it; the explanation changes when the triggering conditions change
- Selecting an allowed recommendation records it and shows it as the bundle's current recommendation in the workspace header
- Recommendation / override request-body field contract (a successful save IS the would-be request body and appears in the Review Package JSON under the same keys): required recommendation exactly one of APPROVE, APPROVE WITH CAVEATS, MAJOR CHANGES NEEDED, or REJECT-ESCALATE; when the choice is outside the currently allowed set, required overrideJustification as a trimmed string of at least 20 and at most 2000 characters. Violations keep save disabled with inline per-field errors naming the field and mutate nothing
- An Override constraint toggle unlocks the disabled recommendations; choosing a recommendation outside the allowed set requires the overrideJustification field under that field contract — inline validation names the field and blocks saving until it passes — and a saved override shows an Override badge with the justification retrievable from the verdict panel
- Turning the override toggle off with an out-of-set recommendation saved reverts the recommendation to unset and removes the Override badge

Feature: Reviewer step flow —
- Each bundle's workspace shows the 5 reviewer steps in order — Resolve, Gate, Audit, Verdict, Bundle — as a stepper; each step has a done control and a notes field, and each step shows done or not-done state at a glance
- A step is locked until every earlier step is done: its content area shows a locked notice naming the step that must be finished first, and its done control is disabled
- Marking a step done unlocks the next step and updates the portfolio row's review-progress indicator; un-marking a done step re-locks all later steps while preserving their notes
- Step notes accept text and persist in the session: navigating to the portfolio and back, or to another bundle and back, shows the same notes and done flags

Feature: Bundle step and review summary —
- The Bundle step renders a review summary document generated live from the actual session state: the verdict hero state, the chosen recommendation with the override justification when one exists, a gates table listing all six gates with their current statuses, the ordered fix list with each item's category tag, resolved state, and remediation, and a reviewer notes checklist showing each of the 5 steps with its done flag and notes
- The summary reflects current state at render time: changing a fix item, recommendation, or note and returning to the Bundle step shows the changed values in the document
- A Copy summary control places the summary text on the clipboard and shows a visible confirmation
- A Complete bundling control, enabled only when the Verdict step is done and a recommendation is recorded, marks the Bundle step done, appends a bundling event with a timestamp to the bundle's event timeline, and flips the bundle's portfolio row to show the Bundled badge

Feature: Review certification package export (useful end state) —
- An Export certification package control opens a drawer or modal with a live preview compiled from the store and a format switch between Review Package JSON and Review Summary Markdown
- Review Package JSON field contract (API-shaped certification-service payload; Download and Copy share this schema — field names and enum values are visible in the preview text): required schemaVersion exactly equal to review-certification/v1; required exportedAt as an ISO-8601 timestamp string ending in Z; required portfolioSummary object with required integer keys totalBundles, readyCount, notReadyCount, atRiskCount, stopEarlyCount and required number sable4ValidityPercent; required bundles array where each entry carries required slug (non-empty string), heroState (exactly one of READY FOR THE BENCHMARK, NOT READY — BUT FIXABLE, AT RISK — MAY NEED A RESTART), recommendation (exactly one of APPROVE, APPROVE WITH CAVEATS, MAJOR CHANGES NEEDED, REJECT-ESCALATE, or null when unset), overrideJustification (string or null), bundled (boolean), stopEarlyFlags (array of strings), gates (array of six objects in the fixed gate order each with required name, status exactly one of pass, fail, errored, inconclusive, missing, summary string, score number-or-null, validTrials and totalTrials non-negative integers), fixItems (array of objects each with position integer, category exactly one of RERUN, FIX, REDESIGN, TALK-TO-LEAD, title, detail, remediation, resolved boolean), reviewerSteps (array of five objects in Resolve, Gate, Audit, Verdict, Bundle order each with name, done boolean, notes string), and timeline (array of objects each with id string, timestamp ISO-8601, kind string, label string)
- Review Summary Markdown is a human-readable document listing the same portfolio summary, then one section per bundle with its hero state, recommendation with override justification when present, gates table, fix list with resolved state, and reviewer step notes
- The preview regenerates from live session state: resolving a fix item, recording a recommendation or overrideJustification, marking steps done, completing bundling, or finishing a gate re-run changes the corresponding preview values without a reload; an export that omits a session mutation is incorrect
- A Copy control places the exact visible preview text on the clipboard and shows a visible confirmation; a Download control starts a file download (.json or .md matching the active format) whose contents match the preview text

Feature: Review certification package import —
- An Import certification package control accepts pasted Review Package JSON text matching the export field contract
- A valid import replaces bundle session facets so portfolio rows, workspace hero/recommendation/fix/step/timeline surfaces, and the next Export preview match the imported document
- Malformed JSON, or JSON that violates the field contract (schemaVersion not exactly review-certification/v1, missing required keys, heroState or recommendation outside the closed sets, gate status outside the five-status set, fix category outside the four-category set, recommendation present with overrideJustification shorter than 20 characters when that recommendation was out-of-set in the package, negative trial counts), shows an inline error naming the import problem, leaves the portfolio unchanged, and does not treat the attempt as a successful mutation

Feature: Deep-link breadcrumb —
- An address-style breadcrumb at the top of the workspace tracks the current selection, extending as the reviewer descends: Portfolio / bundle slug / gate name / trial number / criterion id
- Selecting any gate, trial, or criterion anywhere in the app updates the breadcrumb to that exact path; activating a breadcrumb segment navigates to that level with the corresponding record selected and highlighted
- Cross-view echo: the same record selected from different entry points (a gate chip on the portfolio row, the gate card, an evidence link, the breadcrumb) lands on the identical selection state and breadcrumb path
</core_features>

<user_flows>
- Certifying a clean bundle end to end: opening juniper-lint-fixer (all gates pass) shows the READY FOR THE BENCHMARK hero; marking Resolve, Gate, and Audit done in order unlocks Verdict, where APPROVE is enabled; selecting APPROVE, marking Verdict done, and opening Bundle shows a summary whose hero line reads READY FOR THE BENCHMARK and whose recommendation line reads APPROVE; completing bundling stamps the timeline and the portfolio row gains the Bundled badge — all without a reload
- Flipping a gate through a re-run: on ember-relay-router the Difficulty — Quartz-Mini gate shows inconclusive with 2 valid trials; running Re-run gate advances the four steps with visible statuses, and on publish the gate leaves inconclusive, the verdict hero banner recomputes, the constraint explanation updates, the allowed recommendation set changes, the portfolio row's gate chip and hero state update, and the calibration context reflects the new trial validity — all from the one re-run
- Auditing a suspect trial: from a difficulty gate's evidence link, the trial inspector opens on that gate's trials; selecting an invalid trial shows which of its eight checks failed; selecting a negated criterion in the left pane highlights the scorer's reasoning for it and the cited answer passages; entering diff mode against a valid trial flags the flipped checks with a flip count
- Working the fix list toward approval: on a bundle whose gates all pass but which has unresolved RERUN and FIX items, the allowed set shows APPROVE WITH CAVEATS and MAJOR CHANGES NEEDED with an explanation naming the unresolved items; resolving every fix item live changes the allowed set to APPROVE and APPROVE WITH CAVEATS and the explanation updates to say all items are resolved
- Overriding the constraint honestly: with the allowed set excluding APPROVE, toggling Override constraint and choosing APPROVE demands a justification of at least 20 characters — submitting a shorter one shows an inline message naming the justification field and saves nothing; a valid justification saves, the Override badge appears, and the Bundle summary prints the justification under the recommendation
- Mutation-to-export: after recording a recommendation with a distinctive overrideJustification on one bundle, resolving a fix item, writing a distinctive step note, and completing bundling, open Export certification package and confirm Review Package JSON shows schemaVersion review-certification/v1, that bundle's recommendation and overrideJustification, the resolved fix item, the step note, and bundled true; Copy and Download are available
- Export then import round-trip: after the mutation-to-export session work, Copy or Download the Review Package JSON, reload to the seeded baseline, Import that same JSON text, and confirm the portfolio and workspace restore the mutated recommendation, overrideJustification, resolved fix state, notes, and Bundled badge, and the next Export preview matches again
- A page reload returns the app to its seeded state: the 12 seeded bundles with their seeded gate results, hero states, fix lists, unset recommendations, empty step notes, no Bundled badges, and closed export and import surfaces
</user_flows>

<edge_cases>
- Filtering the portfolio to a hero-state and gate-status combination matching no bundle shows an empty state naming the active filters with a Clear filters control that restores all rows
- Double-activating a Re-run gate control starts exactly one re-run: one step sequence fills, one publish event lands, and the timeline gains one re-run start entry
- Activating Re-run gate while that gate's re-run is already running leaves the running re-run untouched instead of restarting it
- Filtering the event timeline to an event kind with no entries shows an empty state message in the timeline region rather than a blank area
- Entering trial diff mode and picking the same trial twice is prevented: the second picker excludes the already-picked trial or shows an inline message, and no self-diff renders
- Un-marking the Verdict step done after bundling re-locks the Bundle step and removes its done state while the timeline keeps the historical bundling event
- A fix-item title longer than 80 characters truncates with an ellipsis in the list and shows in full in the item's expanded detail
- The override justification form rejects whitespace-only input with the same inline message as empty input
- A bundle whose fix list is empty (a READY bundle) shows an empty state in the fix-list region stating no fixes are required rather than a blank area
- Importing malformed Review Package JSON or a document that breaks the field contract shows an inline import error, leaves bundle counts and session facets unchanged, and does not update the Export preview as if a successful import occurred
</edge_cases>

<visual_design>
- Layout: the portfolio is a full-width table under a rollup strip and the calibration strip, with Export certification package and Import certification package controls reachable from portfolio chrome; the bundle workspace composes as a persistent header (bundle slug, hero banner, current recommendation, breadcrumb), a left rail with the 5-step stepper, and a main area whose content follows the active step, with the gate board and fix list reachable from the Gate and Resolve steps and the trial inspector filling the main area during Audit
- The export drawer shows format tabs, a scrollable monospaced JSON or Markdown preview, and Copy and Download controls; the import surface uses the same monospaced visual language
- The three verdict hero states use three fixed, distinct treatments applied identically on portfolio rows, workspace headers, and the summary document: a green success treatment for READY FOR THE BENCHMARK, an amber caution treatment for NOT READY — BUT FIXABLE, and a red alarm treatment for AT RISK — MAY NEED A RESTART
- Gate status chips use five distinct treatments — pass green, fail red, errored purple, inconclusive amber, missing gray — identical between portfolio rows, gate cards, the gates table in the summary, and timeline entries
- Fix-list category tags use four distinct treatments for RERUN, FIX, REDESIGN, and TALK-TO-LEAD, consistent between the fix list and the summary document
- Check outcome chips in the trial inspector use distinct pass, fail, and not-applicable treatments, and the valid/invalid trial badges reuse the pass/fail pair
- Thresholds render as reference markers: the 0.80 difficulty bar and 0.90 oracle bar appear beside their measured values with a visible met/missed relationship (the measured value reads as above or below the bar at a glance)
- Typography shows a clear hierarchy: the app title larger than view titles, which are larger than card headings, which are larger than table body and label text, consistent across portfolio and workspace
- Spacing follows a consistent rhythm: gaps between the rollup strip, calibration strip, table, gate cards, panes, and stepper are visually regular with no crowded or orphaned regions
- Buttons, inputs, checkboxes, toggles, and segmented controls show distinct default, hover, focus (visible ring), disabled, and error treatments; disabled recommendations are visibly distinct from enabled ones beyond color alone
- One consistent icon set is used across the toolbar, gate cards, stepper, fix list, timeline, and badges
- The three inspector panes hold a stable three-column composition at desktop width with the criterion list narrower than the reasoning pane, and pane boundaries visibly separated
</visual_design>

<motion>
- Hover animations (required): buttons ease background and shadow with a slight press effect; portfolio rows, gate cards, trial entries, fix items, and timeline entries take a full-width hover wash; form controls show focus rings
- Re-run step statuses animate through the real Re-run control: the running step shows a continuous activity indicator, a completing step's status transitions with a short fade rather than snapping, and the retry backoff countdown ticks visibly
- When a completed re-run flips a gate, the gate card's status chip transitions with a brief emphasis animation and the verdict hero banner cross-fades to its new state rather than snapping
- Checking a fix item animates its resolved treatment (strike or dim eases in), and the allowed-recommendation controls transition their enabled or disabled state with a short fade
- Selecting a criterion in the trial inspector animates the highlight into the reasoning block and answer passages with a short ease rather than an instant jump; moving the selection moves the highlights smoothly
- The stepper's active-step indicator slides between steps, and unlocking a step animates its content in with a short expand
- New timeline entries animate into the list at their position, and portfolio list changes from filtering animate rows in and out rather than snapping
- Modal and drawer surfaces (override justification form, diff-mode picker, export drawer, import surface) enter with a short opacity and scale or slide transition of roughly 200 to 300 milliseconds and exit the same way
- The Copy summary, Copy export, Download, and Import confirmation toasts slide in, remain readable, and auto-dismiss with a fade
- With prefers-reduced-motion set, all transitions apply instantly and no element animates, while every state change still lands
</motion>

<responsiveness>
- At widths of 1024 pixels and below, the trial inspector's three panes reflow to a stacked arrangement with the pane linkage intact (selecting a criterion still scrolls and highlights the other panes)
- At widths of 768 pixels and below, the workspace left-rail stepper collapses to a horizontal compact stepper above the main area, and the portfolio table condenses to per-bundle cards carrying the same hero state, gate chips, and progress indicator
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; wide tables scroll within their own containers
</responsiveness>

<accessibility>
- Every interactive control — portfolio rows and filters, gate cards and evidence links, re-run and retry controls, trial and criterion selectors, diff pickers, fix checkboxes, recommendation controls, the override toggle and form, stepper controls, export and import controls, and the copy, download, and bundling controls — is reachable and operable with the keyboard alone, with a visible focus indicator
- Modals and drawers (override form, diff picker, export drawer, import surface) trap focus while open, close on Escape, and return focus to the control that opened them
- A gate status change from a re-run, the completion of bundling, and a recommendation becoming disallowed are announced through an aria-live region as well as shown visually
- Hero states, gate statuses, check outcomes, and category tags never rely on color alone: each carries a text label or icon in addition to its color treatment
- Form fields have visible labels, and validation messages are associated with their fields so each message names the field it belongs to
- The breadcrumb is a navigation landmark and its segments are links operable by keyboard
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of the app
- The UI stays responsive under rapid repeated input — quick bundle switches, rapid filter toggles, fast criterion selection changes — with no hangs or dropped interactions, including while a re-run simulation is advancing
- Switching between the portfolio and a bundle workspace, or between trials in the inspector, completes without perceptible lag
</performance>

<writing>
- Headings, step names, gate names, and buttons use one consistent capitalization convention throughout, with the fixed verdict and recommendation vocabulary (READY FOR THE BENCHMARK, NOT READY — BUT FIXABLE, AT RISK — MAY NEED A RESTART, APPROVE, APPROVE WITH CAVEATS, MAJOR CHANGES NEEDED, REJECT-ESCALATE) rendered exactly and uppercase wherever it appears
- Action labels are specific verbs such as Re-run gate, Compare trials, Copy summary, Export certification package, Import certification package, Copy, Download, and Complete bundling rather than generic labels
- Gate summaries, reasons, fix-item details, remediations, scoring reasoning, and agent answers read as realistic review prose specific to each seeded bundle — no lorem ipsum, no repeated filler across bundles, no placeholder text anywhere
- The constraint explanation names the actual gates and fix items driving the current rule in plain language, and validation and import errors name the problem and the fix
- Empty states explain what belongs in the region and what action populates it
</writing>

<innovation>
Optional enhancements (nothing here is required for a passing build):
- A reviewer-facing keyboard palette or shortcut layer for moving between gates, trials, and criteria
- A visual mini-map of the gate-to-fix-item-to-recommendation dependency chain that updates live
- A dark color mode toggle covering every view consistently
- A per-bundle review-duration readout derived from the event timeline
</innovation>

<requirements>
Shared application state must live in Zustand (in-memory only): the bundle collection with gate results, trials, checks, criteria, reasoning, and answer texts; re-run step statuses with attempt counts and checkpoints; event timelines and their filters; fix-item resolved flags; recommendations, override state, and justifications; reviewer step done flags and notes; the active bundle, gate, trial, and criterion selection driving the breadcrumb; portfolio filters; export preview text; import draft; and UI chrome. Do not use localStorage, sessionStorage, or other browser storage APIs. Persistence for this genre is the exportable Review Package JSON plus the MCP query surface.
State contracts (behavioral, not storage keys):
- Gate statuses, verdict hero states, the allowed recommendation set, rollup counts, the calibration strip, the Bundle review summary, and the Review Package JSON export are all derived from the same shared evidence and session state — never a second disconnected copy
- Completing a re-run updates the gate, hero banner, fix-list context, recommendation constraint, portfolio row, rollups, timeline, and next export preview from the one store without a reload
- Resolving a fix item, changing a recommendation, or marking a step done updates every surface that displays that fact, including the Bundle summary and Export preview on next render
- Selection state (bundle, gate, trial, criterion) is shared: the breadcrumb, panes, and highlights all derive from it
- Filters and diff mode recompute what is visible from the shared collection; they do not mutate the underlying records
- A successful recommendation or override save creates exactly the request-body shape that appears under that bundle in Review Package JSON; a successful import conforms to the same field contract
Build tooling: Vite SPA. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer. Mantine is the component library for all UI chrome — modals, drawers, steppers, tables, tabs, badges, tooltips, notifications, and form controls; no other component library. Motion for React and AutoAnimate allowed for animation; no other animation libraries. Icons from @tabler/icons-react only, installed via npm — no raw copy-pasted SVG icon sets. All forms — the override justification form, step notes, the import surface, and any filter or picker form — are driven by React Hook Form validating through a Zod schema that models the recommendation/override request-body and Review Package JSON field contracts above: the schema defines the rules and inline per-field errors render before submit; Copy and Download emit text that validates against the same Review Package JSON schema. All libraries installed via npm and bundled locally; no CDN imports. No backend or authentication; gate re-runs are simulated with realistic latency and occasional simulated step failures, and a re-run's published result derives from the simulation so repeated re-runs are not byte-identical.
- Seed 12 review bundles with fictional task slugs, distributed 4 READY FOR THE BENCHMARK, 5 NOT READY — BUT FIXABLE, 3 AT RISK — MAY NEED A RESTART; every bundle seeds six gate results, at least 4 trials per scoring model with all eight named checks scored, at least 6 rubric criteria with scoring reasoning and an agent answer per trial, and every non-READY bundle seeds at least 3 fix items
- Seed ember-relay-router with its Difficulty — Quartz-Mini gate inconclusive on 2 valid trials, and seed the two named stop-early flags on AT RISK bundles
- The scoring models are exactly Sable-4 and Quartz-Mini; no real product, company, or model names appear anywhere in the app
- Zero navigational outbound links for app chrome — in-app controls only; view changes via shared client state
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
- browse-query-v1
- form-workflow-v1
- command-session-v1
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
- Browsable entity: bundles
- Destinations: portfolio; bundle-workspace; gate-board; trial-inspector; fix-list; verdict-panel; bundle-summary; timeline
- Filters: hero-state; gate-plus-status; timeline-event-kind
- Form fields: recommendation; override-justification; step-notes
- Form operations: validate; submit; cancel
- Workflow steps: resolve-fix-item; unresolve-fix-item; select-recommendation; override-constraint; mark-step-done; unmark-step-done; complete-bundling
- Value bounds: hero-state in {READY FOR THE BENCHMARK, NOT READY — BUT FIXABLE, AT RISK — MAY NEED A RESTART}; gate in {Admission, No-op, Oracle, Difficulty — Sable-4, Difficulty — Quartz-Mini, Analysis}; gate status in {pass, fail, errored, inconclusive, missing}; recommendation in {APPROVE, APPROVE WITH CAVEATS, MAJOR CHANGES NEEDED, REJECT-ESCALATE}; only the currently allowed set is selectable, and an out-of-set choice requires the override toggle plus a justification of at least 20 characters; fix-item category in {RERUN, FIX, REDESIGN, TALK-TO-LEAD}; reviewer steps in {Resolve, Gate, Audit, Verdict, Bundle}; a step can be marked done only when every earlier step is done, and Complete bundling only when Verdict is done with a recorded recommendation; validity checks in {answer-determinacy, runtime-evidence-used, grounded-in-trajectory, comprehensiveness-near-miss, difficulty-crux, honest-uncertainty, refusals, low-timeout}; judge models limited to Sable-4 and Quartz-Mini; seeded slugs include ember-relay-router, juniper-lint-fixer, drift-ledger-repair; gate evidence is read-only: no tool edits a gate's score, status, reasons, or evidence text
- Session operations: start; pause; resume
- Demos: gate-re-run; re-run-step-retry
- Artifact operations: copy
- Export formats: review-summary-text
- Workflow completion: a completed re-run of ember-relay-router's Difficulty — Quartz-Mini gate leaves inconclusive (gathering additional valid trials) and recomputes the verdict hero banner, allowed recommendation set, constraint explanation, portfolio row gate chip and hero state, rollup counts, and calibration strip without a reload
- Workflow completion: resolving or unresolving a fix item immediately recomputes the allowed recommendation set and its plain-language explanation; a REDESIGN item's resolution updates the hero banner and portfolio row
- Workflow completion: marking a step done unlocks the next step and updates the portfolio review-progress indicator; un-marking re-locks all later steps while preserving their notes
- Workflow completion: complete bundling appends a timestamped bundling event to the timeline and flips the portfolio row to show the Bundled badge
- Workflow completion: the Bundle review summary reflects current gates, recommendation with override justification, fix list, and step notes at render time
- Workflow completion: turning the override toggle off with an out-of-set recommendation saved reverts the recommendation to unset and removes the Override badge
- Workflow completion: copy summary shows a visible confirmation

Mechanics exclusions:
- Trial diff-mode picking, trial and criterion selection, and the three-pane criterion-to-reasoning-to-answer highlight linkage are graded through the visible selectors and breadcrumb and stay Playwright-driven
- Gate status-chip emphasis animation, verdict hero banner cross-fade, and stepper active-indicator slide stay Playwright-observed
- Re-run running activity indicator, retry backoff countdown ticks, and step status fades stay Playwright-observed
- Modal and drawer enter/exit transitions and copy toast timing stay Playwright-observed
- Clipboard contents remain a Playwright responsibility

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
