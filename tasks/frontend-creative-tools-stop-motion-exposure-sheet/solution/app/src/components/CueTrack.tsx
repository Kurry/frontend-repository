import React, { useRef, useEffect, useState } from 'react';
import { useStore } from '../store/useStore';

export const CueTrack: React.FC = () => {
  const { cues, currentFrame, updateCueFrame } = useStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [draggingCue, setDraggingCue] = useState<string | null>(null);

  useEffect(() => {
    if (scrollRef.current && !draggingCue) {
      const el = scrollRef.current;
      const targetScroll = currentFrame * 16 - el.clientWidth / 2;
      el.scrollLeft = Math.max(0, targetScroll);
    }
  }, [currentFrame, draggingCue]);

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    setDraggingCue(id);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingCue || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + (scrollRef.current?.scrollLeft || 0);
    const newFrame = Math.max(0, Math.min(503, Math.floor(x / 16)));
    updateCueFrame(draggingCue, newFrame);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingCue) {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      setDraggingCue(null);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden flex flex-col h-24">
      <div className="p-1 bg-gray-100 border-b border-gray-200 text-xs font-semibold">Cues</div>
      <div className="flex-1 overflow-x-auto overflow-y-hidden" ref={scrollRef}>
        <div className="relative h-full bg-gray-50" style={{ width: 504 * 16 }} ref={containerRef}>
          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-4 bg-red-500/20 border-l border-red-500 z-20 pointer-events-none transition-transform"
            style={{ transform: `translateX(${currentFrame * 16}px)` }}
          />
          {cues.map(c => (
            <div
              key={c.id}
              role="button"
              onPointerDown={(e) => handlePointerDown(e, c.id)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className={`absolute top-2 h-6 px-1 text-[10px] flex items-center justify-center rounded cursor-col-resize ${c.type === 'dialogue' ? 'bg-amber-200 border border-amber-400' : 'bg-purple-200 border border-purple-400'}`}
              style={{ left: c.frame * 16, transform: 'translateX(-50%)' }}
            >
              <span className="pointer-events-none">{c.content.substring(0, 3)}</span>
            </div>
          ))}
          {/* Waveform visual proxy */}
          <div className="absolute bottom-0 w-full h-4 opacity-30 flex items-end pointer-events-none">
             {Array.from({length: 100}).map((_, i) => (
               <div key={i} className="flex-1 bg-gray-400 mx-[1px]" style={{ height: `${Math.random() * 100}%` }} />
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};
