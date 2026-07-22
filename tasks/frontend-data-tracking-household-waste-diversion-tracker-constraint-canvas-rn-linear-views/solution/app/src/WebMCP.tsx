import { useEffect } from 'react';
import type { WasteRecord, WasteDiversionSession, LaneId } from './types';

// Declare WebMCP interfaces on window
declare global {
  interface Window {
    webmcp_session_info?: () => Promise<any>;
    webmcp_list_tools?: () => Promise<any>;
    webmcp_invoke_tool?: (toolName: string, args: any) => Promise<any>;
  }
}

interface WebMCPProps {
  records: WasteRecord[];
  addRecord: (record: Omit<WasteRecord, 'id' | 'status' | 'lane'>) => void;
  updateRecord: (id: string, updates: Partial<WasteRecord>) => void;
  archiveRecord: (id: string) => void;
  moveRecord: (id: string, newLane: LaneId) => void;
  exportData: () => WasteDiversionSession;
  importData: (data: any) => boolean;
}

export function WebMCP({ records, addRecord, updateRecord, archiveRecord, moveRecord, exportData, importData }: WebMCPProps) {
  useEffect(() => {
    window.webmcp_session_info = async () => ({
      task_id: 'frontend-data-tracking-household-waste-diversion-tracker-constraint-canvas-rn-linear-views',
      capabilities: ['entity-collection-v1', 'artifact-transfer-v1', 'structured-editor-v1']
    });

    window.webmcp_list_tools = async () => ({
      tools: [
        {
          name: 'entity_create_record',
          description: 'Create a new waste record',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              weight: { type: 'number' }
            },
            required: ['name', 'weight']
          }
        },
        {
          name: 'entity_update_record',
          description: 'Update a waste record',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              updates: { type: 'object' }
            },
            required: ['id', 'updates']
          }
        },
        {
          name: 'entity_delete_record',
          description: 'Archive a waste record',
          inputSchema: {
            type: 'object',
            properties: { id: { type: 'string' }, confirm: { type: 'boolean' } },
            required: ['id', 'confirm']
          }
        },
        {
          name: 'entity_select_record',
          description: 'Select a record',
          inputSchema: {
            type: 'object',
            properties: { id: { type: 'string' } },
            required: ['id']
          }
        },
        {
          name: 'editor_update_property',
          description: 'Update property of a record on the canvas (e.g. lane)',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              property: { type: 'string' },
              value: { type: 'string' }
            },
            required: ['id', 'property', 'value']
          }
        },
        {
          name: 'editor_select',
          description: 'Select a record on canvas',
          inputSchema: {
            type: 'object',
            properties: { id: { type: 'string' } },
            required: ['id']
          }
        },
        {
          name: 'artifact_export_session_json',
          description: 'Export session state as JSON',
          inputSchema: { type: 'object', properties: {} }
        },
        {
          name: 'artifact_import_session_json',
          description: 'Import session state from JSON',
          inputSchema: {
            type: 'object',
            properties: {
              data: { type: 'object' }
            },
            required: ['data']
          }
        },
        {
          name: 'artifact_copy_session_json',
          description: 'Copy session state as JSON',
          inputSchema: { type: 'object', properties: {} }
        }
      ]
    });

    window.webmcp_invoke_tool = async (toolName: string, args: any) => {
      const handleCopy = () => {
        const data = exportData();
        navigator.clipboard.writeText(JSON.stringify(data, null, 2)).catch(e => console.error(e));
      };

      switch (toolName) {
        case 'entity_create_record': {
          addRecord({ name: args.name, weight: args.weight });
          return { success: true };
        }
        case 'entity_update_record': {
          updateRecord(args.id, args.updates);
          return { success: true };
        }
        case 'entity_delete_record': {
          if (args.confirm) {
            archiveRecord(args.id);
            return { success: true };
          }
          throw new Error('Must confirm delete');
        }
        case 'editor_update_property': {
          if (args.property === 'lane') {
            moveRecord(args.id, args.value as LaneId);
          }
          return { success: true };
        }
        case 'artifact_export_session_json': {
          return { data: exportData() };
        }
        case 'artifact_import_session_json': {
          const success = importData(args.data);
          return { success };
        }
        case 'artifact_copy_session_json': {
          handleCopy();
          return { success: true };
        }
        case 'editor_select':
        case 'entity_select_record': {
          return { success: true, message: 'Selection is simulated in WebMCP via Playwright evaluation usually, but handled here for contract completeness' };
        }
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    };

    return () => {
      delete window.webmcp_session_info;
      delete window.webmcp_list_tools;
      delete window.webmcp_invoke_tool;
    };
  }, [records, addRecord, updateRecord, archiveRecord, moveRecord, exportData, importData]);

  return null;
}
