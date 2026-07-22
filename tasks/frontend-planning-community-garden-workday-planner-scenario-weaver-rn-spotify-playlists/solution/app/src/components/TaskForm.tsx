import React, { useState, useEffect } from 'react';
import { TaskRecord, TaskStatus } from '../store';

interface TaskFormProps {
  initialData?: Partial<TaskRecord>;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [estimatedHours, setEstimatedHours] = useState(initialData?.estimatedHours?.toString() || '');
  const [status, setStatus] = useState<TaskStatus>(initialData?.status || 'draft');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setEstimatedHours(initialData.estimatedHours?.toString() || '');
      setStatus(initialData.status || 'draft');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hours = parseFloat(estimatedHours);
    if (isNaN(hours) || hours <= 0 || hours > 24) {
      setError('Estimated hours must be > 0 and <= 24.');
      return;
    }
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    setError(null);
    onSubmit({
      title,
      description,
      estimatedHours: hours,
      status
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4 border rounded shadow-sm bg-white">
      <h3 className="font-bold text-lg">{initialData ? 'Edit Task' : 'New Task'}</h3>
      {error && <div className="text-red-500 text-sm p-2 bg-red-50 rounded border border-red-200">{error}</div>}

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="border rounded px-3 py-2"
          placeholder="Task Title"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="border rounded px-3 py-2"
          placeholder="Task Description"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Estimated Hours</label>
        <input
          type="number"
          step="0.5"
          value={estimatedHours}
          onChange={e => setEstimatedHours(e.target.value)}
          className="border rounded px-3 py-2"
          placeholder="e.g. 2.5"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Status</label>
        <select
          value={status}
          onChange={e => setStatus(e.target.value as TaskStatus)}
          className="border rounded px-3 py-2"
        >
          <option value="empty">Empty</option>
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="changed">Changed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="flex gap-2 justify-end mt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
      </div>
    </form>
  );
};
