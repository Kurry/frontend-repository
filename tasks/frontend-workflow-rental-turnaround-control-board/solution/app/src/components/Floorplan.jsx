import React, { useRef, useState, useEffect } from 'react';
import { useStore } from '../store';
import * as d3 from 'd3-zoom';
import { select } from 'd3-selection';

export const Floorplan = () => {
  const rooms = useStore(state => state.rooms);
  const fixtures = useStore(state => state.fixtures);
  const selection = useStore(state => state.selection);
  const selectLoci = useStore(state => state.selectLoci);
  const clearSelection = useStore(state => state.clearSelection);

  const [lasso, setLasso] = useState(null);
  const svgRef = useRef(null);
  const gRef = useRef(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [isLassoing, setIsLassoing] = useState(false);

  useEffect(() => {
    if (svgRef.current) {
      const zoom = d3.zoom().on('zoom', (e) => {
        if (!isLassoing) {
          setTransform(e.transform);
        }
      });
      select(svgRef.current).call(zoom).on("dblclick.zoom", null);
    }
  }, [isLassoing]);

  const handlePointerDown = (e) => {
    if (e.shiftKey) {
      setIsLassoing(true);
      const rect = svgRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - transform.x) / transform.k;
      const y = (e.clientY - rect.top - transform.y) / transform.k;
      setLasso({ startX: x, startY: y, endX: x, endY: y });
    }
  };

  const handlePointerMove = (e) => {
    if (isLassoing && lasso) {
      const rect = svgRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - transform.x) / transform.k;
      const y = (e.clientY - rect.top - transform.y) / transform.k;
      setLasso({ ...lasso, endX: x, endY: y });
    }
  };

  const handlePointerUp = () => {
    if (isLassoing && lasso) {
      const minX = Math.min(lasso.startX, lasso.endX);
      const maxX = Math.max(lasso.startX, lasso.endX);
      const minY = Math.min(lasso.startY, lasso.endY);
      const maxY = Math.max(lasso.startY, lasso.endY);

      const selectedRooms = rooms.filter(r => r.x >= minX && r.x + r.width <= maxX && r.y >= minY && r.y + r.height <= maxY).map(r => r.id);
      const selectedFixtures = fixtures.filter(f => f.x >= minX && f.x <= maxX && f.y >= minY && f.y <= maxY).map(f => f.id);

      selectLoci([...selectedRooms, ...selectedFixtures], false);
      setLasso(null);
      setIsLassoing(false);
    }
  };

  return (
    <div className="relative w-full h-[400px] overflow-hidden border rounded bg-gray-50" aria-label="Floorplan">
      <div className="absolute top-2 left-2 z-10 bg-white/80 p-1 text-xs rounded border border-gray-300">Shift+Drag to lasso, Scroll to zoom, Drag to pan</div>
      <svg
        ref={svgRef}
        className="w-full h-full"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        role="group"
      >
        <g ref={gRef} transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
          {rooms.map(room => (
            <g key={room.id} onClick={(e) => { e.stopPropagation(); selectLoci([room.id], !e.shiftKey); }}>
              <rect
                x={room.x} y={room.y} width={room.width} height={room.height}
                fill={selection.includes(room.id) ? '#bfdbfe' : '#fff'}
                stroke="#000"
                className="cursor-pointer transition-colors"
                role="button"
                aria-label={`Room ${room.id}`}
              />
              <text x={room.x + 5} y={room.y + 15} fontSize="12" fontWeight="bold">{room.name}</text>
            </g>
          ))}
          {fixtures.map(fixture => {
            let color = '#9ca3af'; // uninspected
            if (fixture.status === 'finding') color = '#fbbf24'; // warning/finding
            if (fixture.status === 'work') color = '#60a5fa'; // work
            if (fixture.status === 'verified') color = '#10b981'; // verified

            return (
              <g key={fixture.id} onClick={(e) => { e.stopPropagation(); selectLoci([fixture.id], !e.shiftKey); }}>
                <circle
                  cx={fixture.x} cy={fixture.y} r="12"
                  fill={selection.includes(fixture.id) ? '#3b82f6' : color}
                  stroke={selection.includes(fixture.id) ? '#1e40af' : '#1f2937'}
                  strokeWidth={selection.includes(fixture.id) ? 2 : 1}
                  className="cursor-pointer transition-colors"
                  role="button"
                  aria-label={`Fixture ${fixture.id}`}
                />
                <text x={fixture.x} y={fixture.y + 3} fontSize="9" textAnchor="middle" fill="#fff" pointerEvents="none" fontWeight="bold">
                  {fixture.id.split('-')[1]}
                </text>
              </g>
            );
          })}
          {lasso && (
            <rect
              x={Math.min(lasso.startX, lasso.endX)}
              y={Math.min(lasso.startY, lasso.endY)}
              width={Math.abs(lasso.endX - lasso.startX)}
              height={Math.abs(lasso.endY - lasso.startY)}
              fill="rgba(59, 130, 246, 0.2)"
              stroke="#3b82f6"
              strokeDasharray="4"
            />
          )}
        </g>
      </svg>
    </div>
  );
};
