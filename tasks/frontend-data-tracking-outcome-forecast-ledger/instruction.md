<summary>
Build the Outcome Forecast Ledger, a hard browser app for versioned decision journaling. The app allows a project lead to record probabilistic forecasts, commit probabilities and evidence, create timestamped amendments, link dependent forecasts, adjudicate outcomes, explore calibration, write decision reviews, and export a canonical session ledger. The application runs entirely in memory (no backend, no localStorage) with deterministic fixtures and produces a downloadable JSON/CSV/SVG artifact session. Use Tailwind CSS 4.3.2.
</summary>

<core_features>
Feature: Forecast Contract Composer —
- The user can define a new forecast with exact question, outcome set, probability, resolution date, resolver, resolution rule, source packet, and invalidation conditions.
- Binary probability is 1–99%; categorical probabilities must sum to 100% using largest-remainder display rules.
- The composer rejects duplicate outcomes, past resolution dates, or nonmeasurable rules.

Feature: Evidence and Dependency Graph —
- Users can bind exact source spans as supporting, opposing, contextual, or invalidating evidence with an assigned weight and note.
- Forecasts can connect via conditional or logical-group edges under declared formulas. Dependency cycles are rejected.
- Selecting any source or edge highlights the affected probability decomposition and forecast cards.

Feature: Commitments and Amendments —
- Committing freezes the question, outcomes, rules, probability, and evidence checksum at the current logical time.
- Changing probability/evidence/rationale on a committed forecast creates a timestamped amendment with before/after values and cause.
- Backdating and deletion of commitments/amendments are strictly forbidden. The timeline allows viewing any version without overwriting the latest.

Feature: Outcome Packet and Adjudication —
- At resolution, the user reviews exact evidence spans and selects an outcome state: resolved, invalid, extended, or disputed.
- For categorical outcomes, exactly one winning id must be chosen.
- Conflicting outcome evidence requires documented adjudication. Extending creates a new deadline event.

Feature: Score and Calibration Views —
- Resolved forecasts compute a Brier score using the last committed probability before the resolution cutoff.
- Reliability bins use fixed boundaries, showing count, mean forecast, observed frequency, gap, and uncertainty marker.
- Brushing a bin or date highlights the exact forecast, version, and outcome rows.

Feature: Counterfactual and Dependency Lens —
- The user can preview how a different probability, bin scheme, or dependent-parent outcome alters scores without modifying the canonical state.
- A waterfall visualizes the forecast's score contribution.
- Dependency consistency warnings name the exact formula and values.

Feature: Review Workflow —
- After adjudication, the user can pin evidence, compare initial versus final belief, tag update quality, record surprise/lesson, and approve the deterministic evaluator summary.
- Editing an upstream adjudication marks the review as stale.

Feature: Responsive Ledger and Artifacts (Useful End State) —
- Export produces a canonical Session JSON, a CSV forecast-version/outcome ledger, and an SVG reliability/score report.
- Import accepts a previously exported Session JSON to exactly reconstruct the application state.
- The Session Field Contract (schemaVersion "outcome-forecast-ledger/v1") stores forecasts, outcomes, evidence bindings, dependency DAG, commitments, amendments, adjudication events, scoring config, reviews, and artifacts.
</core_features>

<visual_design>
- Desktop shows forecast cards/timeline, evidence/dependency graph, adjudication, and calibration/review rail.
- Mobile layout reflows into version cards, binding sheets, vertical lineage, outcome stepper, bin drilldowns, and a score/review drawer with no horizontal overflow and 44-pixel touch targets.
- Temporal provenance must stay legible across draft, committed, amended, open, resolved, invalid, disputed, extended, and stale states.
- Ensure clear typographic hierarchy distinguishing draft beliefs from committed beliefs.
</visual_design>

<motion>
- Probability redistribution, timeline version transitions, graph propagation, and bin/score movements animate clearly to show causal endpoints.
- Marking a review as stale triggers a noticeable but non-disruptive attention animation.
- Reduced motion preferences preserve persistent deltas and final values without animations.
</motion>

<requirements>
- The app operates purely in-memory with deterministic fixtures loaded on start: 18 source excerpts, 8 historic resolved forecasts, 3 open forecasts, 2 dependent forecast groups, 1 ambiguous outcome packet, and fixed local clock events over 60 days.
- Ensure cross-view consistency: timeline scrubbing, probability controls, and chart brushing update the shared store, reflecting everywhere identically.
- WebMCP standard modules MUST be implemented: window.webmcp_session_info, window.webmcp_list_tools, window.webmcp_invoke_tool. WebMCP must expose handlers for queries, reading forecast state, adding amendments, resolving outcomes, and fetching artifacts.
- No dummy/mocked WebM output; the recorded evidence must be a real walk-through of the application.
- Use Tailwind CSS 4.3.2.
- Do not use CDNs; ensure all dependencies are local via npm.
</requirements>

<webmcp_action_contract>
[
  {
    "name": "get_state",
    "description": "Gets the full ledger state.",
    "parameters": {
      "type": "object",
      "properties": {}
    }
  },
  {
    "name": "commit_forecast",
    "description": "Commits a new forecast draft.",
    "parameters": {
      "type": "object",
      "properties": {
        "question": {
          "type": "string"
        },
        "probability": {
          "type": "number"
        }
      },
      "required": [
        "question",
        "probability"
      ]
    }
  },
  {
    "name": "amend_forecast",
    "description": "Amends a forecast probability.",
    "parameters": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "probability": {
          "type": "number"
        },
        "cause": {
          "type": "string"
        }
      },
      "required": [
        "id",
        "probability",
        "cause"
      ]
    }
  },
  {
    "name": "adjudicate_outcome",
    "description": "Resolves a forecast.",
    "parameters": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "outcomeId": {
          "type": "string"
        }
      },
      "required": [
        "id",
        "outcomeId"
      ]
    }
  },
  {
    "name": "export_ledger",
    "description": "Exports the session artifact JSON.",
    "parameters": {
      "type": "object",
      "properties": {}
    }
  }
]
</webmcp_action_contract>
