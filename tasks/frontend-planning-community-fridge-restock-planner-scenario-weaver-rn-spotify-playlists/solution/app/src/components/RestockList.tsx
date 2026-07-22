import React, { useState } from 'react';
import type { RestockTask, RestockStatus } from '../types';
import { Edit2, Trash2, GitBranch, Archive } from 'lucide-react';
import clsx from 'clsx';

interface RestockListProps {
  tasks: RestockTask[];
  onEdit: (task: RestockTask) => void;
  onDelete: (id: string) => void;
  onBranch: (task: RestockTask) => void;
  onArchive: (task: RestockTask) => void;
}

const statusColors: Record<RestockStatus, string> = {
  draft: 'bg-gray-100 text-gray-800 border-gray-200',
  ready: 'bg-green-100 text-green-800 border-green-200',
  changed: 'bg-blue-100 text-blue-800 border-blue-200',
  archived: 'bg-purple-100 text-purple-800 border-purple-200'
};

export const RestockList: React.FC<RestockListProps> = ({ tasks, onEdit, onDelete, onBranch, onArchive }) => {
  const [filter, setFilter] = useState<RestockStatus | 'all'>('all');

  const filteredTasks = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  return (
    <div className="flex-1 overflow-auto p-6 bg-gray-50 h-full">
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {(['all', 'draft', 'ready', 'changed', 'archived'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              filter === f
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            )}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center p-8 bg-white rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500 font-medium">No tasks found in this view.</p>
          <p className="text-gray-400 text-sm mt-1">Adjust your filters or create a new task.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map(task => (
            <div
              key={task.id}
              className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden"
            >
              {task.scenarioState && (
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
              )}
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">{task.name}</h3>
                    <span className={clsx("px-2 py-0.5 rounded-full text-xs font-medium border", statusColors[task.status])}>
                      {task.status}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mt-1">
                    {task.quantity} {task.unit} • {task.itemCategory}
                  </p>
                  {task.scenarioState && (
                    <div className="mt-2 text-xs text-blue-600 flex items-center gap-1">
                      <GitBranch className="w-3 h-3" />
                      Branched from scenario (Changes: {task.scenarioState.changes.length})
                    </div>
                  )}
                </div>
                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                  <button
                    onClick={() => onBranch(task)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                    title="Branch Scenario"
                    aria-label="Branch Scenario"
                  >
                    <GitBranch className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEdit(task)}
                    className="p-1.5 text-gray-600 hover:bg-gray-50 rounded"
                    title="Edit Task"
                    aria-label="Edit Task"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {task.status !== 'archived' && (
                    <button
                      onClick={() => onArchive(task)}
                      className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
                      title="Archive Task"
                      aria-label="Archive Task"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(task.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    title="Delete Task"
                    aria-label="Delete Task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
