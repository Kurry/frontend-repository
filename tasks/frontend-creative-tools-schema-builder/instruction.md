<summary>
Build a structured output schema builder for prompt-engineering workflows using React, Zustand, Tailwind CSS 4.3.2, and IBM Carbon Design System. The app produces the user's schema package: field-definition records and draft-07 JSON Schema that leave with the session as exportable, re-importable artifacts.
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

Feature: Field configuration panel (API-shaped FieldDefinition) —
- Clicking a node opens a side configuration panel that edits a FieldDefinition create/update payload. FieldDefinition field contract (the record the panel commits IS the would-be request body for a schema-registry field API; all keys required unless marked optional; example values illustrative only): key (required string, 1 to 40 characters, unique among siblings, matching letters digits and underscores only — no spaces or punctuation), type (required closed enum exactly one of string, number, boolean, object, array), required (required boolean), description (optional string), enumValues (optional array of non-empty strings; only when type is string; when present must contain at least one entry), minimum (optional number; only when type is number), maximum (optional number; only when type is number), pattern (optional string; only when type is string; must be a valid regular-expression expression). Cross-field rules: when both minimum and maximum are set, minimum must be less than or equal to maximum; changing type clears constraint inputs that do not apply to the new type; empty enumValues entries are rejected. The panel shows type select, description textarea, and the type-dependent constraint inputs; the visible constraint inputs change when the type changes
- Changing any setting in the panel updates the tree node and every derived pane immediately when the FieldDefinition validates; invalid values show inline messages naming the field and the rule and are not applied
- Constraint inputs validate inline against the FieldDefinition contract: a minimum greater than the maximum, an invalid pattern expression, a sibling-duplicate key, a key outside the allowed pattern, or an empty enum entry shows a message naming the field and the offending rule, and the invalid value is not applied to the schema
- A constraint templates library in the panel lists seeded templates — at least Email pattern, Percentage 0 to 100, ISO date pattern, Non-empty string, and Status enum — and applying one fills the matching constraint inputs with visible values on the selected node that satisfy the FieldDefinition contract

Feature: Live schema text —
- A right pane shows the compiled JSON Schema (draft-07 shaped) text for the current tree; every tree or configuration edit updates the compiled text within 100 milliseconds
- The compiled text is standard, consumable JSON Schema: valid JSON that parses without error, carrying a draft-07 $schema declaration and the standard type, properties, required, enum, minimum, maximum, and pattern keywords — the same document any standard validator could consume as a registry payload
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
- An Import from example panel accepts a pasted JSON object and produces an inferred schema draft for review: each inferred field shows its name, inferred type, and inferred constraints matching the FieldDefinition contract, with per-field accept and reject toggles
- The inferred draft follows the pasted example — different pasted objects produce different drafts whose fields and types match the example's keys and values
- Applying the reviewed draft replaces the working tree with the accepted fields and the compiled text and example payload update; rejecting a field omits exactly that field

Feature: Schema versioning and diff —
- A Save version control snapshots the current tree under a required name; VersionSnapshot field contract: name (required string, 1 to 80 characters). Versions list with name and timestamp, newest first; saving with an empty name shows an inline message naming the field and saves nothing
- A Diff view compares any two selected versions structurally: added fields render in a success treatment, removed fields in an error treatment, and changed fields (type, required, or constraints) in a warning treatment, each labeled with what changed
- Changing either selected version updates the diff without a reload, and diffing a version against itself shows an explicit no-differences state

Feature: Schema library —
- A left sidebar lists saved schemas with name and field count, seeded with at least 4 schemas on first load — an evaluation result, an agent task, prompt metadata, and a classification response; clicking one loads it into the tree, and the active entry is visually marked
- A New button starts a blank schema with a root object; a Delete action removes the selected schema after a confirmation; a Duplicate action copies the schema under a copy-suffixed name
- A metadata field builder lets the user define custom metadata fields for library entries. MetadataField field contract (the form create payload IS the would-be request body): label (required string, 1 to 40 characters), type (required closed enum exactly one of text, number, date, dropdown), options (required array of non-empty strings when type is dropdown; omitted otherwise). Defined fields immediately render as editable inputs on every library entry's details, and values entered there display on that entry

