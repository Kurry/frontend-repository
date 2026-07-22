import { useEffect } from 'react';
import { useAppStore } from './store';

declare global {
  interface Window {
    webmcp_session_info: () => Promise<any>;
    webmcp_list_tools: () => Promise<any[]>;
    webmcp_invoke_tool: (toolName: string, args: any) => Promise<any>;
  }
}

export function WebMCPHandler() {
  useEffect(() => {
    // 1. Session info
    window.webmcp_session_info = async () => {
      return {
        task_id: "eval-intelligence/frontend-data-tracking-pet-care-wellness-log-forecast-ribbon-rn-github-issue-fields",
        contract_version: "zto-webmcp-v1"
      };
    };

    // 2. List tools
    window.webmcp_list_tools = async () => {
      return [
        {
          name: "entity_create_record",
          description: "Create an entity using declared fields.",
          inputSchema: {
            type: "object",
            properties: {
              initial_fields: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  status: { type: "string" },
                  priority: { type: "string" }
                }
              }
            }
          }
        },
        {
          name: "entity_select_record",
          description: "Select an entity by public id.",
          inputSchema: {
            type: "object",
            required: ["entity_id"],
            properties: { entity_id: { type: "string" } }
          }
        },
        {
          name: "entity_update_record",
          description: "Update declared fields on an entity.",
          inputSchema: {
            type: "object",
            required: ["entity_id", "updates"],
            properties: {
              entity_id: { type: "string" },
              updates: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  status: { type: "string" },
                  priority: { type: "string" }
                }
              }
            }
          }
        },
        {
          name: "entity_delete_record",
          description: "Delete an entity with explicit confirmation.",
          inputSchema: {
            type: "object",
            required: ["entity_id", "confirm"],
            properties: {
              entity_id: { type: "string" },
              confirm: { type: "boolean" }
            }
          }
        },
        {
          name: "editor_select_object",
          description: "Select an object.",
          inputSchema: {
            type: "object",
            required: ["object_type"],
            properties: {
              object_type: { type: "string" },
              object_id: { type: "string" }
            }
          }
        },
        {
          name: "editor_update_property",
          description: "Update property.",
          inputSchema: {
             type: "object",
             required: ["object_type", "property", "value"],
             properties: {
                object_type: { type: "string" },
                property: { type: "string" },
                value: { type: "string" }
             }
          }
        },
        {
          name: "artifact_export_session_json",
          description: "Export the session JSON.",
          inputSchema: {
             type: "object",
             properties: {}
          }
        },
        {
          name: "artifact_import_session_json",
          description: "Import session JSON.",
          inputSchema: {
             type: "object",
             required: ["artifact_data"],
             properties: {
               artifact_data: { type: "object" }
             }
          }
        }
      ];
    };

    // 3. Invoke tool
    window.webmcp_invoke_tool = async (toolName: string, args: any) => {
      const state = useAppStore.getState();

      if (toolName === 'entity_create_record') {
        const title = args.initial_fields?.title || 'New Record';
        const description = args.initial_fields?.description || '';
        const priority = args.initial_fields?.priority || 'medium';
        const status = args.initial_fields?.status || 'draft';
        state.addRecord({ title, description, priority, status, date: new Date().toISOString(), projectedOutcome: 'To be determined' });
        return { success: true, result: { message: "Record created" } };
      }

      if (toolName === 'entity_select_record') {
         state.selectRecord(args.entity_id);
         return { success: true, result: { message: `Selected ${args.entity_id}` } };
      }

      if (toolName === 'entity_update_record') {
         state.updateRecord(args.entity_id, args.updates);
         return { success: true, result: { message: `Updated ${args.entity_id}` } };
      }

      if (toolName === 'entity_delete_record') {
         if (args.confirm) {
             state.deleteRecord(args.entity_id);
             return { success: true, result: { message: `Deleted ${args.entity_id}` } };
         }
         return { success: false, error: "Requires confirmation" };
      }

      if (toolName === 'editor_select_object') {
         if (args.object_type === 'forecast-ribbon') {
            return { success: true, result: { message: "Ribbon context selected" } };
         }
         return { success: false, error: "Unknown object" };
      }

      if (toolName === 'editor_update_property') {
         if (args.object_type === 'forecast-ribbon' && args.property === 'status' && state.editor.selectedRecordId) {
             state.updateRecord(state.editor.selectedRecordId, { status: args.value });
             return { success: true, result: { message: "Ribbon status updated" } };
         }
         return { success: false, error: "Missing context or invalid property" };
      }

      if (toolName === 'artifact_export_session_json') {
          return { success: true, result: { artifact: state.exportSession() } };
      }

      if (toolName === 'artifact_import_session_json') {
          const success = state.importSession(args.artifact_data);
          return { success, result: success ? { message: "Imported successfully" } : { error: "Validation failed" } };
      }

      return { success: false, error: "Tool not implemented" };
    };
  }, []);

  return null;
}
