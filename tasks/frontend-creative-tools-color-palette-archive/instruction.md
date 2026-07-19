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

Feature: Site chrome and library entry —
- The app opens directly into the library — an editorial intro (eyebrow, headline, and a two-column note explaining that each color is paired with its nearest historical name) above a browsable palette section; no login, cart checkout, or multi-page routing
- Sticky chrome: script / O&A lockup, a centered MENU, and a CART; the cart control may open empty drawer chrome but never checks out or navigates away
- Inert chrome (logo, menu, cart, painting/source titles, footer links) is interactive in appearance but never navigates away

Feature: Primary collection —
- Primary collection — saved palettes: seed at least 6 user-manageable palettes, each with a name, an artist, an art-historical period tag from the closed period list below, an ordered set of hex swatches, and a favorite flag; the collection supports create, edit, delete, and duplicate
- A favorite / featured flag can be toggled on a palette and its state is preserved in memory across view and mode switches
- Duplicating a selected palette increases the visible count by exactly one and inserts a card whose name is the original name plus the suffix (copy), with the same period and swatch order

Feature: Browse layouts —
- Browse mode offers three library layouts — Nomenclature (default), Palette, and Swatch — switched by a view toggle whose active option shows a filled circular indicator while the other options show an outline-only circle; switching views updates the canvas without a full reload
- Nomenclature view lists one row per unique swatch color (deduplicated by hex) ordered by hue with low-saturation / near-black colors bucketed to the end; each row is a four-column index showing the swatch chip, the hex value, its nearest historical color name plus a short note, and the source palette's title and artist
- Palette view renders each palette as a card of its swatches (each swatch revealing its hex label) with the palette's title and artist; Swatch view renders every swatch as an individual tile whose hex and color-name labels auto-contrast (dark text on light swatches, light text on dark) for legibility
- Each swatch's historical color name is derived by matching its hex to the nearest entry in a bundled color-name dataset; names and notes populate the Nomenclature and Swatch views after the data loads
- Clicking any swatch (in any view) copies its hex to the clipboard and shows a brief on-swatch copied confirmation that clears after about 1 second

Feature: Filters, sort, and vision simulation —
- Period filter: choosing a period hides items whose period tag differs across all three views; the default all-periods choice shows everything
- Name sort control offers Name A–Z (default) and Name Z–A; switching from A–Z to Z–A reverses the visible Palette-view card order relative to the other choice; switching back restores the previous order
- Vision-simulation control offers at least None (default) and Deuteranopia; choosing Deuteranopia visibly alters swatch appearance on the library canvas relative to None; choosing None restores the unfiltered appearance

Feature: Detail/Editor and palette field contract —
- Detail/Editor mode opens a selected palette in a focused panel to edit its name, artist, period, and swatches, and shows a WCAG contrast matrix for that palette
- The palette create and edit form submits a record shaped as the would-be palette API request body. All keys and nesting below are REQUIRED unless marked optional. Example values are illustrative only. Valid creates, edits, exports, and imports MUST conform exactly:
  - name: required non-empty string, at most 80 characters
  - artist: required non-empty string, at most 80 characters
  - period: required; exactly one of Abstract + Geometric, Americana, Baroque to Neoclassical, Expressionism, Fauvism, Impressionism, Medieval, Modern, Old Masters, Post-Impressionism, Primitive + Folk, Realism, Romanticism, Symbolism, Tonalism
  - swatches: required ordered array of 3 to 12 inclusive hex color strings; each string is a six-digit hexadecimal color with a leading number-sign (number-sign followed by six hex digits); short three-digit hex, missing number-sign, and non-hex characters are invalid
  - favorite: optional boolean defaulting to false
- The form validates per field before submit: an empty name, empty artist, a period outside the closed list, fewer than 3 or more than 12 swatches, or a swatch that is not a six-digit hex with a leading number-sign shows an inline message naming the offending field, and the save control stays disabled until every field is valid
- The record a successful create produces IS the object that appears for that palette in the archive JSON export — same field names, same bounds, same period enum, same swatch hex format

