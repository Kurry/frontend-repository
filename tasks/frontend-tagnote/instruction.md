<summary>
Build a TagNote personal note-timeline app using Qwik, Qwik stores, and Tailwind CSS.
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
- The app opens at / into a single-column timeline shell: a sticky top bar titled TagNote with Calendar, Archived, History, Apply Scenario Change, Undo, and Redo controls, a search field, a horizontal tag rail, the scrolling note timeline, and a composer pinned to the bottom of the screen; no backend routes exist and no navigation leaves the page
- Before any note exists the timeline shows a friendly empty-state prompt inviting the user to send the first note, not a blank area
- The bottom composer has a single-line text input and a visible Send control; typing text and clicking Send OR pressing Enter appends the note to today's section of the timeline and clears the input for the next note
- Submitting a blank or whitespace-only note is prevented AND explained: no note is appended and the composer shows a visible inline error message plus a brief shake animation on the input row; a silently disabled Send control alone is not sufficient
- Any hash-word token typed inside a note (for example writing call mom #family #todo) is parsed into tag chips shown beneath that note bubble; that example produces exactly two chips reading family and todo, and a note may carry any number of tags
- Tag matching is case-insensitive and deduplicated: a note containing #Work and a note containing #work both count toward one single work tag, and the tag rail lists work once with a usage count of 2
- If a note's text contains a URL starting with http:// or https://, the app automatically adds a link tag to that note in addition to any typed tags and renders the URL as a clickable anchor inside the note bubble
- A horizontal tag rail above the timeline lists every distinct tag currently used on non-archived notes with its usage count; clicking a tag filters the timeline to only notes carrying that tag and reveals a Clear filter control, and clicking the same tag again (or Clear filter) removes the filter and restores the full timeline
- Each tag chip in the tag rail has a Make TODO control; once a tag is marked as a TODO tag, every note carrying that tag shows a checkbox before its text, and that tag's filtered view splits into an Open section (unchecked notes) and a Done section (checked notes) based on each note's checkbox state
- Each note has a Pin control; pinned notes appear in a Pinned section rendered above the chronological timeline, and an Unpin control returns the note to its original chronological position
- Each note has an Archive control that removes it from the main timeline into a separate Archived view opened from the Archived control; an Unarchive control restores it to its original chronological position in the main timeline. The Archived view shows a short empty message when nothing is archived
- Each note has an Edit control that loads its raw text back into the composer (the composer switches to an Editing note mode with a Save control and a Cancel control); saving re-derives tags and links from the edited text from scratch, so a tag removed from the text no longer applies and a newly typed tag or URL is added
- Each note has a Delete control that opens a confirmation dialog; the note is permanently removed only after confirming, and canceling leaves it in place
- Each note has an Attach File control that opens the file picker; once a file is chosen the note shows a chip with the file's name and human-readable size and automatically receives a file tag
- A search field filters the currently visible list (main timeline, an active tag filter, or the Archived view) by keyword matched across both note text and tag names; searching within an active tag filter narrows within that filter rather than ignoring it, and a search or filter matching nothing shows an explicit no results message
- The timeline groups notes under date headers reading Today, Yesterday, or the full weekday-month-day-year date for older notes, keyed to each note's original creation timestamp; editing a note's text does not move it to a new date group
- A Calendar control opens a month-grid view with Previous and Next controls to move between months; each day cell that has one or more notes shows a marker dot, clicking a marked day filters the timeline to only the notes created that day, and clicking the same day again clears the filter; the currently selected day is highlighted distinctly from other days
- Undo and Redo controls plus an Apply Scenario Change control model note edits as an explicit transition history; the History panel exposes a region labelled History state showing the current snapshot, lists past and future states that can be jumped to, and when the user undoes and then makes a different change the abandoned redo path becomes a separately selectable branch rather than being silently discarded
- The full timeline (note text, tags, TODO-tag designations, per-note done state, pin state, archive state, and attachment metadata) survives a full page refresh and is restored exactly
</core_features>

<visual_design>
- Single centered column (max width around 42rem) over a light canvas colored #F5F5F7, with primary ink #1D1D1E; the top bar and composer are sticky so the composer stays reachable at the bottom while the timeline scrolls between them
- Note bubbles are white cards with a 7px border radius and a subtle shadow that deepens on hover; a pinned note carries a small pin indicator badge in the secondary accent color #FFCC00
- Primary calls to action (Send, Apply Scenario Change, and the active states of Calendar/Archived/tag chips) use background #007AFF with near-white text and a full pill radius (1000px) and no shadow; secondary controls (Pin, Archive, Edit, Attach File, Make TODO, inactive tag chips) use background #E6EEF7 with #007AFF text, the same full pill radius, and no shadow
- A given tag renders with identical chip styling everywhere it appears: in the note bubble, in the tag rail, and in the TODO split view. The currently selected tag in the rail shows a distinct filled-accent treatment (accent background, white text) versus the unselected chips
- Typography uses the SF Pro family with an -apple-system, BlinkMacSystemFont fallback stack; the h1 title renders at 34px, section h2 headers at 17px, and body/note text at 17px. Spacing and gaps follow a 4px-multiple scale
- Links inside note bubbles render in the #007AFF link color, visually distinct from surrounding note text
- Calendar day cells with notes are visually distinguishable from empty days by a marker; the active-filter day is highlighted distinctly from both empty and today's cell
- Empty states are explicit and friendly: the first-note prompt, a no results message for empty filters/searches, and a short message for an empty Archived view
- At approximately 375px wide the app renders with no page-level horizontal scrolling; the tag rail scrolls horizontally inside its own container rather than breaking the layout, long note text and URLs wrap rather than overflow, and the composer stays pinned and legible at the bottom
</visual_design>

<motion>
- Sending, pinning/unpinning, archiving/unarchiving, attaching a file, and deleting a note each surface a transient toast confirmation that appears immediately and auto-dismisses after about 2.5 seconds
- Submitting a blank note plays a short shake animation (about 0.3s) on the composer input row alongside the inline error
- The Send control and other buttons ease their background color on hover and depress slightly (scale down) on active press; tag chips, note action controls, and note bubbles show a visible hover state distinct from their resting state
- Keyboard Tab focus is clearly visible on interactive controls (an accent outline/ring) and follows a logical reading order
- Selecting a tag, opening Calendar or Archived, and switching views update the timeline in place without a full page reload; the active view's control reflects the current state
</motion>

<requirements>
Shared application state must live in Qwik stores (useStore): the notes collection, per-note tags/pin/archive/done state, the set of TODO-designated tags, the active tag/date/search filters, the active view (timeline, calendar, archived), and the undo/redo transition history. Do not stand up a backend or authentication.
Persistence: the app MUST persist the full note collection and its derived state to localStorage and restore it exactly on reload. Guard localStorage access so the production build does not crash where it is unavailable. (This localStorage persistence is a required product behavior for this task.)
State and parsing contracts (behavioral, not storage keys):
- Sending a valid note appends exactly one note under today's date header; the parsed tag chips equal the deduplicated case-insensitive set of hash-word tokens in the text, plus a link tag when the text contains an http(s) URL, plus a file tag when a file is attached
- Editing a note re-derives its tags and links entirely from the new text (removed tokens drop their tags; added tokens/URLs add theirs) and preserves the note's original creation date grouping
- Deleting a note requires an explicit confirmation step and removes it from the timeline, any filtered views, and derived tag counts
- Pin/Unpin, Archive/Unarchive, and the TODO checkbox toggle only the targeted note's state and immediately update every view that reflects it
- Tag filter, calendar-day filter, and search recompute the visible list from the single shared collection; search narrows within an active tag filter rather than replacing it, and search matches across both note text and tag names
- Marking a tag as a TODO tag adds a checkbox to every note carrying that tag and splits that tag's filtered view into Open and Done sections
- Undo and Redo restore the immediately adjacent history states, Apply Scenario Change commits a new visible transition, the History panel exposes the current snapshot under a History state label, and undoing then making a different change creates a separately selectable branch rather than flattening history
Adversarial and rapid-use robustness:
- A blank/whitespace-only submission adds no note and shows visible feedback; the last valid state is never damaged
- The primary send workflow must withstand at least 25 rapid deterministic submissions through the Send control with the final visible count exact, controls responsive, and no blank screen, uncaught error, or sustained freeze
Seeds and empties: the app starts with an empty timeline and shows the first-note empty-state prompt; empty filters/searches and an empty Archived view show explicit messages rather than blank regions.
Chrome and libraries: zero outbound navigational links for app chrome (in-app controls only); render note text safely (escape user input before inserting parsed links). Build tooling is Vite; hand-rolled Tailwind styling is expected and no external component library is required.
Responsive: at approximately 375px wide the page must not scroll horizontally; the tag rail scrolls within its own container and the composer stays pinned at the bottom.
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
- Browsable entity: notes
- Destinations: timeline; calendar; archived
- Filters: tag
- Entity: note
- Entity operations: create; select; update; delete; toggle
- Entity fields: text; tags

Mechanics exclusions:
- Attach File native OS file picker stays Playwright-observed
- Make-TODO tag-rail toggle and Open/Done split stays Playwright-observed
- Calendar day-marker selection and month navigation stays Playwright-observed
- Toast auto-dismiss and blank-submit shake animation timing stays Playwright-observed
- Undo/Redo branch traversal in the History panel stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
