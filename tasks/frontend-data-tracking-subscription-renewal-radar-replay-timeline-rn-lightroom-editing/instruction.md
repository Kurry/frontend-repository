# Subscription Renewal Radar — Replay Timeline — Lightroom Editing

<summary>
Manage subscriptions through a domain-native browser surface where one meaningful mutation updates linked views and an interoperable artifact. Variant focus: scrub a selected record through its timeline and restore a prior checkpoint. Release-derived concept: a media board where selections, batch edits, histogram ranges, and sequence exports remain synchronized. Use Tailwind CSS 4.3.2.
</summary>

<core_features>
Subscriptions collection: Create, edit, archive, and filter subscriptions with explicit domain statuses.
Replay Timeline surface: Scrub a selected record through its timeline and restore a prior checkpoint. Undo the last mutation and inspect the linked representation.
Portable work artifact: Export and restore the actual session work in a fresh state via a subscription-radar-v1.json file.
</core_features>

<visual_design>
A distinctive, domain-specific workbench with clear state tokens, intentional density, and a calm focused canvas. Desktop primary surface plus summary and inspector; mobile transforms secondary surfaces into drawers or stacked steps. Semantic controls, keyboard parity, focus management, contrast, and reduced-motion support.
</visual_design>

<motion>
The acted-on item moves or morphs into its new state; reduced motion preserves feedback without transforms.
</motion>

<requirements>
Action: Create, edit, or delete a subscription record. Expected evidence: The records collection is updated and filtered by domain state without partial or corrupted data.
Action: Scrub a selected record through its timeline and restore a prior checkpoint. Expected evidence: The replay timeline mutation changes the primary record, linked view, and status together, restoring prior state upon undo.
Action: Export the current artifact. Expected evidence: A JSON file is downloaded containing schemaVersion, exportedAt, records array, derived summary, and history array.
Action: Clear and import a valid artifact. Expected evidence: Authored structure and derived state are restored and exportedAt is regenerated; invalid import makes no state change.
Action: Use the signature interaction at a narrow viewport. Expected evidence: The desktop surface becomes a usable stack, drawer, or stepper without horizontal overflow.
Action: Repeat the signature interaction with keyboard and touch-equivalent controls. Expected evidence: Alternate input produces identical state with visible focus and live feedback.
Action: Query the current state and export after the mutation using WebMCP tools. Expected evidence: The tool result and artifact contain the declared API-shaped fields.
Code constraints: Use npm-local packages only; no CDN usage is permitted. Use Tailwind CSS 4.3.2.
</requirements>

<webmcp_action_contract>
- window.webmcp_session_info
- window.webmcp_list_tools
- window.webmcp_invoke_tool
Provide tools to trace, create, update, delete, undo, quarantine, and import/export the subscription records.
</webmcp_action_contract>

## Data and Artifact Contract

**Record Shape:** SubscriptionRenewalRadarSession with `schemaVersion`, `exportedAt`, `records[]`, `derived{}`, and `history[]`; each record is an API-shaped would-be request body.

**Validation Rules:**
- `schemaVersion` is a task-specific v1 enum (e.g. "v1") and `exportedAt` is RFC3339.
- Record IDs are unique and status values are explicit enums (e.g., 'draft', 'ready', 'changed', 'archived').
- Required fields, numeric/date bounds, and cross-record references validate together.

**Persistence:** In-memory only; export/import is the persistence boundary. No localStorage.

**Import/export:** `subscription-radar-v1-replay-timeline.json` uses the replay-timeline schema for export and import, rejects invalid records without mutation, and regenerates `exportedAt`.
