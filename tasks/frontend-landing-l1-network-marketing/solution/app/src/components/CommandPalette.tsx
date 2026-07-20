import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { $commandPaletteOpen, $eventsManagerOpen, $exportCatalogOpen } from '../store';
import { MagnifyingGlass } from 'phosphor-react';

const destinations = [
  { id: 'marketing-home', label: 'Marketing Home', action: () => document.getElementById('chrome')?.scrollIntoView({ behavior: 'smooth' }) },
  { id: 'events-manager', label: 'Events Manager', action: () => $eventsManagerOpen.set(true) },
  { id: 'global-events', label: 'Global Events', action: () => { $eventsManagerOpen.set(false); document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' }) } },
  { id: 'export-catalog', label: 'Export Catalog', action: () => $exportCatalogOpen.set(true) },
  { id: 'session-leads', label: 'Session Leads', action: () => document.getElementById('session-leads-section')?.scrollIntoView({ behavior: 'smooth' }) },
];

export default function CommandPalette() {
  const isOpen = useStore($commandPaletteOpen);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = destinations.filter(d => d.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setActiveIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        $commandPaletteOpen.set(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter' && filtered.length > 0) {
        e.preventDefault();
        filtered[activeIndex].action();
        $commandPaletteOpen.set(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, activeIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm transition-opacity" role="dialog" aria-modal="true">
      <div className="bg-surface w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-white/10 mx-4">
        <div className="flex items-center p-4 border-b border-white/10">
          <MagnifyingGlass size={20} className="text-gray-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent border-none outline-none text-lg text-current"
            placeholder="Search commands..."
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIndex(0); }}
          />
        </div>
        <ul className="max-h-64 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-gray-500 text-center">No results found</li>
          ) : (
            filtered.map((dest, i) => (
              <li key={dest.id}>
                <button
                  type="button"
                  className={`w-full text-left px-4 py-3 transition-colors focus:outline-none ${i === activeIndex ? 'bg-accent/20 text-accent font-medium' : 'hover:bg-white/5'}`}
                  onClick={() => { dest.action(); $commandPaletteOpen.set(false); }}
                  onMouseEnter={() => setActiveIndex(i)}
                >
                  {dest.label}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
