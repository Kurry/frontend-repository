import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

export function PriorityMatrix({ tasks, blocks, onTaskMove, onDragStart }) {
  const quadrants = [
    { id: 'ui', title: 'Urgent & Important', u: true, i: true, className: 'bg-red-50' },
    { id: 'ni', title: 'Not Urgent & Important', u: false, i: true, className: 'bg-yellow-50' },
    { id: 'un', title: 'Urgent & Not Important', u: true, i: false, className: 'bg-blue-50' },
    { id: 'nn', title: 'Not Urgent & Not Important', u: false, i: false, className: 'bg-gray-50' },
  ];

  const [expanded, setExpanded] = useState(new Set());

  const toggleExpand = (id) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full p-4">
      {quadrants.map(q => {
        const quadrantTasks = tasks.filter(t => t.urgency === q.u && t.importance === q.i && !t.parent);

        return (
          <div
            key={q.id}
            className={cn("p-4 rounded-xl border min-h-[200px] flex flex-col gap-2 relative", q.className)}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              const taskId = e.dataTransfer.getData('taskId');
              if (taskId) onTaskMove(taskId, q.u, q.i);
            }}
          >
            <h3 className="font-semibold text-sm mb-2 opacity-80">{q.title}</h3>
            {quadrantTasks.map(t => (
              <TaskCard
                key={t.id}
                task={t}
                allTasks={tasks}
                blocks={blocks}
                onDragStart={onDragStart}
                expanded={expanded.has(t.id)}
                onToggleExpand={() => toggleExpand(t.id)}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

function TaskCard({ task, allTasks, blocks, onDragStart, expanded, onToggleExpand }) {
  const hasChildren = task.children && task.children.length > 0;

  // A parent cannot be scheduled if it has unscheduled leaf children
  // (In a real implementation we'd check blocks vs children duration)
  const isParent = hasChildren;
  const isScheduled = blocks.some(b => b.taskId === task.id);

  return (
    <motion.div
      layout
      draggable={!isScheduled}
      onDragStart={e => {
        e.dataTransfer.setData('taskId', task.id);
        if (onDragStart) onDragStart(task);
      }}
      className={cn(
        "p-3 bg-white rounded-lg border shadow-sm cursor-grab active:cursor-grabbing",
        isScheduled && "opacity-50 grayscale pointer-events-none"
      )}
    >
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium text-sm">{task.title}</h4>
          <p className="text-xs text-gray-500 mt-1">
            Load: {task.load} | Dur: {task.duration * 15}m {task.splittable ? '(Split)' : ''}
          </p>
        </div>
        {isParent && (
          <button onClick={onToggleExpand} className="text-xs font-semibold px-2 py-1 bg-gray-100 rounded">
            {expanded ? '-' : '+'}
          </button>
        )}
      </div>

      {expanded && isParent && (
        <div className="mt-2 pl-2 border-l-2 border-gray-200 flex flex-col gap-2">
          {task.children.map(childId => {
            const childTask = allTasks.find(t => t.id === childId);
            return childTask ? (
              <div key={childId} className="p-2 bg-gray-50 border rounded text-xs">
                {childTask.title} (L:{childTask.load}, D:{childTask.duration*15}m)
              </div>
            ) : null;
          })}
        </div>
      )}
    </motion.div>
  );
}
