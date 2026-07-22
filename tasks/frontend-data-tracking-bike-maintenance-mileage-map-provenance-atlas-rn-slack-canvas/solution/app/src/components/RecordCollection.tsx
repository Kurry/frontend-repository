import { useState } from 'react';
import { useStore } from '../store';
import { RecordForm } from './RecordForm';
import { Pencil, Trash2 } from 'lucide-react';

export function RecordCollection() {
  const { records, deleteRecord, selectRecord, provenanceAtlasState } = useStore();
  const { filter, setFilter } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const filteredRecords = records.filter(r => filter === 'all' || r.status === filter);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50 border-r">
      <div className="p-4 border-b bg-white shrink-0">
        <h2 className="text-xl font-bold mb-4">Bike Service Records</h2>

        <div className="flex justify-between items-center mb-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="border p-2 rounded"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="changed">Changed</option>
            <option value="archived">Archived</option>
          </select>
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            New Record
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isCreating && (
          <RecordForm onCancel={() => setIsCreating(false)} />
        )}

        {filteredRecords.map((record) => (
          <div
            key={record.id}
            className={`p-4 border rounded cursor-pointer transition-colors ${provenanceAtlasState.selectedId === record.id ? 'border-blue-500 bg-blue-50' : 'bg-white hover:bg-gray-100'}`}
            onClick={() => selectRecord(record.id)}
          >
            {editingId === record.id ? (
              <RecordForm recordToEdit={record} onCancel={() => setEditingId(null)} />
            ) : (
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold">{record.title}</h4>
                  <p className="text-sm text-gray-600">Date: {record.date}</p>
                  <p className="text-sm text-gray-600">Mileage: {record.mileage}</p>
                  <div className="mt-2 flex gap-2">
                    <span className="px-2 py-1 bg-gray-200 text-xs rounded uppercase">{record.status}</span>
                    {record.lineageQuarantined && (
                      <span className="px-2 py-1 bg-red-200 text-red-800 text-xs rounded uppercase">Quarantined</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); setEditingId(record.id); }} className="p-1 text-gray-500 hover:text-black"><Pencil size={16} /></button>
                  <button onClick={(e) => {
                    e.stopPropagation();
                    if(confirm('Are you sure you want to delete this record?')) deleteRecord(record.id);
                  }} className="p-1 text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                </div>
              </div>
            )}
          </div>
        ))}
        {filteredRecords.length === 0 && (
          <div className="text-center text-gray-500 p-8">No records found.</div>
        )}
      </div>
    </div>
  );
}
