import React, { useState, useEffect } from 'react';
import type { EnergyReading, ReadingStatus } from '../types';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ReadingFormProps {
  initialData?: EnergyReading | null;
  existingIds: string[];
  onSubmit: (record: EnergyReading) => void;
  onCancel: () => void;
  className?: string;
}

export function ReadingForm({ initialData, existingIds, onSubmit, onCancel, className }: ReadingFormProps) {
  const [id, setId] = useState(initialData?.id ?? '');
  const [value, setValue] = useState(initialData?.value?.toString() ?? '');
  const [status, setStatus] = useState<ReadingStatus>(initialData?.status ?? 'draft');
  const [notes, setNotes] = useState(initialData?.notes ?? '');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setId(initialData.id);
      setValue(initialData.value.toString());
      setStatus(initialData.status);
      setNotes(initialData.notes ?? '');
    } else {
      setId('');
      setValue('');
      setStatus('draft');
      setNotes('');
    }
    setErrors({});
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!id.trim()) {
      newErrors.id = 'ID is required';
    } else if (!/^[a-zA-Z0-9-_]+$/.test(id)) {
      newErrors.id = 'ID can only contain letters, numbers, hyphens, and underscores';
    } else if (!initialData && existingIds.includes(id.trim())) {
      newErrors.id = 'ID must be unique';
    }

    const numValue = Number(value);
    if (value === '') {
      newErrors.value = 'Value is required';
    } else if (isNaN(numValue)) {
      newErrors.value = 'Value must be a number';
    } else if (numValue < -50 || numValue > 300) {
      newErrors.value = 'Value must be between -50 and 300';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      id: id.trim(),
      value: numValue,
      status,
      notes: notes.trim() || undefined,
      forecastProjection: initialData?.forecastProjection,
    });
  };

  return (
    <form onSubmit={handleSubmit} className={twMerge(clsx("bg-white p-6 rounded-md shadow-sm border border-gray-200 flex flex-col gap-4", className))}>
      <h3 className="font-semibold text-gray-800">{initialData ? 'Edit Record' : 'New Record'}</h3>

      <div className="flex flex-col gap-1">
        <label htmlFor="record-id" className="text-sm font-medium text-gray-700">Record ID</label>
        <input
          id="record-id"
          type="text"
          value={id}
          onChange={e => setId(e.target.value)}
          disabled={!!initialData}
          className={clsx(
            "border rounded-md p-2 outline-none focus:ring-2",
            errors.id ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-blue-200",
            initialData ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "bg-white"
          )}
        />
        {errors.id && <span className="text-xs text-red-600 font-medium">{errors.id}</span>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="record-value" className="text-sm font-medium text-gray-700">Base Value (kWh)</label>
        <input
          id="record-value"
          type="number"
          value={value}
          onChange={e => setValue(e.target.value)}
          className={clsx(
            "border rounded-md p-2 outline-none focus:ring-2",
            errors.value ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-blue-200"
          )}
        />
        {errors.value && <span className="text-xs text-red-600 font-medium">{errors.value}</span>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="record-status" className="text-sm font-medium text-gray-700">Status</label>
        <select
          id="record-status"
          value={status}
          onChange={e => setStatus(e.target.value as ReadingStatus)}
          className="border border-gray-300 rounded-md p-2 bg-white outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="changed">Changed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="record-notes" className="text-sm font-medium text-gray-700">Notes (Optional)</label>
        <textarea
          id="record-notes"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="border border-gray-300 rounded-md p-2 resize-none h-20 outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      <div className="flex justify-end gap-2 mt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
        >
          {initialData ? 'Save Changes' : 'Create Record'}
        </button>
      </div>
    </form>
  );
}
