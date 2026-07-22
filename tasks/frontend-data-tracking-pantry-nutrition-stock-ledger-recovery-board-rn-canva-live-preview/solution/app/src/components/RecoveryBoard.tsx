import { useState } from 'react';
import type { Ingredient } from '../types';

interface RecoveryBoardProps {
  records: Ingredient[];
  onRepair: (id: string, updates: Partial<Ingredient>) => void;
}

export function RecoveryBoard({ records, onRepair }: RecoveryBoardProps) {
  const conflictRecords = records.filter(r => r.status === 'conflict');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Ingredient>>({});

  const startEdit = (record: Ingredient) => {
    setEditingId(record.id);
    setEditForm({ ...record });
  };

  const handleSave = () => {
    if (editingId && editForm) {
      if (editForm.quantity !== undefined && editForm.quantity < 0) {
        alert("Quantity must be >= 0");
        return;
      }
      onRepair(editingId, { ...editForm, status: 'changed', recoveryBoardState: undefined });
      setEditingId(null);
      setEditForm({});
    }
  };

  if (conflictRecords.length === 0) {
    return <div className="p-4 bg-green-50 border border-green-200 rounded text-green-700">No records in conflict state.</div>;
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded p-4">
      <h2 className="text-lg font-bold text-red-800 mb-2">Recovery Board</h2>
      <div className="space-y-4">
        {conflictRecords.map(record => (
          <div key={record.id} className="bg-white p-3 border border-red-300 rounded shadow-sm flex items-center justify-between">
            {editingId === record.id ? (
              <div className="flex space-x-2 w-full">
                <input
                  type="text"
                  className="border rounded p-1 flex-grow"
                  value={editForm.name || ''}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                />
                <input
                  type="number"
                  className="border rounded p-1 w-24"
                  value={editForm.quantity || 0}
                  onChange={e => setEditForm({ ...editForm, quantity: Number(e.target.value) })}
                  title="Quantity"
                />
                <button onClick={handleSave} className="bg-blue-600 text-white px-3 py-1 rounded">Save</button>
                <button onClick={() => setEditingId(null)} className="bg-gray-400 text-white px-3 py-1 rounded">Cancel</button>
              </div>
            ) : (
              <>
                <div>
                  <div className="font-semibold">{record.name}</div>
                  <div className="text-sm text-gray-600">Qty: {record.quantity}{record.unit}</div>
                  <div className="text-xs text-red-600">{record.recoveryBoardState?.reason || "Conflict"}</div>
                </div>
                <button
                  onClick={() => startEdit(record)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Repair
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
