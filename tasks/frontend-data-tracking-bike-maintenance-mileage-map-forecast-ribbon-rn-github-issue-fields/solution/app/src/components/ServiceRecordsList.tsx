import { useState } from 'react';
import { useStore } from '../store';
import { RecordStatus, ServiceRecord } from '../types';
import { ForecastRibbon } from './ForecastRibbon';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Edit2, CheckCircle, XCircle } from 'lucide-react';
import clsx from 'clsx';

function StatusBadge({ status }: { status: RecordStatus }) {
  const colors = {
    empty: 'bg-gray-100 text-gray-600',
    draft: 'bg-yellow-100 text-yellow-700',
    ready: 'bg-green-100 text-green-700',
    changed: 'bg-blue-100 text-blue-700',
    archived: 'bg-slate-100 text-slate-600',
  };
  return (
    <span className={clsx("px-2 py-0.5 text-xs font-medium rounded-full", colors[status])}>
      {status}
    </span>
  );
}

export function ServiceRecordsList() {
  const { records, filter, setFilter, deleteRecord, addRecord, updateRecord } = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Edit State
  const [editTitle, setEditTitle] = useState('');
  const [editMileage, setEditMileage] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editStatus, setEditStatus] = useState<RecordStatus>('draft');
  const [editError, setEditError] = useState<string | null>(null);

  const filteredRecords = filter === 'all' ? records : records.filter(r => r.status === filter);

  const handleStartEdit = (r: ServiceRecord) => {
    setEditingId(r.id);
    setEditTitle(r.title);
    setEditMileage(r.mileage.toString());
    setEditDate(r.date);
    setEditStatus(r.status);
    setEditError(null);
  };

  const handleSaveEdit = () => {
    const m = parseInt(editMileage, 10);
    if (!editTitle.trim()) { setEditError('Title is required'); return; }
    if (isNaN(m) || m < 0) { setEditError('Mileage must be a positive number'); return; }
    if (!editDate) { setEditError('Date is required'); return; }

    updateRecord(editingId!, { title: editTitle, mileage: m, date: editDate, status: editStatus });
    setEditingId(null);
  };

  const handleCreate = () => {
    const m = parseInt(editMileage, 10);
    if (!editTitle.trim()) { setEditError('Title is required'); return; }
    if (isNaN(m) || m < 0) { setEditError('Mileage must be a positive number'); return; }
    if (!editDate) { setEditError('Date is required'); return; }

    addRecord({ title: editTitle, mileage: m, date: editDate });
    setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
        <div className="flex gap-2">
          {(['all', 'empty', 'draft', 'ready', 'changed', 'archived'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                "px-3 py-1 text-sm font-medium rounded-full transition-colors",
                filter === f ? "bg-slate-800 text-white" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              )}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            setEditingId('new');
            setEditTitle('');
            setEditMileage('');
            setEditDate(new Date().toISOString().split('T')[0]);
            setEditError(null);
          }}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          New Record
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {editingId === 'new' && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold mb-2">Create New Record</h3>
            <div className="flex flex-wrap gap-2 items-end">
              <div>
                <label className="block text-xs font-medium text-slate-700">Title</label>
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="mt-1 block w-full px-2 py-1 text-sm border border-slate-300 rounded" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">Mileage</label>
                <input type="number" value={editMileage} onChange={e => setEditMileage(e.target.value)} className="mt-1 block w-full px-2 py-1 text-sm border border-slate-300 rounded" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">Date</label>
                <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="mt-1 block w-full px-2 py-1 text-sm border border-slate-300 rounded" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreate} className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"><CheckCircle className="w-4 h-4" /></button>
                <button onClick={() => setEditingId(null)} className="p-1.5 bg-slate-200 text-slate-700 rounded hover:bg-slate-300"><XCircle className="w-4 h-4" /></button>
              </div>
            </div>
            {editError && <p className="text-xs text-red-500 mt-2">{editError}</p>}
          </div>
        )}

        <AnimatePresence>
          {filteredRecords.map(r => (
            <motion.div
              key={r.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={clsx(
                "border rounded-lg p-4 transition-colors",
                selectedId === r.id ? "border-blue-500 bg-blue-50/30" : "border-slate-200 hover:border-slate-300 bg-white"
              )}
            >
              {editingId === r.id ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2 items-end">
                    <div>
                      <label className="block text-xs font-medium text-slate-700">Title</label>
                      <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="mt-1 block w-full px-2 py-1 text-sm border border-slate-300 rounded" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700">Mileage</label>
                      <input type="number" value={editMileage} onChange={e => setEditMileage(e.target.value)} className="mt-1 block w-full px-2 py-1 text-sm border border-slate-300 rounded" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700">Date</label>
                      <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="mt-1 block w-full px-2 py-1 text-sm border border-slate-300 rounded" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700">Status</label>
                      <select value={editStatus} onChange={e => setEditStatus(e.target.value as RecordStatus)} className="mt-1 block w-full px-2 py-1 text-sm border border-slate-300 rounded">
                        <option value="empty">empty</option>
                        <option value="draft">draft</option>
                        <option value="ready">ready</option>
                        <option value="changed">changed</option>
                        <option value="archived">archived</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleSaveEdit} className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"><CheckCircle className="w-4 h-4" /></button>
                      <button onClick={() => setEditingId(null)} className="p-1.5 bg-slate-200 text-slate-700 rounded hover:bg-slate-300"><XCircle className="w-4 h-4" /></button>
                    </div>
                  </div>
                  {editError && <p className="text-xs text-red-500">{editError}</p>}
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => setSelectedId(selectedId === r.id ? null : r.id)}
                    >
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-slate-900">{r.title}</h4>
                        <StatusBadge status={r.status} />
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <span className="font-medium text-slate-700">Mileage:</span> {r.mileage.toLocaleString()}
                        </span>
                        {r.projectedMileage !== undefined && (
                          <span className="flex items-center gap-1 text-blue-600 font-medium">
                            Projected: {r.projectedMileage.toLocaleString()}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <span className="font-medium text-slate-700">Date:</span> {r.date}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStartEdit(r)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                        aria-label="Edit record"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteRecord(r.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                        aria-label="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {selectedId === r.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 mt-4 border-t border-slate-100">
                          <ForecastRibbon record={r} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {filteredRecords.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            No records found.
          </div>
        )}
      </div>
    </div>
  );
}
