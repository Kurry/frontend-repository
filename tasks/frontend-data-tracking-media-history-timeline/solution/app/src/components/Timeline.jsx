import React, { useRef, useEffect, useState } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { filteredEventsAtom, yearWindowAtom, selectedEventIdAtom, resetFiltersAtom } from '../store.js';
import { MT_DATA } from '../data.js';
import { motion, AnimatePresence } from 'framer-motion';

function formatYear(y) {
  if (y < 1) return `${Math.abs(y)} BCE`;
  return `${y} CE`;
}

export function Timeline() {
  const events = useAtomValue(filteredEventsAtom);
  const [yearWindow, setYearWindow] = useAtom(yearWindowAtom);
  const [selectedId, setSelectedId] = useAtom(selectedEventIdAtom);
  const resetFilters = useSetAtom(resetFiltersAtom);

  const containerRef = useRef(null);
  const [width, setWidth] = useState(1000);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(entries => {
      setWidth(entries[0].contentRect.width);
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const span = yearWindow.to - yearWindow.from;
  const pixelsPerYear = width / span;

  useEffect(() => {
    const handleFullSpan = () => {
      setYearWindow({ from: MT_DATA.yearMin, to: MT_DATA.yearMax });
    };
    window.addEventListener('full-span', handleFullSpan);
    return () => window.removeEventListener('full-span', handleFullSpan);
  }, [setYearWindow]);

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      const dx = e.deltaX || e.deltaY;
      const yearDelta = (dx / width) * span;
      let newFrom = yearWindow.from + yearDelta;
      let newTo = yearWindow.to + yearDelta;

      if (newFrom < MT_DATA.yearMin) {
        newFrom = MT_DATA.yearMin;
        newTo = newFrom + span;
      }
      if (newTo > MT_DATA.yearMax) {
        newTo = MT_DATA.yearMax;
        newFrom = newTo - span;
      }

      setYearWindow({ from: newFrom, to: newTo });
    } else {
      const zoom = e.deltaY > 0 ? 1.12 : 0.9;
      const mid = (yearWindow.from + yearWindow.to) / 2;
      const newSpan = span * zoom;
      const half = Math.max(15, Math.min(newSpan / 2, (MT_DATA.yearMax - MT_DATA.yearMin) / 2));

      let newFrom = mid - half;
      let newTo = mid + half;

      if (newFrom < MT_DATA.yearMin) newFrom = MT_DATA.yearMin;
      if (newTo > MT_DATA.yearMax) newTo = MT_DATA.yearMax;

      setYearWindow({ from: newFrom, to: newTo });
    }
  };

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.addEventListener('wheel', handleWheel, { passive: false });
      return () => el.removeEventListener('wheel', handleWheel);
    }
  }, [yearWindow, width, span]);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, from: 0, to: 0 });

  const onPointerDown = (e) => {
    if (e.target.closest('button')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, from: yearWindow.from, to: yearWindow.to });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const yearDelta = -(dx / width) * span;

    let newFrom = dragStart.from + yearDelta;
    let newTo = dragStart.to + yearDelta;

    if (newFrom < MT_DATA.yearMin) {
      newFrom = MT_DATA.yearMin;
      newTo = newFrom + span;
    }
    if (newTo > MT_DATA.yearMax) {
      newTo = MT_DATA.yearMax;
      newFrom = newTo - span;
    }

    setYearWindow({ from: newFrom, to: newTo });
  };

  const onPointerUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch(e) {}
  };

  const ticks = [];
  const tickStep = span > 1000 ? 500 : span > 200 ? 100 : span > 50 ? 20 : 10;
  const startTick = Math.floor(yearWindow.from / tickStep) * tickStep;
  for (let y = startTick; y <= yearWindow.to; y += tickStep) {
    if (y >= MT_DATA.yearMin && y <= MT_DATA.yearMax) {
      const x = ((y - yearWindow.from) / span) * width;
      ticks.push({ year: y, x });
    }
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div
      ref={containerRef}
      className={`flex-1 relative cursor-grab select-none overflow-hidden ${isDragging ? 'cursor-grabbing' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      tabIndex={0}
      aria-label="Interactive media history timeline"
    >
      <div className="absolute top-[72%] left-0 right-0 h-0.5 bg-gray-300"></div>

      {ticks.map(t => (
        <div
          key={t.year}
          className="absolute top-[72%] w-px h-3 bg-gray-400"
          style={{ left: `${t.x}px` }}
        >
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs font-semibold text-gray-500 whitespace-nowrap">
            {formatYear(t.year)}
          </div>
        </div>
      ))}

      <AnimatePresence>
        {events.map((ev) => {
          const x = ((ev.year - yearWindow.from) / span) * width;
          if (x < -100 || x > width + 100) return null; // cull

          const lane = (Array.from(ev.id).reduce((s, c) => s + c.charCodeAt(0), 0) % 6) + 1;
          const y = (lane / 7) * 72; // % height from top
          const stemH = Math.max(10, 72 - y);

          const cat = MT_DATA.categories.find(c => c.id === ev.categories[0]);
          const color = cat ? cat.color : '#000';
          const isActive = selectedId === ev.id;

          return (
            <motion.div
              key={ev.id}
              initial={reduceMotion ? { opacity: 1, scale: 1, x, top: `${y}%` } : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1, x, top: `${y}%` }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0 }}
              transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 25 }}
              className={`absolute group z-[var(--z-events)] ${isActive ? 'z-20' : ''}`}
              style={{ x: 0 }}
            >
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 w-px bg-gray-300 -z-10 group-hover:bg-gray-400 transition-colors"
                style={{ height: `calc(${stemH}vh + 10px)` }}
              ></div>
              <button
                type="button"
                className={`w-6 h-6 rounded-full border-2 bg-white flex items-center justify-center -translate-x-1/2 -translate-y-1/2 focus-visible outline-none transition-all ${isActive ? 'scale-125 shadow-lg border-[var(--c-focus)]' : 'border-gray-200 hover:scale-110 shadow-sm hover:shadow-md'}`}
                onClick={(e) => { e.stopPropagation(); setSelectedId(ev.id); }}
                aria-label={`${ev.title}, ${formatYear(ev.year)}`}
                tabIndex={0}
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
              </button>

              <div className={`absolute top-0 left-4 whitespace-nowrap pointer-events-none transition-opacity ${isActive ? 'opacity-100 z-10' : 'opacity-0 group-hover:opacity-100'}`}>
                <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs shadow-sm border border-gray-100 font-medium">
                  {ev.title}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {events.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-live="polite">
          <div className="bg-white/80 px-4 py-3 rounded shadow-sm flex flex-col items-center gap-2">
            <p className="text-gray-600 font-medium">No events match this range and filters.</p>
            <button
              type="button"
              className="text-sm text-cyan-600 font-semibold pointer-events-auto hover:underline"
              onClick={() => resetFilters()}
            >
              Reset filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
