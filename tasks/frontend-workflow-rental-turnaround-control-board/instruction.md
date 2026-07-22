# Rental Turnaround Control Board

Build a React application using Vite and Tailwind CSS. The app coordinates a fictional small property team turning around one unit between occupants.

## Requirements

1. **Room-state floorplan:** Display a fictional two-bedroom unit with eight rooms and 46 fixtures as selectable SVG loci. Include overlays for inspection status, severity, work, and verification. Support lasso or keyboard selection.
2. **Findings and evidence ledger:** Display 31 inspection observations with severity, notes, evidence hashes, and logical time.
3. **Work graph and turnaround timeline:** Create tasks from findings, set dependencies, assignee, and duration. Allow drag/resize on a worker timeline.
4. **Inventory and key custody:** Manage 14 inventory lots and 6 keys. Allow reserving, issuing, consuming, and returning items.
5. **Scope branches and approval:** Branch repair/replace decisions.
6. **Dispatch, verification, and partial handoff:** Dispatch tasks, verify with evidence, trigger delays, and support a partial handoff recovery.
7. **Responsive:** Work on desktop, tablet, and mobile.
8. **Artifact contract:** Support export and import of `turnaround.json`, `work-order.csv`, `turnaround.ics`, `unit-status.svg`, and `handoff-packet.md`.

Use React, Zustand for state, and Framer Motion for animations. Ensure all WebMCP tools are integrated.
