<summary>
Build a structured output schema builder for prompt-engineering workflows using React, Zustand, Tailwind CSS 4.3.2, and IBM Carbon Design System.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Schema tree editor —
- The main panel shows the active schema as an interactive tree; each node displays its key name, a type badge (string, number, boolean, object, array), and a required toggle, with object and array nodes carrying a chevron that collapses and expands their children
- Clicking Add Field on any object node appends a child node with a default name and string type; clicking a node's name makes it editable inline, and committing the edit renames the node everywhere it appears
- Clicking a node's Delete control shows an inline confirmation; confirming removes that node and all its descendants, canceling leaves it intact, and the root node offers no Delete control
- Dragging a node reorders it among its siblings and the tree reflects the new order immediately on drop
- Nest and un-nest controls on a node move it into the preceding sibling (when that sibling is an object) or out to its parent's level; the tree and all derived panes update immediately
- Nodes support multi-select via checkboxes; a contextual action bar appears when any are selected, offering Set required, Clear required, and Delete selected (with a confirmation naming the count), each applying to exactly the selected nodes

Feature: Field configuration panel —
- Clicking a node opens a side configuration panel showing its full settings: type select, description textarea, enum values list (string type), minimum and maximum inputs (number type), and pattern input (string type); the visible constraint inputs change when the type changes
- Changing any setting in the panel updates the tree node and every derived pane immediately
- Constraint inputs validate inline: a minimum greater than the maximum, or an invalid pattern expression, shows a message naming the field and the offending rule, and the invalid value is not applied to the schema
- A constraint templates library in the panel lists seeded templates — at least Email pattern, Percentage 0 to 100, ISO date pattern, Non-empty string, and Status enum — and applying one fills the matching constraint inputs with visible values on the selected node

Feature: Live schema text —
- A right pane shows the compiled JSON Schema (draft-07 shaped) text for the current tree; every tree or configuration edit updates the compiled text within 100 milliseconds
- The compiled text is standard, consumable JSON Schema: valid JSON that parses without error, carrying a draft-07 $schema declaration and the standard type, properties, required, enum, minimum, maximum, and pattern keywords — the same document any standard validator could consume
- The compiled text reflects structure and constraints: required arrays, enum lists, minimum, maximum, and pattern all appear for the nodes that define them, and renaming or deleting a node changes the compiled text correspondingly
- A Copy control places the exact compiled text on the clipboard and shows a visible confirmation

Feature: Example payload —
- An Example tab beside the schema text shows a generated JSON example object that satisfies the current schema — enum fields use one of their enum values, numbers fall within their bounds, and required fields are present
- The example regenerates with every edit: adding, renaming, retyping, or constraining a field changes the example correspondingly, never showing a field the schema no longer contains
- A Regenerate control produces a fresh example whose randomized values differ while still satisfying the schema

Feature: Format instruction —
- A Format Prompt tab shows a natural-language instruction string derived from the schema, naming each field with its type and whether it is required, ready to paste into a prompt; the string updates when the schema changes
- An Insert into prompt draft control appends the instruction into an in-app prompt draft drawer and shows a success toast; the drawer's content is editable and shows the inserted text

Feature: Validation playground —
- A playground panel accepts a pasted JSON payload; a Run validation control starts a simulated validation run decomposed into one visible step per top-level schema field, each step advancing through pending, running, and complete or failed as that field's checks execute
- Occasional simulated step slowdowns retry automatically with a visible backoff countdown and attempt counter (for example, waiting before retry 2 of 3); a step that exhausts its retries is marked failed with an inline error summary and a manual Retry control that resumes the run from that step — completed steps keep their outcomes and never re-execute
- A running validation can be paused and resumed: pausing freezes at the current step, resuming continues from exactly that step; a rollup shows fields checked out of total and failure count, deriving live from the step states, and an ordered event timeline lists step transitions with timestamps, filterable by status
- When the run completes, per-field pass/fail annotations map onto the tree: passing nodes show a success marker and failing nodes an error marker with a message naming the field path and the violated constraint keyword with its bound (for example, score must be at most 100) — the payload is checked against the compiled schema exactly as a gateway validating a request body would
- Pasting a payload that is not valid JSON shows an inline parse error naming the position and does not start a run
- Validating two different payloads against the same schema produces different pass/fail annotations consistent with each payload's contents

