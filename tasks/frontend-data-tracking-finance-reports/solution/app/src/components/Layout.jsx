import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { displayCurrency, setCurrency, undo, redo, undoStack, redoStack, showToast } from '../state.js';
import { Icon } from '@iconify/react';
import { ExportImportModals } from './ExportImportModals.jsx';

export function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const handleCurrencySwitch = (e) => {
    const newCurrency = e.target.value;
    setCurrency(newCurrency);
    const rates = { USD: 1, EUR: 0.92, GBP: 0.79 };
    showToast(`Currency changed to ${newCurrency} (Rate: ${rates[newCurrency]})`);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const SidebarContent = () => (
    <div class="p-4 w-64 min-h-full bg-base-200 text-base-content flex flex-col border-r border-base-300">
      <div class="flex items-center gap-2 mb-8 px-2">
        <Icon icon="mdi:finance" class="text-3xl text-primary" />
        <span class="text-xl font-bold">Ledger</span>
      </div>

      <ul class="menu p-0 flex-1">
        <li><a class="active"><Icon icon="mdi:view-dashboard" class="text-xl" /> Overview</a></li>
        <li><a><Icon icon="mdi:format-list-bulleted" class="text-xl" /> Transactions</a></li>
        <li><a><Icon icon="mdi:chart-pie" class="text-xl" /> Budgets</a></li>
        <li><a><Icon icon="mdi:cog" class="text-xl" /> Settings</a></li>
      </ul>

      <div class="divider"></div>

      <div class="flex flex-col gap-4 mt-auto">
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Display Currency</span>
            <span class="label-text-alt opacity-70" title="Mock FX Rates: EUR 0.92, GBP 0.79">info</span>
          </label>
          <select
            class="select select-bordered select-sm w-full"
            value={displayCurrency.value}
            onChange={handleCurrencySwitch}
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>

        <div>
            <div class="flex gap-2 justify-between mb-1">
              <button class="btn btn-sm btn-outline flex-1" onClick={undo} disabled={undoStack.value.length === 0} title="Undo">
                <Icon icon="mdi:undo" /> Undo
              </button>
              <button class="btn btn-sm btn-outline flex-1" onClick={redo} disabled={redoStack.value.length === 0} title="Redo">
                <Icon icon="mdi:redo" /> Redo
              </button>
            </div>
            <div class="text-center text-xs opacity-50">Shortcuts: Ctrl+Z / Ctrl+Y</div>
        </div>

        <div class="flex flex-col gap-2">
          <button class="btn btn-primary btn-sm w-full" onClick={() => setExportOpen(true)}>
            <Icon icon="mdi:export" /> Export Report
          </button>
          <button class="btn btn-ghost btn-sm w-full" onClick={() => setImportOpen(true)}>
            <Icon icon="mdi:import" /> Import Data
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div class="drawer lg:drawer-open bg-base-100 min-h-screen font-sans text-base-content">
      <input id="my-drawer" type="checkbox" class="drawer-toggle" checked={sidebarOpen} onChange={(e) => setSidebarOpen(e.target.checked)} />

      <div class="drawer-content flex flex-col h-screen overflow-hidden">
        <div class="lg:hidden flex items-center p-4 border-b border-base-300">
          <label htmlFor="my-drawer" class="btn btn-square btn-ghost drawer-button">
            <Icon icon="mdi:menu" class="text-2xl" />
          </label>
          <div class="flex-1 text-center font-bold text-lg">Ledger | Reports</div>
        </div>

        <main class="flex-1 overflow-y-auto p-4 md:p-8">
          <div class="max-w-7xl mx-auto space-y-6 pb-20">
            {children}
          </div>
        </main>
      </div>

      <div class="drawer-side z-40">
        <label htmlFor="my-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
        <SidebarContent />
      </div>

      <ExportImportModals
        exportOpen={exportOpen}
        setExportOpen={setExportOpen}
        importOpen={importOpen}
        setImportOpen={setImportOpen}
      />
    </div>
  );
}
