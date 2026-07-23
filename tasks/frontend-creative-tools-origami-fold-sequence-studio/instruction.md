<summary>
Build using React, Zustand, Tailwind CSS 4.3.2, and local npm dependencies (no CDNs).
Build the Origami Fold Sequence Studio, a frontend-native application for a fictional paper artist to author a bounded flat-fold instruction sequence. The user draws crease lines, selects affected layers, applies mountain/valley folds, reorders visible layers, adds landmarks and arrows, branches alternative step sequences, detects invalid geometry and ambiguous instructions, rehearses folds, approves a model, and exports exact SVG step diagrams plus a machine-readable fold dossier.

The signature interaction is dragging a crease line and choosing layers while face polygons, vertex landmarks, layer stack, silhouette, later-step validity, branch diff, instruction diagrams, and artifacts recompute together.
</summary>

<core_features>
Feature: Sheet, faces, and landmarks —
- The current state consists of convex polygon faces with stable vertex/edge/face ids, front/back color, layer order, and visibility.
- Users add named landmarks at vertices, edge fractions, or face points.
- Landmarks transform with their face and preserve ancestry; coincident points may share position but not identity.

Feature: Crease and fold editor —
- Users draw a straight crease from two points or select existing landmarks/edges.
- Users choose mountain/valley, fold side, and affected contiguous layer subset.
- The app splits intersected convex faces and reflects chosen geometry across the crease.
- Keyboard coordinates/landmark selectors and mobile sheets equal pointer drawing.

Feature: Layer and validity model —
- Fold preview shows moving faces and resulting stack.
- Commit requires valid nondegenerate faces, no forbidden self-intersection, contiguous selected layers, compatible shared-edge topology, in-bounds precision, and deterministic layer insertion order.
- Invalid preview never mutates canonical state.

Feature: Step timeline and dependent invalidation —
- Each step snapshots input checksum and stores crease/side/layers/type, resulting face map, duration, title, instruction, and annotations.
- Editing an earlier step replays descendants; steps whose referenced landmarks/faces disappear become unresolved and require remap, replace, or branch.
- History is never silently rebased.

Feature: Diagram annotation —
- Authors place fold arrows, unfold arrows, turn-over symbols, mountain/valley lines, target landmarks, zoom callouts, and explanatory text on each before/after diagram.
- Annotations bind canonical geometry ids and use normalized positions.
- Occluded, orphaned, overlapping-label, missing-target, and wrong-fold-symbol findings are exact.

Feature: Branch, compare, and merge —
- Users fork at any step, compare face/vertex/edge geometry, layer order, silhouette, landmarks, annotations, instruction text, and step count.
- Users can merge only compatible future subsequences after matching an equivalent state checksum. Incompatible states cannot merge through manual geometry invention.

Feature: Rehearsal and reduced motion —
- Logical rehearsal animates one fold at a time with scrub, pause, step, reset, and speed.
- It may inject a fixture wrong-side or wrong-layer action; the user diagnoses, rewinds to checkpoint, and chooses the canonical fold.

Feature: Responsive studio and artifacts —
- Export produces canonical JSON, SVG before/after instruction panels and crease pattern, CSV vertex/face/layer/step ledger, and Markdown instructions.
- Import reconstructs state exactly.
</core_features>

<visual_design>
- Desktop shows sheet canvas, face/layer inspector, step timeline, and diagram/validator rail.
- Mobile becomes model mini-map, crease/layer/landmark sheets, vertical step lineage, annotation cards, and rehearsal controls.
</visual_design>

<motion>
- Reduced motion shows before/after overlays, moving-region highlight, crease, and layer-order delta instead of spatial animation.
</motion>

<requirements>
- Do not use external CDNs; all dependencies must be installed via local npm.
- The fictional model starts from a 200x200-mm square with four color-marked corners and aims for a declared 12-step Harbor Bird silhouette.
- The fixture supplies valid landmarks, three starter folds, one wrong layer selection, one self-intersection, one ambiguous diagram, and a valid reference state sequence.
- Geometry uses integer micrometers internally.
- Artifact Schema version is "origami-fold-dossier/v1".
</requirements>

<integrity>
</integrity>
<delivery>
</delivery>
<webmcp_action_contract>
</webmcp_action_contract>
