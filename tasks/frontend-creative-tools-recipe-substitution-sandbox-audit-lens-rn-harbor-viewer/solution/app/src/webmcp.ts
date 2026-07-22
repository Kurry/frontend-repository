import { useStore } from './store';
import { SessionSchema } from './types';

// Add globals to window for WebMCP
declare global {
  interface Window {
    webmcp_session_info: () => any;
    webmcp_list_tools: () => any[];
    webmcp_invoke_tool: (toolId: string, args: any) => any;
  }
}

window.webmcp_session_info = () => {
  return {
    version: 'zto-webmcp-v1',
    supported_modules: ['entity-collection-v1', 'structured-editor-v1', 'artifact-transfer-v1']
  };
};

window.webmcp_list_tools = () => {
  return [
    // entity-collection-v1
    {
      id: 'entity_create',
      title: 'Create Record',
      description: 'Creates a new recipe ingredient record.',
      schema: { type: 'object', properties: { name: { type: 'string' }, quantity: { type: 'number' }, unit: { type: 'string' } }, required: ['name', 'quantity', 'unit'] }
    },
    {
      id: 'entity_select',
      title: 'Select Record',
      description: 'Selects a record in the Audit Lens.',
      schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] }
    },
    {
      id: 'entity_update',
      title: 'Update Record',
      description: 'Updates a recipe ingredient record.',
      schema: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, quantity: { type: 'number' }, unit: { type: 'string' } }, required: ['id'] }
    },
    {
      id: 'entity_delete',
      title: 'Delete Record',
      description: 'Deletes a recipe ingredient record.',
      schema: { type: 'object', properties: { id: { type: 'string' }, confirm: { type: 'boolean' } }, required: ['id', 'confirm'] }
    },
    {
      id: 'entity_reorder',
      title: 'Reorder Record',
      description: 'Reorders a recipe ingredient record.',
      schema: { type: 'object', properties: { id: { type: 'string' }, newIndex: { type: 'number' } }, required: ['id', 'newIndex'] }
    },

    // structured-editor-v1
    {
      id: 'editor_update_property',
      title: 'Update Evidence and Resolve Discrepancy',
      description: 'Attaches evidence and resolves discrepancy for a selected record.',
      schema: { type: 'object', properties: { id: { type: 'string' }, evidence: { type: 'string' } }, required: ['id', 'evidence'] }
    },
    {
      id: 'editor_select',
      title: 'Select Record (Editor)',
      description: 'Selects a record in the Audit Lens.',
      schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] }
    },

    // artifact-transfer-v1
    {
      id: 'artifact_export',
      title: 'Export Session',
      description: 'Exports the current session.',
      schema: { type: 'object', properties: {} }
    },
    {
      id: 'artifact_import',
      title: 'Import Session',
      description: 'Imports a session.',
      schema: { type: 'object', properties: { session: { type: 'object' } }, required: ['session'] }
    },
    {
      id: 'artifact_copy',
      title: 'Copy Derived State',
      description: 'Returns the current derived state summary.',
      schema: { type: 'object', properties: {} }
    }
  ];
};

window.webmcp_invoke_tool = (toolId: string, args: any) => {
  const store = useStore.getState();

  try {
    switch (toolId) {
      // entity-collection-v1
      case 'entity_create':
        store.addRecord(args);
        return { success: true, message: 'Record created' };
      case 'entity_select':
      case 'editor_select':
        store.setActiveSelection(args.id);
        return { success: true, message: 'Record selected' };
      case 'entity_update':
        store.updateRecord(args.id, args);
        return { success: true, message: 'Record updated' };
      case 'entity_delete':
        if (!args.confirm) throw new Error('Confirmation required');
        store.deleteRecord(args.id);
        return { success: true, message: 'Record deleted' };
      case 'entity_reorder':
        store.reorderRecord(args.id, args.newIndex);
        return { success: true, message: 'Record reordered' };

      // structured-editor-v1
      case 'editor_update_property':
        store.attachEvidenceAndResolve(args.id, args.evidence);
        return { success: true, message: 'Evidence attached and discrepancy resolved' };

      // artifact-transfer-v1
      case 'artifact_export':
        return { success: true, data: store.getSession() };
      case 'artifact_import':
        const parsed = SessionSchema.parse(args.session);
        store.importSession(parsed);
        return { success: true, message: 'Session imported successfully' };
      case 'artifact_copy':
        return { success: true, data: store.getDerivedState() };

      default:
        throw new Error(`Tool ${toolId} not found`);
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown error' };
  }
};
