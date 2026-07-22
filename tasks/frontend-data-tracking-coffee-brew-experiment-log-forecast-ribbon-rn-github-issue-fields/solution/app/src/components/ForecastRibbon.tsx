import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Sliders, RefreshCcw, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ForecastRibbon() {
  const records = useStore(state => state.records);
  const activeForecastId = useStore(state => state.activeForecastId);
  const setForecastRibbonState = useStore(state => state.setForecastRibbonState);
  const undoLastMutation = useStore(state => state.undoLastMutation);
  const updateRecord = useStore(state => state.updateRecord);

  const [selectedId, setSelectedId] = useState<string | null>(activeForecastId);
  const [adjustedDose, setAdjustedDose] = useState<number>(15);
  const [adjustedRatio, setAdjustedRatio] = useState<number>(15); // e.g. 1:15

  const selectedRecord = records.find(r => r.id === selectedId);

  // Sync internal state when active selection changes via store
  useEffect(() => {
    if (activeForecastId !== selectedId) {
      setSelectedId(activeForecastId);
    }
  }, [activeForecastId]);

  // Sync internal form values when a new record is selected
  useEffect(() => {
    if (selectedRecord) {
      setAdjustedDose(selectedRecord.forecastRibbonState?.adjustedDose || selectedRecord.dose);
      const ratio = selectedRecord.yield / selectedRecord.dose;
      setAdjustedRatio(selectedRecord.forecastRibbonState?.adjustedRatio || (isNaN(ratio) ? 15 : ratio));
    }
  }, [selectedRecord?.id]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const record = records.find(r => r.id === id);
    if (record) {
      setForecastRibbonState(id, {
        adjustedDose: record.dose,
        adjustedRatio: isNaN(record.yield / record.dose) ? 15 : record.yield / record.dose,
        projectedYield: record.yield,
        projectedTds: 1.35,
        projectedExt: 20.5,
        status: 'selected'
      });
    }
  };

  const handleAdjust = () => {
    if (!selectedRecord) return;

    // Simulate projection math
    const projectedYield = adjustedDose * adjustedRatio;

    // Conflict condition: negative values or absurdly high
    if (adjustedDose <= 0 || adjustedRatio <= 0 || projectedYield > 2000) {
      setForecastRibbonState(selectedRecord.id, {
        ...selectedRecord.forecastRibbonState!,
        adjustedDose,
        adjustedRatio,
        projectedYield: 0,
        status: 'conflict'
      });
      return;
    }

    setForecastRibbonState(selectedRecord.id, {
      adjustedDose,
      adjustedRatio,
      projectedYield,
      projectedTds: 1.35 + (adjustedDose / 100),
      projectedExt: 20.5 + (adjustedRatio / 10),
      status: 'changed'
    });
  };

  const handleResolve = () => {
    if (!selectedRecord || selectedRecord.forecastRibbonState?.status === 'conflict') return;

    // Apply projected values to actual record
    updateRecord(selectedRecord.id, {
      dose: selectedRecord.forecastRibbonState!.adjustedDose,
      yield: selectedRecord.forecastRibbonState!.projectedYield,
      status: 'ready'
    });

    setForecastRibbonState(selectedRecord.id, {
      ...selectedRecord.forecastRibbonState!,
      status: 'resolved'
    });
  };

  // Keyboard undo support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undoLastMutation();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoLastMutation]);

  return (
    <div className="bg-white border rounded-lg shadow-sm overflow-hidden flex flex-col h-full">
      <div className="bg-blue-900 text-white p-3 flex justify-between items-center">
        <h2 className="font-semibold flex items-center gap-2 text-sm">
          <Sliders size={16} /> Forecast Ribbon
        </h2>
        <button
          onClick={undoLastMutation}
          className="text-blue-200 hover:text-white flex items-center gap-1 text-xs px-2 py-1 bg-blue-800 rounded focus:ring-2 focus:ring-white focus:outline-none"
          title="Undo last mutation (Ctrl+Z)"
        >
          <RefreshCcw size={14} /> Undo
        </button>
      </div>

      <div className="p-3 border-b bg-gray-50 flex gap-2 overflow-x-auto">
        {records.filter(r => r.status !== 'empty').map(record => (
          <button
            key={record.id}
            onClick={() => handleSelect(record.id)}
            className={`flex-shrink-0 px-3 py-2 border rounded-md text-sm text-left transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none
              ${selectedId === record.id
                ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                : 'bg-white border-gray-300 hover:bg-gray-100'}`}
          >
            <div className="font-medium truncate max-w-[120px]">{record.title}</div>
            <div className="text-xs text-gray-500">{record.dose}g • 1:{(record.yield/record.dose).toFixed(1)}</div>
          </button>
        ))}
        {records.length === 0 && <div className="text-sm text-gray-500 p-2">No valid records to forecast.</div>}
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {!selectedRecord ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex items-center justify-center text-gray-400 text-sm"
            >
              Select a record above to forecast outcomes.
            </motion.div>
          ) : (
            <motion.div
              key={selectedRecord.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{selectedRecord.title}</h3>
                  <p className="text-sm text-gray-500">Current: {selectedRecord.dose}g in, {selectedRecord.yield}g out</p>
                </div>
                {selectedRecord.forecastRibbonState?.status === 'conflict' && (
                  <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
                    <AlertTriangle size={14} /> Conflict
                  </span>
                )}
                {selectedRecord.forecastRibbonState?.status === 'resolved' && (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                    <CheckCircle size={14} /> Resolved
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adjust Dose (g)</label>
                  <input
                    type="number"
                    value={adjustedDose}
                    onChange={(e) => {
                      setAdjustedDose(Number(e.target.value));
                      // use a small timeout or wait for blur to adjust, or adjust directly on change
                    }}
                    onBlur={handleAdjust}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Ratio (1:X)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={adjustedRatio}
                    onChange={(e) => setAdjustedRatio(Number(e.target.value))}
                    onBlur={handleAdjust}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Projected Outcome</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white border rounded p-2 shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">Yield</div>
                    <div className="text-lg font-semibold font-mono">
                      {selectedRecord.forecastRibbonState?.projectedYield?.toFixed(1) || '-'}g
                    </div>
                  </div>
                  <div className="bg-white border rounded p-2 shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">Est. TDS</div>
                    <div className="text-lg font-semibold font-mono">
                      {selectedRecord.forecastRibbonState?.projectedTds?.toFixed(2) || '-'}%
                    </div>
                  </div>
                  <div className="bg-white border rounded p-2 shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">Est. Ext</div>
                    <div className="text-lg font-semibold font-mono">
                      {selectedRecord.forecastRibbonState?.projectedExt?.toFixed(1) || '-'}%
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleResolve}
                  disabled={selectedRecord.forecastRibbonState?.status === 'conflict' || selectedRecord.forecastRibbonState?.status === 'resolved'}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  Apply Forecast
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
