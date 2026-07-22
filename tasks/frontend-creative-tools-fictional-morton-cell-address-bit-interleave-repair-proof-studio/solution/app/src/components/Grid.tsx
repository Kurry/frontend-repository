import { useStore } from '../store/useStore';
import { decodeCoordinates, getFullCurve } from '../lib/domain';

export function Grid() {
  const order = useStore((s) => s.order);
  const anchor = useStore((s) => s.anchor);

  const currentCell = decodeCoordinates(order);
  const curve = getFullCurve();

  return (
    <div className="relative w-full aspect-square border-4 border-gray-800 bg-white shadow-lg">
      <svg width="100%" height="100%" viewBox="0 0 8 8">
        <defs>
          <pattern id="grid" width="1" height="1" patternUnits="userSpaceOnUse">
            <rect width="1" height="1" fill="none" stroke="#e5e7eb" strokeWidth="0.05" />
          </pattern>
        </defs>

        <rect width="8" height="8" fill="url(#grid)" />

        <polyline
          points={curve.map(p => `${p.x + 0.5},${p.y + 0.5}`).join(' ')}
          fill="none"
          stroke="#93c5fd"
          strokeWidth="0.05"
          strokeLinejoin="round"
          strokeDasharray="0.1 0.1"
        />

        {/* Highlight decoded path specifically */}
        <polyline
          points={curve.filter(c => c.code <= decodeCoordinates(order).x + decodeCoordinates(order).y * 8).map(p => `${p.x + 0.5},${p.y + 0.5}`).join(' ')}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="0.1"
          strokeLinejoin="round"
        />

        {/* Anchor Pin */}
        <circle cx={anchor.x + 0.5} cy={anchor.y + 0.5} r="0.4" fill="none" stroke="#ef4444" strokeWidth="0.1" />
        <path d={`M ${anchor.x + 0.5} ${anchor.y + 0.1} L ${anchor.x + 0.5} ${anchor.y + 0.9} M ${anchor.x + 0.1} ${anchor.y + 0.5} L ${anchor.x + 0.9} ${anchor.y + 0.5}`} stroke="#ef4444" strokeWidth="0.05" />

        {/* Current Cell Ghost */}
        <rect
          x={currentCell.x}
          y={currentCell.y}
          width={1}
          height={1}
          fill="rgba(59, 130, 246, 0.4)"
          stroke="#2563eb"
          strokeWidth="0.1"
        />
        <text x={currentCell.x + 0.5} y={currentCell.y + 0.5} fontSize="0.2" textAnchor="middle" dy=".07" fill="#1e3a8a" fontWeight="bold">GHOST</text>
      </svg>
    </div>
  );
}
