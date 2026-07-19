<summary>
Build a frontend-only wealth portfolio dashboard using React 19, React state and Context, Recharts, and Tailwind CSS v4. The app opens directly on a portfolio overview with a net-worth summary, an allocation breakdown, a holdings table, and a detail panel, with no login, signup, or onboarding gate.
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
- The first screen is the portfolio overview: a net-worth summary, an allocation breakdown, a holdings table, and a selected-holding detail panel, reachable at the root URL with no login, signup, or onboarding gate.
- The holdings table lists the seeded holdings, each row showing name, symbol, asset class, quantity, and market value. Seed at least four holdings across the classes Equity, ETF, Cash, and Crypto so the workspace is non-empty on first load.
- The net-worth summary shows a total that equals the sum of the market values of the currently visible holdings, plus a meta line reporting how many holdings and how many classes are visible.
- The allocation breakdown shows one entry per asset class present in the visible holdings, each with a proportional bar and a percentage; the percentages shown for the visible classes sum to 100 percent of the visible total.
- A class filter control narrows the holdings to a single asset class. Filtering recomputes the table, the net-worth total, the meta line, and the allocation percentages over the visible set. Clearing the filter restores the full list of holdings with no duplicates.
- Selecting a holding marks it as selected in the table and shows its name, symbol, class, quantity, unit price, and market value in the detail panel. Selecting a different holding fully replaces every field in the detail panel with no stale values from the previous selection.
- An Add holding control opens a form with name, symbol, class, quantity, and unit price. Saving a valid holding appends it to the table; the net worth, the meta line, and the allocation percentages all update together. Saving with an empty name or symbol, or a non-positive quantity, shows an inline validation message at the form and adds no holding.
- Editing the selected holding through the form and saving updates that row everywhere it appears and recomputes the totals and allocation. A delete control removes the selected holding from the table, the selection, and the derived totals.
- Adding a holding and then reloading the page restores the same holdings and the updated net-worth total from client storage, with no login step. Filtering to one class, adding a holding in a different class, then returning to all classes leaves both the prior and the new holdings identifiable with no duplicates.
</core_features>

<visual_design>
- Calm wealth-dashboard composition on a light, slightly green-tinted background: a top brand bar, a full-width net-worth summary card, then a two-column grid of a holdings card and a selected-holding detail card.
- Primary visual emphasis on the net-worth figure and the holdings table; the brand mark, subtitle, and section eyebrow labels stay secondary.
- White cards with generous padding, a large radius, hairline borders, and a soft shadow. A single teal accent hue carries the brand mark, primary buttons, selection highlight, and allocation bars over a neutral base; a red family is reserved for destructive and error states.
- The Add holding control is grouped inside the holdings card directly above the form and the table it affects. The form uses persistent, visible field labels above each input rather than placeholder-only fields.
- Holdings rows align name, symbol, class, quantity, and value into consistent columns; quantity and value read as tabular numerals.
- The allocation breakdown lists class name, a proportional bar, and a right-aligned percentage per class.
- Typography uses distinct roles: a large weighted net-worth figure and card titles, regular body text in the table, and small uppercase eyebrow labels for section headers.
- Responsive: at a narrow width around 375 pixels the two-column grid collapses to a single column and the summary stacks, with no clipped text, no overlapping controls, and no horizontal page scrolling; the holdings table scrolls within its own region when needed.
</visual_design>

<motion>
- Buttons show an immediate pressed feedback on pointer-down and a hover change in background; every interactive control shows a clearly visible focus ring that differs from its hover treatment.
- Table rows take a hover wash; the selected row is marked by more than color alone, with a teal left border and tint in addition to the tint, and exposes a pressed state to assistive technology.
- Selecting, adding, editing, or deleting a holding updates the summary, allocation, table, and detail panel in place with no full page reload; a visually hidden live region announces added, updated, and removed holdings.
- The class filter updates the visible holdings, totals, and allocation immediately on change without a reload.
- A core flow can be completed with the keyboard alone: fields are reachable by Tab, the form submits on Enter, and table rows can be selected with Enter or Space while focused.
</motion>

<requirements>
- Use React 19, React state and Context for shared application state, Recharts for the allocation visualization, and Tailwind CSS v4 for styling.
- No authentication wall: open directly into the portfolio overview.
- Seed at least four holdings across Equity, ETF, Cash, and Crypto so the primary workflow is non-empty on first load.
- The net-worth total must equal the sum of the market values of the visible holdings, and market value must equal quantity times unit price. The allocation percentages for the visible classes must sum to 100 percent.
- Filtering, adding, editing, and deleting must all recompute the visible holdings, the totals, and the allocation from one shared collection rather than a second disconnected copy.
- Persist the holdings in localStorage or an equivalent client storage so a reload restores the current holdings and the updated net-worth total with no login step.
- Empty name or symbol, or a non-positive quantity, must block the save, show an inline message at the form, and add no holding.
- Keep the implementation frontend-only and self-contained: no live backend, no authentication, and no navigational outbound links for app chrome.
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
- Destinations: portfolio-overview
- Filters: asset-class
- Entity: holding
- Entity operations: create; select; update; delete
- Entity fields: name; symbol; asset-class; quantity; unit-price

Mechanics exclusions:
- Allocation bars and hover feedback stay Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