Feature: Import from example —
- An Import from example panel accepts a pasted JSON object and produces an inferred schema draft for review: each inferred field shows its name, inferred type, and inferred constraints, with per-field accept and reject toggles
- The inferred draft follows the pasted example — different pasted objects produce different drafts whose fields and types match the example's keys and values
- Applying the reviewed draft replaces the working tree with the accepted fields and the compiled text and example payload update; rejecting a field omits exactly that field

Feature: Schema versioning and diff —
- A Save version control snapshots the current tree under a required name; versions list with name and timestamp, newest first; saving with an empty name shows an inline message naming the field and saves nothing
- A Diff view compares any two selected versions structurally: added fields render in a success treatment, removed fields in an error treatment, and changed fields (type, required, or constraints) in a warning treatment, each labeled with what changed
- Changing either selected version updates the diff without a reload, and diffing a version against itself shows an explicit no-differences state

Feature: Schema library —
- A left sidebar lists saved schemas with name and field count, seeded with at least 4 schemas on first load — an evaluation result, an agent task, prompt metadata, and a classification response; clicking one loads it into the tree, and the active entry is visually marked
- A New button starts a blank schema with a root object; a Delete action removes the selected schema after a confirmation; a Duplicate action copies the schema under a copy-suffixed name
- A metadata field builder lets the user define custom metadata fields for library entries — a form with field label (required) and field type (text, number, date, or dropdown with options); defined fields immediately render as editable inputs on every library entry's details, and values entered there display on that entry

Feature: Undo, redo, and history timeline —
- Undo and Redo controls revert and reapply tree mutations — add, rename, retype, constraint edits, reorder, nest, deletions, bulk actions, and imports; each control shows the label of the action it will affect and disables when its stack is empty
- A history timeline slider spans the edit history of the active schema; dragging it scrubs the tree, compiled text, and example payload backward and forward through recorded states, with the current position labeled by its action name
- Undoing a drag reorder restores the previous sibling order in the tree and the compiled text

Feature: Export —
- An Export control opens a modal offering the compiled schema text and, when a validation run has completed, a validation report containing the payload summary, per-field outcomes, and the run's failure count
- Both exports derive live: editing the schema or re-running validation and reopening the export reflects the change
- A Copy control per export places the exact text on the clipboard and shows a visible confirmation
</core_features>

<user_flows>
- Editing end to end: adding a field, renaming it, marking it required, and constraining it in the panel updates the tree, the compiled schema text, the example payload, and the format instruction — all within a beat of each edit and without a reload
- Validating end to end: pasting a payload that violates one constraint and running validation advances the per-field steps, completes with exactly that field marked failed on the tree with a message naming the path and constraint, and the exported validation report lists the same failure
- Fixing and re-running: editing the schema so the previously failing constraint now passes, then re-running validation on the same payload, flips that field's annotation to pass — the annotations track the live schema, not a stale copy
- Versioning end to end: saving a version, making two structural edits, saving a second version, and diffing the two shows exactly those edits color-coded; scrubbing the history slider back before the edits restores the earlier tree and compiled text
- Importing end to end: pasting an example object, rejecting one inferred field, and applying produces a tree whose fields match the accepted inferences; the example payload and compiled text reflect the imported schema
- A page reload returns the app to its seeded state: the seeded schema library, the first schema active, empty undo history, no versions beyond the seeds, and an empty playground
</user_flows>

<edge_cases>
- Deleting every child of the root leaves a valid empty object schema; the compiled text shows an object with no properties and the example shows an empty object, not an error
- Renaming a node to a name already used by a sibling shows an inline conflict message and does not apply the rename
- An enum values list with an empty entry shows a message and the empty value is not added to the compiled text
- Double-activating Run validation starts exactly one run: one set of steps fills and the event timeline records one run
- Double-activating Save version creates exactly one version entry
- Deleting the schema that is currently loaded clears the tree to the blank state with a message and a control to create or select a schema
- A field name longer than 40 characters is truncated with an ellipsis in the tree row and shown in full in the configuration panel
- Undo with an empty history and Redo with an empty redo stack are disabled, not silent no-ops
</edge_cases>

