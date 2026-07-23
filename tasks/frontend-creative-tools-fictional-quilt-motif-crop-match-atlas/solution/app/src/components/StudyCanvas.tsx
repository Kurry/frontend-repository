import React, { useState } from 'react';
import { useStore } from '../store/useStore';

export const StudyCanvas = () => {
  const { studies, selectedStudyId, canonicalCrop, previewCrop, setPreviewCrop } = useStore();
  const study = studies.find(s => s.id === selectedStudyId);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialRect, setInitialRect] = useState({ x: 16, y: 12, width: 32, height: 32 });

  const activeRect = previewCrop || canonicalCrop || initialRect;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!study) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = study.logicalWidth / rect.width;
    const scaleY = study.logicalHeight / rect.height;

    const logicalX = (e.clientX - rect.left) * scaleX;
    const logicalY = (e.clientY - rect.top) * scaleY;

    if (
      logicalX >= activeRect.x && logicalX <= activeRect.x + activeRect.width &&
      logicalY >= activeRect.y && logicalY <= activeRect.y + activeRect.height
    ) {
      setIsDragging(true);
      setDragStart({ x: logicalX - activeRect.x, y: logicalY - activeRect.y });
      setInitialRect({ ...activeRect });
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !study) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = study.logicalWidth / rect.width;
    const scaleY = study.logicalHeight / rect.height;

    let newX = Math.round((e.clientX - rect.left) * scaleX - dragStart.x);
    let newY = Math.round((e.clientY - rect.top) * scaleY - dragStart.y);

    newX = Math.max(0, Math.min(newX, study.logicalWidth - activeRect.width));
    newY = Math.max(0, Math.min(newY, study.logicalHeight - activeRect.height));

    setPreviewCrop({ x: newX, y: newY, width: activeRect.width, height: activeRect.height });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!study) return;
    let { x, y, width, height } = activeRect;
    const step = e.shiftKey ? 8 : 1;

    if (e.key === 'ArrowRight') {
      if (e.shiftKey) width = Math.min(width + step, study.logicalWidth - x);
      else x = Math.min(x + step, study.logicalWidth - width);
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      if (e.shiftKey) width = Math.max(8, width - step);
      else x = Math.max(0, x - step);
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      if (e.shiftKey) height = Math.min(height + step, study.logicalHeight - y);
      else y = Math.min(y + step, study.logicalHeight - height);
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      if (e.shiftKey) height = Math.max(8, height - step);
      else y = Math.max(0, y - step);
      e.preventDefault();
    } else if (e.key === 'Escape') {
      setPreviewCrop(null);
      e.preventDefault();
    }

    if (x !== activeRect.x || y !== activeRect.y || width !== activeRect.width || height !== activeRect.height) {
      setPreviewCrop({ x, y, width, height });
    }
  };

  if (!study) return <div className="p-4 border border-dashed rounded text-muted-foreground flex items-center justify-center h-64">No study selected</div>;

  return (
    <div className="flex flex-col gap-2 outline-none" tabIndex={0} onKeyDown={handleKeyDown}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-primary">{study.title}</span>
        <span className="text-muted-foreground font-mono">[{activeRect.x}, {activeRect.y}, {activeRect.width}, {activeRect.height}]</span>
      </div>

      <div
        className="relative w-full aspect-[96/64] bg-card border shadow-inner overflow-hidden cursor-crosshair touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <svg
          viewBox={`0 0 ${study.logicalWidth} ${study.logicalHeight}`}
          className="w-full h-full text-foreground/20"
          preserveAspectRatio="none"
        >
          {study.binaryRows.map((row, y) =>
            row.split('').map((cell, x) =>
              cell === '1' ? (
                <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="currentColor" />
              ) : null
            )
          )}

          <rect
            x={activeRect.x}
            y={activeRect.y}
            width={activeRect.width}
            height={activeRect.height}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth={0.5}
            className="transition-all duration-75"
          />
          <rect
            x={activeRect.x}
            y={activeRect.y}
            width={activeRect.width}
            height={activeRect.height}
            fill="var(--color-primary)"
            fillOpacity={0.1}
            className="transition-all duration-75"
          />
        </svg>
      </div>
      <div className="text-xs text-muted-foreground">
        Drag to move crop. Arrow keys to nudge. Shift+Arrows to resize.
      </div>
    </div>
  );
};
