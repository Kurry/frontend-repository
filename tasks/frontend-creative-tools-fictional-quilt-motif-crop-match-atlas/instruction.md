<summary>
Build a visual-search workbench for an entirely fictional quilt-motif collection. The user moves and resizes a query crop over a bundled synthetic cloth study, watches a motif result grid, similarity scatterplot, transform ribbon, feature cells, overlay loupe, provenance graph, and contact-sheet proof update from one deterministic binary query, accepts an exact transformed candidate, handles a later orientation-metadata correction that makes the accepted match stale, revalidates it without losing the original decision, approves the catalog record, and exports a portable evidence packet.

This is not a moodboard, image gallery, asset browser, reverse-image-search service, pattern generator, generic annotation form, ML dashboard, photo editor, or CRUD catalog. Its signature interaction is manipulating a crop rectangle on the study canvas. During the gesture, the crop's 8x8 logical occupancy query, best transform per candidate, Hamming distance, rank, linked feature cells, and prospective artifact state update as non-committing feed-forward. Commit creates exactly one canonical crop event; pointer handles, keyboard edges, exact numeric entry, compact touch controls, and WebMCP call the same guarded reducer.

The interface uses only bundled, original geometric SVG/raster fixtures assembled from circles, bars, chevrons, diamonds, and empty cells. It makes no claim about real quilts, cultures, makers, provenance, attribution, similarity science, computer vision, collecting, appraisal, conservation, or authenticity.
</summary>

<core_features>
Open the clean North Window Studies fixture and select study study-07, Indigo Window Fragment. Its source is a 96x64 logical binary raster displayed responsively without changing logical coordinates. Drag the crop from seeded inspection rectangle [x=16,y=12,w=32,h=32] to the canonical rectangle [24,16,24,32]. During the drag, see the 8x8 query mask, signed cell changes, candidate ranks, transform badges, scatter points, feature-strip differences, and overlay ghosts update, but do not credit or persist any result.

Release the crop and inspect a confirmation naming the old/new bounds, 21 changed query cells, top-three candidates, and all linked consequences. Cancel once. Crop, selected study/candidate, canvas pan/zoom, result page/filter, scatter brush, loupe transform/opacity, renderer, focus, history anchor, event count, review state, and artifact digest must return exactly. Repeat by dragging the same rectangle and confirm. One event evt-095 records the crop and query mask. Candidate motif-23, Lantern Steps, ranks first at Hamming distance 3/64, score 0.953125, best transform mirror-r90; motif-41 ranks second at 4/64, and motif-12 ranks third at 5/64.

Open motif-23 in the synchronized loupe, sweep through all eight transforms, and return to mirror-r90. Commit it as the proposed match with rationale 'edge rhythm and occupied cells agree', exact source links, and confidence enum supported. The accepted record stores the crop revision, query-mask hash, candidate raster hash, chosen transform, distance, score, mismatch cell IDs, rank-set hash, and actor; it does not invent a probabilistic confidence.

Exercise alternate order on a clean branch: apply catalog filter family:lantern before the crop versus after the crop. Filtering changes visibility only, never rank-set computation, accepted candidate, selection identity, or artifact evidence; both orders converge after clearing the filter. Brush mismatch cells c-11,c-38,c-52 in the feature grid and confirm the same cells highlight in query, candidate, overlay, scatter detail, annotation, and SVG proof.

Advance logical time to reveal correction corr-04: the catalog orientation for motif-23 was entered as mirror-r90 but should be r270, with identical raw 8x8 raster identity and a corrected canonical-orientation transform. The existing acceptance becomes stale; the app must retain its old transform, score, actor, rationale, and revision rather than silently rewriting history. First preview Revalidate under correction, cancel it, and prove zero mutation. Reopen and confirm the deterministic transform composition that re-expresses the accepted query transform as r90 against corrected canonical orientation r270 while preserving the final overlaid rows; append one revalidation event, preserve the original acceptance as a parent, and make the proof fresh.

