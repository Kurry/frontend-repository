import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { isCommandPaletteOpenStore, isExportDrawerOpenStore, showToast } from '@/store/ui';
import { viewModeStore, undo, redo } from '@/store';
import { clsx } from 'clsx';

const commands = [
    { id: 'add-scene', label: 'Add Scene', action: () => showToast('Use Add Scene button on board') },
    { id: 'export', label: 'Export storyboard', action: () => isExportDrawerOpenStore.set(true) },
    { id: 'mode-tile', label: 'Switch to Tile', action: () => viewModeStore.set('tile') },
    { id: 'mode-list', label: 'Switch to List', action: () => viewModeStore.set('list') },
    { id: 'mode-slide', label: 'Switch to Slide', action: () => viewModeStore.set('slide') },
    { id: 'undo', label: 'Undo', action: () => undo() },
    { id: 'redo', label: 'Redo', action: () => redo() }
];

export function CommandPalette() {
    const isOpen = useStore(isCommandPaletteOpenStore);
    const [search, setSearch] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const filteredCommands = commands.filter(c => c.label.toLowerCase().includes(search.toLowerCase()));

    useEffect(() => {
        if (isOpen) {
            setSearch('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'Escape') {
                isCommandPaletteOpenStore.set(false);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
            } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
                e.preventDefault();
                filteredCommands[selectedIndex].action();
                isCommandPaletteOpenStore.set(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filteredCommands, selectedIndex]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] overflow-y-auto p-4 sm:p-6 md:p-20 flex items-start justify-center" role="dialog" aria-modal="true" aria-label="Command Palette">
            <div className="fixed inset-0 bg-gray-500/50 transition-opacity" aria-hidden="true" onClick={() => isCommandPaletteOpenStore.set(false)}></div>
            <div className="relative mx-auto max-w-xl w-full transform divide-y divide-gray-100 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/5 transition-all animate-fade-in-up">
                <div className="relative">
                    <svg className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm outline-none"
                        placeholder="Search commands..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setSelectedIndex(0); }}
                        aria-label="Search commands"
                    />
                </div>

                {filteredCommands.length > 0 ? (
                    <ul className="max-h-96 scroll-py-3 overflow-y-auto p-3" role="listbox">
                        {filteredCommands.map((command, idx) => (
                            <li
                                key={command.id}
                                className={clsx(
                                    "group flex cursor-default select-none rounded-xl p-3",
                                    idx === selectedIndex ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                )}
                                id={`option-${idx}`}
                                role="option"
                                aria-selected={idx === selectedIndex}
                                onClick={() => {
                                    command.action();
                                    isCommandPaletteOpenStore.set(false);
                                }}
                            >
                                <span className="ml-3 flex-auto truncate">{command.label}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="p-6 text-center text-sm text-gray-500">No commands found.</div>
                )}
            </div>
        </div>
    );
}
