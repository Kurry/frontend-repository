<summary>
Build a Layer-1 blockchain network marketing site using Astro with static delivery and React islands, Nano Stores, Tailwind CSS 4.3.2, and DaisyUI.
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
Feature: Sticky chrome and navigation —
- Sticky top chrome: Ridge wordmark + geometric mark (left); light/dark theme toggle pill; oversized hamburger that opens a full-screen / drawer mega-menu — no traditional horizontal link row in the header
- Mega-menu panels (in-memory nav only): Build, Solutions, Community, About — each panel may show a Featured News teaser card; all CTAs stay in-page; a light-dismiss click outside the panel closes it
Feature: Hero and landing chapters —
- First-viewport hero composition (brand-first, single composition — not a dashboard): left bento mission cell; right bento live local clock + SCROLL affordance; dominant full-bleed atmospheric visual plane below; brand mark remains a hero-level signal
- Initial page-load entrance (REQUIRED): sticky chrome + both bento cells + hero visual plane MUST run the ease-in / ease-in-out enter sequence documented under motion — FAIL if the first viewport paints fully settled with no load entrance
- Featured initiative strip; Why Ridge chapter with exactly four numbered pillars 01–04 and the signature sticky card pile on desktop; Get started onboarding trio; trust strip of original placeholder partner marks; developer resources; Network in action seeded lists; News & stories carousel; Solutions grid; Community block
- Ridge Global Events chapter with oversized all-caps RIDGE GLOBAL EVENTS headline, supporting blurb, featured summit card, and required character-decode + line-mask text animation under motion
Feature: Events collection and manager —
- Primary collection — network events / initiatives: seed at least 6 events; each has title, date, city, category tags, and status (upcoming | featured | past); the collection supports create, edit, and delete via an in-page Events manager panel
- At least two interaction modes: Marketing Scroll mode (the full landing chapters) and Events Manager mode (list/table of events with filters, reachable from Global Events View all or a header control)
- Filtering events by status or category narrows the visible rows to matching events only; clearing the filter restores the full list exactly
- A feature flag on an event marks it featured, and featured events surface in the featured slots of the landing chapters
Feature: Forms and theme —
- Email/contact forms validate inline per field before submit: each invalid field shows an error message naming that field, and the submit control stays disabled until every required field is valid
- Toggling the theme pill switches light/dark styling across chrome, chapters, and Events Manager without reloading the document
- Bottom conversion forms and footer remain inert/in-page; no real outbound auth, wallet connect, or backend submit
- Preserve all signature layout/motion contracts: black-void modules, dual corner notches, Why Ridge sticky pile, Get started rise, Global Events decode — do not gut them when adding the Events collection
</core_features>

<user_flows>
- Create flow: opening Events Manager and submitting a valid new upcoming event closes the form, increases the manager row count by exactly one, and the same event appears in the Global Events landing listings whose status filter matches — all without a reload
- Edit flow: editing an event's title or status in Events Manager updates that same record everywhere it appears — the manager row, the landing listings, and any featured slot — without a reload
- Delete flow: deleting an event removes its row from Events Manager, decreases the visible count by exactly one, and removes it from landing listings and featured slots in the same session
- Filter flow: applying a status filter in Events Manager narrows the rows; switching to a category filter recomputes the rows from the same shared collection; clearing all filters restores the full seeded-plus-created list exactly
- Theme flow: toggling to dark mode recolors the sticky chrome, hero, chapters, and Events Manager together; toggling back restores the light styling; the events collection and any active filters are unchanged by the toggle
- A page reload returns the app to its seeded state: the seeded events (at least 6), default theme, closed mega-menu, and default filters
</user_flows>

<edge_cases>
- Invalid create: submitting with an empty event title or missing date must not add an event — the visible event count stays unchanged and an inline validation message names the offending field
- Double-activating the create submit control adds exactly one event: the count increases by one and one new row appears
- After deleting all events, Events Manager shows an empty state with a message and a control that opens the create flow
- When active filters match no events, the list region shows an empty state with a clear-filters control that restores the full list
- Submitting a contact form with a malformed email or without privacy consent shows inline errors naming the field and does not show the success state
</edge_cases>

