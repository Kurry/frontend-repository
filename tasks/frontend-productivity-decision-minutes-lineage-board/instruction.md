# Decision Minutes Lineage Board

<summary>
Build a fully client-side (in-memory) decision tracker for structured meeting minutes using Tailwind CSS 4.3.2. The user manages a fictitious committee meeting through agenda blocks, proposes motions bound to specific evidence excerpts, and introduces amendments that branch to create a complete revision history. A core requirement is tracking the lineage of decisions: positions, quorum, dissents, action items, and eventual superseding motions that revise historical actions. The final output must support robust artifact generation including precise JSON, Markdown, CSV, ICS, and SVG exports describing the immutable ledger of the meeting state.
</summary>

<core_features>
- Manage an agenda timeline where blocks can be dragged and resized.
- The logical clock controls start, pause, resume, extend, skip, and close events.
- Drag source evidence cards onto proposal claims as supporting or opposing context.
- Maintain revision histories for proposals rather than in-place text replacement.
- Create branching amendments that target exact proposal revision ranges.
- Accepted amendments form new proposal revisions, while rejected branches remain in the history.
- Append-only attendance tracking.
- Calculate quorum based on role and current clock.
- Enforce rules where decisions cannot close without a current quorum and eligible positions.
- Adopt, reject, table, or withdraw motions.
- Once decided, records freeze context including tally and dissent.
- Support superseding previous decisions with new edges in a DAG, never rewriting the past.
- Generate action items from adopted decisions with dependencies and deadlines.
- Track state and handoffs.
- Actions tied to superseded decisions must be marked for review.
- Manage a queue of participants requesting to speak.
- Route off-topic items to a parking lot mapped for future agendas.
- Export the ledger to JSON, Markdown, CSV, ICS, and SVG artifacts.
- Ensure importing these artifacts precisely restores the board state.
</core_features>

<visual_design>
Display linked views including an agenda clock timeline, a proposal amendment DAG visualization, position quorum tally charts, and an action decision rail. Translate complex views into vertical flows for responsive mobile: agenda proposal cards, a vertical lineage view, a position quorum sheet, a speaking queue, and a stepper for actions. Maintain clear state distinctions for planned, active, overrun, introduced, amended, withdrawn, present, absent, recused, and superseded components. Ensure 44-pixel touch targets.
</visual_design>

<motion>
Animate agenda time shifts, amendment-to-proposal changes, and tally closures to show clear before and after state transitions. When reduced motion is preferred, fallback to explicit textual changes of revisions, counts, and statuses without sacrificing lineage clarity.
</motion>

<requirements>
State must be strictly in-memory (no localStorage or external APIs). Data structures must match DecisionMinutesLedger schema v1.
Provide standard WebMCP integration globally via window.webmcp_session_info, window.webmcp_list_tools, and window.webmcp_invoke_tool exposing methods to read canonical state, clock, proposals, history, and to trigger imports/exports.
A functional setup script npm start that runs a dev server on port 3000 (React, Vue, or Vanilla JS acceptable) with zero console errors. Provide a complete functional Oracle implementation.
No external CDNs allowed. All dependencies must be local npm packages.
Use Tailwind CSS 4.3.2.
</requirements>

<webmcp_action_contract>
list_tools: return standard schema definitions
invoke_tool: retrieve canonical state, clock, proposals, history, and trigger imports/exports
</webmcp_action_contract>
