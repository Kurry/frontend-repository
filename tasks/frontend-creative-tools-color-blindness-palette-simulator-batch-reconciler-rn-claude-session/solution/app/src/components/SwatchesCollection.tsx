import { useState } from 'react';
import { useStore, type SwatchStatus, type Swatch } from '../store';

export function SwatchesCollection() {
  const { records, selectedIds, filterStatus, toggleSelection, setFilterStatus, createRecord, deleteRecord } = useStore();

  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newHex, setNewHex] = useState('');

  const filteredRecords = filterStatus === 'all'
    ? records
    : records.filter(r => r.status === filterStatus);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newHex.trim()) {
      useStore.getState().setRecoveryMessage("Name and Hex are required to create a record.");
      return;
    }
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexRegex.test(newHex.trim())) {
      useStore.getState().setRecoveryMessage("Hex must be a valid hex color code (e.g. #FFFFFF).");
      return;
    }

    createRecord({
      id: Date.now().toString(),
      name: newName.trim(),
      hex: newHex.trim(),
      status: 'ready'
    });
    setIsCreating(false);
    setNewName('');
    setNewHex('');
  };

  return (
    <div className="flex flex-col gap-4 border p-4 bg-white rounded shadow-sm flex-1">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Palette Swatches Collection</h2>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as SwatchStatus | 'all')}
            className="border rounded p-1 text-sm"
          >
            <option value="all">All</option>
            <option value="ready">Ready</option>
            <option value="draft">Draft</option>
            <option value="changed">Changed</option>
            <option value="archived">Archived</option>
          </select>
          <button
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition"
          >
            + Create
          </button>
        </div>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="flex gap-2 items-center bg-gray-50 p-2 border rounded">
          <input
            type="text"
            placeholder="Name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="border p-1 text-sm flex-1"
          />
          <input
            type="text"
            placeholder="#Hex"
            value={newHex}
            onChange={e => setNewHex(e.target.value)}
            className="border p-1 text-sm w-24"
          />
          <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded text-sm">Save</button>
          <button type="button" onClick={() => setIsCreating(false)} className="text-gray-500 text-sm">Cancel</button>
        </form>
      )}

      {filteredRecords.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No records found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto max-h-[500px]">
          {filteredRecords.map(record => (
            <SwatchCard
              key={record.id}
              record={record}
              isSelected={selectedIds.includes(record.id)}
              onSelect={() => toggleSelection(record.id)}
              onDelete={() => deleteRecord(record.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SwatchCard({ record, isSelected, onSelect, onDelete }: { record: Swatch, isSelected: boolean, onSelect: () => void, onDelete: () => void }) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
    }
  };

  return (
    <div
      className={`border rounded p-3 flex flex-col gap-2 cursor-pointer transition-transform transform hover:scale-105 active:scale-95 ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white'}`}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="checkbox"
      aria-checked={isSelected}
    >
      <div className="flex justify-between items-start">
        <div className="font-semibold text-sm truncate" title={record.name}>{record.name}</div>
        <div className="w-6 h-6 rounded border shadow-inner" style={{ backgroundColor: record.hex }}></div>
      </div>
      <div className="text-xs text-gray-500 font-mono">{record.hex}</div>
      <div className="flex justify-between items-center mt-2">
        <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(record.status)}`}>
          {record.status}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="text-red-500 hover:text-red-700 text-xs px-2 py-1"
          aria-label={`Delete ${record.name}`}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function getStatusColor(status: SwatchStatus) {
  switch (status) {
    case 'ready': return 'bg-green-100 text-green-800';
    case 'draft': return 'bg-gray-100 text-gray-800';
    case 'changed': return 'bg-yellow-100 text-yellow-800';
    case 'archived': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}
