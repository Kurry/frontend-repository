<summary>
Build a frontend-only, local Nostr identity and key manager using SolidJS, Solid stores, Tailwind CSS 4.3.2, and Ark UI.
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
- The initial rendered surface is recognisably a local Nostr identity and key manager, not a generic dashboard or starter page: it opens directly on a dashboard view showing the active identity's name, its public key rendered as an npub1 bech32 string, its private key rendered as an nsec1 bech32 string masked behind dots with a reveal control, and a summary of which of four named applications currently have access
- The app seeds and opens non-empty with at least 2 identities, each holding its own distinct keypair; identities are reachable from an Identities view listing every seeded identity as a card showing its nickname, its npub, and whether it is the active identity
- An inline create-identity form (label field, submit, cancel) opens above the identity grid; while the label field is empty or contains only whitespace, an inline validation message naming the label field appears on interaction and the submit control stays disabled
- Filling in a label and submitting the create-identity form adds a new identity with a freshly generated keypair, makes it the active identity, and shows it as a new card; the new identity's key differs from every other identity's key
- Clicking an identity's Select control makes it the active identity: the dashboard's displayed nickname, npub, nsec (if reveal state is on), and application-access summary all update to that identity's own data
- From a Permissions view, reviewing or changing one named application's access grant for the active identity (choosing among damus, snort, coracle, or iris) flips only that application's grant for the active identity; the other three applications' grants for that identity, and every application's grants for every other identity, are unchanged
- Clicking the reveal control next to the private key swaps the masked dot string for the real nsec1 value for the active identity; clicking it again re-masks it
- An Audit log view lists a running history of identity and permission actions (creation, selection, permission grant/revoke, theme changes) with the newest entry first, seeded with at least one entry on first load
- A Settings view exposes a single control that switches the app between light and dark theme; the surface recolors immediately without a page reload
- No outbound navigation exists anywhere in the app; every control changes in-app state only
</core_features>

<user_flows>
End-to-end flows (state must stay coherent across every surface named in each chain):
- Create-and-persist flow: submitting the create-identity form with a valid label adds exactly one new card to the Identities grid, increases the dashboard's identity-count stat tile by exactly one, makes the new identity the active one (the dashboard shows its nickname and its freshly generated npub), and pushes a creation entry to the top of the Audit log — all without a reload; after a full page reload the new identity is still present with the same npub, is still the active identity, and the identity count still reflects it
- Permission-toggle flow: toggling one application's grant for the active identity in the Permissions view flips that application's pill badge on the dashboard between Granted and Revoked, changes the dashboard's connected-app stat tile by exactly one in the matching direction, and adds a grant or revoke entry at the top of the Audit log; selecting a different identity immediately afterwards shows that identity's own unmodified grants, and a full page reload restores the toggled grant exactly as it was set
- Identity-switch flow: selecting a second seeded identity from the Identities view updates the dashboard's nickname, npub, and per-application pill badges to that identity's own data, updates the Permissions view to show that identity's own grants rather than the previously active identity's, and records a selection entry at the top of the Audit log; after a full page reload the same identity is still active with the same npub
</user_flows>

<edge_cases>
- Submitting the create-identity form with an empty or whitespace-only label shows a visible inline validation message naming the label field and adds no new identity: the identity count and the Identities grid are unchanged
- Cancelling the create-identity form makes no change: no identity is added, no count changes, and no audit entry is recorded
- Double-activating the create-identity submit control creates exactly one identity: the card count and the identity-count stat tile increase by exactly one
- Revealing one identity's nsec does not reveal any other identity's nsec: each reveal control is independent, and switching the active identity does not carry a revealed state onto the new identity's dashboard key surface
- A very long identity label (over 40 characters) does not break the card layout: the label truncates or wraps within its card without overlapping the npub text or neighbouring cards
</edge_cases>

<visual_design>
- A persistent left sidebar shell holds a small vault brand mark and a vertical navigation list (Dashboard, Identities, Permissions, Audit log, Settings); the active nav item is visually distinct from the rest
- Navigation items, stat tiles, and permission rows each carry a small crisp icon from one consistent icon set; no two views mix visibly different icon styles
- The dashboard renders as a single security-focused identity card: an "Active identity" label, the identity nickname, a "Key ready" status badge, a labelled public-key surface (monospace, full npub visible), a labelled private-key surface (monospace, masked by default) with an adjacent reveal/hide button, and a row of small pill badges — one per application — showing Granted or Revoked
- Below the identity card, three compact stat tiles show identity count, connected-app count, and audit-entry count
- Identities view renders identity cards in a responsive grid; the active card is visually highlighted (accent border/background) and carries an "Active" badge; each card exposes Select and Reveal/Hide nsec controls, and an inline create-identity form (label field, submit, cancel) appears above the grid when opened
- Permissions view renders a single panel naming the active identity, with one row per application: app name, a one-line access description, and a switch-style toggle control reflecting granted/revoked
- Audit log view renders a reverse-chronological list of short activity lines, each with a timestamp
- Dark and light theme surfaces are both fully styled (backgrounds, text, borders, badges) — the app must not look unstyled or broken in either theme
- Monospace type is used specifically for npub/nsec key surfaces to signal their cryptographic nature; everything else uses the app's default sans type
- Buttons, inputs, and toggles show distinct default, hover, focus (visible ring), and disabled treatments in both themes
</visual_design>

