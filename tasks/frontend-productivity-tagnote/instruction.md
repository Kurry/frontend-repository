<summary>
Build a TagNote personal note-timeline app using Qwik, Qwik stores, Tailwind CSS 4.3.2, and DaisyUI.
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
- The app opens at / into a single-column timeline shell: a sticky top bar titled TagNote with Calendar, Archived, History, Apply Scenario Change, Undo, and Redo controls, a search field, a horizontal tag rail, the scrolling note timeline, and a composer pinned to the bottom of the screen; no backend routes exist and no navigation leaves the page
- The bottom composer is a single-line text editing surface with Bold and Italic formatting toggles and a visible Send control; typing text and clicking Send OR pressing Enter appends the note to today's section of the timeline and clears the input for the next note
- Selecting text in the composer and activating Bold renders that span bold in the composer and in the sent note bubble; applying Italic works the same way; activating the same toggle again on the same span removes the formatting, and formatting never changes which hash-word tags are parsed from the note's plain text
- Pressing the standard undo keyboard shortcut while typing in the composer reverts the last typing or formatting change inside the composer only, without touching the timeline's own Undo and Redo history
- Any hash-word token typed inside a note (for example writing call mom #family #todo) is parsed into tag chips shown beneath that note bubble; that example produces exactly two chips reading family and todo, and a note may carry any number of tags
- Tag matching is case-insensitive and deduplicated: a note containing #Work and a note containing #work both count toward one single work tag, and the tag rail lists work once with a usage count of 2
- If a note's text contains a URL starting with http:// or https://, the app automatically adds a link tag to that note in addition to any typed tags and renders the URL as a clickable anchor inside the note bubble
- A horizontal tag rail above the timeline lists every distinct tag currently used on non-archived notes with its usage count; clicking a tag filters the timeline to only notes carrying that tag and reveals a Clear filter control, and clicking the same tag again (or Clear filter) removes the filter and restores the full timeline
- Each tag chip in the tag rail has a Make TODO control; once a tag is marked as a TODO tag, every note carrying that tag shows a checkbox before its text, and that tag's filtered view splits into an Open section (unchecked notes) and a Done section (checked notes) based on each note's checkbox state
- Each note has a Pin control; pinned notes appear in a Pinned section rendered above the chronological timeline, and an Unpin control returns the note to its original chronological position
- Each note has an Archive control that removes it from the main timeline into a separate Archived view opened from the Archived control; an Unarchive control restores it to its original chronological position in the main timeline
- Each note has an Edit control that loads its text, with any bold or italic formatting preserved, back into the composer (the composer switches to an Editing note mode with a Save control and a Cancel control); saving re-derives tags and links from the edited text from scratch, so a tag removed from the text no longer applies and a newly typed tag or URL is added
- Each note has a Delete control that opens a confirmation dialog; the note is permanently removed only after confirming, and canceling leaves it in place
- Each note has an Attach File control that opens the file picker; once a file is chosen the note shows a chip with the file's name and human-readable size and automatically receives a file tag
- A search field filters the currently visible list (main timeline, an active tag filter, or the Archived view) by keyword matched across both note text and tag names; searching within an active tag filter narrows within that filter rather than ignoring it
- The timeline groups notes under date headers reading Today, Yesterday, or the full weekday-month-day-year date for older notes, keyed to each note's original creation timestamp; editing a note's text does not move it to a new date group
- A Calendar control opens a month-grid view with Previous and Next controls to move between months; each day cell that has one or more notes shows a marker dot, clicking a marked day filters the timeline to only the notes created that day, and clicking the same day again clears the filter; the currently selected day is highlighted distinctly from other days
- Undo and Redo controls plus an Apply Scenario Change control model note edits as an explicit transition history; the History panel exposes a region labelled History state showing the current snapshot, lists past and future states that can be jumped to, and when the user undoes and then makes a different change the abandoned redo path becomes a separately selectable branch rather than being silently discarded
</core_features>

<user_flows>
- After typing call mom #family #todo and sending, exactly one new bubble appears under the Today header, the timeline's visible note count increases by exactly one, the tag rail shows family and todo chips whose usage counts each increase by one (appearing with count 1 when new), and a full page reload restores the note, its two chips, and the same rail counts exactly
- Bolding a word in the composer, sending, then editing that note and toggling the bold off round-trips the formatting: the sent bubble first renders the word bold, the saved edit renders it plain, and a page reload after each step shows the same rendered formatting state
- Archiving a note removes its bubble from the main timeline (the visible count decreases by one), immediately decreases its tags' usage counts in the rail (a tag used only by that note leaves the rail), and the Archived view lists that note; Unarchive returns it to its original chronological position and restores the rail counts, all without a page reload
- Marking work as a TODO tag adds a checkbox to every note carrying work in the timeline; checking one of those notes inside the work filtered view moves it from the Open section to the Done section immediately, and after a page reload the tag's TODO designation and that note's Done placement are restored exactly
- The full timeline (note text with formatting, tags, TODO-tag designations, per-note done state, pin state, archive state, and attachment metadata) survives a full page refresh and is restored exactly
</user_flows>

<edge_cases>
- Before any note exists the timeline shows a friendly empty-state prompt inviting the user to send the first note, not a blank area
- Submitting a blank or whitespace-only note is prevented AND explained: no note is appended and the composer shows a visible inline error message naming the note text field, plus a brief shake animation on the input row; a silently disabled Send control alone is not sufficient
- A search or filter combination matching nothing shows an explicit no results message rather than a blank region
- The Archived view shows a short empty message when nothing is archived
- A note whose text is one long unbroken URL wraps inside its bubble rather than overflowing or stretching the column
- Canceling the delete confirmation dialog leaves the note in place in every view and changes no counts
- Double-activating Send on the same composer text appends exactly one note: the visible count increases by one and one new bubble appears
</edge_cases>

<visual_design>
- Single centered column (max width around 42rem) over a light canvas colored #F5F5F7, with primary ink #1D1D1E; the top bar and composer are sticky so the composer stays reachable at the bottom while the timeline scrolls between them
- Note bubbles are white cards with a 7px border radius and a subtle shadow that deepens on hover; a pinned note carries a small pin indicator badge in the secondary accent color #FFCC00
- Primary calls to action (Send, Apply Scenario Change, and the active states of Calendar/Archived/tag chips) use background #007AFF with near-white text and a full pill radius (1000px) and no shadow; secondary controls (Pin, Archive, Edit, Attach File, Make TODO, inactive tag chips) use background #E6EEF7 with #007AFF text, the same full pill radius, and no shadow
- A given tag renders with identical chip styling everywhere it appears: in the note bubble, in the tag rail, and in the TODO split view. The currently selected tag in the rail shows a distinct filled-accent treatment (accent background, white text) versus the unselected chips
- Typography uses the SF Pro family with an -apple-system, BlinkMacSystemFont fallback stack; the h1 title renders at 34px, section h2 headers at 17px, and body/note text at 17px. Spacing and gaps follow a 4px-multiple scale
- Bold and italic spans inside note bubbles render visibly heavier or slanted than the surrounding 17px note text while keeping the same size and color
- Links inside note bubbles render in the #007AFF link color, visually distinct from surrounding note text
- Calendar day cells with notes are visually distinguishable from empty days by a marker; the active-filter day is highlighted distinctly from both empty and today's cell
- Every control that shows an icon draws it from one consistent icon set at a consistent optical size; no mismatched icon styles appear across the top bar, note actions, and composer
- Empty states are explicit and friendly: the first-note prompt, a no results message for empty filters/searches, and a short message for an empty Archived view
</visual_design>

<motion>
- Sending a note animates the new bubble into the timeline rather than snapping in; deleting or archiving a note animates the bubble out; pinning a note animates it into the Pinned section, so every list add, remove, and move carries visible motion
- Sending, pinning/unpinning, archiving/unarchiving, attaching a file, and deleting a note each surface a transient toast confirmation that animates in immediately and auto-dismisses with a fade after about 2.5 seconds
- Submitting a blank note plays a short shake animation (about 0.3s) on the composer input row alongside the inline error
- The Send control and other buttons ease their background color on hover and depress slightly (scale down) on active press; tag chips, note action controls, and note bubbles show a visible hover state distinct from their resting state
- Selecting a tag, opening Calendar or Archived, and switching views update the timeline in place without a full page reload; the active view's control reflects the current state
- With prefers-reduced-motion set, the shake, bubble, and toast animations are removed and state changes apply instantly while every feature remains usable
</motion>

<responsiveness>
- At approximately 375px wide the app renders with no page-level horizontal scrolling; the tag rail scrolls horizontally inside its own container rather than breaking the layout, long note text and URLs wrap rather than overflow, and the composer stays pinned and legible at the bottom
- At desktop widths the single centered column keeps its maximum width while the canvas background fills the remaining space on both sides
</responsiveness>

<accessibility>
- Keyboard Tab focus is clearly visible on interactive controls (an accent outline/ring) and follows a logical reading order from the top bar through the tag rail, timeline, and composer
- The delete confirmation dialog traps focus while open, closes without deleting when Escape is pressed, and returns focus to the control that opened it
- The composer's inline validation error is announced through an aria-live polite region as well as shown visually
- Icon-only controls expose accessible names describing their action
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear during a full exercise of the app's features
- The UI stays responsive during rapid repeated sends, with no hangs, dropped interactions, or blank screens
</performance>

<writing>
- Headings, buttons, chips, and toasts use one consistent capitalization convention throughout the app
- Empty states explain what belongs in the region and how to add it; error messages name the problem and the fix; no placeholder or lorem text appears anywhere in the shipped UI
</writing>

<requirements>
Shared application state must live in Qwik stores (useStore): the notes collection, per-note tags/pin/archive/done state, the set of TODO-designated tags, the active tag/date/search filters, the active view (timeline, calendar, archived), and the undo/redo transition history. Views derive from this one store, never a second disconnected copy. Do not stand up a backend or authentication.
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
Stack and libraries: Build tooling is Vite (Qwik City). Styling is Tailwind CSS 4.3.2, pinned, with design tokens defined in the theme layer. DaisyUI is the component library and provides the buttons, tag chips/badges, the delete confirmation dialog, toasts, and the calendar and history chrome. AutoAnimate is allowed for animation (list add/remove/move and view microinteractions); no other animation libraries. The composer's formatted-text editing surface is built on ProseKit (vanilla core), and its formatting commands operate on the same note text the tag parser reads. Icons come from one Iconify set delivered through the @iconify/tailwind4 plugin; no raw pasted SVGs and no icon CDN. All forms, including the composer and its Editing note mode, validate through a Valibot schema via Modular Forms for Qwik, surfacing inline per-field errors before submit. All libraries are installed via npm and bundled locally; no CDN imports.
Chrome and safety: zero outbound navigational links for app chrome (in-app controls only); render note text safely (escape user input before inserting parsed links).
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
