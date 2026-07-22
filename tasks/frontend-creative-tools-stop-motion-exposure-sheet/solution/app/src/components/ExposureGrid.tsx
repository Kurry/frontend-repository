import React, { useRef, useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const ExposureGrid: React.FC = () => {
  const {
    currentFrame, setCurrentFrame, shots, ranges,
    selectedRangeIds, selectRange, updateRangeBounds
  } = useStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [draggingRange, setDraggingRange] = useState<{ id: string, type: 'move' | 'resize', startX: number, initialStart: number, initialEnd: number } | null>(null);

  const tracks = Array.from(new Set(ranges.map(r => r.trackId)));

  useEffect(() => {
    if (scrollRef.current && !draggingRange) {
      const el = scrollRef.current;
      const targetScroll = currentFrame * 16 - el.clientWidth / 2;
      el.scrollLeft = Math.max(0, targetScroll);
    }
  }, [currentFrame, draggingRange]);

  const handlePointerDown = (e: React.PointerEvent, id: string, type: 'move' | 'resize') => {
    e.stopPropagation();
    selectRange(id, e.shiftKey);
    const range = ranges.find(r => r.id === id);
    if (!range) return;

    setDraggingRange({
      id,
      type,
      startX: e.clientX,
      initialStart: range.startFrame,
      initialEnd: range.endFrame
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingRange) return;

    const deltaX = e.clientX - draggingRange.startX;
    const deltaFrames = Math.round(deltaX / 16);

    if (draggingRange.type === 'move') {
      const newStart = Math.max(0, draggingRange.initialStart + deltaFrames);
      const newEnd = newStart + (draggingRange.initialEnd - draggingRange.initialStart);
      updateRangeBounds(draggingRange.id, newStart, newEnd, 'ripple');
    } else if (draggingRange.type === 'resize') {
      const newEnd = Math.max(draggingRange.initialStart, draggingRange.initialEnd + deltaFrames);
      updateRangeBounds(draggingRange.id, draggingRange.initialStart, newEnd, 'ripple');
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingRange) {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      setDraggingRange(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded shadow-sm overflow-hidden flex-1">
      <div className="flex items-center gap-2 p-2 bg-gray-100 border-b border-gray-200">
        <button className="p-1 hover:bg-gray-200 rounded" onClick={() => setCurrentFrame(Math.max(0, currentFrame - 1))}>
          <ChevronLeft size={16} />
        </button>
        <span className="font-mono text-sm w-16 text-center">F:{currentFrame}</span>
        <button className="p-1 hover:bg-gray-200 rounded" onClick={() => setCurrentFrame(currentFrame + 1)}>
          <ChevronRight size={16} />
        </button>
        <div className="ml-auto text-xs text-gray-500">Tracks: {tracks.length} | Frames: 504</div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <div className="w-24 border-r border-gray-200 bg-gray-50 z-10 shrink-0">
          <div className="h-6 border-b border-gray-200 bg-gray-100 sticky top-0" />
          {tracks.map(t => (
            <div key={t} className="h-8 border-b border-gray-200 px-2 py-1 text-xs truncate flex items-center">
              {t}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-auto" ref={scrollRef}>
          <div className="relative min-w-max" style={{ width: 504 * 16 }} ref={containerRef}>
            <div className="h-6 border-b border-gray-200 flex sticky top-0 bg-gray-100 z-10">
              {shots.map(s => (
                <div key={s.id}
                  className="border-r border-gray-300 text-[10px] px-1 py-1 truncate flex-shrink-0"
                  style={{ width: (s.endFrame - s.startFrame + 1) * 16 }}
                >
                  {s.name}
                </div>
              ))}
            </div>

            <div
              className="absolute top-0 bottom-0 w-4 bg-red-500/20 border-l border-red-500 z-20 pointer-events-none transition-transform"
              style={{ transform: `translateX(${currentFrame * 16}px)` }}
            />

            {tracks.map(trackId => {
              const trackRanges = ranges.filter(r => r.trackId === trackId);
              return (
                <div key={trackId} className="h-8 border-b border-gray-200 relative bg-white">
                  {trackRanges.map(r => {
                    const left = r.startFrame * 16;
                    const width = (r.endFrame - r.startFrame + 1) * 16;
                    const isSelected = selectedRangeIds.includes(r.id);
                    return (
                      <div
                        key={r.id}
                        role="button"
                        onPointerDown={(e) => handlePointerDown(e, r.id, 'move')}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                        className={clsx(
                          "absolute top-1 bottom-1 rounded text-[10px] px-1 overflow-hidden flex items-center border select-none cursor-pointer group",
                          r.state === 'planned' ? 'bg-blue-100 border-blue-300' :
                          r.state === 'missing' ? 'bg-red-100 border-red-300' :
                          'bg-gray-100 border-gray-300',
                          isSelected && 'ring-2 ring-blue-500 z-10'
                        )}
                        style={{ left, width }}
                      >
                        <span className="pointer-events-none">{r.id.split('-')[1]}</span>
                        <div
                          className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-black/20"
                          onPointerDown={(e) => handlePointerDown(e, r.id, 'resize')}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
