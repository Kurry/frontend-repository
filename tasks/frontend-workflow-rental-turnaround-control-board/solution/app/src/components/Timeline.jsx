import React from 'react';
import { useStore } from '../store';
import { Rnd } from 'react-rnd';

export const Timeline = () => {
  const tasks = useStore(state => state.tasks);
  const workers = useStore(state => state.workers);
  const edges = useStore(state => state.edges);
  const selection = useStore(state => state.selection);
  const updateTask = useStore(state => state.updateTask);
  const addTask = useStore(state => state.addTask);
  const addEdge = useStore(state => state.addEdge);
  const verifyTask = useStore(state => state.verifyTask);

  const getOverlaps = (task, workerTasks) => {
    return workerTasks.filter(t =>
      t.id !== task.id &&
      ((task.start >= t.start && task.start < t.start + t.duration) ||
      (t.start >= task.start && t.start < task.start + task.duration))
    );
  };

  return (
    <div className="w-full h-[300px] border mt-4 p-2 overflow-x-auto relative bg-white">
      <h3 className="font-bold mb-2">Work Timeline & Dependencies</h3>
      <div className="relative">
        {/* Draw edges using SVG */}
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10" style={{ minWidth: 2000 }}>
          {edges.map((edge, i) => {
            const sourceTask = tasks.find(t => t.id === edge.source);
            const targetTask = tasks.find(t => t.id === edge.target);
            if (!sourceTask || !targetTask) return null;

            const w1 = workers.findIndex(w => w.id === sourceTask.workerId);
            const w2 = workers.findIndex(w => w.id === targetTask.workerId);

            const x1 = (sourceTask.start || 0) + (sourceTask.duration || 100);
            const y1 = w1 * 64 + 32;
            const x2 = targetTask.start || 0;
            const y2 = w2 * 64 + 32;

            return (
              <path
                key={`edge-${i}`}
                d={`M ${x1} ${y1} C ${x1 + 40} ${y1}, ${x2 - 40} ${y2}, ${x2} ${y2}`}
                stroke="#9333ea"
                strokeWidth="2"
                fill="none"
                markerEnd="url(#arrowhead)"
              />
            );
          })}
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#9333ea" />
            </marker>
          </defs>
        </svg>

        {workers.map((worker) => {
          const workerTasks = tasks.filter(t => t.workerId === worker.id);
          return (
            <div key={worker.id} className="h-16 border-b flex relative" style={{ minWidth: 2000 }}>
              <div className="w-24 font-semibold text-sm pt-2 sticky left-0 bg-white z-20 border-r">{worker.name}</div>
              <div className="flex-1 relative">
                {workerTasks.map(task => {
                  const overlaps = getOverlaps(task, workerTasks);
                  const hasOverlap = overlaps.length > 0;

                  let bgColor = 'bg-blue-500';
                  if (task.status === 'dispatched') bgColor = 'bg-green-600';
                  if (task.status === 'verified') bgColor = 'bg-emerald-800';
                  if (task.status === 'delayed') bgColor = 'bg-yellow-500 text-black';
                  if (hasOverlap && task.status === 'preview') bgColor = 'bg-red-500 border-2 border-red-700';

                  return (
                    <Rnd
                      key={task.id}
                      default={{ x: task.start || 120, y: 12, width: task.duration || 100, height: 40 }}
                      onDragStop={(e, d) => updateTask(task.id, { start: d.x })}
                      onResizeStop={(e, direction, ref, delta, position) => {
                        updateTask(task.id, { duration: parseInt(ref.style.width, 10), start: position.x });
                      }}
                      bounds="parent"
                      dragGrid={[10, 1]}
                      resizeGrid={[10, 1]}
                      className={`${bgColor} text-white text-xs p-1 rounded shadow cursor-pointer transition-colors z-30 flex flex-col justify-between`}
                    >
                      <div className="font-semibold truncate">{task.name}</div>
                      <div className="text-[9px] opacity-90 truncate">
                        {task.status} | {task.locus}
                      </div>
                      {task.status === 'dispatched' && (
                        <button
                          className="absolute right-1 top-1 bg-white text-green-700 rounded-full w-4 h-4 text-[10px] leading-none"
                          onClick={(e) => { e.stopPropagation(); verifyTask(task.id); }}
                        >
                          ✓
                        </button>
                      )}
                    </Rnd>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => {
            const locus = selection.length > 0 ? selection[0] : null;
            addTask({ id: `task-${Date.now()}`, name: 'New Task', workerId: workers[0].id, start: 120, duration: 100, status: 'preview', locus });
          }}
          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors"
        >
          Add Task {selection.length > 0 ? `for ${selection[0]}` : ''}
        </button>
        <button
          onClick={() => {
             const previewTasks = tasks.filter(t => t.status === 'preview');
             if (previewTasks.length >= 2) addEdge({ source: previewTasks[0].id, target: previewTasks[1].id });
          }}
          className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded text-sm transition-colors"
        >
          Link Previews
        </button>
        <button
          onClick={() => addTask({ id: 'task-delay', name: 'Delayed Part', workerId: workers[1].id, start: 300, duration: 80, status: 'preview', locus: 'room-1' })}
          className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm transition-colors"
        >
          Add Delayed Task
        </button>
      </div>
    </div>
  );
};
