import { useEffect } from 'react';
import { useStateContext } from './store';
import type { LessonStatus } from './store';

export function WebMCPManager() {
  const { state, dispatch } = useStateContext();

  useEffect(() => {
    // Expose standard info - MUST BE A FUNCTION
    (window as any).webmcp_session_info = async () => {
      return {
        task_id: 'eval-intelligence/frontend-planning-classroom-lesson-arc-planner-scenario-weaver-rn-spotify-playlists',
        schema_version: 'v1'
      };
    };

    (window as any).webmcp_list_tools = async () => {
      return [
        { name: 'entity_create_record', description: 'Create a new lesson block' },
        { name: 'entity_update_record', description: 'Update a lesson block' },
        { name: 'artifact_export_session_json', description: 'Export the current state to JSON' },
        { name: 'artifact_import_session_json', description: 'Import state from JSON' },
      ];
    };
  }, []);

  // Update handlers when state changes
  useEffect(() => {
    (window as any).webmcp_invoke_tool = async (tool_name: string, tool_arguments: any) => {
      try {
        switch (tool_name) {
          case 'entity_create_record': {
            dispatch({ type: 'CREATE_RECORD', payload: { title: tool_arguments.title || 'Untitled', details: tool_arguments.details || '', status: (tool_arguments.status || 'draft') as LessonStatus } });
            return { success: true, message: 'Record created' };
          }
          case 'entity_update_record': {
            dispatch({ type: 'UPDATE_RECORD', payload: { id: tool_arguments.id, title: tool_arguments.title, details: tool_arguments.details, status: tool_arguments.status } });
            return { success: true, message: 'Record updated' };
          }
          case 'artifact_export_session_json': {
            const exportData = {
              schemaVersion: state.schemaVersion,
              exportedAt: new Date().toISOString(),
              records: state.records,
              derived: state.derived,
              history: state.history
            };
            return { success: true, data: exportData };
          }
          case 'artifact_import_session_json': {
            if (tool_arguments.data && tool_arguments.data.schemaVersion === 'v1') {
              dispatch({ type: 'IMPORT_STATE', payload: { ...tool_arguments.data, exportedAt: new Date().toISOString() } });
              return { success: true, message: 'State imported successfully' };
            }
            return { success: false, error: 'Invalid schema' };
          }
          default:
            return { success: false, error: 'Unknown tool' };
        }
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    };
  }, [state, dispatch]);

  return null;
}
