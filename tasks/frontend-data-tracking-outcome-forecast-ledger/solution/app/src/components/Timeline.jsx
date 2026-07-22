import React from 'react';
import { useStore } from '../store.js';

export default function Timeline() {
  const { forecasts, selectedForecastId, selectForecast, amendForecast } = useStore();
  const selected = forecasts.find(f => f.id === selectedForecastId);

  return (
    <div className="bg-white p-4 rounded shadow border border-gray-200 flex-1 overflow-auto">
      <h2 className="font-bold text-lg mb-2">Belief Timeline & Forecasts</h2>
      <div className="space-y-2 mb-4">
        {forecasts.map(f => (
          <div
            key={f.id}
            onClick={() => selectForecast(f.id)}
            className={`p-2 border rounded cursor-pointer ${selectedForecastId === f.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
          >
            <div className="font-semibold text-sm truncate">{f.question}</div>
            <div className="text-xs text-gray-500 flex justify-between">
              <span>{f.status.toUpperCase()}</span>
              <span>{(f.probability / 100).toFixed(0)}%</span>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="border-t pt-2">
          <h3 className="font-bold text-sm mb-2">History ({selected.id})</h3>
          <ul className="text-xs space-y-1 mb-2">
            {selected.history.map((h, i) => (
              <li key={i} className="flex justify-between border-b py-1">
                <span>v{h.version} - {h.cause}</span>
                <span className="font-mono">{(h.probability / 100).toFixed(0)}%</span>
              </li>
            ))}
          </ul>
          {selected.status === 'open' && (
            <button
              onClick={() => {
                const p = prompt('New probability (1-99):', (selected.probability/100).toFixed(0));
                const c = prompt('Cause for amendment:');
                if (p && c) {
                  amendForecast(selected.id, { probability: parseInt(p)*100 }, c);
                }
              }}
              className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded w-full"
            >
              + Amend Belief
            </button>
          )}
        </div>
      )}
    </div>
  );
}
