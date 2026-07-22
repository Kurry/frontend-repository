import { useState } from 'react';
import { useJournalStore, PlantObservationSchema, PlantObservation } from './store';

export function PlantCollection({ selectedIds, onToggleSelect }: { selectedIds: string[], onToggleSelect: (id: string) => void }) {
  const records = useJournalStore(state => state.records);
  const addRecord = useJournalStore(state => state.addRecord);
  const updateRecord = useJournalStore(state => state.updateRecord);
  const deleteRecord = useJournalStore(state => state.deleteRecord);

  const [filter, setFilter] = useState<PlantObservation['status'] | 'all'>('all');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<PlantObservation>>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const filteredRecords = filter === 'all' ? records : records.filter(r => r.status === filter);

  const handleEdit = (record: PlantObservation) => {
    setEditingId(record.id);
    setFormData(record);
    setErrors({});
  };

  const handleSave = (id: string) => {
    const result = PlantObservationSchema.safeParse({ ...formData, id });
    if (result.success) {
      updateRecord(id, result.data);
      setEditingId(null);
      setErrors({});
    } else {
      const fieldErrors: { [key: string]: string } = {};
      result.error.issues.forEach((err: any) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
    }
  };

  const handleAdd = () => {
    const newRecord: PlantObservation = {
      id: crypto.randomUUID(),
      name: 'New Plant',
      status: 'draft',
      quantity: 1,
      type: 'seedling',
      notes: ''
    };
    addRecord(newRecord);
    setEditingId(newRecord.id);
    setFormData(newRecord);
  };

  return (
    <div className="p-4 bg-card text-card-foreground rounded-lg border border-border mt-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Observations</h2>
        <div className="flex gap-2">
           <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="border p-2 rounded"
              aria-label="Filter records"
            >
              <option value="all">All</option>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="changed">Changed</option>
              <option value="resolved">Resolved</option>
              <option value="conflict">Conflict</option>
              <option value="archived">Archived</option>
           </select>
           <button
             onClick={handleAdd}
             className="bg-primary text-primary-foreground px-4 py-2 rounded"
           >
             Add Record
           </button>
        </div>
      </div>

      {filteredRecords.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No records found. Create one to get started.</p>
      ) : (
        <ul className="space-y-4">
          {filteredRecords.map(record => (
            <li key={record.id} className="border p-4 rounded flex items-start gap-4 transition-all duration-300">
               <input
                 type="checkbox"
                 checked={selectedIds.includes(record.id)}
                 onChange={() => onToggleSelect(record.id)}
                 className="mt-1"
                 aria-label={`Select ${record.name}`}
               />

               {editingId === record.id ? (
                 <div className="flex-1 space-y-2">
                    <div>
                      <label className="block text-sm">Name</label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="border p-1 w-full"
                      />
                      {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
                    </div>
                    <div className="flex gap-4">
                       <div>
                         <label className="block text-sm">Quantity</label>
                         <input
                           type="number"
                           value={formData.quantity || 0}
                           onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                           className="border p-1 w-24"
                         />
                         {errors.quantity && <p className="text-destructive text-sm">{errors.quantity}</p>}
                       </div>
                       <div>
                         <label className="block text-sm">Type</label>
                         <select
                           value={formData.type}
                           onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                           className="border p-1"
                         >
                            <option value="seedling">Seedling</option>
                            <option value="cutting">Cutting</option>
                            <option value="mature">Mature</option>
                         </select>
                       </div>
                       <div>
                         <label className="block text-sm">Status</label>
                         <select
                           value={formData.status}
                           onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                           className="border p-1"
                         >
                            <option value="draft">Draft</option>
                            <option value="ready">Ready</option>
                            <option value="changed">Changed</option>
                            <option value="resolved">Resolved</option>
                            <option value="conflict">Conflict</option>
                            <option value="archived">Archived</option>
                         </select>
                       </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                       <button onClick={() => handleSave(record.id)} className="bg-primary text-primary-foreground px-3 py-1 rounded">Save</button>
                       <button onClick={() => setEditingId(null)} className="border px-3 py-1 rounded">Cancel</button>
                    </div>
                 </div>
               ) : (
                 <div className="flex-1">
                    <h3 className="font-bold">{record.name}</h3>
                    <p className="text-sm text-muted-foreground">Type: {record.type} | Qty: {record.quantity} | Status: <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded">{record.status}</span></p>
                    <div className="flex gap-2 mt-2">
                       <button onClick={() => handleEdit(record)} className="text-sm text-primary underline">Edit</button>
                       <button onClick={() => deleteRecord(record.id)} className="text-sm text-destructive underline">Delete</button>
                    </div>
                 </div>
               )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
