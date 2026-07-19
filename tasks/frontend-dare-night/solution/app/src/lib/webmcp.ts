// WebMCP action contract surface (contract version zto-webmcp-v1).
// Exposes window.webmcp_session_info / list_tools / invoke_tool. Every tool
// routes through the SAME product callbacks the visible UI controls invoke —
// no tool creates a success path the UI lacks.

export const CONTRACT_VERSION = 'zto-webmcp-v1';

export interface ToolResult {
  ok: boolean;
  message: string;
  [key: string]: unknown;
}

export interface WebmcpTool {
  name: string;
  module: string;
  operation: string;
  description: string;
  run: (args: Record<string, unknown>) => ToolResult;
}

export interface WebmcpActions {
  // command-session-v1 — deterministic live-event stream
  streamStart: () => ToolResult;
  streamPause: () => ToolResult;
  streamResume: () => ToolResult;
  streamStop: () => ToolResult;
  streamRestart: () => ToolResult;
  streamAdvance: () => ToolResult;
  streamDeliverOutOfOrder: () => ToolResult;
  streamReconnect: () => ToolResult;
  streamDisconnect: () => ToolResult;
  // entity-collection-v1 — cards, players, scoring
  entityCreate: (args: Record<string, unknown>) => ToolResult;
  entitySelect: (args: Record<string, unknown>) => ToolResult;
  entityUpdate: (args: Record<string, unknown>) => ToolResult;
  entityDelete: (args: Record<string, unknown>) => ToolResult;
  entityToggle: (args: Record<string, unknown>) => ToolResult;
  // form-workflow-v1 — setup + custom-card form
  formValidate: (args: Record<string, unknown>) => ToolResult;
  formSubmit: (args: Record<string, unknown>) => ToolResult;
  formCancel: (args: Record<string, unknown>) => ToolResult;
  formReset: (args: Record<string, unknown>) => ToolResult;
}

export function registerWebmcp(actions: WebmcpActions): void {
  if (typeof window === 'undefined') return;

  const tools: WebmcpTool[] = [
    // ---- command-session-v1 ----
    { name: 'session_start', module: 'command-session-v1', operation: 'start',
      description: 'Start the live-event stream auto-delivery.', run: () => actions.streamStart() },
    { name: 'session_pause', module: 'command-session-v1', operation: 'pause',
      description: 'Pause the live-event stream; auto-delivery stops.', run: () => actions.streamPause() },
    { name: 'session_resume', module: 'command-session-v1', operation: 'resume',
      description: 'Resume the paused live-event stream.', run: () => actions.streamResume() },
    { name: 'session_stop', module: 'command-session-v1', operation: 'stop',
      description: 'Stop the live-event stream and reset delivered events to idle.', run: () => actions.streamStop() },
    { name: 'session_restart', module: 'command-session-v1', operation: 'restart',
      description: 'Restart the live-event stream from the first event.', run: () => actions.streamRestart() },
    { name: 'session_advance', module: 'command-session-v1', operation: 'advance',
      description: 'Deliver the next in-order live event by one step.', run: () => actions.streamAdvance() },
    { name: 'session_trigger_demo', module: 'command-session-v1', operation: 'trigger_demo',
      description: 'Deliver the offered out-of-order live event (deliver-out-of-order demo).', run: () => actions.streamDeliverOutOfOrder() },
    { name: 'session_connect', module: 'command-session-v1', operation: 'connect',
      description: 'Reconnect the live-event stream and catch up any missed events exactly once.', run: () => actions.streamReconnect() },
    { name: 'session_disconnect', module: 'command-session-v1', operation: 'disconnect',
      description: 'Disconnect the live-event stream; delivery halts.', run: () => actions.streamDisconnect() },

    // ---- entity-collection-v1 ----
    { name: 'entity_create', module: 'entity-collection-v1', operation: 'create',
      description: 'Create a card (prompt, category, intensity) or add a setup player (name).', run: (a) => actions.entityCreate(a) },
    { name: 'entity_select', module: 'entity-collection-v1', operation: 'select',
      description: 'Draw and select the next card for the current player.', run: (a) => actions.entitySelect(a) },
    { name: 'entity_update', module: 'entity-collection-v1', operation: 'update',
      description: 'Resolve the current turn for the current player: outcome "done" awards a point, "skip" logs a forfeit.', run: (a) => actions.entityUpdate(a) },
    { name: 'entity_delete', module: 'entity-collection-v1', operation: 'delete',
      description: 'Delete a custom card by id. Requires confirm=true.', run: (a) => actions.entityDelete(a) },
    { name: 'entity_toggle', module: 'entity-collection-v1', operation: 'toggle',
      description: 'Toggle a category (Icebreaker|Truth|Dare|Wild) in or out of play on the setup screen.', run: (a) => actions.entityToggle(a) },

    // ---- form-workflow-v1 ----
    { name: 'form_validate', module: 'form-workflow-v1', operation: 'validate',
      description: 'Validate the setup form or the custom-card form without committing.', run: (a) => actions.formValidate(a) },
    { name: 'form_submit', module: 'form-workflow-v1', operation: 'submit',
      description: 'Submit the setup form to start the game, or submit the custom-card form to add a card.', run: (a) => actions.formSubmit(a) },
    { name: 'form_cancel', module: 'form-workflow-v1', operation: 'cancel',
      description: 'Cancel an open confirmation dialog (new game or delete-card).', run: (a) => actions.formCancel(a) },
    { name: 'form_reset', module: 'form-workflow-v1', operation: 'reset',
      description: 'Reset the session back to the setup screen (New Game), preserving the saved record.', run: (a) => actions.formReset(a) },
  ];

  const byName = new Map(tools.map((t) => [t.name, t]));

  const w = window as unknown as Record<string, unknown>;

  w.webmcp_session_info = () => ({
    contract_version: CONTRACT_VERSION,
    app: 'dare-night',
    modules: ['command-session-v1', 'entity-collection-v1', 'form-workflow-v1'],
    tool_count: tools.length,
  });

  w.webmcp_list_tools = () =>
    tools.map((t) => ({
      name: t.name,
      module: t.module,
      operation: t.operation,
      description: t.description,
    }));

  w.webmcp_invoke_tool = (name: string, args?: Record<string, unknown>) => {
    const tool = byName.get(name);
    if (!tool) {
      return { ok: false, message: `Unknown tool: ${name}` } satisfies ToolResult;
    }
    try {
      return tool.run(args ?? {});
    } catch (err) {
      return { ok: false, message: `Tool ${name} failed: ${(err as Error)?.message ?? String(err)}` } satisfies ToolResult;
    }
  };
}