Add a review note to mismatch c-38, selectively undo only the later filter event while preserving the crop, acceptance, correction, revalidation, and note, approve the match record, export north-window-motif-match.zip, reset to a truly clean session, import the packet, and prove exact semantic round trip. An attractive cropper, sorted card grid, or hard-coded first result is insufficient.
</core_features>

<user_flows>
Complete study select -> crop preview/cancel -> crop commit -> inspect/rank/transform -> accept -> filter-order comparison -> correction cancel/confirm -> mismatch note/selective undo -> review/approve -> exact export/import with no precredited session work.
</user_flows>

<edge_cases>
Test crop x/y 0, exact right/bottom, width/height 7/8/256/257, area 63/64/65536/65537, crossed handle, no-op, stale/double confirm, transform tie, filter-empty/hidden selection, non-best supported accept, correction race/cancel, orphan note, wrong query/rank, corrupt each member, and reset cancel; each preserves valid state and names recovery.
</edge_cases>

<visual_design>
Inspect clean/selected, idle/hover/drag/resize/invalid-return/confirmed, ranked/filtered/hidden-selected/empty, shared/query-only/candidate-only cells, fresh/stale/revalidated, draft/reviewed/approved states; hierarchy and meaning remain clear without color alone.
</visual_design>

<motion>
Sample early/settled canonical crop, invalid snap-back, stable-ID rank reorder, scatter movement, overlay mapping, correction lineage, and approval invalidation; reduced motion exposes identical endpoints, bounds, rank deltas, patterns, focus, and announcements.
</motion>

<responsiveness>
At 1440x900, 768x1024, and 390x844, perform real crop/cancel/confirm, rank/transform/loupe/cell inspection, accept, correction revalidation, review/approval, and export/import through the specified desk/tabs/stage/reel/carousel/stepper with 44 px targets and no overflow.
</responsiveness>

<accessibility>
Without pointer, move/resize to exact logical crop, inspect bounds/query/top ranks, confirm, traverse cards/scatter table/transforms/cells/sources/history, accept/revalidate/approve/export; cell bits, transform, distance, rank, errors, live deltas, and modal focus return are announced.
</accessibility>

<performance>
On 1,000 studies/10,000 motifs/80,000 transforms/100,000 events, manipulate one visible crop, rerank, filter/brush, switch renderer, compare overlay, reveal correction, undo, export/import; meet 100/500/2,000 ms budgets, cancel stale work, retain scroll/selection, and drop no input.
</performance>

<writing>
Trigger every crop/query/transform/decision/correction/annotation/import/reset failure; copy names fictional ID, exact field/range/hash/revision or rule, unchanged-state consequence, and recovery without ML accuracy, cultural, authenticity, attribution, collecting, or conservation claims.
</writing>

<innovation>
One crop mutation coherently drives deterministic visual search, dihedral transform ranking, scatter/overlay/cell evidence, correction provenance, UI/WebMCP parity, and eight-member visual round trip under cancel and alternate order.
</innovation>

<requirements>
Build using Tailwind CSS 4.3.2 and strictly local dependencies without CDNs. The primary canvas renders the selected binary study with logical-cell grid available at inspection zoom, a crop rectangle, eight resize handles, center drag, coordinate rulers, exact bounds readout, query thumbnail, and pan/zoom. SVG and Canvas renderers share one logical geometry model and checksum. Switching renderer, zoom, DPR, theme, or viewport cannot change crop bounds, query rows, hit targets, or artifacts.

During drag/resize, old bounds remain outlined, new bounds and changed-cell count update, and linked results appear as ghosts marked Preview. Leaving bounds, crossing opposite handles, shrinking below 8, expanding above 256/area limit, or releasing outside shows the exact violated rule and returns to the prior rectangle. Escape cancels. Drop opens a focus-trapped confirmation with old/new bounds, query hash preview, changed cells, top-three rank deltas, stale-decision consequences, and commit/cancel.

Keyboard users focus the crop, use arrows to move one logical cell, Shift+arrows to resize the active edge, and Alt+1..4 to choose edge; Enter opens the same confirmation. Exact entry accepts integer x,y,width,height plus base study revision. Mobile uses a full-screen study with four-edge numeric steppers, drag body, pinch-independent zoom controls, and a persistent Preview query sheet. All paths emit the same crop event.

