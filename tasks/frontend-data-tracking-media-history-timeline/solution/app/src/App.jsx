import React, { useState, useEffect } from 'react';
import { MantineProvider } from '@mantine/core';
import { useAtomValue, useSetAtom, useAtom } from 'jotai';
import { modeAtom, selectedEventIdAtom, filteredEventsAtom, filterDrawerOpenAtom, aboutModalOpenAtom, exportDrawerOpenAtom, paperToneAtom, densityAtom } from './store.js';
import { Header } from './components/Header.jsx';
import { Timeline } from './components/Timeline.jsx';
import { Scrubber } from './components/Scrubber.jsx';
import { Library } from './components/Library.jsx';
import { EventForm } from './components/EventForm.jsx';
import { FiltersDrawer, AboutModal, ExportDrawer, DetailPanel } from './components/Overlays.jsx';
import { Toast } from './components/Toast.jsx';

export default function App() {
  const mode = useAtomValue(modeAtom);
  const selectedId = useAtomValue(selectedEventIdAtom);
  const filteredEvents = useAtomValue(filteredEventsAtom);
  const setSelectedId = useSetAtom(selectedEventIdAtom);
  const [filterOpen, setFilterOpen] = useAtom(filterDrawerOpenAtom);
  const [aboutOpen, setAboutOpen] = useAtom(aboutModalOpenAtom);
  const [exportOpen, setExportOpen] = useAtom(exportDrawerOpenAtom);

  const [editingEvent, setEditingEvent] = useState(null);

  const paperTone = useAtomValue(paperToneAtom);
  const density = useAtomValue(densityAtom);

  useEffect(() => {
    const tones = {
      warm: { '--c-paper': '#f7f3ea', '--c-paper-dark': '#efe8da', '--c-stage': '#efe9dc', '--c-stage-fade': '#faf7f0' },
      slate: { '--c-paper': '#e9edf2', '--c-paper-dark': '#dde3ea', '--c-stage': '#dbe2ea', '--c-stage-fade': '#f2f5f8' },
    };
    const root = document.documentElement;
    ['--c-paper', '--c-paper-dark', '--c-stage', '--c-stage-fade'].forEach(v => root.style.removeProperty(v));
    const vars = tones[paperTone];
    if (vars) Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
  }, [paperTone]);

  useEffect(() => {
    document.documentElement.dataset.density = density;
  }, [density]);

  useEffect(() => {
    if (mode !== 'library') setEditingEvent(null);
  }, [mode]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (aboutOpen) { setAboutOpen(false); return; }
        if (filterOpen) { setFilterOpen(false); return; }
        if (exportOpen) { setExportOpen(false); return; }
        setSelectedId(null);
      }
      if (mode === 'explore' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight') && selectedId && !aboutOpen && !filterOpen && !exportOpen) {
        const target = e.target;
        const isTyping = target instanceof HTMLElement && (
          target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
        );
        if (isTyping) return;

        const sorted = [...filteredEvents].sort((a, b) => a.year - b.year || a.title.localeCompare(b.title));
        const index = sorted.findIndex(event => event.id === selectedId);
        if (index === -1 || sorted.length === 0) return;
        const offset = e.key === 'ArrowLeft' ? -1 : 1;
        setSelectedId(sorted[(index + offset + sorted.length) % sorted.length].id);
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, aboutOpen, filterOpen, exportOpen, selectedId, filteredEvents, setAboutOpen, setFilterOpen, setExportOpen, setSelectedId]);

  return (
    <MantineProvider>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--c-paper)] text-[var(--c-ink)]">
        <Header historyDisabled={editingEvent !== null} />
        <main id="timeline-main" tabIndex={-1} className="flex-1 relative overflow-hidden flex flex-col">
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
        <Toast />
      </div>
    </MantineProvider>
  );
}