Feature: Contrast matrix —
- Opening Detail/Editor for a palette with at least 3 swatches shows a WCAG contrast matrix listing unique unordered swatch pairs with contrast ratios and AA (4.5:1) / AAA (7:1) pass/fail marks that include a text label such as Pass or Fail alongside any color cue
- Recoloring a swatch in Detail/Editor changes at least one listed contrast ratio or pass/fail mark without a reload
- A palette with fewer than 2 distinct swatch hexes shows an empty or explanatory contrast-matrix state instead of fabricated contrast ratios

Feature: Multi-select and batch actions —
- Palette-view cards support multi-select; when at least one card is selected, a compact selection tray appears with Batch favorite and Batch delete
- Selecting three Palette-view cards and activating Batch favorite toggles the favorite flag on all three at once; the same three flags remain after switching layouts
- Selecting two palettes and confirming Batch delete decreases the visible palette count by exactly two and removes both cards from Palette view
- With zero palettes selected, Batch delete does nothing and shows no confirmation; the selection tray stays hidden until at least one card is selected

Feature: Undo and redo —
- Undo and Redo controls step backward and forward through mutating actions (create, edit, delete, duplicate, favorite toggle, batch favorite, batch delete, and import)
- After deleting a palette via the UI, Undo restores that palette's card, swatches, and the prior visible count
- After Undo restores a deleted palette, Redo deletes it again; after a new create following an undo, Redo is disabled and cannot resurrect the cleared redo stack
- Undo and Redo show a visibly disabled appearance when no step is available

Feature: Export drawer (the archive artifacts the user came for) —
- The app produces the user's palette archive files: an Export control opens a drawer with four format tabs — CSS vars, utility-theme snippet, SCSS map, and archive JSON — each showing a monospaced live preview compiled from the current store
- CSS vars preview emits custom-property declarations whose hex values reflect every palette currently in the collection
- Utility-theme snippet preview emits a Tailwind-config-style theme fragment whose color tokens mirror the same hex values
- SCSS map preview emits an SCSS map whose color entries mirror the same hex values
- Archive JSON preview is API-shaped. All keys and nesting below are REQUIRED. Example values are illustrative only:
  - version: required string, exactly palette-archive.v1
  - palettes: required array (may be empty); each entry requires id (non-empty string), name, artist, period (closed list above), swatches (ordered array of 3 to 12 six-digit hex strings with a leading number-sign), and favorite (boolean)
- After creating a valid palette with a distinctive hex not in the seed set, that hex appears in the CSS / utility-theme / SCSS export previews and the new palette's id, name, artist, period, swatches, and favorite flag appear in the archive JSON preview before any download or copy
- After deleting a palette, that palette's name is absent from the archive JSON export preview and its unique hexes are absent from the CSS preview when no other palette still uses them
- Export Copy writes the visible preview text to the clipboard with a brief copied confirmation; Download starts a file download of that same preview text
- An export that omits the session's actual create, edit, delete, duplicate, favorite, or batch mutations is incomplete

Feature: Import round-trip —
- Import accepts archive JSON (file picker or paste) in the same schema as the archive JSON export (version exactly palette-archive.v1 plus palettes with id, name, artist, period, swatches, favorite)
- Importing a valid archive JSON replaces the library so visible palette names, artists, periods, swatches, and favorite flags match the imported payload, and the archive JSON export preview matches that imported state
- Importing malformed or schema-violating archive JSON (missing required palette fields, period outside the closed list, invalid hex, or swatch count outside 3–12) shows an inline error naming the import field, leaves the palette count and names unchanged, and does not apply a successful-import state

Feature: Subscribe popup —
- Optional subscribe popup appears after roughly 45s idle or after scrolling past about 50% of the page; closing or submitting it dismisses it in memory (no real network subscribe) and it stays dismissed for the session; submitting it with an invalid email (missing at-sign or domain) shows an inline message naming the email field instead of dismissing
</core_features>

