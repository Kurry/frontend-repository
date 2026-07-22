import React, { useState } from "react";
import { Plus, Trash2, Archive, Edit2 } from "lucide-react";

const STATUSES = ["empty", "draft", "ready", "changed", "conflict", "archived"];

export default function LayersList({ records, onMutate, selectedRecordId, onSelect }) {
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState(null);

  const filteredRecords = records.filter(r => filter === "all" || r.status === filter);

  const handleCreate = () => {
    const newId = `layer-${Date.now()}`;
    const newRecord = {
      id: newId,
      name: "New Layer",
      volume: 50,
      status: "draft",
      provenanceAtlasState: { nodes: [] },
      createdAt: new Date().toISOString()
    };
    onMutate([...records, newRecord]);
    onSelect(newId);
  };

  const handleDelete = (id) => {
    onMutate(records.filter(r => r.id !== id));
    if (selectedRecordId === id) onSelect(null);
  };

  const handleArchive = (id) => {
    onMutate(records.map(r => r.id === id ? { ...r, status: "archived" } : r));
  };

  const startEdit = (record) => {
    setEditingId(record.id);
    setEditForm({ name: record.name, volume: record.volume });
    setError(null);
  };

  const saveEdit = (id) => {
    const { name, volume } = editForm;
    const volNum = parseInt(volume, 10);

    if (!name || name.trim() === "") {
      setError("Name cannot be empty. Reverting to previous state.");
      return; // Validation failure preserves prior valid record
    }
    if (isNaN(volNum) || volNum < 0 || volNum > 100) {
      setError("Volume must be between 0 and 100. Reverting to previous state.");
      return;
    }

    onMutate(records.map(r => r.id === id ? { ...r, name: name.trim(), volume: volNum } : r));
    setEditingId(null);
    setError(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-[var(--border)] shrink-0">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg">Sound Layers</h2>
          <button
            onClick={handleCreate}
            className="p-1 rounded bg-[var(--accent)] text-white hover:bg-blue-700 transition-colors"
            title="Create new layer"
          >
            <Plus size={20} />
          </button>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full p-2 border border-[var(--border)] rounded text-sm bg-white"
        >
          <option value="all">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filteredRecords.map(record => (
          <div
            key={record.id}
            className={`p-3 rounded border cursor-pointer transition-all ${
              selectedRecordId === record.id
                ? 'border-[var(--accent)] bg-blue-50/50'
                : 'border-[var(--border)] bg-white hover:border-gray-300'
            }`}
            onClick={() => { if(editingId !== record.id) onSelect(record.id); }}
          >
            {editingId === record.id ? (
              <div className="space-y-3" onClick={e => e.stopPropagation()}>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                  className="w-full p-1 border rounded text-sm"
                  placeholder="Layer Name"
                />
                <div className="flex items-center gap-2 text-sm">
                  <label>Vol:</label>
                  <input
                    type="number"
                    value={editForm.volume}
                    onChange={e => setEditForm({...editForm, volume: e.target.value})}
                    className="w-16 p-1 border rounded"
                  />
                </div>
                {error && <div className="text-xs text-[var(--danger)]">{error}</div>}
                <div className="flex justify-end gap-2">
                  <button onClick={() => {setEditingId(null); setError(null);}} className="text-sm px-2 py-1 bg-gray-200 rounded">Cancel</button>
                  <button onClick={() => saveEdit(record.id)} className="text-sm px-2 py-1 bg-[var(--accent)] text-white rounded">Save</button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium truncate pr-2">{record.name}</h3>
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm ${
                    record.status === 'conflict' ? 'bg-red-100 text-red-700' :
                    record.status === 'ready' ? 'bg-green-100 text-green-700' :
                    record.status === 'archived' ? 'bg-gray-200 text-gray-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {record.status}
                  </span>
                </div>
                <div className="text-xs text-[var(--text-muted)] mb-3">
                  Vol: {record.volume}% | Nodes: {record.provenanceAtlasState.nodes.length}
                </div>
                <div className="flex justify-end gap-1 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); startEdit(record); }} className="p-1.5 text-gray-500 hover:text-[var(--accent)] rounded hover:bg-gray-100" title="Edit">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleArchive(record.id); }} className="p-1.5 text-gray-500 hover:text-orange-500 rounded hover:bg-gray-100" title="Archive">
                    <Archive size={14} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(record.id); }} className="p-1.5 text-gray-500 hover:text-[var(--danger)] rounded hover:bg-gray-100" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {filteredRecords.length === 0 && (
          <div className="p-4 text-center text-sm text-[var(--text-muted)]">No layers found.</div>
        )}
      </div>
    </div>
  );
}
