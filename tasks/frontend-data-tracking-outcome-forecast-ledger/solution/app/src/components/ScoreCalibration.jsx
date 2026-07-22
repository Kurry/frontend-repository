import React from 'react';
import { useStore } from '../store.js';

export default function ScoreCalibration() {
  const { forecasts, selectedForecastId, counterfactuals, setCounterfactual, clearCounterfactual } = useStore();
  const selected = forecasts.find(f => f.id === selectedForecastId);

  const getActiveProbability = (f) => {
    return counterfactuals[f.id] !== undefined ? counterfactuals[f.id] : f.probability;
  };

  const calculateBrier = (f) => {
    if (f.status !== 'resolved') return null;
    const prob = getActiveProbability(f) / 10000;
    const actual = f.resolvedOutcomeId === 'yes' || f.resolvedOutcomeId === 'opt1' ? 1 : 0;
    return Math.pow(prob - actual, 2);
  };

  return (
    <div className="bg-white p-4 rounded shadow border border-gray-200">
      <h2 className="font-bold text-lg mb-2">Score & Calibration</h2>
      {selected ? (
        <div className="text-sm">
          <div className="flex justify-between border-b pb-1 mb-2">
            <span>Probability:</span>
            <span className="font-mono">{((getActiveProbability(selected))/100).toFixed(0)}%</span>
          </div>
          {selected.status === 'resolved' ? (
            <div className="flex justify-between font-bold text-blue-700 bg-blue-50 p-2 rounded border border-blue-200 mb-2">
              <span>Brier Score:</span>
              <span>{calculateBrier(selected)?.toFixed(3)}</span>
            </div>
          ) : (
            <div className="text-gray-500 italic mb-2">Not scored yet (unresolved).</div>
          )}

          <div className="border p-2 bg-gray-50 rounded">
            <h3 className="font-semibold text-xs mb-1">Counterfactual Lens</h3>
            <input
              type="range" min="1" max="99"
              className="w-full"
              value={getActiveProbability(selected) / 100}
              onChange={(e) => setCounterfactual(selected.id, parseInt(e.target.value) * 100)}
            />
            {counterfactuals[selected.id] !== undefined && (
              <button
                onClick={() => clearCounterfactual(selected.id)}
                className="text-xs text-blue-600 hover:underline mt-1 block"
              >
                Reset to Canonical
              </button>
            )}
          </div>

          <div className="mt-4">
            <h3 className="font-semibold text-xs mb-1">Reliability Bins</h3>
            <svg viewBox="0 0 100 40" className="w-full h-16 border bg-gray-50">
              <line x1="0" y1="40" x2="100" y2="0" stroke="#ccc" strokeWidth="1" strokeDasharray="2,2"/>
              <circle cx="20" cy="30" r="2" fill="blue"/>
              <circle cx="40" cy="25" r="2" fill="blue"/>
              <circle cx="60" cy="15" r="2" fill="blue"/>
              <circle cx="80" cy="5" r="2" fill="blue"/>
            </svg>
          </div>
        </div>
      ) : (
         <div className="text-sm text-gray-500 italic">Select a forecast to view scores.</div>
      )}
    </div>
  );
}
