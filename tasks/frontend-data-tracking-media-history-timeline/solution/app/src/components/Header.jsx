import React, { useEffect } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  modeAtom,
  filterDrawerOpenAtom,
  aboutModalOpenAtom,
  exportDrawerOpenAtom,
  exportDrawerTabAtom,
  undoHistoryAtom,
  redoHistoryAtom,
  undoAtom,
  redoAtom,
  resetFiltersAtom,
  fullSpanAtom
} from '../store.js';
import { ActionIcon, Button, Group } from '@mantine/core';
import { IconFilter, IconInfoCircle, IconArrowBackUp, IconArrowForwardUp, IconDownload, IconUpload, IconArrowsHorizontal } from '@tabler/icons-react';
import { MT_DATA } from '../data.js';

export function Header({ historyDisabled = false }) {
  const [mode, setMode] = useAtom(modeAtom);
  const [filterOpen, setFilterOpen] = useAtom(filterDrawerOpenAtom);
  const [aboutOpen, setAboutOpen] = useAtom(aboutModalOpenAtom);
  const exportOpen = useAtomValue(exportDrawerOpenAtom);
  const setExportOpen = useSetAtom(exportDrawerOpenAtom);
  const setExportTab = useSetAtom(exportDrawerTabAtom);

  const undoHistory = useAtomValue(undoHistoryAtom);
  const redoHistory = useAtomValue(redoHistoryAtom);
  const undo = useSetAtom(undoAtom);
  const redo = useSetAtom(redoAtom);
  const reset = useSetAtom(resetFiltersAtom);
  const fullSpan = useSetAtom(fullSpanAtom);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const target = e.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target?.isContentEditable) return;
      if (filterOpen || aboutOpen || exportOpen) return;
      if (historyDisabled) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [aboutOpen, exportOpen, filterOpen, historyDisabled, undo, redo]);

  return (
    <header className="h-[var(--h-header)] bg-white border-b border-gray-200 flex items-center justify-between px-4 z-[var(--z-header)] sticky top-0 shrink-0 shadow-sm">
      <h1 className="m-0 shrink min-w-0">
        <button
          type="button"
          className="flex flex-col items-start text-left gap-0 focus-visible max-w-full"
          onClick={() => {
            reset();
            setMode('explore');
          }}
          aria-label="MediaHistoryTimeline home"
        >
          <span className="font-serif font-bold text-base sm:text-xl leading-none truncate">{MT_DATA.productName}</span>
          <span className="hidden sm:inline text-xs text-gray-500 font-medium truncate">{MT_DATA.tagline}</span>
        </button>
      </h1>

      <Group gap="xs" wrap="nowrap">
        <Button
          variant="default"
          radius="xl"
          size="xs"
          onClick={() => {
            setMode('explore');
            fullSpan();
          }}
          className="hidden sm:flex"
        >
          Full span
        </Button>
        <ActionIcon
          variant="default"
          radius="xl"
          size="lg"
          className="sm:hidden"
          onClick={() => {
            setMode('explore');
            fullSpan();
          }}
          aria-label="Fit full span"
        >
          <IconArrowsHorizontal size={18} aria-hidden />
        </ActionIcon>
        <Button
          variant={mode === 'explore' ? 'filled' : 'light'}
          color="cyan"
          radius="xl"
          size="xs"
          onClick={() => setMode('explore')}
          aria-pressed={mode === 'explore'}
        >
          Explore
        </Button>
        <Button
          variant={mode === 'library' ? 'filled' : 'light'}
          color="cyan"
          radius="xl"
          size="xs"
          onClick={() => setMode('library')}
          aria-pressed={mode === 'library'}
        >
          Library
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1 hidden sm:block"></div>

        <Button
          variant="default"
          radius="xl"
          size="xs"
          leftSection={<IconFilter size={14} aria-hidden />}
          onClick={() => setFilterOpen(o => !o)}
          className="hidden sm:flex"
          aria-expanded={filterOpen}
        >
          Filters
        </Button>

        <ActionIcon
          variant="default"
          radius="xl"
          size="lg"
          className="sm:hidden"
          onClick={() => setFilterOpen(o => !o)}
          aria-label="Filters"
          aria-expanded={filterOpen}
        >
          <IconFilter size={16} aria-hidden />
        </ActionIcon>

        <ActionIcon
          variant="default"
          radius="xl"
          size="md"
          onClick={() => setAboutOpen(o => !o)}
          aria-label="About this timeline"
          aria-expanded={aboutOpen}
        >
          <IconInfoCircle size={16} aria-hidden />
        </ActionIcon>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        <ActionIcon
          variant="default"
          radius="xl"
          size="md"
          disabled={historyDisabled || undoHistory.length === 0}
          onClick={undo}
          aria-label="Undo"
        >
          <IconArrowBackUp size={16} aria-hidden />
        </ActionIcon>

        <ActionIcon
          variant="default"
          radius="xl"
          size="md"
          disabled={historyDisabled || redoHistory.length === 0}
          onClick={redo}
          aria-label="Redo"
        >
          <IconArrowForwardUp size={16} aria-hidden />
        </ActionIcon>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        <Button
          variant="outline"
          radius="xl"
          size="xs"
          color="cyan"
          leftSection={<IconUpload size={14} aria-hidden />}
          onClick={() => {
            setExportTab('import');
            setExportOpen(true);
          }}
          className="hidden sm:flex"
        >
          Import timeline
        </Button>
        <ActionIcon
          variant="outline"
          radius="xl"
          size="md"
          color="cyan"
          onClick={() => {
            setExportTab('import');
            setExportOpen(true);
          }}
          className="sm:hidden"
          aria-label="Import timeline"
        >
          <IconUpload size={16} aria-hidden />
        </ActionIcon>

        <Button
          variant="outline"
          radius="xl"
          size="xs"
          color="cyan"
          leftSection={<IconDownload size={14} aria-hidden />}
          onClick={() => {
            setExportTab('json');
            setExportOpen(true);
          }}
          className="hidden sm:flex"
        >
          Export timeline
        </Button>
        <ActionIcon
          variant="outline"
          radius="xl"
          size="md"
          color="cyan"
          onClick={() => {
            setExportTab('json');
            setExportOpen(true);
          }}
          className="sm:hidden"
          aria-label="Export timeline"
        >
          <IconDownload size={16} aria-hidden />
        </ActionIcon>
      </Group>
    </header>
  );
}
