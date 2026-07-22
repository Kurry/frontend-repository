<summary>
Fictional Conjugate-Spectrum Real-Signal Repair Proof Studio
Archetype: Creative tools
Genre: Hard browser complex-spectrum repair and inverse-transform proof editor
Target user: A fictional signal-card conservator repairing one four-bin spectrum so its inverse samples are exactly real.
</summary>

<core_features>
- Conjugate-pair phasor plane and canonical endpoint repair: Render four origin-anchored phasors, quarter-unit grid, real/imaginary axes, stable bin labels, lock marks, k=1↔k=3 mirror arc, conjugate target ghost, residual arrow, and a horizontal repair rail for BIN-K3. Grab the k=3 endpoint. Continuous preview shows raw and quantized coordinates, old/new complex value, target, residual, changed sample contributions, exact inverse samples, realness, energy, proof freshness, history delta, and artifact effects.
- At target (2,−2), confirmation names the operation, one changed field, three immutable bins, four inverse deltas, Draft/Proof samples, symmetry predicates, energies, and packet delta. Cancel restores exact Draft phasors, samples, selection, focus, pan/zoom, label mode, expanded contribution, comparison, replay frame, history anchor, and event count. Outside, prethreshold, vertical-only, locked-target, same-sign, off-grid, stale, duplicate, or already-Proof releases return or retain valid state without an event.
- Exact, keyboard, and compact alternate input: Keyboard users focus BIN-K3, press E for endpoint edit, move by 0.25 with Left/Right or 1.0 with Shift+Left/Right, inspect the target announcement, then cancel or confirm. Exact UI command is binId=BIN-K3; real=2; imaginary=−2; policy=move-unlocked-partner. On compact touch, tapping BIN-K3 opens a full-height repair sheet with a horizontal quarter-step scrubber, pair values, residual, four contribution deltas, exact samples, cancel, and confirm instead of requiring two-dimensional drag.
- Linked coefficient, contribution, inverse, and invariant views: Synchronize the phasor plane, signed magnitude/phase stem strip, k=1/k=3 mirror lens, four-column contribution fan, inverse sample strip, real-versus-imaginary rails, transform matrix inspector, symmetry ledger, Parseval ledger, Draft/Proof comparison, history, CSV previews, and standalone SVG preview. Selecting a bin, phasor, mirror arc, contribution, sample, matrix cell, residual term, energy term, replay frame, event, CSV row, or SVG entity highlights the same stable IDs everywhere.
- Each sample column visually adds its four coefficient contributions head-to-tail. As BIN-K3.real moves by delta d, the k=3 contribution changes by [d/4, −di/4, −d/4, +di/4]. The sample strip exposes signed imaginary stems; it never hides them behind magnitude-only marks. Fractions and Gaussian-rational pairs are primary labels, while decimals are read-only equivalents.
- Annotation, author-aware history, review, and approval: Pin immutable Draft and authored Proof checkpoints. After fictional conservator Moe confirms the repair, fictional reviewer Zia adds note "Locked reference establishes the conjugate target" to BIN-K1. Selective undo of Moe's repair restores Draft while retaining Zia's note on stable BIN-K1 and staling review; branch restore recovers Proof without duplicating bins, samples, or the note.
- Approval requires immutable fixture hash, exactly one changed field, BIN-K3=2−2i, unchanged BIN-K0/BIN-K1/BIN-K2, residual zero, exact per-sample deltas, Proof samples [2,0,0,2], zero imaginary energy, spectrum/time energy 8, exact forward return, one confirmed comparison, one conjugate-repair-exact review, zero blocking diagnostics, and artifact preflight success. Any coefficient, lock, sample, contribution, convention, note-target, or artifact change stales affected review and approval.
</core_features>

<user_flows>
- Open unresolved fictional card Quartz Quartet at Draft spectrum [4+0i, 2+2i, 0+0i, 1−2i].
- Inspect four stable phasor endpoints, the k=1/k=3 mirror link, real-axis locks at k=0 and k=2, magnitude/phase stems, a four-sample inverse strip, per-bin contribution polygons, symmetry residual, Parseval ledger, history, review, and artifact preview.
- Grab the unlocked k=3 endpoint and drag it horizontally from (1,−2) to the conjugate target (2,−2). Watch its mirror residual collapse from −1+0i to zero while inverse samples change from [7/4, i/4, 1/4, 2−i/4] to [2,0,0,2], imaginary stems cancel, and both energy ledgers settle at 8. Cancel once, then confirm after independent clean resets through pointer and exact input.
- Add a note to the locked k=1 partner, selectively undo and restore the repair, review, approve, export, diverge, import, and re-export the proof packet.
</user_flows>

