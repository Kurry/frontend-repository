import React, { useState } from 'react';
import { useStore } from '../store';
import { Plus, Search, Archive, FileText, CheckCircle2, Clock } from 'lucide-react';
import { z } from 'zod';
import { GlazeTestSchema } from '../schema';

const statusIcons = {
  draft: <FileText size={16} className="text-slate-400" />,
  ready: <CheckCircle2 size={16} className="text-emerald-500" />,
  changed: <Clock size={16} className="text-amber-500" />,
  archived: <Archive size={16} className="text-slate-400" />
};

export default function TestList() {
  const { state, dispatch } = useStore();
  const [filter, setFilter] = useState("all");
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const filteredRecords = state.records.filter(r => {
    if (filter === "all") return r.status !== "archived";
    return r.status === filter;
  });

  const handleCreate = (e) => {
    e.preventDefault();
    try {
      const newRecord = {
        id: Math.random().toString(36).substr(2, 9),
        name: newName,
        status: "draft",
        history: [{ timestamp: new Date().toISOString(), status: "draft" }]
      };
      GlazeTestSchema.parse(newRecord);
      dispatch({ type: 'CREATE_RECORD', payload: newRecord });
      dispatch({ type: 'SELECT_RECORD', payload: newRecord.id });
      setNewName("");
      setIsCreating(false);
      setErrorMsg("");
    } catch (err) {
      setErrorMsg("Invalid name.");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-slate-700">Glaze Tests</h2>
          <button
            onClick={() => setIsCreating(true)}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
          >
            <Plus size={20} />
          </button>
        </div>

        <select
          className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-md focus:ring-amber-500 focus:border-amber-500 block p-2"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">Active Tests</option>
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="changed">Changed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isCreating && (
          <form onSubmit={handleCreate} className="p-2 bg-slate-50 border border-slate-200 rounded-md mb-2">
            <input
              autoFocus
              type="text"
              placeholder="Test Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full text-sm p-1.5 border border-slate-300 rounded mb-2"
            />
            {errorMsg && <div aria-live="polite" className="text-red-500 text-xs mb-2">{errorMsg}</div>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsCreating(false)} className="text-xs text-slate-500">Cancel</button>
              <button type="submit" className="text-xs bg-amber-600 text-white px-2 py-1 rounded">Create</button>
            </div>
          </form>
        )}

        {filteredRecords.length === 0 && !isCreating ? (
          <div className="text-center p-4 text-sm text-slate-500">No tests found.</div>
        ) : (
          filteredRecords.map(record => (
            <button
              key={record.id}
              onClick={() => dispatch({ type: 'SELECT_RECORD', payload: record.id })}
              className={`w-full text-left p-3 rounded-md flex items-center justify-between group ${
                state.selectedId === record.id
                  ? 'bg-amber-50 text-amber-900 ring-1 ring-amber-500'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                {statusIcons[record.status]}
                <span className="truncate text-sm font-medium">{record.name}</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