<visual_design>
- Product: Ridge (placeholder brand). Document title e.g. Custom Blockchains for Enterprise | Ridge. Wordmark lowercase ridge beside a sharp geometric mark in a saturated accent (ember / alpine red — not purple)
- Brand-first first viewport; signature layout system of light content modules floating on large black fields with dual corner language (large radii + architectural diagonal notches)
- CSS tokens MUST include at least --ridge-radius-module (large) and --ridge-radius-control (small), plus void/ink/accent/surface variables
- Events Manager mode: dense list/table with status badges and filters over the same visual system; empty state when no events remain
- Typography: an expressive geometric display face for all-caps chapter titles, bundled with the app under an open license (not Inter / Roboto / Arial / system-only)
- One consistent icon set appears across the chrome, mega-menu, manager rows, and footer — no mixed icon styles
- All logos and partner marks are original placeholder marks — the trust strip and any client wall show distinct invented marks, never real company logos or trademarks
- Atmosphere: cool, architectural, institutional-tech — avoid purple-indigo gradients, glow spam, cream-and-terracotta editorial clichés
</visual_design>

<motion>
- Theme toggle: sun/moon swap with short rotate/fade; surfaces recolor via theme tokens
- Mega-menu: drawer/full-screen panel slides or fades in; light-dismiss closes it
- Initial page-load entrance (REQUIRED): a one-shot mount class (added after mount via double requestAnimationFrame, NOT an IntersectionObserver) drives the sticky chrome down from translateY(-100%), the two bento cells in via clip-path inset expansion plus a short translateY settle, and the hero plane in last; the sequence uses an ease-in-out curve (~cubic-bezier(0.8,0,0.2,1)), primary moves last ~1.7–1.9s each, and cells stagger behind the chrome (chrome ~0.85s delay, bento cells ~0.9s/1.05s, hero plane ~1.35s). prefers-reduced-motion skips the load entrance and paints settled
- Why Ridge sticky card pile (REQUIRED at ≥768px): the four pillars are position:sticky with progressively larger top offsets (each pillar peeks ~24–32px below the previous, later cards covering earlier ones) and the chapter title pins above them; below 768px and under reduced-motion they fall back to a static vertical list
- Get started trio enter motion (REQUIRED below lg / <1024px): each of the three cards rises from translateY(50%) to 0 with an ease-out-soft curve (~cubic-bezier(0.165,0.84,0.44,1)) and a per-card stagger of ~0.4s (roughly 2.0s / 2.4s / 2.8s); at ≥1024px the translate is suppressed and reduced-motion shows them static
- Ridge Global Events text animation (REQUIRED): on enter-view, each character of RIDGE GLOBAL EVENTS flashes through decoy glyphs before settling to its final letter (per-character start delay ~index×60ms, duration ~50ms+(index+1)×75ms, a few decoy steps) while the supporting blurb reveals line-by-line from translateY(-100%) inside overflow-hidden wrappers (~2s ease, per-line delay ~0.15s×(line+1)); it runs once and reduced-motion shows the final text immediately
- Scrolling is smoothed with eased, inertial motion at desktop widths; native touch physics and position:sticky behavior remain intact, and reduced-motion disables the smoothing
- Events Manager mode switches without full reload; creating or deleting an event animates the affected row in or out of the list and the remaining rows ease to their new positions
- Form submit feedback animates: the success state of a valid contact submit transitions in rather than snapping
- Hover animations (required): notched CTAs brighten + arrow nudge; tiles ease lift/brightness while preserving notch silhouette; event rows take hover wash; theme toggle animates; focus-visible rings on interactive controls
</motion>

<responsiveness>
- Bento hero cells stack vertically at mobile widths; the mega-menu becomes a full-screen drawer
- Why Ridge sticky pile is desktop only (768px and up); below that the pillars render as a static vertical list
- The hero pull-in composition applies at 1024px and up; Get started renders as 1 column at mobile widths and three-up from the sm breakpoint
- No content clips or overflows the viewport, and no horizontal scrolling appears at 375px width
- Desktop and mobile layouts are both required and both keep every chapter, form, and the Events Manager reachable
</responsiveness>

<accessibility>
- Every interactive control — theme toggle, hamburger, mega-menu links, manager filters, form fields, CTAs — is reachable and operable with the keyboard alone, with a visible focus indicator
- The open mega-menu drawer traps focus while open, closes on Escape, and returns focus to the hamburger control on close
- The decoded RIDGE GLOBAL EVENTS headline exposes the final phrase to assistive technology (the heading carries the full text as its accessible name while individual animated characters are hidden from the accessibility tree)
- Form validation messages are announced via an aria-live polite region as well as shown visually
- The theme toggle exposes an accessible name that reflects its current state
</accessibility>

