# Task proposal: Household Material-Flow Auditor

**Proposed slug:** `frontend-data-tracking-household-material-flow-auditor`
**Archetype:** `data tracking` and `planning`
**Genre:** `hard browser app/mass-conserving waste tracker`
**Source basis:** framework-agnostic synthesis of adaptive grids, network graphs, prediction, task timeline, branch comparison, evaluator review, and scheduling primitives
**Target user:** A fictional household classifying measured discard items and testing bounded reduction plans

## Whole job

The user logs weighed discard items, classifies material and destination under fixture rules, groups items into bags/bins, reconciles scale readings, identifies contamination, schedules pickups, compares material-flow weeks, creates reduction experiments, records actual outcomes, and exports exact mass, route, and calendar artifacts.

This is not a sustainability dashboard. The signature interaction is dragging item cards through a material-to-destination flow graph while bag/bin weights, contamination rules, capacity, pickup readiness, weekly comparisons, experiment baselines, and artifacts update together.

## Frontier-loss hypothesis

The task targets healthy frontier weaknesses in quantity conservation, categorical rule intersections, container hierarchy, temporal pickup state, experiment provenance, linked filtering, mobile transformation, UI/tool parity, and exact artifacts. Both healthy model medians below `0.35` is a prospective controlled-pilot target.

## Deterministic fixture

The fictional four-week household fixture has 96 discard items, integer gram weights, 18 material types, six destinations, 14 classification rules, 12 bags, four bins with capacities, fixed pickup calendar, two duplicate scans, one scale correction, five contamination conflicts, and three deterministic reduction interventions. Rules are benchmark data, not real disposal guidance.

## Feature groups

### Item capture and classification

Items store id, observed date, weight grams, material, submaterial, cleanliness, size, source room, note, and evidence placeholder. Users drag items to destination nodes or use keyboard/mobile selectors. Rules may require clean/dry, disassembly, size cutoff, or special destination. Invalid classification remains proposed with exact blocker.

### Disassembly and component graph

Composite items split into components whose integer gram weights plus declared residue equal parent grams. Components classify independently and preserve parent lineage. Merge is allowed only to undo an unbagged split with exact weight/content match. Cycles, duplicate component ids, and mass imbalance reject.

### Bag and bin hierarchy

Accepted items/components drag into bags, then bags into compatible bins. Tare and gross readings reconcile net contents; direct bin items are allowed where declared. Bag/bin capacity, destination compatibility, contamination, pickup date, and sealed/collected state are exact. Collected contents become immutable history.

### Material-flow graph and contamination lens

A Sankey-style graph connects source room → material → processing action → destination → pickup. Edge widths derive integer grams. Selecting an edge highlights exact item/component/container rows. Contamination findings identify contaminant, host bag/bin, rule, grams, and repair: reclassify, clean fixture state, disassemble, or remove.

### Scale and event reconciliation

Raw scale events include timestamp, container, gross grams, source, and correction/reversal. Users match readings to bag/bin snapshots, resolve duplicate scans, and explain residual differences within exact tolerance. Corrections append; original events never mutate. Closing a container requires reconciled contents/readings.

### Pickup and exception workflow

Bins move open → ready → staged → collected → rejected/accepted → emptied. Logical clock controls due pickups. Fixture events include a missed pickup and contamination rejection. Users unstage, repair contents, reschedule, split destination, or accept a typed exception while preserving events and collected history.

### Reduction experiments

Users choose a material/source slice, define baseline weeks, target grams/percentage, intervention fixture, active dates, and comparison method. The plan previews affected items but never deletes them. Actual post-period data computes exact eligible grams/counts and labels insufficient, no-clear-change, possible-reduction, or increase under declared thresholds without causal claims.

### Responsive audit and artifacts

Desktop shows item/container ledger, material-flow graph, weekly matrix, and pickup/experiment rail. Mobile becomes item/bag/bin cards, classification/disassembly sheets, vertical flow/pickup lineage, weight reconciliation, and experiment drilldowns. Export produces canonical JSON, CSV item/component/container/event ledger, SVG flow/weekly report, and ICS pickup/experiment schedule; import reconstructs state exactly.

## Artifact contract

`HouseholdMaterialAudit` uses `schemaVersion: "household-material-audit/v1"` and stores fixture/hash/timezone/logical clock, items/material properties/classifications/rule decisions, component graph/residue, bags/bins/tare/capacity/content/seal/collection, scale events/matches/corrections/residuals, flow graph/contamination findings, pickup state/events/exceptions, experiment definitions/baseline/post sets/findings/reviews, filters/annotations/history, derived mass/capacity/flow/weekly/experiment/artifact checksums, CSV, SVG, ICS, and UTC `exportedAt`.

