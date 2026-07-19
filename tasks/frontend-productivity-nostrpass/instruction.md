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

Feature: Dashboard and identities —
- The initial rendered surface is recognisably a local Nostr identity and key manager, not a generic dashboard or starter page: it opens directly on a dashboard view showing the active identity's name, its public key rendered as an npub1 bech32 string, its private key rendered as an nsec1 bech32 string masked behind dots with a reveal control, and a summary of which of four named applications currently have access
- The app seeds and opens non-empty with at least 2 identities, each holding its own distinct keypair; identities are reachable from an Identities view listing every seeded identity as a card showing its nickname, its npub, and whether it is the active identity
- Clicking an identity's Select control makes it the active identity: the dashboard's displayed nickname, npub, nsec (if reveal state is on), and application-access summary all update to that identity's own data
- Clicking the reveal control next to the private key swaps the masked dot string for the real nsec1 value for the active identity; clicking it again re-masks it
- A Copy npub control on the dashboard places the active identity's exact npub string on the clipboard and shows a brief copied confirmation that clears on its own

Feature: Identity create, rename, and delete (API-shaped identity record) —
- An inline create-identity form (label field, submit, cancel) opens above the identity grid; the form models an identity-create request body with a required label field
- Identity field contract (observable everywhere create and rename validate): label is required, trimmed before validation, length at least 1 and at most 40 characters, and must not be whitespace-only; a label that fails any of those rules shows an inline validation message naming the label field, and the submit control stays disabled until the label is valid
- Filling in a valid label and submitting the create-identity form adds a new identity with a freshly generated keypair, makes it the active identity, and shows it as a new card; the new identity's npub differs from every other identity's npub; the created record is the would-be request body plus generated key material (label plus npub, nsec, and grants)
- Each identity card exposes a Rename control that opens an inline rename form pre-filled with the current label; submitting a valid new label updates that identity's nickname on its card, on the dashboard when it is active, and in the vault export preview; an invalid label is rejected with the same field contract as create and leaves the nickname unchanged
- Each identity card exposes a Delete control that opens a confirmation naming the identity; confirming removes exactly that identity, decreases the identity-count stat tile by exactly one, and if the deleted identity was active selects another remaining identity; cancelling leaves the collection unchanged
- Deleting is blocked when only one identity remains: the Delete control stays disabled or confirming shows a visible message that at least one identity must remain, and the identity count does not change

Feature: Permissions —
- From a Permissions view, reviewing or changing one named application's access grant for the active identity (choosing among damus, snort, coracle, or iris) flips only that application's grant for the active identity; the other three applications' grants for that identity, and every application's grants for every other identity, are unchanged
- Each identity's grants object carries exactly four boolean keys — damus, snort, coracle, iris — visible as Granted or Revoked pills on the dashboard and as switch state in Permissions; a newly created identity starts with all four grants false (Revoked)

Feature: Search and sort —
- A search field on the Identities view narrows the card grid to identities whose nickname or npub contains the query as the user types; clearing the field restores every identity card exactly
- A sort control offers Label A–Z and Label Z–A; switching between them reverses the visible card order relative to the other choice, and the order is derived from the live collection rather than two hardcoded lists

Feature: Audit log and theme —
- An Audit log view lists a running history of identity and permission actions (creation, rename, delete, selection, permission grant/revoke, theme changes, vault export, vault import) with the newest entry first, seeded with at least one entry on first load
- A Settings view exposes a single control that switches the app between light and dark theme; the surface recolors immediately without a page reload

Feature: Undo and redo —
- Undo reverses the most recent mutating action — create, rename, delete, select, permission toggle, or successful vault import — and restores the prior identities, active identity, grants, and derived counts
- Redo reapplies the most recently undone action with the same completeness; performing a new mutating action after an undo clears the redo stack and disables Redo
- Undo and Redo controls show enabled/disabled states that match whether a step is available