<user_flows>
- Creating a valid palette from the editor increases the visible palette count by exactly one, the new palette appears as a card in Palette view, its swatches join the Nomenclature index (deduplicated by hex) and appear as tiles in Swatch view, and the Export drawer CSS / utility-theme / SCSS / JSON previews include the new palette's hexes and metadata — without a reload
- Editing a palette's name, artist, and period in Detail/Editor mode updates that same record everywhere it appears: its Palette-view card, the source title and artist columns of its Nomenclature rows, its membership in the current period filter's results, and the archive JSON export preview, all without a reload
- Deleting a palette removes its card from Palette view, drops its unique swatches from the Nomenclature index and Swatch view, clears any selection pointing at it, decreases the visible palette count by exactly one, and removes it from the archive JSON export preview
- Choosing a period in the filter hides non-matching items across all three layouts at once; returning to the all-periods choice restores the full collection identically in each layout
- Switching Name sort from A–Z to Z–A reverses Palette-view card order; switching back restores the previous order
- Toggling a palette's favorite flag in one view shows the same flag state after switching to another layout and after opening and closing Detail/Editor mode
- Duplicate flow: duplicating a palette adds a (copy)-suffixed card and that copy's metadata is present in the archive JSON export preview
- Batch favorite then Undo: selecting three palettes, running Batch favorite so all three flags toggle, switching layouts and confirming flags persist, then Undo — all three flags return to their prior values and the export preview favorite fields match
- Batch delete then Undo: selecting two palettes, confirming Batch delete (count decreases by exactly two), then Undo — both palettes and the prior count are restored and both reappear in the archive JSON export
- Contrast matrix and vision flow: open Detail/Editor and confirm the contrast matrix lists pair ratios; recolor one swatch and confirm at least one ratio or pass mark changes; close editor, set vision simulation to Deuteranopia and confirm swatches visibly shift versus None
- Export/import round-trip: after mutating the collection (create or edit at least one palette), Copy or Download the archive JSON, then Import that same JSON text — visible names, artists, periods, swatches, and favorite flags match the pre-export mutated state, and the export preview matches again including version and each palette's id, name, artist, period, swatches, and favorite
- Create echoes API-shaped export fields: create a valid palette with distinctive name, artist, closed-list period, and at least 3 valid hex swatches — Palette-view card shows name and artist, and the archive JSON preview includes that palette's id, name, artist, period, swatches, and favorite without a reload
- A page reload returns the app to its seeded state: the seeded palettes, the Nomenclature layout active, the all-periods filter, Name A–Z sort, empty undo/redo, vision simulation None, and no palette selected
</user_flows>

<edge_cases>
- Invalid create (empty palette name, empty artist, period outside the closed list, fewer than 3 or more than 12 swatches, or a swatch that is not a six-digit hex with a leading number-sign) does not add a palette — the palette count is unchanged — and shows visible validation feedback naming the problem
- After deleting all user palettes, the library region shows a clear empty state with a way to start a new palette; Export drawer previews still compile for an empty collection — archive JSON shows version palette-archive.v1 and an empty palettes array
- A period filter that matches nothing shows an empty state in the library region; choosing all periods again restores the full collection
- Clicking several swatches in quick succession shows each copied confirmation on the swatch that was clicked, and every confirmation clears on its own after about 1 second with no stuck labels
- Dismissing the subscribe popup keeps it dismissed for the rest of the session; further idle time or scrolling does not bring it back
- With zero palettes selected, Batch delete does nothing and shows no confirmation; the selection tray stays hidden until at least one card is selected
- Importing malformed archive JSON shows an inline error naming the import field, leaves the palette count and names unchanged, and does not apply a successful-import state
- Importing archive JSON that is missing required palette fields, uses an invalid period, includes an invalid hex, or has a swatch count outside 3–12 shows an inline error naming the import field and leaves palette count and names unchanged
- After Undo restores a deleted palette, Redo deletes it again; after a new create following an undo, Redo is disabled and cannot resurrect the cleared redo stack
- A palette with fewer than 2 distinct swatch hexes shows an empty or explanatory contrast-matrix state instead of fabricated contrast ratios
</edge_cases>

