import React from 'react';
import { useStore } from '../store.js';

export default function Adjudication() {
  const { forecasts, selectedForecastId, adjudicateOutcome, ambiguousOutcomePacket } = useStore();
  const selected = forecasts.find(f => f.id === selectedForecastId);

  if (!selected) return (
    <div className="bg-white p-4 rounded shadow border border-gray-200">
      <h2 className="font-bold text-lg mb-2">Outcome Adjudication</h2>
      <div className="text-sm text-gray-500 italic">Select a forecast.</div>
    </div>
  );

  return (
    <div className="bg-white p-4 rounded shadow border border-gray-200">
      <h2 className="font-bold text-lg mb-2">Outcome Adjudication</h2>
      <div className="text-sm space-y-2">
        <p><strong>Status:</strong> <span className="uppercase badge">{selected.status}</span></p>

        {selected.status === 'open' ? (
          <div className="border p-2 bg-gray-50 rounded">
            <h3 className="font-semibold text-xs mb-1">Resolve Outcome</h3>
            <div className="flex gap-2">
              <select id="outcome-select" className="border p-1 text-sm flex-1">
                {selected.outcomes.map(o => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
              <button
                className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                onClick={() => {
                  const val = document.getElementById('outcome-select').value;
                  const doc = prompt('Adjudication documentation:');
                  if (doc) adjudicateOutcome(selected.id, val, 'resolved', doc);
                }}
              >
                Resolve
              </button>
            </div>
            <div className="mt-2 flex gap-2">
              <button
                className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 text-xs flex-1"
                onClick={() => adjudicateOutcome(selected.id, null, 'invalid', 'Invalidated by conditions')}
              >Mark Invalid</button>
              <button
                className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-xs flex-1"
                onClick={() => adjudicateOutcome(selected.id, null, 'disputed', 'Disputed outcome')}
              >Dispute</button>
            </div>
            {ambiguousOutcomePacket && ambiguousOutcomePacket.forecastId === selected.id && (
              <div className="mt-2 text-xs text-red-600 bg-red-50 p-1 rounded border border-red-200">
                ⚠️ Ambiguous packet detected: requires explicit conflict resolution.
              </div>
            )}
          </div>
        ) : (
          <div className="border p-2 bg-gray-50 rounded">
            <p><strong>Resolved as:</strong> {selected.resolvedOutcomeId || 'N/A'}</p>
            {selected.adjudicationDocs && <p className="italic mt-1 text-xs">"{selected.adjudicationDocs}"</p>}
          </div>
        )}
      </div>
    </div>
  );
}
