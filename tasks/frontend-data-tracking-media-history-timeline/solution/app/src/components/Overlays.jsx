import React, { useEffect, useState } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  filterDrawerOpenAtom, aboutModalOpenAtom, exportDrawerOpenAtom,
  activeCategoriesAtom, searchAtom, yearWindowAtom,
  eventsAtom, selectedEventIdAtom, filteredEventsAtom, importTimelineAtom, importDiagnosticAtom, resetFiltersAtom,
  exportDrawerTabAtom, sessionDefaultWindowAtom, saveSessionDefaultAtom, paperToneAtom, densityAtom
} from '../store.js';
import { Drawer, Modal, Button, TextInput, Checkbox, Tabs, Textarea, ActionIcon, NumberInput, Select } from '@mantine/core';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { MT_DATA } from '../data.js';
import { timelinePackSchema } from '../validation.js';
import { IconCopy, IconCheck, IconArrowLeft, IconArrowRight, IconX } from '@tabler/icons-react';

const timelineImportFormSchema = z.object({
  importText: z.string().min(1, 'Import document: Timeline JSON is required').transform((text, context) => {
    try {
      return JSON.parse(text);
    } catch {
      context.addIssue({ code: 'custom', message: 'Import document: malformed JSON' });
      return z.NEVER;
    }
  }).pipe(timelinePackSchema),
});

function formatYear(y) {
  if (y < 1) return `${Math.abs(y)} BCE`;
  return `${y} CE`;
}

