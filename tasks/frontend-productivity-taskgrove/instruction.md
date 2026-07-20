<summary>
Build TaskGrove, a hierarchical task-tree planner, using Svelte 5 in runes mode, shared state runes ($state/$derived), Tailwind CSS 4.3.2, and Melt. The app produces the operator's portable Grove package — downloadable Grove JSON and Grove CSV compiled live from the task tree, tags, archive, and theme — conforming to the same API-shaped field contracts as create and edit forms, with Import that round-trips those documents.
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
Feature: Task field contract (API-shaped TaskUpsert) —
- Creating or editing a task submits exactly a TaskUpsert payload; the record a successful create or edit produces IS the would-be task API request body; New root task, Add Child, Edit task, Grove JSON export, Grove CSV export, and Import share this same task object shape. TaskUpsert field contract (all keys required unless marked optional; example values illustrative only): title (required string after trim, 1 to 120 characters), status (required closed enum string, exactly one of todo, in_progress, done, or blocked), priority (required closed enum string, exactly one of low, medium, high, or urgent), dueDate (optional string; null or empty string when unset, otherwise exactly YYYY-MM-DD), parentId (null for a root task; otherwise the non-empty string id of an existing parent), tags (array of 0 to 5 existing tag name strings with no duplicates case-insensitively). Cross-field rules: a leaf node's completed flag is true if and only if status is done; toggling a leaf completion checkbox sets status to done when checked and to todo when unchecked if status was done; a parent node's completed flag is computed only from descendant leaves and cannot be set by choosing status alone while incomplete leaves remain. App-assigned fields present on the stored record and in export: id (non-empty string), completed (boolean), collapsed (boolean), children (array of nested task objects of the same shape)
- New root task and Add Child forms collect title, status, priority, and optional dueDate; each invalid field under the TaskUpsert field contract shows an inline error naming that field before submit, the submit control stays inactive until valid, and no phantom task is added on an invalid submit
- Each node shows an Edit task control that opens a form prefilled with that node's title, status, priority, and dueDate; a valid submit updates the node in place and the Export grove JSON and CSV previews reflect the new values without a reload; invalid values are rejected naming the offending field
Feature: Tag field contract (API-shaped TagUpsert) —
- Creating a tag submits exactly a TagUpsert payload; the record a successful create produces IS the would-be tag API request body. TagUpsert field contract (all keys required; example values illustrative only): name (required string after trim, 1 to 40 characters, unique among tags case-insensitively), color (required string that is exactly one of #EF4444, #F97316, #F59E0B, #84CC16, #10B981, #06B6D4, #3B82F6, #8B5CF6, #EC4899, or #F43F5E). App-assigned fields present on the stored record and in export: id (non-empty string)
- The tag-creation form in the Tag manager validates before submit: a blank or over-40-character name shows an inline error naming name, a duplicate name shows an inline error naming name, a color outside the closed hex enum shows an inline error naming color, the submit control stays inactive until name and color are valid, and no invalid tag is added
Feature: Tree structure and progress —
- On first load with no data, a New root task form sits in the footer and the tree area shows an empty-state message inviting the user to add the first root task
- Submitting New root task with a valid TaskUpsert payload adds a new top-level task shown as the root of its own tree, displaying its title, status, priority, and dueDate when set
- Every task node shows an Add Child control; submitting it with a valid TaskUpsert payload nests a new child one level beneath that node, indented further than its parent; children can be added to any depth (root, child, grandchild, and beyond)
- Any node with at least one child shows an expand/collapse chevron; clicking it hides that node's entire subtree from view, and clicking it again reveals the subtree
- Leaf tasks (no children) show a manual completion checkbox; a parent task's completion is computed automatically as complete only once 100 percent of its descendant leaf tasks are complete, and updates live as leaves are toggled
- Every node with at least one child renders a small radial progress ring showing the percentage of its descendant leaf tasks that are complete; the ring's fill visibly increases as leaves are toggled complete and reaches a distinct complete visual treatment (a checkmark) only at 100 percent
Feature: Zoom, tags, filter, search —
- Each node shows a Zoom In control; clicking it makes that node the temporary root of the whole view, hiding everything outside its branch, and shows a breadcrumb trail above the tree with every ancestor down to the true root; clicking any breadcrumb segment zooms back out to exactly that level, and clicking the trailing unzoom control returns to the true root
- Each node can carry up to 5 tags chosen from a reusable, user-managed tag list opened from a Tag manager control in the toolbar; creating a tag there gives it a name and a distinct color from the closed hex enum; attaching a tag to a node shows a colored tag chip on that node's row
- The toolbar shows a row of toggleable tag filter chips, one per existing tag; toggling a chip on narrows the visible tree to only branches containing at least one matching node, auto-expanding the ancestors of every match; toggling it off restores the full tree
- A Smart Search input in the toolbar highlights the matching text inside any node whose title matches the query, auto-expands that node's ancestor chain so the match stays visible, and visibly dims (never removes from the page) branches with no match; clearing the query returns every branch to full, non-dimmed visibility
Feature: Reorder, move, archive —
- Each node shows Move Up and Move Down controls that swap it with its previous or next sibling respectively; the new order is reflected immediately and remains stable across re-renders
- Each node shows a Move To control that opens a picker listing every other node in the tree (plus a root-level option); choosing a target moves the current node, together with its whole subtree, to become a child of the picked node (or to the top level), and it is removed from its prior location
- Once every descendant leaf in a node's branch (a node that has at least one child) is complete, an Archive control appears on that node; using it moves that whole branch out of the main tree into a separate Archive panel. The Archive panel lists every archived branch by its root title with its own Restore control; using Restore returns that branch to the main tree as a new top-level root task, with its original structure, tags, status, priority, and dueDate intact
Feature: Branch text export —
- Each node shows an Export as Text control; using it downloads that node's branch as an indented plain-text (.txt) outline, one line per node, each child indented one level deeper than its parent
Feature: Grove package export and import (useful end state; API-shaped Grove documents) —
- An Export grove control in the toolbar opens a Grove package panel with two tabs, Grove JSON and Grove CSV, each showing a live scrollable monospaced preview compiled from the store, plus Download grove package, Copy grove package, and Import grove controls
- Grove JSON field contract (preview, Download, Copy, and Import all conform; field names and enum values are visible in the preview text; all keys and nesting REQUIRED unless marked optional; example values illustrative only): schemaVersion (required number exactly 1), exportedAt (required ISO-8601 datetime string ending in Z), theme (required closed enum string, exactly one of light, dark, or forest), tags (required array of tag objects each matching the TagUpsert field contract plus id), tasks (required array of root task objects each matching the TaskUpsert field contract plus id, completed, collapsed, and children, in tree order), archive (required array of archived branch-root task objects of the same task shape as tasks entries). Cross-field rules: every node tags entry must equal a name present in the tags array; every non-null parentId relationship is expressed by nesting under children rather than a dangling parent; status, priority, and dueDate obey the TaskUpsert rules; theme must be light, dark, or forest. After creating a task, editing status or priority or dueDate, creating a tag, archiving a branch, or switching theme, a fresh Grove JSON preview contains those session mutations under the field-contract keys — an export that omits session work is incorrect
- Grove CSV field contract (preview, Download, Copy, and Import all conform; all columns REQUIRED; example values illustrative only): a header row exactly id,title,status,priority,dueDate,parentId,completed,collapsed,tags,archived followed by one data row per task across the main tree and archive (depth-first within each root); id and title are non-empty strings; status is exactly one of todo, in_progress, done, or blocked; priority is exactly one of low, medium, high, or urgent; dueDate is empty or YYYY-MM-DD; parentId is empty for roots otherwise a parent id present in the file; completed and collapsed are exactly true or false; tags is a pipe-delimited list of zero to five tag names that exist in the Grove JSON tags array when both formats are exported from the same session; archived is exactly true for rows belonging to an archived branch and false otherwise. Grove CSV mirrors the same TaskUpsert field values as Grove JSON for every task
- Download grove package downloads the active tab's document via a Blob and an anchor download attribute; Copy grove package copies the active tab's text and shows a visible confirmation
- Import grove accepts a previously exported Grove JSON or Grove CSV document (file pick or paste). A valid import replaces the current tree, tags, archive, and theme so the main tree, Tag manager, Archive panel, theme, and both export previews match the imported document without a reload. Malformed text, schemaVersion other than 1, theme outside light|dark|forest, status or priority outside their closed enums, dueDate not empty and not YYYY-MM-DD, tag color outside the closed hex enum, blank title, node tags longer than 5, or CSV rows that fail the Grove CSV field contract leave the session unchanged and show visible validation naming the offending field or rule
Feature: Theme and confirmations —
- A Theme control in the toolbar cycles between Light, Dark, and Forest named themes; each click swaps the app's full color palette instantly with no page reload, and the app stays fully readable in every theme
- Every action that changes durable state (adding a task or child, editing a task, archiving a branch, restoring a branch, moving a task via Move To, importing a grove package) shows a transient confirmation (a toast) that clears on its own within 3 seconds
</core_features>

<user_flows>
End-to-end flows the finished app must support, with state visible across every surface named:
- Creating a root task via the footer form with title, status, priority, and optional dueDate adds exactly one new tree to the main area, the empty-state message disappears if it was showing, a confirmation toast appears, and the Export grove JSON and CSV previews include that title, status, priority, and dueDate; adding two children to that root via Add Child shows both children indented beneath it and makes the parent grow a progress ring at 0 percent; toggling both children complete raises the ring live through the intermediate percentage to the 100 percent checkmark treatment, marks the parent complete automatically, sets each leaf status to done, and updates both export previews, all without a reload
- Editing a task's status to blocked, priority to urgent, and dueDate to a YYYY-MM-DD value updates the node row chips or labels immediately and appears under the same keys in the Grove JSON and CSV previews without a reload
- With a branch fully complete, activating its Archive control removes that branch from the main tree, adds one entry to the Archive panel listed by its root title, and shows a toast; a full page refresh afterward still shows the branch in the Archive panel and absent from the main tree; activating Restore returns it to the main tree as a top-level root with its structure, tags, status, priority, and dueDate intact, and the Archive panel loses that entry
- Creating a tag in the Tag manager adds one chip to the manager's list and one matching filter chip to the toolbar row; attaching that tag to a node shows the chip in the same color on the node's row; toggling the toolbar filter chip on narrows the tree to branches containing that node with its ancestors auto-expanded, and toggling it off restores the full tree; after a full page refresh the tag still exists in the manager, on the node's row, and in the filter row with the same color
- Zooming into a grandchild node shows only that node's branch plus a breadcrumb trail naming each ancestor down to the true root; adding a child while zoomed shows the new node inside the zoomed view, and after zooming back out via the breadcrumb the same new node is present in the full tree
- Mutation-to-export: after creating a root with a distinctive title, setting status and priority, attaching a tag, and switching theme, the Grove JSON preview shows schemaVersion exactly 1, that theme, the tag name and color, and the task title, status, and priority; the Grove CSV preview shows a header row and a data row carrying the same title, status, and priority
- Artifact round-trip: Download or Copy the Grove JSON (or Grove CSV) then Import that same document after diverging the session reconstructs the same visible tree titles, tag chips, archive contents, theme, and both export previews
- The full state of the app — every task and its position in the tree, every node's tags, status, priority, dueDate, every node's collapsed or expanded state, the Archive panel's contents, and the chosen theme — survives a full page refresh exactly as it was left
</user_flows>

<edge_cases>
- Submitting New root task or Add Child with a blank or whitespace-only title is rejected and shows a visible inline error naming the title field, and no blank-titled task is added; a title longer than 120 characters is rejected the same way
- Submitting status outside todo|in_progress|done|blocked, priority outside low|medium|high|urgent, or dueDate that is not empty and not YYYY-MM-DD shows an inline error naming the offending field and adds or saves nothing
- A parent task's completion checkbox cannot be manually toggled while it still has an incomplete descendant leaf
- Attempting to attach a 6th tag to a node is blocked and the node keeps exactly 5 chips
- Submitting a tag with a duplicate name (case-insensitive) or a color outside the closed hex enum is rejected naming name or color respectively, and no invalid tag is added
- If no branch matches the active tag filters, the tree area shows an explicit no-results message instead of a blank area
- A search query matching nothing shows an explicit no-results message; branches are dimmed, never removed from the page
- A node whose branch is not fully complete does not show an Archive control
- Before anything is archived, the Archive panel shows a short explanatory message instead of a blank area
- Double-activating a submit control creates exactly one task: exactly one new node appears in the tree
- Move Up on a first sibling and Move Down on a last sibling do nothing and cause no error or reorder
- Importing malformed Grove JSON or Grove CSV leaves the tree, tags, archive, and theme unchanged and shows visible validation naming the import problem
- Importing parseable JSON or CSV that fails the Grove package field contract — wrong schemaVersion, theme outside light|dark|forest, status or priority outside their closed enums, tag color outside the closed hex enum, blank title, node tags longer than 5, or CSV columns that do not match the Grove CSV header — leaves the session unchanged and shows validation naming the offending field or rule
</edge_cases>

<visual_design>
- The app opens into a header (app name and one-line description), a toolbar (search, tag filter chips, Tag manager toggle, Export grove, Theme control), an optional Tag manager panel, an optional Grove package panel, an optional breadcrumb bar when zoomed, a main area with the task tree on the left and the Archive panel on the right, and a footer with the New root task form
- Typography: the app name heading uses the ui-sans-serif and system-ui fallback stack at 96px; secondary headings (Archive, Tag manager, Move dialog, Grove package titles) use the same heading stack at 48px; ordinary body text, including every task title, uses the Arial fallback stack at 10px
- Color tokens as CSS custom properties in the Light theme: --color-primary #00BC7D (accent, used on primary buttons, the progress ring, active tag-filter emphasis, and focus outlines), --color-secondary #62748E (muted supporting tone, used on the app subtitle), --color-accent #00BC7D, --color-background #FFFFFF (page and panel canvas), --color-text-primary #0F172B (ink), --color-link #0F172B. Dark and Forest themes swap every one of these to their own consistent, readable palette while keeping the same recognizable green accent hue
- Shape system: an 8px base spacing unit governs gaps and padding throughout; panels, cards, and task rows render with 0px border radius (sharp corners); the primary button treatment (background #00BC7D, white text, 16px border radius, a soft elevated shadow) is used on New Root Task, Add Child, Export as Text, and Download grove package; the secondary button treatment (white background, #0F172B text, a visible #E2E8F0 border, 16px border radius, no shadow) is used on Move Up, Move Down, Move To, Archive, Copy grove package, and Import grove
- Tag chips render as small filled pill shapes; each tag's exact color renders identically wherever it appears: on a node's row, in the toolbar's tag filter row, and in the Tag manager
- Status and priority appear on each node row as compact labeled chips or text that remain readable in all three themes; a set dueDate renders as YYYY-MM-DD next to the title
- The Grove package panel shows a scrollable monospaced preview for the active tab with Download grove package and Copy grove package controls visibly distinct from secondary actions
- Deeper tree levels are visibly indented beneath their parent, with a chevron slot reserved even for leaf rows so title columns stay aligned
- Icons come from a single consistent icon set used across every control (chevrons, zoom, move, archive, export, theme); no two controls of the same kind use visually mismatched glyph styles
</visual_design>

<motion>
- Node rows, the expand and collapse chevron, tag chips, and every button show a visible hover state (a background wash, border color shift, or slight elevation)
- Newly added task rows animate into place rather than appearing instantly, and rows leaving the tree (archived branches, nodes moved elsewhere) animate out; a Move Up or Move Down swap slides the affected rows to their new positions instead of snapping
- The progress ring's fill animates smoothly as its underlying percentage changes rather than jumping instantly
- The expand and collapse chevron rotates as its node toggles between expanded and collapsed
- Search highlighting and branch dimming apply immediately as the query changes; dimmed branches use a reduced-opacity treatment rather than disappearing
- Submitting a blank title (root or child) triggers a brief shake on the input alongside its inline error text
- Toasts enter with a short slide-and-fade and then clear on their own within 3 seconds
- Switching themes recolors every surface, border, and accent instantly with a brief color transition, without a page reload
- The Grove package panel enters and exits with a short opacity-and-scale transition of roughly 200 milliseconds
- With prefers-reduced-motion set, animations are removed and state changes apply instantly
</motion>

<responsiveness>
- At approximately 375px wide, the app renders with no horizontal scrolling anywhere; deeply nested rows truncate or wrap their title text rather than forcing the page wider, and the app-name heading scales down rather than overflowing the viewport
- On narrow viewports the Archive panel stacks below the task tree instead of sitting beside it; on desktop widths the tree and Archive panel sit side by side
- Toolbar controls (search, filter chips, Tag manager toggle, Export grove, Theme control) wrap onto additional rows on narrow viewports rather than clipping or overflowing
- The Grove package panel remains fully usable at narrow width with its preview scrollable and Download, Copy, and Import controls reachable
</responsiveness>

<accessibility>
- Every interactive control (inputs, buttons, checkboxes, chevrons, tag chips, breadcrumb segments, Grove package tab controls) is reachable and operable with the keyboard alone, with a visible focus indicator whose treatment is distinguishable from hover
- The Tag manager panel, the Move To picker, and the Grove package panel are keyboard-operable: dialogs trap focus while open, close on Escape, and return focus to the control that opened them
- Toast confirmations are announced via an aria-live polite region as well as shown visually
- Inline form validation errors are rendered adjacent to the field they name and are programmatically associated with that field
- Text and interactive controls keep readable contrast against their background in all three themes
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear during a full exercise of the app: creating, nesting, editing status or priority, toggling, tagging, filtering, searching, zooming, moving, archiving, restoring, exporting as text, exporting or importing a grove package, and theme switching
- Rapidly toggling several leaf checkboxes in succession keeps the UI responsive, with progress rings and parent completion staying consistent with the final toggle state
</performance>

<writing>
- Headings, buttons, and control labels use one consistent capitalization convention throughout the app
- Action labels are specific verbs (Add Child, Move To, Export as Text, Export grove, Import grove, Download grove package) rather than generic labels where a specific one is possible
- Validation and error messages name the problem and the fix including the offending field from the field contract (for example title must be 1 to 120 characters, status must be todo, in_progress, done, or blocked, schemaVersion must be 1); empty states (empty tree, empty Archive panel, no filter or search matches) explain what belongs there and how to fill it; no placeholder or lorem-ipsum text appears anywhere in the shipped UI
</writing>

<requirements>
Use Svelte 5 components in runes mode with shared $state and $derived runes for all application state: the task tree, the reusable tag list, the archive, the active theme, the zoom target, search query, active tag filters, Grove package preview text, and toast queue. Views derive from this one shared store; filters and search never create a second disconnected copy of the data.
Style with Tailwind CSS 4.3.2 (pinned), with design tokens declared in @theme; Tailwind owns layout, spacing, and custom surfaces.
Melt provides the interactive primitives: the Tag manager panel, the Move To picker dialog, the Grove package panel, the tag-selection controls, tooltips, and the toast system are built on its builders rather than hand-rolled.
AutoAnimate and Svelte transitions are the animation stack: AutoAnimate for tree row add/remove/reorder microinteractions, Svelte transitions for toasts, panels, and the input shake; no other animation libraries.
Phosphor icons via the phosphor-svelte package only; no other icon sets, no raw copy-pasted SVGs, no icon CDNs.
All forms (New root task, Add Child, Edit task, tag creation, and Import when presented as a form) validate through a Zod schema via Felte: the schema defines the rules and inline per-field errors render before submit. Schemas are API-shaped: they model the TaskUpsert, TagUpsert, Grove JSON, and Grove CSV field contracts — the record a successful create or edit produces IS that request-body payload; Grove JSON and Grove CSV export and import use the same field names, enums, bounds, and cross-field rules.
All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
Persistence is a required part of this application, not an incidental detail: use localStorage (or an equivalent client persistence mechanism for this stack) so that the full tree, every node's tags, status, priority, dueDate, every node's collapsed or expanded state, the Archive panel's contents, and the chosen theme all survive a full page refresh exactly as they were left. Guard every localStorage access so a production build never crashes if storage is unavailable.
State contracts (behavioral, not storage keys):
- Adding a root or child task increases the tree and shows the new node immediately with its status, priority, and dueDate; a blank or over-120-character title or an out-of-enum status or priority is rejected with a visible inline error naming the field and adds nothing
- Editing a task updates title, status, priority, and dueDate on the node row and in both Grove export previews without a reload
- Toggling a leaf's completion recomputes every ancestor's completion and progress ring live and keeps leaf status synchronized with completed; a parent cannot be completed manually while an incomplete descendant remains
- Collapsing or expanding a node updates visibility immediately and that state persists across refresh
- Zooming into a node updates the visible tree and breadcrumb without a page reload; zooming back out via any breadcrumb segment returns to exactly that level
- Attaching or detaching a tag updates the node's chips everywhere they render, respects the 5-tag-per-node cap, and a tag's color stays consistent everywhere it is shown
- Toggling a tag filter chip or typing a search query recomputes the visible tree from the same underlying task collection; it never creates a second disconnected copy of the data
- Move Up, Move Down, and Move To reorder or reparent within the same shared collection; a re-parented node keeps its own children, tags, status, priority, and dueDate
- Archiving a fully-complete branch removes it from the main tree and adds it to the Archive panel; restoring it returns it to the main tree as a new top-level root with its structure and tags intact
- Theme changes apply instantly to every surface without a page reload
- Grove JSON and Grove CSV previews recompute live from the store; Download and Copy reflect the active tab; Import of a valid document reconstructs the same visible state (round-trip); an export that omits session mutations is invalid
- WebMCP tool handlers invoke the same store commands as the visible controls, so contract-driven and UI-driven changes are indistinguishable in the rendered app
The useful end state is the portable Grove package: Export grove must produce Grove JSON and Grove CSV that contain the session's actual tasks, tags, archive, and theme under the field contracts above, Import must restore that visible state, and the store remains MCP-queryable through the artifact-transfer and entity bindings.
Build tooling: Vite with the Svelte 5 and Tailwind CSS plugins.
Seed nothing on load: every check starts from an empty tree, an empty tag list, and an empty archive, and creates its own data through the UI.
Zero outbound navigation; no backend, no authentication, and no routes other than the single view at /.
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

Bindings:
- Entity: task
- Entity operations: create; select; update; delete; toggle
- Entity fields: title; parentId; completed; collapsed; tags
- Browsable entity: task branch
- Destinations: root; node
- Filters: tag
- Themes: light; dark; forest

Mechanics exclusions:
- Chevron rotate/collapse animation stays Playwright-observed
- Progress ring fill animation stays Playwright-observed
- Search dimming/highlight treatment stays Playwright-observed
- Move Up/Down sibling reorder stays Playwright-only (not exposed as a tool)

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
