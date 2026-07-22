import React, { useState } from 'react';
import { useStore } from './store';
import { BikeRecord, RecordStatusSchema } from './types';

export const RecordList: React.FC = () => {
  const { records, addRecord, updateRecord, deleteRecord } = useStore();
  const [newMileage, setNewMileage] = useState('');
  const [newServiceType, setNewServiceType] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    const mileage = Number(newMileage);
    if (isNaN(mileage) || mileage < 0 || newServiceType.trim() === '') {
      setError("Invalid fields: mileage must be >= 0, service type required.");
      return;
    }
    setError(null);
    addRecord({
      id: crypto.randomUUID(),
      mileage,
      service_type: newServiceType,
      status: 'draft'
    });
    setNewMileage('');
    setNewServiceType('');
  };

  return (
    <div className="flex flex-col gap-4 border p-4 bg-gray-50 h-full overflow-y-auto">
      <h2 className="text-xl font-bold">Bike Service Records</h2>
      <div className="flex flex-col gap-2 p-2 border bg-white shadow-sm">
        <h3 className="font-semibold">Add Record</h3>
        <input
          type="number"
          placeholder="Mileage"
          value={newMileage}
          onChange={e => setNewMileage(e.target.value)}
          className="border p-1 text-sm"
        />
        <input
          type="text"
          placeholder="Service Type"
          value={newServiceType}
          onChange={e => setNewServiceType(e.target.value)}
          className="border p-1 text-sm"
        />
        {error && <div className="text-red-500 text-xs">{error}</div>}
        <button onClick={handleAdd} className="bg-blue-500 text-white p-1 rounded text-sm hover:bg-blue-600">Add</button>
      </div>

      <div className="flex flex-col gap-2">
        {records.map(record => (
          <div key={record.id} className="p-2 border bg-white flex justify-between items-center shadow-sm" draggable onDragStart={(e) => e.dataTransfer.setData('record_id', record.id)}>
            <div>
              <div className="text-sm font-semibold">{record.service_type}</div>
              <div className="text-xs text-gray-500">{record.mileage} mi</div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`text-xs px-2 py-1 rounded-full ${record.status === 'ready' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {record.status}
              </span>
              <button onClick={() => deleteRecord(record.id)} className="text-red-500 text-xs hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