The result grid uses virtualized ranked cards showing stable ID/title/family, rank, distance/64, exact score, best transform, three mismatch thumbnails, catalog revision, and decision state. Pagination/virtualization cannot omit a selected candidate's detail or change the global rank. Loading is deterministic staged rendering, not a network call; an accessible progress summary names rendered and total records.

The transform ribbon previews all eight transformed masks and distances for the selected motif. Hover/focus synchronizes query/candidate cells and overlay; clicking a non-best transform changes loupe inspection only, not the computed best/acceptance, until an explicit acceptance chooses a valid transform. The similarity scatter plots x=occupied-cell delta -64..64, y=Hamming distance 0..64, shape by family, and rank label for selected/top candidates. Brush ranges filter visibility only and disclose hidden selection rather than clearing it.

Filters support family, exact distance range, transform, decision state, and source. Search supports title/stable ID. Filter-before-crop and crop-before-filter yield the same global ranking. Empty results show active constraints, retained selection status, and clear controls. Deleting or hiding no fixture motif is allowed.

The overlay loupe aligns the 8x8 query and selected transformed candidate with query-only, candidate-only, shared-filled, and shared-empty states distinguishable by pattern and text, not color alone. Opacity/split swipe changes view only. Selecting or brushing a cell highlights exact logical source region, query/candidate bits, transform coordinate mapping, scatter/card evidence, annotation targets, and both exported SVGs.

Accept opens a confirmation naming crop/query/catalog revisions, selected transform and whether it is computed-best, distance/score, mismatches, sources, rationale, confidence, and artifact consequences. A non-best transform may be accepted only as tentative with exception rationale; the canonical supported match must use current best. Cancel restores focus and creates no decision. Double activation or stale rank-set confirmation commits at most once and otherwise asks to recalculate.

Decision history preserves proposal, rejection, supersession, correction, and revalidation nodes. Changing crop, candidate raster/catalog revision, transform semantics, sources, or mismatch annotation stales dependent approval/decision visibly. It never rewrites the earlier record.

Advancing the deterministic clock reveals correction cards with field-level before/after, affected decisions, query/rank impact, and source. The canonical orientation correction leaves raw bits fixed but changes canonical transform provenance. The result card, loupe, transform ribbon, graph, history, review, WebMCP state, and artifacts all show stale/fresh boundaries from the same correction ID.

Revalidate under correction opens Base Acceptance, Corrected Catalog, and Revalidated Decision panes. It shows transform composition, raw-mask equality, distance/rank invariance or change, mismatch IDs, sources, and proof hashes. Preview is transient. Cancel restores correction-card opener, filters, brush, loupe, selection, scroll, and history anchor. Confirm appends one child decision and one event; it cannot delete or modify decision-96.

Correction-before-accept versus accept-before-correction/revalidate compare semantically across crop, raw candidate, final canonical transform, distance, mismatches, source, and approval predicate while preserving distinct event lineage. Branch switching changes every linked surface atomically. Selectively undoing the view-filter event preserves the later review note and all domain decisions.

Review enumerates blockers: missing/current crop, stale query/catalog/rank hash, invalid transform, unsupported accepted exception, missing source/rationale, unresolved correction, orphan annotation, mismatch disagreement, renderer checksum difference, artifact mismatch, or unreviewed branch. Each links to the failing surface. Approve is confirmed and hash-bound; any canonical mutation stales it and blocks packet download. Approval cancel creates no event.

