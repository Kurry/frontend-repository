<summary>
Build a prompt workbench editor for an AI prompt-authoring studio using React, Zustand, Tailwind CSS 4.3.2, and IBM Carbon Design System (@carbon/react).
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Prompt editor —
- The main panel is a code-styled prompt editor supporting plain text entry and variable placeholder insertion via double-brace syntax (for example {{variable_name}}); every placeholder renders with a distinct highlight treatment that plain text does not have
- A token counter in the toolbar updates continuously as the user types, displaying the estimated token count for the selected model; the count is 0 when the editor is empty and grows as text is added
- A live pricing estimator sits beside the token count and updates on every keystroke and model change, showing an estimated cost derived from the current token count and a mock per-model pricing table; switching models changes the estimate for the same editor text without any other action
- Selecting a different model updates the token count estimate and the pricing estimate for the same editor text without any other action
- Clicking Insert Variable opens a popover with a variable name field; VariableInsert field contract (the popover submit IS the would-be insert request body): name (required string, 1 to 64 characters, matching letters digits and underscores only — pattern letters/digits/underscores with no spaces or punctuation). The confirm control stays disabled until name is valid; an invalid name shows an inline message naming the name field and the allowed format; confirming inserts the double-brace placeholder at the cursor position and closes the popover
- A horizontal row of at least 4 suggestion chips sits above the editor; clicking a chip replaces the editor content with exactly that chip's prompt text and moves focus to the editor; when the row overflows it scrolls horizontally without shifting the vertical layout

Feature: Persona preface —
- A Persona control opens a drawer listing at least 4 seeded persona templates (role and context text); selecting a persona attaches it as a system preface above the prompt body and shows the persona name as a chip near the editor; clearing the persona removes the preface and the chip
- The live preview and the exported prompt package both include the active persona preface when one is attached, and omit it when none is attached
- Attaching a different persona replaces the previous preface text immediately in the preview

Feature: Variable binding panel —
- A side panel lists every detected double-brace placeholder in the current prompt; typing a new placeholder in the editor adds its entry to the panel and deleting the placeholder removes the entry, with no manual refresh action
- Each entry shows the variable name and an input for its current value; a variable whose value is empty shows a visible Unbound indicator on its entry
- Updating a variable value in the side panel immediately reflects in the live preview panel without any manual action

Feature: Live preview —
- A read-only preview panel shows the prompt text with all variable placeholders replaced by their bound values; unbound variables render with a visible warning highlight instead of a substituted value; when a persona is attached, the preview shows the persona preface above the resolved body
- The preview updates within 100 milliseconds of any change to the editor text, the persona, or the variable bindings

Feature: Model selection —
- A model selector in the toolbar lists exactly 6 seeded models grouped under 3 provider groups; the currently selected model name is visible in the toolbar at all times, including while a run is streaming
- The model recorded on each run's metadata row matches the model that was selected when that run started

Feature: Run and streaming response (chat-completions-shaped request) —
- Clicking Run starts a simulated run whose would-be request body is a chat-completions payload assembled from shared state: model (the selected model id), messages (an array of role/content objects — a system message when a persona preface is attached, plus a user message whose content is the current prompt text), temperature (number from 0 through 2 inclusive, default 1), and maxTokens (integer from 1 through 4096 inclusive, default 1024). The Run control does not require a separate request form; the payload is derived from the workbench and is visible in the JSON package latestRun.request when a run has completed
- The response panel below the editor renders the response progressively (text appears incrementally, never all at once), and a status affordance visibly distinguishes waiting, streaming, and complete states
- The Run control is disabled while the editor is empty and while a run is streaming; while streaming, the Run control is replaced by a Stop control
- Activating Stop freezes the response at its current text — no further text appends — marks the run as stopped in its status affordance, and re-enables Run
- While streaming, the response panel auto-follows the latest content; if the user scrolls up, auto-follow stops and a jump-to-latest control appears; activating it scrolls back to the newest content and resumes following
- Each run appends an entry to a run history list showing the model name, a timestamp, and the run status; selecting a history entry displays that run's response, reasoning, variants, and step panel
- Response content that contains code renders in a monospaced block with a language label and a copy control; activating copy puts the exact code text on the clipboard and shows a visible confirmation such as an icon swap or a toast

Feature: Run step panel —
- Each run decomposes into at least 3 visible steps (for example prepare context, generate draft, finalize); each step shows a name and a status that advances through pending, running, and complete or failed during the simulation
- A run-level rollup shows steps complete out of total and updates as steps advance; selecting a history entry shows that run's step statuses and outputs

