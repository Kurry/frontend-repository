import { useBacklogStore } from '../store';

export function WipPlanner() {
  const { tasks, updateTaskStatus } = useBacklogStore();

  const activeTasks = tasks.filter(t => t.status === 'active');
  const plannedTasks = tasks.filter(t => t.status === 'planned');
  const archivedTasks = tasks.filter(t => t.status === 'archived');

  const dailyCapacity = 10;
  const currentWip = activeTasks.reduce((sum, t) => sum + t.effort, 0);

  const handleStart = (taskId: string, effort: number) => {
    if (currentWip + effort > dailyCapacity) {
      alert("WIP Capacity exceeded!");
      return;
    }
    updateTaskStatus(taskId, 'active');
  };

  const handleRevive = (taskId: string) => {
    // Revival requires context/evidence repair
    updateTaskStatus(taskId, 'draft');
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-md">
      <h2 className="text-xl font-bold">WIP & Schedule Planner</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Planned */}
        <div className="border p-2 rounded bg-muted">
          <h3 className="font-semibold mb-2">Planned</h3>
          <div className="flex flex-col gap-2">
            {plannedTasks.map(t => (
              <div key={t.id} className="bg-card p-2 rounded border text-sm">
                <div className="font-bold">{t.id} (Effort: {t.effort})</div>
                <button onClick={() => handleStart(t.id, t.effort)} className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded mt-2">Start Work</button>
              </div>
            ))}
          </div>
        </div>

        {/* Active WIP */}
        <div className="border p-2 rounded bg-muted">
          <h3 className="font-semibold mb-2 flex justify-between">
            <span>Active WIP</span>
            <span className={currentWip > dailyCapacity ? 'text-destructive' : ''}>{currentWip} / {dailyCapacity}</span>
          </h3>
          <div className="flex flex-col gap-2">
            {activeTasks.map(t => (
              <div key={t.id} className="bg-card p-2 rounded border border-primary text-sm">
                <div className="font-bold">{t.id}</div>
                <button onClick={() => updateTaskStatus(t.id, 'complete')} className="text-xs bg-green-600 text-white px-2 py-1 rounded mt-2 mr-2">Complete</button>
                <button onClick={() => updateTaskStatus(t.id, 'paused')} className="text-xs bg-orange-500 text-white px-2 py-1 rounded mt-2">Pause</button>
              </div>
            ))}
          </div>
        </div>

        {/* Archived/Revival */}
        <div className="border p-2 rounded bg-muted opacity-80">
          <h3 className="font-semibold mb-2">Archive Lineage</h3>
          <div className="flex flex-col gap-2">
            {archivedTasks.slice(0, 5).map(t => (
              <div key={t.id} className="bg-card p-2 rounded border text-sm">
                <div className="font-bold line-through">{t.id}</div>
                <button onClick={() => handleRevive(t.id)} className="text-xs border border-primary text-primary px-2 py-1 rounded mt-2">Revive to Draft</button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
