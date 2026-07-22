import React, { useState } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const owners = ['Unassigned', 'Alex', 'Jordan', 'Taylor', 'Sam'];

export const HandoffMap = () => {
  const records = useStore((state) => state.records);
  const selectedNodeId = useStore((state) => state.selectedNodeId);
  const connectOwner = useStore((state) => state.connectOwner);
  const updateNode = useStore((state) => state.updateNode);

  const selectedNode = records.find(r => r.id === selectedNodeId);

  // Local state for the signature mutation form
  const [selectedOwner, setSelectedOwner] = useState('');
  const [selectedReadiness, setSelectedReadiness] = useState('');

  // Sync local state when selected node changes
  React.useEffect(() => {
    if (selectedNode) {
      setSelectedOwner(selectedNode.owner || 'Unassigned');
      setSelectedReadiness(selectedNode.readiness || 'pending');
    }
  }, [selectedNode]);

  const handleConnect = () => {
    if (selectedNodeId && selectedOwner && selectedReadiness) {
      connectOwner(selectedNodeId, selectedOwner, selectedReadiness);
    }
  };

  const handleTitleContentChange = (e) => {
    const { name, value } = e.target;
    if (selectedNodeId) {
      updateNode(selectedNodeId, { [name]: value });
    }
  };

  if (!selectedNode) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center text-gray-500">
          <p>Select a node from the list to view and edit its details.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Node Editor</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              name="title"
              value={selectedNode.title}
              onChange={handleTitleContentChange}
              className="w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea
              name="content"
              value={selectedNode.content}
              onChange={handleTitleContentChange}
              rows={4}
              className="w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 bg-gray-50 p-6 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Handoff Connection Map</h3>
          <p className="text-sm text-gray-500 mb-6">
            Connect this record to a handoff owner and update its readiness state. This will update linked views and summaries instantly.
          </p>

          <AnimatePresence mode="popLayout">
            <motion.div
              layout
              key={selectedNode.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Handoff Owner</label>
                  <div className="space-y-2">
                    {owners.map(owner => (
                      <label key={owner} className={cn(
                        "flex items-center p-3 border rounded-lg cursor-pointer transition-colors",
                        selectedOwner === owner ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                      )}>
                        <input
                          type="radio"
                          name="owner"
                          value={owner}
                          checked={selectedOwner === owner}
                          onChange={(e) => setSelectedOwner(e.target.value)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="ml-3 text-sm font-medium text-gray-900">{owner}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Readiness</label>
                  <div className="space-y-2">
                    {['pending', 'complete'].map(readiness => (
                      <label key={readiness} className={cn(
                        "flex items-center p-3 border rounded-lg cursor-pointer transition-colors",
                        selectedReadiness === readiness ? "border-green-500 bg-green-50" : "border-gray-200 hover:bg-gray-50"
                      )}>
                        <input
                          type="radio"
                          name="readiness"
                          value={readiness}
                          checked={selectedReadiness === readiness}
                          onChange={(e) => setSelectedReadiness(e.target.value)}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                        />
                        <span className="ml-3 text-sm font-medium text-gray-900 capitalize">{readiness}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={handleConnect}
                  disabled={selectedOwner === selectedNode.owner && selectedReadiness === selectedNode.readiness}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Apply Connection Update
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
