import React, { useRef } from 'react';
import { PhasorPlane } from './components/PhasorPlane';
import { InverseStrip } from './components/InverseStrip';
import { ExactUI } from "./components/ExactUI";
import { useStore } from './store';
import { createExportZip, importZip } from './lib/transfer';

export default function App() {
  const store = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    if (!store.isApproved()) {
      alert("Must be approved to export proof");
      return;
    }
    const blob = await createExportZip();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "quartz-quartet-real-signal-proof.zip";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await importZip(file);
      } catch (err) {
        alert("Import failed: " + err);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className={`min-h-screen bg-gray-100 text-gray-900 ${store.isCompactMode ? 'w-[390px] mx-auto' : 'w-full px-4'} py-8 flex flex-col items-center`}>
      <div className="w-full max-w-[1440px] flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Fictional Conjugate-Spectrum Real-Signal Repair Proof Studio</h1>
        <div className="flex gap-2 text-sm">
          <button
            className="px-3 py-1 bg-gray-200 rounded"
            onClick={() => store.setCompactMode(!store.isCompactMode)}
          >
            {store.isCompactMode ? 'Desktop Mode' : 'Mobile (390px) Mode'}
          </button>
        </div>
      </div>

      <div className={`w-full max-w-[1440px] flex ${store.isCompactMode ? 'flex-col' : 'flex-row'} gap-8`}>
        <div className={store.isCompactMode ? 'w-full' : 'flex-1'}>
          <PhasorPlane />
<ExactUI />
        </div>

        <div className={store.isCompactMode ? 'w-full' : 'flex-1'}>
          <InverseStrip />

          <div className="mt-4 p-4 bg-white border rounded shadow">
            <h2 className="font-bold mb-2">History & Review</h2>
            <div className="flex gap-2 flex-wrap mb-4">
              <button className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50" onClick={store.undo} disabled={store.bins["BIN-K3"].r !== 8}>Selective Undo</button>
              <button className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50" onClick={store.redo} disabled={store.bins["BIN-K3"].r === 8}>Branch Restore</button>
              <button
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded border border-blue-300"
                onClick={() => {
                  if(store.bins["BIN-K3"].r === 8 && store.bins["BIN-K3"].i === -8) {
                    store.addReview({
                      targetId: "BIN-K3",
                      actor: "Zia",
                      verdict: "conjugate-repair-exact",
                      noteId: "note-1"
                    });
                  }
                }}
              >
                Review (Zia)
              </button>
              <button
                className="px-3 py-1 bg-green-100 text-green-800 rounded border border-green-300 disabled:opacity-50"
                onClick={store.approve}
                disabled={!store.reviews.some(r => r.stateHash === store.getStateHash() && r.verdict === "conjugate-repair-exact")}
              >
                Approve Proof
              </button>
              <button className="px-3 py-1 bg-purple-600 text-white rounded" onClick={handleExport}>Export ZIP</button>
              <input type="file" ref={fileInputRef} className="hidden" accept=".zip" onChange={handleImport} />
              <button className="px-3 py-1 bg-gray-800 text-white rounded" onClick={() => fileInputRef.current?.click()}>Import</button>
            </div>

            <div className="text-sm space-y-1 font-mono h-40 overflow-y-auto bg-gray-50 p-2 border">
              {store.history.map(evt => (
                <div key={evt.id} className="border-b pb-1">
                  [{evt.tick}] {evt.actor}: {evt.operation}
                </div>
              ))}
              {store.history.length === 0 && <span className="text-gray-400">No events</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
