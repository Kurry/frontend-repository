<summary>
Build a stage-gate acceptance console for a benchmark build pipeline using Svelte 5, Svelte stores (runes-based), Tailwind CSS 4.3.2, and shadcn-svelte. The app produces the operator's acceptance package: a structured Acceptance Package JSON (plus a Certificate Chain markdown report) compiled live from the selected run's recorded gate results, certificates, notes, and timeline, downloadable and copyable, reflecting every session mutation.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Run list and stage strip —
- The app opens into a run list seeded with at least 6 pipeline runs; every seeded run is visible without pagination, and each run row shows a run identifier, a submitted-at label, and a stage strip of exactly 5 named stages in fixed order: Source, Build, Test Generation, Hardening, Publish
- Each stage segment in the strip is colored by its status (passed, rejected, running, or pending), and a visible legend explains the status colors; the seeded runs include at least one fully passed run, at least one run with a rejected intermediate stage, and at least one run with pending stages
- Clicking a run row opens that run's detail view without a full page reload, and the selected row stays visibly highlighted in the list

Feature: Stage detail and gate suite —
- Clicking a stage segment inside a run's detail opens that stage's gate suite as a checklist of 6 to 10 gates; each gate row shows a gate identifier, a human-readable gate name, a severity chip reading S1, S2, or S3, and a pass or fail state
- Activating a gate row expands an evidence detail string beneath that row and rotates the row's chevron; activating it again collapses it; more than one row can be expanded at the same time
- S1 gates are hard gates: when any S1 gate in a stage's recorded results is failed, that stage is marked rejected regardless of the suite's aggregation mode, and a rejection banner at the top of the stage detail names every failing hard gate by identifier and name
- Each gate suite displays its aggregation mode — required-pass, all-pass, or weighted-mean — next to a computed suite outcome; weighted-mean suites additionally show the computed percentage score; the outcome always derives from the gate states currently shown

Feature: What-if mode —
- A what-if toggle inside stage detail enters a simulation mode announced by a clearly visible what-if banner; while it is on, clicking a gate's pass/fail state flips a simulated value for that gate, and every gate whose simulated value differs from its recorded value carries a visible simulated marker on its row
- Flipping simulated gate states recomputes the displayed suite outcome, percentage score, and stage status immediately, without a reload
- A revert control exits what-if mode and restores every gate row, the suite outcome, and the stage status to the recorded results exactly; leaving and re-entering the stage always shows the recorded results, never a leftover simulated value

Feature: Certificates and chain —
- Every passed stage exposes a certificate view showing the stage name, the full list of gate results, a fictional fingerprint hash string, and an issuance timestamp
- The run detail includes a chain visualization linking the run's 5 stage certificates in pipeline order; for a run whose intermediate stage failed, the chain renders a visibly distinct break at the failed stage and the downstream links render as broken or pending, not as intact links
- A copy control beside the fingerprint places the exact hash text on the clipboard and shows a visible confirmation (icon swap or toast) that resets after a moment

Feature: Gate registry browser —
- A registry view lists every gate used across all suites, each with its identifier, name, severity chip, and a one-line description
- A severity filter narrows the registry to S1, S2, or S3 gates; clearing the filter restores the full list exactly; when a filter matches nothing the registry region shows an empty state message instead of a blank list
- Selecting a gate in the registry shows its full description and highlights which of the 5 pipeline stages include that gate, with the containing stages visibly marked and the others not

Feature: Gate annotations (API-shaped create payload) —
- Each gate row offers an Add note control that opens a small form whose submitted record is exactly the gate-note create payload the console would POST to a stage-gate API: text and category
- GateNote field contract (the form submit IS the would-be request body; Export Acceptance Package notes arrays and Import Acceptance Package use the same rules; all keys required unless marked optional; example values illustrative only):
  - text: required trimmed non-empty string, length 1 through 200 inclusive
  - category: required closed enum exactly one of observation, waiver-request, follow-up
