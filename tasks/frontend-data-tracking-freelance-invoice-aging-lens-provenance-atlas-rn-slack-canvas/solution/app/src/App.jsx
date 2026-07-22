import React, { useState, useEffect } from 'react';
import { useAppStore } from './store';
import { InvoicesList } from './InvoicesList';
import { ProvenanceAtlas } from './ProvenanceAtlas';
import { ExportImport } from './ExportImport';

export const App = () => {
  const { undo, data } = useAppStore();
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="flex justify-between items-center p-4 bg-white border-b border-gray-200">
        <h1 className="text-xl font-semibold">Freelance Invoice Aging Lens</h1>
        <ExportImport />
      </header>

      <main className="flex-1 overflow-hidden flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 lg:w-2/3 flex flex-col border-r border-gray-200">
          <InvoicesList selectedId={selectedInvoiceId} onSelect={setSelectedInvoiceId} />
        </div>
        <div className="w-full md:w-1/2 lg:w-1/3 flex flex-col bg-white">
          <ProvenanceAtlas selectedId={selectedInvoiceId} />

          <div className="p-4 border-t border-gray-200">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Derived Summary</h2>
            <div className="flex justify-between items-center py-1">
              <span className="text-sm text-gray-600">Total Amount:</span>
              <span className="font-medium">${data.derived.totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-sm text-gray-600">Quarantined Lineages:</span>
              <span className="font-medium text-red-600">{data.derived.quarantinedCount}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
