import { useStore } from './store';
import { Add, TrashCan, PlayOutline, DocumentTasks, FolderAdd } from '@carbon/icons-react';
import { motion } from 'motion/react';
import { useState } from 'react';

export default function GlazeGrid() {
  const { records, folders, selectedRecords, toggleSelection, setSelection, queueRecords, deleteRecords, addRecord, branchToScenario } = useStore();
  const [filter, setFilter] = useState('all');

  const filteredRecords = records.filter(r => {
      if (filter === 'all') return true;
      if (filter === 'queued') return r.queued;
      return r.status === filter;
  });

  const handleQueueSelected = () => {
      if(selectedRecords.length > 0) queueRecords(selectedRecords, true);
  };

  const handleDeleteSelected = () => {
      if(selectedRecords.length > 0) deleteRecords(selectedRecords);
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold flex items-center gap-2">
            <DocumentTasks size={20} />
            Glaze Tests
        </h2>
        <div className="flex items-center gap-2">
           <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
              aria-label="Filter records"
           >
               <option value="all">All</option>
               <option value="queued">Queued</option>
               <option value="draft">Draft</option>
               <option value="ready">Ready</option>
               <option value="changed">Changed</option>
               <option value="archived">Archived</option>
           </select>
          <button
            onClick={() => addRecord({})}
            className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none"
            title="Create new record"
            aria-label="Create new record"
          >
            <Add size={16} />
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedRecords.length > 0 && (
          <div className="bg-blue-50 p-2 px-4 flex items-center justify-between border-b border-blue-100">
              <span className="text-sm text-blue-800">{selectedRecords.length} selected</span>
              <div className="flex gap-2">
                  <button onClick={handleQueueSelected} className="flex items-center gap-1 text-sm text-blue-700 hover:text-blue-900 focus:outline-none p-1 rounded hover:bg-blue-100">
                      <PlayOutline size={16} /> Queue
                  </button>
                  <button onClick={handleDeleteSelected} className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800 focus:outline-none p-1 rounded hover:bg-red-50">
                      <TrashCan size={16} /> Delete
                  </button>
              </div>
          </div>
      )}

      <div className="flex-1 overflow-auto p-4 bg-gray-50">
        {filteredRecords.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3" aria-live="polite">
            <DocumentTasks size={48} className="opacity-20" />
            <p>No records found.</p>
            <button
                onClick={() => addRecord({})}
                className="mt-2 text-sm text-blue-600 hover:underline focus:outline-none"
            >
                Create one now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" role="list">
            {filteredRecords.sort((a,b) => a.order - b.order).map((record) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={record.id}
                role="listitem"
                className={`relative bg-white p-4 rounded border cursor-pointer transition-shadow focus-within:ring-2 focus-within:ring-blue-500 hover:shadow-md ${
                  selectedRecords.includes(record.id) ? 'border-blue-500 shadow-sm' : 'border-gray-200'
                }`}
                onClick={() => toggleSelection(record.id)}
              >
                <div className="flex justify-between items-start mb-2">
                   <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedRecords.includes(record.id)}
                        onChange={() => toggleSelection(record.id)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                        aria-label={`Select ${record.name}`}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <h3 className="font-medium text-gray-900 truncate max-w-[150px]">{record.name}</h3>
                   </div>
                   <div className="flex gap-1 items-center">
                       {record.queued && <PlayOutline size={16} className="text-orange-500" title="Queued for firing" />}
                       <span className={`text-xs px-2 py-0.5 rounded-full border ${
                           record.status === 'ready' ? 'bg-green-50 text-green-700 border-green-200' :
                           record.status === 'draft' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                           record.status === 'changed' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                           'bg-gray-100 text-gray-600 border-gray-200'
                       }`}>
                           {record.status}
                       </span>
                   </div>
                </div>
                <div className="text-sm text-gray-500 mb-4 line-clamp-2">
                   Cone {record.firingTemp} • {record.materials.length} materials
                   {record.notes && <div className="mt-1 text-xs text-gray-400 italic">{record.notes}</div>}
                </div>

                <div className="flex justify-end pt-2 border-t border-gray-100 mt-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); branchToScenario(record.id); }}
                        className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded border border-purple-200 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                        aria-label={`Branch ${record.name} to scenario`}
                    >
                        Branch Scenario
                    </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