<visual_design>
- Layout: a left sidebar with the schema library and metadata builder, a central tree editor, and a right region with tabs for the compiled schema text, example payload, and format instruction; the configuration panel docks to the right at roughly 280 pixels wide with a structured form layout
- The schema tree uses indented rows with chevron toggles for object and array collapse; type badges render in a monospace face inside compact tags, with one consistent color per type used everywhere that type appears
- Required fields show an asterisk in the error-accent color after the field name, in the tree and in the compiled-text pane's required listing
- The compiled schema text and example payload render in a monospaced, syntax-styled read-only code surface with visible structure indentation
- Diff treatments are unambiguous: added fields in the success color, removed in the error color, changed in the warning color, each with a text label so color is not the only signal
- Validation annotations on the tree pair an icon with the color: a success mark for passing nodes and an error mark with message text for failing nodes
- Step statuses in the validation run are visually distinct at a glance — pending, running, retrying, failed, complete — consistent between the step list and the event timeline
- Typography shows a clear hierarchy: the app title larger than panel headings, which are larger than tree row and body text
- Spacing follows a consistent rhythm across the sidebar, tree, and panes, with no crowded or orphaned regions
- Buttons, inputs, selects, toggles, and checkboxes show distinct default, hover, focus (visible ring), disabled, and error treatments; one consistent icon set is used throughout
</visual_design>

<motion>
- Adding a field animates it in with a height expansion of roughly 150 milliseconds
- Removing a field collapses its height over roughly 120 milliseconds before it disappears
- Drag reordering slides sibling nodes into their new positions over roughly 200 milliseconds rather than snapping
- The configuration panel slides in when a node is selected and out when dismissed; tab switches between schema text, example, and format instruction crossfade briefly
- Validation annotations appear with a short pop-in as each field's step completes, in step order rather than all at once
- The retry backoff countdown ticks visibly, and a completing step's status transitions with a short fade
- The history timeline slider's scrubbing updates the tree continuously as it moves, not only on release
- Hover animations (required): buttons ease background and shadow with a slight press effect; tree rows, library entries, and version rows take a full-width hover wash; form controls show focus rings
- Toasts for copies, saves, inserts, and deletions slide in, remain readable, and auto-dismiss with a fade
- With prefers-reduced-motion set, all expansions, reorders, and annotations apply instantly
</motion>

<responsiveness>
- At widths of 768 pixels and below, the sidebar collapses behind a toggle control that opens it as an overlay, and the right panes stack below the tree as full-width tabs; at desktop widths all three regions are visible together
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; the code surfaces scroll within their own containers
</responsiveness>

<accessibility>
- Every interactive control — tree rows and their toggles, drag handles, the configuration inputs, tabs, version selectors, the history slider, and run controls — is reachable and operable with the keyboard alone, with a visible focus indicator
- Modals and the confirmation dialogs trap focus while open, close on Escape, and return focus to the control that opened them
- Completion of a validation run, and a step entering the failed state, are announced through an aria-live region as well as shown visually
- The tree exposes its hierarchy semantically so levels and expanded states are readable by assistive technology
- Form fields have visible labels, and validation messages are associated with their fields so each message names the field it belongs to
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- The compiled schema text, example payload, and format instruction update within roughly 100 milliseconds of any edit
- No console errors or warnings appear on load or during a full exercise of the app
- The UI stays responsive under rapid repeated input — fast renames, rapid slider scrubbing, quick tab switches — with no hangs, including while a validation run is advancing
</performance>

<writing>
- Headings, panel titles, and buttons use one consistent capitalization convention throughout
- Action labels are specific verbs such as Add field, Save version, and Run validation rather than generic labels
- Validation messages name the field path and the violated rule with its bound; empty states explain what belongs there and how to add it; no placeholder text appears anywhere in the shipped UI
- Type names, constraint labels, and version terminology are consistent across the tree, panel, diff, and exports
</writing>

<innovation>
- Optional enhancements the builder may add, none required for a passing build: a minimap of large trees; per-type keyboard shortcuts for adding fields; a shareable one-line schema summary; inline documentation hints per constraint
</innovation>

