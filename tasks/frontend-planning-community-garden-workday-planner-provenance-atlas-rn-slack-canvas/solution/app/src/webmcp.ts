import type { WorkTask, CommunityGardenWorkdayPlannerSession } from './types';

// Declare globals
declare global {
  interface Window {
    webmcp_session_info: () => {
      task: string;
      version: string;
    };
    webmcp_list_tools: () => {
      name: string;
      description: string;
      schema: any;
    }[];
    webmcp_invoke_tool: (name: string, args: any) => Promise<any>;
    __appState: {
      createRecord: (record: Partial<WorkTask>) => string;
      updateRecord: (id: string, updates: Partial<WorkTask>) => void;
      exportSession: () => CommunityGardenWorkdayPlannerSession;
      importSession: (session: CommunityGardenWorkdayPlannerSession) => void;
    };
  }
}

export function setupWebMCP() {
  window.webmcp_session_info = () => ({
    task: "eval-intelligence/frontend-planning-community-garden-workday-planner-provenance-atlas-rn-slack-canvas",
    version: "1.0.0"
  });

  window.webmcp_list_tools = () => [
    {
      name: 'entity_create_record',
      description: 'Create a new entity record.',
      schema: {
        type: 'object',
        properties: {
          record: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              status: { type: 'string', enum: ['draft', 'ready', 'changed', 'archived'] },
              assignee: { type: 'string' },
              dueDate: { type: 'string' },
              budget: { type: 'number' },
              dependencies: { type: 'array', items: { type: 'string' } },
            },
            required: ['title', 'status']
          }
        },
        required: ['record']
      }
    },
    {
      name: 'entity_update_record',
      description: 'Update an existing entity record.',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          updates: {
            type: 'object',
          }
        },
        required: ['id', 'updates']
      }
    },
    {
      name: 'artifact_export_session_json',
      description: 'Export the entire session state as a structured JSON artifact.',
      schema: { type: 'object', properties: {} }
    },
    {
      name: 'artifact_import_session_json',
      description: 'Import a structured JSON artifact to replace the session state.',
      schema: {
        type: 'object',
        properties: {
          artifact: { type: 'object' }
        },
        required: ['artifact']
      }
    }
  ];

  window.webmcp_invoke_tool = async (name: string, args: any) => {
    try {
      if (!window.__appState) {
        throw new Error('App state not initialized');
      }

      switch (name) {
        case 'entity_create_record': {
          const id = window.__appState.createRecord(args.record);
          return { success: true, id };
        }
        case 'entity_update_record': {
          window.__appState.updateRecord(args.id, args.updates);
          return { success: true };
        }
        case 'artifact_export_session_json': {
          const artifact = window.__appState.exportSession();
          return { success: true, artifact };
        }
        case 'artifact_import_session_json': {
          // Validation should happen inside the app state implementation
          window.__appState.importSession(args.artifact);
          return { success: true };
        }
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Unknown error' };
    }
  };
}
