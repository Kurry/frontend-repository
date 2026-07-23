# Wardrobe Wear-Cycle Atelier

<summary>
Build a hard browser app for a fictional wardrobe tracker, integrating outfit composition, event-sourced wear histories, lifecycle states, batch care queues, branch planning, and deterministic portable artifacts. The application enforces exact logical transitions between planned, actually worn, unavailable, and retired states across seven linked surfaces while maintaining causal motion and strict constraints on care batches, repair actions, and capsule capacity.
</summary>

<reference_screenshots>
</reference_screenshots>

<core_features>
Implement an outfit composition canvas. Allow users to drag garments into required and optional layered slots (base, mid, outer, footwear, accessory, carry) according to occasion templates. Handle duplicate items, order incompatibilities, and pairing conflicts. Garment drags propagate to all seven surfaces in one transition, avoiding stale linked views.
Provide a plan versus actual wear timeline. Users drag outfit instances onto day/time windows. Logging an actual wear creates an immutable snapshot of garment ids and times; partial wears record exact subsets. Actual wears never rewrite or mutate plan revisions or prior actuals. Availability is enforced by lifecycle state, blocking plans for unavailable garments (in care or repair).
Enforce lifecycle and availability states based on append-only events (acquired, worn, aired, wash-start, wash-complete, dry-start, dry-complete, repair-start, repair-complete, lent, returned, lost, retired).
Implement a care-batch planner. Users construct wash/dry batches respecting exact constraints (capacity, color-family, temperature, resource rules). Batch workflow supports pause, partial failure, retry, split, and abandon paths. Care batches account exactly, and contents are immutable once started except via explicit aborts. Care completion immediately restores availability.
Provide a repair tracker that captures append-only condition evidence bound to garment regions on an outline, requires kit resources, and tracks closure. Unresolved condition evidence blocks repair closure.
Build analytical views including a calendar heatmap, utilization scatter, category matrix, and pairing graph. Metrics (wears, cost-per-wear in cents, days-since-wear) share filters and recompute immediately on wear records.
Implement capsule branches and packing constraints. Users branch trip capsules, respecting capacity and category minimums. Branches compare and converge; branching copies constraints, and reconciliation requires explicit choices per conflicting garment, never inventing resolutions. Over-allocation is blocked.
</core_features>

<user_flows>
View inventory, compose outfit, plan wear, log actual wear, undergo care and repair, inspect analytics, branch capsule, export dossier, then reset and import to exact reconstruction.
</user_flows>

<edge_cases>
Test missing or duplicate slots, layer conflicts, overlapping wears, edit after snapshot, wear limit boundaries, invalid lifecycle transitions, care capacity and mix violations, batch partial failure, zero wear cost display, retired future plan handling, and forged imports. Each must trigger explicit, named recovery without corrupted state.
</edge_cases>

<visual_design>
Use an interactive, layered silhouette for outfit planning, and distinct timeline visual indicators for planned versus actual events.
Differentiate distinct garment states visually across the atelier: planned, actually worn, partial subset, available, airing, washing, drying, repairing, lent, lost, retired, conflicted, and in-capsule.
Present care workflows and analytics (matrix, scatter, heatmap) in a unified dashboard using a cohesive aesthetic, maintaining legible hierarchy across varying states.
Display exact bounding values, capacity warnings, and specific error copies naming rejected fields and rules alongside recovery actions in the user interface.
</visual_design>

<motion>
Include causal motion explaining item transitions. Dragging garments to slots, timeline snaps, and care batch flows should visually explain their cause with durations of 150-300ms. Use early/settled frame sampling.
Implement responsive computed hover deltas on garments and matrix cells.
Provide a verifiable reduced motion path toggled via visible chrome UI or a query parameter fresh load. This path must remove non-essential transitions but retain persistent state and delta badges. Do not rely on browser prefers-reduced-motion emulation.
</motion>

<responsiveness>
Complete functionality at 1440, 768, and 375 pixel viewports. The garment, outfit, slot, lifecycle, care, and capsule mobile flows must retain every action, provide minimum 44-pixel targets, and present no horizontal page-level overflow.
</responsiveness>

<accessibility>
Full keyboard accessibility across features. A user can compose and layer, schedule and log wear, navigate lifecycle, build and recover care batches, mark regions via controls, inspect analytics, merge capsule, and export the dossier entirely without pointer actions. Focus management and state must match pointer behavior.
</accessibility>

<performance>
Retain performance with high volume fixtures. Interactions remain responsive and stale analytics cancel when operating with 1,000 garments, 10,000 events, 2,000 outfits, and 100 capsule branches.
</performance>

<writing>
Trigger every outfit, time, lifecycle, care, repair, and capsule conflict. The copy must specifically name the exact garment, slot, event, batch, resource, rule, or plan in conflict, along with the required recovery action.
</writing>

<innovation>
The overall ecosystem remains coherent after actual wear. Record one actual wear, and ensure availability, future plans, care workflow, utilization metrics, cost calculation, capsule capacity, lifecycle history, and portable artifacts remain perfectly coherent across the entire application ecosystem.
</innovation>

<requirements>
Ensure genuine clean state on initialization. Do not pre-seed authored work, completions, or successful artifacts.
Provide a deterministic portable artifact named WardrobeLifecycleDossier implementing schemaVersion wardrobe-lifecycle-dossier/v1. It must capture all state identically, enforcing UTC exportedAt and byte-for-byte re-export semantics. Import processes must be atomic and validating.
Achieve full CRUD substitution parity. Multi-item composition, immutable snapshots, constrained batches, and capsule interactions cannot be simplified to standard forms.
Guarantee that keyboard paths (including traversal, shortcuts, undo) yield identical canonical events, WebMCP state, and export behavior as pointer manipulations.
Guarantee full interaction flow works on responsive viewports (1440px, 768px, 375px) with 44-pixel minimum targets, avoiding horizontal page-level overflow. Use card and sheet transformations for mobile constraints while retaining all capabilities.
Do not use localStorage or sessionStorage for persistent app state; state must reside in memory and be exported/imported manually.
Use generic terms and local npm dependencies without CDNs. Do not include external network requests. Use Tailwind CSS 4.3.2.
</requirements>

<integrity>
</integrity>

<delivery>
</delivery>

<webmcp_action_contract>
</webmcp_action_contract>
