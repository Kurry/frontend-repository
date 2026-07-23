import { useStore } from './store';

export const initWebMCP = () => {
  (window as any).webmcp_session_info = () => ({
    status: 'ready',
    version: '1.0'
  });

  (window as any).webmcp_list_tools = () => [
    {
      name: 'get_state',
      description: 'Get canonical state',
      inputSchema: { type: 'object', properties: {} }
    },
    {
      name: 'move_allocation',
      description: 'Move an allocation knot',
      inputSchema: {
        type: 'object',
        properties: {
          knotId: { type: 'string' },
          toSessionId: { type: 'string' },
          toOrder: { type: 'number' },
          toOffsetMinutes: { type: 'number' },
          minutes: { type: 'number' },
          logicalAt: { type: 'string' }
        },
        required: ['knotId', 'toSessionId', 'toOrder', 'toOffsetMinutes', 'minutes', 'logicalAt']
      }
    },
    {
      name: 'fork_scenario',
      description: 'Fork branch',
      inputSchema: { type: 'object', properties: { fromId: { type: 'string' }, toId: { type: 'string' } }, required: ['fromId', 'toId'] }
    },
    {
      name: 'start_rehearsal',
      description: 'Start rehearsal',
      inputSchema: { type: 'object', properties: {} }
    },
    {
      name: 'approve_plan',
      description: 'Approve plan',
      inputSchema: { type: 'object', properties: {} }
    }
  ];

  (window as any).webmcp_invoke_tool = async (name: string, args: any) => {
    const store = useStore.getState();

    switch (name) {
      case 'get_state':
        return store;
      case 'move_allocation':
        store.moveAllocation(args.knotId, args.toSessionId, args.toOrder, args.toOffsetMinutes, args.minutes, args.logicalAt);
        return { success: true };
      case 'fork_scenario':
        store.forkScenario(args.fromId, args.toId);
        return { success: true };
      case 'start_rehearsal':
        store.startRehearsal();
        return { success: true };
      case 'approve_plan':
        store.approvePlan();
        return { success: true };
      default:
        throw new Error(`Tool not found: ${name}`);
    }
  };
};
