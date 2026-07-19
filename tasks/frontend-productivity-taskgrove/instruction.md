<summary>
Build TaskGrove, a hierarchical task-tree planner, using Svelte 5 components in runes mode, shared state runes ($state/$derived), and Tailwind CSS.
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
- On first load with no data, a New root task input and button sit in the footer and the tree area shows an empty-state message inviting the user to add the first root task
- Submitting New root task with a non-blank title adds a new top-level task shown as the root of its own tree; submitting a blank title is rejected and shows a visible inline error or shake hint next to the input, and no blank-titled root is added
- Every task node shows an Add Child control; submitting it with a non-blank title nests a new child one level beneath that node, indented further than its parent; children can be added to any depth (root, child, grandchild, and beyond) and a blank child title is rejected the same way as a blank root title
- Any node with at least one child shows an expand/collapse chevron; clicking it hides that node's entire subtree from view, and clicking it again reveals the subtree; the collapsed or expanded state of every node survives a full page refresh
- Leaf tasks (no children) show a manual completion checkbox; a parent task's completion is computed automatically as complete only once 100 percent of its descendant leaf tasks are complete, updates live as leaves are toggled, and cannot be manually toggled while it still has an incomplete descendant
- Every node with at least one child renders a small radial progress ring showing the percentage of its descendant leaf tasks that are complete; the ring's fill visibly increases as leaves are toggled complete and reaches a distinct complete visual treatment (a checkmark) only at 100 percent
- Each node shows a Zoom In control; clicking it makes that node the temporary root of the whole view, hiding everything outside its branch, and shows a breadcrumb trail above the tree with every ancestor down to the true root; clicking any breadcrumb segment zooms back out to exactly that level, and clicking the trailing unzoom control returns to the true root
- Each node can carry up to 5 tags chosen from a reusable, user-managed tag list opened from a Tag manager control in the toolbar; creating a tag there gives it a name and a distinct color; attaching a tag to a node shows a colored tag chip on that node's row; attempting to attach a 6th tag to the same node is blocked and the node keeps exactly 5 chips
- The toolbar shows a row of toggleable tag filter chips, one per existing tag; toggling a chip on narrows the visible tree to only branches containing at least one matching node, auto-expanding the ancestors of every match; toggling it off restores the full tree; if no branch matches the active filters, the tree area shows an explicit no-results message instead of a blank area
- A Smart Search input in the toolbar highlights the matching text inside any node whose title matches the query, auto-expands that node's ancestor chain so the match stays visible, and visibly dims (never removes from the page) branches with no match; clearing the query returns every branch to full, non-dimmed visibility; a query matching nothing shows an explicit no-results message
- Each node shows Move Up and Move Down controls that swap it with its previous or next sibling respectively; the new order is reflected immediately and remains stable across re-renders
- Each node shows a Move To control that opens a picker listing every other node in the tree (plus a root-level option); choosing a target moves the current node, together with its whole subtree, to become a child of the picked node (or to the top level), and it is removed from its prior location
- A node whose branch is not fully complete does not show an Archive control; once every descendant leaf in a node's branch (a node that has at least one child) is complete, an Archive control appears; using it moves that whole branch out of the main tree into a separate Archive panel. The Archive panel lists every archived branch by its root title with its own Restore control; using Restore returns that branch to the main tree as a new top-level root task, with its original structure and tags intact. Before anything is archived, the Archive panel shows a short explanatory message instead of a blank area
- Each node shows an Export as Text control; using it downloads that node's branch as an indented plain-text (.txt) outline, one line per node, each child indented one level deeper than its parent
- A Theme control in the toolbar cycles between Light, Dark, and Forest named themes; each click swaps the app's full color palette instantly with no page reload, and the app stays fully readable in every theme
- Every action that changes durable state (adding a task or child, archiving a branch, restoring a branch, moving a task via Move To) shows a transient confirmation (a toast) that clears on its own a few seconds later
- The full state of the app — every task and its position in the tree, every node's tags, every node's collapsed or expanded state, the Archive panel's contents, and the chosen theme — survives a full page refresh exactly as it was left
</core_features>

