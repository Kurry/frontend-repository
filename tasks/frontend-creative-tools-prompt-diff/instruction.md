<summary>
Build a prompt version-control and diff studio for a prompt-engineering platform using React, Zustand, Tailwind CSS 4.3.2, and IBM Carbon Design System.
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):

Feature: Prompt picker and version chain —
- A search-as-you-type input above the version selectors filters the prompt list incrementally to matching entries; selecting a prompt loads its full version history into both version pickers; clearing the field restores the full prompt list exactly
- Each seeded prompt carries a version chain of 4 to 6 versions; every version shows its version number, a fictional author name, a timestamp, and a change note, visible in the picker options and in a history list for the selected prompt
- The header row contains two version picker dropdowns — left (base) and right (compare) — each listing all saved versions of the selected prompt by version number and relative timestamp; switching either picker immediately re-renders the diff panel without a full page reload

Feature: Side-by-side diff —
- The diff panel renders the two versions in a split-pane view: left shows the base version and right the compare version; lines are numbered and aligned across both panes so corresponding lines sit at the same height
- Added lines carry a green success-background treatment and removed lines a red error-background treatment; unchanged lines are unstyled; the gutter cell of each changed line shows a plus or minus symbol in the matching color
- Within changed lines, word-level highlighting marks exactly the words that differ with a stronger shade than the line background — a changed word is never left unhighlighted and an unchanged word inside a changed line is never marked

Feature: Diff options (live-derived) —
- An Ignore whitespace toggle sits near the unified/split control; when on, lines that differ only by leading, trailing, or repeated whitespace compare as unchanged, and the counters, word-level highlights, and unified blocks recompute immediately from the same pair
- An Ignore case toggle sits beside it; when on, letter-case-only differences compare as unchanged and the same derived surfaces recompute immediately
- Turning either toggle off restores the full whitespace-sensitive or case-sensitive diff for the same pair without a reload; both toggles can be on at once and their effects combine

Feature: Unified diff and change summary —
- A unified-diff toggle collapses the split into a single scrollable column showing only changed blocks with three lines of unchanged context above and below each change; toggling back restores the split view at the same scroll region
- A strip above the diff shows three counters: lines added, lines removed, and net token delta (positive or negative) between the two versions; the counters recompute whenever either picker changes or either Ignore toggle changes
- Clicking a counter scrolls the diff panel to the first change of that type and pulses the target block's background before settling

Feature: Three-way compare and merge —
- A Compare Branches mode presents a base version and two branch versions in three labeled panes; regions changed by only one branch render in that branch's accent, and regions changed differently by both branches are highlighted as conflicts with a distinct conflict treatment and a numbered conflict marker
- A Merge control opens a region-by-region merge flow: each conflict region offers Choose left, Choose right, and Edit manually (an inline editable text area prefilled with one side); a progress indicator shows resolved regions out of total and the Complete merge control stays disabled until every region is resolved
- Bulk resolution controls resolve all remaining regions to the left or right side in one action, with each region's chip updating to show its resolution
- Completing the merge creates a new version at the head of the prompt's chain whose text reflects exactly the per-region choices made — each region's content matches the side chosen or the manually edited text — and shows a success toast; the merge version's change note names the two merged branches

Feature: Blame view —
- A Blame tab renders the selected version's text with a per-line attribution gutter showing the version number and author that last changed each line; hovering an attribution with the real pointer shows the change note and timestamp of that version
- Clicking a blame attribution selects that version into the compare picker so the diff shows the change that introduced the line

Feature: Version graph —
- A Graph tab renders the prompt's version topology as connected nodes: the main chain in a column with branch nodes offset and merge nodes joining two parents with visible connecting edges
- Each node shows its version number and author initials; clicking a node loads that version into the base picker and highlights the node; the currently compared pair is visually marked on the graph
- After completing a merge, the graph gains a new merge node connected to both parent branches without a reload

