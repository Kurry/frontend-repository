import React, { useEffect } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  modeAtom,
  filterDrawerOpenAtom,
  aboutModalOpenAtom,
  exportDrawerOpenAtom,
  undoHistoryAtom,
  redoHistoryAtom,
  undoAtom,
  redoAtom,
  resetFiltersAtom
} from '../store.js';
import { ActionIcon, Button, Group } from '@mantine/core';
import { IconFilter, IconInfoCircle, IconArrowBackUp, IconArrowForwardUp, IconDownload } from '@tabler/icons-react';
import { MT_DATA } from '../data.js';

export function Header() {
  const [mode, setMode] = useAtom(modeAtom);
  const setFilterOpen = useSetAtom(filterDrawerOpenAtom);
  const setAboutOpen = useSetAtom(aboutModalOpenAtom);
  const setExportOpen = useSetAtom(exportDrawerOpenAtom);

  const undoHistory = useAtomValue(undoHistoryAtom);
  const redoHistory = useAtomValue(redoHistoryAtom);
  const undo = useSetAtom(undoAtom);
  const redo = useSetAtom(redoAtom);
  const reset = useSetAtom(resetFiltersAtom);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return (
    <header className="h-[var(--h-header)] bg-white border-b border-gray-200 flex items-center justify-between px-4 z-[var(--z-header)] sticky top-0 shrink-0 shadow-sm">
      <button
        type="button"
        className="flex flex-col items-start text-left gap-0 focus-visible"
        onClick={() => {
          reset();
          setMode('explore');
        }}
        aria-label="MediaHistoryTimeline home"
      >
        <span className="font-serif font-bold text-xl leading-none">{MT_DATA.productName}</span>
        <span className="text-xs text-gray-500 font-medium">{MT_DATA.tagline}</span>
      </button>

      <Group gap="xs" wrap="nowrap">
        <Button
          variant="default"
          radius="xl"
          size="xs"
          onClick={() => {
            setMode('explore');
            // ensure full span
            window.dispatchEvent(new CustomEvent('full-span'));
          }}
          className="hidden sm:flex"
        >
          Full span
        </Button>
        <Button
          variant={mode === 'explore' ? 'filled' : 'light'}
          color="cyan"
          radius="xl"
          size="xs"
          onClick={() => setMode('explore')}
        >
          Explore
        </Button>
        <Button
          variant={mode === 'library' ? 'filled' : 'light'}
          color="cyan"
          radius="xl"
          size="xs"
          onClick={() => setMode('library')}
        >
          Library
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1 hidden sm:block"></div>

        <Button
          variant="default"
          radius="xl"
          size="xs"
          leftSection={<IconFilter size={14} />}
          onClick={() => setFilterOpen(o => !o)}
          className="hidden sm:flex"
        >
          Filters
        </Button>

        <ActionIcon
          variant="default"
          radius="xl"
          size="md"
          className="sm:hidden"
          onClick={() => setFilterOpen(o => !o)}
          aria-label="Filters"
        >
          <IconFilter size={16} />
        </ActionIcon>

        <ActionIcon
          variant="default"
          radius="xl"
          size="md"
          onClick={() => setAboutOpen(o => !o)}
          aria-label="About this timeline"
        >
          <IconInfoCircle size={16} />
        </ActionIcon>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        <ActionIcon
          variant="default"
          radius="xl"
          size="md"
          disabled={undoHistory.length === 0}
          onClick={undo}
          aria-label="Undo"
        >
          <IconArrowBackUp size={16} />
        </ActionIcon>

        <ActionIcon
          variant="default"
          radius="xl"
          size="md"
          disabled={redoHistory.length === 0}
          onClick={redo}
          aria-label="Redo"
        >
          <IconArrowForwardUp size={16} />
        </ActionIcon>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        <Button
          variant="outline"
          radius="xl"
          size="xs"
          color="cyan"
          leftSection={<IconDownload size={14} />}
          onClick={() => setExportOpen(true)}
          className="hidden sm:flex"
        >
          Export timeline
        </Button>
      </Group>
    </header>
  );
}
