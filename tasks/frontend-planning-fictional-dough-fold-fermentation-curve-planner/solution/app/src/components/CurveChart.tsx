import { useEffect } from 'react';
import { usePlanStore, computeCurve } from '../store';

export const CurveChart = () => {
  const store = usePlanStore();
  const { samples, targetReachedAt } = computeCurve(store);

  // Expose for WebMCP
  useEffect(() => {
    (window as any)._curveSamples = samples;
    (window as any)._targetReachedAt = targetReachedAt;
  }, [samples, targetReachedAt]);

  return (
    <div className="flex-1 p-4 relative flex flex-col">
      <h2 className="mb-2 font-bold">Curve (Brushable)</h2>
      <div className="flex-1 flex items-end gap-0.5 border-b border-l border-gray-400 bg-gray-50 relative mt-4">

        {/* Target Line */}
        <div className="absolute w-full border-t border-dashed border-gray-500 z-10 pointer-events-none" style={{ bottom: `${(250/300)*100}%` }}>
           <span className="text-xs text-gray-500 bg-white px-1 absolute -top-2 left-2">Target: 250</span>
        </div>

        {/* Samples */}
        {samples.filter(s => s.sampleAt >= store.timelineViewportStart && s.sampleAt <= store.timelineViewportEnd).map((s) => (
          <div key={s.sampleAt} className="flex-1 h-full relative group">
            <div
              className="absolute bottom-0 w-full bg-blue-900 transition-all duration-300"
              style={{ height: `${(s.netCredit / 300) * 100}%` }}
            />
            {s.sampleAt === targetReachedAt && (
              <div className="absolute bottom-0 w-0.5 h-full bg-red-500 z-20 pointer-events-none" />
            )}
            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 text-xs bg-black text-white p-1 rounded z-30 whitespace-nowrap">
              {s.sampleAt.substring(11, 16)}: {s.netCredit}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
