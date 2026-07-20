<summary>
Build a prompting-technique template forms studio for an AI prompt-authoring suite using React, Zustand, Tailwind CSS 4.3.2, IBM Carbon Design System (@carbon/react), and React Hook Form with Zod validation.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Technique selector —
- A left sidebar lists exactly seven prompting technique categories: Zero-Shot, One-Shot, Few-Shot, Chain-of-Thought, Outcome-Based, Role-Based, and Constraint-Based; clicking a technique loads its form in the main panel without a page reload
- The active technique in the sidebar renders with a selected background treatment and a left accent indicator that no inactive entry has
- Each sidebar entry carries a status chip that tracks that technique's lifecycle: no chip (or a neutral chip) before any input, In progress once the form has unsaved input, Generated after a successful submit, and Saved after its prompt is added to the library; the chips update as the user acts

Feature: Schema-driven forms —
- Every technique form renders from its own validation schema: each declared field appears with a visible label, required fields are marked, and the same schema drives which inline errors appear
- The Zero-Shot form contains a task description (required, multi-line), an output format select, and a tone select; submitting generates a zero-shot prompt string in the preview panel that contains the entered task description and the chosen format and tone
- The One-Shot form contains a task description (required) and exactly one example pair (example input and expected output, both required); the generated prompt includes the task and the example pair
- The Few-Shot form contains a task description (required) and a dynamic example list where each example row has an input field and an expected output field; clicking Add Example appends a new row and clicking Remove on a row removes exactly that row
- The Few-Shot form requires at least one complete example: with zero example rows the submit control is disabled and a message states that at least one example is required
- The Chain-of-Thought form contains a goal (required), an ordered list of reasoning step inputs with add and remove controls that preserve numbering, and a scratchpad toggle; when the toggle is active the generated prompt ends with a think-step-by-step instruction, and when inactive that instruction is absent
- The Outcome-Based form contains a goal (required), a dynamic success criteria list (at least one required), and a measurement select; the generated prompt lists every entered criterion
- The Role-Based form contains a role or persona (required), an audience field, and a task description (required); the generated prompt opens by assigning the entered role
- The Constraint-Based form contains a task description (required) and a dynamic constraints list where each row has a constraint type select and a constraint text field (at least one required); the generated prompt enumerates every constraint
- The Few-Shot and Role-Based forms each include a reference documents field: an add control opens a picker of 6 seeded assets, chosen assets render as inline badges that reveal a name-and-type preview and a remove control on hover, and removing deletes exactly that badge

Feature: Form validation —
- Attempting to submit with a required field empty shows an inline error under that field naming the field and the fix, and no prompt is generated
- The submit control stays disabled until every required field in the active technique's form is valid
- Correcting an invalid field clears that field's inline error without affecting other fields' errors

Feature: Draft retention —
- Switching to another technique and back preserves the first technique's in-progress field values, example rows, and attachments while the app stays open

Feature: Preview and save —
- Submitting a valid form renders the assembled prompt string in a read-only, code-styled multi-line preview panel below the form; submitting again after edits regenerates the preview from the current values
- The preview panel has a copy control that places the exact assembled prompt text on the clipboard and shows a visible confirmation such as an icon swap or a toast
- Clicking Save to Library from the preview panel opens a confirmation modal with a title field auto-populated from the technique name (editable, required); the confirm control stays disabled until the title is valid, and confirming adds the prompt to the library and shows a success toast

Feature: Library view —
- A Library view, switchable from the forms view without a page reload, lists saved prompts — 5 seeded on first load — each row showing title, technique tag, and a saved-time label
- Opening a library entry switches to that entry's technique form with every saved field value, example row, and attachment restored exactly, and shows its generated prompt in the preview panel
- Deleting a library entry removes its row and decreases the visible count by exactly one