<visual_design>
- Cream editorial field with near-black foreground; hairline rules on nomenclature rows — not a dashboard or promo-card grid
- Sticky header with script lockup, centered MENU, and CART
- Expressive type pairing for titles, mono for hex meta, italic for historical color names
- Nomenclature rows read as a four-column index (swatch chip · hex · historical name with note · source title and artist) separated by hairline rules
- Swatch tiles fill edge-to-edge with the color; their hex and name labels flip between dark and light ink so they stay legible on any swatch
- Library controls row: view toggles with circular fill indicators; period filter, name sort, vision-simulation, and undo/redo as a coherent controls strip
- Detail/Editor mode uses a focused panel for the selected palette; empty collection state is clear
- Export drawer shows format tabs, a monospaced preview block, and Copy / Download actions as a focused drawer — not a bare unstyled textarea dumped on the page
- When multi-select is active, a compact selection tray appears for Batch favorite / Batch delete; Detail/Editor shows the contrast matrix beneath the swatch editor as a readable table or list
- One icon set is used consistently across chrome and controls; no mixed icon styles
- Multi-column inert footer behind main content
- Document title includes Palette Library; brand reads as Object and Archive / o+a
</visual_design>

<motion>
- Smooth scroll and scroll-triggered reveals may pace the editorial page; pause smooth-scroll while overlays that need native scroll locking are open (subscribe popup, Export drawer, or a modal editor panel)
- Hover animations (required): nomenclature swatches outline on hover; palette-card swatches outline and fade in hex labels; swatch tiles fade in overlays; view-toggle inactive options show brief indicator fill on hover; palette list rows in Detail mode take a hover wash
- Creating a palette animates its card into the Palette view and deleting one animates it out rather than snapping; adding or removing a swatch inside the editor animates the swatch row to its new arrangement
- Toggling the favorite flag animates the flag's state change rather than swapping instantly
- Copy feedback: short on-swatch copied confirmation then clear
- Export drawer enters and exits with a brief opacity/scale transition rather than hard-cutting; Export Copy shows a short copied confirmation with a brief transition before resetting
- When prefers-reduced-motion is not set, changing vision-simulation mode eases the filter across the canvas rather than a hard cut
- Mode switch between Browse layouts and Detail/Editor updates without full reload
- Subscribe popup: overlay fades in after idle/deep scroll; dismiss fades it out
- With prefers-reduced-motion set, scroll reveals and list animations are removed and state changes apply instantly while every feature stays reachable
</motion>

<responsiveness>
- At 375 pixel width no content clips or overflows the viewport and no horizontal scrolling appears
- Below 768 pixels the nomenclature index reflows so each entry keeps its swatch chip, hex, historical name with note, and source legible without truncating mid-word; at desktop widths the four-column index layout holds
- Palette cards and swatch tiles reduce their column count at narrower widths so tiles stay legible; the sticky header and library controls remain usable at every width
- The Detail/Editor panel, contrast matrix, and Export drawer fit within a 375 pixel wide viewport with all fields and controls reachable without horizontal scrolling
- The multi-select tray and undo/redo controls remain reachable at 375 pixel width without permanently covering primary actions
- At 375 pixel width, view toggles, period filter, name sort, vision simulation, undo/redo, favorite flags, editor fields, export controls, and primary chrome controls present tap targets at least 44 pixels in at least one dimension
</responsiveness>

<accessibility>
- Every interactive control — view toggles, period filter, name sort, vision simulation, undo/redo, selection checkboxes, batch actions, swatches, favorite flags, editor fields, export controls, and popup controls — is reachable and operable with the keyboard alone, with a visible focus indicator
- The Detail/Editor panel, Export drawer, batch-delete confirmation, and the subscribe popup use dialog semantics: focus moves into them on open, stays trapped while open, and returns to the invoking control on close
- Copying a swatch's hex and copying export preview text announce the confirmation through an aria-live polite region in addition to the on-swatch or export label
- Every palette create/edit field (name, artist, period, swatches), the subscribe email field, and the archive import field uses an explicit label element associated with the control
- Auto-contrast swatch labels keep legible contrast against every swatch color, including very light and very dark swatches
- Contrast-matrix pass/fail marks include a text label such as Pass or Fail alongside any color cue — not color alone
- With prefers-reduced-motion set, scroll reveals and list animations are removed and state changes apply instantly while every feature (views, filter, sort, editor, export, copy, favorites, vision simulation) stays reachable
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load with all seeded palettes visible
- No console errors or warnings appear during a full exercise of the app (switching layouts, creating, editing, deleting, duplicating, filtering, sorting, favoriting, batch actions, undo/redo, contrast matrix updates, vision simulation, exporting, importing, and copying)
- Switching among the three layouts, filtering, sorting, opening the editor or export drawer, and toggling vision simulation stay smooth with no hangs or dropped interactions
- Contrast-matrix recomputation after a swatch edit completes without freezing the editor controls
</performance>

