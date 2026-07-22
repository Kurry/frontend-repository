<summary>
Build a frontend-only editorial compositor for a fictional small museum. An editor applies exact, pre-authored copy patches to object labels, watches the revised prose reflow simultaneously into wall-card, rail-card, and narrow mobile-guide formats, resolves a deliberately stale overlapping patch through a three-way rebase preview, preserves citations and glossary references, selectively undoes one editor's change without erasing a later reviewer note, approves the coherent revision, and exports a portable label-production packet.

This is a creative web application, not a landing page, chatbot, resume form, CMS, generic rich-text editor, or dashboard with decorative charts. The signature interaction is dragging one editorial patch chip onto its exact highlighted clause. During the drag, the three physical proofs show a non-committing ghost reflow; on drop, one canonical event changes the token span and synchronizes the before/after diff, line-fit rulers, overflow and widow diagnostics, citation anchors, glossary occurrences, reviewer ledger, history branch, approval freshness, WebMCP state, and downloadable artifacts. A keyboard command and an exact-range patch dialog must reach the identical committed state.
</summary>

<core_features>
Exact patch rail and synchronized revision desk: A desktop desk shows the base/current text in a semantic, line-addressable reader; a split/unified diff toggle; pending/accepted/rejected/stale patch cards; source and glossary marks; selection details; and a compact event rail. Patch cards expose stable ID, editor, base revision/hash, exact original/replacement, range, rationale, source links, status, and fit forecast. Dragging a compatible patch highlights only its exact target. The text shows a before ghost and replacement ghost, while each proof shows prospective line breaks, signed line/word deltas, overflow/widow state, and citation movement. Dropping opens a focus-trapped confirmation naming the patch, exact clause, three format deltas, citation/glossary effects, and resulting revision. Confirm commits once and returns focus to the patch's new history entry. Keyboard users focus a patch, press Enter to inspect, Alt+Shift+A to apply to the exact target.

Physical proof triad and deterministic fit inspection: Wall, rail, and mobile proofs render from one current token stream through bundled metrics. Each proof displays exact box bounds, padding, baseline grid, line numbers, citation badges, glossary marks, maximum line rule, remaining/overrun pixels, widow state, and revision hash. A format selector, synchronized zoom, and line brush link the same token IDs across reader, diff, other proofs, sources, glossary, patch rail, and event history. A Layout evidence panel shows each line's token IDs, measured advance, break reason, and status. Toggle SVG/Canvas proof rendering; both modes must have the same geometry checksum, hit targets, brush ranges, accessible fallback table, and export. Fit errors are actionable. One-pixel overrun names format, line, measured width, allowed width, offending token, and recovery.

Overlapping-patch three-way rebase and order convergence: When a patch's exact range or hash is stale, applying it cannot guess. A modal rebase workspace presents Base, Current, and Patch panes with stable token IDs, exact overlapping intervals, retained/deleted/inserted spans, both hashes, source/glossary consequences, and prospective proof deltas. Keep current records a resolved rejection with rationale and no text change; Apply patch replaces the declared current overlap and records the discarded current clause; Compose requires a bounded exact result, validates citations/glossary and all format proofs, and records both parents.

Citations, glossary, comments, selective undo, and approval: Sources contain stable ID, invented title, invented contributor, fictional date token, locator, type enum, and note. Citation anchors bind to stable retained token IDs plus exact quote/context selectors. Glossary occurrences bind to normalized phrases. Comments attach to patch, source, glossary occurrence, proof diagnostic, or revision. Author-aware undo targets one actor's eligible event by stable ID. Selectively undoing Ena's manual edit must preserve Rui's later source note and all independent later events. Approval requires no overflow/widow errors, no unresolved stale/overlapping patch, no orphan citation, no unresolved blocking review, and all three format proofs generated from the same current revision.

Exact production packet and atomic restoration: Approve and download copper-moth-label-packet.zip containing label-project.json, labels.csv, patch-events.ndjson, annotations.jsonld, label-cards.svg, revision-proof.svg, review-report.md, and manifest.json. Import accepts either the exact ZIP or label-project.json alone. ZIP import validates the manifest, hashes, byte lengths, schemas, relationships, event chain, revision hashes, token mappings, patch ranges, annotation selectors, proof geometry/checksums, CSV rows, SVG metadata, report approval, sort order, and freshness before one atomic commit.
</core_features>

<user_flows>
Complete canonical apply -> fit inspect -> manual edit -> stale attempt/cancel -> Compose -> comment -> selective undo -> dependent recovery -> review/approve -> exact packet/import without hidden setup or credited fixture completion.
</user_flows>

<edge_cases>
Exercise empty/reversed/out-of-range range, exact text/hash mismatch, disjoint and overlapping order, stale modal confirm, double commit, one-pixel overrun, forbidden widow, orphan source/glossary, undo with later foreign note, stale approval, corrupt each artifact, JSON-alone import, and reset cancel; each names recovery and preserves valid state.
</edge_cases>

<visual_design>
Inspect base/current, idle/hover/drag/invalid/confirmed, fitting/exact/one-pixel-over/widow, fresh/stale/conflicting/resolved, commented/blocking/approved, selected/brushed, and empty-filter states at desktop and mobile; hierarchy and status remain distinct without color alone.
</visual_design>

<motion>
Sample early/settled frames for valid patch ghost, invalid return, three-proof reflow, rebase composition, selective-undo staleness, and approval invalidation; reduced motion exposes identical endpoints, signed deltas, patterns, focus, and announcements.
</motion>

