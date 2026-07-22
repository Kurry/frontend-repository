import React, { useState } from 'react';
import { useStore } from '../store.js';

export default function ReviewWorkflow() {
  const { forecasts, selectedForecastId, addReview, reviews } = useStore();
  const selected = forecasts.find(f => f.id === selectedForecastId);
  const [text, setText] = useState('');

  const fReviews = reviews.filter(r => r.forecastId === selectedForecastId);

  return (
    <div className="bg-white p-4 rounded shadow border border-gray-200">
      <h2 className="font-bold text-lg mb-2">Review Workflow</h2>
      {selected ? (
        <div className="text-sm">
          {fReviews.length > 0 ? (
            <div className="space-y-2 mb-2">
              {fReviews.map(r => (
                <div key={r.id} className="p-2 border rounded bg-gray-50">
                  <div className="text-xs text-gray-500">{new Date(r.timestamp).toLocaleDateString()}</div>
                  <div>{r.text}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 italic mb-2">No reviews yet.</div>
          )}

          {selected.status !== 'open' && (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Lesson learned..."
                className="border p-1 text-sm flex-1"
                value={text}
                onChange={e => setText(e.target.value)}
              />
              <button
                onClick={() => {
                  if (text) { addReview({ forecastId: selected.id, text }); setText(''); }
                }}
                className="bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700 text-xs"
              >
                Post Review
              </button>
            </div>
          )}
        </div>
      ) : (
         <div className="text-sm text-gray-500 italic">Select a forecast.</div>
      )}
    </div>
  );
}