<motion>
- Interactive chrome (nav items, buttons, identity cards, toggles) shows a hover feedback wash — background/border/shadow easing plus a slight lift — on every hover-capable control; this is required, not optional
- The theme switch recolors backgrounds, text, and borders across the whole shell immediately when the Settings control is clicked; there is no flash of unstyled content
- The reveal-key control swaps the masked dot string for the real nsec value only when clicked (a real UI click, not a state shortcut) and swaps back on a second click
- Switching the active identity (via Select) transitions the dashboard's displayed key and permission badges to the new identity's data without a full page reload
- The permission toggle switch animates its handle between the revoked (left) and granted (right) positions when clicked
- A newly created identity's card animates into the Identities grid (a brief entrance ease of roughly 150 to 300 milliseconds) rather than appearing instantly
- New Audit log entries animate in at the top of the list when an action is recorded while the view is visible
- Creating an identity or changing a permission grant surfaces a brief confirmation toast that slides in, remains readable, and auto-dismisses with a fade
- With prefers-reduced-motion set, entrance and toggle animations are removed and state changes apply instantly; every feature remains fully usable
</motion>

<responsiveness>
- At widths of 768 pixels and below, the persistent sidebar collapses to a compact navigation control that opens the same five destinations; at desktop widths the sidebar is open by default
- The Identities grid reflows from multiple columns at desktop widths to a single column at 375 pixel width
- No content clips or overflows the viewport, and no horizontal scrolling appears at 375 pixel width; npub and nsec strings wrap or truncate within their surfaces rather than forcing overflow
</responsiveness>

<accessibility>
- Every interactive control (nav items, Select, reveal/hide, permission toggles, form fields, theme switch) is reachable and operable with the keyboard alone, with a visible focus indicator
- Permission toggles expose their on/off state to assistive technology as real switch controls, and the reveal/hide control's accessible name reflects its current state
- The create-identity form's validation message is announced via a polite live region as well as shown visually
- Text keeps readable contrast against its background in both light and dark themes, including badge and pill text
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear during a full exercise of the app (create, select, toggle, reveal, theme switch, reload)
- The UI stays responsive under rapid repeated input — quickly toggling permissions or switching identities produces no hangs, dropped updates, or mixed-identity states
</performance>

<requirements>
Use SolidJS with Solid stores, Tailwind CSS 4.3.2 (pinned), and Ark UI for the whole application; state (identities, active identity, per-identity per-app grants, theme, audit log) is held in a Solid store as the single live source of truth, and every view derives from that one store.
State contracts (behavioral):
- Creating a valid identity increases the identity count, generates a distinct keypair, and becomes the new active identity
- Selecting an identity updates the active identity everywhere it is displayed (dashboard key surfaces, permission badges, permissions view) without mixing in another identity's data
- Toggling one application's grant for the active identity changes only that application's grant for that identity; every other application/identity combination is unaffected
- Reveal/hide of the private key is local UI state that does not affect any other identity's reveal state
- Theme and active view are shared state changes that do not reload the document
No authentication wall — the app opens directly into the dashboard view.
Persist identities (including stable key material), the active identity, per-identity per-app permission grants, and theme to localStorage (or equivalent client storage) so a full page reload restores the same identities with the same keys, the same active identity, and the same permission grants.
Seed at least 2 identities on first load, each with its own generated keypair and its own independent set of application grants across exactly four named applications (damus, snort, coracle, iris).
No backend, no network calls, and no simulated Nostr relay connection; the app is entirely self-contained and works offline.
Public keys are rendered as npub1-prefixed strings and private keys as nsec1-prefixed strings; keys must be real bech32-encoded values generated at identity-creation time (or reconstructed deterministically from persisted key material on reload), not placeholder text.
Component library: Ark UI (Solid) provides the interactive primitives — the permission switch toggles, the theme switch, the toast surface, and dialog/disclosure chrome where used; do not hand-roll these primitives.
Animation: Motion (the vanilla motion.dev package) and CSS transitions are allowed for animation; no other animation libraries.
Icons: Tabler icons only, via the @tabler/icons-solidjs package.
Forms: all forms (including the create-identity form) are driven by Felte paired with a Zod schema; the schema defines the validation rules and the form surfaces inline per-field errors before submit, with submit disabled until the schema passes.
Build tooling: Vite or an equivalent SPA setup. All libraries are installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
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
- Destinations: dashboard; identities; permissions; audit-log; settings
- Themes: light; dark
- Entity: identity
- Entity operations: create; select; toggle
- Entity fields: label; npub
- Apps: damus; snort; coracle; iris

Mechanics exclusions:
- Reveal-key and theme-toggle animation stay Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
