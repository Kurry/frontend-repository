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
- The sticky header carries the O&A script lockup ("THE O&A PALETTE LIBRARY"), a centered MENU control, and a right CART control; the cart drawer lists in-memory line items (or an empty-cart message when none), never checks out, and header/menu/cart/footer/painting-title controls never navigate away
- The intro presents a serif lead about browsing color across paintings and centuries over a two-column monospace body that names historical color sources (Werner's Nomenclature of Colours, Winsor & Newton, Cennini) and the ongoing/open dataset framing
- A controls row places the three view toggles on the left (Nomenclature default, Palette, Swatch — each with a circular indicator that fills on the active view) and a "Filter by Period" select on the right offering All Periods plus named art-historical periods (e.g. Baroque to Neoclassical, Expressionism, Fauvism, Old Masters, Post-Impressionism, Realism, Romanticism, Symbolism, Tonalism)
- Nomenclature view (default) renders rows with a swatch, hex, an italic historical color name, notes, and a painting-title control; rows are ordered by hue and deduped by hex so no two rows repeat a hex
- Palette view renders a responsive card grid where each card shows a set of swatches (about five) plus painting meta; Swatch view renders large color tiles whose hex/name/title text flips dark or light by the tile's perceived luminance and reveals on hover
- Primary collection is user-manageable palettes: seed at least 6 (alongside any historical dataset) so first load is non-empty; each has a name, a period tag, and a set of hex swatches, and the list supports create, edit, and delete
- Two interaction modes: Browse mode (Nomenclature / Palette / Swatch views with the period filter) and Detail/Editor mode (open a palette to edit its name, period, and swatches)
- Selecting a period hides items whose period tag does not match across all three views; All Periods restores the full set; switching views shows exactly one library layout at a time
- Clicking a swatch (not a painting title) copies its hex to the clipboard and shows a brief on-swatch "copied" confirmation (~1s) that then clears; a favorite/featured flag can be toggled on a palette
- The palette create and edit forms validate as the user types: an invalid field shows an inline error message next to that field naming what to fix before submit, and the submit control stays disabled while any required field is invalid
- Feature: Palette create/edit field contract — the create and edit form submits exactly this payload; the record a successful create/edit produces IS the would-be palette API request body; export/import share this palette object shape. All keys required unless marked optional; example values illustrative only:
  - name: trimmed non-empty string, length 2 to 80
  - period: exactly one of Baroque to Neoclassical, Expressionism, Fauvism, Old Masters, Post-Impressionism, Realism, Romanticism, Symbolism, Tonalism (never All Periods)
  - swatches: array of 3 to 8 unique #RRGGBB hex strings (six hexadecimal digits after #; uniqueness case-insensitive)
  - favorite: optional boolean, default false
  - Cross-field: duplicate hex values in swatches are rejected with a named swatches error; a swatch that is not #RRGGBB shows an inline error naming swatches; empty/whitespace name, fewer than 3 swatches, more than 8 swatches, or a period outside the closed list keeps submit disabled, shows inline errors naming the field and the fix, and leaves the collection count unchanged
- Feature: Subscribe request body — the subscribe popup stays hidden on first paint and appears after ~45s idle or once scrolled past ~50%. Submitting it posts an in-memory SubscribeRequest whose required field is email (trimmed string matching a local-part@domain shape with a dot in the domain, for example name@example.com). An invalid or empty email shows an inline error naming the email field and does not dismiss; a valid submit or Close dismisses the popup in memory with no real network subscribe, and it stays dismissed for the rest of the session
- Feature: Cart add request body — from Browse or Detail, Add to cart opens (or focuses) the cart drawer with a CartAdd form that submits exactly this payload; the line item created IS the would-be cart-add API request body:
  - paletteName: required trimmed string that must exactly match an existing user-manageable palette name
  - quantity: required integer from 1 to 5 inclusive
  - Invalid paletteName or quantity shows an inline error naming that field and adds no line; a valid submit appends one line item showing the palette name and quantity; removing a line updates the drawer immediately; the drawer never exposes checkout or payment
- Feature: Layout simulator — a Layout simulator control opens a mock blog / dashboard / landing surface recolored live from the selected palette's swatches (or the first library palette when none is selected); switching the selected palette updates the simulator colors without a reload
- Feature: Multi-swatch batch H/S/L edit — in Detail/Editor, swatches support multi-select with a visible per-swatch selected state; with at least one swatch selected, a batch-edit tray appears with three shift sliders — Hue (-180 to 180 degrees), Saturation (-100 to 100), and Lightness (-100 to 100) — each with a live numeric readout. Moving a slider previews the shifted colors on the selected swatches live; Apply shift commits the new #RRGGBB values to the palette as a single undoable step; Cancel restores the pre-preview colors. Unselected swatches never change, and every committed swatch remains a valid #RRGGBB value that honors the 3–8 unique-swatch contract (a shift that would collapse two selected swatches into duplicate hexes shows a named swatches error and commits nothing)
- Feature: Undo and Redo — Undo and Redo controls step backward and forward through palette mutations (create, edit, delete, favorite toggle, Apply shift, Apply harmony, and import). After deleting a palette via the UI, Undo restores its card, swatches, and the prior collection count; Redo re-applies the delete. A new mutation after Undo clears the redo stack, and Undo/Redo show a visibly disabled appearance when no step is available. Undone or redone state flows into Browse layouts, the Layout simulator, and export previews the same as direct edits
- Feature: Color-wheel harmonic engine — Detail/Editor includes a circular color wheel with a draggable anchor point and a harmony mode select offering Analogous, Complementary, and Triadic; dragging the anchor moves the companion points continuously according to the active mode (Complementary opposite at 180 degrees, Triadic at 120-degree spacing, Analogous adjacent within about 30 degrees), with live hex readouts for the anchor and each companion point. Switching harmony mode repositions the companion points without a reload. Apply harmony replaces the selected palette's swatches with the computed set as one undoable step, and the applied set always satisfies the 3–8 unique #RRGGBB contract (a computed set that would violate it shows a visible error naming swatches and changes nothing)
- Feature: WCAG contrast matrix — Detail/Editor for a palette with at least 2 distinct swatch hexes shows a contrast matrix of unique text/background swatch pairings with the computed contrast ratio (at least one decimal place) and AA (4.5:1) / AAA (7:1) pass/fail marks that include a text label such as Pass or Fail alongside any color cue. Recoloring a swatch — direct edit, Apply shift, or Apply harmony — updates at least one listed ratio or mark without a reload. A palette with fewer than 2 distinct hexes shows an explanatory state instead of fabricated ratios
- Feature: Vision simulation — a vision-simulation control offers None (default), Protanopia, and Deuteranopia; choosing Protanopia or Deuteranopia visibly alters swatch rendering across the Browse layouts and the Layout simulator relative to None; choosing None restores the unfiltered appearance; the active mode persists across view switches for the session and returns to None on reload
- Feature: Export drawer and schema-mirrored artifacts — an Export control opens the export drawer with three live-derived format tabs (CSS, utility-theme, SCSS) plus Download palette package JSON and Import package. Every tab and the JSON regenerate from the current user-manageable palettes collection without a reload; creating, editing, or deleting a palette updates all four artifacts. Download CSS / utility-theme / SCSS and Copy for the active tab emit the visible text. Format contracts (field names and tokens visible in the preview text):
  - CSS: a :root block declaring one --swatch-N custom property per exported swatch whose value is that swatch's #RRGGBB, plus comments or selectors that include each palette's name
  - utility-theme: a theme.extend.colors (or equivalent theme colors) snippet whose color keys include each palette name (slug-safe) and whose values are the palette's #RRGGBB list
  - SCSS: a $palettes map (or equivalent) keyed by palette name whose values are lists of #RRGGBB swatches
  - Palette package JSON: required keys schemaVersion (number exactly 1), library (exactly the string O&A Palette Library), palettes (array of palette request-body objects in collection order, each conforming to the create/edit field contract), and generatedAt (ISO-8601 datetime ending in Z). All keys and nesting are REQUIRED; example values are illustrative only
  - An export that omits a session create/edit/delete is invalid
- Feature: Import package round-trip — Import package accepts a previously exported palette package JSON (file pick or paste). A valid import replaces the user-manageable palette collection so Browse layouts, counts, period filter membership, and a fresh export match the imported document without a reload. Malformed JSON, wrong schemaVersion, library not exactly O&A Palette Library, or any palette object that fails the create/edit field contract shows a visible error naming the offending field (or that the package is invalid) and changes nothing
</core_features>

<user_flows>
- Create: submitting a valid new palette from the editor increases the palette collection count by exactly one, the new palette appears as a card in Palette view and its swatches join the Nomenclature rows (hue-ordered, hex-deduped) without a reload, and selecting the new palette's period in the filter keeps it visible while All Periods shows it alongside the seeds
- Edit: renaming a palette and changing its period in Detail/Editor updates that palette's name on its Palette-view card and in Detail without a reload, and the period change is reflected by the filter — the old period no longer shows the palette and the new period does
- Delete: deleting a palette decreases the collection count by exactly one, removes its card from Palette view and its swatches from the Nomenclature and Swatch views, clears it from any active selection, and the period filter recomputes so the deleted palette matches nothing
- Favorite: toggling the favorite/featured flag on a palette in one view shows the same flag state when the same palette is viewed in another view or opened in Detail, without a reload
- A page reload returns the app to its seeded state: the seeded palettes, the Nomenclature view as default, All Periods, no selection, empty undo and redo stacks, and vision simulation None
- Batch edit flow: in Detail/Editor select at least two swatches, drag the Hue shift slider and watch only the selected swatches preview the shift live, Apply shift, and confirm the palette's Browse surfaces show the shifted hexes while unselected swatches are unchanged; open Export and confirm the shifted #RRGGBB values appear in the CSS preview and the package JSON
- Harmony flow: open a palette, drag the color-wheel anchor and watch the companion points and hex readouts track continuously, switch the mode from Analogous to Triadic and confirm the points reposition, Apply harmony, and confirm the palette's swatches equal the computed set in Detail and Browse and appear in a fresh export
- Undo/redo flow: delete a palette (count decreases by one), Undo (its card, swatches, and the prior count return and the next export includes it again), Redo (it is deleted again), then create a new palette and confirm Redo shows a disabled appearance and does nothing
- Contrast flow: open a palette's contrast matrix, note one pairing's ratio, recolor one swatch via Apply shift, and confirm at least one ratio or pass/fail mark changes without a reload
- Vision flow: set vision simulation to Deuteranopia and confirm swatch rendering visibly shifts in Browse and in the Layout simulator versus None; set None and confirm the original appearance returns
- Export session flow: create a valid palette, open Export, confirm the CSS/utility-theme/SCSS previews and the palette package JSON include that palette's name and swatches under the format contracts, Download or Copy the active format, then delete the palette and confirm the next export omits it
- Import round-trip flow: export the palette package after a create, note the palettes length, delete palettes to diverge, Import the JSON, and confirm the collection count, Browse layouts, and a fresh export reconstruct to match the imported package
- Cart add flow: submit a valid CartAdd for an existing palette name with quantity 2, confirm the cart drawer shows that line, then submit an invalid quantity (0 or 6) and confirm an inline quantity error with no extra line
- Subscribe flow: after the popup appears, submit an invalid email and confirm it stays open with an email-field error; submit a valid email and confirm it dismisses and does not return on further scroll
</user_flows>

<edge_cases>
- Invalid create: an empty palette name, a swatch that is not #RRGGBB, duplicate hexes, or fewer than 3 / more than 8 swatches shows visible validation feedback naming the offending field and adds no palette; the collection count is unchanged
- Double-activating the editor's submit control creates exactly one palette: the count increases by one and one new card appears
- An empty state appears in the library region when the period filter matches nothing or all user palettes are deleted, with a message explaining that no palettes match and how to get back (clear the filter or create a palette)
- Clicking a painting-title control never triggers the copy confirmation; only swatch clicks copy a hex
- Dismissing the subscribe popup keeps it dismissed for the rest of the session; it does not reappear on further idle or scrolling
- Importing malformed palette package JSON, schemaVersion other than 1, library other than O&A Palette Library, or a palette that fails the create/edit field contract leaves the collection unchanged and shows a visible error naming the problem
- CartAdd with a paletteName that matches no palette, or quantity outside 1–5, adds no line and shows an inline error naming that field
- A batch H/S/L shift that would push a color outside the representable range clamps to a valid #RRGGBB value; no committed swatch is ever an invalid hex, and a shift that would produce duplicate hexes among the palette's swatches shows a named swatches error instead of committing
- Apply harmony never commits a swatch set outside the 3–8 unique #RRGGBB contract; when the computed set would violate it, a visible error names swatches and the palette is unchanged
- With nothing to undo, Undo shows a disabled appearance and does nothing; after Undo followed by a new mutation, Redo is disabled and cannot resurrect the cleared redo stack
- A palette with fewer than 2 distinct swatch hexes shows an explanatory contrast-matrix state instead of fabricated ratios
</edge_cases>

<visual_design>
- Cream editorial field with near-black foreground; hairline rules on nomenclature rows — not a dashboard or promo-card grid
- Sticky header with script lockup, centered MENU, and CART
- Expressive type pairing for titles, mono for hex meta, italic for historical color names
- Library controls row: view toggles with circular fill indicators; period filter on the right
- Detail/Editor mode uses a focused panel for the selected palette; empty collection state is clear
- Inline validation errors render in a distinct error color next to the field they name
- Export drawer presents format tabs and a monospace code preview; Layout simulator reads as a distinct mock surface recolored by the active palette
- Detail/Editor advanced surfaces: the color wheel reads as a crafted circular control with visible anchor and companion points, the contrast matrix reads as a readable table or grid, and the batch-edit tray is a compact toolbar near the swatch list — not a second page
- Undo/Redo and the vision-simulation control sit with the library controls as a coherent strip, with disabled states visually distinct from enabled ones
- Multi-column inert footer behind main content
</visual_design>

<motion>
- Smooth scroll and scroll-triggered reveals may pace the editorial page; pause smooth-scroll while overlays that need native scroll locking are open
- Hover animations (required): nomenclature swatches outline on hover; palette-card swatches outline and fade in hex labels; swatch tiles fade in overlays; view-toggle inactive options show brief indicator fill on hover; palette list rows in Detail mode take a hover wash
- Creating a palette animates its card into the grid; deleting a palette animates its card out rather than snapping the layout
- Copy feedback: short on-swatch copied confirmation appears with a brief transition then clears
- Mode switch between Browse layouts and Detail/Editor updates without full reload
- Subscribe popup: overlay fades in after idle/deep scroll; dismiss fades it out
- Export drawer and Layout simulator open/close with a brief opacity transition rather than a hard cut
- Dragging the color-wheel anchor moves the companion points continuously with the pointer rather than jumping on release; switching harmony mode animates the companion points to their new positions
- Batch H/S/L sliders preview the shifted colors live while dragging; Apply shift and Cancel transition the swatches rather than hard-swapping
- When prefers-reduced-motion is not set, changing vision-simulation mode eases the appearance change across the canvas rather than a hard cut
- Undo restoring a deleted palette animates its card back into the grid rather than snapping the layout
- With prefers-reduced-motion set, reveals and card animations are removed and state changes apply instantly while every feature remains reachable
</motion>

<responsiveness>
- The Palette-view card grid reflows across widths: multiple columns at desktop widths narrowing to a single column at phone widths with no clipped cards
- At 375 pixel width no content clips or overflows the viewport and no horizontal scrolling appears; the two-column monospace intro collapses to a single column
- At narrow widths the controls row stacks or wraps so the view toggles and the period filter both remain fully visible and operable
- At 375 pixel width Export, Import, Layout simulator, and the cart drawer remain reachable and operable without page-level horizontal scrolling
- At 375 pixel width the Detail/Editor color wheel, contrast matrix, batch-edit tray, undo/redo controls, and vision-simulation control fit the viewport and remain operable without horizontal scrolling
</responsiveness>

<accessibility>
- Every interactive control — view toggles, period filter, swatches, painting titles, editor fields, header controls, Export, Import, Layout simulator, Add to cart — is reachable and operable with the keyboard alone, with a visible focus indicator
- The cart drawer, subscribe popup, Detail/Editor overlay, and export drawer behave as dialogs: focus moves into them when opened, stays trapped while open, and returns to the invoking control on close
- The period filter is operable with the keyboard: it opens, moves through period options, and applies a selection without a pointer
- Each swatch control carries an accessible name that includes its hex value; the copied confirmation and form validation errors (palette, subscribe, cart, import) are announced through an aria-live region as well as shown visually
- The color-wheel anchor is keyboard-adjustable (arrow keys move the anchor with the companion points tracking), and the batch-edit sliders, harmony mode select, Undo/Redo controls, and vision-simulation control are keyboard-operable with visible focus indicators
- Contrast-matrix pass/fail marks include a text label such as Pass or Fail alongside any color cue — not color alone
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear during a full exercise of the app: browsing all three views, filtering, creating, editing, deleting, copying, exporting, importing, cart add, and dismissing the popup
- Rapid repeated view switching and filter changes stay responsive with no hangs, dropped interactions, or layout breakage
- Contrast-matrix recomputation, color-wheel dragging, and batch H/S/L live preview keep up with pointer movement without freezing editor controls
</performance>

<writing>
- Headings, controls, and labels use one consistent capitalization convention throughout the app
- The editorial intro, historical color names, and notes read as finished copy; no placeholder or lorem text appears anywhere in the shipped UI
- Validation errors name the field and the fix for palette, subscribe, cart, and import forms; empty states explain what belongs there and how to restore content
- Advanced controls use specific labels — for example Undo, Redo, Apply shift, Apply harmony, Analogous, Complementary, Triadic, Protanopia, Deuteranopia, AA, AAA — rather than generic Submit or OK alone
</writing>

<requirements>
Shared application state must use the stack state library named in summary (in-memory only): palettes collection, active view, period filter, selection/detail, copy feedback, popup dismiss, cart line items, export artifact text, layout-simulator selection, multi-select swatch set and batch-edit slider state, undo and redo stacks, color-wheel anchor and harmony mode, and vision-simulation mode. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- All views derive from one shared store; a change made in one view echoes in every other view without a reload, and no view keeps a second disconnected copy of the collection
- Creating a valid palette increases the collection and shows it in Browse layouts
- Editing a palette updates that same record (name, period, swatches) everywhere it appears
- Deleting a palette removes it from lists, selection, filters, and cart lines that referenced it by name
- Period filter and view mode recompute visible items from the shared collection; nomenclature ordering (hue sort + hex dedupe) derives from the shared collection
- Copy feedback and subscribe-popup dismissal are ephemeral in-memory state; the popup stays hidden on first paint and appears only after idle (~45s) or deep scroll (~50%)
- Undo and Redo mutate the same collection the Browse layouts, Layout simulator, and export previews read; each control's enabled or disabled appearance matches whether a step is available
- Contrast-matrix ratios, color-wheel readouts, and vision-simulated rendering derive from the shared collection and recompute when it changes
- A page reload returns the app to its seeded state
- End-state contract: Download CSS / utility-theme / SCSS / palette package JSON and Copy MUST reflect the session's actual user-manageable palettes under the field contracts above — an export that omits session work is invalid; Import of a previously exported package MUST restore the same visible collection (round-trip). Persistence for this good-app genre is the portable palette package plus the MCP query surface — never browser storage
Stack: Vue 3 with Pinia, built with Vite or an equivalent SPA setup. Styling is Tailwind CSS 4.3.2 (pinned), with design tokens in @theme. Ark UI for Vue components provide the menu, cart drawer, period select, palette editor, subscribe dialog, export drawer, layout simulator chrome, and toasts; no other external component library. @vueuse/motion is allowed for animation; no other animation libraries. Iconify via @iconify/tailwind4 only; no raw pasted SVG icon sets and no icon CDNs. All forms — palette create and edit, SubscribeRequest, CartAdd, and Import package — validate through a Zod schema driven by VeeValidate: schemas are API-shaped and mirror the field contracts above (the record each form creates IS the would-be request body; CSS/utility-theme/SCSS/package exports and Import package conform to those same contracts). Inline per-field errors render before submit; submit stays disabled while required fields are invalid. A nearest-name color helper is allowed. All libraries are installed via npm and bundled locally; no CDN imports.
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
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
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
- Destinations: library-grid; palette-detail; export-drawer; layout-simulator
- Filters: period
- Entity: palette
- Entity operations: create; select; update; delete; toggle
- Entity fields: name; swatches; favorite; period
- Artifact operations: export; import; copy
- Export formats: css; utility-theme; scss; library-json
- Import modes: library-json

Mechanics exclusions:
- Raw file paths/blobs forbidden in WebMCP args
- Color-wheel drag and layout-simulator hover stay Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
