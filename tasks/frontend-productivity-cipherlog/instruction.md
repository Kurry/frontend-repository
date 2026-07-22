<summary>
Build a CipherLog covert-transmissions memo log using Svelte 5, Svelte stores, Tailwind CSS 4.3.2, and Melt.
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
- The app opens directly at the root into a three-region workspace with no login or registration wall: a header carrying the CipherLog wordmark, a Theme Core selector, and a Create New Transmission button; a Channels sidebar on the left; and a main content area on the right that shows the memo list
Feature: Transmission field contract —
- Create New Transmission opens a new memo for immediate editing with a Title field and a monospaced body text area; a successful save creates a transmission record that IS the would-be request body for a transmissions API, matching this field contract: title (required trimmed string, 1 to 120 characters); body (required string, may be empty, at most 20000 characters); priority (required enum exactly high, standard, or low); channel (required non-empty string naming an existing channel); locked (required boolean); passcode (string of exactly 4 characters when locked is true, and null or absent when locked is false); firstTransmitted and lastModified (required ISO-8601 timestamp strings); marks (required array of mark objects, each with start and end non-negative integers with end greater than start, and kind exactly classified or priority)
- Cross-field rules on that payload: when locked is true, passcode must be exactly 4 characters and the body must not be shown in list preview or full view (redacted to [ENCRYPTED] instead); when locked is false, passcode is null or absent; priority must be one of the three enum values; channel must match an existing channel name case-sensitively as stored; mark ranges must fall within the body length
- Entering a valid non-empty title and saving logs the memo so it appears in the main memo list showing its title, body preview, priority badge, and channel; the created record matches the field contract above
Feature: Channel field contract —
- Add New Channel adds a user-named channel to the sidebar; the channel create payload IS the would-be request body with name (required trimmed string, 1 to 40 characters) that must be unique among existing channels case-insensitively; every memo is assigned to exactly one channel through a labeled Channel select control in the editor
Feature: Browse and filter —
- Clicking a channel in the sidebar filters the memo list to that channel only; a Search field filters the currently visible memos by title or body text; the channel filter and the search text combine, so a memo must match both to remain visible; Show All Channels clears the channel filter
Feature: Cipher lock passcode contract —
- Each memo carries a Lock control; turning Lock on prompts for a local passcode whose payload IS the would-be lock request body: passcode required string of exactly 4 characters (letters or digits); a passcode that is not exactly 4 characters is rejected with an inline message naming the passcode field before any lock is applied
- After a valid lock, the memo body is replaced everywhere it would appear (list preview and full view) by a redacted [ENCRYPTED] placeholder until the correct 4-character passcode is entered inline to reveal it for that viewing session only; an incorrect passcode shows a visible error naming the passcode field and keeps the body redacted
Feature: Theme Core —
- The Theme Core selector offers exactly five named cores: Matrix Green, Neon Cyan, Blood Red, Ghost White, and Amber Terminal; choosing one recolors the accent across buttons, priority badges, and Priority-marked text together, instantly and with no page reload
Feature: Text marks and priority —
- Selecting a range of text inside an open memo body reveals a small toolbar near the selection with Mark Classified, which renders the selection blurred until hovered, and Mark Priority, which renders the selection bold in the current theme accent color
- Each memo has a High / Standard / Low priority selector; the chosen priority renders as a colored corner badge on the memo card, and the three named priorities each render their own visually distinct badge color and label wherever the memo is shown; the stored priority value is exactly high, standard, or low matching the field contract
Feature: Decommission —
- Decommission moves a memo out of the main list into a separate Decommissioned view; that view offers per-memo Restore, which returns the memo to the main list, and Purge, which permanently deletes it only after a confirmation step that warns the action is irreversible
- Creating a transmission, decommissioning a transmission, and purging a transmission each show a transient confirmation such as a toast
Feature: Per-memo text export —
- An open memo offers Export as .txt and Export as .md controls that download the memo title and body in the chosen format
Feature: Session archive (API-shaped JSON) —
- An Export session control opens a Session archive panel with a live-compiled monospaced JSON preview; that JSON IS the would-be session archive API body and MUST include exactly these top-level keys: version (number 1), themeCore (exactly one of matrix-green, neon-cyan, blood-red, ghost-white, amber-terminal), channels (array of channel payloads matching the channel field contract, in sidebar order), memos (array of transmission payloads matching the transmission field contract for active memos), decommissioned (array of transmission payloads matching the same schema for decommissioned memos), and exportedAt (ISO-8601 timestamp string)
- Export content must reflect every create, edit, lock, priority, channel, decommission, restore, purge, theme, and channel-reorder mutation made in the session; an export that omits session work is incorrect
- Download JSON triggers a real file download named cipherlog-session.json whose body matches the visible preview; Copy JSON copies that same text and shows a visible Copied confirmation
- An Import session control accepts a previously exported session JSON only when it passes the same field contracts; on success it replaces channels, memos, decommissioned, and themeCore so the sidebar, memo list, Decommissioned view, Theme Core selector, and a subsequent export preview all match the imported archive
- Import rejection: malformed JSON or a payload that violates the field contracts (missing version or channels or memos or decommissioned, version not 1, themeCore outside the enum, a memo priority outside high/standard/low, a locked memo without a 4-character passcode, a channel name empty or longer than 40 characters, or a mark with end less than or equal to start) does not apply any partial state; the Session archive panel shows an inline import error naming the offending field or rule, and collections stay unchanged
Feature: Timestamps and HUD —
- Every memo shows a First Transmitted timestamp set once at creation and never changed, and a Last Modified timestamp that updates on every save; editing and saving a body updates Last Modified while First Transmitted stays exactly as it was
- A footer HUD on the open memo shows a live word count and character count that update as the body text changes
Feature: Channel reorder —
- Channels in the sidebar can be reordered by drag and drop; while a channel is dragged it is visibly distinguished by reduced opacity and a drop-position indicator shows where it will land, and dropping re-orders the sidebar immediately
- Memo order within a channel or the full list is newest Last Modified first and stays stable across re-renders
- Interactive icons in the header, sidebar, and memo cards come from one consistent icon set used throughout the app
- There are no outbound navigational links for app chrome and no backend; all views, filters, theme, and edits are in-app client state changes
</core_features>

