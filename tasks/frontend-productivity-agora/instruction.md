<summary>
Build Agora, a frontend-only interactive reflection app using SolidJS, Solid stores, and Tailwind CSS 4.3.2. Agora combines a rotating quote library, a guided breathing meditation timer, and a tagged personal journal for practicing calm, deliberate thinking. It produces a portable plain-text journal export downloaded live from the saved entries. Favorited quotes, journal entries, the day streak, and weekly-summary counts persist to localStorage and recover gracefully from corrupted persisted data.
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
Feature: Daily Quote library —
- The home view shows one reflection quote pulled from a built-in local list of at least 20 quotes; a New Quote control cycles to another quote, and each click shows a different quote than the one immediately before it
- The full built-in list (20 or more quotes) is exhausted before any single quote is shown a second time
Feature: Favorite Quotes —
- A Favorite toggle on the quote card saves the current quote to a separate Favorites view; toggling it off removes it from that view
Feature: Guided Meditation Timer —
- A Meditate view offers three preset durations of 3, 5, and 10 minutes, plus Start, Pause, and Reset controls and a large countdown display with a circular progress ring
- Selecting a preset and pressing Start begins the countdown and animates the progress ring; Pause stops the countdown advancing; Reset returns the countdown to the full selected preset duration
Feature: Breathing Guide —
- While the meditation timer is running, an overlay circle expands and contracts through the labeled phases Inhale, Hold, and Exhale on a repeating 4-4-4 second cycle synced to the animation
Feature: Session Complete —
- When the countdown reaches 0, playback stops automatically and a visible Session Complete banner is shown
Feature: Reflection Journal —
- A Journal view lets the user pick one of three fixed prompt questions from a dropdown and write a free-text response; a Save Entry control stores it with the current date
- Each journal entry is tagged with one of the four cardinal virtues Wisdom, Courage, Justice, or Temperance chosen from a selector at save time
Feature: Journal History —
- A reverse-chronological list of all saved journal entries shows the date, prompt, virtue tag, and response text; each entry has Edit and Delete controls, and the most-recent-first order stays stable across re-renders
- A search input filters the Journal History list by keyword match against entry text
Feature: Virtue Stats —
- A Stats view shows a count of journal entries per virtue tag as four labeled bars or numbers
Feature: Streak and weekly summary —
- A Day Streak counter increments once per calendar day on which the user either completes a meditation session or saves a journal entry, and resets to 0 on a day with neither
- The home view shows a This Week summary counting completed meditation sessions and journal entries saved in the last 7 days
Feature: Export Journal (useful end state) —
- An Export Journal control downloads all journal entries as a single plain-text file compiled live from the saved entries via a Blob and an anchor download attribute; a fresh export after saving a new entry contains that entry
Feature: Persistence —
- Favorited quotes, journal entries, the streak, and the counts used for the weekly summary all survive a full page refresh, restored purely from localStorage
</core_features>

<user_flows>
End-to-end flows (each step names its visible state evidence):
- After saving a valid journal entry, the Journal History count increases by exactly one, the entry appears at the top of the list with its date, prompt, virtue tag, and response, and after a full page reload the entry is still present with the same fields
- Favoriting the current quote adds it to the Favorites view; toggling the same quote off removes it from Favorites, and the favorited set survives a full page reload
- Selecting the 3-minute meditation preset and pressing Start runs the countdown and progress ring and shows the breathing overlay cycling Inhale, Hold, Exhale; Pause halts the countdown and Reset returns it to the full 3-minute preset
- Letting the shortest preset run to 0 stops playback automatically, shows the Session Complete banner, and increments the Day Streak for today
- Editing a journal entry updates its visible text in Journal History in place, and the edit survives a full page reload; deleting an entry removes it from the list and the deletion survives a reload without reviving the entry
- Typing a keyword into the Journal search narrows Journal History to matching entries, and clearing the search restores the full list
- Saving journal entries with different virtue tags updates the Virtue Stats counts to match the number of entries per virtue
- Mutation-to-export: after saving a distinctive journal entry, Export Journal yields a text file that contains that entry's date, prompt, virtue, and response
</user_flows>

<edge_cases>
- Submitting the Journal form with a blank response is blocked and explained with a visible inline error or shake cue, not merely a silently disabled button, and no entry is added
- Double-activating the Save Entry control creates exactly one journal entry: the history count increases by exactly one
- Before any journal entry exists, Journal History shows a friendly empty-state message inviting the user to write the first entry rather than a blank area
- An empty Favorites view shows a short explanatory message, and a Journal search with no matches shows an explicit no-results message
- If the persisted data cannot be parsed or fails validation, the app recovers to the last valid snapshot instead of showing a blank screen, and shows a specific recovery notice in a live region with role alert; Retry re-applies the last valid snapshot and Reset clears to a defined empty state, and both controls produce a visible, deterministic result
- A visible control literally labeled Load Malformed Sample runs a deliberately malformed payload through guarded skip-or-repair logic and reports the outcome in the role alert live region, without crashing or blanking the app
</edge_cases>

