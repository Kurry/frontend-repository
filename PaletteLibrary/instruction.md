<summary>
Build a fine-art color palette library using Vue 3, Pinia, and UnoCSS.
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
Stack: Vue 3 + Pinia + UnoCSS (Vite or equivalent SPA); frontend-only. Lenis + GSAP ScrollTrigger and a nearest-name color helper are allowed. No MUI/Chakra/Ant Design.
- Seed at least 6 user-manageable palettes plus any historical dataset so first load is non-empty
- Empty required fields on create must not increase the palettes count; show visible validation feedback
- After deleting all user palettes (or filtering to zero matches), show an empty state in the library region
- Zero navigational outbound links for app chrome; no cart checkout or real subscribe
- Document title includes Palette Library; brand reads as Object and Archive / o+a
</requirements>
