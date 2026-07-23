<summary>
Build a framework-agnostic frontend application for assembling one fictional twenty-second spoken introduction from three deterministic local takes. The user drags transcript-aligned phrase SEG-B-04 from Take B into a fixed-duration phrase slot in the master, encounters a precise 3,200-sample shortfall, previews and confirms a symmetric room-tone repair, and watches the source waveform, master ribbon, transcript, seam microscope, pacing arc, edit-decision list, history, WebMCP state, and exact downloadable WAV packet update from one canonical model.

This is not a voice recorder, voice-note inbox, transcription service, resume builder, podcast dashboard, audio classifier, caption editor, dialogue-writing tool, or generic file list. It never records, generates, clones, scores, or identifies a voice. Its defining browser interaction is a sample-exact spoken-take splice: one immutable source phrase must replace one master slot without changing the surrounding script or total master duration, and every linked representation must agree about source identity, word boundaries, padding, crossfades, rendered samples, selection, provenance, and export bytes.
</summary>

<core_features>
Take shelf, transcript, and synchronized source audition: Render three visually distinct take lanes with overview waveform, stable take ID/hash, duration, phrase count, and usage count. Opening a take binds its detailed waveform, word transcript, source playhead, loop, phrase rail, inspector, and master comparison. Dragging across waveform words or shift-selecting transcript tiles creates a preview span only when words are consecutive and belong to one take. The waveform shows exact sample ticks and selected word boundaries; the transcript shows source time and sample range without color-only meaning.
Master ribbon, slot replacement, and repair confirmation: Render the twenty-second master as fixed destination slots over a shared sample ruler, with output waveform, intended transcript, source badges, padding regions, crossfade envelopes, seam markers, and a playhead. Drag SEG-B-04 onto SLOT-04. Feed-forward names source and destination bounds, 3,200-sample shortfall, prospective room-tone spans, crossfade windows, output length, take-usage delta, findings, and artifact consequences. Dropping without a valid repair opens a confirmation sheet rather than mutating. The sheet compares reject, pad-start, pad-end, and pad-symmetric. Confirming the canonical symmetric option appends one replacement event.
Seam microscope and deterministic PCM render proof: Two linked seam microscopes show the last 1,280 prefix samples plus first 1,280 phrase samples and the last 1,280 phrase samples plus first 1,280 suffix samples. Users pan, zoom, scrub, loop, and switch raw/crossfaded/difference overlays. A non-color envelope and signed delta prove the 320-sample transition. The render proof lists every copy and blend interval, source array/hash, destination interval, formula, saturation count, first/last eight samples, per-window checksum, slot checksum, and master PCM checksum.
Linked pacing, usage, branch, and review evidence: A transcript ribbon shows intended word order and exact source take for each slot. A pacing arc displays word durations and slot occupancy. The take-usage map, room-tone ledger, seam finding list, readiness checklist, artifact preview, and master/source comparison all share selection and hashes. Compare branches Original A and Repaired B. Add reviewer note Keep the lantern phrase from Take B; preserve the pause on both sides. to stable SLOT-04. Selectively undoing the replacement restores SEG-A-04 while keeping the note suspended against the same slot ID. Replay reconnects it. Approval requires the canonical replacement, exact render proof, zero seam errors, both seams auditioned at 1× and visually inspected at 0.5×, current reviewer acknowledgement, UI/WebMCP parity, and artifact preview parity.
Event history, reload, and responsive workstation: Each authored mutation records actor, logical time, operation, request payload, stable read/write IDs, before/after hashes, inverse relation, and branch. Actor-aware undo may preserve later notes that reference stable slots. Desktop links take shelf/transcript, source waveform, master ribbon, seam microscopes, and review/proof rail. Tablet uses a master/source split with tabbed proof. At 390×844, take lanes become swipe-selectable cards, waveform detail becomes a full-width sample strip, the master becomes a horizontal overview plus vertically ordered slot ladder, phrase pickup and repair use bottom sheets, and seam/proof/review/artifacts become focusable cards. Reload restores active project/branch, take and slot selection, chosen word span, zoom and scroll, filters, inspector tab, comparison mode, note, history cursor, approval, and artifact state.
Exact audio packet and atomic restoration: Import accepts project.json alone or the exact packet ZIP. It stages all diagnostics before a separate confirmation. A successful import restores authored and derived state. Download lantern-workshop-spoken-seam.zip with eight entries: project.json, edit-decisions.csv, master-transcript.vtt, master.wav, seam-map.svg, review.md, events.ndjson, and manifest.json. Re-export after successful import is semantically identical except regenerated exportedAt/generatedAt, import event, and dependent hashes.
</core_features>

<visual_design>
- Render visually distinct take lanes with overview waveform, stable take ID/hash, duration, phrase count, and usage count.
- The waveform shows exact sample ticks and selected word boundaries.
- The transcript shows source time and sample range without color-only meaning.
- Render the twenty-second master as fixed destination slots over a shared sample ruler, with output waveform, intended transcript, source badges, padding regions, crossfade envelopes, seam markers, and a playhead.
- Visual hierarchy and take/slot/seam meaning remain legible without color alone across source/master, selected, looping, picked-up, invalid, short, proposed, padded, crossfaded, stale, undone, reviewed, and approved states.
- Two linked seam microscopes show the last 1,280 prefix samples plus first 1,280 phrase samples and the last 1,280 phrase samples plus first 1,280 suffix samples with a non-color envelope and signed delta proving the 320-sample transition.
- Pacing arc displays word durations and slot occupancy from fixture boundaries.
- Desktop links take shelf/transcript, source waveform, master ribbon, seam microscopes, and review/proof rail. Tablet uses a master/source split with tabbed proof. At 390×844, take lanes become swipe-selectable cards, waveform detail becomes a full-width sample strip, the master becomes a horizontal overview plus vertically ordered slot ladder, phrase pickup and repair use bottom sheets, and seam/proof/review/artifacts become focusable cards.
</visual_design>

