import React, { useState } from 'react';
import { useAppStore } from '../store';
import type { WasteEventRecord, Status } from '../types';
import { IconTrash, IconEdit, IconCheck } from '@tabler/icons-react';

export const WasteEventsList: React.FC = () => {
  const { state, dispatch } = useAppStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<WasteEventRecord>>({});

  const startEdit = (record: WasteEventRecord) => {
    setEditingId(record.id);
    setEditForm(record);
  };

  const saveEdit = () => {
    if (editingId && editForm) {
      if (!editForm.name || (editForm.weight !== undefined && editForm.weight < 0)) {
        alert("Invalid field values. Name is required and weight must be >= 0.");
        return;
      }
      dispatch({ type: 'UPDATE_RECORD', payload: editForm as WasteEventRecord });
      setEditingId(null);
      setEditForm({});
    }
  };

  const deleteRecord = (id: string) => {
    if (confirm("Are you sure you want to delete this record?")) {
      dispatch({ type: 'DELETE_RECORD', payload: id });
    }
  };

  const createRecord = () => {
    dispatch({
      type: 'CREATE_RECORD',
      payload: {
        name: 'New Waste Event',
        status: 'draft',
        weight: 0,
        type: 'General',
        notes: '',
        ownerId: null,
      }
    });
  };

  return (
    <div className="bg-white p-4 shadow rounded-lg border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Waste Events</h2>
        <button onClick={createRecord} className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700">
          + Add Event
        </button>
      </div>

      <div className="space-y-3">
        {state.records.length === 0 ? (
          <p className="text-gray-500 italic text-sm">No waste events found.</p>
        ) : (
          state.records.map((record) => (
            <div key={record.id} className="p-3 border border-gray-200 rounded-md hover:shadow-sm flex items-center justify-between">
              {editingId === record.id ? (
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex gap-2">
                    <input className="border p-1 text-sm flex-1" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="Name" />
                    <input type="number" className="border p-1 text-sm w-20" value={editForm.weight} onChange={e => setEditForm({ ...editForm, weight: Number(e.target.value) })} placeholder="Weight" />
                    <select className="border p-1 text-sm" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value as Status })}>
                      <option value="empty">Empty</option>
                      <option value="draft">Draft</option>
                      <option value="ready">Ready</option>
                      <option value="changed">Changed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <input className="border p-1 text-sm flex-1" value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })} placeholder="Type" />
                    <button onClick={saveEdit} className="text-green-600 hover:text-green-800"><IconCheck size={18} /></button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{record.name} <span className="text-xs ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{record.status}</span></p>
                    <p className="text-sm text-gray-500">{record.weight} lbs • {record.type} {record.ownerId && `• Owner: ${record.ownerId}`}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(record)} className="text-gray-500 hover:text-blue-600"><IconEdit size={18} /></button>
                    <button onClick={() => deleteRecord(record.id)} className="text-gray-500 hover:text-red-600"><IconTrash size={18} /></button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
