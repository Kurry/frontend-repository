import { useBacklogStore } from '../store';
import { FastForward, Clock } from 'lucide-react';

export function ClockDecay() {
  const { logicalClockDays, setLogicalClockDays, tasks, contextCards, edges, allocations } = useBacklogStore();

  // Calculate a mock risk/decay field
  const computeRisk = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return 0;

    let risk = 0;
    const taskEdges = edges.filter(e => e.sourceId === taskId || e.targetId === taskId);
    const boundCards = task.contextBindingIds.map(id => contextCards.find(c => c.id === id)).filter(Boolean) as any[];

    // Stale context increases risk
    boundCards.forEach(c => {
      if (logicalClockDays > c.freshnessHorizonDays) {
        risk += 15; // Stale penalty
      }
    });

    // High effort increases risk over time
    risk += task.effort * 2;

    // Dependencies increase risk
    risk += taskEdges.length * 5;

    // Priority reduces risk of ignoring it
    const priority = allocations.find(a => a.taskId === taskId)?.points || 0;
    risk += priority;

    return risk;
  };

  const activeTasks = tasks.filter(t => ['active', 'planned'].includes(t.status)).slice(0, 5);

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-md">
      <div className="flex justify-between items-center bg-muted p-4 rounded-md">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><Clock /> Logical Clock & Decay</h2>
          <p className="text-sm text-muted-foreground">Advance time to observe freshness decay and risk accumulation.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-2xl font-mono bg-card px-4 py-2 rounded shadow-sm border">Day {logicalClockDays}</div>
          <button
            onClick={() => setLogicalClockDays(logicalClockDays + 5)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded hover:opacity-90"
          >
            <FastForward className="w-4 h-4" /> +5 Days
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeTasks.map(task => {
          const risk = computeRisk(task.id);
          const riskBand = risk > 40 ? 'High' : (risk > 20 ? 'Medium' : 'Low');
          const color = risk > 40 ? 'text-destructive bg-destructive/10 border-destructive' : (risk > 20 ? 'text-orange-600 bg-orange-100 border-orange-300' : 'text-green-600 bg-green-100 border-green-300');

          return (
            <div key={task.id} className={`p-4 border rounded-md ${color}`}>
              <div className="flex justify-between font-bold">
                <span>{task.id}</span>
                <span>Risk: {riskBand} ({risk})</span>
              </div>
              <p className="text-sm mt-2">{task.outcome}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
