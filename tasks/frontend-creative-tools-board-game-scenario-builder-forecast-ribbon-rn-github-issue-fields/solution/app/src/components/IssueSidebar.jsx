import React, { useState, useEffect } from 'react';
import { useStore } from '../store';

const STATES = ['draft', 'ready', 'changed', 'conflict', 'archived'];

export function IssueSidebar({ record }) {
  const updateRecord = useStore(state => state.updateRecord);
  const records = useStore(state => state.records);
  const [localTitle, setLocalTitle] = useState(record?.title || '');
  const [error, setError] = useState(null);

  useEffect(() => {
    setLocalTitle(record?.title || '');
    setError(null);
  }, [record?.id]);

  if (!record) return (
    <div className="h-full flex items-center justify-center text-slate-500 border-l border-slate-200 p-4">
      Select a scenario card to edit fields
    </div>
  );

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setLocalTitle(newTitle);

    if (newTitle.trim() === '') {
      setError('Title cannot be empty');
      return;
    }

    const isDuplicate = records.some(r => r.id !== record.id && r.title.toLowerCase() === newTitle.trim().toLowerCase());
    if (isDuplicate) {
      setError('Title must be unique');
      return;
    }

    setError(null);
    updateRecord(record.id, { title: newTitle.trim() });
  };

  return (
    <div className="w-full h-full border-l border-slate-200 p-4 overflow-y-auto bg-white flex flex-col">
      <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Properties</h2>

      <div className="space-y-4 flex-grow">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
          <input
            type="text"
            value={localTitle}
            onChange={handleTitleChange}
            className={`w-full p-2 border rounded text-sm focus:ring-2 focus:outline-none ${error ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-200'}`}
          />
          {error && <p className="text-red-500 text-xs mt-1" role="alert" aria-live="polite">{error}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
          <select
            value={record.state}
            onChange={(e) => updateRecord(record.id, { state: e.target.value })}
            className="w-full p-2 border border-slate-300 rounded text-sm bg-slate-50"
          >
            {STATES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea
            value={record.description}
            onChange={(e) => updateRecord(record.id, { description: e.target.value })}
            className="w-full p-2 border border-slate-300 rounded text-sm h-24 resize-none"
            placeholder="Scenario description..."
          />
        </div>

        <div className="pt-4 border-t border-slate-100">
          <label className="block text-sm font-medium text-slate-700 mb-1">Cost</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={record.cost}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 0 && val <= 100) {
                  updateRecord(record.id, { cost: val });
                }
              }}
              min="0"
              max="100"
              className="w-20 p-2 border border-slate-300 rounded text-sm"
            />
            <span className="text-xs text-slate-500">units (0-100)</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Likelihood</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={record.likelihood}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 0 && val <= 100) {
                  updateRecord(record.id, { likelihood: val });
                }
              }}
              min="0"
              max="100"
              className="w-20 p-2 border border-slate-300 rounded text-sm"
            />
            <span className="text-xs text-slate-500">% (0-100)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
