import { useAppStore } from '../store';
import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function BatchReconciler() {
  const selectedIds = useAppStore(state => state.selectedIds);
  const state = useAppStore(state => state.batchReconcilerState);
  const reconcileBatch = useAppStore(state => state.reconcileBatch);
  const resolveConflict = useAppStore(state => state.resolveConflict);
  const derived = useAppStore(state => state.derived);

  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Desktop Panel */}
      <div className="hidden md:flex w-80 bg-white border-l border-gray-200 p-6 flex-col overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Batch Reconciler</h2>

        <div className="mb-6 p-4 bg-gray-50 rounded">
          <h3 className="text-sm font-semibold text-gray-500 mb-2">Status</h3>
          <div className="flex items-center space-x-2">
            <span className={`inline-block w-3 h-3 rounded-full ${
              state === 'idle' ? 'bg-gray-400' :
              state === 'selected' ? 'bg-blue-400' :
              state === 'changed' ? 'bg-yellow-400' :
              state === 'conflict' ? 'bg-red-400' :
              'bg-green-400'
            }`}></span>
            <span className="capitalize font-medium">{state}</span>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-2">Selection</h3>
          <p className="text-2xl font-bold">{selectedIds.size} <span className="text-sm font-normal text-gray-500">records selected</span></p>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-2">Aggregate Totals</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-3 rounded">
              <p className="text-xs text-blue-600 mb-1">Batch Size</p>
              <p className="text-lg font-bold text-blue-900">{derived.count}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded">
              <p className="text-xs text-blue-600 mb-1">Total Intensity</p>
              <p className="text-lg font-bold text-blue-900">{derived.totalIntensity}</p>
            </div>
          </div>
        </div>

        <div className="mt-auto space-y-3 pt-4 border-t border-gray-100">
          {state === 'conflict' && (
            <div className="bg-red-50 p-3 rounded text-sm text-red-800 mb-4">
              <p className="font-bold mb-2">Conflict Detected</p>
              <p className="mb-3">One or more selected records are empty.</p>
              <div className="flex space-x-2">
                <button
                  onClick={() => resolveConflict('accept')}
                  className="flex-1 bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition-colors"
                >
                  Force Reconcile
                </button>
                <button
                  onClick={() => resolveConflict('reject')}
                  className="flex-1 bg-white text-red-600 border border-red-200 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <button
            onClick={reconcileBatch}
            disabled={selectedIds.size === 0 || state === 'conflict'}
            className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Reconcile Batch
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-4 flex justify-between items-center bg-gray-50 border-b border-gray-200 font-bold"
        >
          <span>Batch Reconciler ({selectedIds.size} selected)</span>
          {isOpen ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 max-h-[60vh] overflow-y-auto">
                <div className="mb-4 flex items-center justify-between bg-gray-50 p-3 rounded">
                  <span className="text-sm font-semibold text-gray-500">Status</span>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-block w-3 h-3 rounded-full ${
                      state === 'idle' ? 'bg-gray-400' :
                      state === 'selected' ? 'bg-blue-400' :
                      state === 'changed' ? 'bg-yellow-400' :
                      state === 'conflict' ? 'bg-red-400' :
                      'bg-green-400'
                    }`}></span>
                    <span className="capitalize font-medium text-sm">{state}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">Aggregate Totals</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-3 rounded">
                      <p className="text-xs text-blue-600 mb-1">Batch Size</p>
                      <p className="text-lg font-bold text-blue-900">{derived.count}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded">
                      <p className="text-xs text-blue-600 mb-1">Total Intensity</p>
                      <p className="text-lg font-bold text-blue-900">{derived.totalIntensity}</p>
                    </div>
                  </div>
                </div>

                {state === 'conflict' && (
                  <div className="bg-red-50 p-3 rounded text-sm text-red-800 mb-4">
                    <p className="font-bold mb-2">Conflict Detected</p>
                    <p className="mb-3">One or more selected records are empty.</p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => resolveConflict('accept')}
                        className="flex-1 bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition-colors"
                      >
                        Force Reconcile
                      </button>
                      <button
                        onClick={() => resolveConflict('reject')}
                        className="flex-1 bg-white text-red-600 border border-red-200 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={reconcileBatch}
                  disabled={selectedIds.size === 0 || state === 'conflict'}
                  className="w-full mt-2 bg-indigo-600 text-white font-bold py-3 px-4 rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Reconcile Batch
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
