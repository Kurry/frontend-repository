import React, { useState, useEffect } from 'react';
import { PackingItemWithHistory, PackingItem } from '../store';
import { History, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

interface ReplayTimelineProps {
  item: PackingItemWithHistory | null;
  onRestore: (itemId: string, checkpointId: string) => void;
  onClose: () => void;
  setScrubPreview: (preview: { itemId: string; previewState: PackingItem } | null) => void;
}

export function ReplayTimeline({ item, onRestore, onClose, setScrubPreview }: ReplayTimelineProps) {
  const [previewState, setLocalPreviewState] = useState<PackingItem | null>(null);
  const [scrubIndex, setScrubIndex] = useState<number>(0);

  useEffect(() => {
    if (item && item.history.length > 0) {
      setScrubIndex(item.history.length - 1);
      setLocalPreviewState(item);
      setScrubPreview(null); // Reset global preview on select
    } else {
      setLocalPreviewState(null);
      setScrubPreview(null);
    }
  }, [item, setScrubPreview]);

  // Clean up global preview on unmount
  useEffect(() => {
    return () => setScrubPreview(null);
  }, [setScrubPreview]);

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!item) return;
    const index = parseInt(e.target.value);
    setScrubIndex(index);
    const newState = item.history[index].state;
    setLocalPreviewState(newState);
    setScrubPreview({ itemId: item.id, previewState: newState });
  };

  const handleRestore = () => {
    if (!item || !previewState) return;
    const checkpoint = item.history[scrubIndex];
    onRestore(item.id, checkpoint.id);
  };

  if (!item || !previewState) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
        <History className="w-12 h-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Replay Timeline</h3>
        <p className="text-gray-500 max-w-sm">
          Select an item from the list to view its history, scrub through past states, and restore prior checkpoints.
        </p>
      </div>
    );
  }

  const isCurrentState = scrubIndex === item.history.length - 1;
  const currentCheckpoint = item.history[scrubIndex];

  // Format timestamp for display
  const date = new Date(currentCheckpoint.timestamp);
  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-600" />
          Replay Timeline
        </h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-sm font-medium"
        >
          Close Panel
        </button>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <div className="mb-8 relative">
          <motion.div
            className="p-5 rounded-xl border-2 border-indigo-100 bg-indigo-50 shadow-sm relative overflow-hidden"
            layoutId="preview-card"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
              {isCurrentState ? 'Current State' : 'Historical Preview'}
            </div>

            <h4 className="text-2xl font-bold text-gray-900 mb-1">{previewState.name}</h4>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm text-gray-500 font-medium">Category</p>
                <p className="text-gray-900">{previewState.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Status</p>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-800 capitalize">
                  {previewState.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Weight</p>
                <p className="text-gray-900 font-mono">{previewState.weight}g</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Quantity</p>
                <p className="text-gray-900 font-mono">× {previewState.quantity}</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mt-auto">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-sm font-medium text-gray-700">Timeline Scrubber</p>
              <p className="text-xs text-gray-500 font-mono mt-1">
                Checkpoint {scrubIndex + 1} of {item.history.length} • {timeString}
              </p>
            </div>

            <button
              onClick={handleRestore}
              disabled={isCurrentState}
              className={`flex items-center gap-1.5 px-4 py-2 rounded shadow-sm text-sm font-medium transition-all ${
                isCurrentState
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-700 hover:shadow-md'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              Restore State
            </button>
          </div>

          <div className="relative pt-4 pb-2">
            <input
              type="range"
              min="0"
              max={item.history.length > 0 ? item.history.length - 1 : 0}
              value={scrubIndex}
              onChange={handleScrub}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              aria-label="Scrub through timeline history"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2 font-mono">
              <span>Start</span>
              <span>Now</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
