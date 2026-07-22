import React, { useState } from 'react';
import { useStore } from '../store';
import { ServiceRecord } from '../types';

interface ForecastRibbonProps {
  record: ServiceRecord;
}

export function ForecastRibbon({ record }: ForecastRibbonProps) {
  const { adjustForecast } = useStore();
  const [val, setVal] = useState<string>(record.projectedMileage?.toString() || record.mileage.toString());
  const [error, setError] = useState<string | null>(null);

  const handleAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(val, 10);
    if (isNaN(num)) {
      setError("Must be a number");
      return;
    }
    if (num < record.mileage) {
      setError("Projected mileage cannot be less than current mileage");
      return;
    }
    setError(null);
    adjustForecast(record.id, num);
  };

  return (
    <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
      <h3 className="text-sm font-semibold text-slate-800 mb-2">Forecast Ribbon</h3>
      <p className="text-xs text-slate-500 mb-4">Adjust projected mileage for this record.</p>

      <form onSubmit={handleAdjust} className="flex items-start gap-2">
        <div className="flex-1">
          <input
            type="number"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="w-full px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Projected Mileage"
          />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
        <button
          type="submit"
          className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
        >
          Project
        </button>
      </form>
    </div>
  );
}