<motion>
- Early/settled causal motion: the phrase lifts from Take B, lands short inside SLOT-04, room tone expands symmetrically, two envelopes draw, and linked source/PCM evidence settles.
- Reduced motion uses indexed old/new blocks, sample deltas, envelope tables, and announcements instead of animated waveform travel while preserving deterministic playhead positions.
- Direct manipulation acknowledges within 100 ms, linked derivations settle within 500 ms.
</motion>

<requirements>
Project SPK-SEAM-01 uses PCM signed 16-bit little-endian mono at exactly 16,000 Hz. The canonical master is exactly 320,000 samples (20,000 ms).
All libraries must be installed via npm; do not load scripts or styles from CDNs.
The solution must use Tailwind CSS 4.3.2 installed via npm.
Master slots are contiguous and fixed: SLOT-01 0..64,000, SLOT-02 64,000..128,000, SLOT-03 128,000..176,000, SLOT-04 176,000..224,000, SLOT-05 224,000..272,000, and SLOT-06 272,000..320,000. Only the source assignment, padding, and transitions of SLOT-04 are editable.
Candidate SEG-B-04 is the exact consecutive span WORD-B-19..WORD-B-25, source samples 160,000..204,800, length 44,800.
The destination shortfall is 3,200 samples. Repair enum is reject|pad-start|pad-end|pad-symmetric; canonical choice pad-symmetric requires 1,600 room-tone samples on each side from ROOM-B-02 (source samples 704,000..720,000).
Crossfade canonical length is 320 samples. For fade position i in 0..319, output uses integer numerator left*(320-i) + right*i, divides by 320, and rounds half away from zero with saturation to [-32768,32767].
The canonical SLOT-04 render partition is explicit and gap-free: output 176,000..177,280 copies ROOM-B-02 704,000..705,280; output 177,280..177,600 is crossfade-in, blending room samples 705,280..705,600 with phrase samples 160,000..160,320; output 177,600..222,400 copies phrase 160,000..204,800; output 222,400..222,720 is crossfade-out, blending phrase samples 204,480..204,800 with room samples 705,600..705,920; output 222,720..224,000 copies room samples 705,920..707,200.
Text labels are 1..64 Unicode scalars; notes 1..300; selection must contain 1..40 consecutive word IDs in one take; source segment length is 1,600..160,000 samples; slot length is 8,000..160,000; project total is 16,000..9,600,000; zoom is 0.25..64.00 in 0.25 increments. Logical time begins 2026-11-14T14:00:00.000Z and advances only through declared fixture actions.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000. This is your responsibility: the verifier runs the same `verify:build` gate first, and an app that fails it is not served or judged and scores 0 outright — no partial credit for a build that does not come up.
- WebMCP is a required delivery step, not a scoring criterion; implement exactly the `<webmcp_action_contract>` below; register tools yourself from `<module_spec>` + Bindings using the same handlers as the visible UI; honor mechanics exclusions; optional self-test via `webmcp_session_info` / `webmcp_list_tools` / `webmcp_invoke_tool` only.
</delivery>

<webmcp_action_contract>
Contract version: zto-webmcp-v1

Modules:
- fictional-spoken-seam-session-v1
- fictional-spoken-seam-source-v1
- fictional-spoken-seam-replacement-v1
- fictional-spoken-seam-render-v1
- fictional-spoken-seam-history-v1
- fictional-spoken-seam-artifact-v1

Module specs:
<module_spec id="fictional-spoken-seam-session-v1">
{
  "id": "fictional-spoken-seam-session-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Session",
  "purpose": "Inspect project bounds, milestones, view state, and approval.",
  "permitted_operations": ["get_session_info", "get_project_state", "reset_project"]
}
</module_spec>

<module_spec id="fictional-spoken-seam-source-v1">
{
  "id": "fictional-spoken-seam-source-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Source",
  "purpose": "Select transcript words and inspect source waveforms.",
  "permitted_operations": ["list_takes", "get_take_transcript", "select_word_span", "get_source_waveform"]
}
</module_spec>

<module_spec id="fictional-spoken-seam-replacement-v1">
{
  "id": "fictional-spoken-seam-replacement-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Replacement",
  "purpose": "Preview shortfall and coordinate exact room-tone repair into the master slot.",
  "permitted_operations": ["preview_slot_replacement", "commit_slot_replacement", "cancel_slot_replacement"]
}
</module_spec>

<module_spec id="fictional-spoken-seam-render-v1">
{
  "id": "fictional-spoken-seam-render-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Render",
  "purpose": "Read seam proof samples, integer blend logic, and canonical master excerpts.",
  "permitted_operations": ["get_seam_proof", "get_master_render", "run_audition"]
}
</module_spec>

<module_spec id="fictional-spoken-seam-history-v1">
{
  "id": "fictional-spoken-seam-history-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "History",
  "purpose": "Query event relations, note annotations, and selective undo blocks.",
  "permitted_operations": ["get_history", "selective_undo", "replay_event", "compare_branches", "add_review_note"]
}
</module_spec>

<module_spec id="fictional-spoken-seam-artifact-v1">
{
  "id": "fictional-spoken-seam-artifact-v1",
  "contract_version": "zto-webmcp-v1",
  "title": "Artifact",
  "purpose": "Retrieve readiness constraints, approve renders, and serialize/deserialize exact packets.",
  "permitted_operations": ["get_readiness", "approve_render", "export_packet", "preview_import", "commit_import"]
}
</module_spec>
</webmcp_action_contract>
