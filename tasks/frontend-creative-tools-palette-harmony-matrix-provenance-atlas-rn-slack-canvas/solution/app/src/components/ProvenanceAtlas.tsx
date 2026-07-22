import { useStore } from '../store';
import { AlertOctagon, GitMerge, FileCheck, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ProvenanceAtlas = () => {
  const { records, selectedRecordId, quarantineLineage, derived } = useStore();

  const selectedRecord = records.find(r => r.id === selectedRecordId);

  return (
    <div className="flex flex-col h-full">
      {/* Derived Summary Banner */}
      <div className="mb-6 grid grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
        <div>
          <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-1">Total Records</p>
          <p className="text-2xl font-light text-neutral-900">{derived.total}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-1">Ready</p>
          <p className="text-2xl font-light text-green-600">{derived.readyCount}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-1">Bad Lineage</p>
          <p className="text-2xl font-light text-red-600">{derived.badLineageCount}</p>
        </div>
      </div>

      <div className="flex-1 bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden flex flex-col relative">
        <div className="border-b border-neutral-200 p-4 bg-neutral-50 flex items-center gap-2">
          <GitMerge className="w-5 h-5 text-neutral-600" />
          <h2 className="font-semibold text-neutral-800">Provenance Atlas</h2>
        </div>

        <div className="flex-1 p-6 flex flex-col items-center justify-center relative overflow-y-auto">
          <AnimatePresence mode="wait">
            {!selectedRecord ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center max-w-sm"
              >
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
                  <Info className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-lg font-medium text-neutral-800 mb-2">Select a record to trace</h3>
                <p className="text-sm text-neutral-500">
                  Select a color from the collection to view its provenance evidence and manage its lineage state.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={selectedRecord.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="w-full max-w-2xl flex flex-col gap-8 items-center"
              >
                {/* Visual Lineage Flow */}
                <div className="w-full flex flex-col items-center gap-4 relative">

                  {/* Source Evidence Node */}
                  <div className="w-64 bg-white border-2 border-neutral-200 rounded-lg p-4 text-center shadow-sm relative z-10">
                    <p className="text-xs uppercase tracking-wider font-semibold text-neutral-500 mb-2">Source Evidence</p>
                    <p className="text-sm text-neutral-700 italic">"{selectedRecord.evidence}"</p>
                  </div>

                  {/* Connecting Line */}
                  <div className={`w-0.5 h-12 ${selectedRecord.lineage === 'bad' ? 'bg-red-400' : 'bg-green-400'} transition-colors duration-500`} />

                  {/* Current Record Node */}
                  <div className={`w-80 bg-white border-2 rounded-lg p-5 shadow-sm relative z-10 transition-colors duration-500 ${
                    selectedRecord.lineage === 'bad' ? 'border-red-300 bg-red-50' : 'border-neutral-200'
                  }`}>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg shadow-inner shrink-0" style={{ backgroundColor: selectedRecord.colorValue }} />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-neutral-900 leading-tight">{selectedRecord.name}</h3>
                        <p className="text-sm font-mono text-neutral-500 mb-2">{selectedRecord.colorValue}</p>
                        <div className="flex gap-2">
                          <span className="px-2 py-0.5 bg-white border border-neutral-200 rounded text-xs font-medium text-neutral-600 uppercase">
                            {selectedRecord.status}
                          </span>
                          <span className={`px-2 py-0.5 border rounded text-xs font-medium uppercase transition-colors ${
                            selectedRecord.lineage === 'bad' ? 'bg-red-100 border-red-200 text-red-700' : 'bg-green-100 border-green-200 text-green-700'
                          }`}>
                            {selectedRecord.lineage} lineage
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Actions */}
                <div className="mt-8 flex gap-4 w-full max-w-sm">
                  {selectedRecord.lineage === 'good' ? (
                    <button
                      onClick={() => quarantineLineage(selectedRecord.id)}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 px-4 py-2.5 rounded-lg font-medium transition-colors"
                      aria-label="Quarantine bad lineage"
                    >
                      <AlertOctagon className="w-5 h-5" />
                      <span>Quarantine Lineage</span>
                    </button>
                  ) : (
                    <div className="flex-1 flex items-center justify-center gap-2 bg-neutral-100 text-neutral-500 border border-neutral-200 px-4 py-2.5 rounded-lg font-medium cursor-not-allowed">
                      <FileCheck className="w-5 h-5" />
                      <span>Lineage Quarantined</span>
                    </div>
                  )}
                </div>

                {selectedRecord.lineage === 'bad' && (
                  <p className="text-sm text-red-600 text-center max-w-md">
                    This record has been quarantined. Its state has been forced to 'changed' to await review.
                  </p>
                )}

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
