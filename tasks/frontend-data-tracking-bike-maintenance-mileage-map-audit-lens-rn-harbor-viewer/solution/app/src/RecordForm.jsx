import { useState, useEffect } from 'react';
import { useStore } from './store';

export function RecordForm({ recordId, onClose }) {
  const { state, addRecord, updateRecord } = useStore();
  const existingRecord = recordId ? state.records.find(r => r.id === recordId) : null;

  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    mileage: '',
    status: 'draft',
    notes: '',
    evidenceAttached: false,
    auditDiscrepancy: false,
  });

  useEffect(() => {
    if (existingRecord) {
      setFormData(existingRecord);
    }
  }, [existingRecord]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (existingRecord) {
      updateRecord(formData);
    } else {
      addRecord({ ...formData, id: `rec-${Date.now()}` });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">{existingRecord ? 'Edit Record' : 'New Record'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input required type="text" className="w-full border rounded px-3 py-2" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input required type="date" className="w-full border rounded px-3 py-2" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mileage</label>
              <input required type="number" min="0" className="w-full border rounded px-3 py-2" value={formData.mileage} onChange={e => setFormData({...formData, mileage: parseInt(e.target.value, 10)})} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select className="w-full border rounded px-3 py-2" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="changed">Changed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
             <input type="checkbox" id="auditDiscrepancy" className="rounded" checked={formData.auditDiscrepancy} onChange={e => setFormData({...formData, auditDiscrepancy: e.target.checked})} />
             <label htmlFor="auditDiscrepancy" className="text-sm font-medium text-gray-700">Has Audit Discrepancy</label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea className="w-full border rounded px-3 py-2" rows="3" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded hover:bg-primary-700">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
