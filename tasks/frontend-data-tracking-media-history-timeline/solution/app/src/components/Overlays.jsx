import React, { useState } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  filterDrawerOpenAtom, aboutModalOpenAtom, exportDrawerOpenAtom,
  activeCategoriesAtom, searchAtom, yearWindowAtom,
  eventsAtom, selectedEventIdAtom, filteredEventsAtom
} from '../store.js';
import { Drawer, Modal, Button, TextInput, Checkbox, Tabs, Textarea, ActionIcon, NumberInput } from '@mantine/core';
import { MT_DATA } from '../data.js';
import { IconCopy, IconArrowLeft, IconArrowRight, IconX } from '@tabler/icons-react';

function formatYear(y) {
  if (y < 1) return `${Math.abs(y)} BCE`;
  return `${y} CE`;
}

export function FiltersDrawer() {
  const [open, setOpen] = useAtom(filterDrawerOpenAtom);
  const [search, setSearch] = useAtom(searchAtom);
  const [activeCats, setActiveCats] = useAtom(activeCategoriesAtom);
  const [yearWindow, setYearWindow] = useAtom(yearWindowAtom);

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
            onChange={v => setYearWindow(prev => ({ ...prev, from: v || MT_DATA.yearMin }))}
            className="flex-1"
          />
          <NumberInput
            label="To year"
            value={yearWindow.to}
            onChange={v => setYearWindow(prev => ({ ...prev, to: v || MT_DATA.yearMax }))}
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
          <li>Use the dual-handle scrubber to set from / to years.</li>
          <li>Open Filters for categories, search, and exact year bounds.</li>
          <li>Click a pin for detail; use Previous / Next or ← / → among filtered events. Escape closes panels.</li>
        </ul>
        <h3 className="font-semibold text-base">Notes</h3>
        <p>Event text is illustrative for product density — not a scholarly corpus. Years before 1 CE use negative integers (e.g. −3200).</p>
      </div>
    </Modal>
  );
}

export function ExportDrawer() {
  const [open, setOpen] = useAtom(exportDrawerOpenAtom);
  const events = useAtomValue(eventsAtom);
  const yearWindow = useAtomValue(yearWindowAtom);
  const activeCats = useAtomValue(activeCategoriesAtom);
  const search = useAtomValue(searchAtom);
  const setEvents = useSetAtom(eventsAtom);

  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState("");
  const [importText, setImportText] = useState("");

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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleImport = () => {
    setImportError("");
    try {
      const data = JSON.parse(importText);
      if (data.document !== "media-history-timeline") {
        setImportError("document must be exactly media-history-timeline");
        return;
      }
      if (!data.events || !Array.isArray(data.events)) {
        setImportError("events array is missing");
        return;
      }
      if (data.events.length > 0) {
        const ev = data.events[0];
        if (!ev.type || !ev.timestamp || !ev.mediaRefs || !ev.detail) {
          setImportError("events entry missing required fields (type, timestamp, mediaRefs, detail)");
          return;
        }
      }

      const newEvents = data.events.map((e, i) => ({ ...e, id: `i_${Date.now()}_${i}` }));
      setEvents(newEvents);
      setImportText("");
      setOpen(false);
    } catch (e) {
      setImportError("Malformed JSON");
    }
  };

  return (
    <Drawer opened={open} onClose={() => setOpen(false)} title="Export timeline" position="right" zIndex={100} size="xl">
      <Tabs defaultValue="json">
        <Tabs.List>
          <Tabs.Tab value="json">Timeline JSON</Tabs.Tab>
          <Tabs.Tab value="csv">Events CSV</Tabs.Tab>
          <Tabs.Tab value="import">Import</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="json" pt="xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500">{events.length} events · {formatYear(Math.round(yearWindow.from))} to {formatYear(Math.round(yearWindow.to))}</span>
            <div className="flex gap-2">
              {copied && <span className="text-sm text-green-600 font-medium self-center" aria-live="polite">Copied</span>}
              <Button size="xs" variant="default" leftSection={<IconCopy size={14}/>} onClick={() => copyToClipboard(jsonString)}>Copy</Button>
              <Button size="xs" color="cyan" component="a" href={`data:text/json;charset=utf-8,${encodeURIComponent(jsonString)}`} download="timeline-pack.json">Download JSON</Button>
            </div>
          </div>
          <Textarea value={jsonString} readOnly minRows={20} maxRows={30} autosize styles={{ input: { fontFamily: 'monospace', fontSize: '12px' } }} />
        </Tabs.Panel>

        <Tabs.Panel value="csv" pt="xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500">Events CSV format</span>
            <div className="flex gap-2">
              {copied && <span className="text-sm text-green-600 font-medium self-center" aria-live="polite">Copied</span>}
              <Button size="xs" variant="default" leftSection={<IconCopy size={14}/>} onClick={() => copyToClipboard(csvString)}>Copy</Button>
              <Button size="xs" color="cyan" component="a" href={`data:text/csv;charset=utf-8,${encodeURIComponent(csvString)}`} download="timeline-events.csv">Download CSV</Button>
            </div>
          </div>
          <Textarea value={csvString} readOnly minRows={20} maxRows={30} autosize styles={{ input: { fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'pre' } }} wrap="off" />
        </Tabs.Panel>

        <Tabs.Panel value="import" pt="xs">
          <Textarea
            label="Paste Timeline JSON"
            placeholder='{"version":1,"document":"media-history-timeline",...}'
            minRows={10}
            autosize
            value={importText}
            onChange={e => setImportText(e.target.value)}
            error={importError}
          />
          {importError && <div className="text-sm text-red-600 mt-1" aria-live="polite">{importError}</div>}
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

  if (!selectedId) return null;

  const sortedEvents = [...events].sort((a, b) => a.year - b.year || a.title.localeCompare(b.title));
  const idx = sortedEvents.findIndex(e => e.id === selectedId);
  if (idx === -1) {
    setTimeout(() => setSelectedId(null), 0);
    return null;
  }

  const ev = sortedEvents[idx];

  const goPrev = () => {
    const nextIdx = (idx - 1 + sortedEvents.length) % sortedEvents.length;
    setSelectedId(sortedEvents[nextIdx].id);
  };

  const goNext = () => {
    const nextIdx = (idx + 1) % sortedEvents.length;
    setSelectedId(sortedEvents[nextIdx].id);
  };

  return (
    <div className="absolute top-0 right-0 w-80 h-full bg-white shadow-xl z-[var(--z-detail)] flex flex-col border-l border-gray-200">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center shrink-0">
        <ActionIcon variant="subtle" color="gray" onClick={() => setSelectedId(null)} aria-label="Close detail">
          <IconX size={20} />
        </ActionIcon>
        <div className="flex gap-2">
          <ActionIcon variant="default" onClick={goPrev} aria-label="Previous event"><IconArrowLeft size={16} /></ActionIcon>
          <ActionIcon variant="default" onClick={goNext} aria-label="Next event"><IconArrowRight size={16} /></ActionIcon>
        </div>
      </div>

      <div className="p-6 overflow-auto flex-1">
        <div className="text-xs font-semibold text-gray-500 tracking-wider uppercase mb-2">
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
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Media References</h4>
            <ul className="text-sm space-y-1 text-gray-600 list-disc pl-4">
              {ev.mediaRefs.map(r => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
