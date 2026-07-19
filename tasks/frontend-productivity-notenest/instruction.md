<summary>
Build a nested-folder note-taking app called NoteNest with a virtualized 10,000-item scale view, using Svelte 5 in runes mode, shared state in $state and $derived runes, Tailwind CSS 4.3.2, and Bits UI.
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

Feature: Folder tree —
- The sidebar shows a nested folder tree; a New Folder control adds a folder, a folder is renamed inline in place, and a folder is deleted after a confirm step in a dialog
- A Move to Folder (or equivalent nesting) control nests one folder inside another and lists the destination as a full path such as Work / Clients
- Each folder in the tree shows a live count badge of the notes filed directly in that folder only, not counting notes in its subfolders

Feature: Notes —
- A New Note control creates a note with an editable title and body inside whichever folder (or All Notes) is currently selected; the note title is validated inline, and a blank title shows a visible error message naming the title field rather than only disabling the control
- Each note has a Move to Folder control that relocates it to any folder or back to unfiled through a dropdown of full folder paths
- Each note has a Pin toggle; pinned notes appear in a dedicated Pinned section at the top of the current view regardless of which folder is selected, and unpinning removes the note from that section while leaving it in its normal list
- Each note can be assigned one of six color labels (red, orange, yellow, green, blue, purple) through a swatch picker; the note's list row and its open detail view both show a colored left-edge bar matching the chosen label, consistently in every list it appears in

Feature: Note editor —
- The note body has a formatting toolbar with Bold, Italic, and Bulleted List controls that apply to the current text selection inside the editable body; bold weight, italic slant, and indented bullet markers render inline as the user types, and each toolbar control shows an active or pressed state whenever the text cursor sits inside text already carrying that formatting
- Applying bold to a selection renders it bold immediately, and activating the same control again on that selection returns the text to its unformatted state; an Undo command (toolbar control or Ctrl+Z / Cmd+Z) reverses the most recent edit and Redo reapplies it
- Inside a note body an Insert Checklist control adds a checklist block; each line the user types becomes its own independently toggleable checkbox, and toggling a box marks that line done immediately without leaving the editor or reloading
- An Add Image control per note opens a file picker for a local image; the chosen image renders inline in the note, each attached image carries its own Remove Image control, and a note can hold more than one image at once

Feature: Search —
- A search box filters notes by title or body text across every folder at once; each result row shows a breadcrumb of that note's folder path, and clearing the box restores the full list

Feature: Trash —
- Deleting a note moves it to Trash instead of erasing it; from Trash each entry offers Restore and Delete Forever, and a single Empty Trash control clears the whole Trash after a confirm step in a dialog

Feature: Scale view —
- A Load 10,000 Items control generates a deterministic local sample collection and opens a virtualized list that renders only the visible window plus a small overscan buffer; the view labels the total as Virtualized items and shows a Rendered item count that stays far below 10,000 while scrolling, and selection, keyboard focus, and scroll position survive as rows enter and leave the DOM
</core_features>

<user_flows>
- After creating a note through the New Note control inside a selected folder, that folder's note list count increases by exactly one, the folder's count badge increases by one, and switching to All Notes shows the same note without a reload
- Moving a note from one folder to another through its Move to Folder dropdown decreases the source folder's count badge by one, increases the destination folder's badge by one, shows the note under the destination when that folder is selected, and keeps the note visible in All Notes throughout
- Pinning a note in All Notes places it in the Pinned section there; selecting the note's home folder shows the same note pinned in that view too, and unpinning it from the folder view removes it from the Pinned section in All Notes as well, all without a reload
- Deleting a note removes it from its folder's list, decreases that folder's count badge by one, and adds exactly one entry to Trash; restoring it from Trash returns it to its previous folder and restores the badge count
- Assigning a color label to a note updates the colored left-edge bar on its row in its folder list, in All Notes, in the Pinned section if pinned, and in matching search results, without a reload
- After a full page refresh, the folder tree, every note's title and formatted body, checklist items with their done state, attached images, pinned state, color labels, and Trash contents render exactly as they were before the refresh
</user_flows>

<edge_cases>
- Creating a note with a blank title is blocked: a visible inline error at the title field explains that a title is required, and no note is added to any list or count
- Repeated identical submissions do not create duplicate records: double-activating the note creation control yields exactly one new note and a count increase of exactly one
- An empty folder shows a friendly styled message inviting the user to create a note, an empty Trash shows a short distinct message, and a search with no matches shows an explicit no-results message; none of these regions is ever simply blank
- Deleting a folder applies one consistent non-destructive behavior to its notes (moved to the root level or moved to Trash) rather than erasing them silently
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
</visual_design>

