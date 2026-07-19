<summary>
Build a visual workflow builder for an AI agent orchestration workspace using React, Zustand, Tailwind CSS 4.3.2, IBM Carbon Design System, and React Flow.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Canvas and nodes —
- The main canvas supports pan and zoom with the pointer, and users can drag nodes to reposition them freely; node positions persist in shared client state while the app is open
- A left palette panel lists five node types: Prompt, Agent, Eval, Condition, and Output; dragging a node type from the palette onto the canvas creates a new node of that type at the drop position
- Each node on the canvas shows its type, its display title, a configuration badge summarizing its saved configuration, and — once a run has touched it — a status badge naming its execution state
- On first load the canvas is seeded with one example workflow containing exactly 5 connected nodes (one of each type: Prompt, Agent, Eval, Condition, Output) and 4 edges forming a valid source-to-sink path

Feature: Connections —
- Nodes have typed output and input handles; dragging from an output handle to a compatible input handle creates a directed edge between the nodes
- Attempting to connect incompatible handles (for example an output handle to another output handle, or a type pairing the palette forbids) shows an error toast naming the incompatibility and creates no edge
- Clicking an edge selects it with a visibly distinct style; pressing Delete removes the selected edge; selecting a node and pressing Delete removes that node and its attached edges

Feature: Node configuration —
- Double-clicking a node opens a modal configuration form specific to its type: Prompt nodes show a prompt selector (from a seeded library of at least 4 named prompts), Agent nodes show an agent selector (at least 3 seeded fictional agent names) and a timeout field in seconds (required, between 1 and 300), Eval nodes show a rubric selector (at least 3 seeded rubric names), Condition nodes show a condition expression field (required), Output nodes show a destination name field (required)
- Each form validates inline: an invalid or empty required field shows a per-field message naming that field before submit, and Save stays disabled until the form is valid
- Saving the configuration closes the modal and updates the node's configuration badge on the canvas to reflect the saved values

Feature: Run workflow —
- A Run button in the toolbar simulates executing the current workflow from source nodes to sink nodes in topological order; every node starts showing a pending status badge, then each node in turn switches to running with an active indicator, then to complete or failed
- Each node runs for a visible simulated duration so the progression is watchable, and edges out of a completed node animate to show flow advancing toward the next node
- The seeded Agent node is configured to fail its first two attempts and succeed on the third: while retrying it shows a retrying badge with a visible attempt counter and a live backoff countdown in the form waiting Ns before retry 2 of 3
- A node that exhausts its retries shows a failed badge with a short inline error summary; downstream nodes remain pending and the run stops with the run status reading failed
- After a failed run, a Retry from failed node control appears; activating it resumes execution from exactly the failed node — upstream completed nodes keep their frozen outputs and timestamps and visibly do not re-execute
- Pause and Resume: while a run is in progress a Pause control freezes step progression at a checkpoint (the currently running node finishes, no further node starts); Resume continues from exactly the next node, and nodes already complete never re-execute
- A run-level rollup in the toolbar derives live from node states: n of m nodes complete, elapsed duration, and failure count, updating as nodes advance
- Each node that has executed exposes an expandable input/output summary: activating a disclosure on the node (or its detail) reveals the simulated input it received and the simulated output it produced; outputs differ between nodes and reflect the node's own configuration

Feature: Execution event timeline —
- A timeline panel below the canvas lists execution events as an ordered log: one timestamped entry per step transition (started, completed, failed, retry scheduled, paused, resumed), newest appended at the end
- The timeline is filterable by status (all, complete, failed, retrying); applying a filter narrows the visible entries and clearing it restores the full log
- Selecting a timeline entry highlights its node on the canvas and pans the node into view if it is offscreen
- Running the workflow twice produces two distinct sets of timeline entries with fresh timestamps

