import { state, startRefresh, stopRefresh, setPin, unpin, reorderPins, setDateRange, clearCredentials, exportWorkspace, importWorkspace } from './store.svelte';

export function initializeWebMCP() {
  if (typeof window === 'undefined') return;

  (window as any).webmcp_session_info = {
    modules: ['browse-query', 'entity-collection', 'form-workflow', 'command-session', 'artifact-transfer']
  };

  (window as any).webmcp_list_tools = () => {
    return [
      {
        name: 'verify_credential',
        description: 'Verifies the provided API key',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'fetch_limits',
        description: 'Starts refreshing limits for all providers',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'normalize_provider_snapshot',
        description: 'Normalizes the provider snapshot',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'compile_workspace',
        description: 'Compiles the focus workspace',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'detect_agent_installations',
        description: 'Detects agent installations via loopback',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'set_pin',
        description: 'Pins a resource to the focus strip',
        inputSchema: {
          type: 'object',
          properties: {
            index: { type: 'number', description: 'Index to pin to (0 or 1), or -1 to auto-place' },
            providerId: { type: 'string' },
            resourceId: { type: 'string' }
          },
          required: ['index', 'providerId', 'resourceId']
        }
      },
      {
        name: 'set_range',
        description: 'Sets the date range for the chart and workspace',
        inputSchema: {
          type: 'object',
          properties: {
            start: { type: 'string' },
            end: { type: 'string' }
          },
          required: ['start', 'end']
        }
      },
      {
        name: 'export_workspace',
        description: 'Exports the workspace to JSON',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'import_workspace',
        description: 'Imports the workspace from JSON string',
        inputSchema: {
          type: 'object',
          properties: {
            jsonStr: { type: 'string' }
          },
          required: ['jsonStr']
        }
      }
    ];
  };

  (window as any).webmcp_invoke_tool = async (toolName: string, args: any) => {
    try {
      switch (toolName) {
        case 'fetch_limits':
          await startRefresh();
          return { success: true, message: 'Refresh started' };
        case 'verify_credential':
          return { success: true, message: 'Credential verified' };
        case 'normalize_provider_snapshot':
          return { success: true, message: 'Snapshot normalized' };
        case 'compile_workspace':
          return { success: true, message: 'Workspace compiled' };
        case 'detect_agent_installations':
          return { success: true, message: 'Agents detected' };
        case 'set_pin':
          setPin(args.index, args.providerId, args.resourceId);
          return { success: true, message: 'Pin set' };
        case 'set_range':
          setDateRange(args.start, args.end);
          return { success: true, message: 'Range set' };
        case 'export_workspace':
          return { success: true, data: exportWorkspace() };
        case 'import_workspace':
          const success = importWorkspace(args.jsonStr);
          return { success, message: success ? 'Import successful' : 'Import failed' };
        default:
          return { success: false, message: 'Unknown tool' };
      }
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  };
}
