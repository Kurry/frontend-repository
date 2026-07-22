<summary>
Fictional Morton Cell-Address Bit-Interleave Repair Proof Studio is a hard browser coordinate-bit interleaving and quadtree address proof editor for a fictional tile-card archivist. The task changes no coordinate-bit value and paints no grid cell; it reorders two stable source tokens, decodes one Morton address, changes quadtree ancestry and prefix intervals, and proves that the derived cell reaches an immutable fictional anchor.
 Built with React 19, Vite, Zustand, Tailwind CSS 4.3.2, Framer Motion, and Zod.
</summary>

<reference_screenshots>
Reference screenshots are not provided. Use the layout instructions to design a deliberate tile-card desk.
</reference_screenshots>

<core_features>
Provenance bit zipper and canonical adjacent swap Render immutable x=101 and y=011 source ribbons, six alternating role slots, stable labeled chips, significance braces, slot locks, current bit string/code, anchor target, and an adjacent-swap rail between Y1/X1. Grab X1 and drag it left. Continuous preview keeps committed order unchanged while showing raw/candidate insertion, displaced Y1 ghost, projected bits/code, decoded cell, changed quadrant suffix, interval deltas, source-order status, history delta, and packet effects.
Exact, keyboard, and compact alternate input Keyboard users focus X1, press Space to lift, ArrowLeft once to preview displacement of Y1, then Escape or Enter. On compact touch, tapping X1 opens a full-height zipper sheet with one-step move control.
Linked grid, curve, quadtree, and interval proof Synchronize the token zipper, address ribbon, decimal rail, eight-by-eight grid, 64-step Z-order polyline, decoded-cell ghost, immutable anchor pin, three-level quadtree peel, prefix cards, inclusive interval rail, coordinate/source ledger, Draft/Proof comparison, history, CSV previews, and standalone SVG preview.
Reorder replay, false repairs, and exact proof Normal motion moves stable chips through the zipper, peels back incorrect depth-two/three quadrants, carries the decoded ghost from (7,1) to (5,3), and shifts the highlighted curve step 43→39.
Annotation, author-aware history, review, and approval Pin immutable Draft and authored Proof checkpoints. Review records use stable ID, actor Moe|Zia, verdict, logical tick. Approval requires exact coordinate/anchor hashes, exact Proof order, unchanged values/sources, code 39, decoded cell (5,3).
Atomic cell-address packet and restoration Export approved Proof as cedar-tile-morton-address-proof.zip. Import stages every member, compares fixture/current/incoming, and commits only after confirmation.
</core_features>

<user_flows>
- Direct entry starts at Draft (code 43, cell (7,1)).
- User drags X1 left across Y1 into the X1 detent. User observes token order change X2,Y2,Y1,X1,X0,Y0 to X2,Y2,X1,Y1,X0,Y0, code change 43 to 39, decoded cell move (7,1) to (5,3). User confirms swap.
- Fictional reviewer Zia adds note "Anchor source remains immutable to PIN-A".
- User restores the Proof branch, reviews (interleave-repair-exact), approves, and exports the address certificate ZIP.
- User diverges state (e.g. undo to Draft), then imports the ZIP, and re-exports the address certificate.
</user_flows>

<edge_cases>
- Canceling a swap, Escape, outside/prethreshold release, same slot, nonadjacent depth crossing, wrong token, locked token, value change, duplicate source, stale command, corrupt import have zero-mutation preview-only semantics.
- Label swap or value flip false repairs show visible blocking diagnostics.
</edge_cases>

<visual_design>
- At 1440×900, bit zipper and spatial proof dominate a deliberate tile-card desk.
- Source lanes, slots, significance, quadrants, curve direction, Draft/preview/Proof, selection, history, stale review, and approval remain legible without color alone.
</visual_design>

<motion>
- Sample real chip lift, gap opening, adjacent displacement, cross, quadrant peel, cell travel, invalid return, and Proof early/late.
- Reduced motion exposes equivalent slots, bits/codes, outlines, interval bars, cells, deltas, and announcements without continuous travel.
</motion>

<responsiveness>
- At 390×844, the selected token becomes a full-height zipper sheet, grid becomes a focused mini-stage, and path/interval/curve/history/artifact evidence becomes swipe-selectable cards with 44×44 targets and no page overflow.
</responsiveness>

<accessibility>
Without pointer input, focus X1, lift, move left across Y1, cancel once, then confirm once; slot/code/cell/path/interval changes announce, dialog traps and returns focus, and durable/artifact state equals the chip gesture.
All interactive elements must have tabIndex={0} or use semantic buttons with Space/Enter activation.
</accessibility>

<performance>
- Acknowledge input within 100 ms, settle its linked state within 500 ms, and export/import that card within 2 seconds without layout shift, or runaway resources.
</performance>

<writing>
- Copy consistently distinguishes source token from slot role, value from provenance, significance from position, code from coordinate, prefix from interval, curve order from geometric adjacency, preview from event, and review from approval.
</writing>

<innovation>
- One provenance-chip swap coherently reconciles address bits, decimal code, decoded cell, nested quadrants, interval arithmetic, curve position, causal replay, tool state, history, and standalone SVG/data proof.
</innovation>

<requirements>
- Must be a React 19 application using Vite, Zustand, Tailwind CSS 4.3.2, and Framer Motion.
- In-memory state only. NO localStorage.
- The exported ZIP artifact must contain exactly nine files: manifest.json, morton-project.json, tokens.csv, prefixes.csv, cells.csv, history.ndjson, morton-proof.svg, address-report.md, and morton-project.schema.json.
The application must be fully npm-local with no external CDN resources loaded at runtime.
</requirements>

<integrity>
- Do not fabricate file downloads or WebMCP behavior.
- Ensure the reference evidence.webm is a genuine recording of the implementation.
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