- All mass is integer grams; parent equals components plus residue; item/component appears in at most one live container and one destination.
- Container net/gross/tare/content/residual and capacities reconcile under declared tolerance; collected contents immutable.
- Classification/contamination follows exact fixture rule predicates and current item/component state.
- Scale/pickup/correction events are append-only and follow state machines; duplicate/reversal resolution preserves originals.
- Flow edge sums equal canonical eligible grams at every layer; filters expose included/excluded mass.
- Experiment sets/dates/denominators/thresholds are exact and never rewrite observations.
- CSV rows, SVG edge widths/counts/week bars, and ICS UIDs/dates/status agree with canonical state.
- Import rejects fixture/timezone mismatch, mass imbalance, graph/container cycle, duplicate containment, invalid classification/capacity, impossible event, forged experiment/derived/checksum, unsafe SVG, or artifact disagreement atomically.
- Canonical re-export changes only `exportedAt`; CSV, SVG, and ICS remain byte-identical.

## Frontend-native gate

**20-second demo:** Classify a composite item incorrectly, split it into balanced components, place them into different bags, trigger contamination and repair it, match a duplicate scale event, stage a bin, simulate missed pickup/rejection, reschedule after repair, create a reduction experiment, and export.

- **Canonical mutation:** Moving/splitting one item changes mass hierarchy, classification/contamination, bag/bin readings/capacity, flow edges, pickup readiness, weekly/experiment sets, history, WebMCP state, and artifacts.
- **Alternate input:** Classification, split/merge, bag/bin binding, scale matching, flow navigation, pickup/recovery, experiment composition, and export have keyboard paths.
- **Linked views:** Item/component ledger, bag/bin hierarchy, scale reconciliation, material-flow graph, contamination lens, weekly matrix, pickup workflow, experiments, and artifacts share one reducer.
- **Causal motion:** Item/component/container flow, edge-width changes, capacity/contamination propagation, pickup transition, and experiment comparison explain cause; reduced motion retains gram/status deltas.
- **Mobile transformation:** Item/bag/bin cards, classification/disassembly sheets, vertical flow/pickup lineage, reconciliation and experiment drilldowns preserve the full job.
- **CRUD substitution:** Forms cannot express mass-conserving disassembly, nested container reconciliation, flow-edge provenance, contamination propagation, or append-only pickup/experiment state.

## Acceptance contract

| ID | Dimension | Action → required browser evidence |
|---|---|---|
| AC-01 | core_features | Log/classify/split, contain/reconcile, inspect flow/contamination, pickup/recover, experiment/review, and export → every gram/file agrees. |
| AC-02 | visual_design | Inspect raw/proposed/accepted/invalid, parent/component/residue, open/sealed/staged/collected/rejected, contaminated/repaired, baseline/post states → hierarchy stays legible. |
| AC-03 | motion | Classify/split, move into containers, resize flow, repair contamination, transition pickup, compare experiment, then repeat reduced → causal endpoints/grams agree. |
| AC-04 | technical | Interleave UI/WebMCP item/classification, component, container, scale, pickup, experiment, history, and transfer actions → ids, grams, events, checksums, files match. |
| AC-05 | user_flows | Capture → classify/disassemble → bag/bin → reconcile → stage/collect/recover → compare/experiment → export → reset/import. |
| AC-06 | edge_cases | Test zero/max grams, component/residue remainder, split/contain cycle, bag/bin capacity exact bound, incompatible destination, contamination after seal, duplicate/corrected scale, missed/rejected pickup, empty experiment denominator, stale review, forged import → named recovery. |
| AC-07 | responsiveness | Complete at 1440/768/375 → item/classification/disassembly/container/scale/pickup/experiment mobile flows retain every action, 44-pixel targets, no overflow. |
| AC-08 | accessibility | Classify/split/bind items, navigate flow, match scales, stage/recover pickup, compose/review experiment, and export without pointer → focus/state match. |
| AC-09 | performance | Operate 100,000 items/components, 10,000 containers/events, and 1,000 experiments → interactions remain responsive and stale flow/analysis work cancels. |
| AC-10 | writing | Trigger every rule/mass/container/scale/pickup/experiment conflict → copy names exact item/component/bag/bin/rule/gram/event/set and recovery. |
| AC-11 | innovation | Split/reclassify one item → mass conservation, contamination, container reconciliation, flow topology, pickup, experiment evidence, and artifacts remain coherent. |
| AC-12 | design_fidelity | Verify integer mass/components/residue, containment/tare, rules/events, flow sums, experiment sets, CSV/SVG/ICS → material-audit semantics are exact. |
| AC-13 | behavioral | Interleave split/merge, container moves, scale correction, pickup failure/repair, experiment review, undo uncollected-only, export/import → mass, events, lineage, and files round-trip exactly. |
