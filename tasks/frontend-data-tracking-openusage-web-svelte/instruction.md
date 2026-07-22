# OpenUsage Web Console — Svelte

<summary>
The user connects an already-running OpenUsage loopback service or enters a supported API key, observes concurrent schema/tool refresh streams across five provider families, investigates freshness/reset/burn signals, and directly composes a two-metric focus strip that survives sanitized export/import. This is not the existing fictional cost analytics or agent command center. It must reconcile heterogeneous consumption/balance resources, retain last-good values through partial failure, keep credentials ephemeral, and make one pin/range mutation propagate through provider cards, focus strip, charts, projections, history, WebMCP, and artifact. Use Tailwind CSS 4.3.2. No CDNs or external web fonts allowed, install all via npm-local packages.
</summary>

<core_features>
Three connection modes: demo (deterministic fixtures, zero non-local requests), loopback (base URL fixed to http://127.0.0.1:6736, GET /v1/limits), api-key (open-router or z-ai, ephemeral validation).
Credential contract: Credentials live only in runes state, are masked, and clear on reload. Never persist or include secrets in exports or URL.
Typed stream and tools: Render a stream of usage refresh events using a data validation tool and mock language test engine. Track sequences, providers, timestamps, phases, and payloads.
Interactive metrics: Drag handles for focus slots (up to two pins), linked 30-day chart brushing for date ranges, and recalculation of spend tiles/pace.
</core_features>

<user_flows>
Choose source then verify and refresh then customize and pin then investigate range then export, reset, and import.
</user_flows>

<edge_cases>
401/403, 503, CORS, no plan, absent data, third pin, cancel, event gap, hostile import are handled safely.
Retain last-good values through partial failure.
</edge_cases>

<visual_design>
Compare consumption/balance/fresh/updating/stale/error/disabled/secret states clearly.
Desktop presents a provider rail, comparison workspace, trace, and focus strip.
Status text indicates age (Updating, Outdated) and errors.
</visual_design>

<motion>
Drag, replacement confirmation, refresh, retry, and brush present causal continuity.
Reduced motion uses instant placement with persistent deltas and status text.
</motion>

<responsiveness>
At 375px, a provider stepper and bottom-sheet metric picker replace the desktop arrangement. Actions remain at least 44px, and no page horizontal scroll appears.
</responsiveness>

<accessibility>
Keyboard alternatives for pin/reorder/brush and exact date inputs.
Focus trap/return and restrained status announcements remain correct.
</accessibility>

<performance>
Handle five providers, 100 resources, 300 points, and concurrent streams. Input acknowledgement under 100ms, and linked settle under 500ms.
</performance>

<writing>
Failure copy names provider, safe category, and recovery without secret fragments.
</writing>

<innovation>
One pin or range mutation synchronizes card, focus strip, chart, projection, trace, WebMCP, and artifact.
</innovation>

<requirements>
Render the stream directly from one state graph with derived views in Svelte 5.
Demo mode must load five fixture providers and simulate various states.
Export must be a JSON artifact with schemaVersion openusage-web-workspace/v1, an exportedAt timestamp, ordered provider snapshots, and a canonical checksum. No credentials in export.
Atomic import validates the JSON and reports safe errors on hostile data.
The chart supports pointer/touch brushing.
Solution must not use CDNs or external web fonts. All resources must be bundled and served locally via npm dependencies. Tailwind CSS 4.3.2 must be used for styling. No npm-local usage of CDNs.
</requirements>

<integrity>
Zero non-local requests in demo mode.
Complete deterministic fixtures for all modes.
Playwright + WebMCP parity for the required mechanics.
No partial mutation on validation failure.
</integrity>

<delivery>
The solution app must serve on port 3000 via npm start.
No console or page errors during validation.
</delivery>

<webmcp_action_contract>
Implement window.webmcp_session_info, webmcp_list_tools, and webmcp_invoke_tool.
Tools: verify_credential, fetch_limits, normalize_provider_snapshot, compile_workspace, detect_agent_installations, set_pin, set_range, export_workspace, import_workspace.
</webmcp_action_contract>