Feature: Reasoning disclosure —
- Each run's response carries a collapsible reasoning region that is collapsed by default; activating its header expands or collapses it with a rotating chevron cue
- While the run is streaming, the reasoning header shows an active indicator; once the run completes, the header shows a duration summary line stating how long the reasoning took
- The expanded or collapsed state of each run's reasoning region is remembered per run while the app stays open

Feature: Response variants —
- A completed run exposes 3 simulated response variants; prev and next controls with a position label (for example 2 of 3) flip between them; prev is disabled on the first variant and next is disabled on the last
- Flipping variants updates the displayed response text, the reasoning content, and the run metadata row together without a reload

Feature: Attachments —
- A prompt can carry attachments chosen from a seeded asset picker of at least 5 assets; an add control opens the picker and choosing an asset appends its attachment immediately
- Attachments render as compact inline badges near the editor toolbar; hovering a badge reveals a preview showing the asset name and type; hovering also reveals a remove control that removes exactly that attachment with visible feedback
- Saved library prompts keep their attachments, and at least one seeded library prompt ships with an attachment

Feature: Save to library and library view (API-shaped LibraryPrompt records) —
- Clicking Save opens a modal dialog that submits a LibraryPrompt create payload. LibraryPrompt field contract (the record the form creates IS the would-be request body; all keys required unless marked optional; example values illustrative only): title (required string, 1 to 80 characters, unique among existing library prompts), technique (required closed enum exactly one of zero-shot, few-shot, chain-of-thought, role-prompt, extraction, summarization), promptText (required string — the current editor draft, may be empty only when the user explicitly saves an empty draft), bindings (required object mapping each detected variable name to its current string value; keys must match the VariableInsert name pattern), attachments (required array of seeded asset ids currently on the draft; may be empty), personaId (optional string or null — the attached persona template id when present). The confirm control stays disabled until title and technique are valid; invalid fields show inline messages naming the field and the fix (including uniqueness for title and the closed technique set); confirming adds one library row whose visible title and technique match that payload and shows a success toast
- A Library view, switchable from the workbench without a page reload, lists the saved prompts — 4 seeded on first load, each already conforming to the LibraryPrompt field contract — each row showing title, technique tag, and attachment count
- A technique filter control in the Library view narrows the list to matching technique tags from the closed enum; clearing the filter restores the full list
- Library rows support multi-select via checkboxes; when two or more rows are selected, a bulk Export selected control appears and packages exactly those prompts as a JSON array of LibraryPrompt records using the same field contract
- Opening a library entry loads its prompt text, persona, variable bindings, and attachments back into the workbench exactly as saved
- Deleting a library entry removes its row and decreases the visible library count by exactly one

Feature: Command palette —
- Pressing Cmd+K (Ctrl+K on non-Mac) opens a command palette overlay with a search field; results fuzzy-match across seeded models, library prompt titles, persona templates, and actions (Export package, Save, Switch to Library, Switch to Workbench)
- Choosing a model result selects that model in the toolbar; choosing a library prompt loads it into the workbench; choosing a persona attaches it; choosing an action runs that action; Escape closes the palette and returns focus to the prior control
- With an empty query the palette lists a short set of top actions; with no matches it shows an empty state naming that nothing matched

Feature: Undo and redo —
- Undo and Redo controls in the toolbar revert and reapply the most recent workbench mutations: editor text edits, persona attach or clear, variable binding value changes, attachment add or remove, and library save or delete; each undo visibly restores the prior state everywhere it appears, and both controls disable when their stacks are empty
- Undoing a library save removes the created entry and restores the prior library count; redo re-adds it identically
- Undoing a binding value change restores the previous value in the panel and the live preview together

