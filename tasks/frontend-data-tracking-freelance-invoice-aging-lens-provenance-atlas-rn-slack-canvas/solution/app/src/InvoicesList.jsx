import React, { useState } from 'react';
import { useAppStore } from './store';
import { statuses } from './state';
import { Plus, Edit2, Archive, Trash2 } from 'lucide-react';

export const InvoicesList = ({ selectedId, onSelect }) => {
  const { data, createInvoice, updateInvoice, deleteInvoice } = useAppStore();
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const filteredRecords = data.records.filter(r => filter === 'all' || r.status === filter);

  const startEdit = (e, record) => {
    e.stopPropagation();
    setEditingId(record.id);
    setEditForm(record);
  };

  const saveEdit = (e) => {
    e.stopPropagation();
    // basic validation
    if (!editForm.client || editForm.amount < 0) {
      alert("Invalid required fields: Client is required, Amount must be >= 0. Preserving prior valid record.");
      setEditingId(null);
      return;
    }
    updateInvoice(editingId, editForm);
    setEditingId(null);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if(window.confirm("Are you sure?")) {
      deleteInvoice(id);
      if (selectedId === id) onSelect(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-100">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 rounded p-1 text-sm bg-white"
        >
          <option value="all">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button
          onClick={() => createInvoice({
            id: `INV-${Date.now()}`,
            client: 'New Client',
            amount: 0,
            status: 'draft',
            sourceEvidence: null,
            quarantineReason: null,
            lineage: 'clean'
          })}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center gap-1"
        >
          <Plus size={16}/> New Invoice
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredRecords.length === 0 && <div className="text-gray-500 text-center py-8">No invoices found for this filter.</div>}
        {filteredRecords.map(record => (
          <div
            key={record.id}
            onClick={() => onSelect(record.id)}
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(record.id); }}
            className={`p-3 rounded border cursor-pointer flex justify-between items-center transition-colors
              ${selectedId === record.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'}`}
          >
            {editingId === record.id ? (
              <div className="flex gap-2 flex-1 items-center" onClick={(e) => e.stopPropagation()}>
                <input value={editForm.client} onChange={e => setEditForm({...editForm, client: e.target.value})} className="border p-1 text-sm rounded w-1/3" placeholder="Client" />
                <input type="number" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: Number(e.target.value)})} className="border p-1 text-sm rounded w-24" placeholder="Amount" />
                <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} className="border p-1 text-sm rounded">
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={saveEdit} className="text-green-600 font-medium text-sm ml-auto">Save</button>
              </div>
            ) : (
              <>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{record.client} <span className="text-gray-400 font-normal">#{record.id}</span></span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-gray-600 text-sm">${record.amount.toLocaleString()}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      record.status === 'archived' ? 'bg-gray-200 text-gray-700' :
                      record.status === 'changed' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>{record.status}</span>
                    {record.lineage === 'quarantined' && <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">Quarantined</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={(e) => startEdit(e, record)} className="p-1 text-gray-500 hover:text-blue-600" aria-label="Edit"><Edit2 size={16}/></button>
                  <button onClick={(e) => { e.stopPropagation(); updateInvoice(record.id, {status: 'archived'}); }} className="p-1 text-gray-500 hover:text-gray-800" aria-label="Archive"><Archive size={16}/></button>
                  <button onClick={(e) => handleDelete(e, record.id)} className="p-1 text-gray-500 hover:text-red-600" aria-label="Delete"><Trash2 size={16}/></button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