<motion>
- Creating a note animates its row into the list, deleting a note to Trash animates the row out, and restoring a note from Trash animates it back into place rather than snapping
- Toggling a checklist item transitions its text to the strikethrough/muted done state immediately, and back, without a reload
- Creating, deleting-to-Trash, and restoring a note each surface a transient toast that animates in, remains readable, and then dismisses on its own
- Expanding or collapsing a folder rotates its chevron and reveals or hides its children with a transition
- Folder rows, note rows, buttons, and swatches ease into a hover state rather than switching instantly
- The formatting toolbar controls change to their active/pressed treatment as the cursor moves into or out of formatted text
- On a narrow viewport the folder panel slides in and out from behind the Folders button rather than reflowing the whole page
</motion>

<responsiveness>
- At approximately 375px wide the app renders with no horizontal scrolling; the folder tree collapses behind a togglable Folders button rather than squeezing the note view
- At that narrow width, note title, note body, folder labels, and count badges stay legible and untruncated beyond a trailing ellipsis
</responsiveness>

<accessibility>
- Keyboard Tab focus is visibly indicated on every interactive control, including folder rows, note rows, toolbar controls, and swatches
- The folder-delete and Empty Trash confirm dialogs trap keyboard focus while open and return focus to the invoking control on close
- The Bold, Italic, and Bulleted List toolbar controls expose their active state to assistive technology as a pressed state matching their visual treatment
- Checklist checkboxes are toggleable from the keyboard, and the Pin toggle and color swatches are reachable and operable with the keyboard alone
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors appear during a full exercise of the app, including the Load 10,000 Items view
- Scrolling the 10,000-item virtualized view stays smooth with no sustained blank regions, and the Rendered item count stays far below 10,000 throughout
- The UI stays responsive under rapid repeated input with no hangs or dropped interactions
</performance>

<writing>
- Control labels are specific verbs or noun-verb pairs such as New Note, New Folder, Insert Checklist, and Empty Trash, using one consistent capitalization convention throughout
- Empty states explain what belongs in the region and how to add it; error messages name the problem and the fix; no placeholder text appears anywhere in the shipped UI
</writing>

<requirements>
- Stack: Svelte 5 components in runes mode, built as a client-rendered Vite SPA on Node 20 with the Tailwind Vite plugin; no backend, no authentication, no outbound navigation for app chrome
- State tracking: all shared application state lives in $state / $derived runes — folders, notes, Trash contents, selection, active view, search query, and UI chrome; every view derives from that one store, never a second disconnected copy, and WebMCP tool handlers invoke the same store commands as the visible controls
- Styling: Tailwind CSS 4.3.2 (pinned), with design tokens in the theme layer; Tailwind owns layout, spacing, and custom surfaces
- Component library: Bits UI provides the interactive primitives — the folder-delete and Empty Trash confirm dialogs, the Move to Folder dropdowns, the swatch picker popover, and toasts; do not hand-roll a dialog, dropdown, or popover where Bits UI ships one
- Rich text: the note body editor is built on TipTap; the Bold, Italic, and Bulleted List toolbar, the checklist blocks, and undo/redo invoke its editor commands rather than mutating HTML directly
- Virtualized list: the Load 10,000 Items view is windowed with virtua; it renders only the visible window plus a small overscan buffer, exposes the total as Virtualized items and a visible Rendered item count region, keeps that rendered count far below 10,000, and preserves focus, selection, and scroll position as rows enter and leave the DOM
- Animation: AutoAnimate and Svelte transitions are allowed for animation; no other animation libraries
- Icons: Phosphor icons via the phosphor-svelte package only; one set used consistently, no other icon libraries and no raw copy-pasted SVGs
- Forms: every form (note creation and title editing, folder create and rename) validates through a Zod schema wired with Felte; the schema defines the rules and inline per-field errors appear before submit
- Persistence contract: folders, notes, and Trash contents survive a full page refresh via localStorage; the restored state includes each note's checklist items and their done state, attached images, pinned state, color label, and rich-text (bold/italic/list) body formatting exactly as before the refresh
- Attached images are stored as data URLs inside the persisted state (a stored image reference begins with data:), with no external hosting and no blob URLs; guard storage access so the production build does not crash
- Validation and empty-state rules: a blank note title is rejected with a visible inline error and adds no note; an empty folder, an empty Trash, and a no-match search each show their own distinct styled message; deleting a folder applies one consistent non-destructive behavior to its notes (moved to the root level or moved to Trash) rather than erasing them silently
- Folder count badges count only directly-filed notes, never subfolder notes; note order within a view is most-recently-edited first and stable across re-renders
- All libraries are installed via npm and bundled locally; no CDN imports; no UI component, animation, rich-text, virtualization, or icon libraries beyond those named above
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
- browse-query-v1
- structured-editor-v1

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

Bindings:
- Browsable entity: notes
- Destinations: all-notes; trash
- Entity: note
- Entity operations: create; select; update; delete; toggle
- Entity fields: title; body; folder; pinned; color; checklist-item
- Editor object types: checklist-block
- Editor operations: set_content; add

Mechanics exclusions:
- Bold/Italic/Bulleted-List formatting stays Playwright-driven (selection-dependent, mechanism matters)
- Load 10,000 Items virtualized scroll/overscan geometry stays Playwright-observed
- Raw image blobs / file paths must not appear in WebMCP args

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
