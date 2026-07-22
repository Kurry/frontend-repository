import React, { useSyncExternalStore } from 'react';
import { subscribe, getSnapshot, updateState } from '../store';
import type { TimelineEvent, WorkTask } from '../types';
import { formatISO } from 'date-fns';

export function ReplayTimeline() {
  const state = useSyncExternalStore(subscribe, getSnapshot);

  const selectedTask = state.records.find((r) => r.id === state.selectedTaskId) || null;
  const history = state.history.filter((h) => h.taskId === state.selectedTaskId);

  if (!selectedTask) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-center justify-center h-48 text-gray-500">
        Select a task to view its replay timeline
      </div>
    );
  }

  // The signature interaction: scrub a selected record through its timeline and restore a prior checkpoint
  const handleRestore = (event: TimelineEvent) => {
    if (!event.newState) return;

    // We update the record to match the newState of the selected event
    const now = new Date();

    // Check if we are already viewing a past state; if so, we commit it. If not, we just restore to that point.
    // Actually, "restore a prior checkpoint" means we make that prior state the current active state.
    const newHistoryEvent: TimelineEvent = {
        id: `evt-${selectedTask.id}-restore-${now.getTime()}`,
        taskId: selectedTask.id,
        timestamp: formatISO(now),
        mutationType: 'restore',
        previousState: selectedTask,
        newState: event.newState,
    };

    updateState((prev) => ({
      ...prev,
      records: prev.records.map((r) => r.id === selectedTask.id ? event.newState : r),
      history: [...prev.history, newHistoryEvent],
      activeTimelineEventId: null, // Exit preview mode once restored
    }));
  };

  const handlePreview = (eventId: string) => {
    if (state.activeTimelineEventId === eventId) {
      updateState((prev) => ({ ...prev, activeTimelineEventId: null }));
    } else {
      updateState((prev) => ({ ...prev, activeTimelineEventId: eventId }));
    }
  };

  // Undo the last mutation
  const handleUndo = () => {
    // Find the last mutation for the whole app
    const lastEvent = state.history[state.history.length - 1];
    if (!lastEvent || !lastEvent.previousState) return;

    // Restore the record to previousState, and remove this event from history
    const restoredRecord = lastEvent.previousState as WorkTask;

    updateState((prev) => ({
      ...prev,
      records: prev.records.map((r) => r.id === restoredRecord.id ? restoredRecord : r),
      // Actually pop the last history event to simulate a true undo
      history: prev.history.slice(0, prev.history.length - 1),
      activeTimelineEventId: null,
      selectedTaskId: restoredRecord.id, // focus it
    }));
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col h-full max-h-[600px]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Replay Timeline</h2>
        <button
          onClick={handleUndo}
          disabled={state.history.length === 0 || !state.history[state.history.length - 1].previousState}
          className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded disabled:opacity-50"
          title="Undo the last global mutation"
        >
          Undo Last Action
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Scrub through history to preview past states. Click Restore to rollback.
      </p>

      <div className="flex-1 overflow-y-auto pr-2 relative">
        <div className="absolute top-0 bottom-0 left-4 w-0.5 bg-gray-200"></div>
        <div className="space-y-6">
          {history.map((event, index) => {
            const date = new Date(event.timestamp);
            const isPreviewing = state.activeTimelineEventId === event.id;
            const isLatest = index === history.length - 1;

            return (
              <div key={event.id} className="relative pl-10">
                <div className={`absolute left-[11px] top-1.5 w-3 h-3 rounded-full border-2 ${
                  isLatest ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'
                }`}></div>

                <div
                  className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                    isPreviewing
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handlePreview(event.id)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm text-gray-900 capitalize">
                      {event.mutationType}
                    </span>
                    <span className="text-xs text-gray-500">
                      {date.toLocaleDateString()} {date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 mb-2">
                    Status: <span className="font-medium">{event.newState.status}</span>
                  </div>

                  {(isPreviewing && !isLatest) && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestore(event);
                        }}
                        className="w-full text-center px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
                      >
                        Restore this checkpoint
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