<visual_design>
- The app opens into a header (app name and one-line description), a toolbar (search, tag filter chips, Tag manager toggle, Theme control), an optional Tag manager panel, an optional breadcrumb bar when zoomed, a main area with the task tree on the left and the Archive panel on the right (stacked below the tree on narrow viewports), and a footer with the New root task input
- Typography: the app name heading uses the ui-sans-serif and system-ui fallback stack at 96px; secondary headings (Archive, Tag manager, Move dialog titles) use the same heading stack at 48px; ordinary body text, including every task title, uses the Arial fallback stack at 10px
- Color tokens as CSS custom properties in the Light theme: --color-primary #00BC7D (accent, used on primary buttons, the progress ring, active tag-filter emphasis, and focus outlines), --color-secondary #62748E (muted supporting tone, used on the app subtitle), --color-accent #00BC7D, --color-background #FFFFFF (page and panel canvas), --color-text-primary #0F172B (ink), --color-link #0F172B. Dark and Forest themes swap every one of these to their own consistent, readable palette while keeping the same recognizable green accent hue
- Shape system: an 8px base spacing unit governs gaps and padding throughout; panels, cards, and task rows render with 0px border radius (sharp corners); the primary button treatment (background #00BC7D, white text, 16px border radius, a soft elevated shadow) is used on New Root Task, Add Child, and Export as Text; the secondary button treatment (white background, #0F172B text, a visible #E2E8F0 border, 16px border radius, no shadow) is used on Move Up, Move Down, Move To, and Archive
- Tag chips render as small filled pill shapes; each tag's exact color renders identically wherever it appears: on a node's row, in the toolbar's tag filter row, and in the Tag manager
- Deeper tree levels are visibly indented beneath their parent, with a chevron slot reserved even for leaf rows so title columns stay aligned
- At approximately 375px wide, the app renders with no horizontal scrolling anywhere; deeply nested rows truncate or wrap their title text rather than forcing the page wider, and the app-name heading scales down rather than overflowing the viewport
</visual_design>

<motion>
- Node rows, the expand and collapse chevron, tag chips, and every button show a visible hover state (a background wash, border color shift, or slight elevation); keyboard Tab focus is visible on every interactive control with a treatment distinguishable from hover
- The progress ring's fill animates smoothly as its underlying percentage changes rather than jumping instantly
- The expand and collapse chevron rotates as its node toggles between expanded and collapsed
- Search highlighting and branch dimming apply immediately as the query changes; dimmed branches use a reduced-opacity treatment rather than disappearing
- Submitting a blank title (root or child) triggers a brief shake on the input alongside its inline error text
- Toasts enter with a short slide-and-fade and then clear on their own after a few seconds
- Switching themes recolors every surface, border, and accent instantly with a brief color transition, without a page reload
</motion>

<requirements>
Use Svelte 5 components in runes mode with shared $state and $derived runes for all application state: the task tree, the reusable tag list, the archive, the active theme, the zoom target, search query, active tag filters, and toast queue. Style with Tailwind CSS via the pre-installed Vite plugin.
Persistence is a required part of this application, not an incidental detail: use localStorage (or an equivalent client persistence mechanism for this stack) so that the full tree, every node's tags, every node's collapsed or expanded state, the Archive panel's contents, and the chosen theme all survive a full page refresh exactly as they were left. Guard every localStorage access so a production build never crashes if storage is unavailable.
State contracts (behavioral, not storage keys):
- Adding a root or child task increases the tree and shows the new node immediately; a blank title is rejected with a visible inline error and adds nothing
- Toggling a leaf's completion recomputes every ancestor's completion and progress ring live; a parent cannot be completed manually while an incomplete descendant remains
- Collapsing or expanding a node updates visibility immediately and that state persists across refresh
- Zooming into a node updates the visible tree and breadcrumb without a page reload; zooming back out via any breadcrumb segment returns to exactly that level
- Attaching or detaching a tag updates the node's chips everywhere they render, respects the 5-tag-per-node cap, and a tag's color stays consistent everywhere it is shown
- Toggling a tag filter chip or typing a search query recomputes the visible tree from the same underlying task collection; it never creates a second disconnected copy of the data
- Move Up, Move Down, and Move To reorder or reparent within the same shared collection; a re-parented node keeps its own children and tags
- Archiving a fully-complete branch removes it from the main tree and adds it to the Archive panel; restoring it returns it to the main tree as a new top-level root with its structure and tags intact
- Theme changes apply instantly to every surface without a page reload
Build tooling: Vite, matching the pre-installed dependency set (Svelte 5, @sveltejs/vite-plugin-svelte, @tailwindcss/vite, Tailwind CSS 4). No component libraries; hand-rolled styling and markup for the stack is expected.
Seed nothing on load: every check starts from an empty tree, an empty tag list, and an empty archive, and creates its own data through the UI.
Zero outbound navigation; no backend, no authentication, and no routes other than the single view at /.
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
