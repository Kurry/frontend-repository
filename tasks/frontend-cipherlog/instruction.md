<summary>
Build a CipherLog covert-transmissions memo log using Svelte, Svelte stores, and Tailwind CSS.
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
- The app opens directly at the root into a three-region workspace with no login or registration wall: a header carrying the CipherLog wordmark, a Theme Core selector, and a Create New Transmission button; a Channels sidebar on the left; and a main content area on the right that shows the memo list
- On a first visit with nothing created yet, the Channels sidebar, the memo list, and the Decommissioned view each show their own distinct friendly empty-state message rather than a blank area or one generic placeholder reused in all three
- Create New Transmission opens a new memo for immediate editing with a Title field and a monospaced body text area; entering a non-empty title logs the memo so it appears in the main memo list showing its title and a body preview
- Attempting to save a new transmission with a blank title is blocked and visibly explained by an inline error message and a shake hint on the field; a silently disabled control alone is not sufficient, and no blank-titled memo is added
- Add New Channel adds a user-named channel to the sidebar; a channel name that duplicates an existing one (case-insensitive) is rejected with a visible message and no channel is added; every memo is assigned to exactly one channel through a labeled Channel select control in the editor
- Clicking a channel in the sidebar filters the memo list to that channel only; a Search field filters the currently visible memos by title or body text; the channel filter and the search text combine, so a memo must match both to remain visible; Show All Channels clears the channel filter
- Each memo carries a Lock control; turning Lock on prompts for a 4-character local passcode, after which the memo body is replaced everywhere it would appear (list preview and full view) by a redacted "[ENCRYPTED]" placeholder until the correct 4-character passcode is entered inline to reveal it for that viewing session only
- Entering an incorrect passcode when revealing shows a visible error and keeps the body redacted; the reveal is session-only, so after a full page refresh a locked memo returns to "[ENCRYPTED]" while its lock state and passcode requirement persist
- The Theme Core selector offers exactly five named cores: Matrix Green, Neon Cyan, Blood Red, Ghost White, and Amber Terminal; choosing one recolors the accent across buttons, priority badges, and Priority-marked text together, instantly and with no page reload
- Selecting a range of text inside an open memo body reveals a small toolbar near the selection with Mark Classified, which renders the selection blurred until hovered, and Mark Priority, which renders the selection bold in the current theme accent color
- Each memo has a High / Standard / Low priority selector; the chosen priority renders as a colored corner badge on the memo card, and the three named priorities each render their own visually distinct badge color and label wherever the memo is shown
- Decommission moves a memo out of the main list into a separate Decommissioned view; that view offers per-memo Restore, which returns the memo to the main list, and Purge, which permanently deletes it only after a confirmation step that warns the action is irreversible
- Creating a transmission, decommissioning a transmission, and purging a transmission each show a transient confirmation such as a toast
- An open memo offers Export as .txt and Export as .md controls that download the memo title and body in the chosen format
- Every memo shows a First Transmitted timestamp set once at creation and never changed, and a Last Modified timestamp that updates on every save; editing and saving a body updates Last Modified while First Transmitted stays exactly as it was
- A footer HUD on the open memo shows a live word count and character count that update as the body text changes
- Channels in the sidebar can be reordered by drag and drop; while a channel is dragged it is visibly distinguished by reduced opacity and a drop-position indicator shows where it will land, and dropping re-orders the sidebar immediately
- Memo order within a channel or the full list is newest Last Modified first and stays stable across re-renders
- There are no outbound navigational links for app chrome and no backend; all views, filters, theme, and edits are in-app client state changes
</core_features>

<visual_design>
- Three-region covert-console layout: a dark header bar, a left Channels sidebar about 256px wide on desktop, and a centered main content column
- Page background renders as #F5F5F7; primary action buttons (Create New Transmission and other main actions) use background #007AFF with text color #FEFEFE and a fully pill-shaped radius of 1000px with no shadow; secondary buttons (Decommission, Restore, Show All Channels) use background #E6EEF7 with text color #007AFF and the same pill shape
- Typography uses a system sans-serif stack; h1 renders at about 34px, h2 at about 17px, and body text at about 17px; memo bodies and the count HUD use a monospace face fitting the covert-transmissions theme
- Cards and panels use a base border radius of about 6px with hairline borders on a 4px spacing rhythm
- A locked memo's "[ENCRYPTED]" placeholder is unmistakably styled as redacted, a blocked or censored block treatment rather than plain text, shown in both the list preview and the full view
- High, Standard, and Low priority badges are three visually distinguishable colors, applied consistently wherever a memo appears
- Each of the three empty states (channels, memos, Decommissioned) uses distinct copy appropriate to that section
- The First Transmitted and Last Modified timestamps render in a small, visually secondary muted style distinct from the memo body
- At about 375px wide the app renders with no horizontal scrolling and the Channels sidebar collapses into a togglable panel behind a Channels button rather than squeezing the memo view; the heading, channel labels, and count HUD stay legible and inside the viewport
</visual_design>

