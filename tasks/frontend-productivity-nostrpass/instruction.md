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

Feature: Key rotation (undoable) —
- Each identity card and the dashboard (for the active identity) expose a Rotate keys control that opens a confirmation naming the identity and warning that its current keypair will be replaced; confirming generates a fresh keypair for exactly that identity: its npub and nsec change to new valid bech32 values distinct from its own prior values and from every other identity's, while its label and grants are unchanged
- A confirmed rotation records an audit entry at the top of the Audit log naming the identity and showing shortened forms of both the old and the new npub
- Rotation is undoable: Undo restores exactly the prior npub and nsec (matching a value copied before the rotation), and Redo reapplies the rotated pair; cancelling the rotation confirmation changes nothing and records no audit entry
- Rotating one identity never changes any other identity's keys, and rotating the same identity twice yields a third distinct npub

Feature: Bulk permissions across identities —
- The Permissions view, below the active-identity panel, renders an All identities matrix: one row per identity, one column per application (damus, snort, coracle, iris), each cell a switch showing that identity-application grant
- Toggling a single matrix cell behaves exactly like toggling that grant with that identity active: the identity's dashboard pills, stat tiles, export preview, and audit log stay consistent
- Each application column offers Grant all and Revoke all controls: activating one sets that application's grant for every identity in a single action, updates every affected cell, pill, and count together, and records one audit entry naming the application and how many identities changed
- A bulk grant or revoke is a single undo step: Undo after Grant all restores every identity's prior grant for that application (identities that already had the target state stay unchanged), and Redo reapplies the bulk change

Feature: Identity key backup (per-identity export and import) —
- Each identity card and the dashboard expose an Export backup control that opens a surface with a single-identity Key Backup JSON preview compiled live from the store, plus Copy (with confirmation) and Download controls; a square QR-style placeholder tile, labelled as a placeholder rendering of the backup, accompanies the preview
- Key Backup JSON field contract: a top-level object with version exactly nostrpass-backup-v1, exportedAt (ISO-8601 date-time), and identity (object carrying label — 1–40 trimmed characters, npub — string starting with npub1, nsec — string starting with nsec1, and grants — object with exactly the four boolean keys damus, snort, coracle, iris); the backup for an identity carries that identity's actual current label, keys, and grants
- Import backup accepts pasted or file-picked Key Backup JSON validated against that same schema: a valid backup whose npub matches no existing identity adds it as a new identity card (identity count increases by exactly one, an audit entry is recorded, and the import is undoable); a backup whose npub matches an existing identity is rejected with an inline error naming the npub conflict and changes nothing
- A backup that fails the field contract (wrong version, missing identity keys, bad npub1/nsec1 prefix, label outside 1–40 trimmed characters, grants missing any of the four keys) shows an inline error naming the offending field and changes nothing

Feature: Search and sort —
- A search field on the Identities view narrows the card grid to identities whose nickname or npub contains the query as the user types; clearing the field restores every identity card exactly
- A sort control offers Label A–Z and Label Z–A; switching between them reverses the visible card order relative to the other choice, and the order is derived from the live collection rather than two hardcoded lists

Feature: Audit log and theme —
- An Audit log view lists a running history of identity and permission actions (creation, rename, delete, selection, permission grant/revoke, bulk grant/revoke, key rotation, backup export, backup import, theme changes, vault export, vault import) with the newest entry first, seeded with at least one entry on first load
- The Audit log toolbar offers an action-type filter (All plus one choice per recorded action type); choosing a type narrows the list to entries of that type without mutating the log, an empty filtered result shows an empty state naming the filter, and returning to All restores every entry in the same order
- A Settings view exposes a single control that switches the app between light and dark theme; the surface recolors immediately without a page reload

Feature: Undo and redo —
- Undo reverses the most recent mutating action — create, rename, delete, select, permission toggle, bulk grant/revoke, key rotation, successful backup import, or successful vault import — and restores the prior identities, active identity, keys, grants, and derived counts
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
- Rotation round-trip: copy or note the active identity's npub, activate Rotate keys, and confirm; the dashboard npub and nsec change to fresh values, the vault export preview shows the new npub, and the Audit log's top entry names the rotation with shortened old and new npubs; Undo restores exactly the noted prior npub on the dashboard and in the export preview; Redo reapplies the rotated pair
- Bulk grant flow: with at least three identities present, activating Grant all in one application's matrix column flips that application's cell to granted for every identity, updates the active identity's dashboard pill and connected-app stat tile to match, and records one audit entry naming the application and the number of identities changed; a single Undo restores every identity's prior grant for that application
- Backup round-trip: open Export backup for a non-active identity, Copy or Download its Key Backup JSON, delete that identity (confirming), then Import backup with that same JSON — the identity returns as a card with the same label, npub, nsec, and grants, the identity count returns to its prior value, and the vault export preview contains it again
- Audit filter flow: after performing at least one permission toggle and one rotation, filtering the Audit log to the rotation type shows only rotation entries, and returning the filter to All restores the full list in the same order
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
- Cancelling the rotate-keys confirmation leaves the identity's npub and nsec unchanged and records no audit entry
- Importing a Key Backup whose npub matches an existing identity is rejected with an inline error naming the npub conflict; the identity count, cards, and grants are unchanged
- Activating Grant all when every identity already has that application granted leaves every cell granted and does not flip any grant to revoked; a following Undo restores the state that preceded the bulk action
- Filtering the Audit log to a type with no recorded entries shows an empty state naming the filter, and clearing the filter restores the full list
</edge_cases>

