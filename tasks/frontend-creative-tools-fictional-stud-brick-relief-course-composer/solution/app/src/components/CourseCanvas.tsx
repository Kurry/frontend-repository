import React, { useRef } from 'react';
import { useStore } from '../store/store';
import { getBrickFootprint } from '../lib/geometry';
import { BrickRecord } from '../types';

const STUD_SIZE = 40; // px

export function CourseCanvas() {
  const store = useStore();
  const { model, bricks, parts, viewState, previewMove } = store;
  const containerRef = useRef<HTMLDivElement>(null);

  if (!model) return <div>Loading...</div>;

  const w = model.widthStuds * STUD_SIZE;
  const h = model.depthStuds * STUD_SIZE;

  // Compute virtual bricks (with preview applied)
  const virtualBricks = { ...bricks };
  if (previewMove) {
    virtualBricks[previewMove.brickId] = {
      ...virtualBricks[previewMove.brickId],
      x: previewMove.x,
      y: previewMove.y
    };
  }

  const brickList = Object.values(virtualBricks).filter(b => b.status === 'active');
  const activeCourseBricks = brickList.filter(b => b.course === viewState.activeCourse);
  const lowerCourseBricks = brickList.filter(b => b.course === viewState.activeCourse - 1);
  const upperCourseBricks = brickList.filter(b => b.course === viewState.activeCourse + 1);

  const handlePointerDown = (e: React.PointerEvent, brickId: string) => {
    if (bricks[brickId].locked) return;
    store.selectBrick(brickId);

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const originalBrick = bricks[brickId];

    const handlePointerMove = (ev: PointerEvent) => {
      const dx = Math.round((ev.clientX - startX) / STUD_SIZE);
      const dy = Math.round((ev.clientY - startY) / STUD_SIZE);

      const newX = originalBrick.x + dx;
      const newY = originalBrick.y + dy;

      store.setPreviewMove(brickId, newX, newY);
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const renderBrick = (brick: BrickRecord, isGhost: boolean, isOriginal: boolean = false) => {
    const part = parts[brick.partDefinitionId];
    const footprint = getBrickFootprint(brick, part);
    const isSelected = viewState.selectedBrickId === brick.id;
    const isInvalidPreview = previewMove?.brickId === brick.id && !previewMove.isValid;

    let fill = brick.paletteTokenId === 'color-slate' ? '#94a3b8' : '#f87171';
    if (isGhost) fill = 'rgba(0,0,0,0.1)';
    if (isOriginal) fill = 'rgba(148, 163, 184, 0.3)';

    let stroke = isSelected && !isOriginal ? '#2563eb' : '#333';
    if (isInvalidPreview) stroke = '#ef4444'; // Red for collision/invalid

    return (
      <g
        key={`${brick.id}${isOriginal ? '-orig' : ''}`}
        transform={`translate(${footprint.x * STUD_SIZE}, ${footprint.y * STUD_SIZE})`}
        onPointerDown={!isGhost && !isOriginal ? (e) => handlePointerDown(e, brick.id) : undefined}
        style={{ cursor: !isGhost && !brick.locked ? 'grab' : 'default' }}
      >
        <rect
          width={footprint.w * STUD_SIZE}
          height={footprint.h * STUD_SIZE}
          fill={fill}
          stroke={stroke}
          strokeWidth={isSelected && !isOriginal ? 4 : 2}
          rx={4}
        />
        {Array.from({ length: footprint.w }).map((_, cx) =>
          Array.from({ length: footprint.h }).map((_, cy) => (
            <circle
              key={`${cx}-${cy}`}
              cx={cx * STUD_SIZE + STUD_SIZE / 2}
              cy={cy * STUD_SIZE + STUD_SIZE / 2}
              r={STUD_SIZE * 0.3}
              fill="rgba(0,0,0,0.2)"
            />
          ))
        )}
        {!isGhost && !isOriginal && (
          <text x={4} y={16} fontSize={12} fill="#fff" style={{ pointerEvents: 'none' }}>
            {brick.id}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="relative border-2 border-gray-300 bg-white shadow-inner overflow-auto max-w-full" ref={containerRef}>
      <svg width={w} height={h} className="block select-none touch-none">
        <defs>
          <pattern id="grid" width={STUD_SIZE} height={STUD_SIZE} patternUnits="userSpaceOnUse">
            <path d={`M ${STUD_SIZE} 0 L 0 0 0 ${STUD_SIZE}`} fill="none" stroke="#e5e7eb" strokeWidth="1" />
            <circle cx={STUD_SIZE/2} cy={STUD_SIZE/2} r={STUD_SIZE*0.1} fill="#e5e7eb" />
          </pattern>
        </defs>
        <rect width={w} height={h} fill="url(#grid)" />

        {lowerCourseBricks.map(b => renderBrick(b, true))}

        {previewMove && bricks[previewMove.brickId].course === viewState.activeCourse &&
          renderBrick(bricks[previewMove.brickId], false, true)
        }

        {activeCourseBricks.map(b => renderBrick(b, false))}

        {upperCourseBricks.map(b => {
           const part = parts[b.partDefinitionId];
           const footprint = getBrickFootprint(b, part);
           return (
             <rect
               key={`upper-${b.id}`}
               x={footprint.x * STUD_SIZE}
               y={footprint.y * STUD_SIZE}
               width={footprint.w * STUD_SIZE}
               height={footprint.h * STUD_SIZE}
               fill="none"
               stroke="rgba(0,0,0,0.3)"
               strokeDasharray="4 4"
               strokeWidth={2}
               pointerEvents="none"
             />
           );
        })}
      </svg>
    </div>
  );
}
