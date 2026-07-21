import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { clsx } from 'clsx';
import {
  filteredScenes,
  viewModeStore,
  activeSlideIndexStore,
  searchFilterStore,
  statusFilterStore,
  reorderScenes,
  setCanvasPosition,
  canvasGridPosition,
  layoutTickStore,
  type Scene,
} from '@/store';
import {
  isAddSceneOpenStore,
  isCommandPaletteOpenStore,
  isExportDrawerOpenStore,
  isImportModalOpenStore,
  versionHistorySceneIdStore,
  openAddScene,
  showToast,
} from '@/store/ui';
import { prefersReducedMotion } from '@/lib/motion';
import { SceneCard } from './SceneCard';
import { AddSceneForm } from './AddSceneForm';
import { Ri } from '../common/Ri';

gsap.registerPlugin(Flip);

function anyDialogOpen(): boolean {
  return (
    isCommandPaletteOpenStore.get() ||
    isExportDrawerOpenStore.get() ||
    isImportModalOpenStore.get() ||
    versionHistorySceneIdStore.get() !== null
  );
}

export function SceneGrid() {
  const scenes = useStore(filteredScenes);
  const viewMode = useStore(viewModeStore);
  const activeSlideIndex = useStore(activeSlideIndexStore);
  const searchFilter = useStore(searchFilterStore);
  const statusFilter = useStore(statusFilterStore);
  const isAdding = useStore(isAddSceneOpenStore);
  const [dismissedWelcome, setDismissedWelcome] = useState(false);

  const gridRef = useRef<HTMLDivElement>(null);
  const flipStateRef = useRef<Flip.FlipState | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [draggingCanvasId, setDraggingCanvasId] = useState<string | null>(null);
  const canvasDragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
    moved: boolean;
  } | null>(null);

  /* Keep the active slide inside the visible range. */
  useEffect(() => {
    if (scenes.length === 0) {
      if (activeSlideIndex !== 0) activeSlideIndexStore.set(0);
    } else if (activeSlideIndex > scenes.length - 1) {
      activeSlideIndexStore.set(scenes.length - 1);
    }
  }, [scenes.length, activeSlideIndex]);

  /* Capture pre-change layout for FLIP settle on deletes/reorders/undo/import. */
  useEffect(() => {
    const unsub = layoutTickStore.subscribe(() => {
      const mode = viewModeStore.get();
      if (prefersReducedMotion() || (mode !== 'tile' && mode !== 'list')) return;
      flipStateRef.current = Flip.getState(gridRef.current?.querySelectorAll('[data-flip-id]') ?? [], {
        props: 'opacity',
      });
    });
    return unsub;
  }, []);

  /* Capture pre-change layout when toggling between Tile and List. */
  const prevModeRef = useRef(viewMode);
  useEffect(() => {
    const unsub = viewModeStore.subscribe((mode) => {
      const prev = prevModeRef.current;
      prevModeRef.current = mode;
      const relayout = ['tile', 'list'];
      if (prefersReducedMotion() || !relayout.includes(prev) || !relayout.includes(mode)) return;
      flipStateRef.current = Flip.getState(gridRef.current?.querySelectorAll('[data-flip-id]') ?? [], {
        props: 'opacity',
      });
    });
    return unsub;
  }, []);

  /* After React re-renders, ease remaining cards into their new slots. */
  useLayoutEffect(() => {
    const state = flipStateRef.current;
    if (!state) return;
    flipStateRef.current = null;
    Flip.from(state, {
      duration: 0.38,
      ease: 'power2.out',
      absolute: false,
      onEnter: (els) =>
        gsap.fromTo(els, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out', clearProps: 'transform' }),
      onComplete: () => {
        // Never leave inline transforms behind — they would block the CSS hover lift.
        gridRef.current?.querySelectorAll('[data-flip-id]').forEach((el) => {
          gsap.set(el, { clearProps: 'transform' });
        });
      },
    });
  }, [scenes, viewMode]);

  /* Slide mode: arrow keys advance when no dialog is open. */
  useEffect(() => {
    if (viewMode !== 'slide') return;
    const onKey = (e: KeyboardEvent) => {
      if (anyDialogOpen() || isAddSceneOpenStore.get()) return;
      const target = e.target as HTMLElement | null;
      if (target && target.closest('[role="dialog"], textarea, input, select')) return;
      const list = filteredScenes.get();
      if (e.key === 'ArrowRight') {
        const idx = activeSlideIndexStore.get();
        if (idx < list.length - 1) {
          e.preventDefault();
          activeSlideIndexStore.set(idx + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        const idx = activeSlideIndexStore.get();
        if (idx > 0) {
          e.preventDefault();
          activeSlideIndexStore.set(idx - 1);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewMode]);

  /* Reorder handlers (Tile / List) */
  const onDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const onDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null);
      return;
    }
    reorderScenes(draggedIndex, index);
    setDraggedIndex(null);
    showToast('Scenes Reordered');
  };

  /* Canvas free-drag handlers (position only — never order). */
  const onCanvasPointerDown = (e: React.PointerEvent, scene: Scene, index: number) => {
    if (e.button !== 0) return;
    const grid = canvasGridPosition(index);
    canvasDragRef.current = {
      id: scene.id,
      startX: e.clientX,
      startY: e.clientY,
      baseX: scene.canvasX ?? grid.x,
      baseY: scene.canvasY ?? grid.y,
      moved: false,
    };
  };
  const onCanvasPointerMove = (e: React.PointerEvent) => {
    const drag = canvasDragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) > 4) {
      drag.moved = true;
      setDraggingCanvasId(drag.id);
      // Capture only once this is a real drag, so plain clicks still reach card content.
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    if (drag.moved) {
      setCanvasPosition(drag.id, Math.max(0, drag.baseX + dx), Math.max(0, drag.baseY + dy));
    }
  };
  const onCanvasPointerUp = (e: React.PointerEvent, scene: Scene) => {
    const drag = canvasDragRef.current;
    canvasDragRef.current = null;
    if (!drag) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* pointer capture may already be released */
    }
    if (drag.moved) {
      setDraggingCanvasId(null);
      const card = gridRef.current?.querySelector(`[data-flip-id="${scene.id}"]`);
      if (card && !prefersReducedMotion()) {
        gsap.fromTo(card, { scale: 1.03 }, { scale: 1, duration: 0.25, ease: 'power2.out', clearProps: 'transform' });
      }
    }
  };

  /* ------------------------- Empty states ------------------------- */
  if (scenes.length === 0) {
    const filteredEmpty = searchFilter.trim() !== '' || statusFilter !== 'all';
    return (
      <section className="flex flex-col items-center justify-center px-4 py-16 text-center" aria-live="polite">
        {filteredEmpty ? (
          <>
            <span className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gray-100 text-gray-400">
              <Ri name="search-line" size={28} />
            </span>
            <h2 className="text-lg font-bold tracking-tight text-gray-900">No Matching Scenes</h2>
            <p className="mt-1.5 max-w-md text-sm text-gray-500">
              No scenes match the current search or status filter. Clear filters to see the full board again.
            </p>
            <button
              type="button"
              onClick={() => {
                searchFilterStore.set('');
                statusFilterStore.set('all');
              }}
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:border-yellow-400 hover:bg-yellow-50 hover:text-yellow-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
            >
              <Ri name="close-line" size={16} />
              Clear Filters
            </button>
          </>
        ) : (
          <>
            <span className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-yellow-50 text-yellow-600 ring-1 ring-inset ring-yellow-200/70">
              <Ri name="apps-line" size={28} />
            </span>
            <h2 className="text-lg font-bold tracking-tight text-gray-900">No Scenes Left</h2>
            <p className="mt-1.5 max-w-md text-sm text-gray-500">
              Every scene has been deleted, so the board is empty. Add a scene below to start rebuilding your
              storyboard.
            </p>
            {isAdding ? (
              <div className="mt-6 w-full max-w-2xl text-left">
                <AddSceneForm />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openAddScene()}
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-yellow-400 px-5 text-sm font-bold text-yellow-950 shadow-sm shadow-yellow-400/40 transition-all hover:bg-yellow-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2"
              >
                <Ri name="add-line" size={18} />
                Add Scene
              </button>
            )}
          </>
        )}
      </section>
    );
  }

  /* --------------------------- Board ------------------------------ */
  const isSlide = viewMode === 'slide';
  const isCanvas = viewMode === 'canvas';
  const activeScene = scenes[Math.min(activeSlideIndex, scenes.length - 1)];

  return (
    <section aria-label="Scene board">
      {dismissedWelcome === false && (
        <div className="mb-5 flex items-start gap-3 rounded-xl bg-yellow-50 px-4 py-3 ring-1 ring-inset ring-yellow-200/70">
          <Ri name="sparkling-2-fill" size={17} className="mt-0.5 shrink-0 text-yellow-500" />
          <p className="min-w-0 flex-1 text-sm text-yellow-900">
            <strong className="font-bold">Welcome to Docs!</strong> Click any scene description to edit it in
            place, switch view modes below, and press <kbd className="rounded border border-yellow-300 bg-white px-1 py-0.5 text-[10px] font-bold">⌘K</kbd> for
            the command palette.
          </p>
          <button
            type="button"
            aria-label="Dismiss welcome message"
            onClick={() => setDismissedWelcome(true)}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-yellow-700 transition-colors hover:bg-yellow-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
          >
            <Ri name="close-line" size={15} />
          </button>
        </div>
      )}

      {isAdding && (
        <div className="mb-6">
          <AddSceneForm />
        </div>
      )}

      {isSlide && (
        <div
          className="mb-5 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm"
          aria-label="Slide controls"
        >
          <button
            type="button"
            disabled={activeSlideIndex <= 0}
            onClick={() => activeSlideIndexStore.set(Math.max(0, activeSlideIndex - 1))}
            aria-label="Previous scene"
            className="inline-flex h-11 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 disabled:pointer-events-none disabled:opacity-30"
          >
            <Ri name="arrow-left-s-line" size={19} />
            Prev
          </button>
          <span className="text-sm font-semibold tabular-nums text-gray-600" aria-live="polite">
            Scene {Math.min(activeSlideIndex, scenes.length - 1) + 1} of {scenes.length}
          </span>
          <button
            type="button"
            disabled={activeSlideIndex >= scenes.length - 1}
            onClick={() => activeSlideIndexStore.set(Math.min(scenes.length - 1, activeSlideIndex + 1))}
            aria-label="Next scene"
            className="inline-flex h-11 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 disabled:pointer-events-none disabled:opacity-30"
          >
            Next
            <Ri name="arrow-right-s-line" size={19} />
          </button>
        </div>
      )}

      <div
        ref={gridRef}
        className={clsx(
          'scenes-grid transition-opacity duration-200',
          viewMode === 'tile' && 'grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4',
          viewMode === 'list' && 'is-list flex max-w-4xl flex-col gap-4',
          viewMode === 'slide' && 'is-slide',
          viewMode === 'canvas' &&
            'canvas-surface relative min-h-[560px] overflow-auto rounded-2xl border-2 border-dashed border-gray-300/80 bg-[#fafaf7]'
        )}
      >
        {isSlide ? (
          activeScene && (
            <div key={activeScene.id} className="slide-slot">
              <SceneCard scene={activeScene} index={0} layout="slide" />
            </div>
          )
        ) : isCanvas ? (
          <div className="relative min-h-[540px] min-w-[720px] sm:min-w-0">
            {scenes.map((scene, i) => {
              const grid = canvasGridPosition(i);
              const x = scene.canvasX ?? grid.x;
              const y = scene.canvasY ?? grid.y;
              return (
                <div
                  key={scene.id}
                  className={clsx(
                    'absolute touch-none',
                    draggingCanvasId === scene.id
                      ? 'z-30'
                      : 'transition-[left,top] duration-300 ease-out'
                  )}
                  style={{ left: x, top: y }}
                  onPointerDown={(e) => onCanvasPointerDown(e, scene, i)}
                  onPointerMove={onCanvasPointerMove}
                  onPointerUp={(e) => onCanvasPointerUp(e, scene)}
                  onPointerCancel={(e) => onCanvasPointerUp(e, scene)}
                >
                  <SceneCard scene={scene} index={i} layout="canvas" isDragging={draggingCanvasId === scene.id} />
                </div>
              );
            })}
          </div>
        ) : (
          scenes.map((scene, i) => (
            <div
              key={scene.id}
              draggable
              onDragStart={(e) => onDragStart(e, i)}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, i)}
              onDragEnd={() => setDraggedIndex(null)}
              className={clsx(
                'rounded-xl transition-opacity duration-200',
                draggedIndex === i && 'opacity-40',
                viewMode === 'list' && 'list-row'
              )}
            >
              <SceneCard scene={scene} index={i} layout={viewMode} />
            </div>
          ))
        )}
      </div>

      {!isCanvas && !isSlide && !isAdding && (
        <div className="mt-7 flex justify-center">
          <button
            type="button"
            onClick={() => openAddScene()}
            className="inline-flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 text-sm font-bold text-gray-500 transition-all hover:border-yellow-400 hover:bg-yellow-50/60 hover:text-yellow-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
          >
            <Ri name="add-line" size={18} />
            Add Scene
          </button>
        </div>
      )}
    </section>
  );
}
