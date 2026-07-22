import { useStore } from '../store';
import { ShieldAlert, Undo } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ProvenanceAtlas() {
  const { records, provenanceAtlasState, traceAndQuarantine, derived, history, undo, past } = useStore();

  const selectedRecord = records.find(r => r.id === provenanceAtlasState.selectedId);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b flex justify-between items-center shrink-0">
        <h2 className="text-xl font-bold">Provenance Atlas</h2>
        <button
          onClick={undo}
          disabled={past.length === 0}
          className="flex items-center gap-2 px-3 py-1 bg-gray-100 disabled:opacity-50 border rounded hover:bg-gray-200"
        >
          <Undo size={16} />
          Undo
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {selectedRecord ? (
          <AnimatePresence mode="popLayout">
            <motion.div
              key={selectedRecord.id + (selectedRecord.lineageQuarantined ? 'quarantined' : 'clean')}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`p-6 border-2 rounded-lg mb-6 ${selectedRecord.lineageQuarantined ? 'border-red-500 bg-red-50' : 'border-blue-200 bg-blue-50'}`}
            >
              <h3 className="text-lg font-bold mb-2">Selected Record: {selectedRecord.title}</h3>
              <p className="mb-4">Trace to source evidence. Review the lineage of this record before deciding to quarantine.</p>

              <div className="flex gap-4">
                <button
                  onClick={traceAndQuarantine}
                  disabled={selectedRecord.lineageQuarantined}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50 hover:bg-red-700"
                >
                  <ShieldAlert size={16} />
                  {selectedRecord.lineageQuarantined ? 'Lineage Quarantined' : 'Quarantine Bad Lineage'}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="p-6 border-2 border-dashed rounded-lg text-center text-gray-500 mb-6">
            Select a record from the collection to view its provenance.
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 border rounded bg-gray-50">
            <h4 className="font-bold text-sm text-gray-500 uppercase">Total Mileage</h4>
            <p className="text-2xl font-bold">{derived.totalMileage}</p>
          </div>
          <div className="p-4 border rounded bg-gray-50">
            <h4 className="font-bold text-sm text-gray-500 uppercase">Quarantined Records</h4>
            <p className="text-2xl font-bold text-red-600">{derived.quarantinedCount}</p>
          </div>
        </div>

        <div>
          <h3 className="font-bold mb-2">Event History</h3>
          <div className="space-y-2 text-sm">
            {history.slice(-10).reverse().map((event, idx) => (
              <div key={idx} className="p-2 border rounded bg-gray-50 flex justify-between">
                <span className="font-mono">{event.action}</span>
                <span className="text-gray-500">{new Date(event.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
            {history.length === 0 && <p className="text-gray-500">No events yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
