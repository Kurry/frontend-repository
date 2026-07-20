<summary>
Build a SwiftNote keyboard-first note-taking app using Angular, NgRx, Tailwind CSS 4.3.2, and PrimeNG.
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
- On first load with no notes yet, the sidebar shows a friendly empty-state message with a hint to create the first note; the main area shows a SwiftNote welcome panel with a Create note button
- A New Note control (the sidebar Create note button, or the Alt+N shortcut) creates an untitled note, inserts its row at the top of the sidebar, and immediately focuses the note title field so typing lands in the title without any extra click
- The left sidebar lists every note sorted by last-edited time (most recently edited first); each row shows the note title (or Untitled), a one-line body preview, and a relative timestamp such as just now, 5m ago, 2h ago, or 3d ago
- Typing a title or body into the open note updates that note's sidebar row title, preview, and timestamp live, and re-sorts the row to the top as the most recently edited
- The note body is a formatted text editor with a visible formatting toolbar offering at least bold, italic, heading, and bulleted list; activating Bold with text selected renders that text in bold weight in the body, and activating it again on the same selection returns the text to normal weight
- Formatting keyboard shortcuts work inside the body: Ctrl+B (Cmd+B on macOS) toggles bold and Ctrl+I (Cmd+I) toggles italic on the current selection, matching the toolbar buttons exactly
- The body editor supports undo and redo: Ctrl+Z reverses the most recent typing or formatting change and Ctrl+Y or Ctrl+Shift+Z re-applies it, with the sidebar preview and counters tracking each step
- The app-level shortcuts keep working while the caret is inside the body editor: Alt+N still creates a note and Ctrl+K (Cmd+K) still opens the Quick Switcher; editor formatting shortcuts never swallow them
- A small transient Saved label appears beside the editor after every edit and fades away on its own; there is no explicit save button
- A live counter beneath the open note shows the current word count and character count and recomputes exactly as text is added or removed
- A Quick Switcher overlay opens from a control and from the Ctrl+K (Cmd+K on macOS) shortcut; it lists notes by title, typing narrows the list instantly, and the currently highlighted result is visually distinguished from the rest
- Inside the Quick Switcher, the Down and Up arrow keys move the highlight through the currently-filtered results and wrap around at the ends (Down past the last result returns to the first; Up past the first goes to the last); as typing narrows the list the highlight re-clamps to a still-visible result, and pressing Enter opens whichever result is currently highlighted in the editor
- A Search Notes input in the sidebar filters the note list by title or body match; the matching term is visually highlighted within each matching row's preview
- An Insert Image control (file picker) and drag-and-drop of an image file directly onto the note body both embed the chosen image inline within the open note; the image is stored as part of that note's own data so it travels with the note
- A Duplicate control clones a note's full text, formatting, and every embedded image into a new separate note; editing the duplicate does not change the original (they are independent records, not a shared reference)
- An Export as .txt control opens a small export dialog with a filename field pre-filled from the note title; the field is required and validated live against the filename field contract below, and the confirm control stays disabled until the filename is valid
- Confirming a valid export downloads the open note's text as a plain-text file named with the chosen filename; bold and other formatting are flattened to plain text and embedded images are represented by a filename placeholder line in the exported text
- Notes are modeled as API-shaped payloads; every create, edit, export, and import validates against the field contracts below before state changes: invalid input shows an inline error message naming the field and its rule, does not commit the bad value, and leaves existing notes untouched
- Note create and update field contract: id is a non-empty string assigned by the app on create; title is a string whose trimmed length is at most 200 characters (empty title is allowed and displays as Untitled); bodyHtml is a string of at most 100000 characters produced by the rich-text editor; pinned is a boolean; createdAt and updatedAt are ISO-8601 datetime strings produced by the app; images is an array of zero or more image objects
- Image object field contract: each image requires id (non-empty string), filename (non-empty string after trim, at most 120 characters), and dataUrl (a string that begins with data:image/ and includes a base64 payload); only files that satisfy this contract embed into the note
- Cross-field note rules: updatedAt is never earlier than createdAt on a saved note; when pinned is true the note sorts above every note with pinned false regardless of last-edited time; Duplicate copies title, bodyHtml, pinned false on the clone, and a deep copy of every image object into a new id
- Export filename field contract (plain-text export dialog): required after trim, length 1 to 120 characters, matches letters, numbers, hyphen, underscore, space, or dot only, and must end with .txt; empty, over-length, illegal characters, or a name that does not end with .txt each show an inline message naming the filename field and keep confirm disabled
- Workspace document field contract (export and import): a single JSON object (not an array) with required keys schemaVersion (exactly the string swiftnote-workspace-v1), exportedAt (ISO-8601 datetime), notes (array of note records matching the note field contract including images), and selectedNoteId (string or null); when selectedNoteId is a string it must equal an id present in notes; when notes is empty selectedNoteId is null
- The app produces the user's SwiftNote workspace artifact: an Export Workspace control opens a drawer or dialog with a live Workspace JSON preview regenerated from the current store on every note mutation, plus Copy (with visible confirmation that the text was copied) and Download controls for that JSON, and a tab or section that still offers the existing Export as .txt path for the open note
- An Import Workspace control accepts a Workspace JSON document (paste or file); a valid import replaces the notes collection and selection so the sidebar, editor, Quick Switcher, counters, and Export Workspace preview match the imported notes, pins, formatting, and images; malformed JSON or a document that fails the workspace field contract shows visible validation naming the offending field and changes nothing
- Export then Import of the same Workspace JSON reconstructs the same visible notes, titles, body formatting, pins, embedded images, and selected note
- A Pin toggle on a note keeps it above all unpinned notes in the sidebar regardless of last-edited time
- A Focus Mode toggle hides the sidebar and expands the open note to fill the page width; an Exit Focus Mode control or the Escape key restores the sidebar
- A Delete control removes the open note only after an explicit confirm step (a confirmation dialog or inline confirm bar); cancelling the confirm leaves the note unchanged
- A Shortcuts control opens an overlay listing every available keyboard shortcut, including at least New Note, Quick Switcher, Focus Mode, and the editor's bold and italic combinations, each paired with its key combination; the overlay is dismissed by a visible close control or Escape and returns to the note that was open
- Creating a note and deleting a note each show their own transient confirmation (a toast or equivalent) that is visually distinct from the per-edit Saved indicator
- A Load 10,000 Items control generates deterministic local sample notes and renders the list virtualized: only the visible window plus a small overscan buffer exists in the DOM at once while scrolling, filtering, selection, and scroll position are preserved as rows enter and leave; a visible region labelled Virtualized items shows the total and a region labelled Rendered item count shows the number of rows currently in the DOM (far below 10,000)
- All keyboard shortcuts are honored and do not break the page: Alt+N creates a note, Ctrl+K (Cmd+K) toggles the Quick Switcher, Ctrl+Shift+F toggles Focus Mode, ? opens the Shortcuts overlay (when the caret is not in a text field), Escape closes an open overlay or exits Focus Mode, and inside the Quick Switcher the arrow keys navigate and Enter opens the highlighted note
- No route other than / is required and no control navigates to another origin; every view change happens in-app via shared client state
</core_features>