function finiteNumber(value) {
  if (typeof value === 'string' && value.trim() === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function FiltersDrawer() {
  const [open, setOpen] = useAtom(filterDrawerOpenAtom);
  const [search, setSearch] = useAtom(searchAtom);
  const [activeCats, setActiveCats] = useAtom(activeCategoriesAtom);
  const [yearWindow, setYearWindow] = useAtom(yearWindowAtom);
  const resetFilters = useSetAtom(resetFiltersAtom);
  const [sessionDefault, setSessionDefault] = useAtom(sessionDefaultWindowAtom);
  const saveDefault = useSetAtom(saveSessionDefaultAtom);
  const [paperTone, setPaperTone] = useAtom(paperToneAtom);
  const [density, setDensity] = useAtom(densityAtom);

  const toggleCat = (id) => {
    const next = new Set(activeCats);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setActiveCats(next);
  };

  return (
    <Drawer opened={open} onClose={() => setOpen(false)} title="Filters" position="right" zIndex={100} size="sm">
      <div className="space-y-6 pb-6">
        <TextInput
          label="Search"
          placeholder="Search titles, places, summaries…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search events"
        />

        <div className="flex gap-4">
          <NumberInput
            label="From year"
            value={yearWindow.from}
            min={MT_DATA.yearMin}
            max={yearWindow.to - 50}
            onChange={v => {
              const next = finiteNumber(v);
              if (next !== null) setYearWindow(prev => ({ ...prev, from: Math.min(next, prev.to - 50) }));
            }}
            className="flex-1"
          />
          <NumberInput
            label="To year"
            value={yearWindow.to}
            min={yearWindow.from + 50}
            max={MT_DATA.yearMax}
            onChange={v => {
              const next = finiteNumber(v);
              if (next !== null) setYearWindow(prev => ({ ...prev, to: Math.max(next, prev.from + 50) }));
            }}
            className="flex-1"
          />
        </div>

        <div>
          <div className="text-sm font-medium mb-2">Categories</div>
          <div className="flex flex-col gap-2">
            {MT_DATA.categories.map(cat => (
              <Checkbox
                key={cat.id}
                label={cat.label}
                checked={activeCats.has(cat.id)}
                onChange={() => toggleCat(cat.id)}
                color="cyan"
              />
            ))}
          </div>
        </div>
        <Button variant="outline" color="cyan" fullWidth onClick={() => resetFilters()}>Reset filters</Button>

        <div className="pt-4 border-t border-gray-100">
          <div className="text-sm font-medium mb-1">My default window</div>
          <p className="text-xs text-gray-500 mb-2">
            {sessionDefault
              ? `${formatYear(sessionDefault.from)} – ${formatYear(sessionDefault.to)} (saved this session)`
              : 'None saved yet — remembered for this session only.'}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="default" size="xs" onClick={() => saveDefault()}>Save current window as default</Button>
            <Button variant="default" size="xs" disabled={!sessionDefault} onClick={() => sessionDefault && setYearWindow({ ...sessionDefault })}>Apply my default</Button>
            <Button variant="subtle" size="xs" disabled={!sessionDefault} onClick={() => setSessionDefault(null)}>Clear</Button>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <div className="text-sm font-medium mb-2">Atmosphere & density</div>
          <div className="flex flex-col gap-3">
            <Select
              label="Paper tone"
              data={[
                { value: 'cool', label: 'Cool paper' },
                { value: 'warm', label: 'Warm paper' },
                { value: 'slate', label: 'Slate paper' },
              ]}
              value={paperTone}
              onChange={v => setPaperTone(v || 'cool')}
            />
            <Select
              label="Row density"
              data={[
                { value: 'cozy', label: 'Cozy rows' },
                { value: 'compact', label: 'Compact rows' },
              ]}
              value={density}
              onChange={v => setDensity(v || 'cozy')}
            />
          </div>
        </div>
      </div>
    </Drawer>
  );
}

export function AboutModal() {
  const [open, setOpen] = useAtom(aboutModalOpenAtom);
  return (
    <Modal opened={open} onClose={() => setOpen(false)} title="About MediaHistoryTimeline" zIndex={101} centered>
      <div className="space-y-4 text-sm">
        <p>A frontend-only explorer for milestones in media and communication — writing systems, print, telecom, broadcast, and networked platforms.</p>
        <h3 className="font-semibold text-base">How to explore</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Drag the stage to pan event pins along the axis.</li>
          <li>Scroll to zoom the year window; hold Shift (or use horizontal scroll) to scrub time.</li>
          <li>Use the dual-handle scrubber to set from / to years; Full span fits the whole corpus.</li>
          <li>Click a pin for detail; use Previous / Next or ← / → among filtered events. Escape closes panels.</li>
        </ul>
        <h3 className="font-semibold text-base">How to filter</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Toggle any of the twelve categories — an event shows when at least one of its categories is active.</li>
          <li>Type in Search to match titles, places, summaries, and details live.</li>
          <li>Set exact From / To years, or drag the scrubber; the stage, Library, and category tally recompute together.</li>
          <li>Reset filters restores every category, clears the search, and returns to the default year window.</li>
        </ul>
        <h3 className="font-semibold text-base">Keyboard</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Focus the stage, then use ← / → to pan the year window and + / − to zoom.</li>
          <li>Ctrl/Cmd+Z undoes and Ctrl/Cmd+Shift+Z redoes the last mutation.</li>
        </ul>
        <h3 className="font-semibold text-base">Make it yours</h3>
        <p>Save the current window as your session default and apply it any time, or switch paper tone and row density under Filters — remembered for this session only.</p>
        <h3 className="font-semibold text-base">Notes</h3>
        <p>Event text is illustrative for product density — not a scholarly corpus. Years before 1 CE use negative integers (e.g. −3200).</p>
      </div>
    </Modal>
  );
}

export function ExportDrawer() {
  const [open, setOpen] = useAtom(exportDrawerOpenAtom);
  const [activeTab, setActiveTab] = useAtom(exportDrawerTabAtom);
  const events = useAtomValue(eventsAtom);
  const yearWindow = useAtomValue(yearWindowAtom);
  const activeCats = useAtomValue(activeCategoriesAtom);
  const search = useAtomValue(searchAtom);
  const importTimeline = useSetAtom(importTimelineAtom);

  const [copyStatus, setCopyStatus] = useState(null);
  const [importError, setImportError] = useAtom(importDiagnosticAtom);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors: importErrors },
  } = useForm({
    resolver: zodResolver(timelineImportFormSchema),
    mode: 'onChange',
    defaultValues: { importText: '' },
  });
  const importText = watch('importText');

  const tally = {};
  MT_DATA.categories.forEach(c => { tally[c.id] = 0; });
  events.forEach(ev => {
    ev.categories.forEach(c => {
      if (tally[c] !== undefined) tally[c]++;
    });
  });

  const exportJSON = {
    version: 1,
    document: "media-history-timeline",
    yearWindow,
    activeCategories: Array.from(activeCats),
    search,
    events: events.map(e => ({
      title: e.title,
      type: e.type,
      timestamp: e.timestamp,
      mediaRefs: e.mediaRefs,
      year: e.year,
      place: e.place,
      categories: e.categories,
      summary: e.summary,
      detail: e.detail
    })),
    totals: {
      eventCount: events.length,
      byCategory: MT_DATA.categories.map(c => ({ category: c.id, count: tally[c.id] }))
    }
  };

  const jsonString = JSON.stringify(exportJSON, null, 2);

  const csvHeaders = ["title", "type", "timestamp", "mediaRefs", "year", "place", "categories", "summary", "detail"];
  const csvRows = events.map(e => {
    return [
      `"${e.title.replace(/"/g, '""')}"`,
      `"${e.type}"`,
      `"${e.timestamp}"`,
      `"${e.mediaRefs.join(';')}"`,
      e.year,
      `"${e.place.replace(/"/g, '""')}"`,
      `"${e.categories.join('|')}"`,
      `"${e.summary.replace(/"/g, '""')}"`,
      `"${e.detail.replace(/"/g, '""')}"`
    ].join(',');
  });
  const csvString = [csvHeaders.join(','), ...csvRows].join('\n');

  const copyToClipboard = async (text) => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      ok = false;
    }
    if (!ok) {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ok = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
    }
    setCopyStatus(ok ? 'copied' : 'failed');
    window.setTimeout(() => setCopyStatus(null), 2500);
  };

  const handleImport = handleSubmit(({ importText: data }) => {
    setImportError("");
    const newEvents = data.events.map((e, i) => ({ ...e, id: `i_${Date.now()}_${i}` }));
    importTimeline({
      events: newEvents,
      yearWindow: data.yearWindow,
      activeCategories: new Set(data.activeCategories),
      search: data.search,
    });
    reset({ importText: '' });
    setOpen(false);
  }, (errors) => {
    setImportError(errors.importText?.message || 'Import document: invalid Timeline JSON');
  });

  const handleImportFile = async (event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    try {
      setValue('importText', await file.text(), { shouldDirty: true, shouldValidate: true });
      setImportError("");
    } catch {
      setImportError("Import document: unable to read file");
    } finally {
      input.value = "";
    }
  };

  return (
    <Drawer opened={open} onClose={() => setOpen(false)} title={activeTab === 'import' ? 'Import timeline' : 'Export timeline'} position="right" zIndex={100} size="xl">
      <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'json')}>
        <Tabs.List>
          <Tabs.Tab value="json">Timeline JSON</Tabs.Tab>
          <Tabs.Tab value="csv">Events CSV</Tabs.Tab>
          <Tabs.Tab value="import">Import</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="json" pt="xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500">{events.length} events · {formatYear(Math.round(yearWindow.from))} to {formatYear(Math.round(yearWindow.to))}</span>
            <div className="flex gap-2">
              <span className="text-sm font-medium self-center min-h-[1.25rem]" aria-live="polite">
                <AnimatePresence>
                  {copyStatus && (
                    <motion.span
                      key={copyStatus}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.18 }}
                      className={copyStatus === 'copied' ? 'text-green-600' : 'text-red-600'}
                    >
                      {copyStatus === 'copied' ? 'Copied' : 'Copy failed'}
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
              <Button size="xs" variant="default" leftSection={copyStatus === 'copied' ? <IconCheck size={14} aria-hidden /> : <IconCopy size={14} aria-hidden />} onClick={() => copyToClipboard(jsonString)}>{copyStatus === 'copied' ? 'Copied' : 'Copy'}</Button>
              <Button size="xs" color="cyan" component="a" href={`data:text/json;charset=utf-8,${encodeURIComponent(jsonString)}`} download="timeline-pack.json">Download JSON</Button>
            </div>
          </div>
          <Textarea value={jsonString} readOnly minRows={20} maxRows={30} autosize styles={{ input: { fontFamily: 'monospace', fontSize: '12px' } }} />
        </Tabs.Panel>

        <Tabs.Panel value="csv" pt="xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500">Events CSV format</span>
            <div className="flex gap-2">
              <span className="text-sm font-medium self-center min-h-[1.25rem]" aria-live="polite">
                <AnimatePresence>
                  {copyStatus && (
                    <motion.span
                      key={copyStatus}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.18 }}
                      className={copyStatus === 'copied' ? 'text-green-600' : 'text-red-600'}
                    >
                      {copyStatus === 'copied' ? 'Copied' : 'Copy failed'}
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
              <Button size="xs" variant="default" leftSection={copyStatus === 'copied' ? <IconCheck size={14} aria-hidden /> : <IconCopy size={14} aria-hidden />} onClick={() => copyToClipboard(csvString)}>{copyStatus === 'copied' ? 'Copied' : 'Copy'}</Button>
              <Button size="xs" color="cyan" component="a" href={`data:text/csv;charset=utf-8,${encodeURIComponent(csvString)}`} download="timeline-events.csv">Download CSV</Button>
            </div>
          </div>
          <Textarea value={csvString} readOnly minRows={20} maxRows={30} autosize styles={{ input: { fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'pre' } }} wrap="off" />
        </Tabs.Panel>

        <Tabs.Panel value="import" pt="xs">
          <input
            id="import-file-input"
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={handleImportFile}
            aria-label="Choose Timeline JSON file"
          />
          <label
            htmlFor="import-file-input"
            className="inline-flex items-center justify-center h-9 px-3 rounded-lg border border-gray-300 bg-white text-sm font-medium cursor-pointer select-none hover:bg-gray-50 hover:border-gray-400 active:scale-[0.98] transition mb-3"
          >
            Choose Timeline JSON file
          </label>
          <Textarea
            label="Paste Timeline JSON"
            placeholder='{"version":1,"document":"media-history-timeline",...}'
            minRows={10}
            autosize
            {...register('importText')}
            error={importError || importErrors.importText?.message}
          />
          <div className="text-sm text-red-600 mt-1" role="alert" aria-live="assertive">
            <AnimatePresence>
              {importError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                >
                  {importError}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="mt-4">
            <Button color="cyan" onClick={handleImport} disabled={!importText.trim()}>Import timeline</Button>
          </div>
        </Tabs.Panel>
      </Tabs>
    </Drawer>
  );
}

