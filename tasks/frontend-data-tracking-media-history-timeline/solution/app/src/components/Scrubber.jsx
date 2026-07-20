import React from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { yearWindowAtom, filteredEventsAtom } from '../store.js';
import { MT_DATA } from '../data.js';
import { RangeSlider } from '@mantine/core';

function formatYear(y) {
  if (y < 1) return `${Math.abs(y)} BCE`;
  return `${y} CE`;
}

export function Scrubber() {
  const [yearWindow, setYearWindow] = useAtom(yearWindowAtom);
  const events = useAtomValue(filteredEventsAtom);

  const handleChange = (val) => {
    let from = val[0];
    let to = val[1];
    if (to - from < 50) {
      if (to === MT_DATA.yearMax) from = to - 50;
      else to = from + 50;
    }
    setYearWindow({ from, to });
  };

  return (
    <footer className="h-[var(--h-scrubber)] bg-white border-t border-gray-200 px-6 py-2 flex flex-col justify-center shrink-0 z-[var(--z-scrubber)] shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
      <div className="flex justify-between items-end mb-1">
        <div className="text-sm font-bold font-serif">
          {formatYear(Math.round(yearWindow.from))} — {formatYear(Math.round(yearWindow.to))}
        </div>
        <div className="text-xs text-gray-500 font-medium">
          {events.length} events in view
        </div>
      </div>
      <div className="px-2">
        <RangeSlider
          min={MT_DATA.yearMin}
          max={MT_DATA.yearMax}
          minRange={50}
          value={[Math.round(yearWindow.from), Math.round(yearWindow.to)]}
          onChange={handleChange}
          label={null}
          color="cyan"
          size="sm"
          thumbSize={20}
          aria-label="Year range scrubber"
        />
      </div>
    </footer>
  );
}
