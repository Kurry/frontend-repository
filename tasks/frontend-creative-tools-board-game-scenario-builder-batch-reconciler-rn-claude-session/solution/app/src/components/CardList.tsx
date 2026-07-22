import { useState } from 'react';
import { useStore } from '../store';
import type { ScenarioCard } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface CardListProps {
  onEdit: (card: ScenarioCard) => void;
  selectedIds: string[];
  onSelectToggle: (id: string) => void;
}

export function CardList({ onEdit, selectedIds, onSelectToggle }: CardListProps) {
  const records = useStore((state) => state.records);
  const deleteRecord = useStore((state) => state.deleteRecord);

  const [filter, setFilter] = useState<ScenarioCard['status'] | 'all'>('all');

  const filteredRecords = filter === 'all'
    ? records
    : records.filter(r => r.status === filter);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="p-4 bg-white border-b border-gray-200 flex flex-wrap gap-4 items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Scenario Cards</h1>
        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">Filter:</label>
          <select
            id="status-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="p-2 border border-gray-300 rounded bg-white text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="empty">Empty</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="changed">Changed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 relative">
        {filteredRecords.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500" aria-live="polite">
            No scenario cards found for this domain state.
          </div>
        ) : (
          <AnimatePresence>
            {filteredRecords.map((card) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={card.id}
                className={`p-4 bg-white border rounded shadow-sm flex flex-col gap-2 transition-colors ${selectedIds.includes(card.id) ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(card.id)}
                      onChange={() => onSelectToggle(card.id)}
                      className="mt-1.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      aria-label={`Select ${card.title}`}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{card.title}</h3>
                      <p className="text-sm text-gray-500 truncate">{card.description || 'No description'}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 capitalize">
                      {card.status}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      Diff: {card.difficulty}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 justify-end mt-2">
                  <button
                    onClick={() => onEdit(card)}
                    className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none focus:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteRecord(card.id)}
                    className="text-sm text-red-600 hover:text-red-800 focus:outline-none focus:underline"
                  >
                    Archive/Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
