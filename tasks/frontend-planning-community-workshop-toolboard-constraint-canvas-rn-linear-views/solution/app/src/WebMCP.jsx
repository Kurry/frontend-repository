import { useEffect } from 'react';
import { useStore } from './store.jsx';
import { validateSession } from './schema';
import { v4 as uuidv4 } from 'uuid';

export const WebMCP = () => {
  const { state, dispatch } = useStore();

  useEffect(() => {
    // 1. Expose Session Info
    window.webmcp_session_info = {
      task_name: 'eval-intelligence/frontend-planning-community-workshop-toolboard-constraint-canvas-rn-linear-views',
      state_summary: `Records: ${state.records.length}, History: ${state.history.length}`,
      last_exported_at: state.history.length > 0 ? state.history[state.history.length - 1].timestamp : new Date().toISOString(),
    };

    // 2. Define WebMCP Tools
    window.webmcp_list_tools = () => {
      return JSON.stringify([
        {
          name: 'entity_create_record',
          description: 'Create a new workshop station',
          input_schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              lane: { type: 'string', enum: ['backlog', 'in-progress', 'review', 'done'] },
            },
            required: ['name', 'lane']
          }
        },
        {
          name: 'entity_update_record',
          description: 'Move a station to a new lane',
          input_schema: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              lane: { type: 'string', enum: ['backlog', 'in-progress', 'review', 'done'] },
            },
            required: ['id', 'lane']
          }
        },
        {
          name: 'artifact_export_session_json',
          description: 'Export the current workshop session as JSON',
          input_schema: { type: 'object', properties: {} }
        },
        {
          name: 'artifact_import_session_json',
          description: 'Import a workshop session from JSON',
          input_schema: {
            type: 'object',
            properties: {
              session_data: { type: 'object' }
            },
            required: ['session_data']
          }
        }
      ]);
    };

    // 3. Implement WebMCP Tool Invocation
    window.webmcp_invoke_tool = (toolName, argsStr) => {
      return new Promise((resolve, reject) => {
        try {
          const args = JSON.parse(argsStr);

          if (toolName === 'entity_create_record') {
            const { name, lane } = args;
            dispatch({ type: 'CREATE_RECORD', payload: { name, status: 'draft', lane, capacity: 1 }});
            resolve(JSON.stringify({ status: 'success' }));
          }
          else if (toolName === 'entity_update_record') {
            const { id, lane } = args;
            dispatch({ type: 'MOVE_LANE', payload: { id, lane } });
            resolve(JSON.stringify({ status: 'success' }));
          }
          else if (toolName === 'artifact_export_session_json') {
            const session = {
              schemaVersion: 'workshop-toolboard-v1',
              exportedAt: new Date().toISOString(),
              records: state.records,
              derived: state.derived,
              history: state.history,
            };
            resolve(JSON.stringify({ session_data: session }));
          }
          else if (toolName === 'artifact_import_session_json') {
            const result = validateSession(args.session_data);
            if (result.success) {
              result.data.exportedAt = new Date().toISOString();
              dispatch({ type: 'LOAD_SESSION', payload: result.data });
              resolve(JSON.stringify({ status: 'success' }));
            } else {
              reject(new Error('Invalid session JSON'));
            }
          }
          else {
            reject(new Error(`Unknown tool: ${toolName}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    };
  }, [state, dispatch]);

  return null;
};
