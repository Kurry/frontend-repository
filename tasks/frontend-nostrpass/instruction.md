<summary>
Build a frontend-only, local Nostr identity and key manager using SolidJS, Solid stores, and Tailwind CSS.
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
- The initial rendered surface is recognisably a local Nostr identity and key manager, not a generic dashboard or starter page: it opens directly on a dashboard view showing the active identity's name, its public key rendered as an npub1 bech32 string, its private key rendered as an nsec1 bech32 string masked behind dots with a reveal control, and a summary of which of four named applications currently have access
- The app seeds and opens non-empty with at least 2 identities, each holding its own distinct keypair; identities are reachable from an Identities view listing every seeded identity as a card showing its nickname, its npub, and whether it is the active identity
- Filling in a label and submitting the create-identity form adds a new identity with a freshly generated keypair, makes it the active identity, and shows it as a new card; the new identity's key differs from every other identity's key. Submitting the form with an empty label shows a visible validation message and adds no new identity; cancelling the form makes no change
- Clicking an identity's Select control makes it the active identity: the dashboard's displayed nickname, npub, nsec (if reveal state is on), and application-access summary all update to that identity's own data
- From a Permissions view, reviewing or changing one named application's access grant for the active identity (choosing among damus, snort, coracle, or iris) flips only that application's grant for the active identity; the other three applications' grants for that identity, and every application's grants for every other identity, are unchanged
- Switching the active identity to a second seeded identity changes the displayed key on the dashboard to that identity's own npub/nsec, and the Permissions view shows that identity's own grants rather than the grants of the previously active identity
- Clicking the reveal control next to the private key swaps the masked dot string for the real nsec1 value for the active identity; clicking it again re-masks it
- An Audit log view lists a running history of identity and permission actions (creation, selection, permission grant/revoke, theme changes) with the newest entry first, seeded with at least one entry on first load
- A Settings view exposes a single control that switches the app between light and dark theme; the surface recolors immediately without a page reload
- No outbound navigation exists anywhere in the app; every control changes in-app state only
</core_features>

<visual_design>
- A persistent left sidebar shell holds a small vault brand mark and a vertical navigation list (Dashboard, Identities, Permissions, Audit log, Settings); the active nav item is visually distinct from the rest
- The dashboard renders as a single security-focused identity card: an "Active identity" label, the identity nickname, a "Key ready" status badge, a labelled public-key surface (monospace, full npub visible), a labelled private-key surface (monospace, masked by default) with an adjacent reveal/hide button, and a row of small pill badges — one per application — showing Granted or Revoked
- Below the identity card, three compact stat tiles show identity count, connected-app count, and audit-entry count
- Identities view renders identity cards in a responsive grid; the active card is visually highlighted (accent border/background) and carries an "Active" badge; each card exposes Select and Reveal/Hide nsec controls, and an inline create-identity form (label field, submit, cancel) appears above the grid when opened
- Permissions view renders a single panel naming the active identity, with one row per application: app name, a one-line access description, and a switch-style toggle control reflecting granted/revoked
- Audit log view renders a reverse-chronological list of short activity lines, each with a timestamp
- Dark and light theme surfaces are both fully styled (backgrounds, text, borders, badges) — the app must not look unstyled or broken in either theme
- Monospace type is used specifically for npub/nsec key surfaces to signal their cryptographic nature; everything else uses the app's default sans type
</visual_design>

<motion>
- Interactive chrome (nav items, buttons, identity cards, toggles) shows a hover feedback wash — background/border/shadow easing plus a slight lift — on every hover-capable control; this is required, not optional
- The theme switch recolors backgrounds, text, and borders across the whole shell immediately when the Settings control is clicked; there is no flash of unstyled content
- The reveal-key control swaps the masked dot string for the real nsec value only when clicked (a real UI click, not a state shortcut) and swaps back on a second click
- Switching the active identity (via Select) transitions the dashboard's displayed key and permission badges to the new identity's data without a full page reload
- The permission toggle switch animates its handle between the revoked (left) and granted (right) positions when clicked
</motion>

<requirements>
Use SolidJS, Solid stores, and Tailwind CSS for the whole application; state (identities, active identity, per-identity per-app grants, theme, audit log) is held in a Solid store as the single live source of truth.
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
