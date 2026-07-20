<summary>
Build a seed dataset studio — an operator console for a code-question dataset factory that turns mined bug reports into a benchmark dataset of codebase-investigation questions — using Svelte 5, runes-based stores, Tailwind CSS 4.3.2, and shadcn-svelte. The app produces the operator's portable dataset artifacts: a downloadable PackageManifest JSON per authored seed, a DatasetSnapshot JSON of live rollups, and a DatasetStudioPackage JSON that round-trips through Import, all compiled live from session state and conforming to the same API-shaped field contracts as the triage and authoring forms.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Seed queue —
- On first load the queue view shows a seeded in-memory manifest of at least 60 seeds spanning exactly these 6 fictional repositories and their languages: quartz-orm (TypeScript), copperline (Go), lattice-db (Rust), brineworks (Python), fernwheel (Ruby), and ashgrid (Java); a visible total count states the number of seeds
- Each queue row shows the seed id in the pattern repo-kind-number (for example quartz-orm-issue-142), the repository name, the language, the kind (issue or pr), the seed title, a status badge (draft, authored, rejected, or harvest-pending), and a difficulty badge (hard or unset)
- The seed quartz-orm-issue-142 is present on first load with the title Connection pool exhausts when nested transactions roll back, status draft, kind issue, difficulty unset, deference profile premise-acceptance, and failure model wrong-answer
- On first load the status distribution includes at least 24 draft, at least 14 authored, at least 10 rejected, and at least 6 harvest-pending seeds, all reachable in the queue by scrolling or by applying the matching status filter
- Every seed carries a pinned commit: the row shows the first 10 characters of a 40-character lowercase hexadecimal commit hash, and the seed detail surface shows the full 40-character hash with a copy control that puts the full hash on the clipboard and confirms visibly
- Every seed carries a deference profile (premise-acceptance, happy-path-bias, or boundary-violation) and a failure model (wrong-answer, no-runtime-evidence, missing-incomplete-info, or off-target), both visible on the seed detail surface; rejected seeds additionally show their reject class
- Scrolling the queue through all 60 or more rows stays smooth, and row rendering keeps up with fast scrolling with no blank stalls or layout jumps
- Filter controls narrow the queue by status, language, repository, and difficulty; active filters combine (a status filter plus a language filter shows only seeds matching both) and each active filter is visibly indicated
- A search field narrows the visible rows incrementally to seeds whose id or title matches the typed text; clearing the search restores the previous filtered set exactly
- Clicking a sortable column header (id, repository, language, status, or title) sorts the queue ascending; clicking the same header again sorts descending, reversing the order relative to ascending
- A Save filter control stores the currently applied filter and search combination as a named chip in a chip row above the table; clicking a saved chip re-applies exactly that combination, and a remove control on the chip deletes it
- A visible count of matching seeds updates whenever filters, search, or triage actions change the matching set, and an active-filters summary offers a single Clear all control that restores the full queue

Feature: Stats rollup panel —
- A rollup panel beside or above the queue shows live counts of seeds by status (draft, authored, rejected, harvest-pending), by language, and by repository, plus a breakdown of rejected seeds by reject class
- Every rollup figure derives from the same data as the queue: any triage action, authoring transition, or export that changes a seed's status changes the corresponding rollup counts in the same interaction with no reload
- Clicking a rollup cell (for example the authored count for lattice-db) navigates to the queue with the matching filters applied, and the visible rows agree with the number on the cell that was clicked

