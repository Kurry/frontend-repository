<summary>
Build a frontend-only, privacy-friendly web analytics dashboard modeled on Plausible Analytics, using React 19 with Next.js static-export or client-hydration delivery, React state with Context for shared state, Tailwind CSS 4.3.2, and Headless UI. The app opens directly into a single-screen dashboard for one selected site and date range: summary metric tiles, a visitors trend chart, Top Sources, Top Pages, and Countries breakdown panels whose rows act as stackable segment filters, and a Goals panel with a conversion funnel. Site-create, segment-filter, saved-segment, and goal-create forms use API-shaped field contracts so each created record is the would-be request body. Segment filters stack across dimensions and can be saved and reapplied as named segments; the date range includes a custom from/to option; metric tiles carry threshold alerts. The app produces the operator's stats report files — a Stats JSON aggregate, a Breakdown CSV, and per-panel CSV exports compiled live from the current dashboard — so the session's filtered metrics, saved segments, goals, and funnel leave with the user. There is no backend, no login, and no build-time data source; all numbers are computed in the browser from seeded sample data.
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

Feature: Analytics dashboard shell —
- The first screen is the analytics dashboard with summary metrics and breakdown panels, reached at the root URL with no login, signup, SSO, or invite gate
- The top bar shows a brand cluster (a gradient logo mark, the title Plausible Analytics, and a subtitle naming the current site) on the left and, on the right, a site selector, a date-range selector (with preset ranges and a Custom option), a sort selector, Undo, Redo, a Compare previous control, a bounce-rate ceiling control, a unique-visitors floor control, a Save segment control, a Segments menu, an Export report control, and a theme toggle
- Four summary metric tiles are visible together: unique visitors, total pageviews, bounce rate, and visit duration. On first load for example.com over Last 30 days they read 16,840 unique visitors, 47,220 total pageviews, 44% bounce rate, and 98s visit duration
- A visitors trend chart is present below the metric tiles, rendered as a bar per time bucket rising left to right, computed from the same seeded data as the metric tiles; the plotted bars change whenever the site, date range, or active segment filter changes
- Three breakdown panels are present: Top Sources (Google 7,200, Direct 4,800, Twitter 1,600, Newsletter 980), Top Pages (/ 12,800, /pricing 5,600, /blog 3,900, /docs 2,800), and Countries (United States 6,400, United Kingdom 2,400, Germany 1,900, Canada 1,200). Each panel shows the top four rows, each row a name on the left and a visitor count on the right
- Clicking a Top Sources, Top Pages, or Countries row applies a segment filter for that dimension: a filter pill naming the dimension and value appears, and the summary metric tiles, the trend chart, the Goals panel and funnel, and the other panels all recompute to that segment. Different segments yield different numbers
- Filters stack across dimensions: a source, a page, and a country filter can be active at the same time, each shown as its own removable pill, and the dashboard recomputes to the intersection of all active filters. Clicking a second row within a dimension that already has a filter replaces that dimension's filter rather than adding a second pill for the same dimension
- Each filter pill has its own remove affordance that drops only that dimension's filter, and a Clear filter control removes every active filter at once, returning the metric tiles, trend, and panels to their unfiltered values with no stale pill left behind
- Changing the sort reorders the rows in all three breakdown panels (most visitors, fewest visitors, or name A to Z); switching from most visitors to fewest visitors reverses each panel's row order, and switching back restores the original order

Feature: Add site with Sites API field contract —
- An Add site control opens a form with three fields that mirror a site-create request body: site name, domain, and timezone
- Field contract (all required): site name is 1 to 64 characters; domain is a lowercase hostname of 3 to 253 characters matching a plausible domain shape (labels of letters, digits, and hyphens separated by dots, with at least one dot, no protocol, no path, no port, no whitespace); timezone is one of exactly UTC, America/New_York, Europe/London, Asia/Tokyo
- Each field shows an inline validation message naming that field when it is empty or fails its rule, before any submit, and the submit control stays disabled until all three fields are valid
- Submitting a valid Add site form closes the form, adds exactly one new site whose stored record is the submitted name, domain, and timezone, adds exactly one new entry to the site selector labeled with that domain, and selecting that new site shows its dashboard
- A newly added site's domain and timezone appear in the Stats JSON export sites list and in the site object when that site is selected

