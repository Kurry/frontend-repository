import { useStore } from './store';

export const setupWebMCP = () => {
  (window as any).webmcp_session_info = () => ({
    contract_version: 'zto-webmcp-v1',
    modules: ['structured-editor-v1', 'entity-collection-v1', 'artifact-transfer-v1']
  });

  (window as any).webmcp_list_tools = () => {
    return [
      {
        name: 'editor_select',
        description: 'Select a scenario-card.',
        parameters: { id: 'string' }
      },
      {
        name: 'editor_update_property',
        description: 'Update property of a selected scenario-card (e.g. status, conflict-resolution).',
        parameters: { id: 'string', property: 'string', value: 'any' }
      },
      {
        name: 'editor_switch_mode',
        description: 'Switch between constraint-canvas and filtered-view modes.',
        parameters: { mode: 'string' }
      },
      {
        name: 'editor_preview',
        description: 'Preview current view mode state.',
        parameters: {}
      },
      {
        name: 'entity_create',
        description: 'Create a new record.',
        parameters: { data: 'object' }
      },
      {
        name: 'entity_select',
        description: 'Select a record.',
        parameters: { id: 'string' }
      },
      {
        name: 'entity_update',
        description: 'Update a record.',
        parameters: { id: 'string', data: 'object' }
      },
      {
        name: 'entity_delete',
        description: 'Delete a record.',
        parameters: { id: 'string', confirm: 'boolean' }
      },
      {
        name: 'entity_toggle',
        description: 'Toggle archive state of a record.',
        parameters: { id: 'string', field: 'string' }
      },
      {
        name: 'artifact_export',
        description: 'Export scenario-builder-v1-constraint-canvas.json.',
        parameters: { format: 'string' }
      },
      {
        name: 'artifact_import',
        description: 'Import scenario-builder-v1-constraint-canvas.json.',
        parameters: { mode: 'string', data: 'string' }
      },
      {
        name: 'artifact_copy',
        description: 'Copy session json to clipboard.',
        parameters: {}
      }
    ];
  };

  (window as any).webmcp_invoke_tool = (name: string, args: any) => {
    const store = useStore.getState();

    switch (name) {
      case 'editor_select':
      case 'entity_select': {
        store.setSelectedRecordId(args.id);
        return { success: true };
      }

      case 'editor_update_property': {
        if (args.property === 'status') {
          store.moveRecord(args.id, args.value);
        } else if (args.property === 'conflict-resolution') {
          store.resolveConflict(args.id, args.value.updates, args.value.intendedStatus);
        }
        return { success: true };
      }

      case 'editor_switch_mode': {
        store.setViewMode(args.mode as any);
        return { success: true };
      }

      case 'editor_preview': {
        return { success: true, state: store.viewMode };
      }

      case 'entity_create': {
        store.addRecord(args.data);
        return { success: true };
      }

      case 'entity_update': {
        store.updateRecord(args.id, args.data);
        return { success: true };
      }

      case 'entity_delete': {
        if (args.confirm) {
          store.deleteRecord(args.id);
          return { success: true };
        }
        return { success: false, error: 'Confirmation required' };
      }

      case 'entity_toggle': {
        if (args.field === 'archived') {
          const r = store.records.find(rec => rec.id === args.id);
          if (r) {
            store.updateRecord(args.id, { archived: !r.archived });
          }
        }
        return { success: true };
      }

      case 'artifact_export': {
        if (args.format === 'scenario-builder-v1-constraint-canvas.json') {
          const data = store.exportSession();
          return { success: true, data };
        }
        return { success: false, error: 'Unknown format' };
      }

      case 'artifact_import': {
        if (args.mode === 'scenario-builder-v1-constraint-canvas.json') {
          const res = store.importSession(args.data);
          return res;
        }
        return { success: false, error: 'Unknown mode' };
      }

      case 'artifact_copy': {
        const data = store.exportSession();
        navigator.clipboard.writeText(data).catch(() => {});
        return { success: true, data };
      }

      default:
        return { success: false, error: `Tool ${name} not implemented` };
    }
  };
};
