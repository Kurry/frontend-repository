import { useState } from 'react';
import type { WorkRecord, RecordStatus } from '../types';
import { motion } from 'motion/react';
import { PlusCircle, Trash2 } from 'lucide-react';

interface Props {
  records: WorkRecord[];
  onSelect: (id: string) => void;
  selectedId: string | null;
  onAdd: (title: string) => void;
  onUpdateStatus: (id: string, status: RecordStatus) => void;
  onDelete: (id: string) => void;
}

export function RecordList({ records, onSelect, selectedId, onAdd, onUpdateStatus, onDelete }: Props) {
  const [filter, setFilter] = useState<RecordStatus | 'all'>('all');
  const [newTitle, setNewTitle] = useState('');

  const filteredRecords = records
    .filter(r => filter === 'all' || r.status === filter)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="flex-1 flex flex-col gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 min-w-0 md:min-w-[400px]">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold text-gray-800">Work Tasks</h2>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value as any)}
          className="p-2 border rounded text-sm bg-gray-50"
          title="Filter tasks"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="changed">Changed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          placeholder="New task title..."
          className="flex-1 p-2 border rounded"
          onKeyDown={e => {
            if (e.key === 'Enter' && newTitle.trim()) {
              onAdd(newTitle);
              setNewTitle('');
            }
          }}
        />
        <button
          onClick={() => {
            if (newTitle.trim()) {
              onAdd(newTitle);
              setNewTitle('');
            }
          }}
          className="p-2 bg-leaf text-white rounded hover:bg-forest transition-colors"
          title="Add task"
        >
          <PlusCircle size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {filteredRecords.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No tasks found. Create one above!</div>
        ) : (
          filteredRecords.map((record) => (
            <motion.div
              layout
              key={record.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={() => onSelect(record.id)}
              className={`p-3 rounded-lg border cursor-pointer transition-colors flex justify-between items-center group
                ${selectedId === record.id ? 'bg-green-50 border-leaf ring-1 ring-leaf' : 'bg-white border-gray-200 hover:border-leaf'}
              `}
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{record.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full uppercase tracking-wider
                    ${record.status === 'draft' ? 'bg-gray-100 text-gray-600' :
                      record.status === 'ready' ? 'bg-blue-100 text-blue-700' :
                      record.status === 'changed' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-700'
                    }
                  `}>
                    {record.status}
                  </span>
                  {record.evidence && (
                    <span className="text-xs text-leaf font-medium flex items-center">
                      ✓ Evidence Attached
                    </span>
                  )}
                  {record.auditLensState === 'conflict' && (
                    <span className="text-xs text-red-600 font-bold">! Discrepancy</span>
                  )}
                </div>
              </div>

              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                <select
                  value={record.status}
                  onChange={e => onUpdateStatus(record.id, e.target.value as RecordStatus)}
                  className="text-xs border rounded p-1 bg-white"
                  title="Update status"
                >
                  <option value="draft">Draft</option>
                  <option value="ready">Ready</option>
                  <option value="changed">Changed</option>
                  <option value="archived">Archived</option>
                </select>
                <button
                  onClick={() => onDelete(record.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                  title="Delete task"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
