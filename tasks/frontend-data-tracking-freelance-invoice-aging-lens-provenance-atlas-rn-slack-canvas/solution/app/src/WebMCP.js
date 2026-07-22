export const registerWebMCP = (storeContext) => {
  const { data, createInvoice, updateInvoice, deleteInvoice, loadData } = storeContext;

  window.webmcp_session_info = () => ({
    contract_version: "zto-webmcp-v1",
    modules: ["entity-collection-v1", "artifact-transfer-v1"]
  });

  window.webmcp_list_tools = () => {
    return [
      {
        name: 'entity_create',
        description: 'Create a new invoice',
        parameters: { type: 'object', properties: { client: { type: 'string' }, amount: { type: 'number' }, status: { type: 'string' } }, required: ['client', 'amount'] }
      },
      {
        name: 'entity_select',
        description: 'Select an invoice',
        parameters: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] }
      },
      {
        name: 'entity_update',
        description: 'Update an invoice',
        parameters: { type: 'object', properties: { id: { type: 'string' }, updates: { type: 'object' } }, required: ['id', 'updates'] }
      },
      {
        name: 'entity_delete',
        description: 'Delete an invoice',
        parameters: { type: 'object', properties: { id: { type: 'string' }, confirm: { type: 'boolean' } }, required: ['id', 'confirm'] }
      },
      {
        name: 'artifact_export',
        description: 'Export artifact state',
        parameters: { type: 'object', properties: { format: { type: 'string' } }, required: ['format'] }
      },
      {
        name: 'artifact_import',
        description: 'Import artifact state',
        parameters: { type: 'object', properties: { data: { type: 'object' } }, required: ['data'] }
      }
    ];
  };

  window.webmcp_invoke_tool = (name, args) => {
    switch (name) {
      case 'entity_create':
        const newRecord = {
          id: `INV-${Date.now()}`,
          client: args.client,
          amount: args.amount,
          status: args.status || 'draft',
          sourceEvidence: null,
          quarantineReason: null,
          lineage: 'clean'
        };
        createInvoice(newRecord);
        return { success: true, data: newRecord };

      case 'entity_update':
        updateInvoice(args.id, args.updates);
        return { success: true };

      case 'entity_delete':
        if (!args.confirm) return { success: false, error: 'confirm=true required' };
        deleteInvoice(args.id);
        return { success: true };

      case 'entity_select':
        // For testing/WebMCP purposes, we return the entity. UI state is driven by React props.
        const record = data.records.find(r => r.id === args.id);
        return { success: true, data: record };

      case 'artifact_export':
        if (args.format !== 'invoice-aging-v1.json') return { success: false, error: 'Unknown format' };
        return { success: true, data: { ...data, exportedAt: new Date().toISOString() } };

      case 'artifact_import':
        try {
          const parsed = args.data;
          if (parsed.schemaVersion !== 'v1') throw new Error('Invalid schemaVersion');
          loadData(parsed);
          return { success: true };
        } catch (e) {
          return { success: false, error: e.message };
        }

      default:
        return { success: false, error: `Tool ${name} not found` };
    }
  };
};