<user_flows>
- After activating New Note, the sidebar note count increases by exactly one, the new Untitled row sits at the top of the list, the editor opens that note with the title field focused, and opening the Quick Switcher shows the same note among its results without a reload
- Typing a title and a body into the open note updates that note's sidebar row title, preview, and timestamp live and re-sorts it to the top; the word and character counters recompute to match the exact text, and after a full page refresh the same note reopens with identical text, formatting, and sidebar ordering
- Editing a different note moves that note's row above the previously-edited one, and the previously-edited note keeps its own text and preview unchanged
- Applying bold to a selection renders it bold in the body, shows bold in that note after switching away and back via the Quick Switcher, and survives a full page refresh; toggling bold off returns the text to normal weight everywhere
- Pinning an older note lifts it above every unpinned note; editing a newer unpinned note afterwards re-sorts the unpinned group but the pinned note stays on top, and the pin ordering is identical after a full page refresh
- Confirming a delete removes the note from the sidebar list, clears it from the editor selection, removes it from the Quick Switcher results, and updates any visible note counts; a later refresh does not revive it
- Typing into Search Notes narrows the sidebar list to matching notes with the matched term highlighted in each preview, and clearing the search restores the full list in exactly the prior order
- Duplicating a note adds exactly one new independent note; editing the duplicate's body changes only the duplicate's sidebar preview while the original's row is untouched
- A full page refresh restores the entire workspace exactly: every note with its text, formatting, and embedded images, the pin order, and the previously selected note reopened in the editor
- Artifact end state: create at least two notes, edit titles and bodies, pin one, embed an image in one, then open Export Workspace — the Workspace JSON preview shows schemaVersion swiftnote-workspace-v1, both notes under notes with their titles, bodyHtml, pinned flags, images, and timestamps, and selectedNoteId matching the open note; Copy confirms; Download then Import of that Workspace JSON reconstructs the same visible sidebar, editor content, pins, and images
- Typing a title longer than 200 characters after trim shows an inline message naming the title field, does not keep the over-length value as the saved title, and leaves the sidebar title at the last valid value
</user_flows>