Feature: Prompt package export and import (API-shaped PromptPackage) —
- The app produces the user's prompt package: an Export control opens a modal offering two live-compiled formats — Markdown document and JSON package — assembled from the current session state
- The Markdown export includes the active persona preface when present, the prompt body with placeholders, a bindings table of variable names and values, the selected model name, attachment filenames, and when a run has completed a short response summary for the active variant
- PromptPackage field contract (Copy, Download, and Import all conform to this same shape; field names and enum values are visible in the JSON preview text; all keys and nesting required unless marked optional; example values illustrative only): schemaVersion (required string exactly prompt-package-v1), model (required string — the selected seeded model id), promptText (required string — current editor draft), messages (required array of chat-completions message objects; each element has role exactly system or user and content as a string; when a persona is attached the first message is role system with the persona preface, and a user message carries promptText; when no persona is attached the array contains a single user message with promptText), bindings (required object; keys match the VariableInsert name pattern; values are strings), attachments (required array of objects each with id and name strings from the seeded asset set; may be empty), persona (optional null or object with id, name, and preface strings when a persona is attached), technique (optional; when present must be one of the LibraryPrompt technique enum values), latestRun (optional object present after a completed or stopped run, with status, model, summary, and request — request mirrors the chat-completions would-be body with model, messages, temperature from 0 through 2, and maxTokens from 1 through 4096). Editing the draft or bindings and reopening Export changes the preview text so it matches the session; every required key above is visible in the JSON preview
- Each format offers Copy (writes the exact preview text to the clipboard with visible confirmation) and Download (triggers a real file download of that format)
- An Import control accepts a pasted or loaded JSON package; a successful import that conforms to the PromptPackage field contract hydrates the workbench with that package's prompt text, persona, bindings, model, and attachments so the preview matches the imported content
- Import rejects non-conforming payloads without mutating the draft: malformed JSON, missing required schemaVersion/model/promptText/messages/bindings/attachments keys, schemaVersion not exactly prompt-package-v1, a messages element whose role is outside system|user, bindings keys that violate the VariableInsert name pattern, or technique outside the closed enum shows a visible validation message naming the offending field and leaves the workbench unchanged
- Exporting then re-importing a JSON package reconstructs the same visible prompt text, bindings, persona, and model in the workbench; an export that omits session mutations or fails the field contract is incorrect
</core_features>

<user_flows>
- Full run flow: type a prompt containing two placeholders, bind both values in the side panel, confirm the preview shows the resolved text, click Run, watch the response stream progressively to complete with steps advancing, then flip through the 3 variants — all without a reload
- Stop flow: start a run, activate Stop mid-stream, and confirm the response text stays frozen, no further text appends, the run's status shows stopped, and Run is enabled again
- Save round-trip: save the current prompt from the modal, switch to the Library view and confirm the count increased by one, open the new entry, and confirm the workbench shows the same prompt text, persona, bindings, and attachments
- Binding isolation: after a run completes, changing a variable value updates the live preview but the completed run's response text stays unchanged
- Export package flow: edit the prompt and bind a variable, open Export, confirm the Markdown and JSON previews contain the edited prompt text and that binding value and that the JSON shows schemaVersion prompt-package-v1 plus model, promptText, messages, bindings, and attachments from the PromptPackage field contract, download or copy the JSON, then Import that JSON and confirm the workbench restores the same text and bindings
- Undo round-trip: attach a persona, change a binding, then Undo twice and confirm persona and binding return to their prior states in the preview; Redo restores them
- Bulk library export: multi-select two library prompts and activate Export selected; the package is a JSON array of LibraryPrompt records listing exactly those two titles with valid technique enum values
- Command palette flow: open the palette with Cmd+K or Ctrl+K, select a library prompt, and confirm the workbench loads that prompt without a reload
- LibraryPrompt create flow: open Save, enter a unique title of 1 to 80 characters and a technique from the closed enum, confirm, and verify the new library row shows that title and technique
- A page reload returns the app to its seeded state: 6 models, 4 library prompts, 4 suggestion chips, 4 persona templates, an empty editor, empty undo history, and no run history
</user_flows>

<edge_cases>
- Clicking Run while the prompt contains unbound variables shows a warning notice naming the unbound variables and does not start a run
- Deleting every library entry shows an empty state in the library list with a message and a control that returns to the workbench
- Double-activating the Save modal confirm control creates exactly one library entry: the count increases by one and one new row appears
- Removing a placeholder from the editor text removes its binding row from the side panel, and the preview no longer shows a warning for it
- With the editor empty, the token count reads 0, the pricing estimate reads a zero or free amount, and Run stays disabled
- Undo with an empty history and Redo with an empty redo stack are disabled, not silent no-ops
- Importing malformed JSON shows an inline parse error naming the import problem and leaves the workbench draft unchanged
- Importing parseable JSON that fails the PromptPackage field contract — missing required schemaVersion/model/promptText/messages/bindings/attachments keys, schemaVersion not exactly prompt-package-v1, a messages role outside system|user, bindings keys outside the VariableInsert name pattern, or technique outside the closed enum — leaves the draft unchanged and shows validation naming the offending field
- Save with an empty title, a title longer than 80 characters, a duplicate title, or a technique outside zero-shot|few-shot|chain-of-thought|role-prompt|extraction|summarization does not add a library row and shows an inline error naming that field
- Insert Variable with a name longer than 64 characters or containing spaces or punctuation does not insert a placeholder and shows an inline error naming the name field
- Export with an empty editor still opens and shows an empty-body package that still includes schemaVersion prompt-package-v1 and the required PromptPackage keys rather than crashing; Download and Copy remain available
- A technique filter with no matching library rows shows an empty filtered state naming that no prompts match, distinct from the delete-all empty state
</edge_cases>

