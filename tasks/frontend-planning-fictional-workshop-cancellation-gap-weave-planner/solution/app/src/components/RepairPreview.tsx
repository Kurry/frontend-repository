import React from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';

export const RepairPreview: React.FC = () => {
  const { repairPreview, cancelWeave, commitWeave, bookings } = useStore();

  if (!repairPreview) return null;

  const movedBooking = bookings.find(b => b.id === repairPreview.moves[0]?.bookingId);
  const oldStart = repairPreview.moves[0]?.fromStartMinute;
  const newStart = repairPreview.moves[0]?.toStartMinute;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-xl border border-gray-200 p-6 w-[600px] z-50"
        role="dialog"
        aria-modal="true"
        aria-label="Repair Preview Sheet"
      >
        <h3 className="text-xl font-bold mb-4">Confirm Ripple Repair</h3>

        <div className="bg-gray-50 border rounded-md p-4 mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-2">Move Set:</p>
          <div className="flex items-center gap-4 text-sm bg-white p-3 border rounded shadow-sm">
            <span className="font-bold text-gray-800">{movedBooking?.id}</span>
            <span className="text-gray-500">{(oldStart! / 60).toFixed(2)}h &rarr; {(newStart! / 60).toFixed(2)}h</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 font-bold rounded">+30 mins</span>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Filling GAP-04 with WL-07 creates a resource conflict on FAC-IVO.
            This is the only valid deterministic repair to resolve it.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={cancelWeave}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2"
          >
            <X size={16} /> Cancel
          </button>
          <button
            onClick={commitWeave}
            className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <Check size={16} /> Confirm Weave
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
