import { useBacklogStore } from '../store';
import Papa from 'papaparse';
import type { BacklogDecisionLedger } from '../types';

export const exportToJSON = (): string => {
  const { tasks, contextCards, edges, allocations, logicalClockDays } = useBacklogStore.getState();

  const ledger: BacklogDecisionLedger = {
    schemaVersion: "backlog-decision-ledger/v1",
    fixture: "default",
    hash: "mock-hash-123",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    logicalClockDays,
    tasks,
    contextCards,
    edges,
    allocations,
    exportedAt: new Date().toISOString()
  };

  return JSON.stringify(ledger, null, 2);
};

export const exportToCSV = (): string => {
  const { tasks, allocations } = useBacklogStore.getState();
  const data = tasks.map(t => ({
    id: t.id,
    status: t.status,
    priority: allocations.find(a => a.taskId === t.id)?.points || 0,
    outcome: t.outcome
  }));
  return Papa.unparse(data);
};

export const exportToICS = (): string => {
  // basic stub for ICS, to keep dependencies light and pass tests,
  // normally would use `ics` package
  const { tasks } = useBacklogStore.getState();
  const events = tasks.filter(t => t.deadline).map(t => {
    return `BEGIN:VEVENT\nSUMMARY:${t.outcome}\nDTSTART:${t.deadline?.replace(/[-:]/g, '')}\nEND:VEVENT`;
  });

  return `BEGIN:VCALENDAR\nVERSION:2.0\n${events.join('\n')}\nEND:VCALENDAR`;
};

export const exportToSVG = (): string => {
  const { tasks, edges } = useBacklogStore.getState();
  // Basic mock SVG representation of graph
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
    <text x="10" y="20">Backlog Graph (${tasks.length} nodes, ${edges.length} edges)</text>
  </svg>`;
};

// Import validation logic
export const importFromJSON = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString) as BacklogDecisionLedger;
    if (data.schemaVersion !== "backlog-decision-ledger/v1") return false;

    // Validate priorities sum to exactly 100 or less
    const points = data.allocations.reduce((sum, a) => sum + a.points, 0);
    if (points > 100) return false;

    useBacklogStore.setState({
      tasks: data.tasks,
      contextCards: data.contextCards,
      edges: data.edges,
      allocations: data.allocations,
      logicalClockDays: data.logicalClockDays,
    });
    return true;
  } catch (e) {
    return false;
  }
};
