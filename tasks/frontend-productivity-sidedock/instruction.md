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
Workspace create field contract (Create workspace and Add workspace each produce exactly this payload; the workspace record IS the would-be request body): name (required trimmed non-empty string, 1 to 40 characters); accentColor (required closed enum of hex swatches exactly #E54610, #D97706, #65A30D, #059669, #0891B2, #2563EB, #7C3AED, #DB2777, #6B7280). A blank, whitespace-only, or over-40-character name is rejected with an inline error naming the name field and creates no workspace; an accentColor outside that closed set is rejected naming the accentColor field.
Creating a valid workspace adds a color-coded tab using that accentColor, makes that workspace active, and swaps the folder and bookmark tree shown below to that workspace; the Add workspace tab creates further workspaces and each new workspace is appended to the end of the tab row.
Each workspace carries its accentColor; a color swatch picker on the tab lets the user pick only from the nine closed-enum colors and the choice applies immediately to the tab and the workspace header bar.
Bookmark create field contract (the Add bookmark form submits exactly this payload; the record the form creates IS the would-be bookmarks API request body): url (required absolute http or https web address); title (optional string; when blank or whitespace-only, derived from the URL path or domain into a non-empty title; when provided, trimmed non-empty string at most 120 characters); note (optional string, default empty); folder (optional folder id, or null for workspace root). Cross-field rules: url must parse as http or https with a hostname; a duplicate url at the same folder location is rejected as idempotent (no second record); pinned is not set by create and defaults false.
A pinned Add bookmark form sits at the top of the active workspace with a required Bookmark URL field and an optional Title field; submitting a payload that satisfies the Bookmark create field contract inserts exactly one bookmark row whose visible title and url match that payload (derived title when title was blank).
The Add bookmark form validates each field inline before submit against the Bookmark create field contract: an empty url shows the message Enter a URL to add a bookmark under the Bookmark URL field; a url that is not a valid http/https web address shows Enter a complete web address, such as https://example.com under that field; a provided title longer than 120 characters shows an inline error naming the title field; correcting the value clears the message without a reload; no invalid bookmark is created.
Within a workspace the user creates folders and nests subfolders to any depth; folder create field contract: name (required trimmed non-empty string, 1 to 80 characters); a blank or over-length folder name is rejected with an inline error naming the name field. A three-level nested folder structure renders with each folder visibly indented under its parent.
Every bookmark shows a small colored monogram square containing the first letter of its domain; the color is derived deterministically from the domain string so the same domain always renders the same color, computed locally with no network request.
A search field filters bookmarks by title or URL as the user types; a scope toggle switches between the current workspace only and all workspaces, and when scoped to all workspaces a match in another workspace appears in results even while a different workspace is active.
Clicking a folder name or a bookmark title turns it into an inline editable text field in place with no modal; Enter saves the new value and Escape discards the edit and restores the prior name; saved folder names must still satisfy the folder name field contract and saved bookmark titles must still satisfy the title bounds from the Bookmark create field contract.
Each bookmark can carry an optional multi-line note edited inline; once saved, a preview snippet of the note renders under the bookmark title.
Users pin up to eight bookmarks to a horizontal Pinned row shown above the folder tree; unpinning from a pinned tile removes it from the row while the bookmark stays in its folder; attempting a ninth pin is blocked and the pin control communicates the eight-item limit.
Folders and bookmarks each reorder within their list through up and down controls, and reordered positions persist in the render; new folders and bookmarks are appended to the end of their list by default.
Dragging a bookmark or folder onto another folder moves it inside that folder, dragging an item within a list reorders it, and dragging an item back out to the workspace root returns it to the root; while dragging, the dragged item and the current valid drop target each show a visible highlighted state.
Each folder and bookmark has a labeled Delete control with a confirmation step; deleting a folder removes the folder and every bookmark it contained.
Netscape-format export remains the browser-interop artifact: an Export bookmarks control downloads the active workspace as Netscape bookmarks HTML whose link HREF and link text encode each bookmark's url and title from records that satisfy the Bookmark create field contract, and an Export all control downloads every workspace; each export shows a confirmation toast.
An Import bookmarks control opens a file picker accepting Netscape-format bookmarks HTML, parses it client-side, and appends only entries that can be mapped into bookmark and folder records satisfying the Bookmark and folder field contracts into the active workspace.
SideDock package field contract (API-shaped session document; all top-level keys REQUIRED; the document IS the would-be workspace sync request/response body; example values are illustrative only): schemaVersion exactly the string sidedock-package-v1; sidebarView boolean; activeWorkspaceId string or null; pinnedBookmarkIds array of bookmark id strings with length 0 through 8 inclusive; workspaces array of workspace records. Each workspace requires id (non-empty string), name (matching the Workspace create field contract), accentColor (same closed nine-color enum), and items (array of tree nodes). Folder node: type exactly folder; id non-empty string; name matching the folder name field contract; children array of tree nodes. Bookmark node: type exactly bookmark; id non-empty string; url, title, and note matching the Bookmark create field contract (title always non-empty in stored records); pinned boolean. Cross-field: every id in pinnedBookmarkIds must refer to a bookmark node present in the items tree of at least one workspace in the workspaces array; accentColor values outside the closed enum are invalid; no undeclared top-level keys.
An Export SideDock package control opens a package panel with a live monospaced JSON preview compiled from the shared store that always reflects the current session and conforms to the SideDock package field contract; Download package triggers a real file download whose contents match the preview; Copy package writes that exact JSON to the clipboard and shows a brief copied confirmation.
An Import SideDock package control accepts a previously exported SideDock package JSON file or pasted JSON and validates it against the same SideDock package field contract; a valid import replaces the session so workspace tabs, trees, pins, sidebar view, and the package preview match the imported document; exporting then re-importing reconstructs the same visible workspaces, folders, bookmarks, pins, and sidebar view.
Every workspace, bookmark, folder, pin, note, accentColor, and sidebar-view mutation must appear in the Export SideDock package preview; an export that omits session work is incomplete.
A Show sidebar view toggle constrains the content column to a narrow fixed 375px width to mimic a browser-attached panel without introducing horizontal scrolling, and toggling back restores the full view.
A Load 10,000 items control generates deterministic local sample bookmarks for the active workspace and renders them through a virtualized list that draws only the visible window plus a small overscan buffer; the list is exposed as Virtualized items and a visible region labelled Rendered item count reports the count of rows currently in the DOM, which stays far below 10,000.
With 10,000 items loaded, applying a search filter, selecting an item, and using keyboard navigation each produce a visible outcome matching the chosen logical item, and a selected item that scrolls out of the rendered window and back remains selected rather than resetting to the first row.
</core_features>

<user_flows>
After submitting the Add bookmark form with a url and optional title that satisfy the Bookmark create field contract, the active workspace's bookmark list gains exactly one new row whose title and url match that payload, searching for the new bookmark's title finds it, the SideDock package preview includes that bookmark's url and title under the active workspace items, and a full page reload restores the same workspace, folder placement, and bookmark with the same title and URL.
Creating a second workspace with a valid Workspace create payload and adding a bookmark to it, then switching search scope to all workspaces while the first workspace is active, shows that bookmark in the results; switching scope back to the current workspace removes it from the results without a reload; the package preview lists both workspaces with their accentColor values from the closed enum.
Pinning a bookmark adds its tile to the Pinned row while the bookmark stays visible in its folder, renaming that bookmark inline updates both the folder row and the pinned tile to the new title without a reload, after a full page reload the Pinned row still shows the renamed tile, and the package preview's pinnedBookmarkIds and bookmark title reflect the pin and rename.
Deleting a folder through its Delete control and confirmation removes the folder and every bookmark it contained from the tree, a search for a contained bookmark's title then returns no match, a full page reload does not revive the deleted folder or its bookmarks, and the package preview no longer contains those nodes.
Reordering a bookmark with the up and down controls changes its rendered position immediately, and a full page reload shows the list in the same reordered sequence.
Toggling Show sidebar view narrows the content column to the fixed 375px width, and after a full page reload the app reopens still in sidebar view with the same active workspace; the package preview's sidebarView boolean matches the toggle.
SideDock package round trip: create a workspace, add a bookmark with a distinctive url and title that satisfy the field contract, pin it, open Export SideDock package and confirm the live JSON shows schemaVersion sidedock-package-v1 plus those values, Download or Copy that JSON, mutate the session away from that state, Import the same JSON, and confirm workspace tabs, tree, Pinned row, sidebar view, and package preview match the pre-export session.
</user_flows>

<edge_cases>
Submitting the Add bookmark form with an empty URL is rejected with the visible message Enter a URL to add a bookmark and a warning toast, and no bookmark is created; a URL that is not a valid http/https web address is rejected with the message Enter a complete web address, such as https://example.com under the Bookmark URL field; a provided title longer than 120 characters is rejected with an inline error naming the title field; none of these invalid payloads create a bookmark row.
Adding a bookmark whose URL already exists at the same location does not create a duplicate; it surfaces the message Bookmark already exists at this location and leaves the existing bookmark unchanged.
Creating a workspace with a blank name or a name longer than 40 characters is rejected with an inline error naming the name field and adds no tab; choosing an accentColor outside the nine-color closed enum is rejected naming the accentColor field.
A search that matches nothing shows an explicit no results message naming the query rather than a blank list.
Attempting to pin a ninth bookmark while eight are pinned is prevented and the pin control communicates the eight-item limit; no ninth tile appears in the Pinned row.
Canceling a delete confirmation leaves the folder or bookmark in place, unchanged.
Importing a malformed or unexpected Netscape-format file is handled without throwing: only entries that map to Bookmark and folder field-contract-valid records are appended, invalid link targets are skipped, and the app keeps working with no blank screen or uncaught error.
Importing malformed or undecodable SideDock package JSON shows a visible error naming the import problem, leaves the current workspaces, pins, and sidebar view unchanged, and produces no console crash.
Importing parseable JSON that fails the SideDock package field contract — wrong schemaVersion, accentColor outside the closed nine-color enum, a blank or over-length workspace or folder name, a bookmark url that is not http/https, a title over 120 characters, pinnedBookmarkIds longer than 8, or a pinned id missing from the trees — leaves the session unchanged and shows validation naming the offending field or rule.
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
All forms, including Create workspace, Add bookmark, and folder create, validate through VeeValidate with a Zod schema: the schema defines the rules and the form surfaces inline per-field errors before submit. Schemas are API-shaped: each form's schema models the payload a real bookmarks/workspace API would accept (Workspace create with required name 1–40 characters and accentColor from the closed nine-color enum; Bookmark create with required http/https url, optional title at most 120 characters with blank deriving from the URL, optional note, optional folder; folder create with required name 1–80 characters). The record a form creates IS the would-be request body, and SideDock package JSON export/import compile and validate against the SideDock package field contract that nests those same workspace, folder, and bookmark shapes.
Persist all workspaces, folders, bookmarks, pins, notes, the active workspace, and the sidebar-view toggle to localStorage under a single key so a full page reload restores the exact prior state; guard localStorage access so the production build never crashes, and start from completely empty storage with no pre-seeded workspaces, folders, or bookmarks.
Creating, renaming, and deleting workspaces, folders, and bookmarks; editing a note; pinning and unpinning; reordering; moving between folders; searching; toggling search scope; and toggling sidebar view all read and write the same shared store so every view stays consistent, and deletions do not revive deleted data after a reload.
The Add bookmark form requires a URL that satisfies the Bookmark create field contract, derives a blank title from the URL, rejects empty or invalid URLs and over-long titles with visible feedback without damaging the last valid state, and treats a duplicate submission at the same location as idempotent rather than creating a second record.
The monogram icon color is computed deterministically from the domain string with no network request; Netscape-format import and export operate entirely client-side; SideDock package Download, Copy, and Import operate entirely client-side against the SideDock package field contract.
The useful end state is the session artifact: Netscape HTML plus SideDock package JSON must contain the session's actual workspaces, folders, bookmarks, pins, notes, accent colors, and sidebar view, and SideDock package JSON must round-trip through Import while conforming to the declared field contract; an export that omits session mutations is invalid.
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
- Artifact operations: import; export; copy
- Import modes: netscape-html; sidedock-json
- Export formats: netscape-html; sidedock-json

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
