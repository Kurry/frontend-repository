import { useState } from 'react';
import { useStore, type BikeRecord } from '../store';
import { AnimatePresence } from 'framer-motion';
import { Search, Plus, X, Trash2, AlertCircle, Edit2, Archive } from 'lucide-react';

export const Collection = () => {
  const { current, createRecord, updateRecord, deleteRecord } = useStore();
  const [filter, setFilter] = useState<string>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [editTitle, setEditTitle] = useState('');
  const [editStatus, setEditStatus] = useState<BikeRecord['status']>('ready');
  const [editDistance, setEditDistance] = useState(0);
  const [editNotes, setEditNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const filteredRecords = current.records.filter(r => filter === 'all' || r.status === filter);

  const startEdit = (record: BikeRecord) => {
      setEditingId(record.id);
      setEditTitle(record.title);
      setEditStatus(record.status);
      setEditDistance(record.distance);
      setEditNotes(record.notes || '');
      setIsAdding(false);
      setError(null);
  };

  const startAdd = () => {
      setIsAdding(true);
      setEditingId(null);
      setEditTitle('');
      setEditStatus('ready');
      setEditDistance(0);
      setEditNotes('');
      setError(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      setError("Title is required.");
      return;
    }
    if (editDistance < 0) {
      setError("Distance must be non-negative.");
      return;
    }

    if (editingId) {
        updateRecord(editingId, { title: editTitle, status: editStatus, distance: editDistance, notes: editNotes });
        setEditingId(null);
    } else {
        createRecord({ title: editTitle, status: editStatus, distance: editDistance, notes: editNotes });
        setIsAdding(false);
    }
    setEditTitle('');
    setEditDistance(0);
    setEditNotes('');
    setError(null);
  };

  const handleArchive = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      updateRecord(id, { status: 'archived' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'recovery': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'archived': return 'bg-slate-100 text-slate-800 border-slate-200 opacity-70';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          Service Records
          <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{current.records.length}</span>
        </h2>
        <button
          onClick={startAdd}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus size={16} /> New Record
        </button>
      </div>

      <div className="p-4 border-b border-slate-100 flex gap-2 overflow-x-auto">
        {['all', 'ready', 'failed', 'recovery', 'draft', 'archived'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
        {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center gap-2 border border-red-200">
                <AlertCircle size={16} />
                <span className="text-sm">{error}</span>
                <button onClick={() => setError(null)} className="ml-auto"><X size={16}/></button>
            </div>
        )}

        <AnimatePresence mode="popLayout">
          {(isAdding || editingId) && (
            <form
              onSubmit={handleSave}
              className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm mb-4 space-y-3"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-slate-700">{editingId ? 'Edit Record' : 'Add New Record'}</h3>
                <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} className="text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              </div>
              <input
                type="text"
                placeholder="Service Title"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <div className="flex gap-2">
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as any)}
                  className="w-1/2 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="draft">Draft</option>
                  <option value="ready">Ready</option>
                  <option value="failed">Failed</option>
                  <option value="archived">Archived</option>
                </select>
                <input
                  type="number"
                  placeholder="Distance (km)"
                  value={editDistance}
                  onChange={e => setEditDistance(Number(e.target.value))}
                  className="w-1/2 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <input
                type="text"
                placeholder="Notes (optional)"
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-end pt-2">
                <button type="submit" className="px-4 py-2 bg-slate-800 text-white rounded-md text-sm font-medium hover:bg-slate-900 transition-colors">
                  {editingId ? 'Save Changes' : 'Save Record'}
                </button>
              </div>
            </form>
          )}

          {filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-slate-500 flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                <Search size={24} className="text-slate-400" />
              </div>
              <p className="text-sm font-medium">No records found for "{filter}"</p>
              <p className="text-xs mt-1">Adjust filters or create a new record.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRecords.map(record => (
                <div
                  key={record.id}
                  className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow group flex flex-col gap-2 relative"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-slate-800 text-sm truncate pr-8">{record.title}</h3>
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${getStatusColor(record.status)}`}>
                      {record.status}
                    </span>
                  </div>

                  <div className="flex items-center text-xs text-slate-500 gap-4 mt-1">
                    <span className="flex items-center gap-1">
                       <span className="font-semibold text-slate-700">{record.distance}</span> km
                    </span>
                    <span className="truncate text-slate-400 max-w-[150px]">{record.notes || 'No notes'}</span>
                  </div>

                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white pl-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); startEdit(record); }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Edit record"
                    >
                      <Edit2 size={14} />
                    </button>
                    {record.status !== 'archived' && (
                        <button
                        onClick={(e) => handleArchive(record.id, e)}
                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                        title="Archive record"
                        >
                        <Archive size={14} />
                        </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteRecord(record.id); }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete record"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
