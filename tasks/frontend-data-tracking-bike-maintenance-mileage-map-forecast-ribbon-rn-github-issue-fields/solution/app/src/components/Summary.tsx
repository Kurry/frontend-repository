import { useStore } from '../store';

export function Summary() {
  const records = useStore(state => state.records);

  const totalMileage = records.reduce((acc, r) => acc + r.mileage, 0);
  const projectedTotalMileage = records.reduce((acc, r) => acc + (r.projectedMileage ?? r.mileage), 0);
  const activeForecasts = records.filter(r => r.projectedMileage !== undefined).length;

  const delta = projectedTotalMileage - totalMileage;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
      <h2 className="text-lg font-semibold text-slate-800">Derived Summary</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Mileage</p>
          <p className="text-xl font-bold text-slate-900">{totalMileage.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Projected Total</p>
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-bold text-blue-600">{projectedTotalMileage.toLocaleString()}</p>
            {delta > 0 && (
              <span className="text-xs font-medium text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
                +{delta.toLocaleString()}
              </span>
            )}
          </div>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Active Forecasts</p>
          <p className="text-sm font-medium text-slate-700">{activeForecasts}</p>
        </div>
      </div>
    </div>
  );
}
