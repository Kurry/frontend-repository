<summary>
Build a repository scanner for a prompt-engineering platform using React, Zustand, Tailwind CSS 4.3.2, and IBM Carbon Design System.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Add repository —
- A toolbar button opens a modal dialog with a local path input (required) and a display name input (optional); the submit control stays disabled until the path is non-empty, and an invalid or empty path shows an inline message naming the path field before submit
- Submitting a valid form closes the modal and adds exactly one repository to the tracked list
- A repository in the list shows its path, display name, last-scanned timestamp, and document count; a Scan Now button on the row triggers an immediate simulated scan
- Each repository row offers Rename and Remove actions: Rename edits the display name in place and the new name appears everywhere the repository is referenced; Remove asks for confirmation and then deletes the repository and its documents from the document tree

Feature: Scan runs as durable workflows —
- Clicking Scan Now shows an inline loading indicator in that repository row; after the scan completes the row updates its document count and last-scanned timestamp
- A scan panel for the active scan shows a progress bar labeled files scanned / total files that fills from 0 to 100 percent over the scan duration
- The active scan decomposes into named per-document steps, each with a visible status that advances pending to running to complete; a simulated failure marks a step failed or retrying instead
- A failing step retries automatically with a visible attempt count and a backoff countdown (for example waiting 3s before retry 2 of 3); the countdown text updates each second while waiting
- A step that exhausts its retries is marked failed with an inline error summary and a manual Retry step control; activating it resumes the scan from that step, and already-completed steps keep their original timestamps and outputs without re-running
- A running scan can be paused and resumed: Pause freezes step progression and the progress bar at a checkpoint; Resume continues from the exact step where it stopped, with previously completed steps never re-executing
- The scan panel shows live rollups derived from step states — steps complete of total, failure count, and elapsed duration — updating as steps advance
- Every scan has an event timeline: an ordered log of step transitions with timestamps, filterable by status; selecting a timeline entry highlights the matching step in the step list

Feature: Document index —
- After scanning, a document tree panel below the repository list shows detected files grouped by type: CLAUDE.md, AGENTS.md, .cursorrules, and README files; each group header shows the count of documents in it
- Clicking a document entry opens a read-only file viewer panel showing the file content in monospace type with line numbers and a copy control that gives visible confirmation when activated
- Each document row shows an attachment-style preview affordance: hovering the row reveals a compact preview showing the file name, type glyph, and the first lines of content without opening the full viewer
- Each document row carries an expandable findings disclosure, collapsed by default: expanding it shows that document's scan findings with a rotating chevron cue, and each row's open state is remembered while the app stays open

Feature: Filter by document type —
- A set of filter checkboxes above the document tree filters the tree to only the checked document types; the visible document and group counts update; unchecking all types shows all documents

Feature: Scan configuration —
- A settings panel within the scanner view allows toggling which document patterns to detect; each pattern toggle shows the pattern name and an enabled state, and the panel validates inline (at least one pattern must remain enabled, with a message naming the problem when the last one is toggled off)
- Toggling a pattern off excludes matching documents from all future scan results: rescanning a repository afterward produces no documents of the disabled type, while documents from earlier scans remain until that repository is rescanned
</core_features>

<user_flows>
- Adding and scanning end to end: submitting Add repository with a valid path adds exactly one row, clicking Scan Now runs the stepped simulated scan to completion, the row's document count and last-scanned timestamp update, and the new repository's documents appear grouped in the document tree — all without a reload
- Surviving a failure: during a scan with a simulated failure, the failing step shows retrying with an attempt count and a live backoff countdown; when retries exhaust, the step shows failed with an error summary, and activating Retry step completes the scan from that step while earlier steps keep their original timestamps
- Pausing mid-scan: Pause during a running scan freezes the progress bar and step statuses; Resume continues from the checkpoint step and the scan completes with rollups matching the step list
- Filtering the tree: checking only one document type narrows the tree to that group with matching counts; unchecking all types restores every document; opening a document from the filtered tree shows its content in the viewer
- A page reload returns the app to its seeded state: at least 3 seeded repositories with at least 8 documents each, default patterns enabled, and no scan running
</user_flows>

<edge_cases>
- Submitting Add repository with an empty path shows a visible message naming the path field and adds no row; the repository count is unchanged
- Double-activating the Add repository submit control creates exactly one repository: the list grows by one row
- Removing every repository shows an empty state in the repository list naming what belongs there and offering the Add repository control; the document tree shows its own empty state
- Clicking Scan Now on a repository that is already scanning does not start a second concurrent scan of that repository
- When type filters combined with disabled patterns match no documents, the tree region shows an empty state message instead of a blank area
</edge_cases>

<visual_design>
- Layout: the left panel is the repository list rendered as a structured list with consistent row anatomy; the right panel switches between the document tree and the file viewer without a full page reload
- Scan progress renders as a determinate progress bar in the scan panel, plus an inline loading indicator in the scanning repository's row
- Document type groups render as accordion sections in the tree panel with rotating chevrons and per-group counts
- The file viewer renders content in a monospace type treatment with visible line numbers on a contrasting code surface
- Step statuses use one consistent chip and icon language: pending, running, complete, failed, and retrying are each visually distinct and carry a visible text label, not color alone
- Typography keeps a clear hierarchy: panel titles visibly larger and heavier than row text; repository rows, document rows, and timeline entries share one compact body size
- All interactive controls show a visible focus ring on keyboard focus; failed steps and validation messages use one consistent danger red treatment
- One icon set is used consistently across toolbar, rows, steps, and timeline entries
</visual_design>