<user_flows>
- Creating a transmission end to end: activating Create New Transmission, entering a title and body that satisfy the transmission field contract, and saving adds exactly one row to the memo list, shows a creation toast, and shows the new memo under its assigned channel when that channel is clicked in the sidebar; after a full page refresh the memo is still present with the same title, body preview, channel, priority, and First Transmitted timestamp
- Editing round-trip: opening an existing memo, changing its body, and saving updates that memo's preview in the list, moves it to the top of the newest-Last-Modified-first order, updates the word and character counts in the HUD, and leaves First Transmitted unchanged; a full page refresh shows the same updated body, the same new Last Modified value, and the same list position
- Lock round-trip: turning Lock on and setting a valid 4-character passcode redacts the body to [ENCRYPTED] in both the list preview and the full view and sets locked true with that passcode on the transmission payload; entering the correct passcode inline reveals the body for the current viewing session; after a full page refresh the same memo is redacted again while its lock state and passcode requirement persist
- Decommission round-trip: Decommission removes the memo from the main list (the visible list count decreases by exactly one), shows a toast, and makes the memo appear in the Decommissioned view; Restore returns it to the main list; after a full page refresh a decommissioned memo is still in the Decommissioned view and a restored memo is still in the main list
- Filter and search coherence: selecting a channel and then typing search text narrows the memo list to memos matching both, the visible list count matches the memos shown, and Show All Channels widens the list back to search-only matches without a reload
- Theme round-trip: choosing a different Theme Core recolors primary buttons, priority badges, and Priority-marked text together without a reload, and a full page refresh restores the same selected core
- Session archive export flow: after creating a channel named Ops, creating a transmission titled Nightfall Relay with priority high assigned to Ops, and switching Theme Core to Blood Red, open Export session; the JSON preview shows version 1, themeCore blood-red, a channels entry with name Ops, a memos entry whose title is Nightfall Relay and priority is high and channel is Ops, and an exportedAt ISO-8601 timestamp; Download JSON offers cipherlog-session.json containing that payload; Copy JSON shows Copied
- Session archive import round-trip: after the mutations above, Download or Copy the session JSON, purge or clear the session state, then Import that same JSON; the sidebar regains Ops, the memo list shows Nightfall Relay with priority high, Theme Core is Blood Red, and a subsequent export preview matches the imported archive
</user_flows>

