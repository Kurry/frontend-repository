import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Undo2, ArrowRight } from 'lucide-react';

export const ForecastRibbon: React.FC = () => {
  const { selectedRecordId, records, ribbonState, adjustProjection, undo, history } = useStore();
  const selectedRecord = records.find(r => r.id === selectedRecordId);

  const [projection, setProjection] = useState('Maintain pattern');
  const [priority, setPriority] = useState(1);
  const [release, setRelease] = useState('v1.1.0');

  // Use a matchMedia listener to check for reduced motion to ensure headless test evaluation
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  if (!selectedRecord) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 border-x border-gray-200">
        <div className="text-gray-400 font-medium text-lg">Select a record to open the Forecast Ribbon.</div>
      </div>
    );
  }

  const isResolved = ribbonState === 'resolved';
  const hasHistory = history.length > 0;

  const handleAdjust = () => {
    adjustProjection(projection, priority, release);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'empty': return 'bg-gray-100 text-gray-700';
      case 'draft': return 'bg-yellow-100 text-yellow-700';
      case 'ready': return 'bg-green-100 text-green-700';
      case 'changed': return 'bg-blue-100 text-blue-700';
      case 'archived': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white border-x border-gray-200 relative overflow-hidden">

      {/* Top Banner - Forecast Ribbon Header */}
      <div className="bg-slate-900 text-white p-4 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-blue-400" />
          <h2 className="font-semibold text-lg tracking-wide">FORECAST RIBBON</h2>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-400 font-mono tracking-wider">STATE: {ribbonState.toUpperCase()}</span>
          <button
            onClick={undo}
            disabled={!hasHistory}
            className="flex items-center gap-1 text-sm bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-slate-800 px-3 py-1.5 rounded transition-colors"
          >
            <Undo2 className="w-4 h-4" />
            Undo
          </button>
        </div>
      </div>

      <div className="flex-1 p-8 flex flex-col gap-8 overflow-y-auto">

        {/* Record Overview */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-sm text-slate-500 font-semibold mb-4 uppercase tracking-wider">Target Record</h3>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-medium text-slate-800">{selectedRecord['typed-fields'].garment}</span>
              <span className="text-slate-600">{selectedRecord['typed-fields'].fitIssue}</span>
            </div>
            <div className="text-right">
              <div className="text-3xl font-mono mb-2">
                {selectedRecord['typed-fields'].measurementDelta > 0 ? '+' : ''}
                {selectedRecord['typed-fields'].measurementDelta}cm
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedRecord.status)}`}>
                {selectedRecord.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Ribbon Interaction Area */}
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-1 bg-blue-100 z-0"></div>

          <div className="flex flex-col gap-6 relative z-10">

            {/* Control Point 1 */}
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shrink-0">1</div>
              <div className="flex-1 bg-white border border-blue-200 rounded-lg p-5 shadow-sm">
                <label className="block text-sm font-medium text-slate-700 mb-2">Projected Action</label>
                <select
                  value={projection}
                  onChange={(e) => setProjection(e.target.value)}
                  disabled={isResolved}
                  className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                >
                  <option>Maintain pattern</option>
                  <option>Extend hemline</option>
                  <option>Take in seams</option>
                  <option>Let out waist</option>
                </select>
              </div>
            </div>

            {/* Control Point 2 */}
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shrink-0">2</div>
              <div className="flex-1 bg-white border border-blue-200 rounded-lg p-5 shadow-sm flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Priority Level</label>
                  <input
                    type="range" min="1" max="5"
                    value={priority} onChange={(e) => setPriority(Number(e.target.value))}
                    disabled={isResolved}
                    className="w-full accent-blue-600 disabled:opacity-50"
                  />
                  <div className="text-center font-mono text-sm mt-2 text-slate-500">P{priority}</div>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Target Release</label>
                  <select
                    value={release}
                    onChange={(e) => setRelease(e.target.value)}
                    disabled={isResolved}
                    className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                  >
                    <option>v1.1.0</option>
                    <option>v1.2.0</option>
                    <option>v2.0.0</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Commit Point */}
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-bold shadow-md shrink-0">!</div>
              <div className="flex-1">
                <button
                  onClick={handleAdjust}
                  disabled={isResolved}
                  className="w-full bg-slate-900 text-white p-4 rounded-lg font-medium text-lg flex justify-between items-center hover:bg-slate-800 disabled:bg-slate-300 disabled:text-slate-500 transition-colors shadow-md"
                >
                  <span>{isResolved ? 'Projection Applied' : 'Apply Projection to Canvas'}</span>
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Derived State Morph Area */}
        <AnimatePresence>
          {isResolved && (
            <motion.div
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
              animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -20 }}
              className="mt-4 bg-green-50 border border-green-200 rounded-lg p-6 shadow-sm flex items-center justify-between"
            >
              <div>
                <h4 className="text-green-800 font-semibold mb-1">State Updated</h4>
                <p className="text-green-700 text-sm">Target record modified. Linked representations derived.</p>
              </div>
              <div className="bg-white px-4 py-2 rounded shadow-sm border border-green-100 font-mono text-sm text-slate-700">
                {JSON.stringify(selectedRecord['forecast-ribbonState'])}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
