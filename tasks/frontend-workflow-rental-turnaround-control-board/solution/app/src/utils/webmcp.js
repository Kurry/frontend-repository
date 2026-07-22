import { useStore } from '../store/useStore';

export function setupWebMCP() {
  if (typeof window === 'undefined') return;

  window.webmcp_listTools = () => {
    return [
      { name: "getFixtureData", description: "Get fixture baseline data for the unit", parameters: { type: "object", properties: {} } },
      { name: "export_turnaround", description: "Export current turnaround state as JSON", parameters: { type: "object", properties: {} } },
      { name: "reset_state", description: "Reset application to initial state", parameters: { type: "object", properties: {} } }
    ];
  };

  window.webmcp_invokeTool = (name, args) => {
    const state = useStore.getState();

    switch (name) {
      case 'getFixtureData':
        return {
          unit: "Unit 402",
          fixtures: state.fixtures,
          rooms: state.rooms,
          observations: state.observations
        };
      case 'export_turnaround':
        return {
          tasks: state.tasks,
          edges: state.edges,
          inventory: state.inventory,
          keys: state.keys,
          custodyEvents: state.custodyEvents,
          branches: state.branches,
          approvals: state.approvals,
          handoffs: state.handoffs,
          logicalClock: state.logicalClock
        };
      case 'reset_state':
        state.resetState();
        return { success: true };
      default:
        throw new Error(`Tool ${name} not found`);
    }
  };
}
