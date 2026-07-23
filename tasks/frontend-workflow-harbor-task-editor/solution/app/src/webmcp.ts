import { useStore, WorkflowTaskEditorState } from './store';

declare global {
  interface Window {
    webmcp_session_info: () => Record<string, any>;
    webmcp_list_tools: () => Record<string, any>[];
    webmcp_invoke_tool: (name: string, args: Record<string, any>) => Promise<any>;
  }
}

window.webmcp_session_info = () => {
  return {
    version: "1.0",
    task: "frontend-workflow-workflow-task-editor"
  };
};

window.webmcp_list_tools = () => {
  return [
    {
      name: "run_mocked_stream",
      description: "Dispatches a mocked stream",
      inputSchema: {
        type: "object",
        properties: {}
      }
    },
    {
      name: "approve_event",
      description: "Approves a pending event",
      inputSchema: {
         type: "object",
         properties: {
             runId: { type: "string" },
             eventId: { type: "string" }
         },
         required: ["runId", "eventId"]
      }
    },
    {
      name: "export_state",
      description: "Exports the canonical editor state payload.",
      inputSchema: {
        type: "object",
        properties: {}
      }
    },
    {
      name: "import_state",
      description: "Imports a canonical state bundle.",
      inputSchema: {
        type: "object",
        properties: {
          payload: { type: "object" }
        },
        required: ["payload"]
      }
    },
    {
      name: "get_state",
      description: "Gets the full current state",
      inputSchema: {
        type: "object",
        properties: {}
      }
    }
  ];
};

window.webmcp_invoke_tool = async (name: string, args: Record<string, any>) => {
  const store = useStore.getState();

  try {
    switch (name) {
      case "run_mocked_stream": {
        const runId = `run-${Date.now()}`;
        store.dispatchAction({ type: 'DISPATCH_RUN', runId });

        setTimeout(() => {
          useStore.getState().dispatchAction({ type: 'ADD_TOOL_EVENT', runId, event: {
            id: `ev-1-${Date.now()}`, name: 'compile', args: { target: 'all' }, state: 'completed', timestamp: new Date().toISOString()
          }});
        }, 100);

        setTimeout(() => {
          useStore.getState().dispatchAction({ type: 'ADD_TOOL_EVENT', runId, event: {
            id: `ev-2-${Date.now()}`, name: 'deploy_preview', args: {}, state: 'pending', timestamp: new Date().toISOString(), requiresApproval: true
          }});
        }, 200);

        return { success: true, runId };
      }

      case "approve_event": {
        store.dispatchAction({ type: 'APPROVE_EVENT', runId: args.runId, eventId: args.eventId });
        return { success: true };
      }

      case "export_state": {
        const state = useStore.getState();
        const payload = {
          ...state.editor,
          exportedAt: new Date().toISOString(),
          runs: Object.values(state.runs)
        };
        return { success: true, state: payload };
      }

      case "import_state": {
        store.dispatchAction({ type: 'IMPORT_STATE', payload: args.payload as WorkflowTaskEditorState });
        return { success: true };
      }

      case "get_state": {
         return { state: store };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (err: any) {
    return { error: err.message };
  }
};
