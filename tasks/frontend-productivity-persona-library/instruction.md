<summary>
Build a persona library for an AI writing workspace using React, Zustand, Tailwind CSS 4.3.2, IBM Carbon Design System, and Recharts.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Persona collection —
- The main panel is a card grid listing all saved personas (at least 8 seeded across the 4 role categories on first load); each card shows the persona name, role label, tone badge, up to 3 tag chips, and a two-line preview of the system prompt body
- A search input above the grid filters the list to personas whose name or role contains the query as the user types; clearing the input restores all cards exactly
- A role filter select narrows the list to personas matching the selected role category (Coder, Writer, Analyst, Reviewer); a tag facet list beside it narrows by tag, facets combine with search, and each facet shows a live count of matching personas
- An Archived toggle in the filter bar switches the grid between active personas and archived personas; archived cards carry a visible archived treatment

Feature: Create and edit personas —
- Clicking New Persona opens a modal with: name (required), role category (select, required), tone (select: formal, neutral, casual, assertive; required), tags (repeating chips, optional), constraints list (repeating text inputs, optional), example exchanges (repeating pairs of user message and persona reply, optional), a goals field (optional), and a system prompt body (required, edited in a rich text area supporting bold, italic, headings, and lists via a toolbar whose formatting round-trips: applying bold renders bold and applying it again removes it)
- The Submit control stays disabled until name, role, tone, and a non-empty prompt body are present; submitting a valid form closes the modal, inserts exactly one card into the grid, and shows a success toast naming the persona
- Submitting with a missing required field shows an inline validation message naming that field and inserts no card
- Clicking Edit on a card opens the same modal pre-filled with every field including formatting; saving updates the card in place without a reload
- Clicking Clone creates a new persona with identical fields and the name suffixed with " (copy)"; the clone card animates into the grid
- The editor offers technique variants: tabs for at least 2 prompt techniques (for example direct instruction and few-shot) each holding its own prompt body and example exchanges, while name, role, tone, tags, and traits stay shared; switching variant tabs preserves the shared fields and unsaved shared edits, and the card records which variant is active

Feature: Trait matrix —
- Each persona carries a trait matrix of 5 sliders — formality, verbosity, creativity, empathy, assertiveness — each ranging 0 to 100 with a live numeric readout beside it; a numeric value can also be typed at the readout, and a typed value outside 0 to 100 or non-numeric is rejected with an inline message naming the trait and its allowed range
- A radar chart beside the sliders redraws immediately as any slider moves, with one axis per trait and the plotted shape matching the current values
- Trait edits save with the persona: reopening the editor shows the same slider values, and the card shows a compact trait summary

Feature: Persona preview flip —
- Clicking a persona card (outside its action controls) flips it with a 3D rotation to show the full system prompt body in read-only monospaced form; clicking again flips it back; the flip direction is consistent (front-to-back then back-to-front)

Feature: Composition —
- A Compose control opens a blend builder: two persona selects plus a per-trait weighting slider (0 to 100 percent toward the second persona); a derived preview shows the blended trait values, a merged constraints list, and a generated prompt body naming both sources
- Moving the weighting slider recomputes the blended trait values and the preview immediately; blends at 0 and 100 percent match the first and second persona's traits exactly
- Saving a blend creates a new persona whose name defaults to both source names joined, marked with a blended badge; it appears in the grid and behaves like any persona

Feature: Test bench —
- A Test Bench view offers a persona slot, a scenario select listing at least 4 seeded scenarios, and a Run control; the persona slot is filled by choosing from an attacher drawer listing all personas, or by dragging a persona entry from that drawer onto the slot, which shows a visible drop target while dragging
- Running produces a simulated response that streams progressively — text appears incrementally, not all at once — with a status affordance distinguishing waiting, streaming, and complete; the Run control becomes a Stop control while streaming, and stopping freezes the output at its current text
- The simulated response visibly reflects the persona's traits: high formality produces formal salutations and no contractions while low formality produces casual phrasing and contractions; higher verbosity produces visibly longer responses; constraints from the persona are echoed as respected limits in the output
- Running the same scenario with two personas whose traits differ produces visibly different response text
- While streaming, the transcript auto-follows the latest text; scrolling up pauses following and shows a jump-to-latest control that resumes it
- Each run appends an entry to a run history list showing persona, scenario, timestamp, and a length readout; selecting a history entry restores its full transcript; the transcript pane stays smooth when the history holds many long entries

