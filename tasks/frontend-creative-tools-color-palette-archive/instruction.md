<summary>
Build a fine-art color palette archive using Qwik, Qwik stores, Tailwind CSS 4.3.2, and DaisyUI.
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
- The app opens directly into the library — an editorial intro (eyebrow, headline, and a two-column note explaining that each color is paired with its nearest historical name) above a browsable palette section; no login, cart checkout, or multi-page routing
- Sticky chrome: script / O&A lockup, a centered MENU, and a CART; the cart control may open empty drawer chrome but never checks out or navigates away
- Primary collection — saved palettes: seed at least 6 user-manageable palettes, each with a name, an art-historical period tag, and an ordered set of hex swatches; the collection supports create, edit, and delete
- Browse mode offers three library layouts — Nomenclature (default), Palette, and Swatch — switched by a view toggle whose active option shows a filled circular indicator while the other options show an outline-only circle; switching views updates the canvas without a full reload
- Nomenclature view lists one row per unique swatch color (deduplicated by hex) ordered by hue with low-saturation / near-black colors bucketed to the end; each row is a four-column index showing the swatch chip, the hex value, its nearest historical color name plus a short note, and the source palette's title and artist
- Palette view renders each palette as a card of its swatches (each swatch revealing its hex label) with the palette's title and artist; Swatch view renders every swatch as an individual tile whose hex and color-name labels auto-contrast (dark text on light swatches, light text on dark) for legibility
- Each swatch's historical color name is derived by matching its hex to the nearest entry in a bundled color-name dataset; names and notes populate the Nomenclature and Swatch views after the data loads
- Detail/Editor mode opens a selected palette in a focused panel to edit its name, period, and swatches
- The palette create and edit form validates per field before submit: an empty name or fewer than 3 swatches shows an inline message naming the offending field, and the save control stays disabled until every field is valid
- Period filter: choosing a period hides items whose period tag differs across all three views; the default "all periods" choice shows everything
- Clicking any swatch (in any view) copies its hex to the clipboard and shows a brief on-swatch copied confirmation that clears after ~1s
- A favorite / featured flag can be toggled on a palette and its state is preserved in memory across view and mode switches
- Optional subscribe popup appears after roughly 45s idle or after scrolling past ~50% of the page; closing or submitting it dismisses it in memory (no real network subscribe) and it stays dismissed for the session; submitting it with an invalid email shows an inline message naming the email field instead of dismissing
- Inert chrome (logo, menu, cart, painting/source titles, footer links) is interactive in appearance but never navigates away
</core_features>

<user_flows>
- Creating a valid palette from the editor increases the visible palette count by exactly one, the new palette appears as a card in Palette view, and its swatches join the Nomenclature index (deduplicated by hex) and appear as tiles in Swatch view without a reload
- Editing a palette's name and period in Detail/Editor mode updates that same record everywhere it appears: its Palette-view card, the source title column of its Nomenclature rows, and its membership in the current period filter's results, all without a reload
- Deleting a palette removes its card from Palette view, drops its unique swatches from the Nomenclature index and Swatch view, clears any selection pointing at it, and decreases the visible palette count by exactly one
- Choosing a period in the filter hides non-matching items across all three layouts at once; returning to the all-periods choice restores the full collection identically in each layout
- Toggling a palette's favorite flag in one view shows the same flag state after switching to another layout and after opening and closing Detail/Editor mode
- A page reload returns the app to its seeded state: the seeded palettes, the Nomenclature layout active, the all-periods filter, and no palette selected
</user_flows>

<edge_cases>
- Invalid create (empty palette name, or fewer than the required minimum of at least 3 swatches) does not add a palette — the palette count is unchanged — and shows visible validation feedback naming the problem
- After deleting all user palettes, the library region shows a clear empty state with a way to start a new palette
- A period filter that matches nothing shows an empty state in the library region; choosing all periods again restores the full collection
- Clicking several swatches in quick succession shows each copied confirmation on the swatch that was clicked, and every confirmation clears on its own after ~1s with no stuck labels
- Dismissing the subscribe popup keeps it dismissed for the rest of the session; further idle time or scrolling does not bring it back
</edge_cases>

<visual_design>
- Cream editorial field with near-black foreground; hairline rules on nomenclature rows — not a dashboard or promo-card grid
- Sticky header with script lockup, centered MENU, and CART
- Expressive type pairing for titles, mono for hex meta, italic for historical color names
- Nomenclature rows read as a four-column index (swatch chip · hex · historical name with note · source title and artist) separated by hairline rules
- Swatch tiles fill edge-to-edge with the color; their hex and name labels flip between dark and light ink so they stay legible on any swatch
- Library controls row: view toggles with circular fill indicators; period filter on the right
- Detail/Editor mode uses a focused panel for the selected palette; empty collection state is clear
- One icon set is used consistently across chrome and controls; no mixed icon styles
- Multi-column inert footer behind main content
</visual_design>

