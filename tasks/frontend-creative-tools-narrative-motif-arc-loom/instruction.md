<summary>
Build a Narrative Motif Arc Loom tool where a learner selects exact spans in twelve synthetic micro-poems, assigns them to a bounded motif taxonomy, splits or merges motif concepts, orders motif stages across four fictional collections, and watches a linked Sankey, narrative arc, sentiment/complexity radar, recurrence matrix, and text evidence rail update.
The useful artifact is a portable motif atlas with exact citations, topology, transformations, counterexamples, annotations, and deterministic analysis checksums. The app produces the operator's session artifact: a downloadable and copyable Session JSON document (plus a Markdown citation appendix) conforming to API-shaped field contracts, with Import that round-trips that JSON. Use React 18, Tailwind CSS 4.3.2, and Vite without any CDNs (npm-local).
</summary>

<core_features>
Feature: Deterministic fixture —
- The fixture contains twelve original synthetic texts grouped into four ordered collections (e.g., Collection 1: text 1-3, Collection 2: text 4-6, etc.), 96 lines, 720 words total, eight seed motifs, 20 precomputed sentiment/complexity features per text, and 18 suggested-but-uncommitted evidence spans.
- It includes one repeated phrase with different meaning, two nested candidate spans, a motif that disappears and returns, and two counterexamples.

Feature: Exact-span evidence reader —
- The learner selects contiguous text within one line or adjacent lines to create an evidence card using UTF-16 offsets and exact text.
- Keyboard users set start/end anchors; mobile uses word-handle steppers.
- Whitespace-only, cross-document, or overlapping same-motif spans reject.
- Nested spans are permitted only for different motifs and render independently.
- Selecting a card synchronizes reader, collection rail, Sankey, matrix, and radar.

Feature: Motif taxonomy workbench —
- Eight seed motif cards may be renamed, recolored from an accessible fixed palette, reordered, merged, or split.
- Merge previews combined evidence and edges; split requires distributing every existing span between two named children before commit.
- A motif cannot be deleted while it owns evidence.
- Counterexample cards attach to a motif but contribute a negative confidence weight, never ordinary recurrence.

Feature: Collection-stage loom —
- Each motif has zero or one stage node per collection. Dragging nodes vertically sets narrative order; horizontal collection position is fixed.
- The learner links a motif across adjacent collections with relations continues|reverses|echoes|resolves.
- A nonadjacent relation requires an explicit gap bridge; cycles inside one collection and duplicate relation pairs reject.
- Keyboard/mobile source-target linkers are equivalent.

Feature: Sankey and narrative arc —
- The Sankey derives edge width from evidence count and relation confidence.
- A parallel arc view plots each motif's deterministic sentiment/complexity centroid by collection, with gaps where absent.
- Hover/focus highlights exact flows, nodes, evidence spans, radar axes, and recurrence cells.
- Reordering stages changes vertical routing but not semantics; reclassifying evidence changes weights and centroids.

Feature: Recurrence matrix and feature radar —
- A motif × text matrix displays direct evidence, counterexample, and absence.
- Brushing a matrix rectangle filters the evidence rail and summarizes counts without changing topology.
- The radar compares up to two selected motif-collection nodes on eight named deterministic features. Missing features show insufficient, never zero.
- Selecting an axis focuses the contributing text spans and formula explanation.

Feature: Arc conflict and transformation lens —
- The app detects relation without evidence, unresolved split membership, duplicate exact citation, counterexample-only node, inaccessible motif-color pair, gap without bridge, or absent final resolution for a motif marked must-resolve. Conflicts focus every affected surface.
- A transformation ledger records merge, split, rename, reorder, link, unlink, classify, and reversal events with undo/redo.

Feature: Atlas comparison and export —
- Two named atlas snapshots compare taxonomy, span membership, relation topology, Sankey weights, centroids, and conflicts. Annotations attach to motifs, relations, exact spans, collections, or feature axes.
- Export/import preserves exact authored state, graph layout/order, matrix brush, selection, comparison, viewport, history, and derived checksums; a Markdown citation appendix is generated alongside JSON.
- NarrativeMotifAtlas uses schemaVersion: "narrative-motif-atlas/v1" and stores corpus id/hash, ordered motif taxonomy, exact span cards with document/line/UTF-16 offsets/text/relation, stage nodes/order, cross-collection relations/gap bridges, counterexamples, accessibility color ids, two optional snapshots, annotations, brush/view state, ordered history, generated Markdown, derived membership/edge/centroid checksums, and UTC exportedAt.
</core_features>

<visual_design>
- Inspect nested, selected, flowing, reversing, absent, conflicted, compared, and certified states — text/topology hierarchy remains legible.
- Colors use the fixture palette and meet declared adjacent-flow contrast.
- Visual hierarchy clearly separates the reader, loom/Sankey, matrix/radar, and export controls on desktop.
</visual_design>

<motion>
- Evidence travels to nodes, flows reroute, and centroids morph.
- Reduced motion uses instant endpoints with persistent membership/weight deltas.
</motion>

<requirements>
- Select spans, navigate/reorder/link motifs, distribute split, brush matrix, inspect flows/radar, compare, and export without pointer — focus/state match.
- Complete at 1440/768/375 — mobile collection/lineage flow retains every action without clipped text or page overflow.
- Reclassify spans and reroute 8 motifs across 12 texts/4 collections — responsive updates, stale layout calculations cancelled.
- Interleave UI/WebMCP span, taxonomy, stage, relation, counterexample, snapshot, annotation, and transfer operations — all views/checksums agree.
- All packages must be npm-local (no CDNs).
</requirements>

<webmcp_action_contract>
{
  "name": "Narrative Motif Arc Loom",
  "version": "1.0.0",
  "tools": [
    {
      "name": "classifySpan",
      "description": "Classify a span to a motif",
      "parameters": {
        "spanId": { "type": "string" },
        "motifId": { "type": "string" },
        "isCounterexample": { "type": "boolean" }
      }
    },
    {
      "name": "addRelation",
      "description": "Add a relation between stages"
    },
    {
      "name": "moveStage",
      "description": "Move a motif stage node vertically"
    }
  ]
}
</webmcp_action_contract>
