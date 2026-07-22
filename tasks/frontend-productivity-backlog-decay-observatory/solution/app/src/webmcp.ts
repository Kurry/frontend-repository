import { useBacklogStore } from './store';
import { exportToJSON, importFromJSON, exportToCSV, exportToICS, exportToSVG } from './utils/export';

export function setupWebMCP() {
  (window as any).webmcp_getState = () => useBacklogStore.getState();

  (window as any).webmcp_reset = () => {
    useBacklogStore.getState().resetToFixture();
  };

  (window as any).webmcp_exportJSON = () => exportToJSON();
  (window as any).webmcp_importJSON = (json: string) => importFromJSON(json);
  (window as any).webmcp_exportCSV = () => exportToCSV();
  (window as any).webmcp_exportICS = () => exportToICS();
  (window as any).webmcp_exportSVG = () => exportToSVG();

  (window as any).webmcp_advanceClock = (days: number) => {
    const current = useBacklogStore.getState().logicalClockDays;
    useBacklogStore.getState().setLogicalClockDays(current + days);
  };

  (window as any).webmcp_allocatePriority = (taskId: string, points: number) => {
    useBacklogStore.getState().updateAllocation(taskId, points);
  };

  (window as any).webmcp_triageDecision = (taskId: string, queue: string, rationale: string, decision: string) => {
    useBacklogStore.getState().updateTaskTriage(taskId, queue, rationale);
    if (decision === 'archive' || decision === 'waiting') {
      useBacklogStore.getState().updateTaskStatus(taskId, decision as any);
    }
  };

  (window as any).webmcp_workAction = (taskId: string, status: string) => {
    useBacklogStore.getState().updateTaskStatus(taskId, status as any);
  };
}
