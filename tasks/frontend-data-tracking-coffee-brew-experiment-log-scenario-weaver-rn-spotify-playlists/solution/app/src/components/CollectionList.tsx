import React, { useState } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'empty': return 'bg-gray-200 text-gray-500';
    case 'draft': return 'bg-gray-300 text-gray-700';
    case 'ready': return 'bg-blue-100 text-blue-800';
    case 'changed': return 'bg-yellow-100 text-yellow-800';
    case 'archived': return 'bg-gray-500 text-white';
    default: return 'bg-gray-200';
  }
};

export const CollectionList: React.FC = () => {
  const { records, selection, setSelection } = useStore();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('roastDate');

  const toggleSelection = (id: string, e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (selection.includes(id)) {
      setSelection(selection.filter(s => s !== id));
    } else {
      setSelection([...selection, id]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleSelection(id, e);
    }
  };

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-text-muted">
        <p className="text-lg">No experiments found.</p>
        <p className="text-sm">Create a new one to get started.</p>
      </div>
    );
  }

  // Filter and Sort
  let filteredRecords = filterStatus === 'all'
    ? records
    : records.filter(r => r.status === filterStatus);

  filteredRecords = [...filteredRecords].sort((a, b) => {
    if (sortBy === 'roastDate') {
      return new Date(b.roastDate).getTime() - new Date(a.roastDate).getTime();
    }
    if (sortBy === 'yield') {
      return (b.yield || 0) - (a.yield || 0);
    }
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex justify-between items-center bg-surface p-3 rounded-lg border border-border sticky top-0 z-10 shadow-sm">
        <div className="flex gap-2 items-center">
            <label className="text-sm font-semibold text-text-muted">Filter:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm border border-border rounded-md p-1 outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All</option>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="changed">Changed</option>
              <option value="archived">Archived</option>
            </select>
        </div>
        <div className="flex gap-2 items-center">
            <label className="text-sm font-semibold text-text-muted">Sort:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border border-border rounded-md p-1 outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="roastDate">Date (Newest)</option>
              <option value="yield">Yield (Highest)</option>
              <option value="title">Title (A-Z)</option>
            </select>
        </div>
      </div>

      <div className="flex flex-col gap-3 pb-8">
        <AnimatePresence>
          {filteredRecords.map(record => {
            const isSelected = selection.includes(record.id);
            const isScenarioSelected = record.scenarioState === 'selected';
            const isScenarioChanged = record.scenarioState === 'changed';

            return (
              <motion.div
                layout={!prefersReducedMotion}
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                key={record.id}
                tabIndex={0}
                onClick={(e) => toggleSelection(record.id, e)}
                onKeyDown={(e) => handleKeyDown(e, record.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-border bg-surface hover:border-primary-light'
                } ${isScenarioSelected ? 'ring-2 ring-accent shadow-md' : ''} ${
                  isScenarioChanged ? 'border-dashed border-accent' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg">{record.title}</h3>
                    <div className="text-xs text-text-muted mt-1">{record.roastDate}</div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(record.status)}`}>
                    {record.status}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 mt-4 text-sm">
                  <div className="flex flex-col">
                    <span className="text-text-muted text-xs">Bean</span>
                    <span className="truncate" title={record.bean || 'N/A'}>{record.bean || '—'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-text-muted text-xs">Ratio</span>
                    <span>{record.derived.ratio}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-text-muted text-xs">Yield</span>
                    <span>{record.yield}g</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-text-muted text-xs">Time</span>
                    <span>{record.time}s</span>
                  </div>
                </div>

                {isScenarioSelected && (
                  <div className="mt-3 text-xs bg-accent/20 text-accent-dark px-2 py-1 rounded-md inline-block font-medium">
                    Active Scenario Focus
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