<writing>
- The editorial intro (eyebrow, headline, two-column note) reads as finished prose explaining the historical-name pairing; no placeholder text appears anywhere in the shipped UI
- Historical color names and their short notes read as plausible art-historical references, each note a complete phrase rather than a fragment or lorem text
- Headings, buttons, and labels use one consistent capitalization convention; action labels use specific verbs such as Batch delete, Copy export, Undo, Duplicate, and Import rather than generic Submit or OK alone when a specific label is possible
- Validation messages for palette create/edit (name, artist, period, swatches), subscribe email, and archive import field-contract failures name the field and the fix
- Contrast-matrix headers and export format tab labels use specific wording (for example Contrast, CSS vars, utility-theme snippet, SCSS map, JSON) rather than generic placeholders
- Hex values across Nomenclature, Palette, Swatch, contrast matrix, and export previews use one consistent case and number-sign prefix convention
</writing>

<requirements>
Shared application state must use Qwik stores, the state library named in summary (in-memory only): palettes collection, active view, period filter, name sort, selection/detail, multi-select set, favorite flags, undo and redo stacks, vision-simulation mode, copy feedback, export preview text, import feedback, and popup dismiss. Do not use localStorage, sessionStorage, or other browser storage APIs. Persistence for this good-app genre is the export artifacts plus the MCP query surface — never browser storage.
State contracts (behavioral, not storage keys):
- Creating a valid palette increases the collection and shows it in Browse layouts and in every export preview
- Editing a palette updates that same record (name, artist, period, swatches, favorite) everywhere it appears including the archive JSON export
- Deleting a palette removes it from lists, selection, filters, and export previews
- Period filter, name sort, and view mode recompute visible items from the shared collection; they never create a second disconnected copy
- Undo and Redo change the same collection the Browse layouts and export read; enabled and disabled control states match whether a step is available
- Export previews compile live from the shared store; import replaces that same store
- WebMCP tool handlers invoke the same store commands as the visible controls
Stack: Qwik + Qwik stores + Tailwind CSS 4.3.2 (pinned) + DaisyUI; frontend-only, no backend or authentication. DaisyUI provides the chrome components (drawer, modal/panel, selects, toggles, badges); Tailwind CSS 4.3.2 owns layout, spacing, and custom surfaces with design tokens defined in the theme layer.
- AutoAnimate, Lenis, and GSAP ScrollTrigger are allowed for animation; no other animation libraries
- Iconify icons only, delivered through the @iconify/tailwind4 plugin; no raw pasted SVG icon sets
- All forms (palette create/edit, the subscribe popup, and archive import) are driven by Modular Forms with a Valibot schema: the schema mirrors the palette and archive JSON API payload field contracts above (required fields, formats, bounds, period enum, swatch hex rules), the record a form creates IS the would-be request body, and exports/imports conform to those same schemas; the form shows inline per-field errors before submit
- All libraries are installed via npm and bundled locally; no CDN imports of any library, font, or icon set
- No other UI, animation, or icon libraries beyond those named above
- Seed at least 6 user-manageable palettes so first load is non-empty; bundle a color-name dataset so nearest-historical-name derivation runs without any network request
- Nomenclature ordering must be deterministic: deduplicate swatches by hex and sort by hue with low-saturation / near-black colors bucketed to the end
- Empty or invalid required fields on create must not increase the palettes count; show visible validation feedback
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
- Browsable entity: palettes
- Destinations: archive-grid; palette-detail; filters; export-drawer
- Filters: period
- Sorts: name-asc; name-desc
- Entity: palette
- Entity operations: create; select; update; delete; toggle
- Entity fields: name; artist; swatches; favorite; period
- Artifact operations: export; import; copy
- Export formats: css; utility-theme; scss; json
- Import modes: archive-json

Mechanics exclusions:
- Raw file paths/blobs forbidden in WebMCP args
- Color-blindness filter visual verification stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
