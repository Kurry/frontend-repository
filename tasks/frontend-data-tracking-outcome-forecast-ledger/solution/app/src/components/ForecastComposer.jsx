import React, { useState } from 'react';
import { useStore } from '../store.js';

export default function ForecastComposer() {
  const { addForecast } = useStore();
  const [question, setQuestion] = useState('');
  const [prob, setProb] = useState(5000);
  const [resDate, setResDate] = useState('');

  const handleCommit = () => {
    if (!question || !resDate) return;
    addForecast({
      question,
      probability: prob,
      resolutionDate: resDate,
      type: 'binary',
      outcomes: [{ id: 'yes', label: 'Yes', prob }, { id: 'no', label: 'No', prob: 10000 - prob }],
      status: 'open',
      resolver: 'Admin',
      resolutionRule: 'Standard rule',
      invalidationCondition: 'None'
    });
    setQuestion('');
    setProb(5000);
    setResDate('');
  };

  return (
    <div className="bg-white p-4 rounded shadow border border-gray-200">
      <h2 className="font-bold text-lg mb-2">Compose Forecast</h2>
      <input
        type="text"
        placeholder="Question..."
        className="w-full border p-2 mb-2 rounded"
        value={question}
        onChange={e => setQuestion(e.target.value)}
      />
      <div className="flex gap-2 mb-2">
        <label className="flex-1">
          <span className="text-sm block">Probability (%)</span>
          <input
            type="number"
            min="1" max="99"
            className="w-full border p-2 rounded"
            value={prob / 100}
            onChange={e => setProb(Math.round(e.target.value * 100))}
          />
        </label>
        <label className="flex-1">
          <span className="text-sm block">Resolution Date</span>
          <input
            type="date"
            className="w-full border p-2 rounded"
            value={resDate}
            onChange={e => setResDate(e.target.value)}
          />
        </label>
      </div>
      <button
        onClick={handleCommit}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
      >
        Commit Forecast
      </button>
    </div>
  );
}