<visual_design>
- Layout: the left two-thirds of the viewport is the editor and response panel stack; the right one-third is the variable binding panel
- The editor uses a monospace typeface; variable placeholders render with a blue tag-style background highlight, and unbound variables in the preview render with an amber warning highlight that is clearly distinct
- The toolbar is a single strip across the top of the editor carrying the model selector, token count badge, pricing estimate, Insert Variable, Persona, Run, Save, Export, Undo, and Redo controls
- The response panel uses a code-snippet-style container with a visible streaming cursor indicator while a response is in progress; the step panel sits as a compact list above or beside the response body
- Run status uses a consistent color language: a neutral treatment for waiting, an active accent while streaming, a success treatment when complete, and a distinct treatment for stopped
- The Export modal shows Markdown and JSON as tabbed or segmented previews in a monospaced code surface with Copy and Download per format
- The command palette is a centered overlay with a search field and a scrollable result list; selected results show a clear highlight
- One consistent icon set is used across the toolbar, badges, chips, history rows, and palette results
- Buttons, inputs, selects, and chips show distinct default, hover, focus (visible ring), and disabled treatments
- Typography keeps a clear hierarchy: panel titles are visibly larger than metadata rows and helper text, consistently across the workbench and library views
</visual_design>

<motion>
- The response panel slides open from zero height over roughly 250 milliseconds when a run starts
- Streaming text appears incrementally with a blinking cursor at the insertion point while streaming is active; the cursor stops blinking when the run completes or is stopped
- The reasoning region's chevron rotates on expand and collapse, and the region's height animates open and closed rather than snapping
- Flipping response variants cross-fades the response content briefly rather than swapping instantly
- The copy control's confirmation animates (icon swap or check morph), and toasts slide in, remain readable, and auto-dismiss with a fade
- Adding or removing an attachment badge animates it in or out, and library rows animate on add and delete rather than snapping
- The Export modal and command palette enter with a short opacity and scale transition rather than appearing instantly
- Step status transitions fade between pending, running, and complete rather than snapping
- Hover animations (required): buttons ease background and shadow with a slight press effect, suggestion chips and library rows take a hover wash, and form controls show focus rings
- With prefers-reduced-motion set, all transitions apply instantly and the streaming cursor does not blink
</motion>

<responsiveness>
- Below 1024 pixels wide, the variable binding panel moves below the editor stack so the layout becomes a single column; every control remains reachable
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; the toolbar wraps its controls instead of overflowing
- The command palette and Export modal stay fully visible and operable at 375 pixel width rather than rendering off-screen
</responsiveness>

<accessibility>
- Every interactive control — toolbar buttons, suggestion chips, binding inputs, history rows, variant controls, library rows, undo/redo, Export, Import, and command palette results — is reachable and operable with the keyboard alone, with a visible focus indicator
- The Save modal, Export modal, and command palette trap focus while open, close on Escape, and return focus to the control that opened them (or to the prior focus for the palette)
- The Insert Variable popover closes on Escape and returns focus to its trigger
- The reasoning disclosure is keyboard-operable and exposes its expanded or collapsed state to assistive technology
- Run status changes (streaming started, completed, stopped), export copy confirmation, and import success or failure are announced through a polite live region, and validation messages are programmatically associated with their fields
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or unhandled promise rejections appear on load or during a full exercise of the app
- Typing stays responsive with 2000 characters in the editor, and an in-progress streaming run never blocks interaction with the rest of the UI
- Opening the command palette and filtering results stays responsive with no perceptible lag
</performance>

<writing>
- Headings, panel titles, and toolbar labels use one consistent capitalization convention throughout
- Action labels are specific verbs such as Insert Variable, Run, Stop, Save, Export, Import, Undo, and Redo rather than generic Submit or OK where a specific label is possible
- Validation and import error messages name the field or problem and the fix, including the field contract rule when validation fails (for example allowed name pattern, title length, technique enum, or schemaVersion); empty states explain what belongs there and how to add or return; no placeholder text such as TODO or Lorem appears in the shipped UI
- Terminology for prompt, variable, persona, run, and package stays consistent across the workbench, library, export modal, and command palette
</writing>

