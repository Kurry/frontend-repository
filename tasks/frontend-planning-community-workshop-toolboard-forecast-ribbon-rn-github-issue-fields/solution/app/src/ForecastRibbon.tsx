import { useState, useEffect } from 'react';
import type { WorkshopStation, StationStatus } from './types';
import { useApp } from './AppContext';
import { cn } from './utils';

export function ForecastRibbon({ station }: { station: WorkshopStation }) {
  const { state, dispatch } = useApp();
  const [value, setValue] = useState(station.forecastValue);
  const [isChanging, setIsChanging] = useState(false);
  const [projectedDerived, setProjectedDerived] = useState(state.derived);

  // When external station changes, sync local value
  useEffect(() => {
    setValue(station.forecastValue);
    setIsChanging(false);
  }, [station.id, station.forecastValue]);

  // When user is dragging/changing, calculate projected derived stats
  useEffect(() => {
    if (isChanging) {
      const projectedRecords = state.records.map(r =>
        r.id === station.id ? { ...r, forecastValue: value } : r
      );
      setProjectedDerived({
        ...state.derived,
        totalForecast: projectedRecords.reduce((sum, r) => sum + r.forecastValue, 0)
      });
    } else {
      setProjectedDerived(state.derived);
    }
  }, [value, isChanging, state.records, station.id, state.derived]);

  const handleCommit = () => {
    setIsChanging(false);
    if (value !== station.forecastValue) {
      // Automatic domain state inference on forecast change
      const newStatus: StationStatus = value > 0 && station.status === 'draft' ? 'ready' :
                                       value !== station.forecastValue && station.status === 'ready' ? 'changed' :
                                       station.status;

      dispatch({
        type: 'UPDATE_RECORD',
        payload: { id: station.id, forecastValue: value, status: newStatus }
      });
    }
  };

  return (
    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl shadow-inner my-4">
      <h3 className="text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300">Forecast Ribbon</h3>

      <div className="relative pt-6 pb-2">
        <input
          type="range"
          min="0"
          max="1000"
          step="10"
          value={value}
          onChange={(e) => {
            setValue(parseInt(e.target.value));
            setIsChanging(true);
          }}
          onMouseUp={handleCommit}
          onTouchEnd={handleCommit}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
               setIsChanging(true);
            }
          }}
          onKeyUp={(e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
               handleCommit();
            }
          }}
          className="w-full h-2 bg-slate-300 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 accent-blue-600"
          aria-label="Adjust forecast"
        />

        {/* Value bubble that moves with the slider */}
        <div
          className={cn(
            "absolute top-0 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded transition-transform duration-200 ease-out",
            isChanging ? "scale-110 shadow-lg" : "scale-100"
          )}
          style={{ left: `${(value / 1000) * 100}%` }}
        >
          {value}
        </div>
      </div>

      <div className="mt-6 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2 uppercase tracking-wider">Projected Impact</div>
        <div className="flex justify-between items-end">
          <div>
            <span className="text-sm text-slate-600 dark:text-slate-400">Total System Forecast</span>
          </div>
          <div className="flex items-baseline gap-2">
             <span className={cn(
               "text-xl font-bold transition-colors duration-300",
               isChanging && projectedDerived.totalForecast > state.derived.totalForecast ? "text-green-600 dark:text-green-400" :
               isChanging && projectedDerived.totalForecast < state.derived.totalForecast ? "text-amber-600 dark:text-amber-400" :
               "text-slate-900 dark:text-slate-100"
             )}>
               {projectedDerived.totalForecast}
             </span>
             {isChanging && (
                <span className="text-xs font-medium text-slate-500">
                  ({projectedDerived.totalForecast > state.derived.totalForecast ? '+' : ''}{projectedDerived.totalForecast - state.derived.totalForecast})
                </span>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
