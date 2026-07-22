import os

content = """<summary>
Build a hard browser coordinate-bit interleaving and quadtree address proof editor for a fictional tile-card archivist repairing one corrupted spatial address while preserving bit provenance. The application uses a provenance bit zipper, nested quadtree peels, and prefix intervals to prove an address repair, resolving to an exported zip certificate containing JSON, CSVs, SVG, and a Markdown report. It operates entirely in-memory with no localStorage or backend.
</summary>

<reference_screenshots>
(No reference screenshots provided; follow the visual design and structural constraints below).
</reference_screenshots>

<core_features>
Feature: Provenance bit zipper and canonical adjacent swap
- Render immutable x=101 and y=011 source ribbons, six alternating role slots (x2, y2, x1, y1, x0, y0), stable labeled chips (X2, Y2, X1, Y1, X0, Y0), significance braces, slot locks, current bit string/code, anchor target, and an adjacent-swap rail between Y1/X1.
- Grab X1 and drag it left across Y1. Continuous preview keeps committed order unchanged while showing raw/candidate insertion, displaced Y1 ghost, projected bits/code, decoded cell, changed quadrant suffix, interval deltas, source-order status, history delta, and packet effects.
- At the X1 detent, confirmation names the operation, two changed positions, six immutable values/labels, Draft/Proof order, bits/code, cells, paths, bounds, intervals, curve neighbors, anchor residual, and artifact delta.
- Cancel restores exact Draft order, marker, selection, focus, grid pan/zoom, curve visibility, tree depth, interval expansion, comparison, replay frame, history anchor, and event count.
- Invalid releases (outside, prethreshold, same-slot, wrong-direction, nonadjacent, locked, duplicate, stale, already-Proof) retain valid state without generating an event.

Feature: Connected Address Evidence (Linked Views)
- Synchronize the token zipper, address ribbon, decimal rail, 8x8 grid, 64-step Z-order polyline, decoded-cell ghost, immutable anchor pin, 3-level quadtree peel, prefix cards, inclusive interval rail, coordinate/source ledger, Draft/Proof comparison, history, CSV previews, and standalone SVG preview.
- Selecting a token, slot, address bit, curve step, grid cell, quadrant, prefix, interval endpoint, mismatch, replay frame, event, CSV row, or SVG entity highlights the same stable IDs everywhere.
- Quadtree peel shows each parent rectangle opening into four xy-labeled children (NW=00, NE=10, SW=01, SE=11).
- Interval rail shows exact prefix multiplication and inclusive endpoints (prefix * 4^(3-d) through (prefix+1) * 4^(3-d) - 1).
- Curve highlights code position rather than Euclidean continuity. Z-order permutations must match the exact 64-code Morton order.

Feature: Reorder replay and exact proof
- Replay stages include chip-lifted, adjacent-gap-opened, Y1-displaced-right, X1-crossed-left, alternating-order-restored, bits-serialized, code-changed, depth-two-rerouted, depth-three-settled, anchor-matched, curve-neighbors-returned, and proof-settled.
- Normal motion moves stable chips through the zipper, peels back incorrect quadrants, carries the decoded ghost from (7,1) to (5,3), and shifts the curve step 43 to 39.
- False repairs (label swap, value flip, LSB-first convention, y/x pair reversal, wrong y direction, open interval, stale curve, trusted imported derivation) are visible blocking diagnostics.

Feature: Annotation, history, review, and approval
- Pin immutable Draft and authored Proof checkpoints.
- Support appending notes (e.g. fictional reviewer Zia adds note "Anchor source remains immutable to PIN-A").
- Selective undo of the repair restores Draft but keeps the note, and stales the review; branch restore recovers Proof.
- Review records use stable ID, actor (Moe|Zia), verdict (inspect|interleave-repair-exact|accepted-fictional), logical tick, and optional note.
- Approval requires exact coordinate/anchor hashes, exact Proof order, unchanged values/sources, code 39, cell (5,3), path NE->SW->SE, intervals [32,47]/[36,39]/[39,39], curve neighbors 38:(5,2)/40:(6,0), zero violations, zero anchor mismatch, one confirmed comparison, one interleave-repair-exact review, zero diagnostics, and artifact preflight success.

Feature: Atomic cell-address packet and restoration (Session Import/Export)
- Export approved Proof as `cedar-tile-morton-address-proof.zip` containing 9 files: manifest.json, morton-project.json, tokens.csv, prefixes.csv, cells.csv, history.ndjson, morton-proof.svg, address-report.md, and morton-project.schema.json.
- Import validates all content and requires confirmation. Rejected imports mutate zero state and preserve authored context.
</core_features>

<user_flows>
- Direct Entry: Initial UI reads Draft · code 43 · cell (7,1) · anchor mismatch 4 · source-order violations 2 · not reviewed. Select X1, focus its handle.
- Normal Repair Flow: Drag X1 left over Y1, observe candidate previews, drop, confirm the `SWAP-SOURCE-TOKENS-X1-Y1` operation. Code becomes 39, cell becomes (5,3). Review as "interleave-repair-exact", approve, and export the ZIP certificate.
- False Repair Flow: Previewing a label swap or value flip displays a "false repair" diagnostic with zero durable mutation, preventing approval.
- Selective Undo / Redo / Branch: Undo the repair to return to Draft, verify history and annotations, restore Proof branch, preserving stability of IDs.
- Import Flow: Drag/drop or select a valid exported zip; stage the artifacts, compare them against the fixture, confirm to overwrite state, or cancel to leave current state completely unharmed.
</user_flows>

<edge_cases>
- Canceling a drag or dropping outside adjacent bounds cleanly reverts the visual drag state without emitting any history event.
- Importing an invalid ZIP (e.g., tampered hashes, wrong schema, swapped labels instead of swapped chips) triggers detailed diagnostics and prevents import, mutating no state.
</edge_cases>

<visual_design>
- Desk metaphor for the fictional tile-card archivist.
- Immutable elements (anchor pin, source ribbons) must look distinct from draggable chips.
- Clear distinction between Draft (initial corrupted), Preview (during drag/hover), and Proof (resolved) states.
- Grid, curve, and quadtree must cleanly render a 8x8 Z-order layout.
- High data density but well organized; readable without relying purely on color for status.
</visual_design>

<motion>
- Continuous drag preview of adjacent chip displacement.
- Peeling motion for quadtree quadrants when depths 2 and 3 change.
- Decoded cell ghost moving from (7,1) to (5,3).
- Reduced motion setting retains discrete states without continuous tweening, preserving old/new outlines and deltas.
</motion>

<responsiveness>
- At 390x844 (mobile), the selected token becomes a full-height zipper sheet, grid becomes a focused mini-stage, and other sections become swipe-selectable cards with 44x44 minimum touch targets and no horizontal page overflow.
- At 1440x900 (desktop), the bit zipper and spatial proof dominate a deliberate desk view.
</responsiveness>

<accessibility>
- Keyboard users can focus X1, press Space to lift, ArrowLeft once to preview displacement, then Escape to cancel or Enter to confirm.
- State changes, including path and interval changes, announce to screen readers.
- All interactive elements must have `tabIndex={0}` or use semantic buttons with Space/Enter activation. Dialog traps and returns focus.
</accessibility>

<performance>
- Changes must acknowledge within 100ms and settle linked state within 500ms.
- Zip generation and import validation must not block the UI for excessive periods (aim for <2s).
- No unhandled exceptions or runaway resources on repeated resets.
</performance>

<writing>
- Use exact terminology: "source token" vs "slot role", "value" vs "provenance", "significance" vs "position", "code" vs "coordinate".
- Diagnostics clearly identify the ID, value, rule broken, and recovery.
</writing>

<innovation>
- The UI flawlessly reconciles raw bit reordering with macroscopic spatial consequences (quadtree paths, Z-order curve placement, prefix intervals) in a deterministic, traceable way.
</innovation>

<requirements>
- React 18 or 19 with Vite, Zustand, Tailwind CSS v4.
- In-memory state only (no localStorage).
- Deterministic reduction: pointer, keyboard, exact UI command, WebMCP, and Zip import all resolve via one canonical reducer.
- The exported artifact must be a true valid ZIP with the 9 exact required files matching the schema and data formats requested.
</requirements>

<integrity>
- Do not fabricate file downloads or WebMCP behavior.
- Ensure the reference evidence.webm is a genuine recording of the implementation.
- Preserve the exact layout of the initial Draft and correct Proof.
</integrity>

<delivery>
- Provide `solution/app` correctly configured on port 3000.
- Submit a genuine `evidence.webm` recording of the flows.
- Pass `corpuscheck validate` successfully.
</delivery>

<webmcp_action_contract>
The application must expose the following WebMCP tools:
- `undo` and `redo`
- `selective_undo` (target an event ID to revert)
- `branch_restore` (target a branch ID to restore)
- `repair_swap` (arguments: `tokenId`, `beforeTokenId`, `policy` must be `adjacent-stable-swap`)
- `add_note` (arguments: `targetId`, `actor`, `text`)
- `review` (arguments: `verdict`, `actor`, `note`)
- `approve`
- `export_proof`
- `import_proof` (arguments: `zipBase64`)
- `reset`
</webmcp_action_contract>
"""

with open("tasks/frontend-creative-tools-fictional-morton-cell-address-bit-interleave-repair-proof-studio/instruction.md", "w") as f:
    f.write(content)