<visual_design>
- Heading font is Heebo with fallback sans-serif, used for view titles and the quote text; top-level headings render at roughly 60px-equivalent size
- Body font is Heebo with the same fallback, at a 28px base size for body copy, counts, and helper text
- Canvas background computed color is #01080A; primary brand color is #38678B; secondary color is #021116; accent and link color is #337AB7
- Spacing follows a 4px base unit: padding and gaps between elements are multiples of 4px, and cards, inputs, and buttons render with a 4px border-radius consistently
- The current breathing phase label Inhale, Hold, or Exhale is always legible against the animated circle, and the circle's expand and contract state visibly corresponds to the current phase
- Each of the four virtues Wisdom, Courage, Justice, and Temperance has its own distinguishable color or badge, used consistently in Journal History and the Stats view
- The Day Streak counter is prominent on the home view and updates immediately after any qualifying action
- Buttons, tabs, and journal-entry rows show a visible hover state, and keyboard focus is visible on interactive controls
- Before any journal entry exists the History view shows a friendly prompt, an empty Favorites view shows an explanatory message, and a no-match search shows an explicit no-results message
</visual_design>

<motion>
- Saving a journal entry, favoriting a quote, and completing a meditation session each produce a transient visible confirmation such as a toast immediately after the action
- The breathing overlay circle expands and contracts smoothly through the Inhale, Hold, and Exhale phases rather than snapping between sizes
- The meditation circular progress ring animates its fill smoothly as the countdown advances
- Buttons ease their background and border on hover and show a brief press effect on click; tabs and journal rows take a visible hover wash
- Submitting the Journal form with a blank response triggers a visible shake or equivalent motion cue alongside the inline error text
- With prefers-reduced-motion set, decorative animations including the breathing overlay are reduced and state changes still apply instantly and correctly
</motion>

<responsiveness>
- At roughly 375px viewport width the app renders with no horizontal scrolling, and the breathing overlay and timer controls remain fully usable and centered
- At narrow width the Journal History list, the Stats bars, and the quote card remain fully visible without clipping
- The recovery notice remains legible at narrow width with its Retry and Reset controls reachable
</responsiveness>

<accessibility>
- Every interactive control — buttons, tabs, the virtue selector, the prompt dropdown, form fields, and the meditation controls — is reachable with keyboard Tab and shows a clearly visible focus indicator
- Inline form validation errors are rendered adjacent to the field they name and are programmatically associated with that field
- The recovery notice and the Load Malformed Sample outcome are announced through the role alert live region without requiring focus to move to them
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors appear during a full exercise of the app, including the malformed-data recovery path
- Rapid repeated New Quote and Save Entry taps stay responsive with no hangs, and each is reflected in the visible state
</performance>

<writing>
- Headings, buttons, and tabs use one consistent capitalization convention throughout the app
- Action labels are specific verbs or verb phrases such as New Quote, Save Entry, and Export Journal rather than generic labels
- Error messages and the recovery notice name the problem and the fix; empty states explain what belongs there and how to add it; no placeholder text appears anywhere in the shipped UI
</writing>

<requirements>
Build with SolidJS components and fine-grained reactive primitives, Solid stores for all shared app state (quotes and favorites, journal entries, the day streak, weekly-summary counts, and UI chrome — views derive from this one store, never a second disconnected copy), and Tailwind CSS 4.3.2 (pinned) with design tokens. Keep the bundle simple: no component libraries are required and hand-rolled Tailwind styling for the stack is expected. All libraries are installed via npm and bundled locally; no CDN imports.
Use localStorage for persistence, guarded so that malformed or unreadable stored data never crashes the production build.
Persistence and recovery contract (the app's core difficulty — spec exactly):
- Favorited quotes, all journal entries with their date, prompt, virtue tag, and response text, the day streak, and the counts used for the weekly summary survive a full page refresh, restored purely from localStorage.
- When persisted data cannot be parsed or fails structural validation, the app recovers to the last valid snapshot it has, without ever rendering a blank screen, and shows a specific recovery notice in a live region with role alert; a Retry control and a Reset control are both present with visible, deterministic effects — Retry re-applies the last valid snapshot, Reset clears to the app's defined empty state.
- A control literally labeled Load Malformed Sample exercises soft-recovery on demand: it runs a deliberately malformed payload through guarded skip-or-repair logic and reports the outcome in the same role alert live region.
- The useful end state is the portable journal text document: Export Journal downloads a plain-text file compiled live from the saved entries via a Blob and an anchor download attribute, containing the session's actual saved entries, and makes no network requests.
All streak, weekly-summary, and journal-date behavior must be computed from the real device date; never add a manual advance-day control.
No backend, no authentication, and no routes other than the app's single root path are required; Meditate, Journal, Stats, and Favorites are views or tabs within the root path, not separate routes.
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
- form-workflow-v1
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
- Destinations: home; meditate; journal; stats; favorites
- Filters: virtue
- Entity: journal-entry
- Entity operations: update; delete
- Entity fields: prompt; virtue; response; date
- Form fields: prompt; virtue; response
- Form operations: validate; submit; cancel
- Artifact operations: export; import
- Import modes: malformed-sample
- Export formats: journal-text

Mechanics exclusions:
- Meditation countdown, circular progress ring, and the Inhale/Hold/Exhale breathing overlay animation stay Playwright-observed (no timer tool exposed)
- New Quote cycling and the Favorite toggle toast/hover stay Playwright-observed
- Day Streak and This Week counters are read via the visible UI; no counter tool is exposed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
