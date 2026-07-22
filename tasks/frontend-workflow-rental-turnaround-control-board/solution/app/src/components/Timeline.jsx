import React, { useState } from 'react';
import { useStore } from '../store/useStore';

export function Timeline() {
  const tasks = useStore((state) => state.tasks);
  const updateTask = useStore((state) => state.updateTask);
  const logicalClock = useStore((state) => state.logicalClock);
  const createTask = useStore((state) => state.createTask);
  const selectedFixtures = useStore((state) => state.selectedFixtures);

  const workers = ['Alice', 'Bob', 'Charlie'];
  const days = [1, 2, 3, 4, 5, 6, 7];

  const handleCreateTask = () => {
    if (selectedFixtures.length === 0) return;
    createTask({
      title: `Fix ${selectedFixtures.join(', ')}`,
      assignee: workers[0],
      startDay: logicalClock,
      duration: 1,
      fixtures: selectedFixtures
    });
  };

  return (
    <div className="border border-border rounded-lg bg-card p-4 flex flex-col h-64">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Turnaround Timeline</h3>
        <div className="flex items-center gap-4">
          <div className="text-sm">Day {logicalClock}</div>
          <button
            onClick={handleCreateTask}
            disabled={selectedFixtures.length === 0}
            className="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm disabled:opacity-50"
          >
            Create Task
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="min-w-[800px] h-full flex flex-col">
          <div className="flex border-b border-border pb-2 mb-2 shrink-0">
            <div className="w-32 font-medium text-sm text-muted-foreground">Worker</div>
            <div className="flex-1 flex justify-between text-xs text-muted-foreground relative">
              {days.map(day => (
                <div key={day} className="flex-1 text-center border-l border-border first:border-0 relative">
                   <span className={day === logicalClock ? 'font-bold text-primary' : ''}>Day {day}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-2">
            {workers.map((worker) => (
              <div key={worker} className="flex items-center flex-1 min-h-[40px] relative">
                <div className="w-32 text-sm font-medium">{worker}</div>
                <div className="flex-1 relative h-full bg-muted/20 rounded border border-border/50 flex">
                   {days.map(day => (
                     <div key={day} className="flex-1 border-r border-border/30 last:border-0 pointer-events-none" />
                   ))}
                   {/* Render tasks for worker */}
                   {tasks.filter(t => t.assignee === worker).map(task => {
                     // Very simple positioning
                     const leftPercent = ((task.startDay - 1) / 7) * 100;
                     const widthPercent = (task.duration / 7) * 100;

                     return (
                       <div
                         key={task.id}
                         className="absolute top-1 bottom-1 bg-primary text-primary-foreground text-xs rounded px-2 py-1 shadow-sm overflow-hidden flex items-center cursor-grab active:cursor-grabbing"
                         style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                         draggable
                         onDragEnd={(e) => {
                           // Mock drag implementation - move right
                           if (task.startDay < 7) {
                             updateTask(task.id, { startDay: task.startDay + 1 });
                           }
                         }}
                       >
                         <span className="truncate">{task.title}</span>
                       </div>
                     )
                   })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