<edge_cases>
- Unknown bin, locked field, real below −4 or above 4, imaginary not −2, off-step quarter, nonfinite value, same-sign target, split-pair policy, stale hash, duplicate call, and already-Proof request are diagnostic or preview-only with changed:false and no event.
- Cancel, Escape, outside/prethreshold release, vertical-only wrong coordinate, same-sign mirror, nonfinite/off-grid value, locked-bin edit, stale command, duplicate confirmation, corrupt import, and invalid selective undo each have explicit zero-mutation, preview-only, or branch semantics. Reloading to recover is not acceptable.
</edge_cases>

<visual_design>
- At 1440×900, complex plane and inverse proof dominate a deliberate signal-card desk; bins, locks, pairs, real/imaginary signs, Draft/preview/Proof, selection, replay, history, stale review, and approval remain legible without color alone.
- Fractions and Gaussian-rational pairs are primary labels.
- Clean Draft, selected, lifted, constrained, same-sign-invalid, target-preview, residual-changing, contribution-changing, cancel-returned, Proof, selectively-undone, restored, reviewed, and approved states preserve the complex-to-time-domain thesis.
</visual_design>

<motion>
- Transform replay, cancellation, and exact proof: Replay stages are endpoint-lifted, horizontal-constraint-engaged, conjugate-target-revealed, residual-shortening, n0-real-added, n1-imaginary-cancelled, n2-real-subtracted, n3-imaginary-cancelled, endpoint-committed, forward-check-returned, and proof-settled.
- Normal motion moves the phasor along its rail, shortens the residual arrow, rotates/translates the four k=3 contribution arrows according to sample phase, and lets opposing imaginary stems cancel in place.
- Reduced motion removes continuous travel but preserves old/new endpoint ghosts, four signed delta vectors, before/after sample stems, residual equation, energy totals, exact announcements, and the settled proof. Scrubbing is inspection-only.
</motion>

<responsiveness>
- At 390×844 the selected bin becomes a full-height horizontal repair sheet, the plane becomes a focused mini-stage, and contribution/sample/invariant/history/artifact evidence becomes swipe-selectable cards with 44×44 targets and no page overflow.
</responsiveness>

<accessibility>
- Without pointer input, focus BIN-K3, edit its real quarter value, cancel once, then confirm once; target/residual/sample/energy changes announce, dialog traps and returns focus, and durable/artifact state equals the phasor gesture.
- Keyboard users focus BIN-K3, press E for endpoint edit, move by 0.25 with Left/Right or 1.0 with Shift+Left/Right.
</accessibility>

<performance>
- In a deterministic stress browser containing 1,024 independent four-bin cards, 4,096 bins, 4,096 samples, 500 history events, and 100 replay frames, edit one selected card; acknowledge endpoint input within 100 ms, settle its exact linked state within 500 ms, brush 256 visible contributions, and export/import that card within 2 seconds without recomputing unrelated cards, stale work, dropped input, layout shift, or runaway resources.
</performance>

<writing>
- Copy consistently distinguishes bin from sample, real from imaginary, partner from target, conjugate from same-sign mirror, inverse contribution from sample sum, transform consistency from realness, preview from event, and review from approval; diagnostics name ID/value/rule/recovery.
- All signals, names, units, authors, and conclusions are fictional. No health, sound-quality, communications, engineering, measurement, scientific, or production advice is allowed.
</writing>

<innovation>
- One phasor-endpoint move coherently reconciles conjugate geometry, four quarter-turn contributions, exact rational samples, realness, independent Parseval/forward checks, causal replay, tool state, and standalone SVG/data proof.
</innovation>

