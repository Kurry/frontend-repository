import React, { useRef, useEffect, useState } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { filteredEventsAtom, yearWindowAtom, selectedEventIdAtom, resetFiltersAtom } from '../store.js';
import { MT_DATA } from '../data.js';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';

function formatYear(y) {
  if (y < 1) return `${Math.abs(y)} BCE`;
  return `${y} CE`;
}

const ERA_BANDS = [
  { label: 'Ancient foundations', from: -3200, to: -500, color: 'rgba(139, 98, 57, 0.10)' },
  { label: 'Classical manuscript', from: -500, to: 600, color: 'rgba(0, 131, 143, 0.09)' },
  { label: 'Paper & manuscript', from: 600, to: 1400, color: 'rgba(27, 107, 74, 0.09)' },
  { label: 'Print revolution', from: 1400, to: 1800, color: 'rgba(47, 93, 140, 0.09)' },
  { label: 'Industrial media', from: 1800, to: 1900, color: 'rgba(194, 106, 0, 0.10)' },
  { label: 'Broadcast age', from: 1900, to: 1980, color: 'rgba(92, 107, 122, 0.10)' },
  { label: 'Networked age', from: 1980, to: 2024, color: 'rgba(156, 39, 176, 0.09)' },
];

export function Timeline() {
  const reduceMotion = useReducedMotion();
  const events = useAtomValue(filteredEventsAtom);
  const [yearWindow, setYearWindow] = useAtom(yearWindowAtom);
  const [selectedId, setSelectedId] = useAtom(selectedEventIdAtom);
  const resetFilters = useSetAtom(resetFiltersAtom);

  const containerRef = useRef(null);
  const [width, setWidth] = useState(1000);
  const [height, setHeight] = useState(600);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(entries => {
      setWidth(entries[0].contentRect.width);
      setHeight(entries[0].contentRect.height);
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const span = yearWindow.to - yearWindow.from;
  const pixelsPerYear = width / span;

  const clampWindow = (from, to) => {
    let f = from;
    let t = to;
    const s = t - f;
    if (f < MT_DATA.yearMin) {
      f = MT_DATA.yearMin;
      t = f + s;
    }
    if (t > MT_DATA.yearMax) {
      t = MT_DATA.yearMax;
      f = t - s;
    }
    return { from: Math.round(f), to: Math.round(t) };
  };

  const panBy = (yearDelta) => {
    setYearWindow(clampWindow(yearWindow.from + yearDelta, yearWindow.to + yearDelta));
  };

  const zoomAboutMidpoint = (factor) => {
    const mid = (yearWindow.from + yearWindow.to) / 2;
    const totalSpan = MT_DATA.yearMax - MT_DATA.yearMin;
    const targetSpan = Math.max(50, Math.min(span * factor, totalSpan));
    setYearWindow(clampWindow(mid - targetSpan / 2, mid + targetSpan / 2));
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (width <= 0 || span <= 0) return;
    if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      const dx = e.deltaX || e.deltaY;
      panBy((dx / width) * span);
    } else {
      zoomAboutMidpoint(e.deltaY > 0 ? 1.12 : 0.9);
    }
  };

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.addEventListener('wheel', handleWheel, { passive: false });
      return () => el.removeEventListener('wheel', handleWheel);
    }
  }, [yearWindow, width, span]);

  const onKeyDown = (e) => {
    if (width <= 0 || span <= 0) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); panBy(-span * 0.05); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); panBy(span * 0.05); }
    else if (e.key === 'ArrowUp' || e.key === '+' || e.key === '=') { e.preventDefault(); zoomAboutMidpoint(0.85); }
    else if (e.key === 'ArrowDown' || e.key === '-' || e.key === '_') { e.preventDefault(); zoomAboutMidpoint(1.18); }
  };

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, from: 0, to: 0 });

  const onPointerDown = (e) => {
    if (e.target.closest('button')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, from: yearWindow.from, to: yearWindow.to });
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) { /* pointer capture unsupported — drag still works via bubbling */ }
  };

  const onPointerMove = (e) => {
    if (!isDragging || width <= 0 || span <= 0) return;
    const dx = e.clientX - dragStart.x;
    const yearDelta = -(dx / width) * span;
    setYearWindow(clampWindow(dragStart.from + yearDelta, dragStart.to + yearDelta));
  };

  const onPointerUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) { /* ignore */ }
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

  const compact = width < 700;

  return (
    <div
      ref={containerRef}
      className={`flex-1 relative cursor-grab select-none overflow-hidden ${isDragging ? 'cursor-grabbing' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="application"
      aria-label="Interactive media history timeline. Arrow keys pan the year window; plus and minus zoom."
    >
      <div className="absolute top-[72%] left-0 right-0 h-0.5 bg-gray-300"></div>

      {ERA_BANDS.map((era) => {
        const visibleFrom = Math.max(era.from, yearWindow.from);
        const visibleTo = Math.min(era.to, yearWindow.to);
        if (visibleFrom >= visibleTo) return null;
        const left = ((visibleFrom - yearWindow.from) / span) * width;
        const bandWidth = ((visibleTo - visibleFrom) / span) * width;
        return (
          <div
            key={era.label}
            className="absolute top-[8%] h-[18%] border-x border-black/5"
            style={{ left, width: bandWidth, background: era.color }}
            aria-label={`${era.label} era`}
          >
            <span className="absolute left-2 top-2 max-w-[calc(100%-1rem)] truncate text-xs font-semibold text-gray-500">
              {era.label}
            </span>
          </div>
        );
      })}

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

          // Keep the label box inside the stage so it never clips past the viewport edge.
          const labelAbsLeft = Math.min(Math.max(x + 14, 4), Math.max(4, width - 148));
          const labelOffset = labelAbsLeft - x;

          return (
            <motion.div
              key={ev.id}
              initial={reduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 25 }}
              style={{ x, top: `${y}%` }}
              className={`absolute group z-[var(--z-events)] ${isActive ? 'z-20' : ''}`}
            >
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 w-px bg-gray-300 -z-10 group-hover:bg-gray-400 transition-colors"
                style={{ height: `${Math.max(10, (stemH / 100) * height)}px` }}
              ></div>
              <button
                type="button"
                className={`w-6 h-6 rounded-full border-2 bg-white flex items-center justify-center -translate-x-1/2 -translate-y-1/2 transition-all duration-150 ${isActive
                  ? 'scale-125 shadow-lg border-[var(--c-brand)]'
                  : 'border-gray-300 shadow-sm hover:scale-125 hover:border-[var(--c-brand)] hover:shadow-lg hover:ring-4 hover:ring-cyan-600/20 active:scale-95'}`}
                onClick={(e) => { e.stopPropagation(); setSelectedId(ev.id); }}
                aria-label={`${ev.title}, ${formatYear(ev.year)}`}
                tabIndex={0}
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
              </button>

              {(!compact || isActive) && (
                <div
                  className={`absolute top-0 pointer-events-none transition-opacity z-10 ${isActive ? 'opacity-100' : 'opacity-90 group-hover:opacity-100'}`}
                  style={{ left: labelOffset }}
                >
                  <div className={`bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs shadow-sm border font-medium max-w-[140px] truncate ${isActive ? 'border-[var(--c-brand)] text-[var(--c-ink)]' : 'border-gray-100'}`}>
                    {ev.title}
                  </div>
                </div>
              )}
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