export function DetailPanel() {
  const [selectedId, setSelectedId] = useAtom(selectedEventIdAtom);
  const events = useAtomValue(filteredEventsAtom);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (selectedId && !events.some(event => event.id === selectedId)) setSelectedId(null);
  }, [events, selectedId, setSelectedId]);

  const sortedEvents = [...events].sort((a, b) => a.year - b.year || a.title.localeCompare(b.title));
  const idx = sortedEvents.findIndex(e => e.id === selectedId);
  const ev = idx === -1 ? null : sortedEvents[idx];

  const goPrev = () => {
    if (!ev) return;
    const nextIdx = (idx - 1 + sortedEvents.length) % sortedEvents.length;
    setSelectedId(sortedEvents[nextIdx].id);
  };

  const goNext = () => {
    if (!ev) return;
    const nextIdx = (idx + 1) % sortedEvents.length;
    setSelectedId(sortedEvents[nextIdx].id);
  };

  return (
    <AnimatePresence>
      {ev && (
    <motion.aside
      key={ev.id}
      initial={reduceMotion ? false : { opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 24 }}
      transition={{ duration: reduceMotion ? 0.01 : 0.2, ease: 'easeOut' }}
      className="absolute top-0 right-0 w-80 h-full bg-white shadow-xl z-[var(--z-detail)] flex flex-col border-l border-gray-200"
    >
      <div className="p-4 border-b border-gray-100 flex justify-between items-center shrink-0">
        <ActionIcon variant="subtle" color="gray" onClick={() => setSelectedId(null)} aria-label="Close detail">
          <IconX size={20} aria-hidden />
        </ActionIcon>
        <div className="flex gap-2">
          <ActionIcon variant="default" onClick={goPrev} aria-label="Previous event"><IconArrowLeft size={16} aria-hidden /></ActionIcon>
          <ActionIcon variant="default" onClick={goNext} aria-label="Next event"><IconArrowRight size={16} aria-hidden /></ActionIcon>
        </div>
      </div>

      <div className="p-6 overflow-auto flex-1">
        <div className="text-xs font-semibold text-gray-500 tracking-wide mb-2">
          {formatYear(ev.year)} · {ev.place}
        </div>
        <h2 className="font-serif font-bold text-2xl leading-tight mb-2">{ev.title}</h2>
        <div className="text-sm font-medium text-cyan-700 mb-4">{ev.type}</div>

        <div className="flex flex-wrap gap-1 mb-6">
          {ev.categories.map(cId => {
            const cat = MT_DATA.categories.find(c => c.id === cId);
            if (!cat) return null;
            return (
              <span key={cat.id} className="text-xs px-2 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: cat.color }}>
                {cat.label}
              </span>
            );
          })}
        </div>

        <p className="text-lg leading-relaxed text-gray-800 font-medium mb-6">{ev.summary}</p>
        <p className="text-sm text-gray-600 whitespace-pre-wrap">{ev.detail}</p>

        {ev.mediaRefs && ev.mediaRefs.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 mb-3">Media references</h3>
            <ul className="text-sm space-y-1 text-gray-600 list-disc pl-4">
              {ev.mediaRefs.map(r => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.aside>
      )}
    </AnimatePresence>
  );
}