Feature: Triage (API-shaped RejectSeed) —
- Selecting a draft seed and choosing Accept for authoring moves its status from draft to authored-track work: the seed opens in the authoring workbench and its status chip changes out of draft
- Choosing Reject on a draft seed opens a reject form that submits exactly a RejectSeed payload; the record a successful reject produces IS the would-be reject API request body. RejectSeed field contract (all keys required unless marked optional; example values illustrative only): rejectClass (required closed enum string, exactly one of duplicate-report, insufficient-signal, environment-specific, ambiguous-report, trivial-fix), justification (required trimmed string, minimum 20 characters). Submit stays disabled until both fields are valid; an empty rejectClass or a justification shorter than 20 characters shows an inline validation message naming the offending field and changes no seed
- Submitting a valid rejection sets the seed's status to rejected, shows the chosen rejectClass on the seed, decrements the draft rollup count by one, and increments both the rejected rollup count and that class's breakdown figure by one
- Checkboxes on queue rows enable multi-select; a selection toolbar appears showing the selected count, with batch Accept and batch Reject actions
- Batch Reject submits a BatchRejectSeed payload through the same validated form shape: rejectClass and justification matching the RejectSeed field contract, applied to every selected seed; on submit, all selected seeds change status in one update and the rollup counts change by exactly the selection size in the same interaction
- An Undo control appears after any triage action (single or batch) and reverses exactly the last triage action: the affected seeds return to their prior status and every rollup figure returns to its prior value

