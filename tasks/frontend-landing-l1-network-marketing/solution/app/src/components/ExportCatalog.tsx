import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { $exportCatalogOpen, $events, $leads, $theme, loadCatalog, announce } from '../store';
import { X, Copy, Download, UploadSimple } from 'phosphor-react';
import { buildCatalogJson, buildEventsIcs } from '../artifacts';

export default function ExportCatalog() {
  const isOpen = useStore($exportCatalogOpen);
  const events = useStore($events);
  const leads = useStore($leads);
  const theme = useStore($theme);

  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedIcs, setCopiedIcs] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [pasteText, setPasteText] = useState('');
  const [closing, setClosing] = useState(false);
  const firstFocusRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);
  const visible = isOpen || closing;

  const requestClose = () => {
    if (closing) return;
    setClosing(true);
    lastFocused.current?.focus({ preventScroll: true });
    lastFocused.current = null;
    window.setTimeout(() => {
      $exportCatalogOpen.set(false);
      setClosing(false);
    }, 200);
  };

  useEffect(() => {
    if (isOpen && !closing) {
      lastFocused.current = document.activeElement as HTMLElement | null;
      setImportError(null);
      setImportSuccess(null);
      const t = window.setTimeout(() => firstFocusRef.current?.focus(), 80);
      const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); requestClose(); } };
      window.addEventListener('keydown', handleEscape);
      return () => { window.removeEventListener('keydown', handleEscape); window.clearTimeout(t); };
    }
  }, [isOpen, closing]);

  const jsonPayload = buildCatalogJson(events, leads, theme);
  const icsPayload = buildEventsIcs(events);

  const copyText = async (text: string, setter: (val: boolean) => void, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setter(true);
      announce(`${label} copied to clipboard.`);
      setTimeout(() => setter(false), 3000);
    } catch {
      setter(false);
      announce(`${label} copy was blocked by the browser.`);
    }
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    announce(`Downloaded ${filename}.`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const res = loadCatalog(content, file.name || 'catalog');
      if (res.ok) {
        setImportSuccess(`Catalog "${file.name}" loaded — events and leads restored.`);
        setImportError(null);
        announce(`Catalog imported from ${file.name}.`);
        setTimeout(() => setImportSuccess(null), 5000);
      } else {
        setImportError(res.error || `Import failed: ${file.name} is not a valid catalog.`);
        setImportSuccess(null);
        announce(res.error || `Catalog import failed.`);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  // Paste-based import path: accepts the same declared-catalog packet without a
  // file picker, sharing loadCatalog (and its validation/rejection) with the
  // file path above.
  const handlePasteImport = () => {
    const res = loadCatalog(pasteText, 'pasted catalog');
    if (res.ok) {
      setImportSuccess('Pasted catalog loaded — events and leads restored.');
      setImportError(null);
      setPasteText('');
      announce('Catalog imported from pasted JSON. Events and leads restored.');
      setTimeout(() => setImportSuccess(null), 5000);
    } else {
      setImportError(res.error || 'Import failed: pasted catalog is not a valid catalog.');
      setImportSuccess(null);
      announce(res.error || 'Catalog import failed.');
    }
  };

  const trapFocus = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !dialogRef.current) return;
    const f = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button, input, [tabindex]:not([tabindex="-1"])'))
      .filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
    if (f.length === 0) return;
    const first = f[0], last = f[f.length - 1];
    const active = document.activeElement as HTMLElement;
    if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm ${closing ? 'backdrop-out' : 'backdrop-in'}`}
      role="dialog"
      aria-modal="true"
      aria-label="Export catalog"
      onMouseDown={(e) => { if (e.target === e.currentTarget) requestClose(); }}
    >
      <div
        ref={dialogRef}
        onKeyDown={trapFocus}
        className={`surface-copy bg-surface w-full max-w-5xl max-h-[88vh] rounded-xl shadow-2xl flex flex-col border border-current/10 overflow-hidden ${closing ? 'overlay-out' : 'overlay-in'}`}
      >

        <div className="flex justify-between items-center p-6 border-b border-current/10 bg-surface">
          <h2 className="text-2xl font-bold display-font">Export Catalog</h2>
          <button ref={firstFocusRef} className="btn btn-square btn-ghost text-current focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" onClick={requestClose} aria-label="Close Export Catalog">
            <X size={24} />
          </button>
        </div>

        <div className="void-copy flex-1 overflow-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-void">

          <div className="flex flex-col gap-4 min-h-[280px]">
            <div className="flex justify-between items-end gap-2 flex-wrap">
              <h3 className="font-bold text-lg">JSON Export</h3>
              <div className="flex gap-2">
                <button aria-label="Copy catalog JSON" className="btn btn-sm btn-ghost gap-2 text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" onClick={() => copyText(jsonPayload, setCopiedJson, 'Export JSON')}>
                  <Copy size={16} /> {copiedJson ? 'Copied' : 'Copy'}
                </button>
                <a href={`data:application/json;charset=utf-8,${encodeURIComponent(jsonPayload)}`} download="ridge-catalog.json" aria-label="Download catalog JSON" className="btn btn-sm btn-primary gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" onClick={() => announce('Downloaded ridge-catalog.json.')}>
                  <Download size={16} /> Export JSON
                </a>
              </div>
            </div>
            <div className="surface-copy flex-1 bg-surface border border-current/10 rounded-lg p-4 overflow-auto text-sm font-mono whitespace-pre opacity-90" aria-label="JSON preview">
              {jsonPayload}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 min-h-[200px]">
              <div className="flex justify-between items-end gap-2 flex-wrap">
                <h3 className="font-bold text-lg">ICS Calendar</h3>
                <div className="flex gap-2">
                  <button aria-label="Copy catalog ICS" className="btn btn-sm btn-ghost gap-2 text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" onClick={() => copyText(icsPayload, setCopiedIcs, 'Export ICS')}>
                    <Copy size={16} /> {copiedIcs ? 'Copied' : 'Copy'}
                  </button>
                  <a href={`data:text/calendar;charset=utf-8,${encodeURIComponent(icsPayload)}`} download="ridge-events.ics" aria-label="Download catalog ICS" className="btn btn-sm btn-primary gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" onClick={() => announce('Downloaded ridge-events.ics.')}>
                    <Download size={16} /> Export ICS
                  </a>
                </div>
              </div>
              <div className="surface-copy flex-1 bg-surface border border-current/10 rounded-lg p-4 overflow-auto text-sm font-mono whitespace-pre opacity-90" aria-label="ICS preview">
                {icsPayload}
              </div>
            </div>

            <div className="surface-copy p-6 bg-surface rounded-lg border border-current/10 flex flex-col gap-4">
              <h3 className="font-bold text-lg">Import Catalog</h3>
              <p className="text-sm opacity-70">Load a previously exported catalog JSON file.</p>

              <div className="flex gap-4 items-center flex-wrap">
                <input
                  type="file"
                  accept=".json,application/json"
                  className="sr-only"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  aria-label="Choose catalog JSON file to import"
                />
                <button className="btn btn-outline notch-br gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" onClick={() => fileInputRef.current?.click()}>
                  <UploadSimple size={16} /> Load catalog
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="catalog-paste" className="text-sm font-medium">Or paste catalog JSON</label>
                <textarea
                  id="catalog-paste"
                  className="textarea textarea-bordered w-full h-24 font-mono text-xs notch-br focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  placeholder='Paste a previously exported catalog packet ({"version": 1, ...}) here'
                  value={pasteText}
                  onChange={e => setPasteText(e.target.value)}
                />
                <button
                  className="btn btn-outline btn-sm notch-br gap-2 self-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  onClick={handlePasteImport}
                >
                  <UploadSimple size={16} /> Load pasted catalog
                </button>
              </div>

              {importError && <div className="text-error text-sm mt-2" role="alert" aria-live="polite">{importError}</div>}
              {importSuccess && <div className="text-success text-sm mt-2" role="status" aria-live="polite">{importSuccess}</div>}
            </div>
          </div>

        </div>

        <div aria-live="polite" className="sr-only">
          {copiedJson ? 'Copied JSON preview to clipboard.' : copiedIcs ? 'Copied ICS preview to clipboard.' : ''}
        </div>
      </div>
    </div>
  );
}
