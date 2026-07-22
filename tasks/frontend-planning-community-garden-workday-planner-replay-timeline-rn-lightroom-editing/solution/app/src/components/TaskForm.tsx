import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { subscribe, getSnapshot, updateState } from '../store';
import type { RecordStatus, WorkTask, TimelineEvent } from '../types';
import { formatISO } from 'date-fns';

export function TaskForm() {
  const state = useSyncExternalStore(subscribe, getSnapshot);

  const selectedTask = state.records.find((r) => r.id === state.selectedTaskId) || null;

  const [formData, setFormData] = useState<Partial<WorkTask>>({
    title: '',
    description: '',
    status: 'draft',
    estimatedHours: 1,
    priority: 'medium',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync form with selection
  useEffect(() => {
    if (selectedTask) {
      setFormData(selectedTask);
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'draft',
        estimatedHours: 1,
        priority: 'medium',
      });
    }
    setErrors({});
  }, [selectedTask, state.activeTimelineEventId]); // Reset on active timeline change too

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required';
    }

    // Exact boundaries validation
    if (formData.estimatedHours !== undefined) {
      if (formData.estimatedHours < 0.5) {
        newErrors.estimatedHours = 'Minimum estimate is 0.5 hours';
      }
      if (formData.estimatedHours > 40) {
        newErrors.estimatedHours = 'Maximum estimate is 40 hours';
      }
    }

    // Cross-field constraint: A ready task must have a description
    if (formData.status === 'ready' && !formData.description?.trim()) {
      newErrors.description = 'Description is required for Ready status';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const now = new Date();

    if (selectedTask) {
      // Update
      const updatedTask: WorkTask = { ...selectedTask, ...(formData as WorkTask) };

      const newEvent: TimelineEvent = {
        id: `evt-${updatedTask.id}-${now.getTime()}`,
        taskId: updatedTask.id,
        timestamp: formatISO(now),
        mutationType: 'update',
        previousState: selectedTask,
        newState: updatedTask,
      };

      updateState((prev) => ({
        ...prev,
        records: prev.records.map((r) => r.id === updatedTask.id ? updatedTask : r),
        history: [...prev.history, newEvent],
        activeTimelineEventId: null,
      }));
    } else {
      // Create
      const newTask: WorkTask = {
        ...(formData as WorkTask),
        id: `task-${now.getTime()}`,
        status: formData.status as RecordStatus || 'draft',
      };

      const newEvent: TimelineEvent = {
        id: `evt-${newTask.id}-${now.getTime()}`,
        taskId: newTask.id,
        timestamp: formatISO(now),
        mutationType: 'create',
        previousState: null,
        newState: newTask,
      };

      updateState((prev) => ({
        ...prev,
        records: [...prev.records, newTask],
        history: [...prev.history, newEvent],
        selectedTaskId: newTask.id,
      }));
    }
  };

  const handleArchive = () => {
    if (!selectedTask) return;

    const now = new Date();
    const updatedTask = { ...selectedTask, status: 'archived' as RecordStatus };

    const newEvent: TimelineEvent = {
        id: `evt-${updatedTask.id}-${now.getTime()}`,
        taskId: updatedTask.id,
        timestamp: formatISO(now),
        mutationType: 'archive',
        previousState: selectedTask,
        newState: updatedTask,
      };

    updateState((prev) => ({
      ...prev,
      records: prev.records.map((r) => r.id === updatedTask.id ? updatedTask : r),
      history: [...prev.history, newEvent],
      activeTimelineEventId: null,
    }));
  };

  const handleCancelSelection = () => {
    updateState((prev) => ({ ...prev, selectedTaskId: null, activeTimelineEventId: null }));
  };

  // Disable form inputs if we are scrubbing the timeline to a past state
  const isViewingPastState = state.activeTimelineEventId !== null;

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {selectedTask ? (isViewingPastState ? 'Viewing Past State' : 'Edit Task') : 'Create Task'}
        </h2>
        {selectedTask && (
          <button
            onClick={handleCancelSelection}
            className="text-sm text-gray-500 hover:text-gray-700 font-medium"
          >
            Create New
          </button>
        )}
      </div>

      <div className="space-y-4 flex-1">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${errors.title ? 'border-red-300 ring-red-500' : 'border-gray-300'}`}
            value={formData.title || ''}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            disabled={isViewingPastState}
            placeholder="e.g. Weed the tomato beds"
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            value={formData.status || 'draft'}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as RecordStatus })}
            disabled={isViewingPastState}
          >
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="changed">Changed</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            rows={4}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${errors.description ? 'border-red-300 ring-red-500' : 'border-gray-300'}`}
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            disabled={isViewingPastState}
            placeholder="Detailed instructions..."
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
            <input
              type="number"
              step="0.5"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${errors.estimatedHours ? 'border-red-300 ring-red-500' : 'border-gray-300'}`}
              value={formData.estimatedHours || ''}
              onChange={(e) => setFormData({ ...formData, estimatedHours: parseFloat(e.target.value) })}
              disabled={isViewingPastState}
            />
            {errors.estimatedHours && <p className="mt-1 text-sm text-red-600">{errors.estimatedHours}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={formData.priority || 'medium'}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              disabled={isViewingPastState}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end gap-3">
        {selectedTask && !isViewingPastState && selectedTask.status !== 'archived' && (
          <button
            onClick={handleArchive}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
          >
            Archive
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={isViewingPastState}
          className={`px-4 py-2 rounded-md font-medium text-white shadow-sm ${
            isViewingPastState ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {selectedTask ? 'Save Changes' : 'Create Task'}
        </button>
      </div>
    </div>
  );
}