Feature: Undo, redo, and history timeline —
- Undo and Redo controls revert and reapply tree mutations — add, rename, retype, constraint edits, reorder, nest, deletions, bulk actions, imports, and schema-package imports; each control shows the label of the action it will affect and disables when its stack is empty
- A history timeline slider spans the edit history of the active schema; dragging it scrubs the tree, compiled text, and example payload backward and forward through recorded states, with the current position labeled by its action name
- Undoing a drag reorder restores the previous sibling order in the tree and the compiled text

Feature: Schema package export and import (API-shaped SchemaPackage) —
- The app produces the user's schema package: an Export control opens a modal offering three live-compiled formats assembled from the current session — compiled JSON Schema text (draft-07), SchemaPackage JSON, and, when a validation run has completed, a validation report containing the payload summary, per-field outcomes, and the run's failure count
- SchemaPackage field contract (Copy, Download, and SchemaPackage Import all conform to this same shape; field names and enum values are visible in the JSON preview text; all keys and nesting required unless marked optional; example values illustrative only): schemaVersion (required string exactly schema-package-v1), name (required string — the active library schema name), jsonSchema (required object — the current draft-07 document with $schema, type, properties, required, and per-field enum, minimum, maximum, and pattern where defined), fields (required array of FieldDefinition records mirroring the tree in sibling order; object and array nodes include a children array of nested FieldDefinition records; leaf nodes omit children or use an empty array), metadata (required object mapping each defined metadata field label to its current string value on the active schema; may be empty), examplePayload (required object — the current Example-tab payload), formatInstruction (required string — the current Format Prompt text). Editing the tree or constraints and reopening Export changes every format so it matches the session; every required SchemaPackage key above is visible in the JSON preview
- Each format offers Copy (writes the exact preview text to the clipboard with visible confirmation) and Download (triggers a real file download of that format)
- Both the compiled schema and the SchemaPackage derive live: editing the schema or re-running validation and reopening the export reflects the change; an export that omits session mutations or fails the SchemaPackage field contract is incorrect
- An Import package control accepts a pasted or loaded SchemaPackage JSON; a successful import that conforms to the SchemaPackage field contract replaces the working tree, compiled text, example payload, format instruction, and active schema name so all panes match the imported package
- Import package rejects non-conforming payloads without mutating the tree: malformed JSON, missing required schemaVersion/name/jsonSchema/fields/metadata/examplePayload/formatInstruction keys, schemaVersion not exactly schema-package-v1, a fields element that violates the FieldDefinition contract (type outside the closed enum, sibling-duplicate key, minimum greater than maximum, empty enum entry, or invalid pattern), or jsonSchema that is not a parseable object shows a visible validation message naming the offending field and leaves the working schema unchanged
- Exporting then re-importing a SchemaPackage JSON reconstructs the same visible tree structure, compiled schema text, example payload, and format instruction; Import from example remains a separate inference flow and does not replace SchemaPackage Import
</core_features>

<user_flows>
- Editing end to end: adding a field, renaming it, marking it required, and constraining it in the panel updates the tree, the compiled schema text, the example payload, and the format instruction — all within a beat of each edit and without a reload
- FieldDefinition create flow: open a node's configuration panel, set a unique key of 1 to 40 characters matching the allowed pattern, choose a type from the closed enum, set valid constraints for that type, and confirm the tree row, compiled text, and example all reflect that FieldDefinition payload
- Validating end to end: pasting a payload that violates one constraint and running validation advances the per-field steps, completes with exactly that field marked failed on the tree with a message naming the path and constraint, and the exported validation report lists the same failure
- Fixing and re-running: editing the schema so the previously failing constraint now passes, then re-running validation on the same payload, flips that field's annotation to pass — the annotations track the live schema, not a stale copy
- Versioning end to end: saving a version, making two structural edits, saving a second version, and diffing the two shows exactly those edits color-coded; scrubbing the history slider back before the edits restores the earlier tree and compiled text
- Importing from example end to end: pasting an example object, rejecting one inferred field, and applying produces a tree whose fields match the accepted inferences; the example payload and compiled text reflect the imported schema
- Export package flow: edit the schema (add a constrained field), open Export, confirm the SchemaPackage JSON preview shows schemaVersion schema-package-v1 plus name, jsonSchema, fields, metadata, examplePayload, and formatInstruction from the SchemaPackage field contract with the new field present, copy or download the JSON, then Import package that JSON after clearing or switching schemas and confirm the tree, compiled text, example, and format instruction restore the same session work
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
- Importing malformed SchemaPackage JSON shows an inline parse error naming the import problem and leaves the working schema unchanged
- Importing parseable JSON that fails the SchemaPackage field contract — missing required schemaVersion/name/jsonSchema/fields/metadata/examplePayload/formatInstruction keys, schemaVersion not exactly schema-package-v1, or a fields element outside the FieldDefinition contract — leaves the tree unchanged and shows validation naming the offending field
- Export with an empty-object schema still opens and shows a SchemaPackage whose jsonSchema is an object with no properties and whose fields array is empty, still including schemaVersion schema-package-v1 and the required SchemaPackage keys; Copy and Download remain available
</edge_cases>

