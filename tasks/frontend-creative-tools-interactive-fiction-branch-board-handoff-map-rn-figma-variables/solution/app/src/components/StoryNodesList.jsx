import React from 'react';
import { useStore } from '../store';
import { motion } from 'framer-motion';
import { FileEdit, Trash2, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const statusColors = {
  empty: 'bg-gray-100 text-gray-800',
  draft: 'bg-yellow-100 text-yellow-800',
  ready: 'bg-green-100 text-green-800',
  changed: 'bg-blue-100 text-blue-800',
  archived: 'bg-gray-800 text-gray-100',
};

export const StoryNodesList = ({ onClose }) => {
  const records = useStore((state) => state.records);
  const filterStatus = useStore((state) => state.filterStatus);
  const setFilterStatus = useStore((state) => state.setFilterStatus);
  const selectedNodeId = useStore((state) => state.selectedNodeId);
  const selectNode = useStore((state) => state.selectNode);
  const deleteNode = useStore((state) => state.deleteNode);
  const createNode = useStore((state) => state.createNode);

  const filteredRecords = filterStatus === 'all'
    ? records
    : records.filter((r) => r.status === filterStatus);

  const handleSelectNode = (id) => {
    selectNode(id);
    if (onClose) onClose();
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-200 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Story Nodes</h2>
          <button
            onClick={() => createNode({ title: 'New Node', content: '', status: 'empty', owner: 'Unassigned', readiness: 'pending' })}
            className="p-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            title="Create Node"
            aria-label="Create Node"
          >
            <Plus size={18} />
          </button>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
          aria-label="Filter by status"
        >
          <option value="all">All Statuses</option>
          <option value="empty">Empty</option>
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="changed">Changed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filteredRecords.map((node) => (
          <motion.div
            layout
            key={node.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={() => handleSelectNode(node.id)}
            className={cn(
              "p-3 rounded-lg border cursor-pointer transition-colors relative group",
              selectedNodeId === node.id ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
            )}
          >
            <div className="flex justify-between items-start mb-1 gap-2">
              <h3 className="font-medium text-sm text-gray-900 truncate flex-1">{node.title}</h3>
              <span className={cn("text-xs px-2 py-0.5 rounded-full whitespace-nowrap shrink-0", statusColors[node.status])}>
                {node.status}
              </span>
            </div>
            <p className="text-xs text-gray-500 line-clamp-2 pr-6">
              {node.content || <span className="italic">Empty content</span>}
            </p>

            {/* Delete button appears on hover (and always slightly visible on touch devices if hover unavailable, handled by group-hover logic usually, but let's make it more robust for touch) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if(window.confirm('Delete this node?')) deleteNode(node.id);
              }}
              className="absolute bottom-2 right-2 p-1.5 text-gray-400 hover:text-red-600 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-white/80 rounded"
              aria-label="Delete Node"
            >
              <Trash2 size={14} />
            </button>
          </motion.div>
        ))}
        {filteredRecords.length === 0 && (
          <div className="text-center p-6 text-sm text-gray-500">
            No story nodes found.
          </div>
        )}
      </div>
    </div>
  );
};
