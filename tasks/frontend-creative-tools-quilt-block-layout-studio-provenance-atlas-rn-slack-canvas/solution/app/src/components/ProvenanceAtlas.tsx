import { useState } from 'react';
import { useStore } from '../store';
import { ShieldAlert, History, ArrowLeftRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ProvenanceAtlas = () => {
  const { records, activeRecordId, traceAndQuarantineLineage, undo } = useStore();
  const [quarantineReason, setQuarantineReason] = useState('');

  const activeRecord = records.find(r => r.id === activeRecordId);

  const handleQuarantine = () => {
    if (activeRecordId && quarantineReason.trim()) {
      traceAndQuarantineLineage(activeRecordId, quarantineReason);
      setQuarantineReason('');
    }
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm p-4 flex flex-col gap-4 h-full">
      <div className="flex justify-between items-center border-b pb-2">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <History className="text-indigo-600" />
          Provenance Atlas
        </h2>
        <button
          onClick={undo}
          className="flex items-center gap-1 text-sm bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
          title="Undo last mutation (Ctrl+Z)"
        >
          <ArrowLeftRight size={16} /> Undo
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {!activeRecord ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="h-full flex items-center justify-center text-gray-500 text-center italic"
            >
              Select a block from the collection to view its provenance and trace its lineage.
            </motion.div>
          ) : (
            <motion.div
              key={activeRecord.id}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-4"
            >
              <div className="bg-indigo-50 p-3 rounded border border-indigo-100">
                <h3 className="font-semibold text-indigo-900">{activeRecord.name}</h3>
                <div className="text-sm text-indigo-700 mt-1">
                  ID: <span className="font-mono text-xs">{activeRecord.id}</span>
                </div>
                <div className="text-sm mt-2 flex justify-between">
                  <span>State: <strong className="uppercase">{activeRecord.provenanceState}</strong></span>
                  <span>Status: <strong>{activeRecord.status}</strong></span>
                </div>
              </div>

              <div className="border-l-2 border-indigo-200 pl-4 py-2 space-y-4">
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 w-3 h-3 bg-indigo-400 rounded-full"></div>
                  <div className="text-sm font-medium">Created</div>
                  <div className="text-xs text-gray-500">{new Date(activeRecord.createdAt).toLocaleString()}</div>
                </div>
                {activeRecord.updatedAt !== activeRecord.createdAt && (
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 w-3 h-3 bg-blue-400 rounded-full"></div>
                    <div className="text-sm font-medium">Last Modified</div>
                    <div className="text-xs text-gray-500">{new Date(activeRecord.updatedAt).toLocaleString()}</div>
                  </div>
                )}
                {activeRecord.lineageInfo && (
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="text-sm font-medium text-red-700">Quarantined</div>
                    <div className="text-xs text-gray-700 mt-1 bg-red-50 p-2 rounded border border-red-100">
                      Reason: {activeRecord.lineageInfo}
                    </div>
                  </div>
                )}
              </div>

              {activeRecord.provenanceState !== 'conflict' && (
                <div className="mt-4 pt-4 border-t border-dashed">
                  <h4 className="font-semibold text-sm mb-2 text-gray-700">Trace & Quarantine Lineage</h4>
                  <p className="text-xs text-gray-500 mb-3">
                    If this block's source evidence is compromised, trace its lineage and quarantine it to prevent downstream usage.
                  </p>
                  <div className="flex flex-col gap-2">
                    <textarea
                      placeholder="Reason for quarantine..."
                      className="border rounded p-2 text-sm w-full focus:ring focus:ring-red-200 focus:border-red-500"
                      rows={2}
                      value={quarantineReason}
                      onChange={(e) => setQuarantineReason(e.target.value)}
                    ></textarea>
                    <button
                      onClick={handleQuarantine}
                      disabled={!quarantineReason.trim()}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white p-2 rounded flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                    >
                      <ShieldAlert size={16} /> Quarantine Bad Lineage
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
