<summary>
Build a prompt workbench editor for an AI prompt-authoring studio using React, Zustand, Tailwind CSS 4.3.2, and IBM Carbon Design System (@carbon/react).
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Prompt editor —
- The main panel is a code-styled prompt editor supporting plain text entry and variable placeholder insertion via double-brace syntax (for example {{variable_name}}); every placeholder renders with a distinct highlight treatment that plain text does not have
- A token counter in the toolbar updates continuously as the user types, displaying the estimated token count for the selected model; the count is 0 when the editor is empty and grows as text is added
- Selecting a different model updates the token count estimate for the same editor text without any other action
- Clicking Insert Variable opens a popover with a variable name field; the confirm control stays disabled until the name is non-empty and contains only letters, digits, and underscores; an invalid name shows an inline message naming the field and the allowed format; confirming inserts the double-brace placeholder at the cursor position and closes the popover
- A horizontal row of at least 4 suggestion chips sits above the editor; clicking a chip replaces the editor content with exactly that chip's prompt text and moves focus to the editor; when the row overflows it scrolls horizontally without shifting the vertical layout

Feature: Variable binding panel —
- A side panel lists every detected double-brace placeholder in the current prompt; typing a new placeholder in the editor adds its entry to the panel and deleting the placeholder removes the entry, with no manual refresh action
- Each entry shows the variable name and an input for its current value; a variable whose value is empty shows a visible Unbound indicator on its entry
- Updating a variable value in the side panel immediately reflects in the live preview panel without any manual action

Feature: Live preview —
- A read-only preview panel shows the prompt text with all variable placeholders replaced by their bound values; unbound variables render with a visible warning highlight instead of a substituted value
- The preview updates within 100 milliseconds of any change to the editor text or the variable bindings

Feature: Model selection —
- A model selector in the toolbar lists exactly 6 seeded models grouped under 3 provider groups; the currently selected model name is visible in the toolbar at all times, including while a run is streaming
- The model recorded on each run's metadata row matches the model that was selected when that run started

Feature: Run and streaming response —
- Clicking Run starts a simulated run: the response panel below the editor renders the response progressively (text appears incrementally, never all at once), and a status affordance visibly distinguishes waiting, streaming, and complete states
- The Run control is disabled while the editor is empty and while a run is streaming; while streaming, the Run control is replaced by a Stop control
- Activating Stop freezes the response at its current text — no further text appends — marks the run as stopped in its status affordance, and re-enables Run
- While streaming, the response panel auto-follows the latest content; if the user scrolls up, auto-follow stops and a jump-to-latest control appears; activating it scrolls back to the newest content and resumes following
- Each run appends an entry to a run history list showing the model name, a timestamp, and the run status; selecting a history entry displays that run's response, reasoning, and variants
- Response content that contains code renders in a monospaced block with a language label and a copy control; activating copy puts the exact code text on the clipboard and shows a visible confirmation such as an icon swap or a toast

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

Feature: Save to library and library view —
- Clicking Save opens a modal dialog with a title field (required) and a technique tag select (required); the confirm control stays disabled until both are valid, invalid fields show inline messages naming the field and the fix, and confirming adds the prompt to the library and shows a success toast
- A Library view, switchable from the workbench without a page reload, lists the saved prompts — 4 seeded on first load — each row showing title, technique tag, and attachment count
- Opening a library entry loads its prompt text, variable bindings, and attachments back into the workbench exactly as saved
- Deleting a library entry removes its row and decreases the visible library count by exactly one
</core_features>

<user_flows>
- Full run flow: type a prompt containing two placeholders, bind both values in the side panel, confirm the preview shows the resolved text, click Run, watch the response stream progressively to complete, then flip through the 3 variants — all without a reload
- Stop flow: start a run, activate Stop mid-stream, and confirm the response text stays frozen, no further text appends, the run's status shows stopped, and Run is enabled again
- Save round-trip: save the current prompt from the modal, switch to the Library view and confirm the count increased by one, open the new entry, and confirm the workbench shows the same prompt text, bindings, and attachments
- Binding isolation: after a run completes, changing a variable value updates the live preview but the completed run's response text stays unchanged
- A page reload returns the app to its seeded state: 6 models, 4 library prompts, 4 suggestion chips, an empty editor, and no run history
</user_flows>

<edge_cases>
- Clicking Run while the prompt contains unbound variables shows a warning notice naming the unbound variables and does not start a run
- Deleting every library entry shows an empty state in the library list with a message and a control that returns to the workbench
- Double-activating the Save modal confirm control creates exactly one library entry: the count increases by one and one new row appears
- Removing a placeholder from the editor text removes its binding row from the side panel, and the preview no longer shows a warning for it
- With the editor empty, the token count reads 0 and Run stays disabled
</edge_cases>

