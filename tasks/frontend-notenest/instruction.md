<summary>
Build a nested-folder note-taking app called NoteNest using Svelte in runes mode and Tailwind CSS, with a virtualized 10,000-item scale view.
</summary>

<reference_screenshots>
Screenshots of the reference application are provided in-container at
`/reference-screenshots/`: `overview.png` is a full-page desktop-layout
overview (downscaled); `segment-NN.png` are full-resolution 1440x900 sections
in top-to-bottom order with slight overlap. They are part of this instruction:
recreate what they show. Where a screenshot and the text conflict, the text
wins. Do not copy the images into `/app` or ship them as app assets.
</reference_screenshots>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
- The app opens at / into a three-region shell with no login: a left sidebar holding a folder tree, a middle note list for the selected view, and a right note editor; switching views never triggers a full page reload and there is no backend
- The sidebar shows a nested folder tree; a New Folder control adds a folder, a folder is renamed inline in place, and a folder is deleted after a confirm step; a Move to Folder (or equivalent nesting) control nests one folder inside another and lists the destination as a full path such as Work / Clients
- A permanent All Notes entry sits above the folder tree and lists every note regardless of folder; a permanent Trash entry lists deleted notes
- A New Note control creates a note with an editable title and body inside whichever folder (or All Notes) is currently selected; the new note appears in that folder and in All Notes
- Creating a note with a blank title is blocked and a visible inline error explains that a title is required, rather than only disabling the control
- Inside a note body an Insert Checklist control adds a checklist block; each line the user types becomes its own independently toggleable checkbox, and toggling a box marks that line done immediately without leaving the editor or reloading
- An Add Image control per note opens a file picker for a local image; the chosen image renders inline in the note, each attached image carries its own Remove Image control, and a note can hold more than one image at once
- Each note has a Move to Folder control that relocates it to any folder or back to unfiled through a dropdown of full folder paths
- A search box filters notes by title or body text across every folder at once; each result row shows a breadcrumb of that note's folder path, and clearing the box restores the full list
- Each note has a Pin toggle; pinned notes appear in a dedicated Pinned section at the top of the current view regardless of which folder is selected, and unpinning removes the note from that section while leaving it in its normal list
- Each note can be assigned one of six color labels (red, orange, yellow, green, blue, purple) through a swatch picker; the note's list row and its open detail view both show a colored left-edge bar matching the chosen label, consistently in every list it appears in
- Deleting a note moves it to Trash instead of erasing it; from Trash each entry offers Restore and Delete Forever, and a single Empty Trash control clears the whole Trash after a confirm step
- Each folder in the tree shows a live count badge of the notes filed directly in that folder only, not counting notes in its subfolders
- The note body has a formatting toolbar with Bold, Italic, and Bulleted List controls that apply to the current text selection inside the contenteditable body; bold weight, italic slant, and indented bullet markers render inline as the user types, and each toolbar control shows an active or pressed state whenever the text cursor sits inside text already carrying that formatting
- A Load 10,000 Items control generates a deterministic local sample collection and opens a virtualized list that renders only the visible window plus a small overscan buffer; the view labels the total as Virtualized items and shows a Rendered item count that stays far below 10,000 while scrolling, and selection, keyboard focus, and scroll position survive as rows enter and leave the DOM
- The primary note workflow withstands 25 rapid repetitions through the normal controls with an exact final count and no blank screen, uncaught error, or sustained freeze; invalid or extreme input is rejected with visible feedback without damaging the last valid state, and repeated identical submissions do not create duplicate records
</core_features>

<visual_design>
- Nested folders are visibly indented relative to their parent; any folder that has children shows an expand/collapse control, and the currently selected folder is highlighted distinctly from unselected folders
- A note's color label renders as the same colored left-edge bar in every list it appears in (its own folder, All Notes, the Pinned section, and search results) and on the open note detail
- Checked checklist items show a strikethrough and a muted color instantly on toggle; unchecked items stay full-strength and visually distinct at a glance
- When at least one note is pinned, a clearly labeled Pinned section appears above the regular list, separated from it by a divider or heading so pinned and unpinned notes are never ambiguous
- Empty states are deliberately styled, not blank areas: an empty folder shows a friendly message inviting the user to create a note, an empty Trash shows a short distinct message, and a search with no matches shows an explicit no-results message
- Folder rows, note rows, buttons, and swatches show a visible hover treatment distinct from their resting state, and keyboard Tab focus is visibly indicated on every interactive control
- Creating a note, deleting a note to Trash, and restoring a note from Trash each show a transient confirmation such as a toast
- The folder count badge reads as a legible, visually distinct numeral rather than blending into the folder label
- At approximately 375px wide the app renders with no horizontal scrolling; the folder tree collapses behind a togglable Folders button rather than squeezing the note view, and note title, note body, folder labels, and count badges stay legible
- The blank-title inline error is shown at the title field itself
- The Bold, Italic, and Bulleted List toolbar controls visually indicate an active or pressed state whenever the cursor sits inside content already carrying that formatting
</visual_design>

<motion>
- Toggling a checklist item transitions its text to the strikethrough/muted done state immediately, and back, without a reload
- Creating, deleting-to-Trash, and restoring a note each surface a transient toast that appears and then dismisses on its own
- Expanding or collapsing a folder rotates its chevron and reveals or hides its children
- Folder rows, note rows, buttons, and swatches ease into a hover state, and interactive controls show a visible focus ring on keyboard focus
- The formatting toolbar controls change to their active/pressed treatment as the cursor moves into or out of formatted text
- On a narrow viewport the folder panel slides in and out from behind the Folders button rather than reflowing the whole page
</motion>

<requirements>
- Stack: Svelte 5 components in runes mode, shared app state in $state / $derived runes, styling with Tailwind CSS and its Vite plugin, built as a client-rendered Vite SPA on Node 20; no backend, no authentication, no outbound navigation for app chrome
- Persistence contract: folders, notes, and Trash contents survive a full page refresh via localStorage; the restored state includes each note's checklist items and their done state, attached images, pinned state, color label, and rich-text (bold/italic/list) body formatting exactly as before the refresh
- Attached images are stored as data URLs inside the persisted state (a stored image reference begins with data:), with no external hosting and no blob URLs; guard storage access so the production build does not crash
- Virtualization contract: the Load 10,000 Items view renders only the visible window plus a small overscan buffer, exposes the total as Virtualized items and a visible Rendered item count region, and keeps that rendered count far below 10,000 while preserving focus, selection, filtering, and scroll position as rows enter and leave the DOM
- Validation and empty-state rules: a blank note title is rejected with a visible inline error and adds no note; an empty folder, an empty Trash, and a no-match search each show their own distinct styled message; deleting a folder applies one consistent non-destructive behavior to its notes (moved to the root level or moved to Trash) rather than erasing them silently
- Folder count badges count only directly-filed notes, never subfolder notes; note order within a view is most-recently-edited first and stable across re-renders
- At approximately 375px the layout has no horizontal scroll and the folder tree collapses behind a togglable control
- Library allowlist: Tailwind CSS and @tanstack/svelte-virtual for the virtualized list only; no other external UI component libraries, hand-rolled styling for the stack is expected
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