<innovation>
- Optional enhancements the builder may add, none required for a passing build: a richer settle cue when a stream completes; coordinated stagger when flipping variants; a short first-run coachmark for Export package; a shareable one-line package summary chip; ambient keyboard shortcut hints in the palette footer
</innovation>

<requirements>
Shared application state must live in Zustand (in-memory only): the prompt draft, persona preface, detected variables and their bound values, selected model, attachment list, run history with each run's streaming status, accumulated text, variant index, reasoning expansion state, and step statuses, the follow-scroll flag, the library collection and multi-selection, technique filter, undo and redo stacks, export preview derivations, the active view, command palette open state, and UI chrome. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Typing in the editor updates the detected variable list, the token count, the pricing estimate, and the live preview from the same shared draft — never a second disconnected copy
- Attaching or clearing a persona updates the preview and the export package from the same shared preface
- Starting a run creates one run record; the response panel, status affordance, step panel, run history row, and stop control all derive from that record and advance together
- Flipping a variant updates the response text, reasoning content, and metadata row from the same run record without a reload
- Saving adds one entry to the library collection; the library list and its count derive from that collection, and opening an entry hydrates the workbench from the same record
- Deleting a library entry removes it from the list and the count in the same interaction
- Undo and redo operate on the same shared state the visible controls mutate; export Markdown and JSON regenerate from that state on open
- Import replaces the shared draft so editor, bindings, persona, model, attachments, and preview update together
- Active view and chrome are shared client state; switching views never reloads the document
Build tooling: Vite SPA. IBM Carbon Design System (@carbon/react) is the only component library, used for all UI chrome — toolbar, modal, popover, selects, tags, toasts, and tiles. CodeMirror 6 (or a comparable code editor primitive) for the prompt editor field only. Motion for React and AutoAnimate allowed for animation; no other animation libraries. Icons from @carbon/icons-react only. All forms — the Insert Variable popover, the Save to Library modal, and Import paste when presented as a form — are driven by React Hook Form validating through a Zod schema where fields apply: the schema defines the rules and inline per-field errors render before submit. Schemas are API-shaped: they model the payloads a real prompt-manager / chat-completions API would accept — the VariableInsert, LibraryPrompt, and PromptPackage field contracts above, including the chat-completions-shaped messages/temperature/maxTokens request on latestRun.request — the record a form creates IS the would-be request body, and PromptPackage export/import plus library entity create conform to those same field names, bounds, enums, and cross-field rules. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer; Carbon keeps its component styles and Tailwind owns layout and custom surfaces. All libraries installed via npm and bundled locally; no CDN imports. No backend or authentication; model responses are simulated in memory with realistic streaming delays.
- Seed exactly 6 models across 3 provider groups (each with a mock price per token), 4 library prompts (at least one carrying an attachment; every seeded prompt conforms to the LibraryPrompt field contract), 5 pickable attachment assets, 4 suggestion chips, and 4 persona templates
- Zero navigational outbound links for app chrome; view changes happen via shared client state
- A page reload returns the app to its seeded state
- The exportable end state is the PromptPackage JSON (and Markdown companion) compiled live from the session; PromptPackage must conform to the declared field contract, and an export that omits session mutations or fails the contract is invalid
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
- Editor object types: prompt-draft; variable; attachment; persona
- Editor properties: prompt-text; variable-name; variable-value; model; persona-id
- Editor operations: set_content; add; delete; update_property; select; preview; switch_mode
- Editor modes: workbench; library
- Session operations: start; stop; advance
- Entity: library-prompt
- Entity operations: create; select; delete
- Entity fields: title; technique; prompt-text; bindings; attachments; persona
- Artifact operations: export; import; copy
- Export formats: markdown; json
- Import modes: json

Mechanics exclusions:
- Run and streaming response: incremental text streaming, blinking cursor, and auto-follow/jump-to-latest scroll mechanics stay Playwright-observed
- Reasoning disclosure: expand/collapse gesture, chevron rotation, and active-indicator visuals stay Playwright-observed
- Attachments: badge hover preview and hover-revealed remove control stay Playwright-observed
- Prompt editor: live token-counter update while typing is a derived display judged by observation
- Command palette: open/close overlay animation and keyboard focus trap stay Playwright-observed
- Export modal: download file picker interaction and clipboard contents stay Playwright-observed
- Undo/redo: button enable/disable and visible state restore are graded by observation; no batch replay via WebMCP

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