Feature: Save and load —
- Clicking Save opens a modal with a workflow name input (required, validated inline); saving stores the workflow in the in-memory collection and it appears immediately in a Saved Workflows side panel with its name and node count
- Clicking a saved workflow in the side panel loads its nodes and edges onto the canvas, replacing the current contents only after a confirmation dialog is accepted; declining leaves the canvas untouched
- Loading a saved workflow resets execution state: badges clear to their pre-run appearance and the rollup resets
- Save-workflow request-body field contract (a successful Save record IS the would-be request body): required name (trimmed string length 2–80), required nodes (non-empty array of objects each with required id, type exactly one of Prompt|Agent|Eval|Condition|Output, position {x,y} numbers, and config object matching that node type's form schema), required edges (array of objects each with required id, source, target; optional sourceHandle/targetHandle). Cross-field: every edge source and target must reference a node id in nodes; disconnected graphs may save but Run still requires a valid source-to-sink path. Empty name keeps Save disabled with a named name error and stores nothing.
- Export workflow / Download workflow.json / Copy JSON emit the active canvas (or selected saved workflow) under that field contract plus required schemaVersion (number exactly 1) and generatedAt (ISO-8601 datetime ending in Z). Export Mermaid emits a flowchart string whose node labels match the canvas. Both update after node/edge edits and Save without a reload. An export that omits a session node, edge, or save mutation is invalid. Import workflow-definition accepts a conforming JSON and replaces the canvas after confirmation; malformed payloads show a visible error and change nothing.

Feature: Keyboard access —
- Pressing Tab or a documented shortcut cycles keyboard selection through the nodes with a visible selection highlight; pressing Enter on a selected node opens its configuration modal; Delete removes the selected node or edge
</core_features>

<user_flows>
- Author then run: drag a Prompt node from the palette onto the canvas, connect it to the seeded workflow with a compatible edge, then press Run — the run visits the new node in topological order, its status badge advances pending to running to complete, and the rollup counts it
- Watch a failure recover: press Run and observe the seeded Agent node retry with attempt counter and backoff countdown, then succeed on the third attempt; the timeline shows the retry-scheduled entries and the run finishes complete
- Retry from failed node: after driving a run to a failed state (exhausted retries), press Retry from failed node and confirm execution resumes at that node while upstream nodes keep their frozen outputs, timestamps, and complete badges
- Pause and resume: press Pause mid-run, confirm no new node starts and the rollup freezes, then press Resume and confirm execution continues from exactly the next node with completed nodes untouched
- Save, clear, and reload a workflow: save the current canvas under a new name, load a different saved workflow through the confirmation dialog, then load the first one back — the canvas shows the exact saved nodes and edges each time
- A page reload returns the app to its seeded state: the seeded example workflow on the canvas, an empty timeline, and no saved-run state
</user_flows>

<edge_cases>
- Pressing Run with an empty canvas (all nodes deleted) shows a visible message that there is nothing to run and starts no execution
- Deleting a node that has edges removes those edges in the same interaction; the edge count visibly drops
- The Run control is disabled while a run is already in progress; Pause is only available during a run and Resume only while paused
- Saving a workflow with an empty name shows an inline validation message naming the name field and stores nothing
- Selecting a timeline entry whose node was deleted after the run shows the entry as inert (no crash, no dangling highlight)
</edge_cases>

<visual_design>
- The canvas background uses a light gray dot-grid pattern distinct from the surrounding chrome
- Node cards render as tiles with a colored left border per type: blue for Prompt, purple for Agent, orange for Eval, yellow for Condition, green for Output; the palette entries use the same color coding
- Edges render as smooth bezier curves in a mid gray; the selected edge renders in the app's primary accent blue, visibly distinct
- Status badges use one consistent palette: pending neutral gray, running blue with an active indicator, retrying amber, failed red, complete green; every badge names its state in text, never color alone
- The running node carries a pulsing border treatment while it executes
- The layout composes as: left palette panel, central canvas, right Saved Workflows side panel (collapsible), toolbar above the canvas with Run, Pause/Resume, Retry from failed node, Save, and the live rollup, and the timeline panel below the canvas
- One consistent icon set is used across the palette, toolbar, badges, and timeline; typography keeps a clear hierarchy between panel titles, node titles, and metadata text
- Buttons, selects, and inputs show distinct default, hover, focus (visible ring), disabled, and error treatments; no bare browser-default controls appear
</visual_design>

<motion>
- Hover animations (required): toolbar buttons ease background and shadow with a slight press effect; palette entries and saved-workflow rows take a visible hover wash; nodes lift subtly on hover; form controls show focus rings
- A node dropped onto the canvas scales from 0.8 to 1.0 over roughly 150 milliseconds
- During execution the active node's border pulses with a repeating opacity animation, and edges out of a completed node animate (a moving dash or pulse traveling along the curve) to show flow progressing
- Status badge changes transition their color rather than hard-swapping, and the retry backoff countdown visibly ticks down once per second
- New timeline entries animate in as they are appended rather than appearing instantly, and filtering the timeline animates rows in and out
- Modals (configuration, save, confirmation) enter and exit with a short opacity and scale transition of roughly 200 to 300 milliseconds; the Saved Workflows panel slides open and closed
- The expandable node input/output summary opens with a smooth height transition and its disclosure chevron rotates
- Selecting a timeline entry pans the canvas smoothly to the highlighted node rather than jumping
- Error toasts for incompatible connections slide in, remain readable, and auto-dismiss with a fade
- With prefers-reduced-motion set, node drop is instant, the running state is indicated by a static border color instead of pulsing, edge progression uses a static highlight, and all state changes still occur
</motion>

<responsiveness>
- At desktop widths the palette, canvas, side panel, and timeline are all visible; at 1024 pixels and below the Saved Workflows panel collapses behind a toggle
- At 768 pixels and below the palette collapses to a compact strip or toggle and the timeline remains reachable below the canvas
- At 375 pixels wide no content clips or overflows the viewport and no page-level horizontal scrollbar appears; the canvas remains pannable
</responsiveness>

<accessibility>
- Every interactive control — palette entries, toolbar buttons, node disclosures, timeline entries and filters, modal fields, panel toggles — is reachable and operable with the keyboard alone, with a visible focus indicator
- Keyboard node access is first-class: node selection can be cycled from the keyboard with a visible highlight, Enter opens the selected node's configuration, and Delete removes the selected node or edge
- Modal dialogs use role dialog with aria-modal true, trap focus while open, close on Escape, and return focus to the control that opened them
- Validation messages are associated with their fields so each names the field it belongs to, and are announced via an aria-live region
- Run state transitions (node started, retrying, failed, run complete) are announced via an aria-live region as well as shown visually
- Status is never conveyed by color alone: every status badge carries a text label
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise: canvas edits, runs with retries, pause/resume, save/load, and timeline filtering
- Canvas pan, zoom, and node drag stay smooth with no visible jank, and the UI stays responsive during a run under rapid repeated input with no hangs
</performance>

<requirements>
Shared application state must live in Zustand (in-memory only): nodes and their positions and configurations, edges, selection, the saved-workflows collection, run state (per-node statuses, attempt counts, backoff timers, checkpoints, frozen outputs), the event timeline and its filter, rollup values derived from node states, and UI chrome (open modals and panels). Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- The canvas, node badges, rollup, and timeline all derive from the one store: a node status change updates its canvas badge, the rollup, and appends its timeline entry from a single source, never from parallel copies
- Saving a workflow snapshots the current nodes and edges into the collection; loading one replaces canvas state through the same store commands the visible controls use
- Pause checkpoints, retry attempt counts, and frozen upstream outputs live in the store, so resume and retry-from-failed-node continue from recorded state rather than restarting
- WebMCP tool handlers, where the action contract is attached, invoke the same store commands as the visible controls, so a contract-driven run or node edit produces the same badges, rollup, and timeline trail as a UI-driven one
Build tooling: Vite SPA. IBM Carbon Design System (@carbon/react) is the component library for all chrome — modals, notifications, side panels, buttons, selects, tags, and the timeline; no other component library. @xyflow/react (React Flow) for the canvas, nodes, edges, pan, and zoom. Motion for React and AutoAnimate allowed for animation — badge transitions, timeline entries, panel and disclosure motion; no other animation libraries. @carbon/icons-react only for icons, installed via npm — no raw copy-pasted SVG icon sets. All forms — every node configuration form, the save-workflow form, and Import workflow — are driven by React Hook Form validating through a Zod schema that mirrors the API-shaped save-workflow / workflow.json field contracts above: the schema defines the rules, inline per-field errors render before submit, a successful Save record IS the would-be request body, and Download/Copy/Import validate through the same schemas. End-state contract: Download workflow.json, Copy JSON, and Export Mermaid MUST reflect the session's actual graph — an export that omits session work is invalid; Import MUST restore the same visible nodes and edges (round-trip). Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer; Carbon keeps its component styles while Tailwind owns layout and custom surfaces. All libraries installed via npm and bundled locally; no CDN imports. No backend or authentication; workflow execution is simulated entirely client-side.
- Seed one example workflow with exactly 5 nodes (one per type) and 4 edges on first load, a prompt library of at least 4 named prompts, at least 3 fictional agent names, and at least 3 rubric names for the selectors; all seeded names are fictional or generic
- Seed the example Agent node configured to fail its first two attempts and succeed on the third, so retry behavior is observable on every run
- Zero navigational outbound links for app chrome; all view and panel changes happen via shared client state
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
- structured-editor-v1
- command-session-v1
- entity-collection-v1
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
- Editor object types: prompt-node; agent-node; eval-node; condition-node; output-node; edge
- Editor operations: select; add; delete; update_property
- Editor properties: title; prompt; agent; timeout-seconds; rubric; condition-expression; destination-name
- Value bounds: {"timeout-seconds":[1,300]}
- Session operations: start; pause; resume; restart
- Demos: seeded-workflow-run; retry-from-failed-node
- Entity: saved-workflow
- Entity operations: create; select; delete
- Entity fields: name; node-count
- Artifact operations: export; import; copy; convert
- Export formats: json; mermaid
- Import modes: workflow-definition
- Conversion modes: json-to-mermaid
- Workflow completion: node-status-badges
- Workflow completion: run-rollup-n-of-m
- Workflow completion: configuration-badge
- Workflow completion: artifact-preview

Mechanics exclusions:
- Node drag positioning, canvas pan/zoom, and palette drag-to-drop coordinates stay Playwright-driven; editor add creates nodes but drop-position mechanics are gesture-graded
- Edge-handle drag drawing and incompatible-connection toast visuals stay Playwright; editor add(edge) only proves the state command
- Retry backoff countdown, pulsing running border, and edge flow-pulse animations are timed visuals observed live via Playwright
- Keyboard node cycling (Tab/Enter/Delete) is graded via real Playwright keyboard input
- Raw file path / base64 blobs must not appear in WebMCP args; clipboard contents and downloaded artifact bytes remain Playwright responsibilities
- Multi-select marquee geometry and Shift-click chord timing stay Playwright when mechanism matters
- Timeline status filter chips and Saved Workflows / Artifact panel open toggles stay Playwright-driven; no browse-query module is assigned

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