<motion>
- New repository rows animate in from opacity 0 over roughly 200 milliseconds on add, and a removed row animates out rather than vanishing instantly
- The progress bar fills with a smooth linear transition tied to scan progress percentage, never jumping backward
- Step status changes animate: the status chip transitions visibly between pending, running, and complete rather than swapping instantly, and newly appearing timeline entries slide in at the top of the log
- The findings disclosure and accordion groups open and close with a short height-and-opacity transition and a rotating chevron cue
- The Add repository modal enters and exits with a short opacity-and-scale transition of roughly 200 milliseconds
- Hover animations (required): buttons ease background and shadow with a slight press effect; repository rows, document rows, and timeline entries take a visible hover wash; the document hover preview fades in; form controls show focus rings
- With prefers-reduced-motion set, the progress bar jumps to its current value instantly and row, disclosure, and modal animations apply instantly
</motion>

<responsiveness>
- At 1024 pixels and above the repository list and the tree/viewer panel sit side by side; below 1024 pixels they stack vertically with the repository list first
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; the file viewer scrolls its long lines within its own container
</responsiveness>

<accessibility>
- Every interactive control — toolbar buttons, repository row actions, scan controls, filter checkboxes, pattern toggles, document rows, timeline entries — is reachable and operable with the keyboard alone, with a visible focus indicator
- The Add repository modal uses role dialog with aria-modal true, traps focus while open, closes on Escape, and returns focus to the toolbar button on close
- Validation messages are associated with their fields so each message names the field it belongs to; scan step status is conveyed by text labels as well as color
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of the app, including a scan with failures, pause/resume, and rapid filter toggling
- The UI stays responsive while a scan is running: filtering, opening documents, and pausing respond without hangs or dropped interactions
</performance>

<requirements>
Shared application state must live in Zustand (in-memory only): the repositories collection, the documents index, scan runs with per-step statuses, attempt counts, countdowns and checkpoints, the per-scan event timeline, rollups, document type filters, pattern configuration, findings and accordion expanded flags, the active right-panel view, and UI chrome. Do not use localStorage, sessionStorage, or other browser storage APIs. Views derive from the one store — the repository list, scan panel, timeline, tree, and viewer never keep a second disconnected copy of the data — and WebMCP tool handlers invoke the same store commands the visible controls use, so a contract-driven scan produces the same step statuses and event trail as a UI-driven one.
State contracts (behavioral, not storage keys):
- Adding a valid repository grows the collection and shows the new row; removing one deletes its row and its documents from the tree
- Renaming a repository updates that record everywhere it appears
- Scan step transitions, attempt counts, and pause checkpoints mutate the same store the scan panel, timeline, and rollups render from; rollups always equal what the step list shows
- Type filters and pattern toggles recompute the visible tree from the shared documents index; they do not create a second disconnected copy
- The active right-panel view (tree or viewer) is shared client state; switching it does not reload the document
Build tooling: Vite SPA. IBM Carbon Design System (@carbon/react) is the one component library for all UI components — structured list, modal, progress bar, inline loading, accordion, code viewer surface, checkboxes, toggles, and notifications; no other component library. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer; the component library keeps its component styles and Tailwind owns layout and custom surfaces. Motion for React and AutoAnimate are the allowed animation libraries; no other animation libraries. Icons come from @carbon/icons-react only — no raw copy-pasted SVG icon sets. Every form — Add repository and the scan configuration panel — is driven by React Hook Form validating through a Zod schema: the schema defines the rules and inline per-field errors render before submit. Scanning is simulated with seeded document data and artificial delays; no backend or authentication. All libraries are installed via npm and bundled locally; no CDN imports.
- Seed at least 3 repositories with at least 8 documents each on first load, distributed across all four document types, so the tree is non-empty before any manual scan
- Simulated scans must include at least one deterministic failure path reachable by the judge (for example one seeded repository whose scan always fails one named step before retrying) so retry, countdown, and manual-retry behaviors are observable
- Zero navigational outbound links for app chrome — in-app controls only; view changes via shared client state
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
- entity-collection-v1
- command-session-v1
- browse-query-v1
- form-workflow-v1

Module specs:
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

Bindings:
- Entity: repository
- Entity operations: create; select; update; delete
- Entity fields: path; display-name; last-scanned; document-count
- Session operations: start; pause; resume; restart
- Destinations: document-tree; file-viewer
- Browsable entity: documents
- Filters: document-type; timeline-status
- Form fields: repository-path; display-name; pattern-claude-md; pattern-agents-md; pattern-cursorrules; pattern-readme
- Form operations: validate; submit; cancel

Mechanics exclusions:
- Scan runs as durable workflows: progress-bar fill animation and per-second backoff countdown ticking stay Playwright-observed
- Document index: document-row hover preview and findings-disclosure chevron animation stay Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
