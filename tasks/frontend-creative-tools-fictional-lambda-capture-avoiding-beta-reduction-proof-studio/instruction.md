<summary>
Fictional Lambda Capture-Avoiding Beta-Reduction Proof Studio
</summary>

<core_features>
Provide a scoped syntax canvas displaying the Draft term with 7 expression nodes and 2 stable binders.
Allow dragging free argument VAR-ARG-Y toward VAR-X. Moving across the BINDER-Y scope membrane triggers a capture risk warning.
Expose a fresh-name wheel for BINDER-Y collision; selecting z from candidates previews alpha conversion.
Support Beta reduction by dropping VAR-ARG-Y into the VAR-X slot, retiring APP-ROOT, ABS-X, VAR-X, and BINDER-X.
Reconcile named and De Bruijn representations dynamically, ensuring free variable y and named indices are updated.
Expose exact keyboard for Substitute, compact alternate touch input, and WebMCP commands matching the atomic step.
Track Author-aware history, selective undo preserving notes, and branch restoration.
Provide a 9-file ZIP artifact export representing the Proof event with manifest, JSON state, 3 CSVs, NDJSON, SVG, Markdown, JSON Schema.
Support artifact import that semanticly restores trees, binders, history, review states, and inspection panels.
</core_features>

<visual_design>
Use a deliberate reduction desk dominating the screen space at 1440x900.
Render application forks, lambda binder caps, variable leaves, nested translucent scope membranes, and binding arcs.
Use clear color, pattern, and distance badges to associate bound variables with their enclosing lambda binders without ambiguity.
Differentiate Draft, Alpha, Proof, and invalid state through visual indicators without solely relying on color.
Make the free-variable ledger, active/tombstone table, and node-lineage rail legible side-by-side with the visual tree.
</visual_design>

<motion>
Show continuous argument-subtree movement along a substitution tunnel path.
Trigger visual detour bending the drag path away from blocked captures, requiring a fresh-name detent interaction.
Relabel binder/reference names in place without rebuilding DOM elements for unaffected branches.
Provide a reduced-motion toggle that exposes persistent old/new names, parent slots, and announcements without drag-and-drop.
</motion>

<requirements>
BETA-REDUCE-APP-ROOT-ALPHA-BINDER-Y-TO-Z: Atomic event moving VAR-ARG-Y to APP-INNER/function, retiring redex nodes, renaming BINDER-Y to z.
State model strictly defines active/tombstoned nodes and binder identities, tracking Draft, Alpha, and Proof.
WebMCP contract fully exposes the state and canonical mutation commands.
All operations (drag, keyboard, API) must funnel into a canonical reducer yielding identical outcome signatures.
Artifact export (ZIP) must contain deterministic byte-level evidence without mocking.
Import must parse all 9 files, rejecting invalid formats or mismatched schemas gracefully while offering diagnostic reports.
Use Tailwind CSS 4.3.2. Ensure npm-local/no-CDN rule is followed.
</requirements>

<integrity>
Zero network writes or external backend syncs. No localStorage persistence for good-app genre.
The exported artifact must contain genuine computation history matching the in-memory reduction states.
Using mock results instead of genuine tree traversal, deterministic renaming, and binding distance computation is prohibited.
</integrity>

<delivery>
The oracle app builds and serves on port 3000 without errors.
Deliver dist output.
evidence.webm walkthrough demonstrating the feature set via Playwright script without placeholder fabrication.
</delivery>

<webmcp_action_contract>
Action evaluate_state:
- description: Evaluate current topology, binders, arcs, and De Bruijn form.
- inputs: {}

Action simulate_drag_detour:
- description: Run exact UI command to beta-reduce APP-ROOT avoiding capture on BINDER-Y with fresh name z.
- inputs: {"redexId": "APP-ROOT", "argumentId": "VAR-ARG-Y", "freshName": "z", "strategy": "capture-avoiding"}

Action reset:
- description: Restore canonical Draft revision.
- inputs: {}

Action export_proof:
- description: Request the ZIP binary content as base64 string.
- inputs: {}

Action import_proof:
- description: Submit a ZIP binary content as base64 string to replace current state.
- inputs: {"zipBase64": "<base64_string>"}
</webmcp_action_contract>