<edge_cases>
- On a first visit with nothing created yet, the Channels sidebar, the memo list, and the Decommissioned view each show their own distinct friendly empty-state message rather than a blank area or one generic placeholder reused in all three
- Attempting to save a new transmission with a blank title, a title longer than 120 characters, or a priority outside high / standard / low is blocked and visibly explained by an inline error message naming the offending field plus a shake hint on that field; a silently disabled control alone is not sufficient, and no invalid memo is added
- A channel name that is blank, longer than 40 characters, or duplicates an existing one (case-insensitive) is rejected with a visible inline message naming the name field and no channel is added
- Entering an incorrect passcode when revealing a locked memo shows a visible error naming the passcode field and keeps the body redacted
- A passcode entry that is not exactly 4 characters is rejected with an inline message naming the passcode field before any lock or reveal is applied
- Purge deletes permanently only after a confirmation step that warns the action is irreversible; cancelling the confirmation leaves the memo in the Decommissioned view unchanged
- When the combined channel filter and search text match no memos, the list region shows a friendly no-matches message rather than a blank area
- Opening Export session with empty collections still produces schema-valid JSON with version 1, the current themeCore, empty channels / memos / decommissioned arrays, and an exportedAt timestamp; Copy JSON still shows Copied
- Importing malformed JSON or a payload that breaks the transmission, channel, or session field contracts leaves channels, memos, decommissioned, and themeCore unchanged and shows an inline import error naming the offending field or rule
</edge_cases>

<visual_design>
- Three-region covert-console layout: a dark header bar, a left Channels sidebar about 256px wide on desktop, and a centered main content column
- Page background renders as #F5F5F7; primary action buttons (Create New Transmission and other main actions) use background #007AFF with text color #FEFEFE and a fully pill-shaped radius of 1000px with no shadow; secondary buttons (Decommission, Restore, Show All Channels) use background #E6EEF7 with text color #007AFF and the same pill shape
- Typography uses a system sans-serif stack; h1 renders at about 34px, h2 at about 17px, and body text at about 17px; memo bodies and the count HUD use a monospace face fitting the covert-transmissions theme
- Cards and panels use a base border radius of about 6px with hairline borders on a 4px spacing rhythm
- A locked memo's [ENCRYPTED] placeholder is unmistakably styled as redacted, a blocked or censored block treatment rather than plain text, shown in both the list preview and the full view
- High, Standard, and Low priority badges are three visually distinguishable colors, applied consistently wherever a memo appears
- The First Transmitted and Last Modified timestamps render in a small, visually secondary muted style distinct from the memo body
- Icons render crisply at their displayed size and share one visual style (weight and geometry) across header, sidebar, and memo cards
</visual_design>

<motion>
- Switching the Theme Core recolors buttons, badges, and Priority-marked text together immediately with no reload
- A newly created memo animates into the list rather than appearing instantly in place, and a decommissioned or purged memo animates out of the list it leaves
- Creating, decommissioning, and purging a transmission each animate a transient toast that slides in and fades out on its own
- Submitting a blank title plays a brief shake animation on the inline error to draw attention
- Mark Classified blurs the marked text and eases the blur away on hover so it becomes legible; Mark Priority renders the range bold in the accent color
- Sidebar channels, buttons, and memo cards show a visible hover state distinct from their resting state
- While a channel is being dragged the dragged row is dimmed to reduced opacity and a drop-line indicator appears among the other channels showing the landing position before the drop
- The Text Marking toolbar appears immediately next to a text selection and dismisses cleanly when the selection is cleared
- The purge confirmation dialog enters and exits with a brief transition rather than popping instantly
</motion>

<responsiveness>
- At about 375px wide the app renders with no horizontal scrolling and the Channels sidebar collapses into a togglable panel behind a Channels button rather than squeezing the memo view; the heading, channel labels, and count HUD stay legible and inside the viewport
- Between desktop width and about 375px, no content clips or overflows the viewport and all controls remain reachable
</responsiveness>

<accessibility>
- Every interactive control (buttons, selects, channel rows, memo cards, toolbar actions) is reachable and operable with the keyboard alone, and keyboard Tab focus is visibly indicated on all interactive controls
- The purge confirmation and the passcode prompt open as proper dialogs: focus moves into the dialog while it is open, Escape closes it without applying the action, and focus returns to the control that opened it
- The Channel, priority, and Theme Core selects are operable with the keyboard, opening with Enter or Space and moving through options with the arrow keys
- Inline validation errors (blank title, duplicate channel, wrong passcode, contract-invalid import) are rendered as text associated with their field, not conveyed by color alone
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear during a full exercise of the app, including create, lock, reveal, decommission, restore, purge, theme switching, and a page refresh
- Typing rapidly in the memo body keeps the word and character counts updating live with no visible lag or dropped keystrokes
</performance>

<writing>
- The three empty states (channels, memos, Decommissioned) each use distinct copy appropriate to that section, explaining what belongs there and how to add it
- Error messages name the problem and the fix (which field is blank, why a channel name was rejected, why a passcode failed, which import field violated the field contract)
- Control labels use one consistent capitalization convention and specific verbs (Create New Transmission, Add New Channel, Decommission, Restore, Purge, Export session, Import session, Download JSON, Copy JSON) rather than generic labels
- No placeholder or lorem-ipsum text appears anywhere in the shipped UI
</writing>