Feature: Restore and history safety —
- Restore to Base and Restore to Compare buttons open a confirmation dialog that submits a RestoreCreate payload. RestoreCreate field contract (the confirm submit IS the would-be restore request body; all keys required unless marked optional; example values illustrative only): sourceVersionId (required non-empty string — the version id named in the dialog), changeNote (required string, 1 to 200 characters, must name the restore source version number). Confirm stays disabled until changeNote is valid; an empty or over-length changeNote shows an inline message naming the changeNote field; confirming creates a new head version whose text equals the restored version, whose change note equals the submitted changeNote, and shows a success toast
- Restoring never rewrites or deletes existing versions: the history list and graph keep every prior version and gain exactly one new head entry

Feature: Annotations —
- Selecting a line range in the diff or blame view offers an Annotate control that opens a thread composer anchored to that range; the composer supports markdown with code highlighting and checklists, previewed live as formatted text
- Posting submits an AnnotationCreate payload. AnnotationCreate field contract (the record the composer creates IS the would-be annotation request body; all keys required unless marked optional): bodyMarkdown (required string, 1 to 4000 characters after trim), lineStart (required integer greater than or equal to 1 — the first selected line), lineEnd (required integer greater than or equal to lineStart — the last selected line), author (required string, 1 to 80 characters). Cross-field rule: lineEnd must be greater than or equal to lineStart. An empty body, over-length body, empty author, or inverted line range shows inline validation naming the offending field and posts nothing; a valid post shows a thread marker on the annotated lines
- Clicking the marker opens the thread showing the formatted note, its author, and timestamp, and allows replies; a reply submits AnnotationReply field contract: bodyMarkdown (required string, 1 to 4000 characters after trim) with the same empty/over-length rejection; a resolved toggle collapses the thread with a resolved treatment
- Annotation threads keep their line anchors when switching between split and unified modes

Feature: Search across versions —
- A global version search input searches the text of every version of every prompt; results list the prompt, version number, and a snippet with the match highlighted; clicking a result loads that prompt and version into the base picker
- A search with no matches shows an empty state naming the query

Feature: Undo and redo —
- Undo and Redo controls in the header revert and reapply the most recent state edits — posted annotations, resolution choices in an open merge, restores, and completed merges; each undo visibly restores the prior state everywhere it appears, and the controls disable when there is nothing to undo or redo
- Undoing a completed merge or restore removes the created head version from the history list and graph; redo re-adds it identically