Feature: Authoring workbench (API-shaped PositiveCriterion, NegativeCriterion, FoilUpsert) —
- Opening a seed in the workbench shows a multi-pane editor with panes for the question, the positive rubric, the negative rubric, the foils, and the golden answer, all scoped to that seed, with the seed id, repository, language, and pinned commit visible in the workbench header
- The question pane holds the investigation question text (multiline, required trimmed string of at least 1 character when Mark authored is attempted) and an under-specification checklist of at least 4 items (such as confirming the question names no file paths, quotes no code, reveals no fix, and states the observable symptom); each item can be checked and unchecked and the checklist state is kept per seed
- The positive rubric pane lists criteria numbered 1.1 through 1.5 on first open; each row edits a PositiveCriterion payload (the record IS the would-be criterion upsert body). PositiveCriterion field contract (all keys required; example values illustrative only): id (required string matching the 1.x numbering such as 1.2), name (required trimmed string, 1 to 80 characters), weight (required number from 0.5 to 5 inclusive), description (required trimmed string, 1 to 2000 characters). Each field is editable and edits persist when switching panes and returning; empty name or description or a weight outside 0.5 to 5 shows an inline message naming the field
- Criterion 1.4 is a locked runtime-evidence gate requiring the answer to cite evidence from executing the code at the pinned commit: its row shows a lock indicator, it has no working delete affordance, and attempting to remove it leaves it in place with an explanatory message
- Positive criteria other than 1.4 can be added and deleted; adding continues the 1.x numbering at the next free number and deleting any unlocked criterion removes exactly that row
- The negative rubric pane lists 2.x criteria that describe answers that must fail; each row edits a NegativeCriterion payload. NegativeCriterion field contract (all keys required): id (required string matching the 2.x numbering), name (required trimmed string, 1 to 80 characters), class (required closed enum string, exactly one of false-premise-acceptance, fabricated-symbol, wrong-subsystem), description (required trimmed string, 1 to 2000 characters). Entries can be added, edited, and deleted, and each entry visibly indicates that matching it counts against the answer; a class outside the closed enum is not selectable
- The foils pane lists deliberately wrong answers; adding or editing a foil submits a FoilUpsert payload (the record IS the would-be foil API request body). FoilUpsert field contract (all keys required; example values illustrative only): answerText (required trimmed string, 1 to 4000 characters), failureMode (required closed enum string, exactly one of wrong-answer, no-runtime-evidence, missing-incomplete-info, off-target), expectsFailIds (required array of one or more strings, each limited to the seed's current rubric criterion ids), correctnessCap (required number between 0 and 40 inclusive). Empty answerText, a failureMode outside the enum, an empty expectsFailIds array, or a correctnessCap outside 0 to 40 shows an inline message naming the offending field and leaves the foil list unchanged
- The foil editor's expects-fail options update live with the rubric: adding rubric criterion 1.6 makes 1.6 immediately selectable on every foil, and deleting a criterion that a foil references flags that foil with a visible warning naming the missing id until the reference is removed or remapped
- Clicking an expects-fail id chip on a foil highlights or scrolls to that criterion in the rubric pane, and each 2.x negative criterion links back to any foils that reference it
- The golden answer pane holds either the golden answer text or a harvest-pending state; switching to harvest-pending submits a HarvestPendingJustification payload. HarvestPendingJustification field contract (all keys required): justification (required trimmed string, minimum 20 characters). An empty or short justification shows an inline message naming the justification field and leaves the golden pane unchanged; a valid justification is displayed with the pending state
- A Run harvest control in the golden pane starts a simulated harvest decomposed into exactly these 5 named steps: clone at pinned commit, install dependencies, reproduce failure, capture runtime evidence, and distill golden answer; each step advances visibly through pending, running, and complete or failed
- Occasional simulated harvest failures retry automatically with a visible attempt counter (such as retry 2 of 3) and a backoff countdown; a step that exhausts its retries is marked failed with an inline error summary and a manual Retry control that resumes from that step with earlier steps' outputs unchanged
- A running harvest can be paused and resumed: pausing freezes progression at the current step and resuming continues from exactly that step; completed steps keep their original timestamps and never re-execute
- A harvest that completes all 5 steps fills the golden answer pane with a generated answer draft and clears the harvest-pending state; the seed's timeline records the harvest completion
- Saving the workbench shows a visible save confirmation, updates the seed's row in the queue (title edits appear in the queue row), and records an authoring-save event on the seed's timeline

Feature: Package gate and lifecycle —
- A gate banner in the workbench continuously shows whether the seed can reach authored status; while any condition is unmet the banner names each unmet condition individually: question text present, at least 3 foils, every foil expects-fail id resolves to an existing criterion, and golden answer present or harvest-pending justified
- The gate banner updates in the same interaction that changes its inputs: adding the third foil, filling the question, justifying harvest-pending, or fixing a dangling expects-fail reference each removes exactly its named condition from the banner without a save or reload
- A Mark authored control is disabled while the gate lists any unmet condition and enabled when all conditions pass; activating it sets the seed's status to authored, updates its queue badge and the rollup counts, and stamps a status transition on the timeline
- Every seed has an event timeline listing its lifecycle in order with timestamps: status transitions, authoring saves, harvest events, and exports; a filter narrows the timeline by event type and an empty filtered timeline shows an explanatory empty state

Feature: Export center and schema-mirrored artifacts (API-shaped PackageManifest, DatasetSnapshot, DatasetStudioPackage) —
- The app produces the operator's dataset artifacts: an Export package action on an authored seed opens an Export center with three live-derived format tabs — package manifest JSON, dataset snapshot JSON, and dataset studio package JSON — regenerated from the current store without a reload; authoring edits, triage, and rollup changes update the previews
- PackageManifest JSON field contract (Copy, Download, and the package-manifest tab conform; field names and enum values are visible in the JSON preview text; all keys and nesting REQUIRED unless marked optional; example values illustrative only): schemaVersion (required string exactly seed-package-manifest-v1), seedId (required string), repository (required string, exactly one of quartz-orm, copperline, lattice-db, brineworks, fernwheel, ashgrid), pinnedCommit (required string of exactly 40 lowercase hexadecimal characters), language (required string), kind (required closed enum string, exactly one of issue, pr), title (required trimmed string), difficulty (required closed enum string, exactly one of hard, unset), deferenceProfile (required closed enum string, exactly one of premise-acceptance, happy-path-bias, boundary-violation), failureModel (required closed enum string, exactly one of wrong-answer, no-runtime-evidence, missing-incomplete-info, off-target), questionText (required trimmed string), positiveCriteria (required array of PositiveCriterion objects matching the authoring field contract), negativeCriteria (required array of NegativeCriterion objects matching the authoring field contract), foils (required array of FoilUpsert objects matching the authoring field contract), goldenAnswer (required object with keys status and value — status is exactly one of present or harvest-pending; when status is present, value is the golden answer text; when status is harvest-pending, value is the justified HarvestPendingJustification text). Every required key above is visible in the JSON preview
- DatasetSnapshot JSON field contract (Copy, Download, and the snapshot tab conform; all keys and nesting REQUIRED; example values illustrative only): schemaVersion (required string exactly dataset-snapshot-v1), totalSeeds (required integer matching the visible total count), byStatus (required object with integer keys draft, authored, rejected, harvest-pending matching the rollup panel), byLanguage (required object of language-to-count integers matching the rollup), byRepository (required object of repository-to-count integers matching the rollup), rejectedByClass (required object of reject-class-to-count integers matching the rollup breakdown), generatedAt (required ISO-8601 datetime ending in Z)
- DatasetStudioPackage JSON field contract (Copy, Download, and Import all conform to this same shape; all keys and nesting REQUIRED; example values illustrative only): schemaVersion (required string exactly seed-dataset-studio-v1), studio (required string exactly Seed Dataset Studio), packages (required array of PackageManifest objects for every seed currently in authored status, each conforming to the PackageManifest field contract including schemaVersion seed-package-manifest-v1), snapshot (required DatasetSnapshot object conforming to the DatasetSnapshot field contract including schemaVersion dataset-snapshot-v1), generatedAt (required ISO-8601 datetime ending in Z)
- Edits made in the workbench before exporting appear verbatim in the package-manifest and studio-package previews: renaming criterion 1.2 or editing a foil's correctnessCap changes the corresponding fields on the next export with no stale values; an export that omits a session mutation is invalid
- Each format offers Copy (writes the exact preview text to the clipboard with visible confirmation such as an icon swap or toast) and Download (triggers a real file download of that format)
- Completing an export of a package manifest stamps an export event with a timestamp on that seed's timeline, and the export view names the seed id it was generated from

Feature: Import package round-trip —
- An Import control accepts a previously exported DatasetStudioPackage JSON (file pick or paste). A valid import that conforms to the DatasetStudioPackage field contract replaces the in-memory authored package contents for every seedId present in packages so the workbench panes, queue authored badges for those seeds, rollup figures implied by the imported snapshot, and a fresh export match the imported document without a reload
- Import rejects non-conforming payloads without mutating the studio: malformed JSON, missing required schemaVersion/studio/packages/snapshot/generatedAt keys, schemaVersion not exactly seed-dataset-studio-v1, studio not exactly Seed Dataset Studio, a packages element that fails the PackageManifest field contract, or a snapshot that fails the DatasetSnapshot field contract shows a visible validation message naming the offending field (or that the package is invalid) and leaves the session unchanged
- Exporting then re-importing a DatasetStudioPackage reconstructs the same authored package field values and snapshot counts; an export that omits session mutations or fails the field contract is incorrect
</core_features>

<user_flows>
- Triage to authored, end to end: filter the queue to draft quartz-orm seeds, open quartz-orm-issue-142, accept it into the workbench, write the question, keep the 1.1 to 1.5 rubric with 1.4 locked, add one 2.x negative criterion matching the NegativeCriterion field contract, add 3 foils matching the FoilUpsert field contract whose expectsFailIds resolve, run the harvest to completion so the golden pane fills, watch the gate banner empty as each condition is met, mark the seed authored, and confirm the queue badge, the draft and authored rollup counts, and the timeline's transition entry all changed in the same session without a reload
- Export closes the loop: after marking a seed authored, open Export center, confirm the package-manifest tab shows schemaVersion exactly seed-package-manifest-v1 with seedId, repository, pinnedCommit, positiveCriteria, negativeCriteria, foils, and goldenAnswer from the PackageManifest field contract carrying the exact question, criterion, foil, and golden values just authored; confirm the snapshot tab shows schemaVersion exactly dataset-snapshot-v1 with byStatus counts matching the rollup panel figure for figure; confirm the studio-package tab shows schemaVersion exactly seed-dataset-studio-v1, studio exactly Seed Dataset Studio, packages, snapshot, and generatedAt; Download or Copy the active format with visible confirmation, and confirm the seed's timeline gains an export entry
- Import round-trip flow: after exporting a DatasetStudioPackage that includes a session-authored seed, diverge the studio by editing that seed's question or foil cap, Import the JSON, and confirm the workbench fields, authored package values, and a fresh export reconstruct to match the imported package
- Batch rejection with recovery: multi-select at least 3 draft seeds, batch reject them with rejectClass insufficient-signal and one justification of at least 20 characters, confirm the rejected rollup and the insufficient-signal breakdown each grew by the selection size while draft shrank by the same amount, then activate Undo and confirm every affected seed and every rollup figure returns to its prior value
- Cross-link navigation: from a rollup cell click through to the filtered queue and confirm the row count matches the cell figure; from a foil's expects-fail chip jump to its criterion in the rubric pane; delete that criterion and confirm the foil immediately shows a dangling-reference warning naming the id and the gate banner gains the unresolved-reference condition
- Dangling-reference repair: with a foil flagged for a deleted criterion, remap the foil's expectsFailIds selection to an existing id and confirm the warning clears and the gate banner condition disappears in the same interaction, then mark the seed authored
- A page reload returns the app to its seeded state: the seeded manifest with its original statuses and counts, the default queue view, no saved filter chips, and no in-progress harvests
</user_flows>

<edge_cases>
- Filtering to a combination matching no seeds shows an empty state in the table region naming the active filters, with a Clear all control that restores the full queue
- Double-activating Mark authored transitions the seed exactly once: the authored rollup count increases by exactly one and the timeline gains exactly one transition entry
- Double-activating Run harvest starts exactly one harvest: the step list fills once and the timeline gains one harvest sequence
- Deleting every foil on a seed that previously passed the gate re-disables Mark authored and returns the at-least-3-foils condition to the gate banner
- A seed title longer than 80 characters is truncated with an ellipsis in the queue row and shown in full in the workbench header
- Undo is available for the last triage action only: after a new triage action, Undo reverses the newest action, and a second Undo without an intervening action makes no further change
- Rejecting the seed currently open in the workbench closes or visibly disables its authoring panes and shows its rejected state with the chosen rejectClass
- Filtering a seed's timeline to an event type with no entries shows an empty state message in the timeline region rather than a blank area
- Submitting RejectSeed, FoilUpsert, or HarvestPendingJustification with invalid fields — empty rejectClass, justification shorter than 20 characters, empty answerText, correctnessCap outside 0 to 40, or empty expectsFailIds — shows inline messages naming those fields and mutates no seed
- Importing malformed DatasetStudioPackage JSON shows an inline parse error naming the import problem and leaves the studio unchanged
- Importing parseable JSON that fails the DatasetStudioPackage field contract — missing required schemaVersion/studio/packages/snapshot/generatedAt keys, schemaVersion not exactly seed-dataset-studio-v1, studio not exactly Seed Dataset Studio, a PackageManifest that fails its field contract, or a DatasetSnapshot that fails its field contract — leaves the studio unchanged and shows validation naming the offending field
- Export center with zero authored seeds still opens and shows a studio-package preview that includes schemaVersion seed-dataset-studio-v1, studio exactly Seed Dataset Studio, an empty packages array, and a valid snapshot rather than crashing; Download and Copy remain available
</edge_cases>

<visual_design>
- Layout: a full-height studio shell with a compact top bar carrying the app name, the view switcher (Queue and Workbench), and global actions; the queue view composes as the stats rollup panel on top or at the left, the saved-chip and filter row beneath it, and the seed table filling the remaining space; the workbench composes as a header strip with the seed identity plus gate banner and a multi-pane body with the question and rubric panes beside the foils and golden panes
- Status badges use one fixed mapping everywhere they appear: draft in neutral slate, authored in green, rejected in red, and harvest-pending in amber; the same colors carry into the rollup panel and timeline entries
- The difficulty badge for hard uses a distinct violet treatment, and unset difficulty renders as a muted outline badge rather than nothing
- Seed ids, commit hashes, and the Export center preview text (package manifest, snapshot, and studio package) render in a monospaced face, visually distinct from the interface sans-serif; all other UI text uses the sans-serif with a clear hierarchy of app title above pane headings above table body and label text
- Export center presents format tabs and a monospace code preview with Copy and Download; Import sits as a clear companion control rather than a buried secondary action
- The locked criterion 1.4 row carries a visible lock icon and a subtly different background from unlocked rows so its protected state reads at a glance
- Foil warning states for dangling expects-fail references use the same amber warning treatment as harvest-pending, distinct from red rejection states
- The gate banner renders unmet conditions as individual labeled items with an unmet indicator, switching to a distinct all-clear treatment when every condition passes
- Spacing follows a consistent rhythm: table rows share one height, pane paddings are visually regular, and the rollup, filter row, and table gaps are even with no crowded or orphaned regions
- Buttons, inputs, selects, checkboxes, and chips show distinct default, hover, focus (visible ring), disabled, and error treatments
- One consistent icon set is used throughout the top bar, status badges, triage actions, harvest steps, and timeline entries
</visual_design>

<motion>
- Queue rows animate on triage: an accepted or rejected row's status chip transitions with a short color-and-scale change rather than snapping, and batch-rejected rows update with a brief stagger rather than simultaneously
- Adding or deleting a rubric criterion or a foil animates the list: the new row eases in and a removed row collapses out rather than the list jumping
- The gate banner animates condition changes: a satisfied condition fades or slides out of the unmet list and the all-clear state eases in rather than flashing
- Harvest step statuses animate during a real run: the running step shows a continuous activity indicator, a completing step transitions with a short fade, and the retry countdown ticks visibly
- Hover animations (required): buttons ease background and shadow with a slight press effect; queue rows, rollup cells, chips, and timeline entries take a full-width or full-cell hover wash; form controls show focus rings
- The reject form and any confirmation dialogs enter with a short opacity and scale transition of roughly 200 to 300 milliseconds and exit the same way
- Switching between Queue and Workbench transitions the views with a brief crossfade or slide rather than an instant swap, without a full page reload
- Copy confirmations (commit hash, manifest, snapshot) animate in — an icon swap or toast that eases in, remains readable, and auto-dismisses with a fade
- Clicking an expects-fail chip animates attention to the linked criterion (a highlight pulse or smooth scroll) rather than teleporting silently
- With prefers-reduced-motion set, list, banner, badge, and view transitions apply instantly and the harvest indicators change state without animation
</motion>

<responsiveness>
- At widths of 1024 pixels and below the workbench panes stack vertically in the order question, rubric, foils, golden, each keeping its full controls; at desktop widths at least two panes render side by side
- At widths of 768 pixels and below the stats rollup collapses to a horizontally scrollable strip and the queue table hides the deference and commit columns behind the seed detail surface, keeping id, title, status, and difficulty visible
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; the seed table and the manifest text scroll within their own containers
</responsiveness>

<accessibility>
- Every interactive control — queue rows and their checkboxes, column headers, filter and chip controls, triage and batch actions, workbench fields, harvest controls, copy and download controls, Import, and timeline filters — is reachable and operable with the keyboard alone, with a visible focus indicator
- The reject form, Import surface, and confirmation dialogs trap focus while open, close on Escape, and return focus to the control that opened them
- Status changes from triage, gate passage (all conditions met), harvest completion, and a harvest step entering the failed state are announced through an aria-live region as well as shown visually
- Form fields across the RejectSeed form, FoilUpsert and criterion editors, harvest justification, and Import paste when presented as a form have visible labels, and validation messages are associated with their fields so each message names the field it belongs to
- Status and difficulty badges convey their meaning with text, not color alone, and the locked state of criterion 1.4 is exposed to assistive technology, not only as an icon
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load with all 60 or more seeds present
- No console errors or warnings appear on load or during a full exercise of the app, including export, import, and download
- The UI stays responsive under rapid repeated input — fast filter toggles, rapid sort clicks, quick pane switches, and repeated batch selections — with no hangs or dropped interactions, including while a harvest simulation is running
</performance>

<writing>
- All interface copy uses one consistent capitalization convention across headings, buttons, badges, and pane titles
- Action labels are specific verbs — Accept for authoring, Reject seed, Run harvest, Mark authored, Export package, Copy manifest, Download manifest, Import package — never bare generic labels where a specific one is possible
- Validation, gate, and import messages name the exact field or condition and what satisfies it, including field-contract rules such as the 20-character justification minimum, correctnessCap bounds, schemaVersion, and studio name
- Seeded titles, questions, criteria, and foil texts read as realistic engineering prose about the fictional repositories with no placeholder text, lorem ipsum, or template variables anywhere in the UI
- The same concepts keep the same names everywhere: seed, foil, criterion, golden answer, harvest, reject class — never a synonym in one pane and a different one in another
</writing>

<innovation>
Optional enhancement space; nothing here is required for a passing build:
- A dataset health view that charts status distribution over the session or flags repositories with skewed reject rates
- Keyboard-first triage: single-key accept/reject with an on-screen shortcut reference
- A diff-style preview showing what changed in the manifest since the seed's previous export
- Configurable studio theme or density mode beyond the base requirement
</innovation>

<requirements>
Shared application state must live in Svelte 5 runes-based stores (in-memory only): the seed manifest with per-seed status, difficulty, deference profile, failure model, reject class, and pinned commit; queue filters, search, sort, saved filter chips, and multi-select; the stats rollup inputs; the last triage action for undo; per-seed authoring packages (question text, under-specification checklist, positive and negative rubric criteria, foils with expects-fail references and caps, golden answer or harvest-pending state); harvest run state with step statuses, attempt counts, and checkpoints; per-seed event timelines and their filters; gate condition results; export preview text for all three formats; the active view; and UI chrome. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Triaging a seed (single or batch) updates its queue row, the rollup counts, and its timeline from the same shared state in one interaction; Undo restores exactly the prior state of all three
- Authoring edits update the workbench panes, the gate banner, the queue row, and the next export's PackageManifest and DatasetStudioPackage text from the same shared package state; deleting a criterion immediately re-derives foil reference warnings and gate conditions
- Advancing a harvest step updates the step list, the golden pane, and the timeline from the same shared run state; pausing and resuming preserve completed steps' outputs and timestamps
- Filters, search, sort, saved chips, and rollup cell click-throughs recompute the visible queue from the shared manifest; they do not create a second disconnected copy
- PackageManifest, DatasetSnapshot, and DatasetStudioPackage are derived text: they are generated from the live stores at the moment of export and never from prewritten strings
- The active view and selection are shared client state; switching views does not reload the document
- End-state contract: Download and Copy of PackageManifest, DatasetSnapshot, and DatasetStudioPackage MUST reflect the session's actual mutations under the field contracts above — an export that omits session work or fails the contracts is invalid; Import of a previously exported DatasetStudioPackage MUST restore the same visible authored packages and snapshot counts (round-trip). Persistence for this good-app genre is the portable DatasetStudioPackage plus the MCP query surface — never browser storage
Build tooling: Vite with the Svelte 5 plugin as an SPA. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer. shadcn-svelte is the component library for all UI chrome — dialogs, selects, checkboxes, badges, tables, tabs, toasts, and form controls; no other component library. svelte-motion and AutoAnimate allowed for animation; no other animation libraries. Icons from phosphor-svelte only, installed via npm — no raw copy-pasted SVG icon sets. All forms — the RejectSeed and BatchRejectSeed forms, the PositiveCriterion, NegativeCriterion, and FoilUpsert editors, the HarvestPendingJustification form, and Import package when presented as a form — are driven by TanStack Form for Svelte validating through Zod schemas: schemas are API-shaped and mirror the RejectSeed, PositiveCriterion, NegativeCriterion, FoilUpsert, HarvestPendingJustification, PackageManifest, DatasetSnapshot, and DatasetStudioPackage field contracts above (the record each form creates IS the would-be request body; exports and Import conform to those same contracts). Inline per-field errors render before submit; submit stays disabled while required fields are invalid. All libraries installed via npm and bundled locally; no CDN imports. No backend or authentication; the harvest is simulated with realistic latency and occasional simulated step failures, so two harvests of the same seed produce different (not identical) step timings and generated drafts.
- Seed at least 60 seeds across the 6 named repositories and languages with the status distribution stated in the queue feature, including the named seed quartz-orm-issue-142, so the queue, rollup panel, and at least one authored package are non-empty on first load; every seeded authored package conforms to the PackageManifest field contract shape
- Every seeded commit hash is exactly 40 lowercase hexadecimal characters and unique per seed
- Submitting any form with invalid fields, and importing a non-conforming DatasetStudioPackage, must not change any seed; show visible validation feedback
- The exportable end state is the DatasetStudioPackage JSON (with PackageManifest and DatasetSnapshot companions) compiled live from the session; packages must conform to the declared field contracts
- Zero navigational outbound links for app chrome — in-app controls only; view changes via shared client state
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
- Self-test tooling is preinstalled: the same CDP bridge the verifier runs is baked at `/opt/webmcp/webmcp_stdio_server.mjs`, and a shared headless Chrome already exposes CDP at `http://127.0.0.1:9222`. Open your served app in that Chrome, then run `node /opt/webmcp/webmcp_stdio_server.mjs` (stdio MCP; defaults to that endpoint) to exercise your registered `window.webmcp_*` tools exactly as the verifier will.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- structured-editor-v1
- form-workflow-v1
- command-session-v1
- artifact-transfer-v1

Module specs:
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
- Editor object types: question; under-specification-checklist-item; positive-criterion; negative-criterion; foil; golden-answer
- Editor operations: select; add; delete; update_property; set_content
- Editor properties: question-text; checklist-item-checked; criterion-name; criterion-weight; criterion-description; negative-criterion-class; foil-answer-text; foil-failure-mode; foil-expects-fail-ids; foil-correctness-cap; golden-answer-text; seed-title
- Form fields: reject-class; reject-justification; batch-reject-class; batch-reject-justification; harvest-pending-justification
- Form operations: validate; submit; cancel
- Workflow steps: accept-for-authoring; reject-seed; batch-reject; undo-triage; mark-authored; export-package
- Value bounds: reject-class in {duplicate-report, insufficient-signal, environment-specific, ambiguous-report, trivial-fix}; negative-criterion-class in {false-premise-acceptance, fabricated-symbol, wrong-subsystem}; foil-failure-mode in {wrong-answer, no-runtime-evidence, missing-incomplete-info, off-target}; foil-correctness-cap between 0 and 40 percent; reject and harvest-pending justifications minimum 20 characters; foil expects-fail ids limited to the seed's current rubric criterion ids; criterion 1.4 runtime-evidence gate is locked: delete attempts are refused in place with an explanatory message; mark-authored allowed only when the gate passes: question text present, at least 3 foils, every expects-fail id resolves, golden answer present or harvest-pending justified; seeds limited to the 6 seeded repositories quartz-orm, copperline, lattice-db, brineworks, fernwheel, ashgrid; named seed quartz-orm-issue-142 present on first load
- Session operations: start; pause; resume
- Demos: harvest-run; harvest-step-retry
- Artifact operations: export; copy
- Export formats: package-manifest-json; dataset-snapshot-json; commit-hash
- Workflow completion: triage (single or batch) updates the seed's queue status badge, the rollup counts by exactly the selection size, and the seed timeline in one interaction; undo restores all three to their prior values
- Workflow completion: gate banner adds or removes exactly the named unmet condition in the same interaction that changes its input, with no save or reload
- Workflow completion: adding rubric criterion 1.6 makes 1.6 immediately selectable in every foil's expects-fail options; deleting a referenced criterion flags the foil with a dangling-reference warning naming the missing id
- Workflow completion: a harvest completing all 5 steps (clone at pinned commit, install dependencies, reproduce failure, capture runtime evidence, distill golden answer) fills the golden pane, clears harvest-pending, and stamps a harvest completion on the timeline
- Workflow completion: export manifest text mirrors live workbench edits verbatim, the dataset snapshot counts match the rollup panel figure for figure, and the export stamps a timeline event
- Workflow completion: copy confirmations appear after the full 40-character commit hash, manifest, and snapshot copy controls

Mechanics exclusions:
- Queue filtering, incremental search, sort-toggle on column headers, saved filter chips, and rollup cell click-throughs are themselves graded behaviors driven through the visible controls and stay Playwright-driven
- Triage status-chip color-and-scale transition and batch-reject row stagger stay Playwright-observed
- Rubric/foil list enter and collapse animations and gate banner condition fade/slide stay Playwright-observed
- Harvest running activity indicator, retry backoff countdown ticks, and step fade timing stay Playwright-observed
- Queue/Workbench view crossfade and expects-fail chip highlight pulse or smooth scroll stay Playwright-observed
- File picker interaction, clipboard contents, and copy toast animation remain Playwright responsibilities

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
