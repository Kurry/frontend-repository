import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { $exportCatalogOpen, $events, $leads, $theme, loadCatalog } from '../store';
import { X, Copy, Download, UploadSimple } from 'phosphor-react';

export default function ExportCatalog() {
  const isOpen = useStore($exportCatalogOpen);
  const events = useStore($events);
  const leads = useStore($leads);
  const theme = useStore($theme);

  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedIcs, setCopiedIcs] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => firstFocusRef.current?.focus(), 100);
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') $exportCatalogOpen.set(false);
      };
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const jsonPayload = JSON.stringify({
    version: 1,
    theme,
    counts: {
      events: events.length,
      leads: leads.length,
      upcoming: events.filter(e => e.status === 'upcoming').length,
      featured: events.filter(e => e.status === 'featured').length,
      past: events.filter(e => e.status === 'past').length
    },
    events,
    leads
  }, null, 2);

  const icsPayload = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ridge//Events//EN',
    ...events.map(e => [
      'BEGIN:VEVENT',
      `UID:${e.id}@ridge`,
      `DTSTART:${e.date.replace(/-/g, '')}T000000Z`,
      `SUMMARY:${e.title}`,
      `LOCATION:${e.city}`,
      `DESCRIPTION:${e.category} - ${e.status}`,
      'END:VEVENT'
    ].join('\r\n')),
    'END:VCALENDAR'
  ].join('\r\n');

  const copyText = async (text: string, setter: (val: boolean) => void) => {
    await navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 3000);
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const success = loadCatalog(content);
      if (success) {
        setImportSuccess("Catalog loaded successfully");
        setImportError(null);
        setTimeout(() => setImportSuccess(null), 5000);
      } else {
        setImportError("Invalid catalog format");
        setImportSuccess(null);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity" role="dialog" aria-modal="true">
      <div className="bg-surface w-full max-w-5xl h-[85vh] rounded-xl shadow-2xl flex flex-col border border-white/10 overflow-hidden">

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-void/50">
          <h2 className="text-2xl font-bold display-font">Export Catalog</h2>
          <button ref={firstFocusRef} className="btn btn-square btn-ghost text-current" onClick={() => $exportCatalogOpen.set(false)} aria-label="Close Export Catalog">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-void">

          {/* JSON Preview */}
          <div className="flex flex-col h-full gap-4">
            <div className="flex justify-between items-end">
              <h3 className="font-bold text-lg">JSON Export</h3>
              <div className="flex gap-2">
                <button className="btn btn-sm btn-ghost gap-2" onClick={() => copyText(jsonPayload, setCopiedJson)}>
                  <Copy size={16} /> {copiedJson ? 'Copied' : 'Copy'}
                </button>
                <button className="btn btn-sm btn-primary gap-2" onClick={() => downloadFile(jsonPayload, 'ridge-catalog.json', 'application/json')}>
                  <Download size={16} /> Export JSON
                </button>
              </div>
            </div>
            <div className="flex-1 bg-surface/50 border border-white/10 rounded-lg p-4 overflow-auto text-sm font-mono whitespace-pre text-gray-300">
              {jsonPayload}
            </div>
          </div>

          {/* ICS Preview & Import */}
          <div className="flex flex-col h-full gap-6">
            <div className="flex flex-col h-[60%] gap-4">
              <div className="flex justify-between items-end">
                <h3 className="font-bold text-lg">ICS Calendar</h3>
                <div className="flex gap-2">
                  <button className="btn btn-sm btn-ghost gap-2" onClick={() => copyText(icsPayload, setCopiedIcs)}>
                    <Copy size={16} /> {copiedIcs ? 'Copied' : 'Copy'}
                  </button>
                  <button className="btn btn-sm btn-primary gap-2" onClick={() => downloadFile(icsPayload, 'ridge-events.ics', 'text/calendar')}>
                    <Download size={16} /> Export ICS
                  </button>
                </div>
              </div>
              <div className="flex-1 bg-surface/50 border border-white/10 rounded-lg p-4 overflow-auto text-sm font-mono whitespace-pre text-gray-300">
                {icsPayload}
              </div>
            </div>

            <div className="p-6 bg-surface/30 rounded-lg border border-white/10 flex flex-col gap-4">
              <h3 className="font-bold text-lg">Import Catalog</h3>
              <p className="text-sm text-gray-400">Load a previously exported catalog JSON file.</p>

              <div className="flex gap-4 items-center">
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  aria-label="File picker"
                />
                <button className="btn btn-outline notch-br gap-2" onClick={() => fileInputRef.current?.click()}>
                  <UploadSimple size={16} /> Load catalog
                </button>
              </div>

              {importError && <div className="text-error text-sm mt-2" role="alert" aria-live="polite">{importError}</div>}
              {importSuccess && <div className="text-success text-sm mt-2" role="status" aria-live="polite">{importSuccess}</div>}
            </div>
          </div>

        </div>

        {/* Global Aria Live */}
        <div aria-live="polite" className="sr-only">
          {copiedJson ? 'Copied JSON preview' : ''}
          {copiedIcs ? 'Copied ICS preview' : ''}
        </div>
      </div>
    </div>
  );
}