Feature: Vault export and import (useful end state) —
- The app produces the user's vault file: an Export vault control opens a drawer with a monospaced JSON preview compiled LIVE from the store, plus Copy and Download controls
- The vault JSON is API-shaped like a Nostr identity-vault payload: a top-level object with version string exactly nostrpass-vault-v1, activeLabel (string matching one identity's label), theme (exactly light or dark), and an identities array with at least one entry; each identity object carries label (string, 1–40 trimmed characters), npub (string starting with npub1), nsec (string starting with nsec1), and grants (object with exactly the four boolean keys damus, snort, coracle, iris)
- Export content must reflect every mutation the session made — a create, rename, delete, select, permission toggle, or theme change that is visible in the UI must appear in the compiled vault JSON before copy or download
- Copy places the visible vault JSON on the clipboard and shows a brief copied confirmation; Download starts a file download of that same JSON text
- Import vault accepts previously exported vault JSON that passes the same schema: after a confirmation that warns the current vault will be replaced, a successful import replaces identities, active identity, grants, and theme so the dashboard, Identities grid, Permissions view, and export preview all match the imported vault
- Import rejects non-conforming payloads without mutating the collection: malformed JSON, version not exactly nostrpass-vault-v1, missing identities array, fewer than one identity, an identity missing label/npub/nsec/grants, a label outside the 1–40 trimmed contract, an npub not starting with npub1, an nsec not starting with nsec1, grants missing any of the four app keys, or theme outside light/dark shows an inline error naming the import field and leaves identity count, labels, and grants unchanged

Feature: Session chrome —
- No outbound navigation exists anywhere in the app; every control changes in-app state only
</core_features>

<user_flows>
End-to-end flows (state must stay coherent across every surface named in each chain):
- Create-and-export flow: submitting the create-identity form with a valid label adds exactly one new card to the Identities grid, increases the dashboard's identity-count stat tile by exactly one, makes the new identity the active one (the dashboard shows its nickname and its freshly generated npub), pushes a creation entry to the top of the Audit log, and the Export vault JSON preview includes that identity's label, npub, nsec, and all-false grants — all without a reload
- Permission-toggle flow: toggling one application's grant for the active identity in the Permissions view flips that application's pill badge on the dashboard between Granted and Revoked, changes the dashboard's connected-app stat tile by exactly one in the matching direction, adds a grant or revoke entry at the top of the Audit log, and updates that same boolean in the Export vault JSON preview for that identity; selecting a different identity immediately afterwards shows that identity's own unmodified grants
- Identity-switch flow: selecting a second seeded identity from the Identities view updates the dashboard's nickname, npub, and per-application pill badges to that identity's own data, updates the Permissions view to show that identity's own grants rather than the previously active identity's, records a selection entry at the top of the Audit log, and sets activeLabel in the Export vault JSON preview to that identity's label
- Rename then undo: renaming an identity updates its card label and, when it is active, the dashboard nickname and the export preview's matching label; Undo restores the prior label on every surface and in the export preview
- Delete then undo: confirming delete on a non-sole identity decreases the identity count by exactly one, removes its card, and drops it from the export preview; Undo restores that identity with the same npub and grants
- Export then import round-trip: after mutating the vault (create or toggle at least one grant), Copy or Download the vault JSON, then Import that same JSON text — after confirmation the dashboard, Identities grid, Permissions grants, theme, and export preview match the pre-export mutated state including version nostrpass-vault-v1, activeLabel, theme, and each identity's label, npub, nsec, and grants
- Search and sort coherence: typing a search that matches one identity shows only that card; clearing search restores all cards; switching Label A–Z to Label Z–A reverses card order relative to the prior sort
- A page reload returns the app to its seeded state: the seeded identities with their original labels and keys, the original active identity, the original grants, light or the seeded theme, empty undo/redo stacks, and no search query — session mutations do not survive the reload
</user_flows>

<edge_cases>
- Submitting the create-identity form with an empty or whitespace-only label, or a label longer than 40 characters, shows a visible inline validation message naming the label field and adds no new identity: the identity count and the Identities grid are unchanged
- Cancelling the create-identity form or the rename form makes no change: no identity is added or renamed, no count changes, and no audit entry is recorded
- Double-activating the create-identity submit control creates exactly one identity: the card count and the identity-count stat tile increase by exactly one
- Revealing one identity's nsec does not reveal any other identity's nsec: each reveal control is independent, and switching the active identity does not carry a revealed state onto the new identity's dashboard key surface
- A very long identity label (exactly 40 characters) does not break the card layout: the label truncates or wraps within its card without overlapping the npub text or neighbouring cards
- Attempting to delete the last remaining identity leaves the collection unchanged and shows a visible explanation that at least one identity must remain
- Cancelling a delete confirmation or an import confirmation leaves identities, grants, theme, and the export preview unchanged
- A search that matches no identities shows an empty state in the Identities grid with a clear-search control that restores every card
- Importing malformed vault JSON, or vault JSON that violates the field contract (wrong version, empty identities, invalid label bounds, npub/nsec prefix, grants keys, or theme enum), shows an inline error naming the import field, leaves the identity count and labels unchanged, and does not treat the attempt as a successful import for undo
- After Undo restores a deleted identity, Redo deletes it again; after a new create following an undo, Redo is disabled and cannot resurrect the cleared redo stack
</edge_cases>

<visual_design>
- A persistent left sidebar shell holds a small vault brand mark and a vertical navigation list (Dashboard, Identities, Permissions, Audit log, Settings); the active nav item is visually distinct from the rest
- Navigation items, stat tiles, and permission rows each carry a small crisp icon from one consistent icon set; no two views mix visibly different icon styles
- The dashboard renders as a single security-focused identity card: an Active identity label, the identity nickname, a Key ready status badge, a labelled public-key surface (monospace, full npub visible) with an adjacent Copy npub control, a labelled private-key surface (monospace, masked by default) with an adjacent reveal/hide button, and a row of small pill badges — one per application — showing Granted or Revoked
- Below the identity card, three compact stat tiles show identity count, connected-app count, and audit-entry count
- Identities view renders identity cards in a responsive grid with a search field, sort control, and Undo/Redo and Export vault controls in the toolbar; the active card is visually highlighted (accent border/background) and carries an Active badge; each card exposes Select, Rename, Delete, and Reveal/Hide nsec controls, and an inline create-identity form (label field, submit, cancel) appears above the grid when opened
- Permissions view renders a single panel naming the active identity, with one row per application: app name, a one-line access description, and a switch-style toggle control reflecting granted/revoked
- Audit log view renders a reverse-chronological list of short activity lines, each with a timestamp
- The Export vault drawer shows a monospaced JSON preview, Copy, Download, and an Import vault control with confirmation
- Dark and light theme surfaces are both fully styled (backgrounds, text, borders, badges) — the app must not look unstyled or broken in either theme
- Monospace type is used specifically for npub/nsec key surfaces and the vault JSON preview to signal their cryptographic nature; everything else uses the app's default sans type
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
- Creating an identity, changing a permission grant, copying npub, exporting, or importing surfaces a brief confirmation toast that slides in, remains readable, and auto-dismisses with a fade
- The Export vault drawer slides in from the side; delete and import confirmations enter and exit with a brief transition rather than popping instantly
- With prefers-reduced-motion set, entrance and toggle animations are removed and state changes apply instantly; every feature remains fully usable
</motion>

<responsiveness>
- At widths of 768 pixels and below, the persistent sidebar collapses to a compact navigation control that opens the same five destinations; at desktop widths the sidebar is open by default
- The Identities grid reflows from multiple columns at desktop widths to a single column at 375 pixel width
- No content clips or overflows the viewport, and no horizontal scrolling appears at 375 pixel width; npub and nsec strings and the vault JSON preview wrap or truncate within their surfaces rather than forcing overflow
</responsiveness>

<accessibility>
- Every interactive control (nav items, Select, Rename, Delete, reveal/hide, Copy npub, permission toggles, form fields, theme switch, Undo, Redo, Export vault, Import vault) is reachable and operable with the keyboard alone, with a visible focus indicator
- Permission toggles expose their on/off state to assistive technology as real switch controls, and the reveal/hide control's accessible name reflects its current state
- Delete and import confirmations open as dialogs: focus moves into the dialog while open, Escape closes without applying the action, and focus returns to the control that opened it
- The create-identity and rename forms' validation messages, and import field errors, are announced via a polite live region as well as shown visually
- Text keeps readable contrast against its background in both light and dark themes, including badge and pill text
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear during a full exercise of the app (create, rename, delete, select, toggle, reveal, copy, export, import, theme switch, undo, redo, reload)
- The UI stays responsive under rapid repeated input — quickly toggling permissions, switching identities, or undoing and redoing — produces no hangs, dropped updates, or mixed-identity states
</performance>

<writing>
- Validation and import errors name the offending field and the fix (empty label, label too long, wrong vault version, missing grants key) rather than a generic Invalid message
- Empty search state copy explains that no identities match and how to clear the search
- Control labels use one consistent capitalization convention and specific verbs (Select, Rename, Delete, Export vault, Import vault, Copy npub) rather than generic OK or Submit where a specific label is possible
- No placeholder or lorem-ipsum text appears anywhere in the shipped UI
</writing>

<requirements>
Use SolidJS with Solid stores, Tailwind CSS 4.3.2 (pinned), and Ark UI for the whole application; state (identities, active identity, per-identity per-app grants, theme, audit log, search query, sort order, undo/redo stacks, export drawer, import errors, and UI chrome) is held in a Solid store as the single live source of truth, and every view derives from that one store. Do not use localStorage, sessionStorage, or other browser storage APIs — persistence for this good-app is the exportable vault JSON plus the MCP export surface.
State contracts (behavioral):
- Creating a valid identity increases the identity count, generates a distinct keypair, becomes the new active identity, and appears in the vault export preview
- Renaming updates that identity's label everywhere it appears (card, dashboard when active, activeLabel when active, export preview)
- Deleting removes the identity from the grid, counts, grants surfaces, and export preview; the last remaining identity cannot be deleted
- Selecting an identity updates the active identity everywhere it is displayed (dashboard key surfaces, permission badges, permissions view, export activeLabel) without mixing in another identity's data
- Toggling one application's grant for the active identity changes only that application's grant for that identity; every other application/identity combination is unaffected; the export preview's grants object updates to match
- Reveal/hide of the private key is local UI state that does not affect any other identity's reveal state
- Undo/redo walk the same shared history the visible controls write
- Theme and active view are shared state changes that do not reload the document
- WebMCP tool handlers invoke the same store commands the visible controls use
No authentication wall — the app opens directly into the dashboard view.
Seed at least 2 identities on first load, each with its own generated keypair and its own independent set of application grants across exactly four named applications (damus, snort, coracle, iris).
A page reload returns the app to that seeded baseline; session mutations do not survive the reload.
No backend, no network calls, and no simulated Nostr relay connection; the app is entirely self-contained and works offline.
Public keys are rendered as npub1-prefixed strings and private keys as nsec1-prefixed strings; keys must be real bech32-encoded values generated at identity-creation time, not placeholder text.
Forms and schemas: all forms (create-identity, rename, and vault import) are driven by Felte paired with a Zod schema; schemas are API-shaped — the create/rename schema models the identity-create request body (required label string, trimmed, length 1–40), the vault import schema models the nostrpass-vault-v1 document (version, activeLabel, theme enum light/dark, identities array of label/npub/nsec/grants records with the four grant booleans), the record a form creates is the would-be request body, and vault JSON export and import compile and validate against that same vault schema; inline per-field errors appear before submit, with submit disabled until the schema passes.
Component library: Ark UI (Solid) provides the interactive primitives — the permission switch toggles, the theme switch, the toast surface, the export drawer, and dialog/disclosure chrome where used; do not hand-roll these primitives.
Animation: Motion (the vanilla motion.dev package) and CSS transitions are allowed for animation; no other animation libraries.
Icons: Tabler icons only, via the @tabler/icons-solidjs package.
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
- Destinations: dashboard; identities; permissions; audit-log; settings; export-drawer
- Themes: light; dark
- Browsable entity: identities
- Filters: search
- Sorts: label-asc; label-desc
- Entity: identity
- Entity operations: create; select; update; delete; toggle
- Entity fields: label; npub; nsec; grants
- Apps: damus; snort; coracle; iris
- Artifact operations: export; import; copy
- Export formats: json
- Import modes: vault-json

Mechanics exclusions:
- Reveal-key and theme-toggle animation stay Playwright-observed
- File-picker Import and Download artifact bytes stay Playwright-only per artifact-transfer no-raw-file-contents restriction
- Clipboard contents verification for Copy npub and Copy vault JSON stay Playwright responsibilities

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
