<summary>
Build a fine-art color palette library using Vue 3, Pinia, Tailwind CSS 4.3.2, and Ark UI.
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
Core features:
- The app opens directly onto the O&A Palette Library — editorial intro plus a browsable palette section — with no login, cart checkout, or multi-page routing
- The sticky header carries the O&A script lockup ("THE O&A PALETTE LIBRARY"), a centered MENU control, and a right CART control; opening the cart drawer shows empty-cart chrome but never checks out, and header/menu/cart/footer/painting-title controls never navigate away
- The intro presents a serif lead about browsing color across paintings and centuries over a two-column monospace body that names historical color sources (Werner's Nomenclature of Colours, Winsor & Newton, Cennini) and the ongoing/open dataset framing
- A controls row places the three view toggles on the left (Nomenclature default, Palette, Swatch — each with a circular indicator that fills on the active view) and a "Filter by Period" select on the right offering All Periods plus named art-historical periods (e.g. Baroque to Neoclassical, Expressionism, Fauvism, Old Masters, Post-Impressionism, Realism, Romanticism, Symbolism, Tonalism)
- Nomenclature view (default) renders rows with a swatch, hex, an italic historical color name, notes, and a painting-title control; rows are ordered by hue and deduped by hex so no two rows repeat a hex
- Palette view renders a responsive card grid where each card shows a set of swatches (about five) plus painting meta; Swatch view renders large color tiles whose hex/name/title text flips dark or light by the tile's perceived luminance and reveals on hover
- Primary collection is user-manageable palettes: seed at least 6 (alongside any historical dataset) so first load is non-empty; each has a name, a period tag, and a set of hex swatches, and the list supports create, edit, and delete
- Two interaction modes: Browse mode (Nomenclature / Palette / Swatch views with the period filter) and Detail/Editor mode (open a palette to edit its name, period, and swatches)
- Selecting a period hides items whose period tag does not match across all three views; All Periods restores the full set; switching views shows exactly one library layout at a time
- Clicking a swatch (not a painting title) copies its hex to the clipboard and shows a brief on-swatch "copied" confirmation (~1s) that then clears; a favorite/featured flag can be toggled on a palette
- The palette create and edit forms validate as the user types: an invalid field shows an inline error message next to that field naming what to fix before submit, and the submit control stays disabled while any required field is invalid
- A subscribe popup stays hidden on first paint and appears after ~45s idle or once scrolled past ~50%; its email field shows an inline error naming the email field when the value is not a valid address, and closing or submitting dismisses it in memory with no real network subscribe
</core_features>

<user_flows>
- Create: submitting a valid new palette from the editor increases the palette collection count by exactly one, the new palette appears as a card in Palette view and its swatches join the Nomenclature rows (hue-ordered, hex-deduped) without a reload, and selecting the new palette's period in the filter keeps it visible while All Periods shows it alongside the seeds
- Edit: renaming a palette and changing its period in Detail/Editor updates that palette's name on its Palette-view card and in Detail without a reload, and the period change is reflected by the filter — the old period no longer shows the palette and the new period does
- Delete: deleting a palette decreases the collection count by exactly one, removes its card from Palette view and its swatches from the Nomenclature and Swatch views, clears it from any active selection, and the period filter recomputes so the deleted palette matches nothing
- Favorite: toggling the favorite/featured flag on a palette in one view shows the same flag state when the same palette is viewed in another view or opened in Detail, without a reload
- A page reload returns the app to its seeded state: the seeded palettes, the Nomenclature view as default, All Periods, and no selection
</user_flows>

<edge_cases>
- Invalid create: an empty palette name or fewer than the required swatches shows visible validation feedback naming the offending field and adds no palette; the collection count is unchanged
- Double-activating the editor's submit control creates exactly one palette: the count increases by one and one new card appears
- An empty state appears in the library region when the period filter matches nothing or all user palettes are deleted, with a message explaining that no palettes match and how to get back (clear the filter or create a palette)
- Clicking a painting-title control never triggers the copy confirmation; only swatch clicks copy a hex
- Dismissing the subscribe popup keeps it dismissed for the rest of the session; it does not reappear on further idle or scrolling
</edge_cases>

<visual_design>
- Cream editorial field with near-black foreground; hairline rules on nomenclature rows — not a dashboard or promo-card grid
- Sticky header with script lockup, centered MENU, and CART
- Expressive type pairing for titles, mono for hex meta, italic for historical color names
- Library controls row: view toggles with circular fill indicators; period filter on the right
- Detail/Editor mode uses a focused panel for the selected palette; empty collection state is clear
- Inline validation errors render in a distinct error color next to the field they name
- Multi-column inert footer behind main content
</visual_design>

<motion>
- Smooth scroll and scroll-triggered reveals may pace the editorial page; pause smooth-scroll while overlays that need native scroll locking are open
- Hover animations (required): nomenclature swatches outline on hover; palette-card swatches outline and fade in hex labels; swatch tiles fade in overlays; view-toggle inactive options show brief indicator fill on hover; palette list rows in Detail mode take a hover wash
- Creating a palette animates its card into the grid; deleting a palette animates its card out rather than snapping the layout
- Copy feedback: short on-swatch copied confirmation appears with a brief transition then clears
- Mode switch between Browse layouts and Detail/Editor updates without full reload
- Subscribe popup: overlay fades in after idle/deep scroll; dismiss fades it out
- With prefers-reduced-motion set, reveals and card animations are removed and state changes apply instantly while every feature remains reachable
</motion>

<responsiveness>
- The Palette-view card grid reflows across widths: multiple columns at desktop widths narrowing to a single column at phone widths with no clipped cards
- At 375 pixel width no content clips or overflows the viewport and no horizontal scrolling appears; the two-column monospace intro collapses to a single column
- At narrow widths the controls row stacks or wraps so the view toggles and the period filter both remain fully visible and operable
</responsiveness>

<accessibility>
- Every interactive control — view toggles, period filter, swatches, painting titles, editor fields, header controls — is reachable and operable with the keyboard alone, with a visible focus indicator
- The cart drawer, subscribe popup, and Detail/Editor overlay behave as dialogs: focus moves into them when opened, stays trapped while open, and returns to the invoking control on close
- The period filter is operable with the keyboard: it opens, moves through period options, and applies a selection without a pointer
- Each swatch control carries an accessible name that includes its hex value; the copied confirmation and form validation errors are announced through an aria-live region as well as shown visually
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear during a full exercise of the app: browsing all three views, filtering, creating, editing, deleting, copying, and dismissing the popup
- Rapid repeated view switching and filter changes stay responsive with no hangs, dropped interactions, or layout breakage
</performance>

<writing>
- Headings, controls, and labels use one consistent capitalization convention throughout the app
- The editorial intro, historical color names, and notes read as finished copy; no placeholder or lorem text appears anywhere in the shipped UI
- Validation errors name the field and the fix; empty states explain what belongs there and how to restore content
</writing>

<requirements>
Shared application state must use the stack state library named in summary (in-memory only): palettes collection, active view, period filter, selection/detail, copy feedback, and popup dismiss. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- All views derive from one shared store; a change made in one view echoes in every other view without a reload, and no view keeps a second disconnected copy of the collection
- Creating a valid palette increases the collection and shows it in Browse layouts
- Editing a palette updates that same record (name, period, swatches) everywhere it appears
- Deleting a palette removes it from lists, selection, and filters
- Period filter and view mode recompute visible items from the shared collection; nomenclature ordering (hue sort + hex dedupe) derives from the shared collection
- Copy feedback and subscribe-popup dismissal are ephemeral in-memory state; the popup stays hidden on first paint and appears only after idle (~45s) or deep scroll (~50%)
- A page reload returns the app to its seeded state
Stack: Vue 3 with Pinia, built with Vite or an equivalent SPA setup. Styling is Tailwind CSS 4.3.2 (pinned), with design tokens in @theme. Ark UI for Vue components provide the menu, cart drawer, period select, palette editor, subscribe dialog, and toasts; no other external component library. @vueuse/motion is allowed for animation; no other animation libraries. Iconify via @iconify/tailwind4 only; no raw pasted SVG icon sets and no icon CDNs. All forms, including palette create and edit and the subscribe form, validate through a Zod schema driven by VeeValidate and render inline per-field errors before submit. A nearest-name color helper is allowed. All libraries are installed via npm and bundled locally; no CDN imports.
- Seed at least 6 user-manageable palettes plus any historical dataset so first load is non-empty
- Empty required fields on create must not increase the palettes count; show visible validation feedback
- After deleting all user palettes (or filtering to zero matches), show an empty state in the library region
- Zero navigational outbound links for app chrome; no cart checkout or real subscribe
- Document title includes Palette Library; brand reads as Object and Archive / o+a
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

Bindings:
- Browsable entity: palettes
- Destinations: library-grid; palette-detail; search
- Filters: artist; era
- Entity: palette
- Entity operations: create; select; update; delete; toggle
- Entity fields: name; swatches; favorite

Mechanics exclusions:
- Scroll reveal / hover wash timing stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
