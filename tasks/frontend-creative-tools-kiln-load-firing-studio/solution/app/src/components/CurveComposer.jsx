import React from 'react';
import { useStore } from '../store';

export default function CurveComposer() {
  const { curve, updateCurveSegment } = useStore();

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-md">
      <h2 className="text-xl font-bold">Firing Curve Composer</h2>

      <div className="h-48 border border-gray-300 relative flex items-end p-2 gap-1 bg-gray-50">
          {/* Simple bar visualization for now */}
          {curve.map((segment, idx) => {
              const height = (segment.endTemp / 1000) * 100;
              return (
                  <div key={segment.id} className="flex flex-col items-center flex-1" title={`${segment.type}: ${segment.startTemp}-${segment.endTemp}`}>
                      <div className="w-full bg-orange-400 opacity-75" style={{ height: `${Math.max(5, height)}%`}}></div>
                      <span className="text-[10px] mt-1 truncate">{segment.stage}</span>
                  </div>
              )
          })}
      </div>

      <div className="flex flex-col gap-2">
        {curve.map(segment => (
          <div key={segment.id} className="flex gap-2 items-center text-sm border p-2 rounded">
            <span className="font-semibold w-16">{segment.type}</span>
            <input
              type="number"
              className="border w-16 px-1"
              value={segment.startTemp}
              onChange={e => updateCurveSegment(segment.id, { startTemp: Number(e.target.value) })}
            />
            <span>to</span>
            <input
              type="number"
              className="border w-16 px-1"
              value={segment.endTemp}
              onChange={e => updateCurveSegment(segment.id, { endTemp: Number(e.target.value) })}
            />
            <span>in</span>
            <input
              type="number"
              className="border w-16 px-1"
              value={segment.duration}
              onChange={e => updateCurveSegment(segment.id, { duration: Number(e.target.value) })}
            />
            <span>mins</span>
          </div>
        ))}
      </div>
    </div>
  );
}