<motion>
- Smooth scroll and scroll-triggered reveals may pace the editorial page; pause smooth-scroll while overlays that need native scroll locking are open
- Hover animations (required): nomenclature swatches outline on hover; palette-card swatches outline and fade in hex labels; swatch tiles fade in overlays; view-toggle inactive options show brief indicator fill on hover; palette list rows in Detail mode take a hover wash
- Creating a palette animates its card into the Palette view and deleting one animates it out rather than snapping; adding or removing a swatch inside the editor animates the swatch row to its new arrangement
- Toggling the favorite flag animates the flag's state change rather than swapping instantly
- Copy feedback: short on-swatch copied confirmation then clear
- Mode switch between Browse layouts and Detail/Editor updates without full reload
- Subscribe popup: overlay fades in after idle/deep scroll; dismiss fades it out
- With prefers-reduced-motion set, scroll reveals and list animations are removed and state changes apply instantly while every feature stays reachable
</motion>

<responsiveness>
- At 375 pixel width no content clips or overflows the viewport and no horizontal scrolling appears
- Below 768 pixels the nomenclature index reflows so each entry keeps its swatch chip, hex, historical name with note, and source legible without truncating mid-word; at desktop widths the four-column index layout holds
- Palette cards and swatch tiles reduce their column count at narrower widths so tiles stay legible; the sticky header and library controls remain usable at every width
- The Detail/Editor panel fits within a 375 pixel wide viewport with all fields and controls reachable without horizontal scrolling
</responsiveness>

<accessibility>
- Every interactive control — view toggles, period filter, swatches, favorite flags, editor fields, popup controls — is reachable and operable with the keyboard alone, with a visible focus indicator
- The Detail/Editor panel and the subscribe popup use dialog semantics: focus moves into them on open, stays trapped while open, and returns to the invoking control on close
- Copying a swatch's hex announces the confirmation through an aria-live polite region in addition to the on-swatch label
- Auto-contrast swatch labels keep legible contrast against every swatch color, including very light and very dark swatches
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load with all seeded palettes visible
- No console errors or warnings appear during a full exercise of the app (switching layouts, creating, editing, deleting, filtering, favoriting, copying)
- Switching among the three layouts, filtering, and opening the editor stay smooth with no hangs or dropped interactions
</performance>

<writing>
- The editorial intro (eyebrow, headline, two-column note) reads as finished prose explaining the historical-name pairing; no placeholder text appears anywhere in the shipped UI
- Historical color names and their short notes read as plausible art-historical references, each note a complete phrase rather than a fragment or lorem text
- Headings, buttons, and labels use one consistent capitalization convention; validation messages name the field and the fix
</writing>

<requirements>
Shared application state must use Qwik stores, the state library named in summary (in-memory only): palettes collection, active view, period filter, selection/detail, favorite flags, copy feedback, and popup dismiss. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a valid palette increases the collection and shows it in Browse layouts
- Editing a palette updates that same record (name, period, swatches) everywhere it appears
- Deleting a palette removes it from lists, selection, and filters
- Period filter and view mode recompute visible items from the shared collection; they never create a second disconnected copy
- WebMCP tool handlers invoke the same store commands as the visible controls
Stack: Qwik + Qwik stores + Tailwind CSS 4.3.2 (pinned) + DaisyUI; frontend-only, no backend or authentication. DaisyUI provides the chrome components (drawer, modal/panel, selects, toggles, badges); Tailwind CSS 4.3.2 owns layout, spacing, and custom surfaces with design tokens defined in the theme layer.
- AutoAnimate, Lenis, and GSAP ScrollTrigger are allowed for animation; no other animation libraries
- Iconify icons only, delivered through the @iconify/tailwind4 plugin; no raw pasted SVG icon sets
- All forms (palette create/edit and the subscribe popup) are driven by Modular Forms with a Valibot schema: the schema defines the validation rules and the form shows inline per-field errors before submit
- All libraries are installed via npm and bundled locally; no CDN imports of any library, font, or icon set
- No other UI, animation, or icon libraries beyond those named above
- Seed at least 6 user-manageable palettes so first load is non-empty; bundle a color-name dataset so nearest-historical-name derivation runs without any network request
- Nomenclature ordering must be deterministic: deduplicate swatches by hex and sort by hue with low-saturation / near-black colors bucketed to the end
- Empty required fields on create (missing name, or fewer than 3 swatches) must not increase the palettes count; show visible validation feedback
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
- Destinations: archive-grid; palette-detail; filters
- Filters: era; artist
- Entity: palette
- Entity operations: create; select; update; delete; toggle
- Entity fields: name; swatches; favorite

Mechanics exclusions:
- None

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
