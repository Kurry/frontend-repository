<summary>
Build a nested-folder note-taking app called NoteNest with a virtualized 10,000-item scale view, using Svelte 5 in runes mode, shared state in $state and $derived runes, Tailwind CSS 4.3.2, and Bits UI. The app produces the user's Nest workspace files — exportable Nest JSON and a Markdown vault document compiled live from the session store.
</summary>

<reference_screenshots>
Screenshots of the reference application are provided in-container at
/reference-screenshots/: overview.png is a full-page desktop-layout
overview (downscaled); segment-NN.png are full-resolution 1440x900 sections
in top-to-bottom order with slight overlap. They are part of this instruction:
recreate what they show. Where a screenshot and the text conflict, the text
wins. Do not copy the images into /app or ship them as app assets.
</reference_screenshots>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Shell and navigation —
- The app opens at / into a three-region shell with no login: a left sidebar holding a folder tree, a middle note list for the selected view, and a right note editor; switching views never triggers a full page reload and there is no backend
- A permanent All Notes entry sits above the folder tree and lists every note regardless of folder; a permanent Trash entry lists deleted notes
- Undo and Redo controls sit in the chrome (also driven by Ctrl+Z / Cmd+Z and Ctrl+Shift+Z / Cmd+Shift+Z when the note body editor is not capturing those keys for text undo); both controls are visibly disabled when their stack is empty
- A command palette opened by Ctrl+K / Cmd+K (or a Command Palette control) fuzzy-matches folder names, note titles, and named actions (New Note, New Folder, Empty Trash, Export Nest, Import Nest, All Notes, Trash); choosing a result navigates or runs that action without a reload, and Escape closes the palette

Feature: Folder tree —
- The sidebar shows a nested folder tree; a New Folder control adds a folder, a folder is renamed inline in place, and a folder is deleted after a confirm step in a dialog
- A Move to Folder (or equivalent nesting) control nests one folder inside another and lists the destination as a full path such as Work / Clients
- Each folder in the tree shows a live count badge of the notes filed directly in that folder only, not counting notes in its subfolders

Feature: Notes —
- A New Note control creates a note with an editable title and body inside whichever folder (or All Notes) is currently selected; the note title is validated inline against the Nest note field contract, and a blank, whitespace-only, or over-length title shows a visible error message naming the title field rather than only disabling the control
- Each note has a Move to Folder control that relocates it to any folder or back to unfiled through a dropdown of full folder paths
- Each note has a Pin toggle; pinned notes appear in a dedicated Pinned section at the top of the current view regardless of which folder is selected, and unpinning removes the note from that section while leaving it in its normal list
- Each note can be assigned one of six color labels (red, orange, yellow, green, blue, purple) through a swatch picker, or cleared to none; the note's list row and its open detail view both show a colored left-edge bar matching the chosen label when a color is set, consistently in every list it appears in

Feature: Multi-select and batch actions —
- Each note row in All Notes, a folder list, and the Pinned section exposes a selection checkbox; a selection tray appears when one or more notes are selected and offers Batch Move, Batch Color, and Batch Trash
- Batch Move relocates every selected note to a chosen folder path (or unfiled) in one confirm; each destination folder's count badge updates by the exact number of notes that landed there, and source badges decrease accordingly
- Batch Color applies one closed-list color (or none) to every selected note at once; left-edge bars update in every list those notes appear in
- Batch Trash moves every selected note to Trash after a confirm that names the selected count; folder count badges decrease by exactly that selected count and Trash gains exactly that selected count of entries
- Clearing the selection or completing a batch action hides the tray; Batch actions with zero selected notes do nothing and show no confirmation

Feature: Note editor —
- The note body has a formatting toolbar with Bold, Italic, and Bulleted List controls that apply to the current text selection inside the editable body; bold weight, italic slant, and indented bullet markers render inline as the user types, and each toolbar control shows an active or pressed state whenever the text cursor sits inside text already carrying that formatting
- Applying bold to a selection renders it bold immediately, and activating the same control again on that selection returns the text to its unformatted state; an in-editor Undo command (toolbar control or Ctrl+Z / Cmd+Z while the body is focused) reverses the most recent text edit and Redo reapplies it
- Inside a note body an Insert Checklist control adds a checklist block; each line the user types becomes its own independently toggleable checkbox, and toggling a box marks that line done immediately without leaving the editor or reloading
- An Add Image control per note opens a file picker for a local image; the chosen image renders inline in the note, each attached image carries its own Remove Image control, and a note can hold more than one image at once