<edge_cases>
- A search matching nothing shows an explicit no-results message in the list area instead of a blank region; clearing the query restores the full list
- Deleting the last remaining note returns the sidebar to its empty-state message and the main area to the welcome panel with its Create note button
- In the Export as .txt dialog, an empty filename, a name over 120 characters, illegal characters, or a name that does not end with .txt shows an inline validation message naming the filename field, keeps the confirm control disabled, and triggers no download
- Dropping a non-image file onto the note body embeds nothing and shows a visible, specific message naming the image or file field; the note's existing content is unchanged
- Pasting or importing body content that would push bodyHtml past 100000 characters is rejected with visible feedback naming the body field and does not replace the last valid body
- Importing malformed Workspace JSON, or JSON that violates the workspace field contract (wrong schemaVersion, missing notes or selectedNoteId, a note missing required id/title/bodyHtml/pinned/createdAt/updatedAt/images fields, selectedNoteId that does not match any note id, or an image missing id/filename/dataUrl or with a dataUrl that does not begin with data:image/), shows an inline error naming the import field, leaves the note count and titles unchanged, and does not clear the open note incorrectly as a successful import
- Invalid or extreme input (an empty note, an oversized paste, an over-length title) is handled with visible, specific feedback and never damages the last valid state
- The primary note workflow withstands at least 25 rapid consecutive New Note activations through its normal control: the final visible note count is exact, the controls stay responsive, and no blank screen, uncaught error, or sustained freeze occurs
- Cancelling the delete confirm leaves the note, the selection, and all counts exactly as they were
</edge_cases>