Feature: Iteration voting —
- A persona's detail area lists its saved iterations (each save of the persona creates an iteration entry with a timestamp and a change summary); a Start poll control opens a voting overlay listing the iterations with vote tallies from at least 3 simulated teammates whose votes arrive visibly over a few seconds after the poll starts
- When the poll closes, the winning iteration shows a promoted badge, the badge also appears on the persona card, and the tallies remain viewable; running a second poll can change the winner, moving the badge

Feature: Version history and diff —
- Each persona's history lists its iterations newest first; selecting two shows a field-level diff: changed fields listed with old and new values, trait changes shown as before and after numbers, and prompt body changes highlighted at line level with added lines green and removed lines red
- The diff derives from real edits: editing one field and saving, then diffing the last two iterations, shows exactly that field changed

Feature: Comparison view —
- A Compare view offers two persona slots; an Add to Comparison action on each card fills the next free slot and navigates to the Compare view with a confirming toast
- The comparison renders the two personas side by side: name, role, tone, tags, constraints, goals, and prompt body, plus a paired trait readout where each trait row shows both values and highlights the delta when the two differ by more than 10 points
- A combined radar chart overlays both personas' trait shapes in two distinguishable series with a legend; swapping a slot's persona redraws the chart and the deltas immediately

Feature: Batch actions —
- Each card has a selection checkbox; selecting at least one raises a bulk tray with the live selected count and actions: Add tag (with a tag input), Remove tag, Archive, Unarchive, and Delete (with a confirmation dialog naming the count)
- Applying a bulk action updates every selected card and all facet counts immediately, then clears the selection

Feature: Undo and redo —
- Toolbar Undo and Redo controls, plus Ctrl+Z and Ctrl+Shift+Z, step backward and forward through persona creation, edits, clones, deletes, archives, tag changes, and bulk actions; both controls are disabled when their stack is empty
- Undo restores the exact prior state including facet counts, badges, and comparison slots that referenced the affected persona

Feature: Export —
- Persona create/edit request-body field contract (a successful Save record IS the would-be request body; Persona pack export uses the same schema per entry): required name (trimmed string length 2–80), required role and tone (exactly one value each from their closed option lists), required tags (array of 1–12 non-empty strings), required constraints and goals (non-empty strings max 2000), required examples (array of {user, reply} string pairs, min 1), required traits (object with exactly five numeric keys each integer 0–100), optional variants and activeIteration. Cross-field: empty name or any trait outside 0–100 keeps Save disabled with named field errors and stores nothing.
- An Export control opens a drawer with two tabs; the Persona pack tab shows JSON with required keys schemaVersion (number exactly 1), personas (array of persona request-body objects for each currently visible filtered persona), and generatedAt (ISO-8601 datetime ending in Z); the Comparison report tab shows generated text summarizing the two compared personas, their trait values, the per-trait deltas, and which persona leads each trait
- Both tabs derive from live state: editing a trait or changing the filter and reopening the drawer changes the exported text accordingly. Download and Copy emit the visible text; an export that omits a session create/edit is invalid. End-state contract: Persona pack JSON MUST reflect the session's actual filtered personas under that field contract.
- A Copy control places the visible export text on the clipboard and shows a visible confirmation

Feature: Attach to session —
- An Open in Test Bench action on each card fills the test bench persona slot with that persona, navigates to the Test Bench view, and shows a confirming toast naming the persona; the Add to Comparison action behaves the same way for the Compare view
</core_features>

