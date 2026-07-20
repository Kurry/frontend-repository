import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { filteredScenes, viewModeStore, activeSlideIndexStore, searchFilterStore, statusFilterStore, reorderScenes, setCanvasPosition } from '@/store';
import { SceneCard } from './SceneCard';
import { AddSceneForm } from './AddSceneForm';
import { clsx } from 'clsx';

export function SceneGrid() {
  const scenes = useStore(filteredScenes);
  const viewMode = useStore(viewModeStore);
  const activeSlideIndex = useStore(activeSlideIndexStore);
  const searchFilter = useStore(searchFilterStore);
  const statusFilter = useStore(statusFilterStore);

  const [isAdding, setIsAdding] = useState(false);

  // Drag and Drop State for Tile/List reordering
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Canvas drag state
  const [canvasDrag, setCanvasDrag] = useState<{ id: string, startX: number, startY: number, initialX: number, initialY: number } | null>(null);

  // Slide navigation
  const handlePrev = () => {
    if (activeSlideIndex > 0) activeSlideIndexStore.set(activeSlideIndex - 1);
  };
  const handleNext = () => {
    if (activeSlideIndex < scenes.length - 1) activeSlideIndexStore.set(activeSlideIndex + 1);
  };

  // Reordering handlers (Tile/List)
  const handleDragStart = (e: React.DragEvent, index: number) => {
      if (viewMode === 'canvas') return;
      setDraggedIndex(index);
      e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e: React.DragEvent, index: number) => {
      if (viewMode === 'canvas') return;
      e.preventDefault();
  };
  const handleDrop = (e: React.DragEvent, index: number) => {
      if (viewMode === 'canvas' || draggedIndex === null || draggedIndex === index) return;
      reorderScenes(draggedIndex, index);
      setDraggedIndex(null);
  };

  // Canvas Drag Handlers
  const handleCanvasPointerDown = (e: React.PointerEvent, id: string, x: number, y: number) => {
      if (viewMode !== 'canvas') return;
      e.target.setPointerCapture(e.pointerId);
      setCanvasDrag({ id, startX: e.clientX, startY: e.clientY, initialX: x, initialY: y });
  };
  const handleCanvasPointerMove = (e: React.PointerEvent) => {
      if (!canvasDrag || viewMode !== 'canvas') return;
      const dx = e.clientX - canvasDrag.startX;
      const dy = e.clientY - canvasDrag.startY;
      setCanvasPosition(canvasDrag.id, canvasDrag.initialX + dx, canvasDrag.initialY + dy);
  };
  const handleCanvasPointerUp = (e: React.PointerEvent) => {
      if (!canvasDrag || viewMode !== 'canvas') return;
      e.target.releasePointerCapture(e.pointerId);
      setCanvasDrag(null);
  };

  if (scenes.length === 0) {
    if (searchFilter || statusFilter !== 'all') {
         return (
             <div className="flex flex-col items-center justify-center py-20 text-center">
                 <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                 </div>
                 <h2 className="text-lg font-semibold text-gray-900 mb-2">No matches found</h2>
                 <p className="text-gray-500 mb-6 max-w-md">Try adjusting your search or clearing the status filter to see all scenes.</p>
                 <button
                    className="btn btn-outline hover:bg-gray-50 focus:ring-2 focus:ring-yellow-400"
                    onClick={() => { searchFilterStore.set(''); statusFilterStore.set('all'); }}
                 >
                    Clear Filters
                 </button>
             </div>
         );
    }

    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mb-4 text-yellow-600">
               <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">It's a blank canvas</h2>
            <p className="text-gray-500 mb-6 max-w-md">Start building your storyboard by adding your first scene.</p>
            {isAdding ? (
                <div className="w-full max-w-2xl text-left"><AddSceneForm onClose={() => setIsAdding(false)} /></div>
            ) : (
                <button className="btn btn-primary bg-yellow-400 hover:bg-yellow-500 text-yellow-950 border-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2" onClick={() => setIsAdding(true)}>
                    Add Scene
                </button>
            )}
        </div>
    );
  }

  return (
    <main className="pb-24" aria-label="Storyboard Main Content">
      {isAdding && <AddSceneForm onClose={() => setIsAdding(false)} />}

      {viewMode === 'slide' && scenes.length > 0 && (
          <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm sticky top-32 z-10" aria-label="Slide Controls">
              <button className="btn btn-sm btn-ghost focus:ring-2 focus:ring-yellow-400" disabled={activeSlideIndex === 0} onClick={handlePrev} aria-label="Previous slide">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg> Prev
              </button>
              <span className="text-sm font-medium text-gray-600" aria-live="polite">
                  Scene {activeSlideIndex + 1} of {scenes.length}
              </span>
              <button className="btn btn-sm btn-ghost focus:ring-2 focus:ring-yellow-400" disabled={activeSlideIndex === scenes.length - 1} onClick={handleNext} aria-label="Next slide">
                  Next <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
              </button>
          </div>
      )}

      <div
        className={clsx(
          "w-full transition-all duration-300 scenes-grid",
          viewMode === 'tile' && "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
          viewMode === 'list' && "flex flex-col gap-4 max-w-4xl is-list",
          viewMode === 'slide' && "flex justify-center is-slide",
          viewMode === 'canvas' && "relative h-[800px] bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200 overflow-hidden"
        )}
      >
        {scenes.map((scene, i) => (
            <div
                key={scene.id}
                draggable={viewMode === 'tile' || viewMode === 'list'}
                onDragStart={(e) => handleDragStart(e, i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDrop={(e) => handleDrop(e, i)}
                onPointerDown={(e) => handleCanvasPointerDown(e, scene.id, scene.canvasX || (i % 4) * 300, scene.canvasY || Math.floor(i / 4) * 350)}
                onPointerMove={handleCanvasPointerMove}
                onPointerUp={handleCanvasPointerUp}
                className={clsx("transition-opacity", draggedIndex === i && "opacity-50", viewMode === 'canvas' && "absolute touch-none")}
                style={viewMode === 'canvas' ? { left: scene.canvasX || (i % 4) * 300, top: scene.canvasY || Math.floor(i / 4) * 350, zIndex: canvasDrag?.id === scene.id ? 10 : 1 } : undefined}
            >
                <SceneCard scene={scene} index={i} layout={viewMode} isActiveSlide={i === activeSlideIndex} />
            </div>
        ))}
      </div>

      {viewMode !== 'canvas' && !isAdding && (
          <div className="mt-8 flex justify-center">
              <button
                  className="btn btn-ghost border-2 border-dashed border-gray-300 w-full max-w-xs hover:border-yellow-400 hover:text-yellow-600 hover:bg-yellow-50 focus:ring-2 focus:ring-yellow-400"
                  onClick={() => setIsAdding(true)}
              >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
                  Add Scene
              </button>
          </div>
      )}
    </main>
  );
}
