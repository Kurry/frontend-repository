import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Undo, Download, Upload } from 'lucide-react';
import { cn } from './PhotoSequenceList';

export function ForecastRibbon({ selectedId }) {
  const { records, updateRecord, historyPointer, undo, exportArtifact, importArtifact } = useStore();

  const record = records.find(r => r.id === selectedId);
  const [localDelta, setLocalDelta] = useState(record?.forecastRibbonState || 0);

  useEffect(() => {
    if (record) {
      setLocalDelta(record.forecastRibbonState);
    }
  }, [record?.forecastRibbonState, record?.id]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  const handleApply = () => {
    if (!record) return;

    // Status transition logic based on forecast changes
    let newStatus = record.status;
    if (localDelta !== record.forecastRibbonState) {
       newStatus = 'changed';
    }

    updateRecord(record.id, {
      forecastRibbonState: localDelta,
      status: newStatus
    });
  };

  const handleExport = () => {
    const data = exportArtifact();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'photo-caption-v1-forecast-ribbon.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        importArtifact(data);
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (!record) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
        <p>Select a record to view the forecast ribbon.</p>
        <div className="mt-8 flex gap-4">
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border rounded shadow-sm hover:bg-gray-50 text-sm text-gray-700">
            <Download size={16} /> Export
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-white border rounded shadow-sm hover:bg-gray-50 text-sm text-gray-700 cursor-pointer">
            <Upload size={16} /> Import
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
        </div>
      </div>
    );
  }

  // Visual state mapping
  let ribbonState = 'idle';
  if (localDelta !== record.forecastRibbonState) {
    ribbonState = 'changed';
  } else if (record.forecastRibbonState > 50 || record.forecastRibbonState < -50) {
    ribbonState = 'conflict';
  } else if (record.forecastRibbonState !== 0) {
    ribbonState = 'resolved';
  }

  return (
    <div className="flex-1 flex flex-col p-6 bg-gray-50 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Forecast Ribbon</h1>
        <div className="flex gap-2">
          <button
            onClick={undo}
            disabled={historyPointer < 0}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border rounded shadow-sm disabled:opacity-50 hover:bg-gray-50 text-sm"
          >
            <Undo size={14} /> Undo
          </button>
          <button onClick={handleExport} className="p-1.5 bg-white border rounded shadow-sm hover:bg-gray-50" title="Export">
            <Download size={16} />
          </button>
          <label className="p-1.5 bg-white border rounded shadow-sm hover:bg-gray-50 cursor-pointer" title="Import">
            <Upload size={16} />
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-500 uppercase">Selected Record</h3>
          <p className="text-lg font-semibold mt-1">{record.title}</p>
          <p className="text-gray-600">{record.caption}</p>
        </div>

        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <label className="font-medium">Projected Outcome Delta</label>
            <span className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors duration-300",
              ribbonState === 'idle' ? "bg-gray-100 text-gray-600" :
              ribbonState === 'changed' ? "bg-blue-100 text-blue-800" :
              ribbonState === 'conflict' ? "bg-red-100 text-red-800" :
              "bg-green-100 text-green-800"
            )}>
              {ribbonState}
            </span>
          </div>

          <div className="relative pt-6 pb-2">
            <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gray-300 -translate-x-1/2 z-0"></div>

            <input
              type="range"
              min="-100" max="100"
              value={localDelta}
              onChange={(e) => setLocalDelta(parseInt(e.target.value))}
              className="w-full relative z-10 appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-gray-200 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:-mt-2"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>-100 (Delay)</span>
              <span>0 (Baseline)</span>
              <span>+100 (Advance)</span>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleApply}
              disabled={localDelta === record.forecastRibbonState}
              className="px-4 py-2 bg-blue-600 text-white rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
            >
              Apply Projection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
