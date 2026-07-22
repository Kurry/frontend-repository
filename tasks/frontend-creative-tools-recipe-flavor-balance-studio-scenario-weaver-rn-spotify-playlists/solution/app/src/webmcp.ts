import { useStore } from './store';
import { RecipeFlavorBalanceStudioSessionSchema } from './schema';

export function setupWebMCP() {
  (window as any).webmcp_session_info = () => ({
    contract_version: 'zto-webmcp-v1',
    modules: ['entity-collection-v1', 'structured-editor-v1', 'artifact-transfer-v1'],
    status: 'ready'
  });

  (window as any).webmcp_list_tools = () => {
    return [
      {
        name: 'entity_create',
        description: 'Create a new flavor component',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            status: { type: 'string', enum: ['draft', 'ready', 'changed', 'archived'] }
          },
          required: ['id', 'name', 'status']
        }
      },
      {
        name: 'entity_select',
        description: 'Select a flavor component',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' }
          },
          required: ['id']
        }
      },
      {
        name: 'entity_update',
        description: 'Update a flavor component',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            status: { type: 'string', enum: ['draft', 'ready', 'changed', 'archived'] }
          },
          required: ['id']
        }
      },
      {
        name: 'entity_delete',
        description: 'Delete a flavor component',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            confirm: { type: 'boolean' }
          },
          required: ['id', 'confirm']
        }
      },
      {
        name: 'editor_select',
        description: 'Select a scenario (same as entity_select)',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' }
          },
          required: ['id']
        }
      },
      {
        name: 'editor_update_property',
        description: 'Update editor property',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            property: { type: 'string' },
            value: { type: 'any' }
          },
          required: ['id', 'property', 'value']
        }
      },
      {
        name: 'editor_switch_mode',
        description: 'Switch editor mode',
        inputSchema: {
          type: 'object',
          properties: {
            mode: { type: 'string' }
          },
          required: ['mode']
        }
      },
      {
        name: 'artifact_export',
        description: 'Export the session',
        inputSchema: {
          type: 'object',
          properties: {
            format: { type: 'string' }
          }
        }
      },
      {
        name: 'artifact_import',
        description: 'Import a session payload directly',
        inputSchema: {
          type: 'object',
          properties: {
            payload: { type: 'object' }
          },
          required: ['payload']
        }
      }
    ];
  };

  (window as any).webmcp_invoke_tool = async (toolName: string, args: any) => {
    const store = useStore.getState();

    switch (toolName) {
      case 'entity_create': {
        store.addRecord({
          id: args.id,
          name: args.name,
          status: args.status,
          profile: { sweetness: 5, acidity: 5, saltiness: 5, bitterness: 5, umami: 5 }
        });
        return { success: true, message: `Created ${args.id}` };
      }

      case 'entity_select':
      case 'editor_select': {
        store.selectRecord(args.id);
        return { success: true, message: `Selected ${args.id}` };
      }

      case 'entity_update': {
        store.updateRecord(args.id, {
          ...(args.name && { name: args.name }),
          ...(args.status && { status: args.status })
        });
        return { success: true, message: `Updated ${args.id}` };
      }

      case 'entity_delete': {
        if (!args.confirm) throw new Error("Delete requires explicit confirm=true");
        store.deleteRecord(args.id);
        return { success: true, message: `Deleted ${args.id}` };
      }

      case 'editor_update_property': {
        if (args.property === 'branched_from' || args.property === 'status') {
           store.updateRecord(args.id, { [args.property]: args.value });
           return { success: true };
        }
        throw new Error(`Unsupported editor property: ${args.property}`);
      }

      case 'editor_switch_mode': {
        return { success: true, message: "Mode switched" }; // No-op for this schema but required by module spec
      }

      case 'artifact_export': {
        const records = store.records;
        const avgProfile = records.reduce((acc, r) => {
          acc.sweetness += r.profile.sweetness;
          acc.acidity += r.profile.acidity;
          acc.saltiness += r.profile.saltiness;
          acc.bitterness += r.profile.bitterness;
          acc.umami += r.profile.umami;
          return acc;
        }, { sweetness: 0, acidity: 0, saltiness: 0, bitterness: 0, umami: 0 });

        if (records.length > 0) {
          avgProfile.sweetness /= records.length;
          avgProfile.acidity /= records.length;
          avgProfile.saltiness /= records.length;
          avgProfile.bitterness /= records.length;
          avgProfile.umami /= records.length;
        }

        const payload = {
          schemaVersion: "v1",
          exportedAt: new Date().toISOString(),
          records,
          history: store.history,
          derived: {
            total_components: records.length,
            average_profile: avgProfile
          }
        };
        return { success: true, payload };
      }

      case 'artifact_import': {
        const parsed = RecipeFlavorBalanceStudioSessionSchema.safeParse(args.payload);
        if (!parsed.success) {
          throw new Error(`Import validation failed: ${parsed.error.message}`);
        }

        const ids = parsed.data.records.map(r => r.id);
        const uniqueIds = new Set(ids);
        if (ids.length !== uniqueIds.size) {
           throw new Error("Malformed import: Duplicate IDs found");
        }

        store.clearAndImport({
          ...parsed.data,
          exportedAt: new Date().toISOString()
        });
        return { success: true, message: "Imported successfully" };
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  };
}
