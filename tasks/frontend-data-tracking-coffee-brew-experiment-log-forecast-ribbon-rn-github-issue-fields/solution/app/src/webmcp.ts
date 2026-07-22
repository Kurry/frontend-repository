import { useStore } from './store';

declare global {
  interface Window {
    webmcp_session_info: () => any;
    webmcp_list_tools: () => any[];
    webmcp_invoke_tool: (name: string, args: any) => any;
  }
}

window.webmcp_session_info = () => ({
  status: 'ready',
  schema_version: 'v1'
});

window.webmcp_list_tools = () => [
  {
    name: 'data_query_brew_experiment',
    description: 'Query brew experiments',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        status: { type: 'string' }
      }
    }
  },
  {
    name: 'data_create_brew_experiment',
    description: 'Create brew experiment',
    inputSchema: {
      type: 'object',
      properties: {
        record: { type: 'object' }
      },
      required: ['record']
    }
  },
  {
    name: 'data_update_brew_experiment',
    description: 'Update brew experiment',
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
    name: 'data_delete_brew_experiment',
    description: 'Delete brew experiment',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' }
      },
      required: ['id']
    }
  },
  {
    name: 'editor_select_forecast_ribbon_record',
    description: 'Select record in forecast ribbon',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' }
      },
      required: ['id']
    }
  },
  {
    name: 'editor_adjust_forecast_ribbon_record',
    description: 'Adjust forecast ribbon record',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        adjustedDose: { type: 'number' },
        adjustedRatio: { type: 'number' }
      },
      required: ['id', 'adjustedDose', 'adjustedRatio']
    }
  },
  {
    name: 'editor_undo_forecast_ribbon_record',
    description: 'Undo last mutation',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'artifact_export_session_json',
    description: 'Export session JSON',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'artifact_import_session_json',
    description: 'Import session JSON',
    inputSchema: {
      type: 'object',
      properties: {
        session: { type: 'object' }
      },
      required: ['session']
    }
  },
  {
    name: 'artifact_query_session',
    description: 'Query session artifact',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'artifact_clear_session',
    description: 'Clear session',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];

window.webmcp_invoke_tool = (name: string, args: any) => {
  const store = useStore.getState();

  switch (name) {
    case 'data_query_brew_experiment':
      if (args.id) return store.records.find(r => r.id === args.id);
      if (args.status) return store.records.filter(r => r.status === args.status);
      return store.records;

    case 'data_create_brew_experiment':
      store.addRecord(args.record);
      return { success: true };

    case 'data_update_brew_experiment':
      store.updateRecord(args.id, args.updates);
      return { success: true };

    case 'data_delete_brew_experiment':
      store.deleteRecord(args.id);
      return { success: true };

    case 'editor_select_forecast_ribbon_record':
      const record = store.records.find(r => r.id === args.id);
      if (record) {
        store.setForecastRibbonState(args.id, {
          adjustedDose: record.dose,
          adjustedRatio: isNaN(record.yield / record.dose) ? 15 : record.yield / record.dose,
          projectedYield: record.yield,
          projectedTds: 1.35,
          projectedExt: 20.5,
          status: 'selected'
        });
        return { success: true };
      }
      return { success: false, error: 'Record not found' };

    case 'editor_adjust_forecast_ribbon_record':
      const projectedYield = args.adjustedDose * args.adjustedRatio;

      if (args.adjustedDose <= 0 || args.adjustedRatio <= 0 || projectedYield > 2000) {
        const r = store.records.find(r => r.id === args.id);
        if (r && r.forecastRibbonState) {
            store.setForecastRibbonState(args.id, {
            ...r.forecastRibbonState,
            adjustedDose: args.adjustedDose,
            adjustedRatio: args.adjustedRatio,
            projectedYield: 0,
            status: 'conflict'
            });
            return { success: true, status: 'conflict' };
        }
      }

      store.setForecastRibbonState(args.id, {
        adjustedDose: args.adjustedDose,
        adjustedRatio: args.adjustedRatio,
        projectedYield,
        projectedTds: 1.35 + (args.adjustedDose / 100),
        projectedExt: 20.5 + (args.adjustedRatio / 10),
        status: 'changed'
      });
      return { success: true, status: 'changed' };

    case 'editor_undo_forecast_ribbon_record':
      store.undoLastMutation();
      return { success: true };

    case 'artifact_export_session_json':
      return store.exportSession();

    case 'artifact_import_session_json':
      store.importSession(args.session);
      return { success: true };


    case 'artifact_query_session':
      return store.exportSession();

    case 'artifact_clear_session':
      store.clearSession();
      return { success: true };

    default:
      throw new Error(`Tool ${name} not found`);
  }
};
