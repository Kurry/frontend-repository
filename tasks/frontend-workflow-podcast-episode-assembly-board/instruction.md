<summary>
Build a Podcast Episode Assembly Board using React, Zustand, and Tailwind CSS 4.3.2. The app supports multitrack timeline assembly, transcript and citation binding, chapter and narrative block authoring, mix automation, rights workflow, branch cuts, rendering with partial failure recovery, and artifacts export. The app runs completely in-browser with in-memory state, using bundled deterministic fixtures, providing exact XML/CSV/JSON/VTT/Markdown/SVG export and round-trip import capabilities. All npm dependencies must be local (no CDNs).
</summary>

<core_features>
Core features (each line is an observable behavior the finished app must exhibit):
Feature: Source bin and clip provenance —
- The app provides a Source Bin listing 24 deterministic source clips (Side Street Signals fixtures) with duration, speaker/type, transcript snippet, rights state, and immutable media hash.
- Users create timeline clip instances from source in/out ranges by dragging or clicking "Insert"; the source media state never mutates.
- Selecting a timeline instance highlights exact transcript tokens, rights record, source waveform, and other instances of the same source.
Feature: Multitrack timeline —
- The board has dialogue, music, ambient, and marker lanes supporting drag, trim, split, ripple move, nonripple move, gap close, mute, fade, and crossfade.
- Timeline operations use integer milliseconds and snap to transcript token boundaries, 10-ms increments, or chapter markers.
- Dialogue overlaps require declared cross-talk lanes; fades and crossfades obey clip bounds.
- Keyboard and mobile numeric operations equal pointer gestures for inserting, moving, trimming, splitting, and rippling clips.
Feature: Transcript and citation binding —
- Active dialogue instances derive transcript tokens inside source ranges.
- Editors can mark tokens as included/excluded, correct fixture errors with provenance, and bind exact spans to show-note claims/quotes.
- Ripple edits shift episode times without changing source times. Orphaned citations and words outside clip ranges block approval.
Feature: Chapters and narrative blocks —
- A narrative outline supports cold open, introduction, three chapters, transition, and credits blocks.
- Blocks define title, role, time range, required speakers/topics, and show-note summary.
- Reordering blocks moves their clip groups under explicit ripple preview. Chapters cannot overlap and must cover the approved timeline under declared intro/credit rules.
Feature: Loudness and mix automation —
- Clip gain and lane automation points produce deterministic sampled loudness/peak fixture values via linear interpolation.
- Curves drag on time/value axes.
- A validator checks dialogue target band, jump thresholds, clipping, music-under-dialogue ducking, and fade continuity.
Feature: Rights and approval workflow —
- Every included source requires allowed usage, territory fixture, attribution text, and expiry after publish date.
- Transcript/citation, editorial, rights, accessibility, and master approvals freeze exact cut checksums; any material edit marks affected approvals stale.
Feature: Branch cuts and partial render recovery —
- Users can fork cuts to compare clip membership/order/ranges, transcript, chapters, mix, duration, rights, and notes, then merge property/time-range conflicts.
- Render workflow produces master, transcript, chapters, artwork manifest, and RSS item.
- The first batch deterministically fails transcript timestamp and RSS enclosure checks; a retry failed-only preserves successful outputs and attempts.
Feature: Export and Import —
- Export produces Canonical JSON schemaVersion podcast-episode-package/v1, CSV EDL/transcript ledger, WebVTT transcript, RSS XML item, Markdown show notes/credits, and SVG timeline/loudness report.
- Import reconstructs state exactly and rejects invalid artifacts.
- Canonical re-export changes only exportedAt; CSV, VTT, RSS, Markdown, and SVG remain byte-identical.
</core_features>

<visual_design>
Visual design (each line is an observable behavior the finished app must exhibit):
- The layout presents source/transcript, multitrack/outline, mix/rights, and approval/render rails in a cohesive desktop view.
- Hierarchy remains legible across source/instance/trim/split/gap/overlap/fade, token/citation, chapter, mix/finding, rights/stale/approved/render states.
- Color coding visually distinguishes dialogue vs. music vs. ambient lanes, active vs. stale approval states, and pass vs. fail validation findings.
</visual_design>

<motion>
Motion (each line is an observable behavior the finished app must exhibit):
- Clip travel/trim/ripple, transcript/chapter shifts, and automation/loudness changes visually animate.
- Stale approval transitions and render retries explain cause with causal motion.
- Reduced motion retains before/after time/value/status deltas instantly without animation.
</motion>

<requirements>
Technical requirements (each line is an observable behavior the finished app must exhibit):
- Operates entirely in-memory (no localStorage) after initialization with starter fixtures.
- Serves successfully on port 3000 with zero console errors.
- WebMCP contract implemented via window.webmcp_session_info, window.webmcp_list_tools, and window.webmcp_invoke_tool conforming to standard shape.
- Exposes WebMCP tools for interacting with clip/timeline, transcript/citation, chapter, mix, rights/approval, branch, render, history, transfer, and reset.
- Responsive reflows scale down to 375px mobile, becoming source/clip cards, timeline mini-map, trim/fade/automation sheets, vertical chapter/provenance lineage, and approval/render stepper, retaining all actions.
- Full keyboard accessibility for insert/move/trim/split clips, edit fades/automation, navigate/correct/cite transcript, reorder chapters, review rights, merge/approve/render, and export without pointer.
- Interleave UI/WebMCP actions (clip/timeline, transcript, chapter, mix, rights, branch, render, history, transfer) and assert ids, ms, samples, checksums, files match.
- All dependencies must be resolved locally (via npm) without using CDNs.
</requirements>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- structured-editor-v1
- entity-collection-v1
- artifact-transfer-v1

Module specs:
<module_spec id="structured-editor-v1">
{
  "name": "structured-editor-v1",
  "version": "1.0.0",
  "description": "Standardized multitrack and automation operations.",
  "tools": []
}
</module_spec>
<module_spec id="entity-collection-v1">
{
  "name": "entity-collection-v1",
  "version": "1.0.0",
  "description": "Standardized operations for managing entities like chapters and rights.",
  "tools": []
}
</module_spec>
<module_spec id="artifact-transfer-v1">
{
  "name": "artifact-transfer-v1",
  "version": "1.0.0",
  "description": "Standardized operations for export/import.",
  "tools": []
}
</module_spec>
</webmcp_action_contract>