<user_flows>
- Trait pipeline end to end: opening a persona's editor, raising formality from a low to a high value, watching the radar redraw, saving, running the test bench on that persona, and opening the Compare view shows the new trait value in the response style, the paired readout, the overlay chart, and the Persona pack export — all without a reload
- Different traits, different output: running the same seeded scenario with a high-formality persona and then a low-formality persona produces response texts that differ in salutation, contraction use, and length according to the traits
- Compose round trip: blending two personas at 50 percent produces trait values between the sources; saving the blend adds a card whose traits match the preview, and undoing removes it
- Iteration flow: editing a persona twice creates two iterations; diffing them shows exactly the edited fields; starting a poll animates simulated votes in, and the winner gains the promoted badge on card and detail
- Batch then undo: selecting 3 personas and applying Add tag raises that tag's facet count by exactly 3; a single Undo restores all 3 and the count
- Search, role filter, tag facet, and the archived toggle combine: each narrows the visible cards and the facet counts stay consistent with what is shown; clearing all filters restores the full grid exactly
- A page reload returns the app to its seeded state: the seeded personas, iterations, and scenarios, empty comparison slots, and an empty undo history
</user_flows>

<edge_cases>
- Filtering to a combination that matches nothing shows an empty state naming the active filters with a Clear filters control that restores the grid
- Deleting every persona shows an empty state in the grid region explaining how to create or import a persona
- Double-activating New Persona's Submit control creates exactly one persona; double-activating Run in the test bench starts exactly one streaming run
- A persona name longer than 40 characters is truncated with an ellipsis on the card and shown in full in the editor and comparison
- Adding a persona to the comparison when both slots are full replaces the older slot and says so in the toast
- Stopping a streaming run freezes the transcript; running again starts a fresh response rather than resuming the stopped text
- Cloning an archived persona creates an active (unarchived) clone
- Starting a poll on a persona with a single iteration shows a message that at least two iterations are needed instead of an empty overlay
</edge_cases>

<visual_design>
- Layout: a top toolbar with the view switcher (Library, Test Bench, Compare), search, filters, undo/redo, and export; the library view shows the card grid with the tag facet rail on the left
- The card grid is 3 columns at desktop width, 2 at medium, and 1 at narrow; cards keep a consistent footprint and the flip preserves it
- Each card carries a colored top border by role category: Coder blue, Writer green, Analyst cyan, Reviewer yellow; the same role colors key the role filter and the comparison headers
- The tone badge renders as a neutral tag with the tone label; the promoted badge and blended badge are visually distinct from tone and tag chips
- The card back shows the full prompt body in a monospaced code-style block with a copy affordance
- Archived cards render dimmed with an Archived label; selection checkboxes and the bulk tray use the same accent color
- The radar charts use one series color per persona, consistent between the trait editor, the comparison overlay, and the legend
- Trait delta highlights in the comparison use a single accent treatment applied only when the difference exceeds 10 points
- Typography shows a clear hierarchy: the app title larger than view headings, which are larger than card titles, which are larger than body and label text
- Spacing follows a consistent rhythm across the toolbar, facet rail, grid, and panels, with no crowded or orphaned regions
- Buttons, inputs, selects, sliders, and toggles show distinct default, hover, focus (visible ring), disabled, and error treatments
- One consistent icon set is used throughout the toolbar, cards, tray, and status indicators
</visual_design>

<motion>
- New and cloned persona cards scale from 0.85 to 1.0 and fade in over roughly 200 milliseconds
- The card flip animates via a 3D rotation over roughly 350 milliseconds with a midpoint visibility swap between front and back
- The radar chart animates between trait shapes as a slider moves rather than snapping between states
- Streamed test-bench text appears incrementally with a subtle caret or pulse affordance while streaming
- Simulated votes in the poll overlay arrive one by one with a short entrance transition, and the promoted badge animates in on the winner
- Modals enter with a short opacity and scale transition of roughly 200 to 300 milliseconds and exit the same way; the export drawer and attacher drawer slide in from the side
- The bulk tray slides up when the first card is selected and slides away when the selection clears
- Dragging a persona from the attacher drawer shows a drag ghost, and the slot's drop target highlights while a drag hovers it
- Hover animations (required): buttons ease background and shadow with a slight press effect; cards lift with a shadow ease; facet entries and history rows take a full-width hover wash; form controls show focus rings
- Feedback toasts after create, clone, attach, bulk apply, and copy slide in, remain readable, and auto-dismiss with a fade
- With prefers-reduced-motion set, the flip is replaced by an instant content swap, cards appear without animation, streamed text may appear in larger chunks without the pulse, and every transition applies instantly
</motion>

