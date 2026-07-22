
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';

export function FlavorComponentList() {
  const { records, filterStatus, selectedRecordId, selectRecord } = useStore();

  const filteredRecords = records.filter(r =>
    filterStatus === 'all' ? true : r.status === filterStatus
  );

  return (
    <ul className="p-2 space-y-1">
      <AnimatePresence>
        {filteredRecords.length === 0 && (
          <li className="p-4 text-center text-sm text-slate-500">
            No components found for this filter.
          </li>
        )}
        {filteredRecords.map(record => (
          <motion.li
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            key={record.id}
          >
            <button
              onClick={() => selectRecord(record.id)}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                selectedRecordId === record.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              <div className="font-medium truncate">{record.name}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-block w-2 h-2 rounded-full ${
                  record.status === 'ready' ? 'bg-green-400' :
                  record.status === 'draft' ? 'bg-yellow-400' :
                  record.status === 'changed' ? 'bg-blue-400' :
                  record.status === 'archived' ? 'bg-slate-500' : 'bg-slate-600'
                }`} />
                <span className="text-xs opacity-75 capitalize">{record.status}</span>
                <span className="text-xs opacity-50 ml-auto">
                  v{record.checkpoints.length}
                </span>
              </div>
            </button>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