<performance>
- The page is interactive within 2 seconds of a local cold load
- Loading and exercising the page produces no console errors and no hydration errors or warnings; interactive islands become usable without any visible content flash or layout swap
- After first paint, no visible layout jumps occur as fonts or media finish loading; the hero visual plane holds its space from the start
- Continuous scrolling from top to bottom holds a smooth frame rate through every animated chapter
</performance>

<writing>
- Headings, nav labels, and CTAs use one consistent capitalization convention throughout
- All marketing copy is original and reads in a coherent institutional-tech voice for an enterprise blockchain product; no lorem ipsum or placeholder text appears anywhere in the shipped UI
- Error messages name the problem field and the fix; empty states explain what belongs there and how to add it
- Copy never uses real network, company, or agency proper nouns — the Ridge placeholder brand carries all naming
</writing>

<requirements>
Shared application state must use Nano Stores, shared across all interactive islands (in-memory only): events/initiatives collection, theme, mega-menu, forms, carousel indices, and Events Manager open/filter state. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a valid event increases the collection and shows it in Events Manager and the Global Events listings when status matches
- Editing an event updates that same record everywhere it appears
- Deleting an event removes it from lists, filters, and featured slots if applicable
- Status/category filters recompute the visible events list from the shared collection — never a second disconnected copy
- Theme and mode are shared client state; toggling them does not reload the document
Stack: Astro with static delivery (no server loaders, actions, or API routes — all interactivity lives in client state after load); interactive regions (theme toggle, mega-menu, Events Manager, forms, carousel) are React islands sharing the one Nano Stores state; frontend-only.
- Tailwind CSS 4.3.2 (pinned) is the styling base with design tokens in @theme; DaisyUI is the sole component library, used for base chrome — buttons, badges, form controls, the drawer/modal, and the Events Manager table
- GSAP with ScrollTrigger and Lenis are the allowed animation libraries (scroll choreography, timelines, smooth scroll); no other animation libraries
- Phosphor icons via the astro-icon package only; no other icon sets, no raw copy-paste SVGs, no icon CDNs
- All forms — event create/edit and the email/contact forms — are driven by React Hook Form with a Zod schema: the schema defines the rules, the form surfaces inline per-field errors before submit
- All libraries are installed via npm and bundled locally; no CDN imports of libraries, fonts, or icons; the display typeface ships as bundled open-license font files in /app
- Placeholder brand name is Ridge everywhere — do not use Avalanche, AVAX, avax.network, Snowtrace, or other real-network proper nouns; all logos, partner marks, and media are original placeholders, never third-party trademarks or copyrighted assets
- Seed at least 6 events plus Why pillars, Get started trio, resources, mock blocks/transactions, news, solutions, and original placeholder partner marks
- Email / contact forms: required fields, email format check, privacy consent required; success state after valid submit; do not POST to a server
- Nav and CTAs must not leave the site; serve over local HTTP; desktop and mobile layouts both required
- Intentionally out of scope: real wallet connect, live chain RPC, auth, CMS, or payment flows
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
- form-workflow-v1
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

<module_spec id="form-workflow-v1">
{
  "id": "form-workflow-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Form workflow",
  "purpose": "Forms, setup flows, authentication shells, and multi-step workflows.",
  "permitted_operations": ["validate", "submit", "cancel", "reset", "advance", "return"],
  "binding_keys": {
    "required_any_of": [["form_fields"], ["form_operations"]],
    "optional": ["workflow_steps", "value_bounds", "visible_postconditions"]
  },
  "restrictions": [
    "Declared fields only.",
    "Normal validation and visible errors remain active.",
    "Cannot manufacture authentication or bypass guarded routes.",
    "Backend-free apps must surface honest unavailable state through product handlers."
  ],
  "tool_name_prefix": "form"
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
- Browsable entity: features
- Destinations: marketing-home; feature-detail; waitlist
- Entity: feature
- Entity operations: create; select; update; delete
- Entity fields: title; summary
- Form fields: email; name
- Form operations: validate; submit; cancel

Mechanics exclusions:
- Outbound marketing CTAs must remain in-app (no origin navigation)

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