<responsiveness>
- At widths of 768 pixels and below, the facet rail collapses behind a filter toggle and the card grid drops to 2 columns; at 375 pixel width the grid is 1 column, no content clips or overflows the viewport, and no page-level horizontal scrolling appears; the comparison columns stack vertically at narrow widths
</responsiveness>

<accessibility>
- Every interactive control — cards, card actions, sliders, variant tabs, facet entries, tray actions, the poll overlay, drawer entries — is reachable and operable with the keyboard alone, with a visible focus indicator; the card flip is operable with Enter or Space, and the attacher drawer offers a keyboard alternative to drag (choose from the list)
- Modals, the poll overlay, and the drawers trap focus while open, close on Escape, and return focus to the control that opened them
- Stream completion, poll results, and bulk apply results are announced through an aria-live region as well as shown visually
- Each trait slider has a visible label and an accessible value readout; form validation messages are associated with their fields so each names the field it belongs to
- Role categories, promoted state, and archived state are conveyed by text or icon in addition to color
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of the app
- The UI stays responsive under rapid repeated input — fast slider scrubs, quick filter changes, rapid undo/redo — with no hangs, and streaming never blocks interaction with the rest of the app
</performance>

<requirements>
Shared application state must live in Zustand (in-memory only): the personas collection with traits, tags, constraints, variants, and iterations, the active view, search and filter and facet and archived state, card flip state, comparison slots, composition builder state, test bench slot, scenario, streaming status, transcript, follow flag, and run history, poll state and tallies, the undo/redo history, export drawer state, and UI chrome. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Creating, editing, cloning, archiving, or deleting a persona updates every surface that shows it: the grid, facet counts, comparison slots, test bench slot, and exports
- Trait edits feed the radar charts, the comparison deltas, the test bench output style, and the Persona pack export from the same shared values
- Search, filters, facets, and the archived toggle recompute the visible grid from the shared collection; they never operate on a second disconnected copy
- Undo and redo operate on the same shared state the visible controls mutate, restoring derived counts and badges exactly
- Attaching a persona to the test bench or comparison shares the same persona record — later edits to it appear there without re-attaching
Build tooling: Vite SPA. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer. IBM Carbon Design System (@carbon/react) is the component library for all UI chrome — modals, tags, search, toolbar controls, notifications, sliders, and form controls; no other component library. Recharts for the radar charts. TipTap for the rich prompt body editor. Motion for React and AutoAnimate allowed for animation; no other animation libraries. Icons from @carbon/icons-react only, installed via npm — no raw copy-pasted SVG icon sets. All forms — New Persona, Edit Persona, composition, poll setup, and bulk tag entry — are driven by React Hook Form validating through a Zod schema: the schema defines the rules and inline per-field errors render before submit. Personas are modeled as an API-shaped payload with field contracts enforced everywhere they are edited: role and tone accept only their closed option lists, each trait is a number within 0 to 100, examples are user/reply pairs, and every violation message names the offending field and its rule; the Persona pack export conforms to that same payload shape for every persona it contains. All libraries installed via npm and bundled locally; no CDN imports. No backend or authentication; streaming, votes, and teammates are simulated client-side, and trait-conditioned response text is generated deterministically from the persona's traits and constraints so different traits always produce visibly different output.
- Seed at least 8 personas covering all 4 role categories with distinct trait profiles and at least 6 distinct tags, at least 2 personas holding 3 or more iterations, at least 4 test scenarios, and at least one seeded blended persona
- Submitting any form with invalid required fields must not mutate the collection; show visible validation feedback
- Zero navigational outbound links for app chrome — in-app controls only; view changes via shared client state
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
- command-session-v1
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

