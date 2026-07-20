import React, { useState, useRef } from 'react';
import { updateScene, Scene } from '../store';
import { SceneCard } from './SceneCard';

interface Props {
  scenes: Scene[];
  onEdit: (id: string) => void;
  onVersionHistory: (id: string) => void;
}

export function CanvasBoard({ scenes, onEdit, onVersionHistory }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    // Only start drag on the card header/image, not on the editable content
    const target = e.target as HTMLElement;
    if (target.closest('.scene-description') || target.closest('button')) return;

    const cardEl = (e.currentTarget as HTMLElement).parentElement;
    if (!cardEl || !containerRef.current) return;

    const cardRect = cardEl.getBoundingClientRect();

    setDraggingId(id);
    setOffset({
      x: e.clientX - cardRect.left,
      y: e.clientY - cardRect.top
    });

    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingId || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newX = e.clientX - containerRect.left - offset.x;
    const newY = e.clientY - containerRect.top - offset.y;

    updateScene(draggingId, {
      canvasX: newX,
      canvasY: newY
    }, false); // Don't record history for canvas drags
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingId) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setDraggingId(null);
    }
  };

  const resetLayout = () => {
    scenes.forEach((scene, index) => {
      updateScene(scene.id, {
        canvasX: 20 + (index % 4) * 280,
        canvasY: 60 + Math.floor(index / 4) * 320
      }, false);
    });
  };

  return (
    <div
      ref={containerRef}
      className="canvas-mode relative w-full min-h-[1000px] bg-gray-100 rounded-lg overflow-hidden border border-gray-300"
    >
      <div className="absolute top-4 right-4 z-50">
        <button className="btn btn-sm bg-white border-gray-200" onClick={resetLayout}>Reset layout</button>
      </div>

      {scenes.map((scene, index) => {
        const defaultX = 20 + (index % 4) * 280;
        const defaultY = 60 + Math.floor(index / 4) * 320;

        return (
          <div
            key={scene.id}
            className={`absolute w-[260px] ${draggingId === scene.id ? 'z-50' : 'z-10'}`}
            style={{
              left: scene.canvasX ?? defaultX,
              top: scene.canvasY ?? defaultY,
            }}
          >
            <div
              onPointerDown={(e) => handlePointerDown(e, scene.id)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <SceneCard
                scene={scene}
                viewMode="tile"
                onEdit={onEdit}
                onVersionHistory={onVersionHistory}
                isDragging={draggingId === scene.id}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
