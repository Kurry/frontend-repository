import { useBacklogStore } from '../store';
import type { Task, ContextCard } from '../types';
import { Clock } from 'lucide-react';


export function TaskView() {
  const { tasks, contextCards, bindContext, logicalClockDays } = useBacklogStore();

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-md">
      <h2 className="text-xl font-bold">Tasks & Evidence</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.slice(0, 10).map(task => (
          <TaskCard
            key={task.id}
            task={task}
            contextCards={contextCards}
            logicalClockDays={logicalClockDays}
            onBind={(ctxId) => bindContext(task.id, ctxId)}
          />
        ))}
      </div>
    </div>
  );
}

function TaskCard({ task, contextCards, logicalClockDays, onBind }: { task: Task, contextCards: ContextCard[], logicalClockDays: number, onBind: (ctxId: string) => void }) {
  const bindings = task.contextBindingIds.map(id => contextCards.find(c => c.id === id)).filter(Boolean) as ContextCard[];

  return (
    <div className="border p-4 rounded-md shadow-sm bg-card flex flex-col gap-2">
      <div className="flex justify-between items-start">
        <h3 className="font-semibold text-lg">{task.outcome}</h3>
        <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">{task.status}</span>
      </div>
      <p className="text-sm text-muted-foreground">{task.nextAction}</p>

      <div className="text-xs flex gap-2">
        <span className="bg-secondary px-1 rounded">{task.commitmentClass}</span>
        <span className="bg-secondary px-1 rounded">Effort: {task.effort}</span>
      </div>

      <div className="mt-2 border-t pt-2">
        <h4 className="text-xs font-semibold mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Context Evidence</h4>
        {bindings.length === 0 ? (
          <p className="text-xs text-destructive">Missing Context (Review Required)</p>
        ) : (
          bindings.map(b => {
            const age = logicalClockDays; // Simplification, normally relative to binding time
            const isStale = age > b.freshnessHorizonDays;
            return (
              <div key={b.id} className={`text-xs p-1 rounded ${isStale ? 'bg-destructive/20 text-destructive' : 'bg-muted'}`}>
                {b.content} {isStale ? '(Stale)' : ''}
              </div>
            );
          })
        )}
      </div>
      <div className="mt-auto pt-2 flex gap-2">
        <select className="text-xs border p-1 rounded" onChange={(e) => { if(e.target.value) onBind(e.target.value) }} defaultValue="">
          <option value="" disabled>Bind Evidence...</option>
          {contextCards.slice(0, 5).map(c => (
            <option key={c.id} value={c.id}>{c.source} ({c.id})</option>
          ))}
        </select>
      </div>
    </div>
  );
}
