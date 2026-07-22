import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Undo2, Map, ShieldAlert } from 'lucide-react';

export const ProvenanceAtlas = () => {
  const records = useStore(state => state.records);
  const provenance = useStore(state => state.provenance);
  const traceAndQuarantine = useStore(state => state.traceAndQuarantine);
  const undo = useStore(state => state.undo);

  const selectedRecord = records.find(r => r.id === provenance.selectedRecordId);

  return (
    <div className="flex flex-col w-full lg:w-1/2 p-6 bg-gray-50 border-r border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Map className="text-blue-600" /> Provenance Atlas
        </h2>
        <button
          onClick={() => undo()}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Undo last quarantine"
        >
          <Undo2 size={16} /> Undo
        </button>
      </div>

      <div className="flex-grow flex flex-col items-center justify-center relative">
        <AnimatePresence mode="wait">
          {!selectedRecord ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center text-gray-500 p-8"
            >
              <Map size={48} className="mx-auto mb-4 opacity-20" />
              <p>Select a kiln piece from the list to view its provenance.</p>
            </motion.div>
          ) : (
            <motion.div
              key="selected"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full max-w-md"
            >
              <div className={`p-6 rounded-xl border shadow-sm transition-all duration-300 ${provenance.geometry === 'quarantined' ? 'bg-red-50 border-red-200 shadow-red-100' : 'bg-white border-blue-200 shadow-blue-50'}`}>

                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{selectedRecord.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">ID: {selectedRecord.id}</p>
                  </div>

                  {selectedRecord.lineage === 'bad' && (
                    <motion.div initial={{ rotate: -180, scale: 0 }} animate={{ rotate: 0, scale: 1 }} className="text-red-500">
                      <ShieldAlert size={32} />
                    </motion.div>
                  )}
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Current Status</span>
                    <span className="font-medium capitalize">{selectedRecord.status}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Lineage State</span>
                    <span className={`font-medium capitalize ${selectedRecord.lineage === 'bad' ? 'text-red-600' : 'text-green-600'}`}>
                      {selectedRecord.lineage}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => traceAndQuarantine(selectedRecord.id)}
                  disabled={selectedRecord.lineage === 'bad'}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    selectedRecord.lineage === 'bad'
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                      : 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-sm'
                  }`}
                  aria-label="Trace and Quarantine"
                >
                  <AlertTriangle size={18} />
                  {selectedRecord.lineage === 'bad' ? 'Lineage Quarantined' : 'Trace & Quarantine Lineage'}
                </button>

                <p className="text-xs text-center text-gray-400 mt-4">
                  This action marks the origin as compromised and archives the piece.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
