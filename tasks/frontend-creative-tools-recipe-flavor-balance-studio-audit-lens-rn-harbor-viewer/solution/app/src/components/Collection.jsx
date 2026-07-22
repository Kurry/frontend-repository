import { useState } from 'react';
import { useFlavorStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { FileEdit, Archive, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { clsx } from 'clsx';

export function Collection() {
  const { records, filterStatus, setFilter, selectRecord, selectedId, addRecord, updateRecord, undo, historyIndex } = useFlavorStore();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const filteredRecords = records.filter(r => filterStatus === 'all' || r.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilter(e.target.value)}
            className="border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
          >
            <option value="all">All Statuses</option>
            <option value="empty">Empty</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="changed">Changed</option>
            <option value="archived">Archived</option>
            <option value="resolved">Resolved</option>
          </select>
          <span className="text-sm text-slate-500">{filteredRecords.length} records</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => undo()}
            disabled={historyIndex <= 0}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm font-medium disabled:opacity-50"
          >
            Undo (Ctrl+Z)
          </button>
          <button
            onClick={() => {
              setIsCreating(true);
              setEditingId(null);
            }}
            className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
          >
            <Plus size={16} /> New Record
          </button>
        </div>
      </div>

      {isCreating && !editingId && (
        <RecordForm
          onSubmit={(data) => {
            addRecord(data);
            setIsCreating(false);
          }}
          onCancel={() => setIsCreating(false)}
        />
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <AnimatePresence>
          {filteredRecords.map(record => (
            editingId === record.id ? (
              <motion.div key={`edit-${record.id}`} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <RecordForm
                  initialData={record}
                  onSubmit={(data) => {
                    updateRecord(record.id, { ...data, status: 'changed' });
                    setEditingId(null);
                  }}
                  onCancel={() => setEditingId(null)}
                />
              </motion.div>
            ) : (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={record.id}
                onClick={() => selectRecord(record.id)}
                className={clsx(
                  "p-4 rounded-lg border cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500",
                  selectedId === record.id ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white hover:border-indigo-300",
                  record.status === 'archived' && "opacity-60 grayscale"
                )}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectRecord(record.id);
                  }
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{record.name || 'Unnamed Flavor'}</h3>
                  <div className="flex gap-2 items-center">
                    <StatusBadge status={record.status} hasDiscrepancy={record.hasDiscrepancy} />
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingId(record.id); setIsCreating(false); }}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                    >
                      <FileEdit size={16} />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-slate-600 grid grid-cols-2 gap-2 mt-4">
                  <div>Intensity: {record.intensity}/10</div>
                  <div>Balance: {record.balance}</div>
                </div>
                {record.hasDiscrepancy && (
                  <div className="mt-3 text-xs text-amber-700 bg-amber-50 p-2 rounded flex items-center gap-1">
                    <AlertCircle size={14} /> Needs Audit Lens review
                  </div>
                )}
              </motion.div>
            )
          ))}
        </AnimatePresence>

        {filteredRecords.length === 0 && !isCreating && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white border border-slate-200 border-dashed rounded-lg">
            No records found.
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status, hasDiscrepancy }) {
  const styles = {
    empty: "bg-slate-100 text-slate-600",
    draft: "bg-blue-100 text-blue-700",
    ready: "bg-green-100 text-green-700",
    changed: "bg-purple-100 text-purple-700",
    archived: "bg-gray-200 text-gray-600",
    resolved: "bg-teal-100 text-teal-700"
  };

  return (
    <div className="flex gap-1">
      {hasDiscrepancy && (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
          Discrepancy
        </span>
      )}
      <span className={clsx("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize", styles[status] || styles.empty)}>
        {status}
      </span>
    </div>
  );
}

function RecordForm({ onSubmit, onCancel, initialData }) {
  const [name, setName] = useState(initialData?.name || '');
  const [intensity, setIntensity] = useState(initialData?.intensity || 5);
  const [balance, setBalance] = useState(initialData?.balance || 'neutral');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    const numIntensity = Number(intensity);
    if (numIntensity < 1 || numIntensity > 10) {
      setError('Intensity must be between 1 and 10');
      return;
    }

    // Cross-field validation example
    if (balance === 'sweet' && numIntensity > 8) {
      setError('Sweet flavors cannot have an intensity greater than 8');
      return;
    }

    onSubmit({
      name: name.trim(),
      intensity: numIntensity,
      balance,
      status: initialData ? initialData.status : 'draft',
      hasDiscrepancy: initialData ? initialData.hasDiscrepancy : Math.random() > 0.5 // Randomly inject discrepancy for demo
    });
  };

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm mb-6"
      onSubmit={handleSubmit}
    >
      <h3 className="font-semibold mb-4">{initialData ? 'Edit Flavor Component' : 'Create Flavor Component'}</h3>
      {error && <div className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div>
          <label htmlFor="name-input" className="block text-sm font-medium text-slate-700 mb-1">Name</label>
          <input
            id="name-input"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full border-slate-300 rounded-md p-2 border"
          />
        </div>
        <div>
          <label htmlFor="intensity-input" className="block text-sm font-medium text-slate-700 mb-1">Intensity (1-10)</label>
          <input
            id="intensity-input"
            type="number"
            min="1" max="10"
            value={intensity}
            onChange={e => setIntensity(e.target.value)}
            className="w-full border-slate-300 rounded-md p-2 border"
          />
        </div>
        <div>
          <label htmlFor="balance-input" className="block text-sm font-medium text-slate-700 mb-1">Balance</label>
          <select
            id="balance-input"
            value={balance}
            onChange={e => setBalance(e.target.value)}
            className="w-full border-slate-300 rounded-md p-2 border bg-white"
          >
            <option value="sweet">Sweet</option>
            <option value="sour">Sour</option>
            <option value="salty">Salty</option>
            <option value="bitter">Bitter</option>
            <option value="umami">Umami</option>
            <option value="neutral">Neutral</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 border border-slate-300 rounded-md text-sm">Cancel</button>
        <button type="submit" className="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm">Save Record</button>
      </div>
    </motion.form>
  );
}
