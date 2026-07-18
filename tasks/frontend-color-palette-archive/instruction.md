<summary>
Build a fine-art color palette archive using Qwik, Qwik stores, and Tailwind CSS.
</summary>

<core_features>
Core features:
- Direct library entry with editorial intro and a browsable palette section — no login, cart checkout, or multi-page routing
- Sticky chrome: script / O&A lockup, centered MENU, and CART; empty cart drawer chrome may open but never checks out
- Primary collection — saved palettes (and/or curated color sets): seed at least 6 user-manageable palettes; each has name, period tag, and a set of hex swatches; the list supports create, edit, and delete
- At least two interaction modes: Browse mode (Nomenclature / Palette / Swatch library views with period filter) and Detail/Editor mode (open a palette to edit name, period, and swatches)
- Domain behavior beyond CRUD: period filter across views; hex copy with brief copied feedback; favorite or featured flag; empty state when filters match nothing or all user palettes deleted
- Three library layouts remain: Nomenclature (default), Palette, and Swatch, with a filled circular indicator on the active view
- Invalid create: empty palette name or fewer than required swatches must not add a palette; show visible validation feedback
- Optional subscribe popup after idle/deep scroll (dismiss in memory — no real network subscribe)
- Inert chrome (logo, menu, cart, painting titles, footer) — never navigates away
</core_features>

<visual_design>
- Cream editorial field with near-black foreground; hairline rules on nomenclature rows — not a dashboard or promo-card grid
- Sticky header with script lockup, centered MENU, and CART
- Expressive type pairing for titles, mono for hex meta, italic for historical color names
- Library controls row: view toggles with circular fill indicators; period filter on the right
- Detail/Editor mode uses a focused panel for the selected palette; empty collection state is clear
- Multi-column inert footer behind main content
</visual_design>

<motion>
- Smooth scroll and scroll-triggered reveals may pace the editorial page; pause smooth-scroll while overlays that need native scroll locking are open
- Hover animations (required): nomenclature swatches outline on hover; palette-card swatches outline and fade in hex labels; swatch tiles fade in overlays; view-toggle inactive options show brief indicator fill on hover; palette list rows in Detail mode take a hover wash
- Copy feedback: short on-swatch copied confirmation then clear
- Mode switch between Browse layouts and Detail/Editor updates without full reload
- Subscribe popup: overlay fades in after idle/deep scroll; dismiss fades it out
</motion>

<requirements>
Shared application state must use the stack state library named in summary (in-memory only): palettes collection, active view, period filter, selection/detail, copy feedback, and popup dismiss. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a valid palette increases the collection and shows it in Browse layouts
- Editing a palette updates that same record (name, period, swatches) everywhere it appears
- Deleting a palette removes it from lists, selection, and filters
- Period filter and view mode recompute visible items from the shared collection
Stack: Qwik + Qwik stores + Tailwind CSS; frontend-only. Lenis + GSAP ScrollTrigger are allowed. No MUI/Chakra/Ant Design.
- Seed at least 6 user-manageable palettes plus any historical dataset so first load is non-empty
- Empty required fields on create must not increase the palettes count; show visible validation feedback
- After deleting all user palettes (or filtering to zero matches), show an empty state in the library region
- Zero navigational outbound links for app chrome; no cart checkout or real subscribe
- Document title includes Palette Library; brand reads as Object and Archive / o+a
</requirements>

## Delivery and integrity

- Integrity: work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
- Delivery: produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; run `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- WebMCP: required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.

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