Feature: Save payload and library export —
- Save-to-library request-body field contract (the saved library record IS the would-be request body): required title (trimmed string length 2–80), required technique (exactly one of the seven technique ids), required fields (object of that technique's schema-driven values), required promptText (non-empty assembled string matching the visible preview at save time), optional attachments (array of seeded filenames). Cross-field: technique must match the active form; promptText must equal the current preview; empty title keeps confirm disabled with a named title error and adds no row.
- An Export library control compiles template-library.json with required keys schemaVersion (number exactly 1), product (exactly Template Forms), entries (array of save-to-library request-body objects in library order), and generatedAt (ISO-8601 datetime ending in Z), plus a Download assembled prompt markdown for the active preview. Both update after Save or Delete without a reload. Download JSON, Download Markdown, and Copy emit the visible text; an export that omits a session save/delete is invalid. Import library JSON accepts a conforming document and replaces the library so a fresh export matches; malformed payloads show a visible error and change nothing.
</core_features>

<user_flows>
- Generate and save end to end: open Few-Shot, enter a task description and two example rows, attach one reference document, submit, confirm the preview contains the task and both examples, save from the modal, and confirm the library count increases by one and the Few-Shot sidebar chip reads Saved — all without a reload
- Validation flow: on Chain-of-Thought, attempt to submit with the goal empty, confirm an inline error names the goal field, no preview is generated, and the submit control is disabled; enter a goal and confirm the error clears and submit enables
- Draft retention flow: start filling Zero-Shot, switch to Role-Based, fill part of it, switch back, and confirm Zero-Shot still holds its entered values and its chip reads In progress
- Round trip: open a seeded library entry, confirm the matching technique form loads with the saved values restored and the preview populated, change one field, resubmit, and confirm the preview reflects the change
- A page reload returns the app to its seeded state: 5 library prompts, empty technique forms, and neutral sidebar chips
- Export library flow: save a valid Few-Shot prompt, open Export library, confirm template-library.json includes that title and technique and promptText matches the preview, Download or Copy, then delete the entry and confirm the next export omits it
- Import round-trip flow: export JSON after a save, note the entries length, delete to diverge, Import that JSON, and confirm the library and a fresh export reconstruct to match
</user_flows>

<edge_cases>
- Removing every Few-Shot example row disables submit and shows the at-least-one-example message; adding a row back re-enables validation as normal
- Double-activating the save modal's confirm control creates exactly one library entry: the count increases by one and one new row appears
- A very long task description (500 or more characters) is accepted, appears in full in the generated preview, and is truncated with an ellipsis in its library row without breaking the layout
- Toggling the Chain-of-Thought scratchpad after generating and resubmitting adds or removes the think-step-by-step instruction in the preview accordingly
- Deleting every library entry shows an empty state message in the library list with a control that returns to the forms view
</edge_cases>

<visual_design>
- Layout: a fixed-width left sidebar of roughly 200 pixels carries the technique list; the main panel shows the active form above and the preview panel below
- Forms use a vertical layout with visibly grouped sections; selects and multi-line inputs share one styled treatment, and multi-line inputs show a character count
- The preview renders as a code-styled multi-line container in a monospace typeface with the copy control anchored to it
- The active technique entry uses a selected background and left accent bar; status chips use a consistent color language (neutral, in-progress, generated, saved) across all seven entries
- One consistent icon set is used across the sidebar, form controls, badges, and library rows
- Buttons, inputs, selects, and chips show distinct default, hover, focus (visible ring), disabled, and error treatments; inline errors render in a consistent error color with the field they belong to
- Typography keeps a clear hierarchy: the technique title is visibly larger than section headings, which are larger than field labels and helper text, consistently across all seven forms and the library view
</visual_design>

<motion>
- Switching techniques cross-fades the form panel over roughly 150 milliseconds rather than swapping instantly
- Adding or removing an example, reasoning step, or constraint row animates the row's height over roughly 150 milliseconds
- Inline validation errors ease in below their fields rather than snapping, and clear smoothly when fixed
- A sidebar status chip changing value animates its transition rather than swapping instantly
- The save modal enters and exits with a short opacity and scale transition; toasts slide in, remain readable, and auto-dismiss with a fade
- The copy control's confirmation animates (icon swap or check morph)
- Library rows animate in on save and out on delete rather than snapping
- Hover animations (required): sidebar entries and library rows take a full-width hover wash, buttons ease background and shadow with a slight press effect, and form controls show focus rings
- With prefers-reduced-motion set, all transitions are instant and every feature remains usable
</motion>

<responsiveness>
- Below 768 pixels wide the technique sidebar collapses into a top select or drawer control that still reaches all seven techniques; the form and preview stack in one column
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; dynamic rows and badges wrap within their containers
</responsiveness>

<accessibility>
- Every interactive control — technique entries, form fields, add and remove row controls, attachment badges, the copy control, modal fields, library rows — is reachable and operable with the keyboard alone, with a visible focus indicator
- The save modal traps focus while open, closes on Escape, and returns focus to the Save to Library control
- Every field has a programmatically associated visible label, and each inline error is associated with its field so assistive technology reads the field name with the error
- Submitting an invalid form announces the validation failure through a polite live region in addition to the visible inline errors
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or unhandled promise rejections appear on load or during a full exercise of all seven forms, the preview, and the library
- Adding 10 example rows in Few-Shot keeps typing and row controls responsive with no hangs
</performance>

<requirements>
Shared application state must live in Zustand (in-memory only): the active technique, each technique's draft field values, example and constraint rows, attachment lists, per-technique lifecycle status, the generated prompt per technique, the library collection, the active view, and UI chrome. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Typing in any form updates that technique's draft in the shared store; switching techniques and back restores the draft from the same store, and the sidebar status chips derive from it
- Submitting a valid form writes the generated prompt to the store; the preview panel and the technique's Generated chip derive from that one record
- Saving adds one entry to the library collection; the library list, its count, and the Saved chip derive from that collection, and opening an entry hydrates the form from the same record
- Deleting a library entry removes it from the list and the count in the same interaction
- Active view and chrome are shared client state; switching views never reloads the document
Build tooling: Vite SPA. IBM Carbon Design System (@carbon/react) is the only component library, used for all UI chrome — sidebar, form controls, selects, text areas, modal, tags, toasts, and the preview container. Every form — all seven technique forms, the save modal, and Import library — is driven by React Hook Form validating through a Zod schema that mirrors the API-shaped per-technique field contracts and the save-to-library / template-library.json schemas above: the schema declares the fields and rules, dynamic example, step, and constraint rows are managed as schema-validated field arrays, inline per-field errors render before submit, a successful save record IS the would-be request body, and export/import validate through the same schemas. End-state contract: Download JSON / Download Markdown / Copy MUST emit the session's actual library and preview — an export that omits session work is invalid; Import MUST restore the same visible library (round-trip). Motion for React and AutoAnimate allowed for animation; no other animation libraries. Icons from @carbon/icons-react only. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer; Carbon keeps its component styles and Tailwind owns layout and custom surfaces. All libraries installed via npm and bundled locally; no CDN imports. No backend or authentication; generation is deterministic string assembly in memory.
- Implement all 7 technique forms; seed 5 library prompts covering at least 3 different techniques and 6 pickable reference assets
- Zero navigational outbound links for app chrome; view changes happen via shared client state
- A page reload returns the app to its seeded state
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
- form-workflow-v1
- browse-query-v1
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
- Form fields: task-description; output-format; tone; example-input; expected-output; goal; reasoning-step; scratchpad; success-criterion; measurement; role; audience; constraint-type; constraint-text; reference-documents; title
- Form operations: validate; submit; cancel; reset
- Destinations: zero-shot; one-shot; few-shot; chain-of-thought; outcome-based; role-based; constraint-based; library
- Browsable entity: library-prompts
- Entity: library-prompt
- Entity operations: create; select; delete
- Entity fields: title; technique; field-values; attachments
- Artifact operations: copy

Mechanics exclusions:
- Technique selector: sidebar status-chip transition animation and form cross-fade stay Playwright-observed
- Schema-driven forms: attachment badge hover preview/remove reveal and dynamic-row height animations stay Playwright-observed
- Preview and save: clipboard contents verification and copy-confirmation animation stay Playwright responsibilities

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
