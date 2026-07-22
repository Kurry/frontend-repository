import { useState } from 'react';
import { useBacklogStore } from '../store';
import type { Task } from '../types';

export function TriageSession() {
  const { tasks, updateTaskTriage, updateTaskStatus } = useBacklogStore();
  const [queue, setQueue] = useState<Task[]>([]);

  // Quick logic to get un-triaged active/planned
  const initQueue = () => {
    setQueue(tasks.filter(t => ['draft', 'active', 'planned'].includes(t.status) && !t.triageRationale).slice(0, 10));
  };

  const handleDecision = (taskId: string, decision: string, rationale: string, extra?: any) => {
    updateTaskTriage(taskId, 'batch-1', rationale, extra?.date);
    if (decision === 'archive') updateTaskStatus(taskId, 'archived');
    if (decision === 'waiting') updateTaskStatus(taskId, 'waiting');

    setQueue(q => q.filter(t => t.id !== taskId));
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-md">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Triage Session</h2>
        <button onClick={initQueue} className="bg-primary text-primary-foreground px-4 py-2 rounded">Load Queue</button>
      </div>

      {queue.length === 0 ? (
        <p className="text-muted-foreground text-sm">Queue is empty.</p>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm font-bold">{queue.length} tasks in current session</p>
          <div className="border p-4 rounded bg-card flex flex-col gap-3">
            <h3 className="font-semibold">{queue[0].outcome}</h3>
            <p className="text-sm text-muted-foreground">{queue[0].nextAction}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
              <button onClick={() => handleDecision(queue[0].id, 'schedule', 'Looks good to do soon')} className="border p-2 rounded hover:bg-accent text-sm">Do Next</button>
              <button onClick={() => handleDecision(queue[0].id, 'defer', 'Not a priority right now', { date: '2024-05-01' })} className="border p-2 rounded hover:bg-accent text-sm">Defer</button>
              <button onClick={() => handleDecision(queue[0].id, 'delegate', 'Passed to team')} className="border p-2 rounded hover:bg-accent text-sm">Delegate</button>
              <button onClick={() => handleDecision(queue[0].id, 'archive', 'Stale, archiving')} className="border p-2 rounded hover:bg-destructive/10 text-destructive text-sm">Archive</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
