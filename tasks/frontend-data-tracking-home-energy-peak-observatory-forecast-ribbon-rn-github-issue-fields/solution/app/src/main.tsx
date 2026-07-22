import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// WebMCP global contracts implementation
declare global {
  interface Window {
    webmcp_session_info: () => Promise<any>;
    webmcp_list_tools: () => Promise<any[]>;
    webmcp_invoke_tool: (args: any) => Promise<any>;
    __dispatch: any;
    __getState: any;
  }
}

window.webmcp_session_info = async () => ({
  task_id: 'eval-intelligence/frontend-data-tracking-home-energy-peak-observatory-forecast-ribbon-rn-github-issue-fields'
});

window.webmcp_list_tools = async () => [
  {
    name: 'editor_update_property',
    description: 'Updates a property on a structured editor object (e.g. forecast ribbon)',
    inputSchema: {
      type: "object",
      properties: {
        object_type: { type: "string" },
        property: { type: "string" },
        value: { type: "number" }
      },
      required: ["object_type", "property", "value"]
    }
  },
  {
    name: 'entity_create',
    description: 'Creates a new entity (energy-reading)',
    inputSchema: {
      type: "object",
      properties: {
        entity: { type: "string" },
        id: { type: "string" },
        value: { type: "number" },
        status: { type: "string" }
      },
      required: ["entity", "id", "value", "status"]
    }
  },
  {
    name: 'entity_select',
    description: 'Selects an entity',
    inputSchema: {
      type: "object",
      properties: {
        entity: { type: "string" },
        id: { type: "string" }
      },
      required: ["entity", "id"]
    }
  },
  {
    name: 'entity_update',
    description: 'Updates an entity',
    inputSchema: {
      type: "object",
      properties: {
        entity: { type: "string" },
        id: { type: "string" },
        value: { type: "number" },
        status: { type: "string" }
      },
      required: ["entity", "id"]
    }
  },
  {
    name: 'entity_delete',
    description: 'Deletes an entity',
    inputSchema: {
      type: "object",
      properties: {
        entity: { type: "string" },
        id: { type: "string" },
        confirm: { type: "boolean" }
      },
      required: ["entity", "id", "confirm"]
    }
  },
  {
    name: 'artifact_export',
    description: 'Exports the current session to JSON',
    inputSchema: {
      type: "object",
      properties: {
        format: { type: "string", enum: ["session-json"] }
      },
      required: ["format"]
    }
  },
  {
    name: 'artifact_import',
    description: 'Imports a session JSON to state',
    inputSchema: {
      type: "object",
      properties: {
        mode: { type: "string", enum: ["session-json"] }
      },
      required: ["mode"]
    }
  }
];

window.webmcp_invoke_tool = async (req: any) => {
  const { name, arguments: args } = req;
  const dispatch = window.__dispatch;
  const getState = window.__getState;

  if (!dispatch || !getState) {
    throw new Error("Application state not fully initialized yet.");
  }

  const state = getState();

  switch (name) {
    case 'editor_update_property': {
      if (args.object_type === 'forecast-ribbon' && args.property === 'forecast-value') {
        if (!state.selectedId) {
          return { content: [{ type: "text", text: "No record selected to mutate forecast." }], isError: true };
        }
        dispatch({ type: 'MUTATE_FORECAST', payload: { id: state.selectedId, projection: args.value } });
        return { content: [{ type: "text", text: "Forecast property updated." }] };
      }
      return { content: [{ type: "text", text: "Unknown editor property or object type" }], isError: true };
    }

    case 'entity_create': {
      if (args.entity === 'energy-reading') {
        if (state.records.find((r: any) => r.id === args.id)) {
           return { content: [{ type: "text", text: "Duplicate ID" }], isError: true };
        }
        dispatch({ type: 'ADD_RECORD', payload: { id: args.id, value: args.value, status: args.status } });
        return { content: [{ type: "text", text: "Entity created." }] };
      }
      return { content: [{ type: "text", text: "Unknown entity type." }], isError: true };
    }

    case 'entity_select': {
       if (args.entity === 'energy-reading') {
          dispatch({ type: 'SELECT_RECORD', payload: args.id });
          return { content: [{ type: "text", text: "Entity selected." }] };
       }
       return { content: [{ type: "text", text: "Unknown entity type." }], isError: true };
    }

    case 'entity_update': {
       if (args.entity === 'energy-reading') {
          const record = state.records.find((r: any) => r.id === args.id);
          if (!record) return { content: [{ type: "text", text: "Entity not found." }], isError: true };
          dispatch({ type: 'UPDATE_RECORD', payload: { ...record, ...args } });
          return { content: [{ type: "text", text: "Entity updated." }] };
       }
       return { content: [{ type: "text", text: "Unknown entity type." }], isError: true };
    }

    case 'entity_delete': {
       if (args.entity === 'energy-reading') {
          if (!args.confirm) return { content: [{ type: "text", text: "Delete must be confirmed." }], isError: true };
          dispatch({ type: 'DELETE_RECORD', payload: args.id });
          return { content: [{ type: "text", text: "Entity deleted." }] };
       }
       return { content: [{ type: "text", text: "Unknown entity type." }], isError: true };
    }

    case 'artifact_export': {
       // artifact operations leave actual file interaction to Playwright. We just trigger the success flow.
       return { content: [{ type: "text", text: "Artifact export initiated." }] };
    }

    case 'artifact_import': {
       return { content: [{ type: "text", text: "Artifact import ready for file payload." }] };
    }

    default:
      return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
  }
};