<requirements>
- Stack: React 19, Vite, Zustand, Tailwind CSS 4.3.2.
- All libraries installed via npm and bundled locally; no CDN imports of any library, font, or icon set.
- Project Quartz Quartet has N=4 and four stable bins: BIN-K0 (real and imaginary locked), BIN-K1 (real and imaginary locked), BIN-K2 (real and imaginary locked), BIN-K3 (imaginary only locked, unlocked repair partner).
- Draft spectrum: [4+0i, 2+2i, 0+0i, 1−2i].
- Magnitude-squared and phase labels are exact fixture values: BIN-K0 is 16 at 0, BIN-K1 is 8 at +π/4, BIN-K2 is 0 with phase label undefined-zero, Draft BIN-K3 is 5 at −atan(2), and Proof BIN-K3 is 8 at −π/4.
- The complex-plane domain is real and imaginary coordinates from −4 to 4 inclusive in quarter-unit steps. Pointer preview is continuous but a valid release quantizes to 0.25; canonical values serialize as signed integer quarters. The k=3 phasor may move only horizontally because its imaginary component is locked at −2. The target ghost is conjugate(BIN-K1)=2−2i. The pair residual is defined as X[3]−conjugate(X[1]); Draft residual is −1+0i and residual norm is 1. The required delta is +1+0i.
- Using the declared inverse convention, each bin contributes X[k] exp(+i2πkn/4)/4 to sample n.
- Draft inverse samples: SAMPLE-N0 (7/4+0i), SAMPLE-N1 (0+1/4i), SAMPLE-N2 (1/4+0i), SAMPLE-N3 (2−1/4i). Draft maximum imaginary magnitude is 1/4 and total imaginary energy is 1/8. Draft spectrum energy is 29/4. Draft time energy is 29/4.
- Canonical operation MOVE-BIN-K3-REAL-ONE-TO-TWO changes BIN-K3 from 1−2i to 2−2i. Its per-sample inverse delta is [+1/4, −1/4i, −1/4, +1/4i]. These deltas yield Proof samples [2+0i, 0+0i, 0+0i, 2+0i]. Pair residual becomes 0+0i. Proof spectrum energy is 8 and Proof time energy is 8.
- The UI must not conflate transform consistency with the real-signal invariant.
- The ZIP contains exactly nine files:
  1. manifest.json — schema fictional-fourier-proof-manifest/1.0, fixture ID/revision, UTC generatedAt, ordered entries, UTF-8 byte lengths, lowercase SHA-256 hashes, project checksum, and approval ID.
  2. fourier-project.json — transform convention/version, N, coordinate/quarter rules, Draft/Proof bin records, locks/pairs, phasor coordinates, exact magnitude/phase labels, per-bin/per-sample contributions, inverse and forward results, symmetry/realness/energy facts, operation/replay, notes, checkpoints, comparison, branches, history, review/approval, selection/view state, checksums, and generatedAt.
  3. bins.csv — exact header revisionId,binId,k,realNumerator,imagNumerator,denominator,magnitudeSquared,phaseLabel,partnerBinId,lockedReal,lockedImaginary,residualReal,residualImaginary,selected; rows sort Draft then Proof and k ascending.
  4. samples.csv — exact header revisionId,sampleId,n,realNumerator,imagNumerator,denominator,imaginaryMagnitudeSquared,isReal,forwardCheckReal,forwardCheckImaginary,selected; rows sort Draft then Proof and n ascending.
  5. transform-steps.csv — exact header frameIndex,stage,binK3Real,binK3Imaginary,residualReal,residualImaginary,n0Delta,n1Delta,n2Delta,n3Delta,maxImaginaryMagnitude,spectrumEnergy,timeEnergy,stateHash; eleven rows for the named replay stages.
  6. history.ndjson — one compact object per authored event with stable ID, logical tick, actor, operation, bin/field IDs, exact before/after quarter values and hashes, parent, and branch; sorted logical tick then ID.
  7. fourier-proof.svg — standalone 1200x900 SVG with stable project/bin/sample/contribution/pair/frame IDs, Draft/Proof phasor planes, mirror/residual geometry, contribution fans, inverse stems, exact equations, energy ledger, replay, comparison, review/approval, title, and description; no script or external resource.
  8. symmetry-report.md — fictional-data notice, fixture hash, DFT convention, Draft/Proof bins, pair and self-pair checks, every inverse contribution/sum, realness proof, Parseval proof, forward round trip, canonical event, rejected same-sign/projection strategies, comparison, review, and approval checklist.
  9. fourier-project.schema.json — JSON Schema 2020-12 for fourier-project.json
- Use one canonical reducer for pointer, keyboard, compact touch, exact UI, WebMCP, replay, import, export, comparison, and validation.
- All signals, names, units, authors, and conclusions are fictional. No health, sound-quality, communications, engineering, measurement, scientific, or production advice is allowed.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
- No HTTP requests outside localhost are allowed.
- Do not use localStorage, sessionStorage, IndexedDB, or other browser storage APIs.
</integrity>

<delivery>
- Produce an original self-contained app in `/app`; scaffold under `/app` as needed for the stack in `<summary>`; `/app/package.json` MUST define npm scripts named exactly `start` (serves the app on port 3000) and `verify:build` (exits 0 when the app entry/build is present and succeeds); run via `npm start` on port 3000; do not iframe, proxy, or fetch the product from another origin.
- Before you finish, run `npm run verify:build` and confirm it exits 0, then run `npm start` and confirm the app serves on port 3000.
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
- Editor object types: bin; sample; mirror-arc; contribution; matrix-cell; residual-term; energy-term; replay-frame; event; csv-row; svg-entity
- Editor properties: real; imaginary
- Editor modes: normal; compact; exact; comparison
- Editor operations: select; update_property; preview
- Entity: note; review; approval
- Entity operations: create; select; update; delete; toggle
- Entity fields: targetId; actor; verdict; text; stateHash
- Artifact operations: export; import; copy
- Export formats: fourier-proof-zip
- Import modes: fourier-proof-zip

Mechanics exclusions:
- Drag-paint / phasor continuous drag stays Playwright (gesture mechanics)
- File paths/blobs forbidden in WebMCP args
- ZIP blob extraction/assembly stay Playwright-observed

Implementation:
- Register browser WebMCP tools for every permitted operation in the selected module specs, bound to the product values in Bindings.
- Tool handlers must call the same application logic as the visible UI.
- Do not invent extra modules, destinations, or operations beyond this block.
</webmcp_action_contract>