<motion>
- Switching the Theme Core recolors buttons, badges, and Priority-marked text together immediately with no reload
- Creating, decommissioning, and purging a transmission each animate a transient toast that slides in and fades out on its own
- Submitting a blank title plays a brief shake animation on the inline error to draw attention
- Mark Classified blurs the marked text and eases the blur away on hover so it becomes legible; Mark Priority renders the range bold in the accent color
- Sidebar channels, buttons, and memo cards show a visible hover state distinct from their resting state, and keyboard Tab focus is visibly indicated on all interactive controls
- While a channel is being dragged the dragged row is dimmed to reduced opacity and a drop-line indicator appears among the other channels showing the landing position before the drop
- The Text Marking toolbar appears immediately next to a text selection and dismisses cleanly when the selection is cleared
</motion>

<requirements>
Shared application state must live in Svelte stores (writable and derived): the channels collection, the memos collection, the Decommissioned collection, the active channel filter, the search query, the active memo, the selected Theme Core, and UI chrome. This app must additionally persist channels, memos (including lock state, priority, text marks, and both timestamps), the Decommissioned list, the selected Theme Core, and the custom channel order to localStorage so a full page refresh restores the exact committed state; guard storage access so the production build does not crash if storage is unavailable.
State and behavior contracts (behavioral, not storage keys):
- Creating a valid memo adds it to the shared collection and shows its row in the memo list; creating with a blank title adds nothing and shows a visible inline error plus a shake hint
- Editing a memo updates that same record everywhere it appears; the memo list stays sorted newest Last Modified first
- Decommission moves a memo from the main list to the Decommissioned collection; Restore returns it; Purge permanently removes it only after a confirmation step
- Locking sets a 4-character passcode and redacts the body to "[ENCRYPTED]" everywhere; revealing requires the exact passcode and lasts only for the current viewing session; a full page refresh re-hides a locked memo
- First Transmitted is set once at creation and never changes; Last Modified updates on every save and both survive a refresh
- Channel names are unique case-insensitively; the channel filter and the search text combine with AND semantics over the shared collection and never build a second disconnected copy
- Theme Core and active view are shared client state; changing them does not reload the document
Build tooling: Vite SPA with Svelte 5 and the Tailwind CSS Vite plugin. No external component libraries; hand-rolled styling for the stack is expected. No backend or authentication.
- The app opens blank on a fresh visit and shows three distinct empty states; do not pre-seed demo data
- The Cipher Lock is a local, client-side reveal gate for a single memo body; never describe or implement it as real encryption, cross-device, cross-account, or account security
- Exactly five Theme Cores: Matrix Green, Neon Cyan, Blood Red, Ghost White, Amber Terminal
- Exactly three priorities: High, Standard, Low, each with its own distinct badge
- Passcodes are exactly 4 characters
- Zero navigational outbound links for app chrome; in-app controls only
- Responsive: at about 375px the Channels sidebar collapses behind a Channels button with no horizontal scrolling
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
- entity-collection-v1
- browse-query-v1

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

Bindings:
- Entity: memo
- Entity operations: create; select; update; delete
- Entity fields: title; body; priority; channel
- Value bounds: {"priority":["high","standard","low"]}
- Browsable entity: memos
- Destinations: transmissions; decommissioned
- Filters: channel
- Themes: default; matrix-green; neon-cyan; blood-red; ghost-white; amber-terminal

Mechanics exclusions:
- Channel drag-and-drop reorder stays Playwright-observed
- Text-selection marking toolbar (Mark Classified / Mark Priority) stays Playwright-observed
- Cipher-lock passcode set/reveal gesture stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
