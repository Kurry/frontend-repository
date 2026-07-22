import React, { useState } from 'react';
import { useStore } from '../store/store';
import { domainStatuses } from '../schema/schema';
import { Edit2, Trash2, Check, X } from 'lucide-react';

export default function RecipeIngredientsCollection() {
  const { records, addRecord, updateRecord, deleteRecord } = useStore();
  const [filter, setFilter] = useState('all');

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const [newForm, setNewForm] = useState({ name: '', amount: 0, unit: '', status: 'draft' });
  const [error, setError] = useState('');

  const filteredRecords = records.filter(r => filter === 'all' || r.status === filter);

  const handleSaveEdit = (id) => {
    if (!editForm.name || editForm.amount < 0 || !editForm.unit) {
      setError("Invalid required fields (name, non-negative amount, unit). Recovery: fix values.");
      return;
    }
    updateRecord(id, editForm);
    setEditingId(null);
    setError('');
  };

  const handleAdd = () => {
    if (!newForm.name || newForm.amount < 0 || !newForm.unit) {
      setError("Invalid required fields (name, non-negative amount, unit). Recovery: fix values.");
      return;
    }
    addRecord(newForm);
    setNewForm({ name: '', amount: 0, unit: '', status: 'draft' });
    setError('');
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-md overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Ingredients Collection</h2>
        <select
          className="border rounded px-2 py-1"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filter records"
        >
          <option value="all">All Statuses</option>
          {domainStatuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {error && <div className="p-2 bg-red-100 text-red-700 text-sm border-b border-red-200">{error}</div>}

      <div className="p-4 border-b border-gray-200 flex gap-2 items-end">
         <div className="flex-1">
           <label className="block text-xs mb-1">Name</label>
           <input className="w-full border rounded px-2 py-1" value={newForm.name} onChange={e => setNewForm({...newForm, name: e.target.value})} />
         </div>
         <div className="w-20">
           <label className="block text-xs mb-1">Amount</label>
           <input type="number" className="w-full border rounded px-2 py-1" value={newForm.amount} onChange={e => setNewForm({...newForm, amount: Number(e.target.value)})} />
         </div>
         <div className="w-20">
           <label className="block text-xs mb-1">Unit</label>
           <input className="w-full border rounded px-2 py-1" value={newForm.unit} onChange={e => setNewForm({...newForm, unit: e.target.value})} />
         </div>
         <div className="w-24">
           <label className="block text-xs mb-1">Status</label>
           <select className="w-full border rounded px-2 py-1" value={newForm.status} onChange={e => setNewForm({...newForm, status: e.target.value})}>
             {domainStatuses.map(s => <option key={s} value={s}>{s}</option>)}
           </select>
         </div>
         <button className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700" onClick={handleAdd}>Add</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filteredRecords.length === 0 ? (
          <div className="text-gray-500 text-center py-8">Empty collection</div>
        ) : (
          <div className="space-y-2">
            {filteredRecords.map(record => (
              <div key={record.id} className="flex items-center justify-between p-3 border rounded shadow-sm hover:shadow-md transition-shadow">
                {editingId === record.id ? (
                  <div className="flex gap-2 w-full items-center">
                    <input className="border rounded px-2 py-1 flex-1" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                    <input type="number" className="border rounded px-2 py-1 w-20" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: Number(e.target.value)})} />
                    <input className="border rounded px-2 py-1 w-20" value={editForm.unit} onChange={e => setEditForm({...editForm, unit: e.target.value})} />
                    <select className="border rounded px-2 py-1 w-24" value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}>
                      {domainStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={() => handleSaveEdit(record.id)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={18}/></button>
                    <button onClick={() => {setEditingId(null); setError('');}} className="p-1 text-red-600 hover:bg-red-50 rounded"><X size={18}/></button>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col">
                      <span className="font-medium">{record.name}</span>
                      <span className="text-sm text-gray-500">{record.amount} {record.unit} • {record.status} {record.spatialComposerState?.placed ? '• (Placed)' : ''}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingId(record.id); setEditForm({...record}); setError(''); }} className="p-2 text-gray-500 hover:bg-gray-100 rounded" aria-label={`Edit ${record.name}`}>
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => deleteRecord(record.id)} className="p-2 text-gray-500 hover:bg-gray-100 rounded" aria-label={`Delete ${record.name}`}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