<visual_design>
- A persistent left sidebar shell holds a small vault brand mark and a vertical navigation list (Dashboard, Identities, Permissions, Audit log, Settings); the active nav item is visually distinct from the rest
- Navigation items, stat tiles, and permission rows each carry a small crisp icon from one consistent icon set; no two views mix visibly different icon styles
- The dashboard renders as a single security-focused identity card: an Active identity label, the identity nickname, a Key ready status badge, a labelled public-key surface (monospace, full npub visible) with an adjacent Copy npub control, a labelled private-key surface (monospace, masked by default) with an adjacent reveal/hide button, and a row of small pill badges — one per application — showing Granted or Revoked
- Below the identity card, three compact stat tiles show identity count, connected-app count, and audit-entry count
- Identities view renders identity cards in a responsive grid with a search field, sort control, and Undo/Redo and Export vault controls in the toolbar; the active card is visually highlighted (accent border/background) and carries an Active badge; each card exposes Select, Rename, Delete, and Reveal/Hide nsec controls, and an inline create-identity form (label field, submit, cancel) appears above the grid when opened
- Permissions view renders a single panel naming the active identity, with one row per application: app name, a one-line access description, and a switch-style toggle control reflecting granted/revoked
- Below the active-identity panel, the All identities matrix renders as a table with one row per identity (labelled with its nickname), one column per application, switch cells at every intersection, and per-column Grant all and Revoke all controls in the column headers; when wider than its panel the matrix scrolls inside the panel rather than overflowing the page
- Audit log view renders a reverse-chronological list of short activity lines, each with a timestamp, and an action-type filter control in its toolbar
- Each identity card and the dashboard carry a Rotate keys control alongside Select, Rename, and Delete, with a confirmation dialog naming the identity before any rotation applies
- The Export backup surface shows a monospaced single-identity JSON preview, Copy, Download, and a square QR-style placeholder tile visibly labelled as a placeholder
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
- The permission toggle switch animates its handle between the revoked (left) and granted (right) positions when clicked; matrix cell switches animate the same way, and a bulk Grant all or Revoke all animates every affected switch in the same moment
- After a confirmed key rotation, the dashboard's npub and nsec surfaces transition to the new values with a brief crossfade rather than snapping
- A newly created identity's card animates into the Identities grid (a brief entrance ease of roughly 150 to 300 milliseconds) rather than appearing instantly
- New Audit log entries animate in at the top of the list when an action is recorded while the view is visible
- Creating an identity, changing a permission grant, copying npub, exporting, or importing surfaces a brief confirmation toast that slides in, remains readable, and auto-dismisses with a fade
- The Export vault drawer slides in from the side; delete and import confirmations enter and exit with a brief transition rather than popping instantly
- With prefers-reduced-motion set, entrance and toggle animations are removed and state changes apply instantly; every feature remains fully usable
</motion>

<responsiveness>
- At widths of 768 pixels and below, the persistent sidebar collapses to a compact navigation control that opens the same five destinations; at desktop widths the sidebar is open by default
- The Identities grid reflows from multiple columns at desktop widths to a single column at 375 pixel width
- No content clips or overflows the viewport, and no horizontal scrolling appears at 375 pixel width; npub and nsec strings and the vault and backup JSON previews wrap or truncate within their surfaces rather than forcing overflow, and the permissions matrix scrolls inside its own panel at narrow widths
</responsiveness>

<accessibility>
- Every interactive control (nav items, Select, Rename, Delete, Rotate keys, reveal/hide, Copy npub, permission toggles, matrix cell switches, Grant all/Revoke all, audit filter, form fields, theme switch, Undo, Redo, Export vault, Import vault, Export backup, Import backup) is reachable and operable with the keyboard alone, with a visible focus indicator
- Permission toggles expose their on/off state to assistive technology as real switch controls, and the reveal/hide control's accessible name reflects its current state; each matrix cell switch has an accessible name that names both its identity and its application
- Delete, rotation, and import confirmations open as dialogs: focus moves into the dialog while open, Escape closes without applying the action, and focus returns to the control that opened it
- The create-identity and rename forms' validation messages, and import field errors, are announced via a polite live region as well as shown visually
- Text keeps readable contrast against its background in both light and dark themes, including badge and pill text
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear during a full exercise of the app (create, rename, delete, select, toggle, bulk grant/revoke, rotate, reveal, copy, export, import, backup export/import, audit filter, theme switch, undo, redo, reload)
- The UI stays responsive under rapid repeated input — quickly toggling permissions, switching identities, or undoing and redoing — produces no hangs, dropped updates, or mixed-identity states
- A bulk Grant all or Revoke all across every identity applies as one immediate visible update with no per-row lag or partially applied intermediate states left on screen
</performance>

