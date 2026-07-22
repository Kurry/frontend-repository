import { useState, useMemo } from 'react';
import { useStore } from '../store';
import type { Track } from '../store/types';

export const Spiral = ({ track }: { track: Track }) => {
  const store = useStore();
  const [dragGhost, setDragGhost] = useState<{ x: number, y: number } | null>(null);

  const getBayCenter = (trackCx: number, trackCy: number, bayIndex: number) => {
    const theta = (bayIndex * 30 * Math.PI) / 180;
    const r = 52 + 9 * bayIndex;
    return {
      x: trackCx + r * Math.cos(theta),
      y: trackCy + r * Math.sin(theta)
    };
  };

  const bayCenters = useMemo(() => {
    return store.bays.map(bayIndex => {
      const center = getBayCenter(track.cx, track.cy, bayIndex);
      const cap = store.capsules.find(c => c.trackId === track.trackId && c.bayIndex === bayIndex);
      return { bayIndex, center, cap };
    });
  }, [track.cx, track.cy, store.bays, store.capsules]);

  const activeCapsule = store.capsules.find(c => c.status === 'tray' && c.capsuleId === store.selection.primaryId);

  const handleDrop = (bayIndex: number, center: {x: number, y: number}) => {
    if (activeCapsule) {
      if (dragGhost) {
        const dist = Math.sqrt(Math.pow(dragGhost.x - center.x, 2) + Math.pow(dragGhost.y - center.y, 2));
        if (dist <= 18) {
          if (confirm(`Insert ${activeCapsule.capsuleId} into ${track.trackId} bay ${bayIndex}?`)) {
            store.insertCapsule(activeCapsule.capsuleId, track.trackId, bayIndex);
          }
        }
      } else {
        // Direct click fallback
        if (confirm(`Insert ${activeCapsule.capsuleId} into ${track.trackId} bay ${bayIndex}?`)) {
           store.insertCapsule(activeCapsule.capsuleId, track.trackId, bayIndex);
        }
      }
    }
  };

  return (
    <div className="relative w-full h-full p-8 overflow-hidden bg-slate-50 border rounded-lg shadow-inner">
      <h3 className="text-lg font-bold mb-4">{track.trackId}</h3>
      <svg className="w-full h-[600px] pointer-events-auto overflow-visible"
           onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setDragGhost({ x: e.clientX - rect.left, y: e.clientY - rect.top });
           }}
           onMouseLeave={() => setDragGhost(null)}
      >
        {/* Draw spiral path */}
        <path d={`M ${track.cx} ${track.cy} ${bayCenters.map(b => `L ${b.center.x} ${b.center.y}`).join(' ')}`}
              fill="none" stroke="#ccc" strokeWidth="2" />

        {bayCenters.map(bay => (
          <g key={bay.bayIndex}
             transform={`translate(${bay.center.x}, ${bay.center.y})`}
             onClick={() => handleDrop(bay.bayIndex, bay.center)}>

             {/* Snap halo when dragging */}
             {activeCapsule && dragGhost && Math.sqrt(Math.pow(dragGhost.x - bay.center.x, 2) + Math.pow(dragGhost.y - bay.center.y, 2)) <= 18 && (
                <circle r={18} fill="rgba(59, 130, 246, 0.2)" stroke="blue" strokeWidth={2} className="animate-pulse" />
             )}

             {bay.cap ? (
                <circle r={16} fill={bay.cap.variant} stroke="#333" strokeWidth="2" />
             ) : (
                <circle r={16} fill="transparent" stroke="#aaa" strokeWidth="1" strokeDasharray="4 2" />
             )}
             <text x={0} y={4} textAnchor="middle" fontSize={10} fill={bay.cap ? '#fff' : '#666'}>
                {bay.bayIndex}
             </text>
          </g>
        ))}

        {activeCapsule && dragGhost && (
            <g transform={`translate(${dragGhost.x}, ${dragGhost.y})`} className="pointer-events-none">
                <circle r={16} fill={activeCapsule.variant} opacity={0.6} />
                {/* Ray to closest valid target could go here */}
            </g>
        )}
      </svg>
    </div>
  );
};