<module_spec id="command-session-v1">
{
  "id": "command-session-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Command / session",
  "purpose": "Media, games, presentations, simulations, demos, and remote-control shells.",
  "permitted_operations": ["start", "pause", "resume", "stop", "restart", "advance", "trigger_demo", "connect", "disconnect"],
  "binding_keys": {
    "required_any_of": [["session_operations"]],
    "optional": ["demos", "visible_postconditions"]
  },
  "restrictions": [
    "No batching or replay of gameplay.",
    "Timing, animation, collision, repeated input, and transient UI require immediate Playwright observation.",
    "Tool output cannot prove successful playback or connection."
  ],
  "tool_name_prefix": "session"
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
- Browsable entity: personas
- Destinations: library; test-bench; compare; export-drawer; attacher-drawer
- Filters: name-role-search; role-category; tag-facet; archived-toggle
- Entity: persona
- Entity operations: create; select; update; toggle; delete
- Entity fields: name; role; tone; tags; constraints; goals; examples; prompt-body; active-variant; trait-formality; trait-verbosity; trait-creativity; trait-empathy; trait-assertiveness; archived; blend-source-a; blend-source-b; blend-weight; comparison-slot; test-bench-slot
- Value bounds: role in {Coder, Writer, Analyst, Reviewer}; tone in {formal, neutral, casual, assertive}; each trait a number 0 to 100; out-of-range or non-numeric rejected naming the trait; examples are user/reply pairs; blend-weight 0 to 100 percent toward the second persona; name over 40 chars truncates with ellipsis on the card; clone suffixes name with ' (copy)' and is always active even from an archived source; delete and bulk delete require explicit confirm=true naming the count; scenario one of the at least 4 seeded scenarios
- Session operations: start; stop; trigger_demo
- Demos: test-bench-run; iteration-poll
- Artifact operations: export; copy
- Export formats: persona-pack-json; comparison-report-text
- Workflow completion: creating, editing, cloning, archiving, or deleting a persona updates the grid, facet counts, comparison slots, test bench slot, and both export tabs without a reload
- Workflow completion: a trait update redraws the trait radar, the comparison deltas and overlay chart, and the Persona pack traits object from the same shared values
- Workflow completion: saving a blend adds a blended-badge card whose traits match the preview; 0 and 100 percent blends match the sources exactly
- Workflow completion: bulk Add tag on 3 selected personas raises that tag's facet count by exactly 3 and clears the selection
- Workflow completion: a stopped test-bench run freezes the transcript and appends one run-history entry with persona, scenario, timestamp, and length
- Workflow completion: when a poll closes the winning iteration gains the promoted badge on detail and card; a second poll can move it
- Workflow completion: persona-pack-json contains one payload object per currently visible (filtered) persona with name, role, tone, tags, constraints, goals, examples, five numeric traits 0-100, variants, and active iteration

Mechanics exclusions:
- Card flip 3D rotation, its ~350 ms timing, and the midpoint front/back swap are graded through the real card click and observed via Playwright
- Streaming pacing, the caret/pulse affordance, auto-follow, and the jump-to-latest control are timing/scroll mechanics observed via Playwright
- Dragging a persona from the attacher drawer, the drag ghost, and the drop-target highlight stay Playwright-driven gesture mechanics (keyboard choose-from-list is the accessible alternative)
- TipTap toolbar formatting round-trip (bold on/off, headings, lists) is editor-surface mechanics driven through the real toolbar
- Radar chart morph between trait shapes and simulated votes' one-by-one entrance transitions stay Playwright-observed animation timing
- Undo/Redo toolbar controls and Ctrl+Z / Ctrl+Shift+Z stay Playwright-driven so history semantics are graded through the real controls
- Clipboard contents of the Copy control and toast slide/fade remain Playwright responsibilities

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
