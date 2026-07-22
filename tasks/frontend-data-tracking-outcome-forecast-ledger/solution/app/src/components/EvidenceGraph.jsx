import React from 'react';
import { useStore } from '../store.js';

export default function EvidenceGraph() {
  const { sources, dependencies, selectedForecastId } = useStore();

  return (
    <div className="bg-white p-4 rounded shadow border border-gray-200">
      <h2 className="font-bold text-lg mb-2">Evidence & Dependencies</h2>
      {selectedForecastId ? (
        <div className="text-sm">
          <p className="mb-2">Showing relations for <span className="font-mono bg-gray-100 px-1">{selectedForecastId}</span></p>
          <div className="mb-4">
            <h3 className="font-semibold text-xs text-gray-500 uppercase">Dependencies</h3>
            <ul className="list-disc pl-4">
              {dependencies.filter(d => d.from === selectedForecastId || d.to === selectedForecastId).map(d => (
                <li key={d.id} className="text-xs">
                  {d.from} → {d.to} ({d.type}): <code className="bg-gray-100">{d.formula}</code>
                </li>
              ))}
              {dependencies.filter(d => d.from === selectedForecastId || d.to === selectedForecastId).length === 0 && (
                <li className="text-gray-400 italic">No dependencies linked.</li>
              )}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-xs text-gray-500 uppercase">Source Packets</h3>
            <div className="h-32 overflow-auto border p-2 text-xs bg-gray-50 rounded">
              {sources.slice(0, 5).map(s => (
                <div key={s.id} className="mb-1 border-b pb-1">
                  <strong>{s.id}</strong>: {s.text}
                </div>
              ))}
              <div className="text-gray-400 italic mt-1">... and more</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-500 italic">Select a forecast to view its graph.</div>
      )}
    </div>
  );
}