<visual_design>
- Layout: a left sidebar with the schema library and metadata builder, a central tree editor, and a right region with tabs for the compiled schema text, example payload, and format instruction; the configuration panel docks to the right at roughly 280 pixels wide with a structured form layout
- The schema tree uses indented rows with chevron toggles for object and array collapse; type badges render in a monospace face inside compact tags, with one consistent color per type used everywhere that type appears
- Required fields show an asterisk in the error-accent color after the field name, in the tree and in the compiled-text pane's required listing
- The compiled schema text, example payload, and SchemaPackage JSON preview render in a monospaced, syntax-styled read-only code surface with visible structure indentation
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
- Toasts for copies, saves, inserts, imports, and deletions slide in, remain readable, and auto-dismiss with a fade
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
- Action labels are specific verbs such as Add field, Save version, Run validation, Export, and Import package rather than generic labels
- Validation and import error messages name the field path and the violated rule with its bound, including the field-contract rule when validation fails (for example allowed key pattern, type enum, schemaVersion schema-package-v1, or minimum versus maximum); empty states explain what belongs there and how to add it; no placeholder text appears anywhere in the shipped UI
- Type names, constraint labels, version terminology, and package terminology are consistent across the tree, panel, diff, and exports
</writing>

<innovation>
- Optional enhancements the builder may add, none required for a passing build: a minimap of large trees; per-type keyboard shortcuts for adding fields; a shareable one-line schema summary; inline documentation hints per constraint; a short first-run coachmark for Export package
</innovation>