<visual_design>
- Dark, near-black composition: page background renders as #000000, primary text as #FFFFFF, and primary/accent controls use the coral accent family #F45B69 / #F45B68; a secondary accent #646CFF is available
- Two-pane shell on wide screens: a fixed left sidebar (brand wordmark, Search Notes field, note list, footer stats and Load 10,000 Items) beside a note editor pane (toolbar of note actions, formatting toolbar, large title field, body area, image thumbnails, word/character counter)
- Typography is Roboto with a Roboto, sans-serif fallback for both headings and body; the primary heading renders at 55px, secondary headings at 24px, and body text at 16px; the base spacing unit is 4px and the default corner radius is 10px
- The Search Notes input and its adjoining Create note button read as one pill: the input has a white (#FFFFFF) background, black (#000000) text, no shadow, and corners rounded only on the left (12px) with square right corners; the button has a dark (#1A1A1A) background, white text, no shadow, and corners rounded only on the right (12px) with square left corners
- The Quick Switcher overlay is unmistakably layered above the rest of the app over a dimmed backdrop, and the currently-highlighted result is clearly distinguished by a background fill and an accent left border
- Body text, sidebar rows, and note previews keep clear contrast against the near-black background at all times, including while a row is hovered or selected; the selected row carries a coral tint and an accent left border
- Empty states are explicit: a sidebar empty-state before any note exists, a no-results message when a search matches nothing, and a welcome panel in the editor when no note is selected
- The formatting toolbar's active states are visible: while the caret sits in bold text the Bold control renders in a pressed/active treatment distinct from its idle state
- Icons come from one consistent icon set across the sidebar, toolbars, dialogs, and toasts; no mixed icon styles
- Sidebar rows are dense and consistently aligned: title, one-line preview, and relative timestamp align across rows without ragged spacing or inconsistent truncation
- The Export Workspace drawer shows a scrollable Workspace JSON preview, Copy and Download controls, and a short hint line; the Import Workspace surface and the Export as .txt dialog use the same dark surfaces and coral primary accents as the rest of the chrome
</visual_design>

<motion>
- The Saved indicator fades and slides in when it appears after an edit and clears on its own shortly after
- Create and delete toasts slide up from the lower corner as they appear and dismiss on their own
- Creating, deleting, pinning, or re-sorting a note animates the affected sidebar row into or out of its position rather than snapping instantly
- The sidebar animates its width, opacity, and position when Focus Mode is toggled and when the mobile drawer opens or closes, rather than snapping instantly
- The Quick Switcher and Shortcuts overlays appear over a dimmed backdrop with a brief enter transition; the Quick Switcher highlight moves between results as the arrow keys are pressed
- Hover feedback is required: buttons ease their background on hover with a slight press on click, and sidebar rows, formatting toolbar buttons, and toolbar controls take a visible hover wash
- View switches (Focus Mode, opening or closing an overlay, selecting a note) update the panes without a full page reload
</motion>

<responsiveness>
- On wide screens the two-pane shell keeps the sidebar persistently visible beside the editor
- At approximately 375px wide the app renders without horizontal scrolling, the sidebar collapses behind a reachable hamburger toggle and slides in as an overlay, and the open note stays fully usable including the formatting toolbar
- No content clips or overflows the viewport at any width between 375px and 1440px
</responsiveness>

<accessibility>
- Every interactive control (sidebar rows, toolbar and formatting buttons, dialog controls, the search field) is reachable and operable with the keyboard alone, and keyboard Tab focus shows a visible focus ring on every interactive control
- The Quick Switcher, Shortcuts overlay, delete confirm, Export as .txt dialog, Export Workspace drawer, and Import Workspace surface use dialog semantics: focus moves into the dialog on open, stays trapped while it is open, Escape closes it, and focus returns to the invoking control on close
- The Export as .txt filename validation message and the Import Workspace validation message are each announced via a polite live region as well as shown visually
- Formatting toolbar buttons expose their names (such as Bold and Italic) to assistive technology and reflect their pressed state
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors appear during a full exercise of the app (create, edit, format, search, pin, duplicate, Export as .txt, Export Workspace, Import Workspace, delete, overlays, and the 10,000-item list)
- Scrolling the 10,000-item virtualized list stays smooth with no sustained freeze, and the UI stays responsive under rapid repeated input with no hangs or dropped interactions
- Typing in the body editor keeps up with fast input; the Saved indicator and counters update without blocking keystrokes
</performance>

<writing>
- Headings, buttons, and menu labels use one consistent capitalization convention throughout the app
- Action labels are specific verbs such as Create note, Duplicate, Export as .txt, Export Workspace, and Import Workspace rather than generic labels
- Toasts name the action they confirm; empty states explain what belongs in the region and how to add it; validation messages name the field and the fix; no placeholder or lorem text appears anywhere in the shipped UI
- The Shortcuts overlay's listed key combinations exactly match the combinations the app actually honors
</writing>

<requirements>
Shared application state must live in NgRx store, actions, reducers, and selectors: the notes collection, the selected note, the search query, and UI chrome (Focus Mode, Quick Switcher open, Shortcuts open, sidebar collapse, toast message).
Persistence (required): all notes, including their text, formatting, embedded images (stored as data URLs inside each note's own record), and pin state, plus the selected note, must persist to localStorage and be restored exactly after a full page refresh. Guard localStorage access so a build without it does not crash. This localStorage persistence is a required part of the product, not optional.
State contracts (behavioral, not storage keys):
- Creating a note increases the collection, inserts the new row at the top of the sidebar, and focuses the title field
- Editing a note updates that same record everywhere it appears (its sidebar row title, preview, timestamp, and ordering) and updates the live word and character counts to match the exact text
- Deleting a note (after the confirm step) removes it from the list, the selection, and derived counts; a later refresh does not revive it
- Pinning a note keeps it above unpinned notes regardless of edit recency, and pin state survives a refresh
- The search query recomputes the visible list from the shared collection and highlights matches; it does not create a second disconnected copy
- Duplicating a note produces an independent record whose later edits do not affect the original
- Focus Mode, Quick Switcher, and Shortcuts are shared client state; toggling them does not reload the document
- WebMCP tool handlers dispatch the same store commands as the visible controls, so contract-driven and UI-driven changes are indistinguishable in the rendered app
Stack and libraries:
- Angular standalone components; build succeeds against the pinned dependencies and serves on port 3000
- Tailwind CSS 4.3.2 (pinned) is the styling base and owns layout, spacing, and the app's dark token system, with design tokens declared in the Tailwind theme
- PrimeNG is the component library, used for the dialogs (delete confirm, export, Shortcuts overlay), the Quick Switcher overlay shell, buttons, inputs, and toasts; it keeps its own component styles
- The note body editor is built on ProseKit: the formatting toolbar, the Ctrl+B / Ctrl+I shortcuts, and undo/redo all invoke the same editor commands, and the editor's keymap must not conflict with the app's own shortcuts (Alt+N, Ctrl+K, Ctrl+Shift+F, ?, Escape keep working as specified while focus is in the editor)
- AutoAnimate and Angular animations are allowed for animation; no other animation libraries
- PrimeIcons only for icons
- All forms (the Export as .txt dialog, title length guards, Export Workspace, and Import Workspace) are built with Angular Reactive Forms and validate through a Zod schema that mirrors the field contracts above: the schema defines the rules, the form surfaces inline per-field errors before submit, and submit stays disabled until valid. Created and updated note records are the would-be request bodies for those contracts; Workspace JSON export and import compile and validate against the same workspace document schema; the plain-text export filename schema matches the filename field contract
- All libraries installed via npm and bundled locally; no CDN imports
Advanced behavior:
- The Load 10,000 Items control generates deterministic local sample notes and the list is virtualized: only the visible window plus a small overscan renders in the DOM, and selection, filtering, keyboard focus, and scroll position are preserved as rows enter and leave; expose a visible Virtualized items total and a visible Rendered item count
- At least 25 rapid consecutive New Note activations must leave an exact final count with the UI responsive and no uncaught error, blank screen, or sustained freeze; repeated activation must not fabricate success without the underlying note being created
- Invalid or extreme input (for example an empty note, an oversized paste, an over-length title, a non-image drop, or a non-conforming Workspace JSON import) must be handled with visible, specific feedback and must not damage the last valid state
- Export Workspace texts are derived live from the shared store; Import of valid Workspace JSON replaces that same store and persists through the required localStorage path
Build and scope:
- No backend, no authentication, no outbound navigation for app chrome; single library of notes at /
- Keyboard shortcuts must not conflict with standard browser shortcuts in a way that breaks the page, and every shortcut is documented in the Shortcuts overlay
- The app starts blank (no pre-seeded demo notes); notes are created through the UI during the session
- The useful end state is the workspace artifact: Export Workspace must produce Workspace JSON that contains the session's actual notes, pins, formatting, and images under the declared field contract, with Copy and Download, and that JSON must round-trip through Import Workspace
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
- entity-collection-v1
- browse-query-v1
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
- Entity: note
- Entity operations: create; select; update; delete; toggle
- Entity fields: title; body; pinned
- Browsable entity: notes
- Destinations: editor; quick-switcher; shortcuts; focus-mode; workspace-export; workspace-import
- Artifact operations: export; import; copy
- Export formats: workspace-json; txt
- Import modes: workspace-json

Mechanics exclusions:
- Quick Switcher arrow-key navigation, wrap, and re-clamp stay Playwright-driven
- Focus Mode / mobile drawer slide and sidebar collapse stay Playwright-observed
- Toast and Saved-indicator appearance/timing stay Playwright-observed
- Drag-and-drop image embedding stays Playwright-observed
- 10,000-item virtualization scroll windowing stays Playwright-observed
- File-picker Import Workspace stays Playwright-only per artifact-transfer no-raw-file-contents restriction; webmcp may drive paste-mode Import confirm only
- Export download bytes and clipboard contents stay Playwright-only per artifact-transfer restrictions

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