Feature: Merge resolution payloads —
- Choosing Choose left, Choose right, or Edit manually on a conflict region writes a MergeRegionResolution record into the open merge session. MergeRegionResolution field contract (each region's chip reflects this payload; completing the merge IS posting an array of these as the would-be merge request body): regionId (required non-empty string), resolution (required closed enum exactly one of choose-left, choose-right, edit-manually), manualText (required string when resolution is edit-manually — the inline editor contents, may be empty only when the user explicitly clears it; must be null or omitted when resolution is choose-left or choose-right). Cross-field rule: edit-manually requires manualText to be present as a string; choose-left and choose-right must not carry a non-null manualText. Completing the merge creates a head version whose text is assembled region-by-region from these payloads exactly

Feature: Export and import (API-shaped VersionPackage) —
- The app produces the user's version-control artifacts: Export opens a surface with three format tabs regenerated live from the store — History report (markdown), Version package (JSON), and Merged prompt text (plain text when a merge head exists for the selected prompt). Each tab shows a scrollable preview; Copy writes that format's text to the clipboard with a brief confirmation; Download triggers a real file download whose contents match the open preview
- VersionPackage field contract (Copy, Download, and Import all conform to this same shape; field names and enum values are visible in the JSON preview text; all keys and nesting required unless marked optional; example values illustrative only): schemaVersion (required string exactly prompt-diff-package-v1), promptId (required non-empty string), promptTitle (required string, 1 to 120 characters), versions (required array of at least one VersionRecord), baseVersionId (required non-empty string — must equal one versions[].versionId), compareVersionId (required non-empty string — must equal one versions[].versionId), counters (required object with linesAdded integer greater than or equal to 0, linesRemoved integer greater than or equal to 0, and netTokenDelta integer that may be negative), annotations (required array, may be empty), merge (optional null or MergeSummary object)
- VersionRecord field contract (each element of versions): versionId (required non-empty string), versionNumber (required integer greater than or equal to 1), author (required string, 1 to 80 characters), timestamp (required ISO-8601 datetime string ending with Z or an explicit offset), changeNote (required string, 1 to 500 characters), text (required string — full prompt body for that version), kind (required closed enum exactly one of main, branch, merge, restore), parentIds (required array of zero to two versionId strings; merge kind must list exactly two parents; restore and main may list zero or one)
- AnnotationRecord field contract (each element of annotations when present from the session): annotationId (required non-empty string), bodyMarkdown (required string, 1 to 4000 characters), lineStart (required integer greater than or equal to 1), lineEnd (required integer greater than or equal to lineStart), author (required string, 1 to 80 characters), resolved (required boolean), replies (required array of objects each with bodyMarkdown string 1 to 4000 characters and author string 1 to 80 characters; may be empty)
- MergeSummary field contract when merge is non-null: mergeVersionId (required non-empty string), leftBranchVersionId (required non-empty string), rightBranchVersionId (required non-empty string), resolutions (required array of MergeRegionResolution objects matching the field contract above, length at least 1)
- Cross-field rules for VersionPackage: every parentIds entry must reference a versionId present in versions; baseVersionId and compareVersionId must each match a versions[].versionId; when merge is non-null, mergeVersionId must match a versions[].versionId whose kind is merge; after a merge or restore in the session, the Version package preview includes that new head in versions and, for a merge, a non-null merge object whose resolutions match the choices shown during the flow
- History report markdown lists the selected prompt title, each version's number, author, timestamp, and change note, the current counters, and when a merge completed in-session its per-region resolutions; the preview matches the on-screen history and updates when a new version is created before exporting
- A multi-select in the history list allows choosing two or more versions; exporting Version package then includes exactly those selected versions in the versions array (still conforming to VersionPackage, with baseVersionId and compareVersionId pointing at members of that subset when they are among the selection, otherwise the first two selected)
- After a merge, the Merged prompt text tab shows the merged prompt text itself; the exported text is byte-identical to the merge result shown in the app
- An Import control accepts a pasted or loaded Version package JSON; a successful import that conforms to the VersionPackage field contract replaces the selected prompt's visible chain with the package versions (history list, pickers, graph, and search index update without a reload) so the package's texts and metadata match what the surfaces show
- Import rejects non-conforming payloads without mutating prompts: malformed JSON, missing required schemaVersion/promptId/promptTitle/versions/baseVersionId/compareVersionId/counters/annotations keys, schemaVersion not exactly prompt-diff-package-v1, a VersionRecord kind outside main|branch|merge|restore, parentIds length outside 0–2, baseVersionId or compareVersionId not in versions, or a MergeRegionResolution resolution outside choose-left|choose-right|edit-manually shows a visible validation message naming the offending field and leaves the prompt chain unchanged
- Exporting then re-importing a Version package reconstructs the same visible version texts, authors, change notes, and graph topology for that prompt; an export that omits session mutations (a completed merge or restore head) or fails the field contract is incorrect
</core_features>

<user_flows>
- Comparing end to end: picking a prompt, choosing two versions, and reading the diff shows aligned numbered lines, green added and red removed lines with word-level highlights, and counters that match the visible changes; switching either picker re-renders everything without a reload
- Diff options flow: with a pair that differs only by whitespace or letter case, turn Ignore whitespace or Ignore case on and confirm the counters drop those differences and the highlights clear for those lines; turn the toggle off and confirm the differences return
- Merge pipeline: editing context — open Compare Branches on the seeded branched prompt, resolve one conflict to the left, one to the right, and one by manual edit, complete the merge, and confirm the new head version's text reflects exactly those three choices, the graph gains a merge node joined to both parents, the history list gains one entry, and the Version package JSON shows schemaVersion prompt-diff-package-v1 plus a non-null merge object whose resolutions match those three choices
- Restore round trip: restoring an older version with a valid RestoreCreate changeNote creates a new head equal to it while every prior version remains in the history and graph; undo removes the new head and redo restores it
- Annotate and resolve: annotating a line range with a valid AnnotationCreate bodyMarkdown, replying with a valid AnnotationReply, and toggling resolved shows the marker, formatted thread, and collapsed resolved state; the anchor survives switching between split and unified modes
- Search to diff: searching a phrase that exists only in one version lands on that version in the base picker, and the diff against the compare version shows the phrase inside a highlighted change
- Artifact end state: complete a merge, open Export, confirm History report and Version package previews include the new head and that Version package shows required schemaVersion, promptId, promptTitle, versions, baseVersionId, compareVersionId, counters, and annotations keys; Download or Copy the JSON, then Import that JSON and confirm the history list and graph reconstruct the same version texts and merge topology
- Schema validation flow: attempt AnnotationCreate with an empty bodyMarkdown (thread unchanged, bodyMarkdown named); attempt RestoreCreate with an empty changeNote (no new head); Import JSON missing schemaVersion or with schemaVersion not prompt-diff-package-v1 (chain unchanged, field named); then a valid annotation post and a valid package import succeed against the same field contracts
- A page reload returns the app to its seeded state: the seeded prompts and their version chains, no unseeded annotations, merges, or restores
</user_flows>

<edge_cases>
- Comparing a version with itself shows an explicit no-differences state with zero counters instead of an empty or broken diff panel
- Comparing the shortest and longest versions of a prompt keeps line numbering aligned with filler alignment in the shorter pane rather than misaligned rows
- Completing a merge with zero manual edits (all regions chosen to one side) still creates a distinct merge version and graph node
- Double-activating Complete merge or a Restore confirmation creates exactly one new version: the history list gains one entry and the graph one node
- Annotating a range that already carries a thread adds to the existing thread rather than stacking a second marker on the same lines
- A change note longer than 80 characters truncates with an ellipsis in the picker option and shows in full in the history list
- The version search treats the query case-insensitively and an empty query shows no result list rather than matching everything
- Importing malformed JSON shows an inline parse error naming the import problem and leaves the prompt chain unchanged
- Importing parseable JSON that fails the VersionPackage field contract — missing required schemaVersion/promptId/promptTitle/versions/baseVersionId/compareVersionId/counters/annotations keys, schemaVersion not exactly prompt-diff-package-v1, a kind outside main|branch|merge|restore, parentIds length outside 0–2, baseVersionId or compareVersionId absent from versions, or a resolution outside choose-left|choose-right|edit-manually — leaves the prompt chain unchanged and shows validation naming the offending field
- AnnotationCreate with bodyMarkdown longer than 4000 characters or with lineEnd less than lineStart posts nothing and names the offending field
- Export with only the seeded chain and no session merge still opens and shows a Version package that includes schemaVersion prompt-diff-package-v1 and every required VersionPackage key rather than crashing; Download and Copy remain available
</edge_cases>

<visual_design>
- Layout: a left rail with the prompt picker and history list, a header row with the version pickers, mode tabs (Diff, Compare Branches, Blame, Graph), Ignore whitespace and Ignore case toggles, and the change summary strip, with the diff surface filling the remaining area
- Split panes are equal-width columns separated by a 1 pixel subtle border divider; line numbers sit in a fixed-width muted gutter visually distinct from the text area
- Added lines use a light green background with its gutter plus symbol in the strong success color; removed lines use a light red background with the minus symbol in the strong error color; word-level highlights use a visibly stronger shade of the same hue than their line background
- The change summary strip uses three tag treatments: green for added, red for removed, blue for net token delta; conflict regions in three-way mode carry a distinct third treatment (purple or magenta) that is never confused with plain adds or removes
- Version pickers show version number and relative timestamp in each option label; the history list shows number, author, timestamp, and change note per row with the head version marked, plus multi-select checkboxes for package export
- Graph nodes are visually distinct by kind: chain nodes, branch nodes, and merge nodes differ in shape or accent, and the selected and compared nodes carry a visible highlight ring
- Export opens as a centered surface with History report / Version package / Merged prompt text format tabs, a scrollable monospaced preview, and Copy, Download, and Import affordances
- Monospaced type is used for all prompt text in diff, blame, merge, and export surfaces; UI chrome uses the app's sans-serif hierarchy with the app title larger than panel headings, which are larger than body and label text
- Buttons, inputs, selects, tabs, and toggles show distinct default, hover, focus (visible ring), disabled, and error treatments; one consistent icon set is used across tabs, gutter symbols, thread markers, and toolbar actions
</visual_design>

<motion>
- Re-rendering the diff on a version picker change or Ignore-toggle change cross-fades the panel contents over roughly 150 milliseconds
- Clicking a summary counter scrolls the diff to the first change of that type and highlights the target block with a roughly 400 millisecond background pulse before settling
- The unified/split toggle animates the pane transition rather than snapping between layouts
- Merge region resolutions animate: choosing a side slides the chosen content into the result preview and the progress indicator fills smoothly
- The version graph animates a newly added node and its edges into place after a merge or restore
- Annotation thread markers fade in when posted, and threads expand and collapse with a short height transition and rotating chevron
- The Export surface enters and exits with a brief opacity and scale transition rather than appearing instantly
- Hover animations (required): buttons ease background and shadow with a slight press effect; history rows, search results, and graph nodes take a visible hover treatment; form controls show focus rings
- Toasts after merges, restores, exports, and successful imports slide in, remain readable, and auto-dismiss with a fade
- With prefers-reduced-motion set, all cross-fades, pulses, and transitions apply instantly
</motion>

<responsiveness>
- At widths of 768 pixels and below the split view stacks into a single column with a base/compare segment switch, and the left rail collapses behind a toggle; at desktop widths both panes and the rail are visible together
- At 375 pixel width no content clips or overflows the viewport and no page-level horizontal scrolling appears; long prompt lines wrap or scroll within the diff surface's own container
- The Export surface, Ignore toggles, and Import control stay fully visible and operable at 375 pixel width rather than rendering off-screen
</responsiveness>

<accessibility>
- Every interactive control — pickers, tabs, Ignore whitespace and Ignore case toggles, counters, merge choice controls, graph nodes, thread markers, undo/redo, Export, Import, Copy, and Download — is reachable and operable with the keyboard alone, with a visible focus indicator
- The restore confirmation, merge confirmation, and Export surface trap focus while open, close on Escape, and return focus to the control that opened them
- Added and removed lines are distinguishable by the gutter plus and minus symbols and accessible line annotations, not by color alone
- Completing a merge, a restore, posting an annotation, and a successful import are announced through an aria-live region as well as shown visually
- Validation messages for AnnotationCreate, RestoreCreate, and Import are rendered visually and associated with their fields so assistive technology announces them
</accessibility>

<performance>
- The app is interactive within 2 seconds of a local cold load
- No console errors or warnings appear on load or during a full exercise of the app
- Switching versions, toggling unified mode, and searching across all versions respond without perceptible lag, and rapid repeated picker switches cause no hangs or stale renders
</performance>

<writing>
- Headings, tabs, buttons, and labels use one consistent capitalization convention throughout
- Action labels are specific verbs such as Compare branches, Complete merge, Restore version, Ignore whitespace, Export, Import, Copy, and Download rather than generic labels where a specific one is possible
- Seeded prompt content, change notes, and author names read as plausible product data with no placeholder text, lorem ipsum, or template variables anywhere in the shipped UI
- Empty states name what belongs in the region and how to get it there; the no-differences state says the versions are identical
- Validation and import error messages name the field or problem and the fix, including the field contract rule when validation fails (for example bodyMarkdown length, changeNote required, schemaVersion prompt-diff-package-v1, or kind enum); no placeholder text such as TODO or Lorem appears in the shipped UI
</writing>

<requirements>
Shared application state must live in Zustand (in-memory only): the prompts collection with full version chains (text, author, timestamp, change note, parent links for branches and merges), the selected prompt, base and compare picker selections, the active mode tab, diff view mode, Ignore whitespace and Ignore case flags, merge session state with per-region resolutions, annotations with anchors, resolved flags and replies, search query and results, undo/redo history, history multi-selection, export preview derivations, import draft, and UI chrome. Do not use localStorage, sessionStorage, or other browser storage APIs.
State contracts (behavioral, not storage keys):
- Switching a picker or either Ignore toggle recomputes the diff, counters, and word-level highlights from the same shared version data
- Completing a merge or restore appends exactly one new head version and every surface — history list, pickers, graph, export — reflects it without a reload
- Merge resolutions feed the created version's text region by region; the result never diverges from the choices shown during the flow
- Annotations, resolutions, and replies update the markers and threads everywhere they appear
- Undo and redo operate on the same shared history the visible surfaces render from
- Search results derive from the live version texts; a version created by merge or restore is immediately searchable
- Export History report / Version package / Merged prompt text texts are derived live from the same shared store; Import mutates that same store when the VersionPackage field contract passes
Build tooling: Vite SPA. Styling is Tailwind CSS 4.3.2 (pinned) with design tokens in the theme layer. IBM Carbon Design System (@carbon/react) is the component library for all UI chrome — modals, dropdowns, tabs, tags, notifications, and form controls; no other component library. diff-match-patch or a comparable diff library for computing line- and word-level diffs. Motion for React and AutoAnimate allowed for animation; no other animation libraries. Icons from @carbon/icons-react only, installed via npm — no raw copy-pasted SVG icon sets. All forms — the annotation composer, AnnotationReply, RestoreCreate confirmation, and Import paste when presented as a form — are driven by React Hook Form validating through a Zod schema with inline per-field errors before submit. Schemas are API-shaped: they model the payloads a real prompt-versioning / merge API would accept — the AnnotationCreate, AnnotationReply, RestoreCreate, MergeRegionResolution, VersionRecord, and VersionPackage field contracts above — the record a form creates IS the would-be request body; Version package export and import conform to the same VersionPackage field contract, including schemaVersion prompt-diff-package-v1, closed kind and resolution enums, ISO-8601 timestamps, and the parentIds / baseVersionId / compareVersionId cross-field rules. All libraries installed via npm and bundled locally; no CDN imports. No backend or authentication. Author names and any model references in seeded data are fictional; do not use real people, providers, or model names.
- Seed at least 4 prompts, each with 4 to 6 versions carrying distinct texts, fictional authors, timestamps, and change notes; at least one seeded prompt has two branches diverging from a common base with at least 3 conflict regions so Compare Branches and Merge are exercisable on first load; every seeded version conforms to the VersionRecord field contract
- Seed at least 2 annotations on one prompt so threads are visible on first load; every seeded annotation conforms to the AnnotationRecord field contract
- Useful end state: the session's work product is the produced version-control artifacts (Export History report / Version package / Merged prompt text with Copy and Download) plus Import round-trip against the VersionPackage field contract; every export must reflect live session mutations and Version package must carry every required key from the field contract above
- Zero navigational outbound links for app chrome — in-app controls only; view changes via shared client state
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
- Self-test tooling is preinstalled: the same CDP bridge the verifier runs is baked at `/opt/webmcp/webmcp_stdio_server.mjs`, and a shared headless Chrome already exposes CDP at `http://127.0.0.1:9222`. Open your served app in that Chrome, then run `node /opt/webmcp/webmcp_stdio_server.mjs` (stdio MCP; defaults to that endpoint) to exercise your registered `window.webmcp_*` tools exactly as the verifier will.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- structured-editor-v1
- browse-query-v1
- entity-collection-v1
- artifact-transfer-v1

Module specs:
<module_spec id="structured-editor-v1">
{
  "id": "structured-editor-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Structured editor",
  "purpose": "Document, diagram, canvas, configuration, and property editors.",
  "permitted_operations": ["select", "add", "delete", "update_property", "set_content", "switch_mode", "preview"],
  "binding_keys": {
    "required_any_of": [["editor_operations"], ["editor_object_types"]],
    "optional": ["editor_properties", "editor_modes", "value_bounds", "visible_postconditions"]
  },
  "restrictions": [
    "No arbitrary coordinate, DOM, or storage mutation via WebMCP.",
    "Drag, resize, drawing, snapping, and keyboard movement remain Playwright-driven when mechanism matters."
  ],
  "tool_name_prefix": "editor"
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
- Editor object types: prompt-version; merge-region; annotation-anchor
- Editor operations: select; add; update_property; set_content; switch_mode; preview
- Editor properties: base-version; compare-version; resolution; manual-text; restore-source; change-note
- Editor modes: split; unified; diff; compare-branches; blame; graph
- Value bounds: resolution in {choose-left, choose-right, edit-manually}; Complete merge disabled until every conflict region (at least 3 on the seeded branched prompt) is resolved; bulk resolve-all-left/right updates each region's chip; merge and restore each append exactly one new head version and never rewrite or delete existing versions; merge version change note names the two merged branches; restore change note names the restore source; each prompt's chain holds 4 to 6 versions; change note over 80 chars truncates in the picker and shows in full in the history list; comparing a version with itself yields the explicit no-differences state with zero counters
- Browsable entity: prompts
- Destinations: diff; compare-branches; blame; graph; history-list; export
- Filters: prompt-search; global-version-search
- Entity: annotation-thread
- Entity operations: create; update; toggle
- Entity fields: line-range-anchor; body-markdown; reply; resolved
- Artifact operations: export; copy
- Export formats: version-history-report; version-package; merged-prompt-text
- Workflow completion: switching either version picker re-renders the diff, counters (lines added, lines removed, net token delta), and word-level highlights without a reload
- Workflow completion: completing a merge appends one head version whose text matches the per-region choices exactly, adds a merge node connected to both parent branches in the graph, and adds one history entry with a success toast
- Workflow completion: a restore creates one new head equal to the restored version while every prior version remains in history and graph
- Workflow completion: posting an annotation shows a thread marker on the anchored lines; a reply appends to the thread; the resolved toggle collapses it with the resolved treatment; anchors survive split/unified switches; annotating an already-threaded range extends the existing thread
- Workflow completion: a version created by merge or restore is immediately findable via global version search, and clicking a result loads that prompt and version into the base picker
- Workflow completion: version-package contents list exactly the multi-selected versions with full text and metadata; merged-prompt-text is byte-identical to the merge result shown in the app; the history report reflects any completed merge with its per-region resolutions

Mechanics exclusions:
- Word-level diff highlight rendering (changed words marked, unchanged words inside changed lines unmarked) and line-number alignment with filler rows are rendering correctness read via Playwright, never asserted from tool output
- Counter-click scroll-to-first-change and its ~400 ms background pulse, the ~150 ms picker cross-fade, and the unified/split animated pane transition stay Playwright-observed
- Line-range text selection that anchors a new annotation is a real selection gesture driven via Playwright (the entity create then posts to that anchor)
- Blame-gutter hover tooltips (change note and timestamp) are real-pointer hover mechanics verified via computed state while hovering
- Graph node/edge entrance animation after merge or restore and thread expand/collapse height transitions stay Playwright-observed
- Undo/Redo header controls are exercised through the real controls so head-version removal/re-add and disabled states are observable
- Clipboard contents and downloaded export files remain Playwright responsibilities; no raw file/blob contents in WebMCP arguments or results

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
- WebMCP is not graded; missing tools must not create fake UI success paths.
</webmcp_action_contract>