Feature: Search —
- A search box filters notes by title or body text across every folder at once; each result row shows a breadcrumb of that note's folder path, and clearing the box restores the full list

Feature: Trash —
- Deleting a note moves it to Trash instead of erasing it; from Trash each entry offers Restore and Delete Forever, and a single Empty Trash control clears the whole Trash after a confirm step in a dialog

Feature: Session undo and redo —
- Session Undo reverses the most recent mutating workspace action — note create/edit/delete/restore, folder create/rename/delete/nest, pin toggle, color change, move, batch move/color/trash, Empty Trash, or a successful Nest Import — and restores the prior folders, notes, Trash contents, pins, colors, and selection
- Session Redo reapplies the most recently undone workspace action with the same completeness; performing a new mutating workspace action after an undo clears the redo stack and disables Redo
- In-editor text undo/redo inside the note body is separate from session Undo/Redo: text undo does not pop the session stack, and session undo does not leave the body editor in a corrupted HTML state

Feature: Nest artifacts (the app produces the user's workspace files) —
- An Export Nest control opens an artifact drawer with two format tabs — Nest JSON and Markdown vault — each regenerated live from the current store whenever folders, notes, Trash, pins, colors, checklist done-states, or bodies change
- The Nest JSON is API-shaped like a notes-workspace sync payload — a single object (not an array) whose field names and values are visible in the preview text and must conform to this field contract:
  - Required schemaVersion: exactly the string "notenest-v1"
  - Required folders: array of folder objects; each folder requires id (non-empty string), name (trimmed non-empty string at most 100 characters), parentId (string id of another folder in the same document, or null for a root folder), and collapsed (boolean)
  - Required notes: array of active (non-trashed) note objects; each note requires id (non-empty string), title (trimmed non-empty string at most 200 characters), body (string; rich-text HTML or plain text content of the note), folderId (string id of a folder in the same document, or null for unfiled), pinned (boolean), color (exactly one of the closed enum none, red, orange, yellow, green, blue, purple), checklist (array of objects each requiring id, text (string at most 500 characters), and done (boolean)), images (array of objects each requiring id and dataUrl (string that begins with data:)), updatedAt (ISO-8601 timestamp string)
  - Required trash: array of note objects using the same note field contract as notes (trashed copies live only here, never also in notes)
  - Folder parentId cycles are invalid; every note.folderId that is non-null must reference an id present in folders
- The Markdown vault tab previews a single readable document with a heading per active note (title, folder path breadcrumb, color label when not none, pinned marker when pinned, body text with checklist lines rendered as - [ ] / - [x]) reflecting the same live collection
- The record a note create/edit form or folder create/rename form produces IS the would-be Nest JSON object for that entity — same field names, bounds, and enums — and form validation enforces the same contracts the export shape declares, always naming the offending field inline
- Nest JSON export and Import Nest both compile and validate against that same schema: a valid Import replaces the in-memory workspace so the folder tree, All Notes, Trash, pins, colors, checklist done-states, and both export previews match the imported document; malformed JSON or a document that fails the field contract (wrong schemaVersion, missing required keys, color outside the closed enum, empty/illegal title or folder name, over-length title/name, parentId cycle, folderId pointing at a missing folder, image dataUrl not beginning with data:) shows visible validation feedback naming the offending field and changes nothing
- Each format tab offers Copy (writes that format's text to the clipboard with a brief copied confirmation) and Download (triggers a real file download whose contents match the previewed text for that format)
- Export content that omits the session's actual mutations is invalid: after creating a note, pinning it, assigning a color, and moving it into a folder, the Nest JSON preview must contain that note with those field values and the Markdown vault preview must show its title under that folder path

Feature: Scale view —
- A Load 10,000 Items control generates a deterministic local sample collection and opens a virtualized list that renders only the visible window plus a small overscan buffer; the view labels the total as Virtualized items and shows a Rendered item count that stays far below 10,000 while scrolling, and selection, keyboard focus, and scroll position survive as rows enter and leave the DOM
</core_features>

<user_flows>
- After creating a note through the New Note control inside a selected folder, that folder's note list count increases by exactly one, the folder's count badge increases by one, switching to All Notes shows the same note without a reload, and both Nest JSON and Markdown vault export previews include that note's title
- Moving a note from one folder to another through its Move to Folder dropdown decreases the source folder's count badge by one, increases the destination folder's badge by one, shows the note under the destination when that folder is selected, keeps the note visible in All Notes throughout, and updates the Nest JSON folderId for that note
- Pinning a note in All Notes places it in the Pinned section there; selecting the note's home folder shows the same note pinned in that view too, and unpinning it from the folder view removes it from the Pinned section in All Notes as well, all without a reload; the Nest JSON pinned field matches
- Deleting a note removes it from its folder's list, decreases that folder's count badge by one, and adds exactly one entry to Trash; restoring it from Trash returns it to its previous folder and restores the badge count; Nest JSON moves the note between notes and trash arrays accordingly
- Assigning a color label to a note updates the colored left-edge bar on its row in its folder list, in All Notes, in the Pinned section if pinned, and in matching search results, without a reload; Nest JSON color matches
- Batch Trash then session Undo: selecting two notes and confirming Batch Trash decreases visible active count by exactly two and adds two Trash entries; Undo restores both notes, prior folder badges, and the Nest JSON notes/trash membership
- Artifact end state: create a folder, create a note inside it with a distinctive title, pin it, set color blue, open Export Nest, and confirm Nest JSON shows schemaVersion "notenest-v1", that folder, and that note with pinned true and color blue, while Markdown vault shows the title under the folder path; Copy confirms on the active tab; Download Nest JSON then Import Nest of that same document reconstructs the same visible tree, note, pin, color, and export previews
- Command palette: pressing Ctrl+K / Cmd+K opens the palette; typing part of a note title lists that note; choosing it selects the note in the editor without a reload; Escape closes the palette
- A page reload returns the app to its seeded baseline: empty or seed-only folders and notes as specified at first paint, empty Trash beyond seed, empty undo/redo stacks, no multi-select, All Notes selected, and export previews matching that baseline — never a mix of surviving and reverted facets
</user_flows>

<edge_cases>
- Creating a note with a blank, whitespace-only, or over-200-character title is blocked: a visible inline error at the title field explains the title rule, and no note is added to any list, count, or export preview
- Creating or renaming a folder with a blank, whitespace-only, or over-100-character name is blocked with a visible inline error naming the name field
- Repeated identical submissions do not create duplicate records: double-activating the note creation control yields exactly one new note and a count increase of exactly one
- An empty folder shows a friendly styled message inviting the user to create a note, an empty Trash shows a short distinct message, and a search with no matches shows an explicit no-results message; none of these regions is ever simply blank
- Deleting a folder applies one consistent non-destructive behavior to its notes (moved to the root level or moved to Trash) rather than erasing them silently
- Batch actions with zero selected notes do nothing and show no confirmation; the tray stays hidden until at least one note is selected
- Importing malformed Nest JSON, or Nest JSON that fails the field contract (wrong schemaVersion, illegal color, empty title, parentId cycle, or non-data: image URL), leaves the workspace unchanged and shows validation naming the offending field
- Session Undo and Redo are disabled at empty-stack boundaries and never throw or corrupt the tree when activated there; a new mutation after Undo clears Redo
- The primary note workflow withstands 25 rapid repetitions through the normal controls with an exact final count and no blank screen, uncaught error, or sustained freeze; invalid or extreme input is rejected with visible feedback without damaging the last valid state
</edge_cases>

<visual_design>
- Nested folders are visibly indented relative to their parent; any folder that has children shows an expand/collapse control, and the currently selected folder is highlighted distinctly from unselected folders
- A note's color label renders as the same colored left-edge bar in every list it appears in (its own folder, All Notes, the Pinned section, and search results) and on the open note detail
- Checked checklist items show a strikethrough and a muted color instantly on toggle; unchecked items stay full-strength and visually distinct at a glance
- When at least one note is pinned, a clearly labeled Pinned section appears above the regular list, separated from it by a divider or heading so pinned and unpinned notes are never ambiguous
- Empty states are deliberately styled, not blank areas: an empty folder shows a friendly message inviting the user to create a note, an empty Trash shows a short distinct message, and a search with no matches shows an explicit no-results message
- Folder rows, note rows, buttons, and swatches show a visible hover treatment distinct from their resting state
- Creating a note, deleting a note to Trash, and restoring a note from Trash each show a transient confirmation such as a toast
- The folder count badge reads as a legible, visually distinct numeral rather than blending into the folder label
- The blank-title inline error is shown at the title field itself
- The Bold, Italic, and Bulleted List toolbar controls visually indicate an active or pressed state whenever the cursor sits inside content already carrying that formatting
- Icons across the sidebar, toolbar, and controls come from one consistent icon set at a consistent size and stroke treatment
- Export Nest appears as a drawer or modal with Nest JSON / Markdown vault tabs, a scrollable monospaced preview, and Copy and Download affordances; the multi-select tray is a compact bar when selection is active; the command palette is a centered overlay with a search field and result list
</visual_design>

<motion>
- Creating a note animates its row into the list, deleting a note to Trash animates the row out, and restoring a note from Trash animates it back into place rather than snapping
- Toggling a checklist item transitions its text to the strikethrough/muted done state immediately, and back, without a reload
- Creating, deleting-to-Trash, and restoring a note each surface a transient toast that animates in, remains readable, and then dismisses on its own
- Expanding or collapsing a folder rotates its chevron and reveals or hides its children with a transition
- Folder rows, note rows, buttons, and swatches ease into a hover state rather than switching instantly
- The formatting toolbar controls change to their active/pressed treatment as the cursor moves into or out of formatted text
- On a narrow viewport the folder panel slides in and out from behind the Folders button rather than reflowing the whole page
- Export Nest Copy shows a short confirmation before resetting; the export drawer and command palette enter and exit with a brief opacity/scale transition
- With prefers-reduced-motion set, list enter/exit and drawer transitions reduce to instant state changes while every flow remains completable
</motion>

<responsiveness>
- At approximately 375px wide the app renders with no horizontal scrolling; the folder tree collapses behind a togglable Folders button rather than squeezing the note view
- At that narrow width, note title, note body, folder labels, and count badges stay legible and untruncated beyond a trailing ellipsis
- The Export Nest drawer, command palette, multi-select tray, and Undo/Redo controls remain reachable and operable at 375px without covering the primary note list permanently
</responsiveness>

<accessibility>
- Keyboard Tab focus is visibly indicated on every interactive control, including folder rows, note rows, toolbar controls, swatches, selection checkboxes, batch actions, Undo/Redo, Export Nest, and Import Nest
- The folder-delete, Empty Trash, Batch Trash, Export Nest, Import Nest, and command-palette overlays trap keyboard focus while open and return focus to the invoking control on close; Escape closes them
- The Bold, Italic, and Bulleted List toolbar controls expose their active state to assistive technology as a pressed state matching their visual treatment
- Checklist checkboxes are toggleable from the keyboard, and the Pin toggle, color swatches, and note selection checkboxes are reachable and operable with the keyboard alone
- Validation messages for note title, folder name, and Nest Import are shown visually and associated with their fields so assistive technology announces them; export Copy confirmation is announced via a polite live region
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors appear during a full exercise of the app, including Export Nest, Import Nest, batch actions, command palette, session undo/redo, and the Load 10,000 Items view
- Scrolling the 10,000-item virtualized view stays smooth with no sustained blank regions, and the Rendered item count stays far below 10,000 throughout
- The UI stays responsive under rapid repeated input with no hangs or dropped interactions; Nest JSON preview recompilation after create/edit/delete completes without freezing the shell
</performance>

<writing>
- Control labels are specific verbs or noun-verb pairs such as New Note, New Folder, Insert Checklist, Empty Trash, Export Nest, Import Nest, Batch Trash, and Command Palette, using one consistent capitalization convention throughout
- Empty states explain what belongs in the region and how to add it; error messages name the problem and the fix; no placeholder text appears anywhere in the shipped UI
</writing>

<innovation>
Optional enhancements (not required to pass):
- A short coachmark tour that highlights the folder tree, Export Nest, and command palette on first visit and can be dismissed for the session
- Search syntax chips such as color:blue or pinned:true that filter the note list when typed into the search box
- A printable Markdown vault preview mode with print-optimized page breaks
</innovation>

<requirements>
Shared application state must use $state / $derived runes, the state library named in summary (in-memory only): folders, notes, Trash contents, selection, multi-select set, active view, search query, session undo/redo stacks, command-palette open state, export format tab, live Nest JSON and Markdown vault preview texts, and UI chrome. Do not use localStorage, sessionStorage, or other browser storage APIs. Session work survives through the downloadable Nest JSON / Markdown vault and the WebMCP export surface.
State contracts (behavioral, not storage keys):
- Creating a valid note or folder increases the shared collection and updates list rows, badges, and export previews
- Editing a note title/body/pin/color or folder name updates that same record everywhere it appears, including Nest JSON
- Deleting a note to Trash, restoring it, or Empty Trash mutates the same shared notes/trash the export reads
- Batch Move, Batch Color, and Batch Trash mutate the same shared collection the lists and export show
- Session Undo/Redo walk the same shared history the visible controls write
- Export Nest texts are derived live from the store; Import Nest of valid Nest JSON mutates that same store
- WebMCP tool handlers invoke the same store commands as the visible controls; views derive from one store, never a second disconnected copy
Stack: Svelte 5 components in runes mode, built as a client-rendered Vite SPA on Node 20 with the Tailwind Vite plugin; no backend, no authentication, no outbound navigation for app chrome.
Styling: Tailwind CSS 4.3.2 (pinned), with design tokens in the theme layer; Tailwind owns layout, spacing, and custom surfaces.
Component library: Bits UI provides the interactive primitives — the folder-delete, Empty Trash, Batch Trash, Export Nest, Import Nest, and command-palette overlays, the Move to Folder dropdowns, the swatch picker popover, and toasts; do not hand-roll a dialog, dropdown, or popover where Bits UI ships one.
Rich text: the note body editor is built on TipTap; the Bold, Italic, and Bulleted List toolbar, the checklist blocks, and in-editor undo/redo invoke its editor commands rather than mutating HTML directly.
Virtualized list: the Load 10,000 Items view is windowed with virtua; it renders only the visible window plus a small overscan buffer, exposes the total as Virtualized items and a visible Rendered item count region, keeps that rendered count far below 10,000, and preserves focus, selection, and scroll position as rows enter and leave the DOM.
Animation: AutoAnimate and Svelte transitions are allowed for animation; no other animation libraries.
Icons: Phosphor icons via the phosphor-svelte package only; one set used consistently, no other icon libraries and no raw copy-pasted SVGs.
Forms: every form (note creation and title editing, folder create and rename, Nest Import) validates through a Zod schema wired with Felte; the schema defines the rules and inline per-field errors appear before submit. Schemas are API-shaped: each form's schema models the payload a real notes-workspace API would accept (the Nest note record with required title bounds, color enum, pinned boolean, folderId nullability, checklist item shape, and image dataUrl prefix; the folder record with required name bounds and parentId nullability; the Nest JSON envelope with schemaVersion "notenest-v1" and folders/notes/trash arrays), the record a form creates is the would-be request body, and Nest JSON export/import compile and validate against that same schema.
- Attached images are stored as data URLs inside note records in memory and in Nest JSON (a stored image reference begins with data:), with no external hosting and no blob URLs
- Validation and empty-state rules: a blank or illegal note title is rejected with a visible inline error and adds no note; an empty folder, an empty Trash, and a no-match search each show their own distinct styled message; deleting a folder applies one consistent non-destructive behavior to its notes
- Folder count badges count only directly-filed notes, never subfolder notes; note order within a view is most-recently-edited first and stable across re-renders
- The useful end state is the Nest workspace artifact: Export Nest must produce Nest JSON and Markdown vault texts that contain the session's actual mutations, with Copy and Download, and Nest JSON must round-trip through Import Nest while conforming to the declared field contract
- All libraries are installed via npm and bundled locally; no CDN imports; no UI component, animation, rich-text, virtualization, or icon libraries beyond those named above
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
- entity-collection-v1
- browse-query-v1
- structured-editor-v1
- artifact-transfer-v1

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
- Browsable entity: notes
- Destinations: all-notes; trash; export-nest
- Entity: note
- Entity operations: create; select; update; delete; toggle
- Entity fields: title; body; folder; pinned; color; checklist-item
- Value bounds: {"color":["none","red","orange","yellow","green","blue","purple"]}
- Editor object types: checklist-block
- Editor operations: set_content; add
- Artifact operations: export; import; copy
- Export formats: json; markdown
- Import modes: nest-json

Mechanics exclusions:
- Bold/Italic/Bulleted-List formatting stays Playwright-driven (selection-dependent, mechanism matters)
- Load 10,000 Items virtualized scroll/overscan geometry stays Playwright-observed
- Raw image blobs / file paths must not appear in WebMCP args
- Command palette open/close animation timing stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
