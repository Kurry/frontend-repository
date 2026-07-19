<summary>
Build a benchmark-corpus dataset release manager and version-diff viewer called Larkspur Releases using Vue 3, Pinia, Tailwind CSS 4.3.2, and shadcn-vue.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Releases sidebar —
- The app opens into a two-pane shell: a releases sidebar listing at least 4 seeded corpus versions with semver names (for example 1.0.0, 1.1.0, 1.2.0, 2.0.0), each entry showing its version name, cut date, and task count; the newest version is selected by default and its manifest renders in the main canvas
- Each seeded version carries a task manifest of at least 20 entries; selecting a version in the sidebar shows its manifest table with one row per task showing slug, truncated content digest, title, and split tags, without a full page reload
- Sealed releases are immutable: no edit or delete controls render on a sealed release's manifest, and an info affordance next to the version name reveals a tooltip explaining that sealed releases cannot be modified

Feature: Version diff —
- A diff view offers two version pickers (base and compare); choosing any two distinct seeded versions classifies every task across both manifests as added, removed, changed, or unchanged
- Diff rows are color-coded by kind and carry a leading marker glyph: + for added, - for removed, ~ for changed; changed rows additionally show the truncated before digest and after digest side by side with an arrow between them
- Unchanged tasks collapse under a disclosure row labeled with their count (for example Unchanged 14); activating the disclosure expands the unchanged rows in place and activating it again collapses them
- A summary strip above the diff shows the per-kind counts (added, removed, changed, unchanged); the counts derive from the selected pair and update immediately when either picker changes
- Picking the same version in both pickers shows every task as unchanged with zero added, removed, and changed counts
- Swapping base and compare flips added and removed counts exactly while the changed and unchanged counts stay the same

Feature: Split and tag catalog —
- A splits view lists each split of the corpus under a fictional split name (auric-holdout, basalt-train, cinder-public), showing for every task category a horizontal fill bar of current composition against a stated target quota, with the numeric current/target pair rendered beside each bar
- Any category whose current count is below its target renders its fill cell with a visually distinct unfilled highlight so shortfalls are scannable at a glance

Feature: Release cut —
- A Cut release control opens a form with a name field (must be a valid semver string and unique among existing versions) and a notes field; each invalid field shows an inline message naming that field before submit, and the submit control stays disabled until the name is valid
- Submitting a name that duplicates an existing version shows an inline message stating the version already exists and starts no cut
- Running the cut walks four visible steps in order — collect manifests, compute digests, rank-stability check, seal — each step showing a badge that advances pending to running to complete, one step running at a time
- The rank-stability step displays a simulated correlation value against a stated threshold of 0.95; a value at or above the threshold passes the step, and a value below it marks the step failed, blocks the release, and shows an inline explanation naming the value and the threshold
- A failed rank-stability check shows a Retry check control; activating it re-randomizes the correlation value and re-runs the step, and a passing retry lets the cut continue to seal
- A cut that reaches seal completes: the new version appears in the releases sidebar with its name and task count, is selected, renders as sealed (no edit controls, immutability tooltip present), and a confirmation toast appears

Feature: Rotation panel —
- A rotation panel shows which held-out subsets are active for the current cycle, the cycle number, and a rotation history list; the history visibly demonstrates that no subset repeats within the stated window of 3 cycles
- An Advance rotation control moves to the next cycle: the active subsets change, the cycle number increments by one, the history gains the new cycle at the top, and an event is appended to the event timeline

Feature: Event timeline and manifest summary —
- An event timeline lists corpus events (release cuts, failed rank-stability checks, rotation advances) newest first with a timestamp and description per event; cutting a release and advancing rotation each append exactly one new entry
- The selected release exposes a manifest summary rendered as a monospaced code block (version, task count, per-split counts, digest prefix) with a copy control; activating copy places the exact summary text on the clipboard and shows visible confirmation
- When a diff pair or filter matches nothing, and in any list region with no entries, a designed empty state explains what belongs there instead of a blank region
</core_features>