<requirements>
Shared application state must live in Zustand (in-memory only): the schema library and active schema tree, node selection and multi-selection, the configuration panel state, compiled text, example payload and format instruction derivations, playground payload and validation run state (per-step statuses, attempts, checkpoints, event timeline, rollups, per-field annotations), versions and diff selections, import drafts and per-field review toggles, schema-package import validation state, metadata field definitions and values, undo and redo stacks with the history timeline position, the prompt draft drawer, and UI chrome. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Every tree or configuration edit flows to the compiled text, example payload, format instruction, SchemaPackage export, and validation context from the one shared tree; no pane holds a second disconnected copy
- Loading, duplicating, or deleting a library schema updates the sidebar, the tree, and every derived pane from the same shared collection
- Advancing a validation step updates the step list, event timeline, rollup, and tree annotations from the same shared run state; pause and resume preserve completed steps
- Undo, redo, and the history slider operate on the same shared state the visible controls mutate
- Versions snapshot from and diff against the shared tree; applying an import from example or a SchemaPackage import replaces the shared tree so all panes update together
Build tooling: Vite SPA. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer. IBM Carbon Design System (@carbon/react) is the component library for all UI chrome — tree and list surfaces, tags, modals, notifications, code snippets, tabs, and form controls; no other component library. @dnd-kit/core for drag-to-reorder. Ajv for validating generated examples and playground payloads against the schema. Motion for React and AutoAnimate allowed for animation; no other animation libraries. Icons from @carbon/icons-react only, installed via npm — no raw copy-pasted SVG icon sets. All forms — node configuration, Save version, metadata field builder, Import from example, and Import package — are driven by React Hook Form validating through a Zod schema: the schema defines the rules and inline per-field errors render before submit. Schemas are API-shaped: they model the payloads a real schema-registry / structured-output API would accept — the FieldDefinition, MetadataField, VersionSnapshot, and SchemaPackage field contracts above — the record a form creates IS the would-be request body, and exports and imports conform to those same schemas. No backend or authentication; validation runs are simulated with realistic per-step latency and occasional simulated retries, so two runs are not byte-identical in timing. All libraries installed via npm and bundled locally; no CDN imports.
- Seed at least 4 example schemas on first load — an evaluation result, an agent task, prompt metadata, and a classification response — each with at least 6 fields including at least one nested object and one array, so the tree, compiled text, and example payload are non-empty on first load; seeded FieldDefinition records already conform to the field contract
- Zero navigational outbound links for app chrome — in-app controls only; view changes via shared client state
- The exportable end state is the SchemaPackage JSON (and companion compiled JSON Schema text) compiled live from the session; SchemaPackage must conform to the declared field contract, and an export that omits session mutations or fails the contract is invalid
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
- Editor object types: schema; field-node; metadata-field; version
- Editor properties: key-name; type; required; description; enum-values; minimum; maximum; pattern; constraint-template; nest-level; sibling-order; schema-name; version-name; metadata-field-label; metadata-field-type; metadata-field-options; playground-payload; import-example-json; import-field-accept; schema-package-json
- Editor operations: select; add; delete; update_property; set_content; switch_mode; preview
- Editor modes: schema-text; example; format-prompt; diff; playground; import
- Session operations: start; pause; resume; advance
- Demos: validation-run; regenerate-example; apply-import-draft
- Entity: schema
- Entity operations: create; select; update; delete
- Entity fields: name; fields; metadata
- Artifact operations: export; import; copy
- Export formats: compiled-schema-json; schema-package-json; validation-report-text; format-instruction-text
- Import modes: example-json; schema-package
- Value bounds: FieldDefinition.type in {string, number, boolean, object, array}; FieldDefinition.key 1 to 40 chars, unique among siblings, letters digits underscores only; FieldDefinition: minimum must not exceed maximum; invalid patterns rejected; enumValues reject empty entries; SchemaPackage.schemaVersion exactly schema-package-v1; required keys schemaVersion, name, jsonSchema, fields, metadata, examplePayload, formatInstruction; constraint templates in {Email pattern, Percentage 0 to 100, ISO date pattern, Non-empty string, Status enum}; MetadataField.type in {text, number, date, dropdown}; label required 1 to 40 chars; options required when dropdown; VersionSnapshot.name required 1 to 80 chars; versions are never edited in place; root node has no Delete; delete of a node with descendants requires confirm=true
- Workflow completion: every tree or configuration edit updates the compiled draft-07 schema text, the example payload, the format instruction, and the SchemaPackage export within a beat, from the one shared tree
- Workflow completion: the compiled text is valid JSON carrying $schema, type, properties, required, enum, minimum, maximum, and pattern for the nodes that define them
- Workflow completion: SchemaPackage JSON preview shows schemaVersion schema-package-v1 plus name, jsonSchema, fields, metadata, examplePayload, and formatInstruction reflecting the session
- Workflow completion: exporting then importing a schema-package reconstructs the same tree, compiled text, example payload, and format instruction; non-conforming packages are rejected without mutation
- Workflow completion: a completed validation run maps per-field pass/fail annotations onto the tree, naming the field path and violated constraint keyword with its bound
- Workflow completion: pausing a validation run freezes at the current step and resuming continues there; the rollup and event timeline agree with the step list
- Workflow completion: applying a reviewed import-from-example draft replaces the tree with exactly the accepted fields; rejected fields are omitted
- Workflow completion: diffing two saved versions color-codes added, removed, and changed fields; a self-diff shows the explicit no-differences state
- Workflow completion: entity create/select/update/delete on schema updates the library list and active tree the same as the visible sidebar controls

Mechanics exclusions:
- Node drag-to-reorder gesture mechanics (@dnd-kit sibling slide, drop settle) are graded via Playwright; resulting sibling order as state may be asserted afterward
- History-timeline slider scrubbing (continuous tree updates while dragging) and undo/redo keyboard shortcuts are graded through the real controls via Playwright
- Field add height-expansion, delete collapse, configuration-panel slide, tab crossfade, and step-order annotation pop-in animations stay Playwright-observed
- Retry backoff countdown ticking and running-step activity indicators stay Playwright-observed
- Clipboard contents and downloaded export files remain Playwright responsibilities; no raw file/blob contents in WebMCP arguments or results

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