<requirements>
Shared application state must live in Svelte stores (writable and derived): the channels collection, the memos collection, the Decommissioned collection, the active channel filter, the search query, the active memo, the selected Theme Core, the Session archive preview, and UI chrome. This app must additionally persist channels, memos (including lock state, priority, text marks, and both timestamps), the Decommissioned list, the selected Theme Core, and the custom channel order to localStorage so a full page refresh restores the exact committed state; guard storage access so the production build does not crash if storage is unavailable.
State and behavior contracts (behavioral, not storage keys):
- Creating a valid memo adds a transmission record matching the transmission field contract to the shared collection and shows its row in the memo list; creating with an invalid title, priority, or channel adds nothing and shows a visible inline error naming the field plus a shake hint
- Editing a memo updates that same record everywhere it appears; the memo list stays sorted newest Last Modified first
- Decommission moves a memo from the main list to the Decommissioned collection; Restore returns it; Purge permanently removes it only after a confirmation step
- Locking sets locked true with a 4-character passcode on the transmission payload and redacts the body to [ENCRYPTED] everywhere; revealing requires the exact passcode and lasts only for the current viewing session; a full page refresh re-hides a locked memo
- First Transmitted is set once at creation and never changes; Last Modified updates on every save and both survive a refresh
- Channel names are unique case-insensitively and match the channel field contract; the channel filter and the search text combine with AND semantics over the shared collection and never build a second disconnected copy
- Theme Core and active view are shared client state; changing them does not reload the document
- Session archive Export and Import compile and validate against the same transmission, channel, and session field contracts; a successful import replaces the shared collections from that schema-valid payload
Build tooling: Vite SPA with Svelte 5 and Tailwind CSS 4.3.2 (pinned) via the Tailwind Vite plugin, with design tokens defined in an @theme block. Melt is the component library: use its builders for the purge confirmation dialog, the passcode prompt, the Channel / priority / Theme Core selects, the selection toolbar, toasts, and the Session archive panel, styled with Tailwind to the covert-console identity. svelte-motion is allowed for animation, alongside CSS transitions and Svelte's built-in transitions; no other animation libraries. Phosphor icons via the phosphor-svelte package only; no other icon sets and no raw pasted SVG icons. All forms (the transmission editor, Add New Channel, the passcode prompt, and Import session) validate through a Zod schema driven by a form library (TanStack Form for Svelte or Felte); schemas are API-shaped and mirror the transmission, channel, passcode, and session archive field contracts in Feature sections — the record a form creates IS the would-be request body, and export and import conform to those same schemas; inline per-field errors appear before submit. All libraries are installed via npm and bundled locally; no CDN imports. No backend or authentication.
- The app opens blank on a fresh visit and shows three distinct empty states; do not pre-seed demo data
- The Cipher Lock is a local, client-side reveal gate for a single memo body; never describe or implement it as real encryption, cross-device, cross-account, or account security
- Exactly five Theme Cores: Matrix Green, Neon Cyan, Blood Red, Ghost White, Amber Terminal (stored themeCore values matrix-green, neon-cyan, blood-red, ghost-white, amber-terminal)
- Exactly three priorities: High, Standard, Low (stored values high, standard, low), each with its own distinct badge
- Passcodes are exactly 4 characters
- Zero navigational outbound links for app chrome; in-app controls only
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
- entity-collection-v1
- browse-query-v1
- artifact-transfer-v1

Module specs:
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
- Entity: memo
- Entity operations: create; select; update; delete
- Entity fields: title; body; priority; channel; locked
- Value bounds: {"priority":["high","standard","low"]}
- Browsable entity: memos
- Destinations: transmissions; decommissioned; session-archive
- Filters: channel
- Themes: default; matrix-green; neon-cyan; blood-red; ghost-white; amber-terminal
- Artifact operations: export; import; copy
- Export formats: session-json; txt; md
- Import modes: session-json
- Workflow completion: session archive JSON preview updates after create/edit/lock/decommission/theme changes and includes the mutated memo title
- Workflow completion: importing session-json replaces channels, memos, decommissioned, and themeCore so list and Theme Core match the imported archive

Mechanics exclusions:
- Channel drag-and-drop reorder stays Playwright-observed
- Text-selection marking toolbar (Mark Classified / Mark Priority) stays Playwright-observed
- Cipher-lock passcode set/reveal gesture stays Playwright-observed
- File-picker Import and Blob download stay Playwright-observed; WebMCP must not return raw file/blob/base64 contents
- Clipboard contents of Copy are verified via Playwright, never returned in WebMCP results

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
