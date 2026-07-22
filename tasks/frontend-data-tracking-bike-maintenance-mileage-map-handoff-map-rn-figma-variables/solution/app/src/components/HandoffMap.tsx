import React, { useEffect, useCallback } from 'react';
import { useStore } from '../store';
import type { HandoffOwner } from '../store';
import { motion } from 'framer-motion';
import { AlertCircle, UserCheck, ArrowRight } from 'lucide-react';

export const HandoffMap: React.FC = () => {
  const { records, selectedRecordId, connectHandoffOwner, undo } = useStore();
  const selectedRecord = records.find(r => r.id === selectedRecordId);

  // Keyboard undo binding
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  const handleConnect = useCallback((owner: HandoffOwner, readiness: number) => {
    if (!selectedRecord) return;
    connectHandoffOwner(selectedRecord.id, owner, readiness);
  }, [selectedRecord, connectHandoffOwner]);

  if (!selectedRecord) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center p-8 text-gray-400">
        <div className="text-center">
          <ArrowRight className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Select a record to view or connect to handoff map</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 flex flex-col p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Handoff Map Surface</h1>
        <button
          onClick={undo}
          className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 rounded font-medium transition-colors"
          title="Undo last action (Ctrl+Z)"
        >
          Undo
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 max-w-2xl mx-auto w-full shrink-0">
        <div className="mb-6 pb-6 border-b border-gray-100">
           <h2 className="text-lg font-semibold mb-2">Active Record</h2>
           <p className="text-gray-700">{selectedRecord.notes || 'No notes provided'}</p>
           <div className="flex gap-4 mt-2 text-sm text-gray-500 flex-wrap">
              <span>ID: {selectedRecord.id}</span>
              <span>Status: <span className="font-medium text-gray-800">{selectedRecord.status}</span></span>
              <span>Mileage: {selectedRecord.mileage}</span>
           </div>
        </div>

        {selectedRecord.status === 'archived' ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start gap-3">
             <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
             <p>This record is archived. Conflicting or incomplete mutations are rejected. Restore or change status first before handoff.</p>
          </div>
        ) : (
          <div>
            <h3 className="font-medium text-gray-800 mb-4">Connect to Handoff Owner & Update Readiness</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {['mechanic_a', 'mechanic_b', 'customer'].map((owner) => {
                 const isSelected = selectedRecord.owner === owner;
                 return (
                   <motion.button
                     layout
                     key={owner}
                     onClick={() => handleConnect(owner as HandoffOwner, owner === 'customer' ? 100 : 50)}
                     className={`p-4 border-2 rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${
                       isSelected
                         ? 'border-blue-500 bg-blue-50 text-blue-700'
                         : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                     }`}
                     whileHover={{ scale: 1.02 }}
                     whileTap={{ scale: 0.98 }}
                   >
                     <UserCheck className="w-8 h-8" />
                     <span className="font-medium capitalize">{owner.replace('_', ' ')}</span>
                     {isSelected && (
                       <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                         Readiness: {selectedRecord.readiness}%
                       </span>
                     )}
                   </motion.button>
                 );
               })}
               <motion.button
                 layout
                 onClick={() => handleConnect('unassigned', 0)}
                 className={`p-4 border-2 rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${
                   selectedRecord.owner === 'unassigned'
                     ? 'border-gray-500 bg-gray-100 text-gray-700'
                     : 'border-gray-200 hover:border-gray-300'
                 }`}
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
               >
                 <span className="font-medium">Unassigned</span>
                 {selectedRecord.owner === 'unassigned' && (
                    <span className="text-xs bg-gray-300 text-gray-800 px-2 py-1 rounded-full">
                      Draft / Ready 0%
                    </span>
                  )}
               </motion.button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