<visual_design>
- Layout: the left two-thirds of the viewport is the editor and response panel stack; the right one-third is the variable binding panel
- The editor uses a monospace typeface; variable placeholders render with a blue tag-style background highlight, and unbound variables in the preview render with an amber warning highlight that is clearly distinct
- The toolbar is a single strip across the top of the editor carrying the model selector, token count badge, Insert Variable, Run, and Save controls
- The response panel uses a code-snippet-style container with a visible streaming cursor indicator while a response is in progress
- Run status uses a consistent color language: a neutral treatment for waiting, an active accent while streaming, a success treatment when complete, and a distinct treatment for stopped
- One consistent icon set is used across the toolbar, badges, chips, and history rows
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
- Hover animations (required): buttons ease background and shadow with a slight press effect, suggestion chips and library rows take a hover wash, and form controls show focus rings
- With prefers-reduced-motion set, all transitions apply instantly and the streaming cursor does not blink
</motion>

<responsiveness>
- Below 1024 pixels wide, the variable binding panel moves below the editor stack so the layout becomes a single column; every control remains reachable
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; the toolbar wraps its controls instead of overflowing
</responsiveness>

<accessibility>
- Every interactive control — toolbar buttons, suggestion chips, binding inputs, history rows, variant controls, library rows — is reachable and operable with the keyboard alone, with a visible focus indicator
- The Save modal traps focus while open, closes on Escape, and returns focus to the Save control; the Insert Variable popover closes on Escape and returns focus to its trigger
- The reasoning disclosure is keyboard-operable and exposes its expanded or collapsed state to assistive technology
- Run status changes (streaming started, completed, stopped) are announced through a polite live region, and validation messages are programmatically associated with their fields
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or unhandled promise rejections appear on load or during a full exercise of the app
- Typing stays responsive with 2000 characters in the editor, and an in-progress streaming run never blocks interaction with the rest of the UI
</performance>

<requirements>
Shared application state must live in Zustand (in-memory only): the prompt draft, detected variables and their bound values, selected model, attachment list, run history with each run's streaming status, accumulated text, variant index, and reasoning expansion state, the follow-scroll flag, the library collection, the active view, and UI chrome. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Typing in the editor updates the detected variable list, the token count, and the live preview from the same shared draft — never a second disconnected copy
- Starting a run creates one run record; the response panel, status affordance, run history row, and stop control all derive from that record and advance together
- Flipping a variant updates the response text, reasoning content, and metadata row from the same run record without a reload
- Saving adds one entry to the library collection; the library list and its count derive from that collection, and opening an entry hydrates the workbench from the same record
- Deleting a library entry removes it from the list and the count in the same interaction
- Active view and chrome are shared client state; switching views never reloads the document
Build tooling: Vite SPA. IBM Carbon Design System (@carbon/react) is the only component library, used for all UI chrome — toolbar, modal, popover, selects, tags, toasts, and tiles. CodeMirror 6 (or a comparable code editor primitive) for the prompt editor field only. Motion for React and AutoAnimate allowed for animation; no other animation libraries. Icons from @carbon/icons-react only. All forms — the Insert Variable popover and the Save to Library modal included — are driven by React Hook Form validating through a Zod schema: the schema defines the rules and inline per-field errors render before submit. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer; Carbon keeps its component styles and Tailwind owns layout and custom surfaces. All libraries installed via npm and bundled locally; no CDN imports. No backend or authentication; model responses are simulated in memory with realistic streaming delays.
- Seed exactly 6 models across 3 provider groups, 4 library prompts (at least one carrying an attachment), 5 pickable attachment assets, and 4 suggestion chips
- Zero navigational outbound links for app chrome; view changes happen via shared client state
- A page reload returns the app to its seeded state
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
- Editor object types: prompt-draft; variable; attachment
- Editor properties: prompt-text; variable-name; variable-value; model
- Editor operations: set_content; add; delete; update_property; select; preview; switch_mode
- Editor modes: workbench; library
- Session operations: start; stop; advance
- Entity: library-prompt
- Entity operations: create; select; delete
- Entity fields: title; technique; prompt-text; bindings; attachments
- Artifact operations: copy

Mechanics exclusions:
- Run and streaming response: incremental text streaming, blinking cursor, and auto-follow/jump-to-latest scroll mechanics stay Playwright-observed
- Reasoning disclosure: expand/collapse gesture, chevron rotation, and active-indicator visuals stay Playwright-observed
- Attachments: badge hover preview and hover-revealed remove control stay Playwright-observed
- Prompt editor: live token-counter update while typing is a derived display judged by observation

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
