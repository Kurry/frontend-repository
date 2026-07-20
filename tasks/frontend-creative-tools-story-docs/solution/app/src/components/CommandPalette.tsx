import React, { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { useStore } from '@nanostores/react';
import {
  scenesStore,
  filterStatusStore,
  searchQueryStore,
  viewModeStore,
  ViewMode
} from '../store';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Small timeout to allow render before focusing
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown, true);
      return () => document.removeEventListener('keydown', handleKeyDown, true);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commands = [
    { id: 'view-tile', name: 'View: Tile Mode', action: () => viewModeStore.set('tile') },
    { id: 'view-list', name: 'View: List Mode', action: () => viewModeStore.set('list') },
    { id: 'view-slide', name: 'View: Slide Mode', action: () => viewModeStore.set('slide') },
    { id: 'view-canvas', name: 'View: Canvas Mode', action: () => viewModeStore.set('canvas') },
    { id: 'filter-all', name: 'Filter: Show All', action: () => filterStatusStore.set('all') },
    { id: 'filter-draft', name: 'Filter: Drafts', action: () => filterStatusStore.set('draft') },
    { id: 'filter-review', name: 'Filter: Review', action: () => filterStatusStore.set('review') },
    { id: 'filter-ready', name: 'Filter: Ready', action: () => filterStatusStore.set('ready') }
  ];

  const filteredCommands = commands.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-24">
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="w-full max-w-lg bg-white rounded-xl shadow-2xl flex flex-col focus:outline-none overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Command Palette"
      >
        <div className="flex items-center px-4 border-b border-gray-200">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            className="w-full py-4 px-3 outline-none text-lg bg-transparent"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Command palette input"
          />
        </div>

        <div className="max-h-96 overflow-y-auto">
          {filteredCommands.length > 0 ? (
            <ul className="p-2" role="listbox">
              {filteredCommands.map((cmd, i) => (
                <li key={cmd.id} role="option" aria-selected={i === 0}>
                  <button
                    className={`w-full text-left px-4 py-3 rounded-md text-sm transition-colors ${i === 0 ? 'bg-yellow-50 text-yellow-900' : 'hover:bg-gray-50'}`}
                    onClick={() => {
                      cmd.action();
                      onClose();
                    }}
                  >
                    {cmd.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No commands found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