<user_flows>
- Cutting a release end to end: open the Cut release form, submit a valid unique semver name, watch the four steps advance in order; if rank-stability fails, read the inline explanation, activate Retry check until it passes; on seal the sidebar gains exactly one new version entry, the version becomes selected, and the timeline gains a cut event — all without a reload
- Diffing two versions: pick 1.0.0 as base and 2.0.0 as compare, read the summary strip counts, expand the unchanged disclosure, then change the compare picker to 1.1.0 and observe every kind count and the row classification recompute immediately
- Advancing rotation: note the active subsets and cycle number, activate Advance rotation, and confirm the active subsets change, the cycle number increments by one, the history shows the new cycle without repeating any subset from the prior 3 cycles, and the timeline gains a rotation event
- Copying a manifest summary: select a release, activate the copy control on its summary code block, and confirm the visible copied confirmation appears and the clipboard holds the summary text
- A page reload returns the app to its seeded state: at least 4 seeded versions, the default selection, the seeded cycle number, and no releases cut during the session
</user_flows>

<edge_cases>
- Submitting the cut form with an empty or non-semver name shows an inline message naming the name field and starts no cut; the version count is unchanged
- Cancel on the cut form closes it and leaves the versions collection and timeline unchanged
- Double-activating the cut submit control starts exactly one cut and, on success, adds exactly one version to the sidebar
- While a cut is running, the Cut release control is disabled so a second cut cannot start
- Selecting the same version in both diff pickers renders a valid all-unchanged diff, never an error or blank region
</edge_cases>

<visual_design>
- Data-ops register: a fixed-width releases sidebar on the left and a tabbed main canvas (Manifest, Diff, Splits, Rotation) with the event timeline docked as a column or panel; dense tables with hairline row separators and generous section padding
- Diff color language applied consistently: green tint and + marker for added rows, red tint and - marker for removed rows, amber tint and ~ marker for changed rows, neutral surface for unchanged rows; the same three accents recur in the summary strip counts
- Digests render in a monospaced face everywhere they appear (manifest rows, changed-row before/after pairs, the summary code block), truncated to a fixed prefix with an ellipsis
- Typography hierarchy: the selected version name is the largest text on the canvas, tab labels and section headings step down clearly, and table body text is the smallest tier; one sans-serif family for UI text plus one monospaced family for digests and the code block
- Split fill bars share one anatomy: a track, a filled segment proportional to current/target, the numeric pair aligned right; below-target bars carry a hatched or outlined unfilled segment visually distinct from met quotas
- Step badges in the cut flow use one consistent badge system: muted for pending, accent with an activity indicator for running, success tint for complete, error tint for failed
- Sealed releases show a lock glyph beside the version name; one consistent icon set is used across all chrome
- Cards and panels use subtle layered shadows and consistent corner radii; no two panels use different radius or shadow treatments
</visual_design>

<motion>
- Hover animations (required): buttons ease background and shadow with a slight press effect; sidebar version entries and table rows take a full-width hover wash; the copy control and tab triggers show a hover tint; form controls show focus rings
- The cut form opens in a dialog with a short opacity and scale enter transition of roughly 200 milliseconds and exits the same way
- Cut steps animate: the running badge shows a continuous activity indicator, and each badge transition (pending to running, running to complete or failed) crossfades rather than snapping
- The correlation value on the rank-stability step counts up to its value when the step runs rather than appearing instantly
- Expanding or collapsing the unchanged disclosure animates the row group open and closed with its chevron rotating, rather than snapping
- Changing a diff picker animates rows entering and leaving the classified lists; a newly sealed version's sidebar entry animates in; a new timeline event slides in at the top of the list
- Toasts after a sealed cut and after rotation advance slide in, remain readable, and auto-dismiss with a fade
- Tab switches crossfade the main canvas content without a full page reload
- With prefers-reduced-motion set, animations are removed and state changes apply instantly while every flow remains complete
</motion>

