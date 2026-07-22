import { useBacklogStore } from '../store';

export function PriorityAllocator() {
  const { tasks, allocations, updateAllocation } = useBacklogStore();

  const totalAllocated = allocations.reduce((sum, a) => sum + a.points, 0);
  const reserve = 100 - totalAllocated;

  const activeTasks = tasks.filter(t => t.status !== 'archived' && t.status !== 'complete' && t.status !== 'abandoned').slice(0, 20); // limits for display

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-md">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Priority Budget Allocator</h2>
        <div className={`px-3 py-1 rounded-full font-bold ${reserve < 0 ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'}`}>
          Reserve: {reserve} / 100
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {activeTasks.map(task => {
          const allocation = allocations.find(a => a.taskId === task.id)?.points || 0;
          return (
            <div key={task.id} className="flex items-center gap-4 bg-card border p-2 rounded">
              <span className="w-24 font-mono text-sm truncate">{task.id}</span>
              <span className="w-20 text-xs bg-secondary text-center rounded">{task.commitmentClass}</span>
              <input
                type="range"
                min="0"
                max="100"
                value={allocation}
                onChange={(e) => updateAllocation(task.id, parseInt(e.target.value))}
                className="flex-1"
              />
              <input
                type="number"
                value={allocation}
                onChange={(e) => updateAllocation(task.id, parseInt(e.target.value) || 0)}
                className="w-16 border rounded p-1 text-center"
                min="0"
                max="100"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