<requirements>
Shared application state must live in Zustand (in-memory only): the schema library and active schema tree, node selection and multi-selection, the configuration panel state, compiled text, example payload and format instruction derivations, playground payload and validation run state (per-step statuses, attempts, checkpoints, event timeline, rollups, per-field annotations), versions and diff selections, import drafts and per-field review toggles, metadata field definitions and values, undo and redo stacks with the history timeline position, the prompt draft drawer, and UI chrome. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Every tree or configuration edit flows to the compiled text, example payload, format instruction, and validation context from the one shared tree; no pane holds a second disconnected copy
- Loading, duplicating, or deleting a library schema updates the sidebar, the tree, and every derived pane from the same shared collection
- Advancing a validation step updates the step list, event timeline, rollup, and tree annotations from the same shared run state; pause and resume preserve completed steps
- Undo, redo, and the history slider operate on the same shared state the visible controls mutate
- Versions snapshot from and diff against the shared tree; applying an import replaces the shared tree so all panes update together
Build tooling: Vite SPA. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer. IBM Carbon Design System (@carbon/react) is the component library for all UI chrome — tree and list surfaces, tags, modals, notifications, code snippets, tabs, and form controls; no other component library. @dnd-kit/core for drag-to-reorder. Ajv for validating generated examples and playground payloads against the schema. Motion for React and AutoAnimate allowed for animation; no other animation libraries. Icons from @carbon/icons-react only, installed via npm — no raw copy-pasted SVG icon sets. All forms — node configuration, Save version, metadata field builder, and the import panel — are driven by React Hook Form validating through a Zod schema: the schema defines the rules and inline per-field errors render before submit. No backend or authentication; validation runs are simulated with realistic per-step latency and occasional simulated retries, so two runs are not byte-identical in timing. All libraries installed via npm and bundled locally; no CDN imports.
- Seed at least 4 example schemas on first load — an evaluation result, an agent task, prompt metadata, and a classification response — each with at least 6 fields including at least one nested object and one array, so the tree, compiled text, and example payload are non-empty on first load
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
- structured-editor-v1
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
- Editor object types: schema; field-node; metadata-field; version
- Editor properties: key-name; type; required; description; enum-values; minimum; maximum; pattern; constraint-template; nest-level; sibling-order; schema-name; version-name; metadata-field-label; metadata-field-type; metadata-field-options; playground-payload; import-example-json; import-field-accept
- Editor operations: select; add; delete; update_property; set_content; switch_mode; preview
- Editor modes: schema-text; example; format-prompt; diff; playground; import
- Session operations: start; pause; resume
- Demos: validation-run; regenerate-example; apply-import-draft
- Artifact operations: export; import; copy
- Export formats: compiled-schema-json; validation-report-text; format-instruction-text
- Import modes: example-json
- Value bounds: node type in {string, number, boolean, object, array}; minimum must not exceed maximum; invalid patterns are rejected inline; node name unique among siblings, truncated past 40 chars in the tree row; constraint templates in {Email pattern, Percentage 0 to 100, ISO date pattern, Non-empty string, Status enum}; metadata field type in {text, number, date, dropdown}; label required; version name required; versions are never edited in place; root node has no Delete; delete of a node with descendants requires confirm=true
- Workflow completion: every tree or configuration edit updates the compiled draft-07 schema text, the example payload, and the format instruction within a beat, from the one shared tree
- Workflow completion: the compiled text is valid JSON carrying $schema, type, properties, required, enum, minimum, maximum, and pattern for the nodes that define them
- Workflow completion: a completed validation run maps per-field pass/fail annotations onto the tree, naming the field path and violated constraint keyword with its bound
- Workflow completion: pausing a validation run freezes at the current step and resuming continues there; the rollup and event timeline agree with the step list
- Workflow completion: applying a reviewed import draft replaces the tree with exactly the accepted fields; rejected fields are omitted
- Workflow completion: diffing two saved versions color-codes added, removed, and changed fields; a self-diff shows the explicit no-differences state

Mechanics exclusions:
- Node drag-to-reorder gesture mechanics (@dnd-kit sibling slide, drop settle) are graded via Playwright; resulting sibling order as state may be asserted afterward
- History-timeline slider scrubbing (continuous tree updates while dragging) and undo/redo keyboard shortcuts are graded through the real controls via Playwright
- Field add height-expansion, delete collapse, configuration-panel slide, tab crossfade, and step-order annotation pop-in animations stay Playwright-observed
- Retry backoff countdown ticking and running-step activity indicators stay Playwright-observed
- Clipboard contents of the Copy controls are verified via Playwright, never returned in WebMCP results

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