<responsiveness>
- At desktop widths of 1024 pixels and above, the releases sidebar stays visible beside the main canvas; below 1024 pixels the sidebar collapses behind a toggle control that opens it as an overlay
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; the manifest and diff tables scroll within their own containers and the summary strip wraps to multiple lines
</responsiveness>

<accessibility>
- Every interactive control — sidebar entries, tabs, pickers, disclosure rows, form fields, the copy control, Retry check, Advance rotation — is reachable and operable with the keyboard alone, with a visible focus indicator
- The cut dialog traps focus while open, closes on Escape, and returns focus to the Cut release control
- The unchanged disclosure exposes its expanded or collapsed state to assistive technology, and inline validation messages are associated with the fields they name
- Diff kinds are never conveyed by color alone: the +, -, and ~ markers and kind labels remain present alongside the tints
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of the app, including a complete cut with a retry
- Recomputing a diff across two 20-plus-entry manifests updates the view without perceptible lag, and the UI stays responsive under rapid repeated picker changes with no hangs
</performance>

<requirements>
Shared application state must live in Pinia (in-memory only): the versions collection with their manifests, the selected version, the diff picker pair, the diff disclosure state, split composition data, the cut run with its per-step statuses and correlation value, the rotation cycle state and history, the event timeline, active tab, and UI chrome. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Sealing a cut adds exactly one version to the shared collection; the sidebar, pickers, timeline, and any derived counts all reflect it without a reload
- The diff classification and its summary counts derive from the two selected versions' manifests in the shared store; changing either picker recomputes both from the same data, never from a second disconnected copy
- Cut step statuses, the correlation value, and retry outcomes live in the store; the step badges, inline explanation, and timeline all render from that one run record
- Advancing rotation updates the cycle, active subsets, history, and timeline from one store command
- Active tab and sidebar selection are shared client state; switching them never reloads the document
- WebMCP tool handlers, where present, invoke the same store commands as the visible controls
Build tooling: Vite or an equivalent SPA setup. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer. shadcn-vue is the component library for the dialog, tabs, selects, tooltip, disclosure/collapsible, badges, toasts, and form controls; no other component library. Motion for Vue and AutoAnimate allowed for animation; no other animation libraries. Phosphor icons only, installed as the Vue package from npm — no raw copy-pasted SVG icon sets. All forms — the cut form and any filter or settings forms — are driven by VeeValidate validating through a Zod schema: the schema defines the semver, uniqueness, and required rules, and inline per-field errors render before submit. All libraries installed via npm and bundled locally; no CDN imports. No backend or authentication.
- Seed at least 4 versions, each with a manifest of at least 20 task entries (slug, content digest, title, split tags), fictional throughout; seed split quotas with at least one below-target category and a rotation history of at least 3 past cycles
- All simulated timing (step advancement, correlation draw) runs client-side; the rank-stability draw must be able to produce both passing and failing values across retries
- Empty or invalid cut submissions must not change the version count; show visible validation feedback
- Zero navigational outbound links for app chrome — in-app controls only; view changes via shared client state
- Icon set bundled locally
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
- Browsable entity: releases
- Destinations: manifest; diff; splits; rotation; timeline
- Filters: diff-base; diff-compare
- Value bounds: diff pickers limited to seeded versions 1.0.0, 1.1.0, 1.2.0, 2.0.0 plus session-cut versions
- Form fields: version-name; notes
- Form operations: validate; submit; cancel
- Workflow steps: collect-manifests; compute-digests; rank-stability-check; seal
- Session operations: start; restart; advance
- Demos: release-cut; retry-rank-stability-check; advance-rotation
- Artifact operations: copy
- Export formats: manifest-summary-text
- Workflow completion: sealed version appears selected in sidebar with lock/immutability treatment and a timeline cut event
- Workflow completion: rotation advance increments cycle, swaps active subsets, and appends history + timeline entries

Mechanics exclusions:
- Cut-step badge crossfade and correlation count-up animation stay Playwright-observed
- Unchanged-disclosure height animation and chevron rotation stay Playwright-observed
- New sidebar entry / timeline entry animate-in stays Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
