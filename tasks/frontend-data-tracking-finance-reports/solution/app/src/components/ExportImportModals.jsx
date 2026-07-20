import { h } from 'preact';
import { useState } from 'preact/hooks';
import { transactions, thresholds, filters, displayCurrency, totals, resetState, showToast } from '../state.js';
import { Icon } from '@iconify/react';
import FocusTrap from 'focus-trap-react';
import { z } from 'zod';

export function ExportImportModals({ exportOpen, setExportOpen, importOpen, setImportOpen }) {
  const [exportTab, setExportTab] = useState('json');
  const [importInput, setImportInput] = useState('');
  const [importError, setImportError] = useState(null);

  if (!exportOpen && !importOpen) return null;

  const handleEscExport = (e) => { if (e.key === 'Escape') setExportOpen(false); };
  const handleEscImport = (e) => { if (e.key === 'Escape') setImportOpen(false); };

  // Generate Export Data
  const getExportJSON = () => {
    return JSON.stringify({
      schemaVersion: 1,
      reportTitle: "Finance Reports",
      generatedAt: new Date().toISOString(),
      displayCurrency: displayCurrency.value,
      filters: filters.value,
      totals: totals.value,
      thresholds: thresholds.value,
      transactions: transactions.value
    }, null, 2);
  };

  const getExportCSV = () => {
    const header = "date,label,category,account,amount,status,note\n";
    const rows = transactions.value.map(t =>
      `${t.date},"${t.label}",${t.category},${t.account},${t.amount},${t.status},"${t.note || ''}"`
    ).join('\n');
    return header + rows;
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    showToast("Copied");
  };

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
      try {
          const data = JSON.parse(importInput);

          if (data.schemaVersion !== 1) {
              setImportError('Invalid schemaVersion');
              return;
          }

          // Strict Zod validation mapping the transaction and threshold contracts
          const schema = z.object({
              transactions: z.array(z.object({
                  date: z.string(),
                  label: z.string(),
                  category: z.string(),
                  account: z.string(),
                  amount: z.number(),
                  status: z.string()
              })),
              thresholds: z.array(z.object({
                  category: z.string(),
                  ceiling: z.number()
              }))
          });

          schema.parse(data);

          resetState(data.transactions, data.thresholds);
          setImportOpen(false);
          setImportInput('');
          setImportError(null);
          showToast('Import successful');
      } catch (err) {
          setImportError(`Import failed: ${err.message}`);
      }
  };

  return (
    <>
      {exportOpen && (
        <FocusTrap active={true}>
          <div
            class="fixed inset-y-0 right-0 z-50 flex"
            onKeyDown={handleEscExport}
          >
             <div class="fixed inset-0 bg-base-300/50 backdrop-blur-sm" onClick={() => setExportOpen(false)}></div>
             <div class="w-full max-w-lg bg-base-100 shadow-2xl h-full flex flex-col relative" role="dialog" aria-modal="true" aria-labelledby="export-title">
                <div class="p-4 border-b border-base-200 flex justify-between items-center">
                    <h2 id="export-title" class="text-xl font-bold">Export Report</h2>
                    <button class="btn btn-sm btn-ghost btn-square" onClick={() => setExportOpen(false)} aria-label="Close export drawer">
                        <Icon icon="mdi:close" class="text-xl" />
                    </button>
                </div>

                <div class="p-4 border-b border-base-200">
                    <div class="tabs tabs-boxed">
                      <a class={`tab ${exportTab === 'json' ? 'tab-active' : ''}`} onClick={() => setExportTab('json')}>JSON</a>
                      <a class={`tab ${exportTab === 'csv' ? 'tab-active' : ''}`} onClick={() => setExportTab('csv')}>CSV</a>
                    </div>
                </div>

                <div class="flex-1 overflow-auto p-4 bg-base-200/50">
                    <pre class="text-xs font-mono whitespace-pre-wrap">
                        {exportTab === 'json' ? getExportJSON() : getExportCSV()}
                    </pre>
                </div>

                <div class="p-4 border-t border-base-200 flex gap-2">
                    <button
                        class="btn btn-outline flex-1"
                        onClick={() => handleCopy(exportTab === 'json' ? getExportJSON() : getExportCSV())}
                    >
                        Copy
                    </button>
                    <button
                        class="btn btn-primary flex-1"
                        onClick={() => downloadFile(
                            exportTab === 'json' ? getExportJSON() : getExportCSV(),
                            exportTab === 'json' ? 'finance-reports-ledger.json' : 'finance-reports-ledger.csv',
                            exportTab === 'json' ? 'application/json' : 'text/csv'
                        )}
                    >
                        Download {exportTab === 'json' ? 'JSON' : 'CSV'}
                    </button>
                </div>
             </div>
          </div>
        </FocusTrap>
      )}

      {importOpen && (
        <FocusTrap active={true}>
          <div
            class="fixed inset-0 z-50 flex items-center justify-center bg-base-300/50 backdrop-blur-sm"
            onKeyDown={handleEscImport}
          >
             <div class="card w-full max-w-xl bg-base-100 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="import-title">
                <div class="card-body">
                    <div class="flex justify-between items-center mb-4">
                        <h2 id="import-title" class="card-title text-xl">Import Data</h2>
                        <button class="btn btn-sm btn-ghost btn-square" onClick={() => setImportOpen(false)} aria-label="Close import dialog">
                            <Icon icon="mdi:close" class="text-xl" />
                        </button>
                    </div>

                    <div class="form-control">
                        <label class="label"><span class="label-text">Paste ledger-json</span></label>
                        <textarea
                            class="textarea textarea-bordered h-48 font-mono text-xs"
                            value={importInput}
                            onChange={(e) => setImportInput(e.target.value)}
                            placeholder='{"schemaVersion": 1, ...}'
                        ></textarea>
                    </div>

                    {importError && (
                        <div class="text-error text-sm mt-2 p-2 bg-error/10 rounded">
                            {importError}
                        </div>
                    )}

                    <div class="modal-action">
                        <button class="btn btn-ghost" onClick={() => setImportOpen(false)}>Cancel</button>
                        <button class="btn btn-primary" onClick={handleImport} disabled={!importInput}>Replace & Import</button>
                    </div>
                </div>
             </div>
          </div>
        </FocusTrap>
      )}
    </>
  );
}