Feature: Compare previous period —
- A Compare previous control toggles a compare mode; when on, each of the four metric tiles shows a signed percent-change chip next to its value, computed against the immediately previous period of equal length for the same site and active filter stack
- When compare is on, each row in the Top Sources, Top Pages, and Countries panels also shows a signed percent-change chip giving that row's visitor change versus the same row in the previous period; rows absent from the previous period show a new indicator rather than a percentage
- When compare is on, the visitors trend chart overlays the previous period as a visually distinct second series (a line or lighter secondary bars) drawn against the same buckets as the current period, so the two periods can be read together; turning compare off removes the overlay
- Turning compare off removes every percent-change chip and the trend overlay; turning it on again restores chips whose values change when the site, date range, or segment filter stack changes
- Two different date ranges with compare on produce different chip values for at least one metric tile

Feature: Metric threshold alerts —
- Two metric threshold controls are available: a bounce-rate ceiling and a unique-visitors floor. The bounce-rate ceiling accepts an integer from 0 through 100 inclusive with a default on first load of 60; the unique-visitors floor accepts an integer from 0 through 1,000,000 inclusive with a default on first load of 0
- When the currently displayed bounce-rate tile value is strictly greater than the ceiling, the bounce-rate tile shows a High bounce text label in addition to any accent color; when the bounce rate is less than or equal to the ceiling, that label is absent
- When the currently displayed unique-visitors tile value is strictly less than the floor, the unique-visitors tile shows a Low traffic text label in addition to any accent color; when the visitors value is greater than or equal to the floor, that label is absent
- Changing the ceiling across the current bounce-rate value toggles the High bounce label in the same interaction, and changing the floor across the current visitors value toggles the Low traffic label in the same interaction; the applied ceiling appears in the Stats JSON export as bounce_rate_ceiling and the applied floor as visitor_floor
- Entering a non-integer, a value below 0, or a value above the field's maximum (100 for the bounce-rate ceiling, 1,000,000 for the visitor floor) shows an inline validation message naming that specific field and does not apply the change

Feature: Segment filter API field contract —
- Every active filter and every saved-segment filter entry is an API-shaped object with exactly two required keys: dimension and value. Field contract: dimension is one of exactly source, page, or country; value is a non-empty string of 1 to 200 characters with no leading or trailing whitespace
- Clicking a breakdown row creates that filter object and applies it; the filter pill text uses the dimension label and the value; Stats JSON filters and each saved_segments entry's filters array use the same dimension and value keys and values
- A filter whose dimension or value fails the contract is never applied: no pill appears and the dashboard numbers stay unchanged

Feature: Saved segments —
- A Save segment control opens a form whose request body is name plus filters: the segment-name field is required and 1 to 40 characters, and filters is the current active filter stack (array of dimension/value objects per the segment filter field contract)
- The name shows an inline validation message naming the segment-name field when it is empty or too long, and the save control stays disabled until the name is valid
- Saving stores the current stack of active filters under that name as the would-be saved-segment request body; a saved segment with no active filters is rejected with an inline message naming the filters field rather than saving an empty segment
- A Segments menu lists every saved segment by name; choosing one replaces the current filter stack with that segment's saved filters and recomputes the metric tiles, trend, panels, Goals, and funnel to that stack, and shows the corresponding pills
- Each saved segment in the Segments menu has a delete affordance that removes it from the list; deleting the currently applied segment leaves the applied filters in place but removes the saved entry
- Saved segments survive a full page reload and appear in the Stats JSON export as a saved_segments array, each entry an object with a name and a filters array of dimension/value objects matching the field contract

Feature: Custom date range —
- The date-range selector offers a Custom option alongside the presets; choosing Custom reveals a from date input and a to date input
- The custom range validates inline before it applies: both from and to are required, from must be on or before to, and both must fall within the seeded data window; a violation shows an inline message naming the offending date field and does not apply the range
- Applying a valid custom range recomputes the metric tiles, trend chart, breakdown panels, Goals, and funnel for exactly that span, shows the chosen range as the period label in the top bar, and exports as the period value in Stats JSON
- A custom range covering a different span than a preset produces different metric-tile numbers than that preset

