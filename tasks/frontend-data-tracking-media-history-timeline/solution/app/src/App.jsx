import React, { useState, useEffect } from 'react';
import { MantineProvider } from '@mantine/core';
import { useAtomValue, useSetAtom, useAtom } from 'jotai';
import { modeAtom, selectedEventIdAtom, filterDrawerOpenAtom, aboutModalOpenAtom, exportDrawerOpenAtom, resetFiltersAtom } from './store.js';
import { Header } from './components/Header.jsx';
import { Timeline } from './components/Timeline.jsx';
import { Scrubber } from './components/Scrubber.jsx';
import { Library } from './components/Library.jsx';
import { EventForm } from './components/EventForm.jsx';
import { FiltersDrawer, AboutModal, ExportDrawer, DetailPanel } from './components/Overlays.jsx';

export default function App() {
  const mode = useAtomValue(modeAtom);
  const setSelectedId = useSetAtom(selectedEventIdAtom);
  const [filterOpen, setFilterOpen] = useAtom(filterDrawerOpenAtom);
  const [aboutOpen, setAboutOpen] = useAtom(aboutModalOpenAtom);
  const [exportOpen, setExportOpen] = useAtom(exportDrawerOpenAtom);
  const resetFilters = useSetAtom(resetFiltersAtom);

  const [editingEvent, setEditingEvent] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (aboutOpen) { setAboutOpen(false); return; }
        if (filterOpen) { setFilterOpen(false); return; }
        if (exportOpen) { setExportOpen(false); return; }
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [aboutOpen, filterOpen, exportOpen, setAboutOpen, setFilterOpen, setExportOpen, setSelectedId]);

  useEffect(() => {
    const handleReset = () => resetFilters();
    window.addEventListener('reset-filters', handleReset);
    return () => window.removeEventListener('reset-filters', handleReset);
  }, [resetFilters]);

  return (
    <MantineProvider>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--c-paper)] text-[var(--c-ink)]">
        <Header />
        <main className="flex-1 relative overflow-hidden flex flex-col">
          {mode === 'explore' && <Timeline />}
          {mode === 'library' && (
             editingEvent !== null
             ? <EventForm initialData={editingEvent} onClose={() => setEditingEvent(null)} />
             : <Library onEdit={ev => setEditingEvent(ev ? ev : 'new')} />
          )}
          {mode === 'explore' && <DetailPanel />}
        </main>
        {mode === 'explore' && <Scrubber />}

        <FiltersDrawer />
        <AboutModal />
        <ExportDrawer />
      </div>
    </MantineProvider>
  );
}
