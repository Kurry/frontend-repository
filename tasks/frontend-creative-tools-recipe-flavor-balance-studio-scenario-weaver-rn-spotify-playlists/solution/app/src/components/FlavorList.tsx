import { useState } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { Archive, Edit2, GitBranch, Trash2 } from 'lucide-react';

export function FlavorList() {
  const { records, selectedId, filterStatus, selectRecord, setFilterStatus, deleteRecord, updateRecord, branchScenario } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const filteredRecords = filterStatus
    ? records.filter(r => r.status === filterStatus)
    : records;

  const handleEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const saveEdit = (id: string) => {
    if (editName.trim()) {
      updateRecord(id, { name: editName.trim() });
    }
    setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full bg-black/20 rounded-lg p-4 border border-zinc-800">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Collection</h2>
        <select
          className="bg-zinc-800 text-white p-2 rounded outline-none focus:ring-2 focus:ring-primary"
          value={filterStatus || ""}
          onChange={(e) => setFilterStatus(e.target.value || null)}
          aria-label="Filter status"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="changed">Changed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="overflow-y-auto flex-1 space-y-2 pr-2" role="list">
        <AnimatePresence initial={false}>
          {filteredRecords.length === 0 && (
            <div className="text-zinc-500 text-center py-8">No records match the filter.</div>
          )}
          {filteredRecords.map((record) => (
            <motion.div
              key={record.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={() => selectRecord(record.id)}
              className={`p-3 rounded-md cursor-pointer transition-colors group flex items-center justify-between border
                ${selectedId === record.id ? 'bg-zinc-800 border-primary' : 'bg-zinc-900 border-transparent hover:bg-zinc-800'}`}
              role="listitem"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') selectRecord(record.id);
              }}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  record.status === 'ready' ? 'bg-primary' :
                  record.status === 'changed' ? 'bg-yellow-500' :
                  record.status === 'archived' ? 'bg-zinc-600' : 'bg-blue-400'
                }`} title={record.status} />

                {editingId === record.id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => saveEdit(record.id)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit(record.id)}
                    autoFocus
                    className="bg-black border border-zinc-700 px-2 py-1 text-sm rounded w-full text-white"
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <span className="truncate flex-1 font-medium select-none">{record.name}</span>
                )}
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); branchScenario(record.id); }}
                  className="p-1.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white"
                  title="Scenario Weaver (Branch)"
                  aria-label={`Branch ${record.name}`}
                >
                  <GitBranch size={16} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleEdit(record.id, record.name); }}
                  className="p-1.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white"
                  title="Edit name"
                  aria-label={`Edit ${record.name}`}
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateRecord(record.id, { status: record.status === 'archived' ? 'draft' : 'archived' });
                  }}
                  className="p-1.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white"
                  title={record.status === 'archived' ? "Unarchive" : "Archive"}
                  aria-label={record.status === 'archived' ? "Unarchive" : "Archive"}
                >
                  <Archive size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if(confirm("Are you sure?")) deleteRecord(record.id);
                  }}
                  className="p-1.5 hover:bg-red-900/50 rounded text-zinc-400 hover:text-red-400"
                  title="Delete"
                  aria-label={`Delete ${record.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
