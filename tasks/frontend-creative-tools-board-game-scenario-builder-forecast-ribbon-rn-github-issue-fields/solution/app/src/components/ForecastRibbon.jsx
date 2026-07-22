import React, { useRef, useEffect } from 'react';
import { useStore, getDerivedSummary } from '../store';
import { motion, useReducedMotion } from 'framer-motion';

export function ForecastRibbon() {
  const { records, selectedId, updateRecord, undo, history } = useStore();
  const selectedRecord = records.find(r => r.id === selectedId);
  const summary = getDerivedSummary(records);
  const trackRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();

  const handleTrackClick = (e) => {
    if (!selectedRecord || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = Math.round((x / rect.width) * 100);
    updateRecord(selectedRecord.id, { likelihood: percentage });
  };

  const handleKeyDown = (e) => {
    if (!selectedRecord) return;
    let newLikelihood = selectedRecord.likelihood;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      newLikelihood = Math.min(100, newLikelihood + 5);
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      newLikelihood = Math.max(0, newLikelihood - 5);
      e.preventDefault();
    }

    if (newLikelihood !== selectedRecord.likelihood) {
      updateRecord(selectedRecord.id, { likelihood: newLikelihood });
    }
  };

  useEffect(() => {
    const handleGlobalUndo = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleGlobalUndo);
    return () => window.removeEventListener('keydown', handleGlobalUndo);
  }, [undo]);

  return (
    <div className="p-6 bg-white border-b border-slate-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Forecast Ribbon</h2>
          <p className="text-sm text-slate-500">Adjust active scenario probability to project outcomes.</p>
        </div>

        <div className="flex items-center gap-6 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div className="text-center">
            <div className="text-xs font-semibold text-slate-500 uppercase">Total Cost</div>
            <div className="text-xl font-bold text-slate-900">{summary.totalCost}</div>
          </div>
          <div className="w-px h-8 bg-slate-300"></div>
          <div className="text-center">
            <div className="text-xs font-semibold text-slate-500 uppercase">Avg Likelihood</div>
            <div className="text-xl font-bold text-slate-900">{summary.avgLikelihood}%</div>
          </div>
          <div className="w-px h-8 bg-slate-300"></div>
          <div className="text-center">
            <div className="text-xs font-semibold text-slate-500 uppercase">Active Cards</div>
            <div className="text-xl font-bold text-slate-900">{summary.count}</div>
          </div>
        </div>
      </div>

      <div className="relative pt-4 pb-8">
        <div
          ref={trackRef}
          className={`h-4 rounded-full bg-slate-200 relative ${selectedRecord ? 'cursor-pointer hover:bg-slate-300' : 'opacity-50'}`}
          onClick={handleTrackClick}
        >
          {selectedRecord && (
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-blue-600 rounded-full shadow border-2 border-white focus:outline-none focus:ring-4 focus:ring-blue-300 cursor-grab active:cursor-grabbing"
              style={{ left: `${selectedRecord.likelihood}%`, x: '-50%' }}
              animate={{ left: `${selectedRecord.likelihood}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 30, duration: shouldReduceMotion ? 0 : undefined }}
              tabIndex={0}
              role="slider"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={selectedRecord.likelihood}
              aria-label="Scenario Likelihood"
              onKeyDown={handleKeyDown}
            />
          )}
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-500 font-medium">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-slate-600">
          {selectedRecord ? (
            <span>Adjusting: <span className="font-semibold text-slate-900">{selectedRecord.title}</span></span>
          ) : (
            <span>Select a scenario to adjust forecast</span>
          )}
        </div>
        <button
          onClick={undo}
          disabled={history.length === 0}
          className="text-sm px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded text-slate-700 transition-colors"
        >
          Undo Last (Cmd/Ctrl+Z)
        </button>
      </div>
    </div>
  );
}
