# Task upgrade patterns

Use these transformations as patterns, not copy-ready wording.

## Visual design

Weak:

> Use a modern, clean dashboard with cards and a premium dark theme.

Stronger:

> At desktop width, the live workflow canvas is the dominant two-thirds surface; a compact run rail anchors its right edge and the generated artifact remains visible below the selected node. Typography separates the run title, node labels, timestamps, and monospaced payload values. Pending, running, failed, and completed nodes use a shared shape and icon system in addition to color.

The stronger version gives a judge composition, hierarchy, type roles, and state evidence without requiring a specific framework or aesthetic token.

## Motion

Weak:

> Add smooth animations and hover effects throughout.

Stronger:

> Starting a run moves the selected node from queued to active, traces progress to its outgoing edge, then updates the destination node and run rail in that causal order. Restarting during the sequence cancels stale motion and begins from the new run state. Reduced motion removes edge tracing and travel but updates the same node and rail states without ambiguity.

The stronger version names trigger, sequence, linked surfaces, interruption, settled state, and reduced-motion parity.

## Typography and content

Weak:

> Use bold typography and realistic data.

Stronger:

> A display face is reserved for the itinerary title and day numbers; readable body text carries venue notes; compact labels carry times and transport modes; aligned numerals keep changing costs stable. Seed one long venue name, a multi-line note, a zero-cost item, and mixed currency values so wrapping, density, and alignment are visible.

## Responsive behavior

Weak:

> Make the application responsive on mobile.

Stronger:

> Below the compact breakpoint, keep the square game board above the fold, move clocks to its top and bottom edges, and place history and engine analysis in explicit tabs below it. Primary moves retain large touch targets; keyboard history navigation remains available; no horizontal page scrolling appears.

## Criterion construction

Weak:

> The app has polished visual design.

Stronger positive criterion:

> At the desktop viewport, the workflow canvas remains the dominant surface, the run rail is visually secondary but readable, and the selected node, its outgoing edge, and the matching run event form one visible hierarchy through placement, contrast, and type roles.

Stronger negative criterion with `negate = true`:

> At the compact viewport, the primary artifact is clipped or pushed entirely below secondary controls, or the page requires horizontal scrolling to reach its main action.

## Coverage matrix

For each added instruction promise, record:

| Promise | Tag | Browser setup | Visible evidence | Criterion ID |
|---|---|---|---|---|
| Composition relationship | visual_design | viewport + seeded state | relative prominence and placement | new visual ID |
| Causal transition | motion | real initiating control | ordered intermediate and settled states | new motion ID |
| Compact recomposition | responsiveness | compact viewport | moved/collapsed controls and preserved artifact | new responsive ID |
| Reduced-motion alternative | accessibility or motion per task wording | emulated preference + real control | same outcome without prohibited travel/loop | new aligned ID |
| Advanced visual fallback | performance/edge case per wording | force bounded failure if available | useful fallback and retry | new aligned ID |

Do not duplicate one promise across dimensions merely to raise criterion count.
