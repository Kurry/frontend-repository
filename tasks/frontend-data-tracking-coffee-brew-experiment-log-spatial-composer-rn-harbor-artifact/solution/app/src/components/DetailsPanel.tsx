import React, { useState } from 'react';
import { useStore } from '../store';

export const DetailsPanel: React.FC = () => {
  const { records, selectedRecordId, updateRecord, deleteRecord } = useStore();
  const record = records.find(r => r.id === selectedRecordId);
  const [errorMsg, setErrorMsg] = useState('');

  if (!record) {
    return (
      <div className="p-6 text-center text-slate-500">
        <p>Select a record to view details.</p>
      </div>
    );
  }

  const handleUpdate = (field: string, value: string | number) => {
    if (field === 'doseWeight' || field === 'yieldWeight') {
      const num = Number(value);
      if (isNaN(num) || num <= 0 || num > 500) {
        setErrorMsg('Invalid weight. Must be 1-500g. Using prior valid state.');
        return;
      }
    }
    setErrorMsg('');
    updateRecord(record.id, { [field]: value });
  };

  return (
    <div className="p-4 bg-white border-l border-slate-200 h-full overflow-y-auto">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Record Details</h2>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200" role="alert">
          {errorMsg}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
          <input
            type="text"
            value={record.name}
            onChange={(e) => handleUpdate('name', e.target.value)}
            className="w-full p-2 border border-slate-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Coffee</label>
          <input
            type="text"
            value={record.coffee}
            onChange={(e) => handleUpdate('coffee', e.target.value)}
            className="w-full p-2 border border-slate-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Dose (g)</label>
            <input
              type="number"
              value={record.doseWeight}
              onChange={(e) => handleUpdate('doseWeight', Number(e.target.value))}
              className="w-full p-2 border border-slate-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Yield (g)</label>
            <input
              type="number"
              value={record.yieldWeight}
              onChange={(e) => handleUpdate('yieldWeight', Number(e.target.value))}
              className="w-full p-2 border border-slate-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div>
           <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
           <div className="p-2 bg-slate-50 border border-slate-200 rounded font-medium text-slate-700 capitalize">
             {record.status}
           </div>
        </div>
        <div className="pt-4 mt-4 border-t border-slate-200">
           <button
             onClick={() => deleteRecord(record.id)}
             className="w-full py-2 px-4 bg-red-50 text-red-600 font-medium rounded hover:bg-red-100 transition-colors"
           >
             Delete Record
           </button>
        </div>
      </div>
    </div>
  );
};
