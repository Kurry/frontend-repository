import React from 'react';
import { useStore } from '../store';
import { computeMetrics } from '../geometry';

export const EvidencePanels: React.FC = () => {
  const { cutouts, selectedCutoutId } = useStore();

  const metrics = selectedCutoutId ? computeMetrics(cutouts, selectedCutoutId) : null;

  return (
    <div className="flex flex-col h-full bg-gray-50 p-4 overflow-y-auto text-sm font-mono border-l">
      <h2 className="font-bold mb-4">Evidence Panels</h2>

      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-2">Visibility Metrics</h3>
        {metrics ? (
          <div className="bg-white p-3 border shadow-sm">
            <p>Target: {selectedCutoutId}</p>
            <ul className="mt-2 text-xs">
              {metrics.results.map(r => (
                <li key={r.stop}>Stop {r.stop > 0 ? '+' : ''}{r.stop}: {r.visibleAreaUnits} units</li>
              ))}
            </ul>
            <div className="mt-2 pt-2 border-t text-xs">
              <p>Min Vis: {metrics.minVisible}</p>
              <p>Spread: {metrics.spread}</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400">Select a cutout</p>
        )}
      </div>

      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-2">Occlusion Raster & Stack</h3>
        <div className="bg-white p-3 border shadow-sm text-xs text-gray-500 italic">
          (Raster details computed from intersection rectangles deterministically over fixed-point grid)
        </div>
      </div>
    </div>
  );
};
