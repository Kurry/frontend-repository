<summary>
Build a Layer-1 blockchain network marketing site using React, Zustand, and Tailwind CSS.
</summary>

<core_features>
Core features:
- Sticky top chrome: Ridge wordmark + geometric mark (left); light/dark theme toggle pill; oversized hamburger that opens a full-screen / drawer mega-menu — no traditional horizontal link row in the header
- Mega-menu panels (in-memory nav only): Build, Solutions, Community, About — each panel may show a Featured News teaser card; all CTAs stay in-page
- First-viewport hero composition (brand-first, single composition — not a dashboard): left bento mission cell; right bento live local clock + SCROLL affordance; dominant full-bleed atmospheric visual plane below; brand mark remains a hero-level signal
- Initial page-load entrance (REQUIRED): sticky chrome + both bento cells + hero visual plane MUST run the ease-in / ease-in-out enter sequence documented under motion — FAIL if the first viewport paints fully settled with no load entrance
- Featured initiative strip; Why Ridge chapter with exactly four numbered pillars 01–04 and the signature sticky card pile on desktop; Get started onboarding trio; trust strip; developer resources; Network in action seeded lists; News & stories carousel; Solutions grid; Community block
- Ridge Global Events chapter with oversized all-caps RIDGE GLOBAL EVENTS headline, supporting blurb, featured summit card, and required character-decode + line-mask text animation under motion
- Primary collection — network events / initiatives: seed at least 6 events; each has title, date, city, category tags, and status (upcoming | featured | past); the collection supports create, edit, and delete via an in-page Events manager panel
- At least two interaction modes: Marketing Scroll mode (the full landing chapters) and Events Manager mode (list/table of events with filters, reachable from Global Events View all or a header control)
- Domain behavior beyond CRUD: filter events by status or category; feature flag; empty events state; theme light/dark; email/contact forms with client-side validation
- Invalid create: empty event title or missing date must not add an event; show visible validation feedback
- Bottom conversion forms and footer remain inert/in-page; no real outbound auth, wallet connect, or backend submit
- Preserve all signature layout/motion contracts: black-void modules, dual corner notches, Why Ridge sticky pile, Get started rise, Global Events decode — do not gut them when adding the Events collection
</core_features>

<visual_design>
- Product: Ridge (placeholder brand). Document title e.g. Custom Blockchains for Enterprise | Ridge. Wordmark lowercase ridge beside a sharp geometric mark in a saturated accent (ember / alpine red — not purple)
- Brand-first first viewport; signature layout system of light content modules floating on large black fields with dual corner language (large radii + architectural diagonal notches)
- CSS tokens MUST include at least --ridge-radius-module (large) and --ridge-radius-control (small), plus void/ink/accent/surface variables
- Events Manager mode: dense list/table with status badges and filters over the same visual system; empty state when no events remain
- Typography: expressive geometric display sans for all-caps chapter titles (not Inter / Roboto / Arial / system-only)
- Atmosphere: cool, architectural, institutional-tech — avoid purple-indigo gradients, glow spam, cream-and-terracotta editorial clichés
- Responsive: bento stacks; mega-menu becomes full-screen drawer; Why Ridge sticky pile is desktop (md+); pull-in is lg+; Get started is 1 column then sm three-up
</visual_design>

<motion>
- Theme toggle: sun/moon swap with short rotate/fade; surfaces recolor via theme tokens
- Mega-menu: drawer/full-screen panel slides or fades in; light-dismiss closes it
- Initial page-load entrance (REQUIRED): chrome from above; bento cells via clip-path/opacity/translate; hero plane settles; ease-in or ease-in-out; primary moves ~1500–2000ms with stagger; one-shot mount class — not IntersectionObserver. prefers-reduced-motion skips the load entrance
- Why Ridge sticky card pile (REQUIRED on desktop): progressive sticky stack with peek shelves; mobile and reduced-motion use static vertical list
- Get started trio enter motion (REQUIRED below lg): staggered rise from translateY(50%) with ease-out; reduced-motion skips
- Ridge Global Events text animation (REQUIRED): per-character scramble/flash decode into RIDGE GLOBAL EVENTS plus clipped line-mask blurb reveal on enter-view; reduced-motion shows final text immediately
- Events Manager mode switches without full reload; list rows update on create/edit/delete
- Hover animations (required): notched CTAs brighten + arrow nudge; tiles ease lift/brightness while preserving notch silhouette; event rows take hover wash; theme toggle animates; focus-visible rings on interactive controls
</motion>

<requirements>
Shared application state must use the stack state library named in summary (in-memory only): events/initiatives collection, theme, mega-menu, forms, carousel indices, and Events Manager open/filter state. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating a valid event increases the collection and shows it in Events Manager and the Global Events listings when status matches
- Editing an event updates that same record everywhere it appears
- Deleting an event removes it from lists, filters, and featured slots if applicable
- Status/category filters recompute the visible events list from the shared collection
- Theme and mode are shared client state; toggling them does not reload the document
Stack: React + Zustand + Tailwind CSS (Vite or equivalent SPA); frontend-only. No external component libraries.
- Placeholder brand name is Ridge everywhere — do not use Avalanche, AVAX, avax.network, Snowtrace, or other real-network proper nouns
- Seed at least 6 events plus Why pillars, Get started trio, resources, mock blocks/transactions, news, solutions, and partner marks
- Empty required fields on create must not increase the events count; show visible validation feedback
- After deleting all events, show an empty state in Events Manager
- Email / contact forms: required fields, email format check, privacy consent required; success state after valid submit; do not POST to a server
- Nav and CTAs must not leave the SPA; serve over local HTTP; desktop and mobile layouts both required
- Intentionally out of scope: real wallet connect, live chain RPC, auth, CMS, or payment flows
</requirements>

## Delivery and integrity

- Integrity: work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
- Delivery: produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; run `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- WebMCP: required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.

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
