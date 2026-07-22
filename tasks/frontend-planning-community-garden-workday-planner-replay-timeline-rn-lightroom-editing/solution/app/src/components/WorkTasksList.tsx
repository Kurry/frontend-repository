import React, { useSyncExternalStore } from 'react';
import { subscribe, getSnapshot, updateState } from '../store';
import type { RecordStatus, WorkTask } from '../types';

export function WorkTasksList() {
  const state = useSyncExternalStore(subscribe, getSnapshot);
  const records = state.records;
  const filterStatus = state.filterStatus;

  const filteredRecords = filterStatus === 'all'
    ? records
    : records.filter((r) => r.status === filterStatus);

  const handleSelect = (taskId: string) => {
    updateState((prev) => ({
      ...prev,
      selectedTaskId: taskId,
      activeTimelineEventId: null, // Reset active event when selecting a new task
    }));
  };

  const handleFilterChange = (status: RecordStatus | 'all') => {
    updateState((prev) => ({ ...prev, filterStatus: status }));
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Work Tasks</h2>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {(['all', 'draft', 'ready', 'changed', 'archived'] as const).map((status) => (
            <button
              key={status}
              onClick={() => handleFilterChange(status)}
              className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No tasks found.</div>
        ) : (
          filteredRecords.map((task) => (
            <div
              key={task.id}
              onClick={() => handleSelect(task.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelect(task.id);
                }
              }}
              tabIndex={0}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                state.selectedTaskId === task.id
                  ? 'border-blue-500 bg-blue-50 shadow-sm ring-1 ring-blue-500'
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-sm bg-white'
              }`}
              role="button"
              aria-pressed={state.selectedTaskId === task.id}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-gray-900 truncate pr-2">{task.title}</h3>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  task.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                  task.status === 'ready' ? 'bg-green-100 text-green-800' :
                  task.status === 'changed' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {task.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 line-clamp-2">{task.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
