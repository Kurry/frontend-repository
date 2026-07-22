import React from 'react';
import { useStore, type IngredientRecord } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';

export const Inspector: React.FC<{ selectedId: string | null }> = ({ selectedId }) => {
  const record = useStore(state => state.records.find(r => r.id === selectedId));

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 h-full">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">Inspector</h2>
      <AnimatePresence mode="wait">
        {record ? (
          <motion.div
            key={record.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Name</label>
              <div className="mt-1 text-sm font-medium text-gray-900">{record.name}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</label>
                <div className="mt-1 text-sm text-gray-900">{record.quantity}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</label>
                <div className="mt-1 text-sm text-gray-900">{record.unit}</div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Status</label>
              <div className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  record.status === 'ready' ? 'bg-green-100 text-green-800' :
                  record.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                  record.status === 'empty' ? 'bg-red-100 text-red-800' :
                  record.status === 'changed' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {record.status}
                </span>
              </div>
            </div>
            {record.recoveryBoardState && (
              <div className="bg-purple-50 p-3 rounded-md border border-purple-100">
                <label className="block text-xs font-medium text-purple-700 uppercase tracking-wider mb-1">Recovery Details</label>
                <div className="text-sm text-purple-900">
                  <p><strong>Resolved:</strong> {record.recoveryBoardState.resolved ? 'Yes' : 'No'}</p>
                  <p><strong>Reason:</strong> {record.recoveryBoardState.reason}</p>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm text-gray-500 italic text-center py-8"
          >
            Select a record to inspect details
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
