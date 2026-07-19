<summary>
Build a SideDock bookmark manager using Vue 3 single-file components with the Composition API, Pinia stores for shared state, Tailwind CSS 4.3.2, and Naive UI.
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
On first load with empty storage, the app opens directly at / with zero workspaces and shows a welcoming empty state headed Welcome to SideDock that invites the user to create their first workspace, plus a Create workspace button.
Creating a workspace adds a color-coded tab, makes that workspace active, and swaps the folder and bookmark tree shown below to that workspace; the Add workspace tab creates further workspaces and each new workspace is appended to the end of the tab row.
Each workspace carries a chosen accent color; a color swatch picker on the tab lets the user pick from nine preset colors (#E54610, #D97706, #65A30D, #059669, #0891B2, #2563EB, #7C3AED, #DB2777, #6B7280) and the choice applies immediately to the tab and the workspace header bar.
A pinned Add bookmark form sits at the top of the active workspace with a required Bookmark URL field and an optional Title field; submitting with only a URL derives the title from the URL path or domain, and submitting with an explicit title uses that title verbatim.
The Add bookmark form validates each field inline before submit: a URL value that is not a valid web address shows an inline error message directly under the Bookmark URL field naming that field while the user is still in the form, and correcting the value clears the message without a reload.
Within a workspace the user creates folders and nests subfolders to any depth; a three-level nested folder structure renders with each folder visibly indented under its parent.
Every bookmark shows a small colored monogram square containing the first letter of its domain; the color is derived deterministically from the domain string so the same domain always renders the same color, computed locally with no network request.
A search field filters bookmarks by title or URL as the user types; a scope toggle switches between the current workspace only and all workspaces, and when scoped to all workspaces a match in another workspace appears in results even while a different workspace is active.
Clicking a folder name or a bookmark title turns it into an inline editable text field in place with no modal; Enter saves the new value and Escape discards the edit and restores the prior name.
Each bookmark can carry an optional multi-line note edited inline; once saved, a preview snippet of the note renders under the bookmark title.
Users pin up to eight bookmarks to a horizontal Pinned row shown above the folder tree; unpinning from a pinned tile removes it from the row while the bookmark stays in its folder.
Folders and bookmarks each reorder within their list through up and down controls, and reordered positions persist in the render; new folders and bookmarks are appended to the end of their list by default.
Dragging a bookmark or folder onto another folder moves it inside that folder, dragging an item within a list reorders it, and dragging an item back out to the workspace root returns it to the root; while dragging, the dragged item and the current valid drop target each show a visible highlighted state.
Each folder and bookmark has a labeled Delete control with a confirmation step; deleting a folder removes the folder and every bookmark it contained.
An Import bookmarks control opens a file picker accepting a Netscape-format bookmarks HTML export, parses it client-side, and appends its folder structure and links into the active workspace.
An Export bookmarks control downloads the active workspace as a Netscape-format bookmarks HTML file, and an Export all control downloads every workspace; each export shows a confirmation toast.
A Show sidebar view toggle constrains the content column to a narrow fixed 375px width to mimic a browser-attached panel without introducing horizontal scrolling, and toggling back restores the full view.
A Load 10,000 items control generates deterministic local sample bookmarks for the active workspace and renders them through a virtualized list that draws only the visible window plus a small overscan buffer; the list is exposed as Virtualized items and a visible region labelled Rendered item count reports how many rows are currently in the DOM, which stays far below 10,000.
With 10,000 items loaded, applying a search filter, selecting an item, and using keyboard navigation each produce a visible outcome matching the chosen logical item, and a selected item that scrolls out of the rendered window and back remains selected rather than resetting to the first row.
</core_features>

<user_flows>
After submitting the Add bookmark form with a valid URL, the active workspace's bookmark list gains exactly one new row, searching for the new bookmark's title finds it, and a full page reload restores the same workspace, folder placement, and bookmark with the same title and URL.
Creating a second workspace and adding a bookmark to it, then switching search scope to all workspaces while the first workspace is active, shows that bookmark in the results; switching scope back to the current workspace removes it from the results without a reload.
Pinning a bookmark adds its tile to the Pinned row while the bookmark stays visible in its folder, renaming that bookmark inline updates both the folder row and the pinned tile to the new title without a reload, and after a full page reload the Pinned row still shows the renamed tile.
Deleting a folder through its Delete control and confirmation removes the folder and every bookmark it contained from the tree, a search for a contained bookmark's title then returns no match, and a full page reload does not revive the deleted folder or its bookmarks.
Reordering a bookmark with the up and down controls changes its rendered position immediately, and a full page reload shows the list in the same reordered sequence.
Toggling Show sidebar view narrows the content column to the fixed 375px width, and after a full page reload the app reopens still in sidebar view with the same active workspace.
</user_flows>

<edge_cases>
Submitting the Add bookmark form with an empty URL is rejected with the visible message Enter a URL to add a bookmark and a warning toast, and no bookmark is created; a URL that is not a valid web address is rejected with the message Enter a complete web address, such as https://example.com.
Adding a bookmark whose URL already exists at the same location does not create a duplicate; it surfaces the message Bookmark already exists at this location and leaves the existing bookmark unchanged.
A search that matches nothing shows an explicit no results message naming the query rather than a blank list.
Attempting to pin a ninth bookmark while eight are pinned is prevented and the pin control communicates the eight-item limit; no ninth tile appears in the Pinned row.
Canceling a delete confirmation leaves the folder or bookmark in place, unchanged.
Importing a malformed or unexpected Netscape-format file is handled without throwing: valid entries that can be parsed are appended and the app keeps working with no blank screen or uncaught error.
With zero workspaces the app shows the welcoming empty state; an empty workspace shows a distinct prompt to add the first bookmark.
</edge_cases>

<visual_design>
Color tokens are defined as CSS custom properties: --color-background #FAF4F2 for the page background, --color-surface #EDE0DA for panel and card surfaces, --color-text-primary #1C1412 for body text, --color-accent #E54610 for links, active states, and primary buttons, and --color-border #E4DEDC for borders.
Workspace titles and folder headings use Cormorant Upright with a Georgia serif fallback at roughly 24 to 28px; body text, inputs, and bookmark titles use Inter with a system sans-serif fallback at roughly 15px.
The base spacing unit is 4px and spacing values cluster on multiples of it; cards, buttons, and inputs use a 12px border radius.
Primary buttons use a solid --color-accent background with white text and no shadow; secondary buttons use a white background, --color-text-primary text, a 1px --color-border outline, and a subtle drop shadow.
Each workspace's chosen accent color appears on its own tab as an underline or background tint and as the header bar color on its folder tree, so the active workspace's color scheme is unmistakable.
Monogram tiles render their letter in readable contrasting text against the generated background color across every hue the generator produces.
Icons across the app come from one consistent icon set with a uniform stroke weight; toolbar controls, pin controls, and delete controls pair their icon with a text label or accessible name.
</visual_design>

<motion>
Tabs, buttons, folder rows, and bookmark rows show a visible hover state on pointer hover, and every interactive control shows a visible keyboard focus ring on Tab focus that is distinct from its hover state.
Pressing or clicking an interactive control shows immediate pressed feedback, a slight downward translate and darken, on pointer-down before the triggered operation completes.
Adding a bookmark or folder animates the new row into position, deleting animates the row out, and reordering with the up and down controls slides rows to their new positions rather than snapping.
Pinning a bookmark animates its tile into the Pinned row and unpinning animates the tile out.
Adding, importing, exporting, and deleting each show a transient toast confirmation that shares one consistent style and position across all four action types and dismisses on its own.
While a bookmark or folder is being dragged, the dragged item shows a visible dragging state and the folder currently under the pointer shows a visible valid-drop-target highlight; aborting the drag returns the item to its original position.
Toggling Show sidebar view animates the content column between the full width and the narrow 375px width smoothly without a layout flash or content jump.
</motion>

<responsiveness>
At roughly 375px wide the app renders with no horizontal scrolling and the Add bookmark form and workspace tabs remain fully usable; long titles and URLs wrap or truncate within their container rather than overflowing.
At desktop widths the Pinned row, workspace tabs, and folder tree share the layout shown in the reference screenshots without content clipping at any width between 375px and 1440px.
</responsiveness>

<accessibility>
Every interactive control, including workspace tabs, pin controls, reorder controls, and the search scope toggle, is reachable and operable with the keyboard alone and shows a visible focus indicator.
The delete confirmation is presented as an accessible dialog that traps focus while open and returns focus to the triggering Delete control when dismissed or canceled.
Inline rename is fully keyboard operable: the edit field receives focus when editing starts, Enter saves, and Escape cancels and restores the prior name.
Toast confirmations are announced to assistive technology via a polite live region as well as shown visually.
</accessibility>

<performance>
The app is interactive within 2 seconds of a local cold load, and no console errors appear during a full exercise of the app.
The primary Add bookmark workflow withstands 25 rapid deterministic repetitions through the normal form controls; the final visible count is exact, controls stay responsive, and the burst produces no blank screen, uncaught error, or sustained freeze.
With 10,000 items loaded, scrolling the virtualized list stays smooth with no sustained freeze, and the rendered row count reported by Rendered item count stays far below 10,000 as rows enter and leave the DOM.
</performance>

<writing>
UI labels use sentence case, action buttons begin with a verb, and quantities are shown as numerals.
Error messages name the problem and the fix, empty states explain what belongs there and how to add it, and no placeholder or lorem text appears anywhere in the shipped UI.
</writing>

<requirements>
Build a client-rendered Vite single-page app with Vue 3 single-file components and the Composition API, Pinia stores holding the shared workspace, folder, bookmark, pin, and view state, and Tailwind CSS 4.3.2 (pinned) for styling with design tokens defined in the @theme block; there is no backend, no authentication, and the app opens directly at /.
Use Naive UI as the only component library, for the dialogs, inputs, selects, tabs, and toasts; Naive UI keeps its component styles while Tailwind owns layout, spacing, and custom surfaces. @vueuse/motion and AutoAnimate are allowed for animation; no other animation libraries. Phosphor icons via the @phosphor-icons/vue package only; no raw pasted SVGs and no icon CDN.
All forms, including the Add bookmark form, validate through VeeValidate with a Zod schema: the schema defines the rules and the form surfaces inline per-field errors before submit.
Persist all workspaces, folders, bookmarks, pins, notes, the active workspace, and the sidebar-view toggle to localStorage under a single key so a full page reload restores the exact prior state; guard localStorage access so the production build never crashes, and start from completely empty storage with no pre-seeded workspaces, folders, or bookmarks.
Creating, renaming, and deleting workspaces, folders, and bookmarks; editing a note; pinning and unpinning; reordering; moving between folders; searching; toggling search scope; and toggling sidebar view all read and write the same shared store so every view stays consistent, and deletions do not revive deleted data after a reload.
The Add bookmark form requires a URL, derives a blank title from the URL, rejects empty or invalid URLs with visible feedback without damaging the last valid state, and treats a duplicate submission at the same location as idempotent rather than creating a second record.
The monogram icon color is computed deterministically from the domain string with no network request; import and export operate entirely client-side on Netscape-format bookmarks HTML.
The Load 10,000 items control generates deterministic sample data and the list virtualizes through @tanstack/vue-virtual so the rendered row count stays far below the total while preserving focus, selection, filtering, and scroll position as rows enter and leave the DOM.
All libraries are installed via npm and bundled locally; no CDN imports of any library, font, or icon set. The app renders with no horizontal scrolling at roughly 375px wide, and it performs zero outbound navigation away from /.
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
- browse-query-v1
- entity-collection-v1
- artifact-transfer-v1

Module specs:
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
- Browsable entity: bookmarks
- Destinations: default-view; sidebar-view
- Filters: search-scope
- Entity: bookmark
- Entity operations: create; select; update; delete; toggle; reorder
- Entity fields: url; title; note; pinned; folder
- Artifact operations: import; export
- Import modes: netscape-html
- Export formats: netscape-html

Mechanics exclusions:
- Drag-move/reorder gestures stay Playwright-observed
- Inline-rename keystrokes stay Playwright-driven
- Virtualized scroll windowing stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
