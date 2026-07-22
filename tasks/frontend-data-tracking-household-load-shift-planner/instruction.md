<summary>
Build a Household Load-Shift Planner, a time-of-use energy planning application that allows a user to reconcile meter data and shift flexible appliance cycles within declared constraints. The application must operate entirely in-memory with no local storage or backend. The user imports a deterministic meter fixture, resolves interval anomalies, maps appliance cycles onto a 15-minute time-of-use grid, honors constraints, compares branches, executes the schedule against injected deviations, and approves a plan to export exact JSON, CSV, SVG, and ICS artifacts.
The app must be built with React, Vite, Tailwind CSS 4.3.2.
</summary>

<core_features>
Feature: Meter interval reconciliation —
- The application processes a deterministic meter fixture of 192 fifteen-minute intervals (48-hour period) containing raw cumulative readings.
- The fixture must include exactly one gap, one duplicate timestamp, one reset, and one corrected reading.
- Users can resolve these anomalies by selecting deterministic candidates or entering bounded values.
- A waterfall visualization shows raw-to-normalized changes; accepted resolutions append provenance and preserve original rows.
- Reconciled output converts cumulative readings into signed integer watt-minute interval deltas.

Feature: Appliance-cycle model —
- Appliances contain ordered phases with duration slots, watt profile, interruptibility, earliest/latest start, quiet/away eligibility, circuit, and dependency.
- A cycle moves as a unit or, if declared interruptible, splits only at phase boundaries with a maximum gap.
- Editing a fixture appliance creates a plan-local version.

Feature: Load scheduling grid —
- Flexible load cycle blocks can be dragged horizontally on 15-minute slots and vertically among appliance lanes.
- Provide full keyboard move support and mobile start/date sheets that equal pointer gestures.
- Invalid placement (due to window, dependency, quiet/away, circuit, phase gap, or fixed cycle constraints) remains preview-only and displays exact blockers.

Feature: Aggregate, residual, and peak views —
- A stacked load chart sums appliance watt-minutes per interval.
- A background/unmapped residual is calculated as normalized meter minus mapped actual fixtures (can be negative only under a declared export interval).
- Planned schedule is separate from historic actual mapping.
- Circuit and household peak thresholds highlight exact contributing phases.

Feature: Tariff and impact calculator —
- Energy cost calculation uses interval watt-minutes × tariff microcents/kWh conversion plus a fixed daily peak charge under declared rounding.
- Carbon impact is calculated via fixture intensity multiplication and labeled informational.
- Selecting any bar/charge highlights the corresponding intervals/cycles.
- A cost waterfall separates baseline, shifted energy delta, peak delta, and corrections.

Feature: Plan branches and suggestions —
- Users can fork schedules to compare starts/phases, constraint slack, aggregate/peak, cost/carbon, and household conflicts.
- Users can merge cycle-level or phase-level differences.
- The app offers deterministic suggestions (e.g., move one flexible cycle or resolve a peak) whose acceptance creates a revision without changing actual meter history.

Feature: Execution and deviation recovery —
- A logical clock execution marks cycles queued, active, paused-if-allowed, complete, missed, or deviated.
- The fixture includes specific events: one late start, one midcycle interruption, and one actual phase consuming 10% more energy.
- Users can accept actuals, reschedule remaining portions, branch recovery, or mark missed. Actual events are append-only.

Feature: Responsive planner and artifacts —
- The desktop layout features a meter ledger, load grid, aggregate/cost charts, and a branch/execution rail.
- The mobile layout transforms into interval/cycle cards, start/phase sheets, vertical dependency/execution lineage, peak/cost drilldowns, and a reconciliation stepper.
- Export produces a canonical JSON (HouseholdLoadPlan schema), a CSV raw/normalized/planned/actual interval ledger, an SVG load/tariff/cost report, and an ICS appliance schedule.
- Import reconstructs state exactly; it rejects invalid configurations or forged checksums/artifacts atomically.
- Canonical re-export changes only exportedAt; CSV, SVG, and ICS remain byte-identical.
</core_features>

<requirements>
- The HouseholdLoadPlan schema uses schemaVersion: "household-load-plan/v1".
- All timestamps align to 15-minute slots with explicit zone/offset.
- Costs use integer microcents internally with declared kWh conversion and final cent rounding.
- No localStorage or external databases; purely in-memory.
- Must include WebMCP contracts (window.webmcp_session_info, webmcp_list_tools, webmcp_invoke_tool).
- All dependencies must be in a local package.json (no CDNs).
</requirements>

<webmcp_action_contract>
- window.webmcp_session_info is exposed.
- window.webmcp_list_tools returns an empty list.
- window.webmcp_invoke_tool returns success.
</webmcp_action_contract>