- Each invalid field shows an inline message naming that field before submit, and the submit control stays disabled until both fields are valid
- Submitting a valid note attaches it to that gate (visible in the gate's expanded evidence area with the submitted text and category), appends a note entry to the run's event timeline, and includes that note under the gate in the next Acceptance Package JSON preview; cancel closes the form without adding anything
- Submitting with empty or whitespace-only text, text longer than 200 characters, or a missing or out-of-enum category shows inline errors naming each invalid field, attaches nothing, and leaves the timeline and export preview unchanged

Feature: Re-run simulation and event timeline —
- A re-run control per stage starts a simulated gate re-run: the stage flips to running, and the gate checklist ticks through each gate one by one with statuses advancing pending, then running, then pass or fail, alongside an overall progress indicator that advances as gates complete
- When the simulation finishes, either a certificate is issued for the stage (all hard gates passed and the aggregation outcome passes) or a rejection banner names the failing gates; the stage strip, chain visualization, and suite outcome all update to match the new results without a reload
- Each run has an event timeline of ordered, timestamped entries; a re-run appends entries for the re-run start, its final outcome, and gate failures encountered; the timeline is filterable by entry type (re-run, rejection, certificate, note), and a run with no events yet shows an empty state naming what will appear there

Feature: Acceptance package export —
- An Export acceptance package control opens a drawer or modal with two format tabs — Acceptance Package JSON and Certificate Chain Markdown — each regenerated live from the currently selected run's store state whenever gate results, certificates, notes, or timeline entries change
- Acceptance Package JSON is API-shaped like a stage-gate acceptance-service package response — a single object (not an array) whose field names and values are visible in the preview text and must conform to this field contract:
  - Required schemaVersion: the exact string gate-console.acceptance-package.v1
  - Required exportedAt: ISO-8601 timestamp string that updates when the preview regenerates
  - Required runId: non-empty string matching the selected run's identifier
  - Required submittedAt: ISO-8601 timestamp string matching the selected run's submitted-at value
  - Required stages: array of exactly 5 stage objects in pipeline order Source, Build, Test Generation, Hardening, Publish; each stage object requires name (exactly one of those five stage names), status (exactly one of passed, rejected, running, pending), aggregationMode (exactly one of required-pass, all-pass, weighted-mean), scorePercent (number from 0 through 100 inclusive when aggregationMode is weighted-mean, otherwise null), gates (array of 6 to 10 gate objects), and certificate (null when the stage is not passed; otherwise an object with required fingerprint as a non-empty string and issuedAt as an ISO-8601 timestamp)
  - Each gate object requires id (non-empty string), name (non-empty string), severity (exactly one of S1, S2, S3), state (exactly one of pass, fail), evidence (string), and notes (array of GateNote records each conforming to the GateNote field contract above, optionally carrying createdAt as an ISO-8601 timestamp)
  - Required timeline: array of timeline entry objects each requiring type (exactly one of re-run, rejection, certificate, note), timestamp (ISO-8601), and summary (non-empty string)
  - Cross-field rules: stages length is exactly 5 and names appear in the fixed pipeline order with no duplicates; a passed stage must carry a non-null certificate; a rejected, running, or pending stage must carry certificate null; weighted-mean stages must carry a numeric scorePercent and other aggregation modes must carry null
- The Certificate Chain Markdown tab previews a human-readable report that names the runId, lists each of the 5 stages with status, and for every passed stage includes the fingerprint and a bullet per gate naming id, severity, and state
- Export content that omits session work is invalid: after attaching at least one note or completing a re-run that changes recorded results, reopening Export must show that note under the gate's notes array (JSON) or the updated stage status and fingerprint (Markdown), matching the on-screen surfaces
- Each format tab offers Copy (writes that format's exact preview text to the clipboard with visible confirmation) and Download (triggers a real file download whose contents match the previewed text for that format)

Feature: Acceptance package import —
- An Import acceptance package control accepts pasted Acceptance Package JSON text matching the export field contract
- A valid import replaces the selected run's recorded stage results, certificates, gate notes, and timeline so the stage strip, chain visualization, suite outcomes, gate evidence notes, timeline entries, and the next Export preview match the imported document
- Malformed JSON, or JSON that violates the field contract (schemaVersion not exactly gate-console.acceptance-package.v1, missing required keys, stages not exactly the 5 named stages in order, severity or category or status or aggregationMode outside their closed enums, text outside 1 to 200 characters, scorePercent present when aggregationMode is not weighted-mean, non-null certificate on a non-passed stage, or null certificate on a passed stage), shows visible validation feedback naming the offending field (or the payload when JSON is unparseable), leaves the selected run unchanged, and does not treat the attempt as a successful mutation
</core_features>

<user_flows>
- Investigating a rejection end to end: select a run with a rejected stage, open the rejected stage, read the banner naming the failing hard gate, expand that gate's evidence, then enter what-if mode and flip that gate to pass — the suite outcome and stage status flip to passed in place; revert, and the recorded rejection is back exactly as before, all without a reload
- Re-running a stage: start a re-run on a rejected stage, watch each gate tick through running to its result with the progress indicator advancing, and when it completes see the stage strip color, the chain visualization, and the event timeline all reflect the new outcome in the same session
- Browsing the registry: filter the registry to S1 gates, select one, confirm its description appears and only its containing stages highlight; clear the filter and the full gate list returns exactly
- Certifying and copying: open a passed stage's certificate, activate the fingerprint copy control, and see the confirmation appear and reset; the copied text matches the displayed hash exactly
- Annotate then export: open a gate, submit a valid note whose text includes the distinct token note-alpha-17 and category observation, open Export acceptance package, and confirm Acceptance Package JSON shows schemaVersion exactly gate-console.acceptance-package.v1, that note under the gate's notes array with matching text and category, and Certificate Chain Markdown names the same runId
- Mutation-to-export: after one valid note or a completed re-run, reopen Export and confirm the JSON notes array or the updated stage status and certificate fingerprint reflect that session mutation; Copy and Download are available on the active tab
- Export then import round-trip: after attaching at least one note on the selected run, Copy or Download the Acceptance Package JSON, clear that run's notes via a path that empties them (or select another run then return and overwrite via import), Import that same JSON text, and confirm the gate evidence notes, timeline note entries, and the next Export preview match the pre-export package
- A page reload returns the app to its seeded state: the seeded runs, recorded gate results, default view, and default theme, with no what-if, re-run, note, or import changes surviving
</user_flows>

<edge_cases>
- Submitting the note form with empty text, text longer than 200 characters, or no category adds nothing: the gate's evidence area, the timeline, and the export preview are unchanged and inline messages name the invalid fields
- Double-activating a stage's re-run control starts exactly one simulation: the timeline gains one re-run start entry, not two
- What-if changes never leak: starting a re-run while simulated values differ from recorded values runs against recorded state, and the simulated markers are cleared when the re-run starts
- Filtering the event timeline to a type with no entries shows an empty state message instead of a blank region
- Importing malformed Acceptance Package JSON or a document that breaks the field contract (wrong schemaVersion, stages not exactly 5 in pipeline order, out-of-enum severity or category, text outside 1 to 200 characters, or certificate presence disagreeing with stage status) shows visible validation naming the offending field, leaves the selected run's note count and stage statuses unchanged, and does not crash the console
- Opening Export with no run selected is impossible from the happy path: Export uses the currently selected run; if the list has a selection, the preview always shows that run's runId
</edge_cases>

<visual_design>
- Console composition: a run list pane beside a detail canvas holding the stage strip, gate checklist, chain visualization, and timeline; gate rows use a dense checklist register with cards separated by hairline borders and subtle shadows
- One consistent status color language everywhere it appears — stage segments, gate states, chain links, and timeline entries share the same four status colors (passed, rejected, running, pending), stated in the legend
- Severity chips are visually distinct from one another and consistent everywhere: S1 reads as the most severe treatment, S3 the least
- Typographic hierarchy: run and stage titles visibly larger than gate names, which are larger than evidence and timestamp text; gate identifiers and fingerprint hashes render in a monospaced face
- A light/dark theme toggle in the header recolors all surfaces, chips, and the chain visualization without a reload
- One consistent icon set across all chrome; buttons and inputs show distinct default, hover, focus (visible ring), disabled, and error treatments
- Headings and action labels use one consistent capitalization convention, action labels are specific verbs (Start re-run, Copy fingerprint, Add note, Export acceptance package, Import acceptance package), and no placeholder text appears anywhere in the shipped UI
- The export drawer shows format tabs labelled Acceptance Package JSON and Certificate Chain Markdown, a scrollable monospaced preview, and Copy and Download controls
</visual_design>

<motion>
- Hover animations (required): buttons ease background and shadow with a slight press effect; run rows, gate rows, and registry rows take a full-width hover wash; form controls show focus rings
- Expanding a gate row animates the evidence area open with a short height-plus-opacity transition and rotates the chevron; collapsing reverses it; rows never snap open
- During a re-run driven from the real re-run control, each gate's status icon transitions as it changes state and the progress indicator advances smoothly rather than jumping
- The what-if banner and rejection banners slide in with a short transition; feedback toasts (copy confirmation, note added) slide in, remain readable, and auto-dismiss with a fade; a new timeline entry animates into the list
- The certificate view opens with a short opacity and scale transition of roughly 200 to 300 milliseconds and exits the same way
- With prefers-reduced-motion set, animations are removed and every state change still applies instantly and completely
</motion>

<responsiveness>
- At desktop widths the run list pane and detail canvas sit side by side; at widths of 768 pixels and below the run list collapses to a selectable list or drawer above the detail canvas
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; the stage strip and chain visualization scroll horizontally within their own containers when they cannot fit
</responsiveness>

<accessibility>
- Every interactive control — run rows, stage segments, gate rows, the what-if toggle, filters, form fields, Export, Import, and copy controls — is reachable and operable with the keyboard alone, with a visible focus indicator
- Gate row disclosures toggle with Enter or Space and expose their expanded state via aria-expanded; the note form dialog and the export and import drawers close on Escape and return focus to the control that opened them
- Rejection banners and copy, note, and import confirmations are announced through an aria-live region as well as shown visually
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of the app, including a complete re-run simulation
- The UI stays responsive under rapid repeated input — clicking through runs, stages, and what-if toggles quickly causes no hangs or dropped interactions
</performance>

<requirements>
Shared application state must live in Svelte stores (runes-based) (in-memory only): the runs collection with per-stage gate results, certificates, notes, the selected run and stage, what-if simulation overlays, re-run progress, timeline entries, export and import drafts, filters, theme, and UI chrome. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Suite outcomes, stage statuses, the stage strip, the chain visualization, and the Acceptance Package export preview all derive live from the one store of gate results and notes; they never disagree with each other
- What-if is an overlay on the store, never a mutation: revert or navigation always restores recorded results exactly, and what-if overlays never appear in the Acceptance Package export
- A completed re-run writes new recorded results once, and every surface that shows that stage (strip, chain, outcome, timeline, export preview) reflects them without a reload
- Registry filters and timeline filters recompute their visible lists from the shared collections; they do not create a second disconnected copy
- Theme and active view are shared client state; toggling them does not reload the document
- Any automation or tool handlers exposed by the app invoke the same store commands the visible controls use
Build tooling: Vite or an equivalent SPA setup. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer. shadcn-svelte is the component library for dialogs, selects, tabs, badges, accordions, tooltips, and toasts; no other component library. svelte-motion and AutoAnimate allowed for animation; no other animation libraries. Phosphor icons only, installed via its Svelte npm package — no raw copy-pasted SVG icon sets. All forms — the gate note form, the import surface, and any filter or settings forms — are driven by Felte validating through a Zod schema that models the GateNote create body and Acceptance Package JSON payloads: the schema defines the field contracts above and inline per-field errors render before submit. The record a successful Add note creates is exactly that GateNote create body; Acceptance Package export and a successful import conform to the same field names, enums, bounds, and cross-field rules. All libraries installed via npm and bundled locally; no CDN imports. No backend or authentication.
- Seed at least 6 runs with recorded gate results for all 5 stages (6 to 10 gates per stage), including at least one fully passed run, one run rejected at an intermediate stage, and one run with pending stages
- Fingerprint hashes, run identifiers, and gate identifiers are fictional seeded strings
- Invalid note submissions must not attach a note or add a timeline entry; show visible validation feedback
- Acceptance Package JSON export must be compiled live from the current store; after any session mutation that changes notes, recorded gate results, certificates, or timeline entries on the selected run, reopening Export acceptance package must include that mutation
- Importing a valid Acceptance Package JSON reconstructs the same visible run state the JSON export produced for that runId, including every required stage, gate, note, certificate, and timeline field
- Zero navigational outbound links for app chrome — in-app controls only; view changes via shared client state
- Icon set and any imagery bundled locally
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
- structured-editor-v1
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
- Browsable entity: runs
- Destinations: run-list; run-detail; stage-detail; certificate; registry; timeline; export; import
- Filters: severity; timeline-entry-type
- Themes: light; dark
- Value bounds: severity in {S1, S2, S3}; timeline-entry-type in {re-run, rejection, certificate, note}; stage in {Source, Build, Test Generation, Hardening, Publish}
- Editor object types: gate; note
- Editor modes: recorded; what-if
- Editor operations: select; switch_mode; update_property; add
- Editor properties: simulated-state; note-text; note-category
- Session operations: start
- Demos: stage-re-run
- Artifact operations: export; import; copy
- Export formats: fingerprint-hash; acceptance-package-json; certificate-chain-markdown
- Workflow completion: what-if flips recompute suite outcome and stage status; revert restores recorded results exactly
- Workflow completion: completed re-run updates stage strip, chain visualization, suite outcome, and appends timeline entries
- Workflow completion: acceptance-package export preview includes session notes and recorded stage results for the selected run
- Workflow completion: importing acceptance-package replaces selected run notes, stages, certificates, and timeline to match the document
- Import modes: acceptance-package

Mechanics exclusions:
- Gate row evidence height-plus-opacity expand animation and chevron rotation stay Playwright-observed
- What-if/rejection banner slide-in and toast fade timing stay Playwright-observed
- Re-run status-icon transition and progress-indicator smoothness stay Playwright-observed
- Clipboard contents and download of the acceptance-package export stay Playwright responsibilities; no raw file paths, blobs, or base64 in WebMCP args or results
- Import paste surface validation mechanics stay Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
