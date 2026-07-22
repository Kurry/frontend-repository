import React, { useState } from 'react';
import { useAppStore } from '../store';
import { IconUser, IconArrowRight, IconX } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';

const OWNERS = [
  { id: 'owner-1', name: 'City Recycling Center', type: 'Facility' },
  { id: 'owner-2', name: 'Green Earth Compost', type: 'Compost' },
  { id: 'owner-3', name: 'Scrap Metal Co', type: 'Scrap' },
];

export const HandoffMap: React.FC = () => {
  const { state, dispatch } = useAppStore();
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const selectedRecord = state.records.find(r => r.id === selectedRecordId);

  const connectOwner = (ownerId: string) => {
    if (!selectedRecordId) return;

    // Status transformation logic (e.g. if it was draft, maybe it becomes ready, if ready it becomes changed?)
    // Following proposal: "connect a selected record to a handoff owner and update readiness"
    const readiness = selectedRecord?.status === 'ready' ? 'changed' : 'ready';

    dispatch({
      type: 'CONNECT_OWNER',
      payload: {
        recordId: selectedRecordId,
        ownerId,
        readiness
      }
    });
  };

  const undo = () => {
    dispatch({ type: 'UNDO' });
  };

  return (
    <div className="bg-white p-4 shadow rounded-lg border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Handoff Map</h2>
        <button
          onClick={undo}
          disabled={state.history.length === 0}
          className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
        >
          Undo Last Mutation
        </button>
      </div>

      <div className="flex gap-6 h-80">
        {/* Source Items */}
        <div className="w-1/3 flex flex-col gap-2 overflow-y-auto pr-2">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Available Events</h3>
          {state.records.filter(r => r.status !== 'archived' && r.status !== 'empty').map(record => (
            <motion.button
              key={record.id}
              onClick={() => setSelectedRecordId(record.id)}
              className={`p-3 text-left border rounded-md transition-colors ${
                selectedRecordId === record.id
                  ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-500'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="font-medium text-gray-900 text-sm">{record.name}</div>
              <div className="text-xs text-gray-500 mt-1">{record.weight} lbs • {record.status}</div>
            </motion.button>
          ))}
        </div>

        {/* Connections / Canvas */}
        <div className="flex-1 border-l border-r border-gray-100 flex flex-col items-center justify-center bg-gray-50 relative rounded-lg">
          <AnimatePresence>
            {selectedRecord ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4 w-full px-8"
              >
                <div className="p-3 bg-white border border-blue-200 shadow-sm rounded-md w-full text-center">
                  <div className="text-sm font-medium text-gray-900">{selectedRecord.name}</div>
                  <div className="text-xs text-gray-500">{selectedRecord.status}</div>
                </div>

                <IconArrowRight className="text-gray-400" />

                {selectedRecord.ownerId ? (
                  <div className="p-3 bg-green-50 border border-green-200 text-green-900 shadow-sm rounded-md w-full flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconUser size={16} />
                      <span className="text-sm font-medium">
                        {OWNERS.find(o => o.id === selectedRecord.ownerId)?.name || selectedRecord.ownerId}
                      </span>
                    </div>
                    <button
                      className="p-1 hover:bg-green-100 rounded-full"
                      onClick={() => dispatch({ type: 'CONNECT_OWNER', payload: { recordId: selectedRecord.id, ownerId: '', readiness: 'draft' }})}
                    >
                      <IconX size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 italic">No owner connected</div>
                )}
              </motion.div>
            ) : (
              <div className="text-gray-400 text-sm">Select an event to connect</div>
            )}
          </AnimatePresence>
        </div>

        {/* Target Owners */}
        <div className="w-1/3 flex flex-col gap-2 overflow-y-auto pl-2">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Handoff Owners</h3>
          {OWNERS.map(owner => (
            <motion.button
              key={owner.id}
              onClick={() => connectOwner(owner.id)}
              disabled={!selectedRecordId}
              className={`p-3 text-left border rounded-md transition-colors flex items-center gap-2 ${
                selectedRecord?.ownerId === owner.id
                  ? 'bg-green-50 border-green-300'
                  : 'bg-white border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
              whileHover={{ scale: selectedRecordId ? 1.01 : 1 }}
              whileTap={{ scale: selectedRecordId ? 0.98 : 1 }}
            >
              <IconUser size={16} className="text-gray-400" />
              <div>
                <div className="font-medium text-gray-900 text-sm">{owner.name}</div>
                <div className="text-xs text-gray-500 mt-1">{owner.type}</div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};
