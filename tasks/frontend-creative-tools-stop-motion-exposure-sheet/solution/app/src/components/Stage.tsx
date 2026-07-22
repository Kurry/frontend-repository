import React, { useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { clsx } from 'clsx';

export const Stage: React.FC = () => {
  const { currentFrame, objects, onionSkinPrev, onionSkinNext, setOnionSkins, selectedObjectIds, selectObject, updateObjectTransform } = useStore();
  const stageRef = useRef<HTMLDivElement>(null);

  const [draggingObj, setDraggingObj] = useState<string | null>(null);

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    selectObject(id, e.shiftKey);
    setDraggingObj(id);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingObj || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const dx = (e.movementX / rect.width) * 100;
    const dy = (e.movementY / rect.height) * 100;

    const obj = objects.find(o => o.id === draggingObj);
    if (!obj) return;
    const current = obj.transforms[currentFrame] || obj.transforms[0] || { x: 0, y: 0, rotation: 0, scale: 1, depth: 0, facing: 'front', visibility: true };

    updateObjectTransform(draggingObj, currentFrame, {
      x: current.x + dx,
      y: current.y + dy
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingObj) {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      setDraggingObj(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectObject(id, e.shiftKey);
    } else if (e.key.startsWith('Arrow')) {
      e.preventDefault();
      const obj = objects.find(o => o.id === id);
      if (!obj) return;
      const current = obj.transforms[currentFrame] || obj.transforms[0] || { x: 0, y: 0, rotation: 0, scale: 1, depth: 0, facing: 'front', visibility: true };

      let dx = 0, dy = 0;
      if (e.key === 'ArrowUp') dy = -1;
      if (e.key === 'ArrowDown') dy = 1;
      if (e.key === 'ArrowLeft') dx = -1;
      if (e.key === 'ArrowRight') dx = 1;

      updateObjectTransform(id, currentFrame, { x: current.x + dx, y: current.y + dy });
    }
  };

  const renderObjectsForFrame = (frame: number, opacity: number, isInteractive: boolean) => {
    return objects.map(obj => {
      const t = obj.transforms[frame] || obj.transforms[0];
      if (!t.visibility) return null;
      const isSelected = selectedObjectIds.includes(obj.id);

      return (
        <div
          key={`${obj.id}-${frame}`}
          role={isInteractive ? "button" : "presentation"}
          tabIndex={isInteractive ? 0 : -1}
          onKeyDown={isInteractive ? (e) => handleKeyDown(e, obj.id) : undefined}
          onPointerDown={isInteractive ? (e) => handlePointerDown(e, obj.id) : undefined}
          onPointerMove={isInteractive ? handlePointerMove : undefined}
          onPointerUp={isInteractive ? handlePointerUp : undefined}
          onPointerCancel={isInteractive ? handlePointerUp : undefined}
          className={clsx(
            "absolute flex items-center justify-center transition-all outline-none focus:ring-4 focus:ring-blue-600",
            isInteractive ? "cursor-move pointer-events-auto" : "pointer-events-none",
            isSelected && isInteractive ? "ring-2 ring-blue-500" : ""
          )}
          style={{
            left: `${50 + (t.x || 0)}%`,
            top: `${50 + (t.y || 0)}%`,
            transform: `translate(-50%, -50%) rotate(${t.rotation || 0}deg) scale(${t.scale || 1})`,
            opacity,
            zIndex: Math.floor((t.depth || 0) * 100)
          }}
        >
          {obj.type === 'subject' ? (
            <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs pointer-events-none">S</div>
          ) : (
            <div className="w-8 h-8 bg-emerald-500 flex items-center justify-center text-white text-xs pointer-events-none">P</div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded shadow-sm overflow-hidden min-h-[300px]">
      <div className="p-2 bg-gray-100 border-b border-gray-200 text-sm font-semibold flex justify-between items-center flex-wrap gap-2">
        Stage
        <div className="flex gap-2 text-xs font-normal">
          <label className="flex items-center gap-1">
            Prev Onion:
            <input type="number" value={onionSkinPrev} min="0" max="5" onChange={(e) => setOnionSkins(parseInt(e.target.value) || 0, onionSkinNext)} className="w-12 p-1 border rounded" />
          </label>
          <label className="flex items-center gap-1">
            Next Onion:
            <input type="number" value={onionSkinNext} min="0" max="5" onChange={(e) => setOnionSkins(onionSkinPrev, parseInt(e.target.value) || 0)} className="w-12 p-1 border rounded" />
          </label>
        </div>
      </div>
      <div
        ref={stageRef}
        className="flex-1 bg-gray-900 relative overflow-hidden"
      >
        <div className="absolute inset-0 grid place-items-center opacity-20 pointer-events-none">
          <div className="w-full h-full max-w-[80%] max-h-[80%] border border-white border-dashed" />
        </div>

        {Array.from({ length: onionSkinPrev }).map((_, i) => {
          const f = currentFrame - (i + 1);
          if (f < 0) return null;
          return renderObjectsForFrame(f, 0.3 - (i * 0.1), false);
        })}
        {Array.from({ length: onionSkinNext }).map((_, i) => {
          const f = currentFrame + (i + 1);
          if (f > 503) return null;
          return renderObjectsForFrame(f, 0.3 - (i * 0.1), false);
        })}

        {renderObjectsForFrame(currentFrame, 1, true)}
      </div>
    </div>
  );
};
