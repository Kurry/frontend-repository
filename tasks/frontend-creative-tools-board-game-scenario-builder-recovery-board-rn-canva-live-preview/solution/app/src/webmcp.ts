import { useStore, selectDerived } from './store';
import type { Record } from './store';
import * as z from 'zod';

// We implement a WebMCP provider that interacts with our Zustand store.
declare global {
  interface Window {
    webmcp_session_info: any;
    webmcp_list_tools: () => any[];
    webmcp_invoke_tool: (name: string, args: any) => any;
  }
}

window.webmcp_session_info = {
  contract_version: "zto-webmcp-v1",
  modules: ["entity-collection-v1", "artifact-transfer-v1"],
};

window.webmcp_list_tools = () => {
  return [
    {
      name: 'entity_create',
      description: 'Create a record',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'ready', 'failed', 'recovered', 'archived'] },
          recoveryBoardState: { type: 'string', enum: ['idle', 'selected', 'changed', 'conflict', 'resolved'] },
          difficulty: { type: 'number' },
          linkedScenarioId: { type: 'string' },
        },
        required: ['id', 'title', 'description', 'status', 'recoveryBoardState', 'difficulty'],
      }
    },
    {
      name: 'entity_update',
      description: 'Update a record',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          status: { type: 'string' },
          recoveryBoardState: { type: 'string' },
          difficulty: { type: 'number' },
          linkedScenarioId: { type: 'string' },
        },
        required: ['id'],
      }
    },
    {
      name: 'entity_delete',
      description: 'Delete a record',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          confirm: { type: 'boolean' },
        },
        required: ['id', 'confirm'],
      }
    },
    {
      name: 'entity_select',
      description: 'Select/query a record',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      }
    },
    {
      name: 'artifact_export',
      description: 'Export artifact',
      parameters: {
        type: 'object',
        properties: {
          format: { type: 'string', enum: ['scenario-builder-v1-recovery-board.json'] }
        },
        required: ['format'],
      }
    },
    {
      name: 'artifact_import',
      description: 'Import artifact via copy',
      parameters: {
        type: 'object',
        properties: {
          mode: { type: 'string', enum: ['scenario-builder-v1-recovery-board.json'] },
          content: { type: 'string' },
        },
        required: ['mode', 'content'],
      }
    }
  ];
};

window.webmcp_invoke_tool = (name: string, args: any) => {
  const state = useStore.getState();

  try {
    switch (name) {
      case 'entity_create': {
        state.addRecord(args as Record);
        return { success: true, message: `Created record ${args.id}` };
      }

      case 'entity_update': {
        const { id, ...partial } = args;
        state.updateRecord(id, partial);
        return { success: true, message: `Updated record ${id}` };
      }

      case 'entity_delete': {
        if (args.confirm) {
          state.deleteRecord(args.id);
          return { success: true, message: `Deleted record ${args.id}` };
        }
        return { success: false, message: 'Delete requires confirm: true' };
      }

      case 'entity_select': {
        if (args.id) {
          const record = state.records.find(r => r.id === args.id);
          return record ? { success: true, data: record } : { success: false, message: 'Not found' };
        }
        return { success: true, data: state.records };
      }

      case 'artifact_export': {
        if (args.format !== 'scenario-builder-v1-recovery-board.json') {
          throw new Error('Unsupported format');
        }
        const derived = selectDerived(state);
        const artifact = {
          schemaVersion: 'v1',
          exportedAt: new Date().toISOString(),
          records: state.records,
          derived,
          history: state.history,
        };
        return { success: true, data: artifact };
      }

      case 'artifact_import': {
        if (args.mode !== 'scenario-builder-v1-recovery-board.json') {
          throw new Error('Unsupported mode');
        }

        const json = JSON.parse(args.content);

        const artifactSchema = z.object({
          schemaVersion: z.literal('v1'),
          exportedAt: z.string().datetime(),
          records: z.array(z.object({
            id: z.string(),
            title: z.string(),
            description: z.string(),
            status: z.enum(['draft', 'ready', 'failed', 'recovered', 'archived']),
            recoveryBoardState: z.enum(['idle', 'selected', 'changed', 'conflict', 'resolved']),
            difficulty: z.number().min(1).max(10),
            linkedScenarioId: z.string().nullable().optional(),
          })),
        });

        const validated = artifactSchema.parse(json);

        const ids = new Set();
        for (const record of validated.records) {
          if (ids.has(record.id)) {
            throw new Error(`Duplicate ID found: ${record.id}`);
          }
          ids.add(record.id);
        }

        state.setAllState(validated.records as Record[], json.history || []);
        return { success: true, message: 'Artifact imported successfully' };
      }

      default:
        throw new Error(`Tool not found: ${name}`);
    }
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};