<writing>
- Validation and import errors name the offending field and the fix (empty label, label too long, wrong vault version, wrong backup version, npub conflict, missing grants key) rather than a generic Invalid message
- Audit entries name the action and the identity; rotation entries include shortened forms of the old and new npub; bulk entries name the application and the number of identities changed
- Empty search state copy explains that no identities match and how to clear the search
- Control labels use one consistent capitalization convention and specific verbs (Select, Rename, Delete, Export vault, Import vault, Copy npub) rather than generic OK or Submit where a specific label is possible
- No placeholder or lorem-ipsum text appears anywhere in the shipped UI
</writing>

<requirements>
Use SolidJS with Solid stores, Tailwind CSS 4.3.2 (pinned), and Ark UI for the whole application; state (identities, active identity, per-identity per-app grants, theme, audit log and its action-type filter, search query, sort order, undo/redo stacks, export and backup drawers, import errors, and UI chrome) is held in a Solid store as the single live source of truth, and every view derives from that one store. Do not use localStorage, sessionStorage, or other browser storage APIs — persistence for this good-app is the exportable vault JSON plus the MCP export surface.
State contracts (behavioral):
- Creating a valid identity increases the identity count, generates a distinct keypair, becomes the new active identity, and appears in the vault export preview
- Renaming updates that identity's label everywhere it appears (card, dashboard when active, activeLabel when active, export preview)
- Deleting removes the identity from the grid, counts, grants surfaces, and export preview; the last remaining identity cannot be deleted
- Selecting an identity updates the active identity everywhere it is displayed (dashboard key surfaces, permission badges, permissions view, export activeLabel) without mixing in another identity's data
- Toggling one application's grant for the active identity changes only that application's grant for that identity; every other application/identity combination is unaffected; the export preview's grants object updates to match
- Reveal/hide of the private key is local UI state that does not affect any other identity's reveal state
- Rotating an identity replaces only that identity's keypair (label and grants untouched) and every surface showing its keys updates together
- A bulk grant/revoke mutates every affected identity's grant in one history step; the matrix, per-identity pills, stat tiles, and export preview never disagree
- Backup export compiles from the live store; backup import adds exactly one identity and is rejected on npub conflict without partial application
- Undo/redo walk the same shared history the visible controls write
- Theme and active view are shared state changes that do not reload the document
- WebMCP tool handlers invoke the same store commands the visible controls use
No authentication wall — the app opens directly into the dashboard view.
Seed at least 2 identities on first load, each with its own generated keypair and its own independent set of application grants across exactly four named applications (damus, snort, coracle, iris).
A page reload returns the app to that seeded baseline; session mutations do not survive the reload.
No backend, no network calls, and no simulated Nostr relay connection; the app is entirely self-contained and works offline.
Public keys are rendered as npub1-prefixed strings and private keys as nsec1-prefixed strings; keys must be real bech32-encoded values generated at identity-creation time, not placeholder text.
Forms and schemas: all forms (create-identity, rename, vault import, and backup import) are driven by Felte paired with a Zod schema; schemas are API-shaped — the create/rename schema models the identity-create request body (required label string, trimmed, length 1–40), the vault import schema models the nostrpass-vault-v1 document (version, activeLabel, theme enum light/dark, identities array of label/npub/nsec/grants records with the four grant booleans), and the backup schema models the nostrpass-backup-v1 document (version, exportedAt, and one identity record of label/npub/nsec/grants); the record a form creates is the would-be request body, and vault and backup JSON export and import compile and validate against those same schemas; inline per-field errors appear before submit, with submit disabled until the schema passes.
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
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
- Self-test tooling is preinstalled and optional to use: `playwright@1.61.0` and `@playwright/mcp` are installed globally with browsers ready under `/ms-playwright`, a shared headless Chrome already exposes CDP at `http://127.0.0.1:9222`, and the same CDP bridge the verifier runs is baked at `/opt/webmcp/webmcp_stdio_server.mjs`. Drive your served app through that Chrome (playwright `connectOverCDP`, or `npx @playwright/mcp --cdp-endpoint http://127.0.0.1:9222`), and run `node /opt/webmcp/webmcp_stdio_server.mjs` (stdio MCP; defaults to that endpoint) to exercise your registered `window.webmcp_*` tools exactly as the verifier will.
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
