import React, { useRef, useState } from 'react';
import { useStore } from '../store/useStore';

export function Floorplan() {
  const rooms = useStore((state) => state.rooms);
  const fixtures = useStore((state) => state.fixtures);
  const selectedFixtures = useStore((state) => state.selectedFixtures);
  const toggleFixtureSelection = useStore((state) => state.toggleFixtureSelection);
  const selectLasso = useStore((state) => state.selectLasso);
  const observations = useStore((state) => state.observations);

  const [isLassoing, setIsLassoing] = useState(false);
  const [lassoStart, setLassoStart] = useState(null);
  const [lassoCurrent, setLassoCurrent] = useState(null);

  const svgRef = useRef(null);

  const handlePointerDown = (e) => {
    // Only lasso if clicking on background
    if (e.target.tagName !== 'svg' && e.target.tagName !== 'rect') return; // simplifying

    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsLassoing(true);
    setLassoStart({ x, y });
    setLassoCurrent({ x, y });
  };

  const handlePointerMove = (e) => {
    if (!isLassoing) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    setLassoCurrent({ x, y });
  };

  const handlePointerUp = () => {
    if (!isLassoing) return;
    setIsLassoing(false);

    if (lassoStart && lassoCurrent) {
      // Very basic lasso detection (bounding box)
      const xMin = Math.min(lassoStart.x, lassoCurrent.x);
      const xMax = Math.max(lassoStart.x, lassoCurrent.x);
      const yMin = Math.min(lassoStart.y, lassoCurrent.y);
      const yMax = Math.max(lassoStart.y, lassoCurrent.y);

      // We need coordinates for fixtures. Let's mock them based on index for demo
      const selected = [];
      fixtures.forEach((f, i) => {
        const row = Math.floor(i / 10);
        const col = i % 10;
        const fx = 50 + col * 70 + 10; // offset inside room
        const fy = 50 + row * 100 + 10;
        if (fx >= xMin && fx <= xMax && fy >= yMin && fy <= yMax) {
          selected.push(f.id);
        }
      });
      if (selected.length > 0) {
        selectLasso(selected);
      }
    }
  };

  return (
    <div className="border border-border rounded-lg bg-card p-4 h-[500px] flex items-center justify-center relative overflow-hidden select-none">
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox="0 0 800 600"
        className="bg-muted rounded touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Simple layout mockup */}
        {[
          { id: 'r1', x: 50, y: 50, w: 300, h: 200, label: 'Living Room' },
          { id: 'r2', x: 50, y: 250, w: 300, h: 200, label: 'Kitchen' },
          { id: 'r3', x: 350, y: 50, w: 200, h: 200, label: 'Bedroom 1' },
          { id: 'r4', x: 350, y: 250, w: 200, h: 200, label: 'Bedroom 2' },
          { id: 'r5', x: 550, y: 50, w: 150, h: 150, label: 'Bathroom 1' },
          { id: 'r6', x: 550, y: 200, w: 150, h: 150, label: 'Bathroom 2' },
          { id: 'r7', x: 550, y: 350, w: 150, h: 100, label: 'Hallway' },
          { id: 'r8', x: 50, y: 450, w: 650, h: 100, label: 'Utility Closet' },
        ].map((room) => (
          <g key={room.id}>
            <rect x={room.x} y={room.y} width={room.w} height={room.h} fill="white" stroke="#e2e8f0" strokeWidth="2" />
            <text x={room.x + room.w/2} y={room.y + 20} textAnchor="middle" className="text-xs fill-muted-foreground">{room.label}</text>
          </g>
        ))}

        {/* Fixtures as small rects */}
        {fixtures.map((fixture, i) => {
          // Calculate arbitrary position for mockup
          const row = Math.floor(i / 10);
          const col = i % 10;
          const fx = 60 + col * 70;
          const fy = 80 + row * 100;

          const isSelected = selectedFixtures.includes(fixture.id);
          const hasFinding = observations.some(o => o.fixtureId === fixture.id);

          return (
            <g
              key={fixture.id}
              className="cursor-pointer"
              onClick={(e) => { e.stopPropagation(); toggleFixtureSelection(fixture.id); }}
            >
              <rect
                x={fx}
                y={fy}
                width="30"
                height="30"
                rx="4"
                fill={isSelected ? '#3b82f6' : (hasFinding ? '#fef08a' : '#f1f5f9')}
                stroke={isSelected ? '#2563eb' : '#cbd5e1'}
                strokeWidth="2"
                className="hover:opacity-80 transition-opacity"
              />
              <text x={fx + 15} y={fy + 20} textAnchor="middle" className={`text-[10px] ${isSelected ? 'fill-white' : 'fill-slate-600'} pointer-events-none`}>{fixture.id}</text>
            </g>
          );
        })}

        {isLassoing && lassoStart && lassoCurrent && (
          <rect
            x={Math.min(lassoStart.x, lassoCurrent.x)}
            y={Math.min(lassoStart.y, lassoCurrent.y)}
            width={Math.abs(lassoCurrent.x - lassoStart.x)}
            height={Math.abs(lassoCurrent.y - lassoStart.y)}
            fill="rgba(59, 130, 246, 0.2)"
            stroke="#3b82f6"
            strokeWidth="1"
            strokeDasharray="4"
            className="pointer-events-none"
          />
        )}
      </svg>
    </div>
  );
}
