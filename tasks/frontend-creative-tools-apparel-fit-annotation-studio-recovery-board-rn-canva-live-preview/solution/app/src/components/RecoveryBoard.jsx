import React, { useState } from 'react';
import { useStore } from '../store';
import { RefreshCcw, Undo2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function RecoveryBoard() {
  const records = useStore((state) => state.records);
  const derived = useStore((state) => state.derived);
  const updateRecord = useStore((state) => state.updateRecord);
  const undo = useStore((state) => state.undo);
  const history = useStore((state) => state.history);

  const [selectedId, setSelectedId] = useState(null);

  const conflictRecords = records.filter(r => r.status === 'conflict');
  const selectedRecord = records.find(r => r.id === selectedId);

  const handleRecover = (id) => {
    // Signature mutation: Move a failed record into a recovery path
    // and repair its downstream consequences.
    // If it's incomplete or has an issue (e.g. invalid bounds), reject without partial updates
    const rec = records.find(r => r.id === id);
    if (!rec) return;

    if (rec.measurement < 0 || rec.measurement > 200) {
       alert("Invalid bounds, cannot recover this record. Repair failed.");
       return;
    }

    // Repair by resolving the conflict
    updateRecord(id, {
      status: 'resolved',
      title: `${rec.title} (Recovered)`
    });
    setSelectedId(null);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 h-[400px]">
      <div className="flex-1 bg-gray-50 rounded shadow p-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-red-700">
            <AlertCircle size={20} />
            Recovery Board
          </h2>
          <button
            onClick={undo}
            disabled={history.length === 0}
            className="flex items-center gap-1 text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded disabled:opacity-50"
            aria-label="Undo last action"
          >
            <Undo2 size={16} /> Undo
          </button>
        </div>

        {conflictRecords.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            <CheckCircle2 size={48} className="mx-auto mb-2 text-green-500" />
            <p>No conflicts to recover.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {conflictRecords.map(r => (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className={`p-3 border-2 rounded cursor-pointer ${selectedId === r.id ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'}`}
                  onClick={() => setSelectedId(r.id)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedId(r.id);
                    }
                  }}
                  role="button"
                  aria-pressed={selectedId === r.id}
                >
                  <h3 className="font-semibold text-gray-800">{r.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">Measurement: {r.measurement}cm</p>
                  <div className="text-xs font-bold text-red-600 bg-red-100 inline-block px-2 py-1 rounded uppercase tracking-wider">
                    {r.status}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="w-full md:w-80 flex flex-col gap-4">
        {/* Linked Summary View */}
        <div className="bg-blue-50 p-4 rounded shadow border border-blue-100" aria-live="polite">
          <h3 className="text-sm font-bold text-blue-800 mb-1 uppercase tracking-wider">Derived Summary</h3>
          <p className="text-blue-900">{derived.summary}</p>
        </div>

        {/* Selected Details & Action */}
        <div className="bg-white p-4 rounded shadow flex-1">
          <h3 className="font-bold mb-4">Inspection Panel</h3>
          {selectedRecord ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 uppercase">Selected ID</label>
                <div className="font-mono text-sm">{selectedRecord.id}</div>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Issue</label>
                <div className="text-red-600 text-sm font-semibold">Failed verification downstream.</div>
              </div>
              <button
                onClick={() => handleRecover(selectedRecord.id)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex justify-center items-center gap-2 mt-4"
                aria-label="Move to recovery path and repair"
              >
                <RefreshCcw size={18} /> Repair & Resolve
              </button>
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">
              Select a conflict record to inspect and repair.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