After a fresh approval, download north-window-motif-match.zip containing exactly these members in order:
1. motif-project.json - schema fictional-quilt-motif-match-v1, schemaVersion 1, fixture/study/catalog hashes, logical clock, studies/crops/query rows, motifs/transformed-mask checksums, global rankings, filters/pagination/virtualization anchor, selection/brush/renderer/canvas/loupe state, decisions/corrections/revalidations, sources/annotations, revisions/events/branches/checkpoint, review/approval, derived digests, and fresh exportedAt.
2. studies.csv - exact header studyId,title,logicalWidth,logicalHeight,sourceRevisionId,rasterHash,cropId,cropX,cropY,cropWidth,cropHeight,queryHash,queryRows; rows sort study ID.
3. matches.csv - exact header queryHash,rank,motifId,title,family,catalogRevisionId,rasterHash,bestTransform,distance,scoreNumerator,scoreDenominator,scoreDisplay,mismatchCellIds,decisionId,decisionStatus,approvalState; all 96 rows sort global rank then stable ID.
4. annotations.jsonld - valid JSON-LD with @context exactly http://www.w3.org/ns/anno.jsonld, type AnnotationPage, stable annotation/decision/source bodies, and targets using FragmentSelector logical crop coordinates plus custom row-major cell and revision selectors declared in the packet context extension.
5. query-proof.svg - standalone 1200x900 SVG with source study logical grid, canonical crop, 8x8 query, selected transformed candidate, mismatch cells/coordinate connectors, exact bounds/hash/distance/score/transform, correction/revalidation lineage, accessible title/description, and no external CSS/font/image/script.
6. ranked-contact-sheet.svg - standalone 1600x1200 SVG showing all 96 motifs in global rank order with stable IDs, family, rank, best transform, distance, decision status, selected/hidden-filter evidence, rank-set hash, and non-color legend.
7. match-report.md - fictional-data disclaimer; canonical crop; top-three exact results; filter-order convergence; accepted decision/rationale/sources; mismatch review; correction cancel/confirm and lineage; selective undo result; review/approval; and member hashes.
8. manifest.json - schema fictional-quilt-motif-manifest-v1, exact member order, media type, UTF-8 byte length, lowercase SHA-256 for every other member, project/query/rank/renderer/approval digests, and fresh generatedAt.
</requirements>

<integrity>
Every milestone must follow the real action with immediate before/after entity and event counts. Pointer, keyboard, numeric, compact touch, and declared WebMCP mutation paths call one canonical handler. After normalizing permitted transient state and generated timestamps, they yield identical integer crop bounds, 8x8 query bits, stable IDs, transforms, distances, ranks, selection, history, review freshness, and artifact bytes. Drag previews, transform sweeps, hover, brush previews, open dialogs, invalid drafts, and cancelled operations are transient. They do not enter persistence, history, WebMCP canonical state, or artifacts.
</integrity>

<delivery>
The application must run entirely in the browser using the provided WebMcp tooling without backend servers. There are no actual images, network calls, external machine learning models or API services used. Provide one complete solution package exposing the exact required WebMcp action contract on `window`.
</delivery>

<webmcp_action_contract>
# `studies_and_crop`
- `query_studies`, `query_study`, `select_study`, `query_crop`, `preview_crop`, `commit_crop`, `cancel_crop`, `set_canvas_viewport`, `set_renderer`
- commit requires study/base revision, integer bounds, preview hash; returns query rows/hash, changed cells, event/revision IDs, and state digest

# `ranking_and_exploration`
- `query_global_ranking`, `query_match`, `set_match_filters`, `set_result_anchor`, `set_scatter_brush`, `select_candidate`, `select_mismatch_cells`
- filters expose global versus visible counts and never recompute rank; hidden selection remains queryable

# `transforms_and_decisions`
- `query_transforms`, `set_inspection_transform`, `set_loupe`, `preview_decision`, `commit_decision`, `cancel_decision`, `query_sources`, `add_annotation`
- decision guard includes query/rank/catalog hashes and reports before/after counts

# `corrections_and_history`
- `advance_logical_clock`, `query_corrections`, `preview_revalidation`, `commit_revalidation`, `cancel_revalidation`, `query_history`, `undo_event`, `redo_event`, `switch_branch`, `compare_branches`
- preview is transient; commit preserves parent IDs and refuses stale bases

# `review`
- `query_review`, `mark_reviewed`, `approve_match`, `cancel_approval`, `query_approval`
- review returns every exact blocker with linked stable target and current digest

# `artifacts_and_session`
- `query_artifact_manifest`, `export_match_packet`, `import_match_packet`, `query_session`, `reset_session`
- returns filenames/bytes/hashes, staged diagnostics, import mode, before/after state digest, and reset confirmation token
</webmcp_action_contract>
