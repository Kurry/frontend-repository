import { createSignal, createEffect } from 'solid-js';
import { state, setState } from '../store';
import { MT_DATA } from '../data';
import { formatYear } from '../utils';

export default function Scrubber() {
  const handleFromChange = (e) => {
    let from = Number(e.target.value);
    let to = state.window.to;
    if (from >= to) from = to - 1;
    setState('window', 'from', Math.max(MT_DATA.yearMin, from));
  };

  const handleToChange = (e) => {
    let from = state.window.from;
    let to = Number(e.target.value);
    if (to <= from) to = from + 1;
    setState('window', 'to', Math.min(MT_DATA.yearMax, to));
  };

  const leftPct = () => ((state.window.from - MT_DATA.yearMin) / (MT_DATA.yearMax - MT_DATA.yearMin)) * 100;
  const rightPct = () => ((state.window.to - MT_DATA.yearMin) / (MT_DATA.yearMax - MT_DATA.yearMin)) * 100;

  return (
    <div class="relative w-full h-12 bg-gray-100 rounded flex items-center px-4 mt-4">
      <input 
        type="range" 
        min={MT_DATA.yearMin} 
        max={MT_DATA.yearMax} 
        value={state.window.from}
        onInput={handleFromChange}
        class="absolute w-full opacity-0 z-20 cursor-pointer pointer-events-auto h-full left-0 top-0" 
      />
      <input 
        type="range" 
        min={MT_DATA.yearMin} 
        max={MT_DATA.yearMax} 
        value={state.window.to}
        onInput={handleToChange}
        class="absolute w-full opacity-0 z-30 cursor-pointer pointer-events-auto h-full left-0 top-0" 
      />
      <div class="absolute left-0 right-0 h-2 bg-gray-300 rounded mx-4 pointer-events-none">
        <div class="absolute h-full bg-cyan-600 rounded" style={`left: ${leftPct()}%; width: ${Math.max(2, rightPct() - leftPct())}%`}></div>
      </div>
      <div class="flex justify-between w-full pointer-events-none z-10 font-mono text-sm">
        <span>{formatYear(state.window.from)}</span>
        <span>{formatYear(state.window.to)}</span>
      </div>
    </div>
  );
}