<responsiveness>
At 1440x900, reader/diff and patch rail occupy the main workspace, proofs form a synchronized right rail, and source/glossary/review/history appear in a lower inspector without covering committed text.

At 768 px, the reader remains above a two-tab Patches/Proofs workspace with sticky fit status.

At 390x844, the selected clause and current format become a full-width stage; patches use a bottom sheet; three proofs become swipe-selectable semantic cards; rebase panes become a Base/Current/Patch segmented switch with a persistent overlap summary; and source, glossary, comments, history, review, approval, and export remain operable. There is no page-level horizontal overflow, clipped modal, hover-only content, or target below 44x44 px.
</responsiveness>

<accessibility>
Without pointer, find patch-17, inspect exact range and fit forecast, apply/confirm, brush proof lines, resolve rebase, traverse citations/comments/history, approve, and export; labels, token ranges, signed fit deltas, errors, live status, and focus return are announced.
</accessibility>

<performance>
On the declared 2,000-label/20,000-patch/100,000-event fixture, drag one visible patch, brush lines, switch renderer, filter, rebase, selectively undo, and export/import; feedback meets 100/500/2,000 ms budgets, stale work cancels, and no interaction drops.
</performance>

<writing>
Trigger every validation/rebase/fit/review/import failure; copy names fictional label/patch, exact path/range/hash or physical rule, unchanged-state consequence, and a concrete recovery without AI, historical, attribution, or professional-practice claims.
</writing>

<innovation>
One patch application and one composed overlap reconcile stable token lineage with three physical layouts, citations, glossary, foreign comments, author history, approval, WebMCP, and interoperable artifacts under reverse order and round trip.
</innovation>

<requirements>
Built with React 19, Vite, Zustand, Tailwind CSS 4.3.2, Framer Motion, and Zod (or equivalent standard frontend-only tools).
In-memory state only. NO localStorage, sessionStorage, or other browser storage APIs; a page reload returns the app to its seeded state.
Deterministic fictional fixture and rules: lbl-07 has base revision rev-07-a, 73 normalized Unicode scalar tokens, language en, title Varnish Ledger, object ID obj-07, and source order src-02, src-04, src-09. Normalize line endings to LF and text to NFC; retain punctuation as separate tokens; never trim internal whitespace. Stable token IDs derive from revision plus ordinal. Physical formats use deterministic bundled metrics (Wall: 420x240 px, 24 px padding, 18/26 px font/line, 8 body lines max, final line >= 3 words; Rail: 300x230 px, 18 px padding, 15/21 px font/line, 10 body lines max, final line >= 3 words; Mobile: 320x480 px, 20 px padding, 17/25 px font/line, 15 body lines max, final line >= 2 words).
patch-17 has base rev-07-a, range [18,22), exact original phrase glimmered under borrowed lamps, replacement held a dull sheen beneath loaned lamps, editor ena, rationale enum tone, source links src-04, and expected base hash b95f17. Its canonical application yields revision rev-07-b, event evt-095, 8/10/14 body lines for wall/rail/mobile, word deltas shown as +3, and one new glossary occurrence for gls-11 (loaned lamp).
The manual edit replaces workshop ledger with maker's ledger, event evt-096. patch-22 overlaps the later edited neighborhood and retains base hash dd0722; after the manual edit its current hash is 3c612a. Compose resolution text is exactly the maker's ledger records a second varnish, producing event evt-097 with resolution enum compose, both parent hashes, the selected intervals, and a deterministic result hash.
Export outputs copper-moth-label-packet.zip containing label-project.json, labels.csv, patch-events.ndjson, annotations.jsonld, label-cards.svg, revision-proof.svg, review-report.md, and manifest.json.
All libraries must be installed via npm and bundled locally; no CDN imports of any library, font, or icon set are allowed.
WebMCP is a required delivery step, implementing the webmcp_action_contract below.
</requirements>

<integrity>
Work only from this instruction and /app; do not use /solution, /tests, or verifier artifacts.
</integrity>

<delivery>
Produce an original self-contained app in /app. /app/package.json MUST define npm scripts named exactly start (serves the app on port 3000) and verify:build (exits 0 when the app entry/build is present and succeeds); run via npm start on port 3000.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- structured-editor-v1
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
- Editor object types: patch, format, brush, proof_renderer, proof_zoom
- Editor properties: text, range
- Editor modes: rebase, diff, preview
- Editor operations: select, preview, set_content, update_property, switch_mode
- Entity: label, revision, event, source, glossary, thread, comment, approval, session
- Entity operations: select, create, update, delete
- Entity fields: exact_text, title, locator, block
- Artifact operations: export, import, copy
- Export formats: packet-zip
- Import modes: packet-zip, project-json

Mechanics exclusions:
- Raw file paths/blobs forbidden in WebMCP args
- Zip rasterization fidelity and clipboard copy stay Playwright-observed

Implementation:
- Register browser WebMCP tools for labels (query_labels, select_label, set_revision_view, search_workspace), patches_and_text (query_patches, preview_patch, apply_patch, reject_patch, withdraw_patch, edit_text_exact), proofs_and_links (query_proofs, select_format, set_proof_renderer, set_proof_zoom, set_line_brush, query_sources, query_glossary, select_linked_record), rebase_and_history (query_rebase, preview_rebase_resolution, commit_rebase_resolution, cancel_rebase, query_history, undo_event, redo_event, switch_branch, compare_branches), review (query_threads, add_comment, reply_comment, resolve_comment, query_review, mark_reviewed, approve_revision, cancel_approval, advance_logical_clock), artifacts_and_session (query_session, query_artifact_manifest, export_packet, import_packet, reset_session).
</webmcp_action_contract>