Feature: Add goal with Goals API field contract —
- An Add goal control opens a form with three fields that mirror a goal-create request body: name, goal_type, and match_key
- Field contract (all required): name is 1 to 64 characters; goal_type is one of exactly event or page; match_key is 1 to 200 characters and must match the goal_type rule — when goal_type is event, match_key is a custom-event name of letters, digits, dots, underscores, and hyphens only with no whitespace; when goal_type is page, match_key is a path that starts with a slash, contains no whitespace, and is not only a slash
- Each field shows an inline validation message naming that field when it is empty or fails its rule, before any submit, and the submit control stays disabled until all three fields are valid
- Submitting a valid Add goal form closes the form, adds exactly one new goal whose stored record is the submitted name, goal_type, and match_key, appends that goal to the Goals panel with completions and conversion rate for the current segment stack and period, and includes that goal object in the Stats JSON goals array
- A goal whose name duplicates an existing goal name (seeded or previously added) is rejected with an inline message naming the name field and does not add a second entry
- Goals added in the session survive a full page reload for the selected site and remain in the Stats JSON goals array after reload

Feature: Goals and conversion funnel —
- A Goals panel lists at least three seeded goals — Signup, Pricing viewed, and Docs read — each conforming to the Goals API field contract (name, goal_type, match_key) and each showing a completions count and a conversion rate rendered as a percent, where the conversion rate is completions divided by the unique visitors of the current segment stack and period
- A conversion funnel shows an ordered sequence of at least three steps (for example Visited, Pricing viewed, Signup) with a per-step count, a proportional bar whose width tracks that step's count relative to the first step, and a step-to-step conversion percentage between consecutive steps
- A funnel step with a zero count shows 0% for every downstream step-to-step conversion rather than dividing by zero or showing a blank
- The Goals panel and the funnel recompute whenever the site, date range, or active filter stack changes; different segments and periods yield different completions, conversion rates, and funnel counts
- Goals appear in the Stats JSON export under a goals key as an array of objects each with name, goal_type, match_key, completions, and conversion_rate; the funnel appears under a funnel key as an array of step objects each with name, count, and step_conversion (the conversion from the previous step, with the first step's step_conversion equal to 100)

Feature: Per-panel CSV export —
- Each breakdown panel (Top Sources, Top Pages, Countries), the Goals panel, and the funnel carry a per-panel export control that produces CSV-shaped text for exactly that panel's currently visible rows under the active filter stack and period
- The breakdown-panel per-panel CSV uses the header line dimension,name,visitors; the Goals CSV uses the header line goal,completions,conversion_rate; the funnel CSV uses the header line step,count,step_conversion
- A per-panel CSV for an empty panel compiles to the header line only, with no stale rows from a previous selection
- The export drawer's combined Breakdown CSV across all three breakdown panels stays available in addition to the per-panel exports

Feature: Undo and redo —
- Undo reverses the most recent mutating action among add site, add goal, apply a segment filter, remove a single filter pill, clear all filters, save a segment, delete a saved segment, apply a saved segment, change the bounce-rate ceiling, change the unique-visitors floor, apply a custom date range, toggle compare previous, and successful import, restoring the prior dashboard numbers, filter stack and pills, sites list, goals list, saved segments, ceiling, visitor floor, date range, and compare mode
- Redo reapplies the most recently undone action with the same completeness; performing a new mutating action after an undo clears the redo stack and disables Redo
- Undo and Redo show enabled and disabled states that match whether a step is available

Feature: Stats report export and import (useful end state) —
- The app produces the operator's stats report files: an Export report control opens an export drawer with two format tabs — Stats JSON and Breakdown CSV — compiled LIVE from the current store and the currently displayed dashboard derivation
- Stats JSON is a single object whose required keys and nesting are: schema_version (exactly plausible-stats-v1); site (object with domain, name, timezone matching the Sites API field contract); period (the active date-range label, or the custom from/to span when a custom range is applied); filters (array of zero or more objects each with dimension and value per the segment filter field contract, one per active filter across the stacked dimensions); saved_segments (array of objects each with name and a filters array of dimension/value objects); compare_previous (boolean); bounce_rate_ceiling (integer 0 through 100); visitor_floor (integer 0 through 1,000,000); results (object with visitors, pageviews, bounce_rate, and visit_duration, each an object with a numeric value matching the four metric tiles); timeseries (array of objects each with date and visitors matching the trend chart buckets); breakdowns (object with source, page, and country arrays, each an array of objects with name and visitors matching the currently shown panel rows); goals (array of objects each with name, goal_type, match_key, completions, and conversion_rate matching the Goals panel and the Goals API field contract); funnel (array of step objects each with name, count, and step_conversion matching the funnel); sites (array of every site in the selector, each with domain, name, and timezone)
- Breakdown CSV is CSV-shaped text with a header line exactly dimension,name,visitors and one data line per currently shown breakdown row across Top Sources, Top Pages, and Countries, using dimension values source, page, and country
- Export content must reflect every mutation the session made — a site add, a goal add, a filter applied or removed, a cleared stack, a saved or applied or deleted segment, a custom range, a ceiling or floor change, a compare toggle, or an import that is visible in the UI must appear in the compiled export text before copy or download
- Each tab shows a monospaced preview; Copy writes the visible preview text to the clipboard and shows a brief copied confirmation; Download starts a file download of that same preview text
- Import accepts a previously exported Stats JSON: after a successful import the site selector, selected site, period, filter stack and pills, saved segments, compare mode, bounce-rate ceiling, visitor floor, metric tiles, trend, panels, Goals, funnel, and both export previews match the imported report; malformed input or JSON missing any required key shows an inline error naming the import field and leaves the dashboard unchanged
</core_features>

<user_flows>
- Applying a segment filter tracks across every surface: clicking the Google row in Top Sources shows a filter pill reading Source: Google, changes all four metric tiles away from their unfiltered values, redraws the trend chart bars, recomputes the Top Pages and Countries panels, and updates both export previews so Stats JSON filters and results match the filtered tiles, all without a reload; activating Clear filter restores every one of those surfaces to the exact unfiltered values
- Changing the site or the date range recomputes the metric tiles, the trend chart, all three breakdown panels, the Goals panel, and the funnel together, with no leftover rows from the previous selection, clears the entire active filter stack and all pills, and refreshes both export previews for the new selection
- Shared state survives a full page reload: after selecting a non-default site, date range, and sort, applying a stack of segment filters, saving a segment, switching the theme, setting a non-default bounce-rate ceiling and unique-visitors floor, and turning compare previous on, reloading the page restores the same site, range, sort, theme, filter stack and pills, saved segments, ceiling, floor, compare chips, and the same recomputed numbers on the tiles, chart, panels, Goals, and funnel
- Opening the dashboard by loading the root URL directly renders the same view as reaching it through in-app interaction, with no missing panels and no flash of placeholder content after first paint
- Adding a site through the Add site form increases the site selector's entry count by exactly one, the new site is immediately selectable, after selecting it the metric tiles, trend chart, and panels all show that site's data rather than the previous site's numbers, and the Stats JSON sites array and site object include the submitted domain, name, and timezone
- Bounce-rate ceiling flow: with the default example.com Last 30 days bounce rate at 44%, setting the ceiling to 40 shows the High bounce label on the bounce-rate tile; setting it back to 60 removes the label; Stats JSON bounce_rate_ceiling matches the control
- Compare previous flow: turning compare on shows a percent-change chip on each metric tile; changing the date range while compare stays on changes at least one chip value; turning compare off removes every chip
- Undo after adding a site restores the prior site-selector count and removes the new domain; Redo re-adds it; after a new filter applied following an undo, Redo is disabled
- Export then import round-trip: after adding a site or applying a filter, open Export report, Copy or Download the Stats JSON, then Import that same JSON — the site list, selected site, filter stack and pills, saved segments, metric tiles, ceiling, floor, goals, funnel, compare mode, and both export previews match the pre-export mutated state
- Stacked-filter and saved-segment round-trip: from the default view, click the Google row in Top Sources and the /pricing row in Top Pages so two pills stack and the tiles, panels, Goals, and funnel recompute to the intersection; open Save segment, name it, and save; activate Clear filter so all pills disappear and the numbers return to unfiltered; open the Segments menu and apply the saved segment — the two pills, the recomputed numbers, and the Stats JSON preview's filters array all return to the two-filter state with dimension and value keys, and saved_segments contains the named segment with its two filters
- Custom-range flow: choose the Custom date range, enter a valid from/to span narrower than Last 30 days, and apply — the metric tiles and trend change to numbers different from the Last 30 days preset, the top-bar period label shows the custom span, and the Stats JSON period value matches that span
- Threshold-alert flow: with example.com Last 30 days showing 44% bounce and 16,840 visitors, set the bounce-rate ceiling to 40 to show High bounce and set the unique-visitors floor to 20,000 to show Low traffic; the Stats JSON preview's bounce_rate_ceiling and visitor_floor match the two controls without reload; lowering the ceiling back to 60 and the floor back to 0 removes both labels
- Per-panel CSV after a filter: apply the Google source filter, then use the Top Pages panel's per-panel export — the produced CSV starts with dimension,name,visitors and lists exactly the filtered Top Pages rows then visible, not the unfiltered default rows
- Goals and funnel sensitivity: applying the Google source filter changes at least one goal's completions or conversion rate and at least one funnel step count away from the unfiltered values, and clearing the filter restores them
- Add goal field-contract flow: open Add goal, leave name empty or enter a goal_type of event with a match_key that includes whitespace — inline validation names the failing field and submit stays disabled; enter a valid name, goal_type event, and match_key, submit — the Goals panel gains exactly one new row with that name, and the Stats JSON goals array includes an object with that name, goal_type, and match_key
</user_flows>

<edge_cases>
- Filters stack across dimensions but only one per dimension: clicking a second row within the same dimension replaces that dimension's pill in place rather than adding a duplicate, while a row from a different dimension adds a new pill so up to three pills (one source, one page, one country) can be present at once
- Removing a single filter pill drops only that dimension's filter and leaves the others active and their numbers recomputed to the remaining stack; the Clear filter control removes every pill at once, leaving no residual pill and no stale filtered numbers on any tile, chart, or panel
- Stacking filters whose intersection has no visitors shows zero-value metric tiles and empty breakdown, Goals, and funnel panels with a message, not leftover numbers from a broader filter stack
- Saving a segment with a name that duplicates an existing saved segment shows an inline message naming the segment-name field and does not create a second entry with the same name; saving with no active filters is rejected with an inline message naming the filters field
- A custom date range with the from date after the to date, or either date outside the seeded data window, shows an inline message naming the offending date field and does not apply the range or change any displayed numbers
- A funnel step whose count is zero shows 0% for every downstream step-to-step conversion rather than a blank, an error, or a divide-by-zero artifact
- A per-panel CSV export for an empty panel compiles to its header line only, with no stale data rows from a previous selection
- Submitting the Add site form with an empty name, empty or malformed domain, or missing timezone adds no site: the selector's entry count is unchanged and an inline message names the failing field
- A domain that includes a protocol (https://), a path, a port, uppercase letters, or whitespace fails domain validation with an inline message naming the domain field and does not add a site
- Double-activating the Add site submit control creates exactly one site: the site selector gains exactly one new entry
- A newly added site with no seeded traffic shows zero-value metric tiles and empty breakdown panels with a message, not leftover numbers from the previously selected site; Breakdown CSV still compiles with only the header line when panels are empty
- Submitting the Add goal form with an empty name, a goal_type outside event or page, or a match_key that breaks the goal_type rule adds no goal: the Goals panel row count is unchanged and an inline message names the failing field
- An event goal whose match_key includes whitespace or a page goal whose match_key does not start with a slash fails match_key validation with an inline message naming the match_key field and does not add a goal
- Importing malformed Stats JSON or JSON missing schema_version, results, or sites shows an inline error naming the import field, leaves the site count and filter state unchanged, and does not clear undo history as if the import succeeded
- After Undo restores a cleared filter, Redo clears it again; after a new add-site following an undo, Redo is disabled and cannot resurrect the cleared redo stack
- Setting the bounce-rate ceiling outside 0 through 100, or the unique-visitors floor outside 0 through 1,000,000, shows inline validation naming that field and does not apply the change or alter the High bounce or Low traffic label
</edge_cases>

<visual_design>
- A single-page analytics dashboard composition on a light neutral page background: a sticky white top bar with a hairline bottom border, then a row of four metric tiles, then a dominant visitors trend chart card, then a three-column row of breakdown panels. This is the primary layout, not a login-centered or marketing layout
- Summary metrics and the visitors trend are the primary visual focus: large bold metric numbers over small muted labels, and a chart card that spans the full content width and stands taller than the panels below it
- Cards are white with a subtle 1px border, rounded corners near 12px, and a soft shadow. Content is bounded to a centered max width near 1120px rather than stretching edge to edge on wide screens
- The visitors bars use an indigo vertical gradient (lighter at the top, deeper indigo at the bottom). Indigo is the single accent hue, used for the logo mark, the active filter pill, active rows, and focus rings, over an otherwise neutral slate palette
- Breakdown rows read as a two-column list: a left-aligned name and a right-aligned, tabular-figure count in a muted color; the active (filtered) row is distinguished by the accent, not by color alone
- The active filter state is distinguished by one or more visible pills each reading Dimension: value with its own remove affordance, laid out in a wrapping row without overlapping when two or three are stacked, and matched by the recomputed metric tiles
- The High bounce and Low traffic labels each use a text label in addition to any accent so the alert is not color-only; compare percent-change chips sit beside metric values without crowding the tile number
- The Goals panel lists each goal with its name, a completions count, and a conversion-rate percent, and the funnel renders stacked horizontal step bars whose widths are proportional to each step's count with the step-to-step percentages legible; both share the card treatment of the breakdown panels
- When compare is on, the previous-period trend series is visually distinct from the current period (a different hue, opacity, or a line over the bars) and legible in both themes, and breakdown-row and tile percent-change chips read as small signed pills that do not overrun the row count
- The Save segment, Segments menu, and Custom date range controls, and the per-panel export controls on each breakdown, Goals, and funnel panel, use the same icon set and accent treatment as the rest of the top bar and cards rather than unstyled default controls
- The export drawer shows format tabs labeled Stats JSON and Breakdown CSV, a monospaced preview block, and Copy / Download / Import actions
- Icons in the top bar, selectors, filter pill, export drawer, and empty states come from one consistent icon set with a uniform stroke weight, never mixed styles
- A light and a dark theme are both supported; every text-on-surface pairing that is legible in one theme stays legible in the other
</visual_design>

<motion>
- Bars animate their height with a short eased transition when the metric segment, site, or date range changes, so a recompute reads as a visible update rather than an instant swap
- Changing the sort animates breakdown rows to their new positions rather than snapping them instantly
- Breakdown rows take an accent hover wash and a distinct, clearly visible focus ring; focus and hover are different visual treatments, not one shared highlight
- Buttons and the theme toggle ease their background and border on hover and show a slight press feedback on pointer-down, immediately, before the resulting recompute
- The theme toggle recolors every surface, text, bar, and accent when switched between light and dark
- A filter pill animates in when its filter is applied and animates out when that pill is removed or the stack is cleared; with two or three pills stacked, adding or removing one animates only that pill while the others hold position, and the active rows reflect the current filter stack
- The funnel step bars animate their width and the Goals conversion figures update with a short eased transition when the site, range, or filter stack changes, rather than snapping instantly
- The previous-period trend overlay and the breakdown-row percent-change chips ease in when compare turns on and ease out when it turns off, in step with the tile compare chips
- The Add site form, the Add goal form, and the export drawer enter and exit with a short eased transition of roughly 200 to 300 milliseconds rather than appearing instantly
- Feedback toasts after export copy and successful import slide in, remain readable, and auto-dismiss with a fade
- Compare percent-change chips ease in when compare turns on and ease out when it turns off
- With prefers-reduced-motion set, transitions are removed or reduced to fades and every state change still applies instantly and completely
</motion>

<responsiveness>
- At mobile width the metric tiles, chart, breakdown panels, Goals panel, and funnel reflow into a single stacked column that preserves the metrics-then-chart-then-panels-then-goals hierarchy, and the site, date-range, clear-filter, undo, redo, compare, ceiling, floor, Save segment, Segments menu, and export controls stay reachable without horizontal scrolling
- At 375 pixel width no content clips or overflows the viewport and no horizontal scrollbar appears, and a stack of two or three filter pills wraps onto multiple lines rather than forcing horizontal scroll
- The export drawer, the bounce-rate ceiling and unique-visitors floor controls, the compare control, the custom date-range inputs, and each panel's per-panel export control stay fully visible and operable at 375 pixel width rather than rendering off-screen
</responsiveness>

<accessibility>
- Breakdown rows are keyboard operable: moving focus to a row and pressing Enter or Space applies its filter, and the focused row shows a visible focus indicator
- The site, date-range, and sort selectors open with the keyboard, move through their options with the arrow keys, commit with Enter, and close with Escape, with the highlighted option visibly distinct
- Selects, the theme toggle, Undo, Redo, Compare previous, the bounce-rate ceiling control, and Export report show a visible focus ring on keyboard focus; the whole core flow (choose site, choose range, apply a row filter, clear it, open export, copy) is completable with the keyboard alone and, equivalently, with the pointer alone
- The Add site form and the export drawer trap focus while open, close on Escape, and return focus to the control that opened them
- Inline validation messages in the Add site form, the bounce-rate ceiling and unique-visitors floor controls, the Save segment name field, the custom date-range fields, and the import field are exposed to assistive technology as well as shown visually
- The High bounce label, the Low traffic label, and compare percent-change chips convey state with text in addition to color
- The Segments menu, the Save segment control, the Custom date-range inputs, and each panel's per-panel export control are reachable and operable with the keyboard alone, and each filter pill's remove affordance is a focusable control with an accessible name naming the dimension it clears
- Export copy and import completion are announced through an aria-live region as well as shown visually
</accessibility>

<performance>
- The dashboard is interactive within 2 seconds of a local cold load
- No console errors, warnings, or hydration mismatch messages appear on load or during a full exercise of the app
- Rapid repeated filter stacking and removal, sort, site, theme, compare, ceiling, floor, saved-segment apply, and custom-range changes stay responsive with no hangs, dropped interactions, or stale panels, and the Goals panel and funnel recompute in step without lag
- Triggering a per-panel CSV export regenerates that panel's CSV text without freezing the UI
- After first paint there is no post-hydration content flash: the rendered shell does not visibly re-render or shift as the app becomes interactive
- Opening the export drawer and switching between Stats JSON and Breakdown CSV regenerates the preview without freezing the UI
</performance>

<writing>
- All UI text is sentence case; headings, labels, and counts use numerals, and short labels carry no terminal period
- Action labels are specific (Clear filter, Add site, Add goal, Export report, Compare previous, Save segment) rather than generic; empty states explain what belongs there; no placeholder or lorem text appears anywhere in the shipped UI
- Export drawer tab labels read Stats JSON and Breakdown CSV; the High bounce and Low traffic flags use those exact phrasings; the Goals and funnel sections and their step-to-step conversion percentages are clearly labeled; validation messages name the field and the fix
</writing>

<innovation>
- Beyond the required dashboard, reward a polished analytics-console touch that helps an operator trust the report artifact — for example a structured export summary strip naming site domain, period, and visitors total above the preview, keyboard shortcuts for Undo/Redo, a compact chip showing the active filter stack in the export drawer header, a funnel step drill-down, or a side-by-side compare of two saved segments — only where it is browser-observable and does not replace a required behavior
</innovation>

<requirements>
- Use React 19 delivered through Next.js as a static export or a client-hydrated build: all interactivity lives in client state after load, with no server actions, no API routes, and no runtime data loaders. Use React state with Context for the shared dashboard state and Tailwind CSS 4.3.2 for styling
- Use Headless UI for the site, date-range, and sort selectors, the theme toggle, the Add site dialog, the Add goal dialog, the export drawer, the Save segment dialog, the Segments menu, and the custom date-range popover. Use Recharts for the visitors trend chart (including the previous-period compare overlay) and the conversion funnel bars. Use TanStack Table to drive the breakdown panels' rows and sorting. Exactly these; no other component libraries
- Motion for React is allowed for animation (chart transitions, row reorder, pill and dialog enter/exit, export drawer, toasts); no other animation libraries
- Phosphor icons via the React package only; no other icon sets and no raw pasted SVG icon copies
- All forms, including the Add site form, the Add goal form, the bounce-rate ceiling and unique-visitors floor controls, the Save segment form, the custom date-range from/to inputs, and import validation, are driven by React Hook Form with a Zod schema: the schema defines the validation rules and the form surfaces inline per-field errors before submit, with submit disabled until valid. Schemas mirror the payload shapes the domain APIs would accept — a site-create body with name, domain, and timezone; a goal-create body with name, goal_type, and match_key; a segment-filter object with dimension and value; a metric-alerts settings body with a bounce-rate ceiling integer 0 through 100 and a visitor-floor integer 0 through 1,000,000; a saved-segment body with a name of 1 through 40 characters and a filters array of dimension/value objects; a custom-range body with from and to dates bounded to the seeded window with from on or before to; and the Stats JSON report object with the keys listed under Export report — so a created site or goal record IS the would-be request body and exports/imports conform to those same schemas
- All libraries are installed via npm and bundled locally; no CDN imports of any script, style, font, or icon
- No authentication wall: open directly into the dashboard workspace. The app is frontend-only and self-contained, with no live backend and no build-time data source
- Seed enough local sample data that the dashboard is non-empty on first load: at least three selectable sites, at least four preset date ranges plus a custom-range option, per-site breakdown data for sources, pages, and countries with more entries than the four shown per panel, and per-site goal data for at least three goals (Signup, Pricing viewed, Docs read) and at least three funnel steps, all resolvable for the current segment stack and period
- The default view (example.com, Last 30 days, no filter) must show exactly: unique visitors 16,840, total pageviews 47,220, bounce rate 44%, visit duration 98s; Top Sources Google 7,200 / Direct 4,800 / Twitter 1,600 / Newsletter 980; Top Pages / 12,800 / /pricing 5,600 / /blog 3,900 / /docs 2,800; Countries United States 6,400 / United Kingdom 2,400 / Germany 1,900 / Canada 1,200
- All displayed numbers must be computed from the seeded data through a single shared derivation, not hardcoded per view: applying or removing a filter, applying a saved segment, changing the site, changing the date range (preset or custom), or changing a threshold recomputes the metric tiles, the trend, the breakdown panels, the Goals panel, the funnel, compare chips and the previous-period overlay, the High bounce and Low traffic labels, and both export previews from that same data. Goal completions, goal conversion rates, and funnel step counts are all derived from the seeded data for the current segment stack and period, never hardcoded. Repeating an interaction with a different input must produce different output
- Segment filters stack across dimensions (source, page, country): each dimension holds at most one active filter, clicking a new row within a dimension replaces that dimension's filter, and the displayed numbers reflect the intersection of the whole stack; removing a single pill drops only that dimension while clearing removes all pills and restores the unfiltered values with no residual pill
- All shared state lives in the one Context store — selected site, date range including a custom from/to span, sort, theme, the active filter stack, saved segments, sites added through the form, goals added through the form, bounce-rate ceiling, unique-visitors floor, compare previous, undo/redo stacks, and export drawer state — with every view (including the Goals panel and funnel) deriving from it, never a second disconnected copy
- Persist the shared state (selected site, date range including any custom span, sort, theme, the active filter stack, saved segments, added sites with name/domain/timezone, added goals with name/goal_type/match_key, bounce-rate ceiling, unique-visitors floor, and compare previous) in localStorage or equivalent client storage so that a full reload restores it
- Breakdown rows must be real, keyboard-operable controls with visible focus, so the segment-filter flow is completable with the keyboard alone as well as with the pointer
- The document must set a descriptive title naming the app and the current site, and the root html element must carry a lang attribute
- WebMCP is a required delivery step: expose the browse-query, form-workflow, and artifact-transfer operations (open a site, the export drawer, or the Goals view; apply a filter including a saved-segment or custom-range filter; clear a filter; sort; set theme; validate/submit/cancel the Add site, Add goal, metric-alerts ceiling and floor, Save segment, and custom-range forms; export/import/copy report and per-panel CSV) as tools bound to the real product values, invoking the same state changes as the visible controls, through the same shared store commands as the UI
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
- Destinations: example.com; blog.example.com; shop.example.com; export-drawer; goals-view
- Browsable entity: visitor-sessions
- Filters: source; page; country; period; saved-segment; custom-range
- Sorts: most-visitors; fewest-visitors; name-az
- Themes: light; dark
- Form fields: site-name; domain; timezone; bounce-rate-ceiling; visitor-floor; segment-name; custom-from; custom-to; goal-name; goal-type; goal-match-key; import
- Form operations: validate; submit; cancel
- Value bounds: bounce-rate-ceiling 0-100; visitor-floor 0-1000000; segment-name 1-40 chars; custom-from within seeded data window; custom-to within seeded data window and on or after custom-from; site-name 1-64 chars; domain 3-253 hostname; timezone one of UTC, America/New_York, Europe/London, Asia/Tokyo; goal-name 1-64 chars; goal-type one of event, page; goal-match-key 1-200 chars per goal_type rules; filter-dimension one of source, page, country; filter-value 1-200 chars
- Artifact operations: export; import; copy
- Export formats: stats-json; breakdown-csv; panel-csv
- Import modes: stats-json

Mechanics exclusions:
- Chart bar hover/tooltip stays Playwright-observed
- Export drawer slide and toast enter/exit timing stays Playwright-observed
- Compare chip ease-in/out timing stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
