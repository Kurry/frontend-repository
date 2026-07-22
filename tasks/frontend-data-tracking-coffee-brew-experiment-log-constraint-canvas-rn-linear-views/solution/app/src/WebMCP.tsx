export const initializeWebMCP = () => {
  (window as any).webmcp_session_info = () => ({
    status: 'ready',
    api_version: '1.0.0',
    capabilities: ['tools']
  });

  (window as any).webmcp_list_tools = () => ([
    {
      name: 'crud_experiment',
      description: 'Create, update, or delete an experiment.',
      inputSchema: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['create', 'update', 'delete'] },
          id: { type: 'string' },
          name: { type: 'string' },
          notes: { type: 'string' }
        },
        required: ['action']
      }
    },
    {
      name: 'query_state',
      description: 'Get the current experiments and history state.',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'mutate_canvas',
      description: 'Drag selected record to a constraint lane and optionally resolve.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          newLane: { type: 'string', enum: ['temperature', 'grindSize', 'brewTime'] },
          resolveConflict: { type: 'boolean' }
        },
        required: ['id', 'newLane']
      }
    },
    {
      name: 'file_operations',
      description: 'Import or export a brew experiment JSON artifact.',
      inputSchema: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['import', 'export'] },
          fileContent: { type: 'string', description: 'JSON string content to import' }
        },
        required: ['action']
      }
    }
  ]);

  (window as any).webmcp_invoke_tool = (name: string, args: any) => {
    const appActions = (window as any).__APP_ACTIONS__;
    const appState = (window as any).__APP_STATE__;

    if (!appActions || !appState) return { status: 'error', result: 'App not initialized' };

    switch (name) {
      case 'query_state':
        return { status: 'success', result: JSON.stringify(appState) };

      case 'crud_experiment':
        if (args.action === 'create') {
           const exp = {
             name: args.name || 'WebMCP Brew',
             parameters: { temperature: 93, grindSize: 15, brewTime: 180 },
             lane: 'temperature',
             notes: args.notes
           };
           appActions.handleAdd(exp);
           return { status: 'success', result: `Experiment created.` };
        } else if (args.action === 'update') {
           const updates: any = {};
           if (args.name) updates.name = args.name;
           if (args.notes) updates.notes = args.notes;
           appActions.handleUpdate(args.id, updates);
           return { status: 'success', result: `Experiment updated.` };
        } else if (args.action === 'delete') {
           appActions.handleDelete(args.id);
           return { status: 'success', result: `Experiment deleted.` };
        }
        return { status: 'error', result: `Unknown action ${args.action}` };

      case 'mutate_canvas':
        appActions.handleMove(args.id, args.newLane);
        if (args.resolveConflict) {
           appActions.handleResolve(args.id);
        }
        return { status: 'success', result: `Experiment ${args.id} moved to ${args.newLane}.` };

      case 'file_operations':
        if (args.action === 'export') {
           return { status: 'success', result: JSON.stringify(appActions.generateArtifact()) };
        } else if (args.action === 'import') {
           try {
              appActions.handleImportDirect(JSON.parse(args.fileContent));
              return { status: 'success', result: 'Import successful.' };
           } catch (e) {
              return { status: 'error', result: `Import failed: ${e}` };
           }
        }
        return { status: 'error', result: `Unknown file operation ${args.action}` };

      default:
        return { status: 'error', result: 'Unknown tool' };
    }
  };
};
