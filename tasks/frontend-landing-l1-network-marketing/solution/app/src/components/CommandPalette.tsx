import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { $commandPaletteOpen, $eventsManagerOpen, $exportCatalogOpen } from '../store';
import { MagnifyingGlass, ArrowUp, ArrowDown, X } from 'phosphor-react';

const destinations = [
  { id: 'marketing-home', label: 'Marketing Home', hint: 'g h', action: () => document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' }) },
  { id: 'events-manager', label: 'Events Manager', hint: 'g e', action: () => $eventsManagerOpen.set(true) },
  { id: 'global-events', label: 'Global Events', hint: 'g g', action: () => { $eventsManagerOpen.set(false); document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' }); } },
  { id: 'export-catalog', label: 'Export Catalog', hint: 'g x', action: () => $exportCatalogOpen.set(true) },
  { id: 'session-leads', label: 'Session Leads', hint: 'g l', action: () => document.getElementById('session-leads-section')?.scrollIntoView({ behavior: 'smooth' }) },
];

export default function CommandPalette() {
  const isOpen = useStore($commandPaletteOpen);
  const [closing, setClosing] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  const filtered = destinations.filter(d => d.label.toLowerCase().includes(query.toLowerCase()));
  const visible = isOpen || closing;

  const requestClose = () => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(() => {
      $commandPaletteOpen.set(false);
      setClosing(false);
      lastFocused.current?.focus({ preventScroll: true });
      lastFocused.current = null;
    }, 160);
  };

  useEffect(() => {
    if (isOpen) {
      lastFocused.current = document.activeElement as HTMLElement | null;
      setQuery('');
      setActiveIndex(0);
      const t = window.setTimeout(() => inputRef.current?.focus(), 60);
      return () => window.clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); requestClose(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(prev => filtered.length ? (prev + 1) % filtered.length : 0); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(prev => filtered.length ? (prev - 1 + filtered.length) % filtered.length : 0); }
      else if (e.key === 'Enter' && filtered.length > 0) { e.preventDefault(); filtered[activeIndex].action(); requestClose(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, activeIndex, closing]);

  // Reset active index when the filtered set changes.
  useEffect(() => { setActiveIndex(0); }, [query]);

  const trapFocus = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !dialogRef.current) return;
    const focusables = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('input, button, a[href], [tabindex]:not([tabindex="-1"])'))
      .filter(el => !el.hasAttribute('disabled') && el.tabIndex !== -1 && el.offsetParent !== null);
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement;
    if (!dialogRef.current.contains(active)) {
      e.preventDefault(); first.focus();
    } else if (e.shiftKey && active === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault(); first.focus();
    }
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-start justify-center pt-[18vh] px-4 bg-black/60 backdrop-blur-sm ${closing ? 'backdrop-out' : 'backdrop-in'}`}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onMouseDown={(e) => { if (e.target === e.currentTarget) requestClose(); }}
    >
      <div
        ref={dialogRef}
        onKeyDown={trapFocus}
        className={`surface-copy bg-surface w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-current/10 ${closing ? 'overlay-out' : 'overlay-in'}`}
      >
        <div className="flex items-center p-4 border-b border-white/10">
          <MagnifyingGlass size={20} className="opacity-70 mr-3" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={filtered.length > 0}
            aria-controls="palette-listbox"
            aria-autocomplete="list"
            aria-label="Search commands and destinations"
            className="w-full bg-transparent border-none outline-none text-lg text-current"
            placeholder="Jump to a destination…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button type="button" className="btn btn-ghost btn-xs btn-square text-current" onClick={requestClose} aria-label="Close command palette">
            <X size={16} />
          </button>
        </div>
        <ul id="palette-listbox" role="listbox" aria-label="Destinations" className="max-h-64 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <li className="px-4 py-3 opacity-60 text-center" role="presentation">No matching destinations</li>
          ) : (
            filtered.map((dest, i) => (
              <li key={dest.id} role="option" aria-selected={i === activeIndex} id={`palette-opt-${dest.id}`} className="px-2">
                <button
                  type="button"
                  tabIndex={-1}
                  aria-selected={i === activeIndex}
                  className={`palette-row w-full text-left px-3 py-3 rounded-md flex items-center justify-between gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] ${i === activeIndex ? '' : 'hover:bg-white/5'}`}
                  onClick={() => { dest.action(); requestClose(); }}
                  onMouseEnter={() => setActiveIndex(i)}
                >
                  <span>{dest.label}</span>
                  <kbd className="text-[10px] uppercase tracking-widest opacity-50">{dest.hint}</kbd>
                </button>
              </li>
            ))
          )}
        </ul>
        <div className="flex items-center gap-4 px-4 py-2 border-t border-current/10 text-[11px] opacity-60">
          <span className="flex items-center gap-1"><ArrowUp size={12} /><ArrowDown size={12} /> navigate</span>
          <span className="flex items-center gap-1">↵ select</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
