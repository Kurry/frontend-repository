import { useStore } from './store';
import type { ReadinessLevel } from './types';

export interface WebMCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

const TOOLS: WebMCPTool[] = [
  // entity-collection-v1
  {
    name: 'entity_create',
    description: 'Create a new brew-experiment.',
    inputSchema: {
      type: 'object',
      properties: {
        entity: { type: 'string', enum: ['brew-experiment'] },
        title: { type: 'string' },
        beanWeight: { type: 'number' },
        waterVolume: { type: 'number' },
        temperature: { type: 'number' }
      },
      required: ['entity', 'title', 'beanWeight', 'waterVolume', 'temperature']
    }
  },
  {
    name: 'entity_select',
    description: 'Select a brew-experiment.',
    inputSchema: {
      type: 'object',
      properties: {
        entity: { type: 'string', enum: ['brew-experiment'] },
        id: { type: 'string' }
      },
      required: ['entity', 'id']
    }
  },
  {
    name: 'entity_update',
    description: 'Update a brew-experiment.',
    inputSchema: {
      type: 'object',
      properties: {
        entity: { type: 'string', enum: ['brew-experiment'] },
        id: { type: 'string' },
        title: { type: 'string' },
        beanWeight: { type: 'number' },
        waterVolume: { type: 'number' },
        temperature: { type: 'number' }
      },
      required: ['entity', 'id']
    }
  },
  {
    name: 'entity_delete',
    description: 'Delete a brew-experiment.',
    inputSchema: {
      type: 'object',
      properties: {
        entity: { type: 'string', enum: ['brew-experiment'] },
        id: { type: 'string' },
        confirm: { type: 'boolean' }
      },
      required: ['entity', 'id', 'confirm']
    }
  },
  // structured-editor-v1
  {
    name: 'editor_select',
    description: 'Select a handoff-map-node.',
    inputSchema: {
      type: 'object',
      properties: {
        editor_object_type: { type: 'string', enum: ['handoff-map-node'] },
        id: { type: 'string' }
      },
      required: ['editor_object_type', 'id']
    }
  },
  {
    name: 'editor_update_property',
    description: 'Update properties of a handoff-map-node (canonical mutation).',
    inputSchema: {
      type: 'object',
      properties: {
        editor_object_type: { type: 'string', enum: ['handoff-map-node'] },
        id: { type: 'string' },
        owner: { type: 'string' },
        readiness: { type: 'string', enum: ['low', 'medium', 'high'] }
      },
      required: ['editor_object_type', 'id']
    }
  },
  // artifact-transfer-v1
  {
    name: 'artifact_export',
    description: 'Export session JSON artifact.',
    inputSchema: {
      type: 'object',
      properties: {
        format: { type: 'string', enum: ['session-json'] }
      },
      required: ['format']
    }
  },
  {
    name: 'artifact_import',
    description: 'Import session JSON artifact.',
    inputSchema: {
      type: 'object',
      properties: {
        mode: { type: 'string', enum: ['session-json'] },
        payload: { type: 'object' } // Represents parsed JSON for testing
      },
      required: ['mode', 'payload']
    }
  },
  {
    name: 'artifact_copy',
    description: 'Copy session JSON artifact.',
    inputSchema: {
      type: 'object',
      properties: {
        format: { type: 'string', enum: ['session-json'] }
      },
      required: ['format']
    }
  }
];

if (typeof window !== 'undefined') {
  (window as any).webmcp_session_info = () => ({
    contract_version: 'zto-webmcp-v1',
    modules: ['entity-collection-v1', 'structured-editor-v1', 'artifact-transfer-v1']
  });

  (window as any).webmcp_list_tools = () => TOOLS;

  (window as any).webmcp_invoke_tool = (toolName: string, args: any) => {
    const store = useStore.getState();

    switch (toolName) {
      case 'entity_create': {
        store.createRecord({
          title: args.title,
          beanWeight: args.beanWeight,
          waterVolume: args.waterVolume,
          temperature: args.temperature
        });
        return { success: true };
      }
      case 'entity_select': {
        store.selectRecord(args.id);
        return { success: true };
      }
      case 'entity_update': {
        const { entity, id, ...updates } = args;
        store.updateRecord(id, updates);
        return { success: true };
      }
      case 'entity_delete': {
        if (!args.confirm) throw new Error("Delete requires explicit confirm=true");
        store.deleteRecord(args.id);
        return { success: true };
      }
      case 'editor_select': {
        store.selectRecord(args.id);
        return { success: true };
      }
      case 'editor_update_property': {
        store.connectRecordToHandoffOwner(args.id, args.owner || '', args.readiness as ReadinessLevel);
        return { success: true };
      }
      case 'artifact_export':
      case 'artifact_copy': {
        return { success: true, result: store.exportSession() };
      }
      case 'artifact_import': {
        store.importSession(args.payload as any);
        return { success: true };
      }
      default:
        throw new Error(`Tool not found: ${toolName}`);
    }
  };
}
