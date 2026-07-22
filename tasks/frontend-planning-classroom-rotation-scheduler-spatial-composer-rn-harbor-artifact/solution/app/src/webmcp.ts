export function initWebMCP(getState: () => any, dispatch: (action: any) => void) {
  // @ts-ignore
  window.webmcp_session_info = {
    name: 'eval-intelligence/frontend-planning-classroom-rotation-scheduler-spatial-composer-rn-provenance-artifact',
    mode: 'eval'
  };

  // @ts-ignore
  window.webmcp_list_tools = () => {
    return [
      {
        name: 'entity_create_record',
        description: 'Create a new entity record',
        payload_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            status: { type: 'string' }
          },
          required: ['title', 'status']
        }
      },
      {
        name: 'entity_update_record',
        description: 'Update an existing entity record',
        payload_schema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            status: { type: 'string' }
          },
          required: ['id']
        }
      },
      {
        name: 'artifact_export_session_json',
        description: 'Export the current session as a JSON artifact',
        payload_schema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'artifact_import_session_json',
        description: 'Import a JSON artifact to restore the session',
        payload_schema: {
          type: 'object',
          properties: {
            json_string: { type: 'string' }
          },
          required: ['json_string']
        }
      }
    ];
  };

  // @ts-ignore
  window.webmcp_invoke_tool = (toolName: string, payload: any) => {
    if (toolName === 'entity_create_record') {
      dispatch({ type: 'CREATE_RECORD', payload: { title: payload.title, status: payload.status } });
      return JSON.stringify({ success: true, message: 'Record created.' });
    }

    if (toolName === 'entity_update_record') {
      dispatch({ type: 'UPDATE_RECORD', payload: { id: payload.id, updates: { status: payload.status } } });
      return JSON.stringify({ success: true, message: 'Record updated.' });
    }

    if (toolName === 'artifact_export_session_json') {
      const state = getState();
      const exportData = {
        ...state,
        exportedAt: new Date().toISOString()
      };
      return JSON.stringify(exportData, null, 2);
    }

    if (toolName === 'artifact_import_session_json') {
      try {
        const json = JSON.parse(payload.json_string);
        // Note: simplified validation for WebMCP invocation purposes
        if (json.schemaVersion === 'v1' && Array.isArray(json.records)) {
          const restoredState = {
            ...json,
            exportedAt: new Date().toISOString()
          };
          dispatch({ type: 'RESTORE_SESSION', payload: restoredState });
          return JSON.stringify({ success: true, message: 'Session imported.' });
        }
        return JSON.stringify({ success: false, error: 'Invalid schema' });
      } catch (err) {
        return JSON.stringify({ success: false, error: 'Failed to parse JSON' });
      }
    }

    return JSON.stringify({ success: false, error: 'Tool not found' });
  };
}
