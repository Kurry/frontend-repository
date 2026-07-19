<summary>
Build a frontend-only, privacy-friendly web analytics dashboard modeled on Plausible Analytics, using React 19, React state with Context for shared state, a charting library for the visitors trend, and Tailwind CSS v4. The app opens directly into a single-screen dashboard for one selected site and date range: summary metric tiles, a visitors trend chart, and Top Sources, Top Pages, and Countries breakdown panels whose rows act as segment filters. There is no backend, no login, and no build-time data source; all numbers are computed in the browser from seeded sample data.
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
- The first screen is the analytics dashboard with summary metrics and breakdown panels, reached at the root URL with no login, signup, SSO, or invite gate
- The top bar shows a brand cluster (a gradient logo mark, the title Plausible Analytics, and a subtitle naming the current site) on the left and, on the right, a site selector, a date-range selector, a sort selector, and a theme toggle
- Four summary metric tiles are visible together: unique visitors, total pageviews, bounce rate, and visit duration. On first load for example.com over Last 30 days they read 16,840 unique visitors, 47,220 total pageviews, 44% bounce rate, and 98s visit duration
- A visitors trend chart is present below the metric tiles, rendered as a bar per time bucket rising left to right, computed from the same seeded data as the metric tiles
- Three breakdown panels are present: Top Sources (Google 7,200, Direct 4,800, Twitter 1,600, Newsletter 980), Top Pages (/ 12,800, /pricing 5,600, /blog 3,900, /docs 2,800), and Countries (United States 6,400, United Kingdom 2,400, Germany 1,900, Canada 1,200). Each panel shows the top four rows, each row a name on the left and a visitor count on the right
- Clicking a Top Sources, Top Pages, or Countries row applies a visible segment filter: a filter pill naming the dimension and value appears, and the summary metric tiles, the trend chart, and the other two panels all recompute to that segment. Different segments yield different numbers
- Only the latest filter is active. Clicking a second breakdown row replaces the first: a single filter pill is shown at a time, filters do not stack
- The filter pill and a Clear filter control both remove the active segment filter, returning the metric tiles, trend, and panels to their unfiltered values with no stale filter pill left behind
- Changing the site or the date range recomputes the metric tiles, the trend chart, and all three breakdown panels together, with no leftover rows from the previous selection, and clears any active segment filter
- Changing the sort reorders the rows in all three breakdown panels (most visitors, fewest visitors, or name A to Z)
- Breakdown rows are keyboard operable: moving focus to a row and pressing Enter or Space applies its filter, and the focused row shows a visible focus indicator
- Shared state (selected site, date range, sort, theme, and active filter) survives a full page reload
</core_features>

<visual_design>
- A single-page analytics dashboard composition on a light neutral page background: a sticky white top bar with a hairline bottom border, then a row of four metric tiles, then a dominant visitors trend chart card, then a three-column row of breakdown panels. This is the primary layout, not a login-centered or marketing layout
- Summary metrics and the visitors trend are the primary visual focus: large bold metric numbers over small muted labels, and a chart card that spans the full content width and stands taller than the panels below it
- Cards are white with a subtle 1px border, rounded corners near 12px, and a soft shadow. Content is bounded to a centered max width near 1120px rather than stretching edge to edge on wide screens
- The visitors bars use an indigo vertical gradient (lighter at the top, deeper indigo at the bottom). Indigo is the single accent hue, used for the logo mark, the active filter pill, active rows, and focus rings, over an otherwise neutral slate palette
- Breakdown rows read as a two-column list: a left-aligned name and a right-aligned, tabular-figure count in a muted color; the active (filtered) row is distinguished by the accent, not by color alone
- The active filter state is distinguished by a visible pill reading Dimension: value with a clear affordance, matched by the recomputed metric tiles
- A light and a dark theme are both supported; every text-on-surface pairing that is legible in one theme stays legible in the other
- At mobile width the metric tiles, chart, and breakdown panels reflow into a single stacked column that preserves the metrics-then-chart-then-panels hierarchy, and the site, date-range, and clear-filter controls stay reachable without horizontal scrolling
- All UI text is sentence case; headings, labels, and counts use numerals, and short labels carry no terminal period
</visual_design>

<motion>
- Bars animate their height with a short eased transition when the metric segment, site, or date range changes, so a recompute reads as a visible update rather than an instant swap
- Breakdown rows take an accent hover wash and a distinct, clearly visible focus ring; focus and hover are different visual treatments, not one shared highlight
- Buttons and the theme toggle ease their background and border on hover and show a slight press feedback on pointer-down, immediately, before the resulting recompute
- The theme toggle recolors every surface, text, bar, and accent when switched between light and dark
- The filter pill appears when a filter is applied and disappears when it is cleared; the active row reflects the current filter state
- Selects show a focus ring on keyboard focus; the whole core flow (choose site, choose range, apply a row filter, clear it) is completable with the keyboard alone and, equivalently, with the pointer alone
</motion>

<requirements>
- Use React 19, React state with Context for the shared dashboard state, a charting library for the visitors trend, and Tailwind CSS v4. Build tooling may be Vite or an equivalent SPA setup
- No authentication wall: open directly into the dashboard workspace. The app is frontend-only and self-contained, with no live backend and no build-time data source
- Seed enough local sample data that the dashboard is non-empty on first load: at least three selectable sites, at least four date ranges, and per-site breakdown data for sources, pages, and countries with more entries than the four shown per panel
- The default view (example.com, Last 30 days, no filter) must show exactly: unique visitors 16,840, total pageviews 47,220, bounce rate 44%, visit duration 98s; Top Sources Google 7,200 / Direct 4,800 / Twitter 1,600 / Newsletter 980; Top Pages / 12,800 / /pricing 5,600 / /blog 3,900 / /docs 2,800; Countries United States 6,400 / United Kingdom 2,400 / Germany 1,900 / Canada 1,200
- All displayed numbers must be computed from the seeded data through a single shared derivation, not hardcoded per view: applying a filter, changing the site, or changing the date range recomputes the metric tiles, the trend, and the breakdown panels from that same data. Repeating an interaction with a different input must produce different output
- Applying a segment filter must set the metric tiles to that segment and recompute the other panels; replacing one filter with another keeps only the latest; clearing a filter (via the pill or a Clear filter control) restores the unfiltered values with no residual pill
- Persist the shared state (selected site, date range, sort, theme, and active filter) in localStorage or equivalent client storage so that a full reload restores it
- Breakdown rows must be real, keyboard-operable controls with visible focus, so the segment-filter flow is completable with the keyboard alone as well as with the pointer
- The document must set a descriptive title naming the app and the current site, and the root html element must carry a lang attribute
- WebMCP is a required delivery step: expose the browse-query operations (open a site, apply a filter, clear a filter, sort, set theme) as tools bound to the real product values, invoking the same state changes as the visible controls
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

Bindings:
- Destinations: example.com; blog.example.com; shop.example.com
- Browsable entity: visitor-sessions
- Filters: source; page; country; period
- Sorts: most-visitors; fewest-visitors; name-az
- Themes: light; dark

Mechanics exclusions:
- Chart bar hover/tooltip stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
