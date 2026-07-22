import { Analytics } from "./Analytics";
import React, { useRef } from 'react';
import { useStore, FIXED_TODAY } from './store';
import { Tabletop } from './Tabletop';
import { Terrain } from './Terrain';
import { ReviewSession } from './ReviewSession';

function DataTools() {
  const { cards, setDeckState } = useStore();
  const fileInputRef = useRef(null);


  const handleTSVExport = () => {
    const state = useStore.getState();
    const rows = ['id	front	back	box	due'];
    state.cards.forEach(c => {
      rows.push(`${c.id}	${c.front.replace(/\n/g, ' ')}	${c.back.replace(/\n/g, ' ')}	${c.box}	${c.due || ''}`);
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/tab-separated-values' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leitner-deck.tsv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    const state = useStore.getState();
    const artifact = {
      schemaVersion: "leitner-deck/v1",
      exportedAt: new Date().toISOString(),
      fixedToday: FIXED_TODAY,
      cards: state.cards,
      tags: state.groupRegions.map(r => r.name), // simplification
      groupRegions: state.groupRegions,
      sessions: state.sessions,
      reviewEvents: state.reviewEvents,
      viewState: state.viewState
    };

    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leitner-deck.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        if (data.schemaVersion === "leitner-deck/v1") {
           setDeckState({
             cards: data.cards || [],
             groupRegions: data.groupRegions || [],
             sessions: data.sessions || [],
             reviewEvents: data.reviewEvents || [],
             stagedEdits: [],
             viewState: data.viewState || useStore.getState().viewState,
             activeSession: null
           });
           alert('Import successful');
        } else {
           alert('Invalid schema version');
        }
      } catch (err) {
        alert('Failed to parse JSON');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex gap-2 p-2 bg-slate-200">
      <button className="px-3 py-1 bg-white border rounded shadow-sm text-sm" onClick={handleExport}>Export JSON</button>
      <button className="px-3 py-1 bg-white border rounded shadow-sm text-sm" onClick={handleTSVExport}>Export TSV</button>
      <label className="px-3 py-1 bg-white border rounded shadow-sm text-sm cursor-pointer">
        Import JSON
        <input type="file" className="hidden" accept=".json,.tsv" onChange={handleImport} ref={fileInputRef} />
      </label>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-slate-300 p-4 flex flex-col gap-4 xl:w-96 font-sans">
      <header className="flex justify-between items-center bg-white p-4 rounded shadow">
        <h1 className="text-2xl font-bold">Leitner Memory Terrain</h1>
        <DataTools />
      </header>

      <div className="flex flex-col xl:flex-row gap-4">
        <div className="flex-1 flex flex-col gap-4 xl:w-96">
          <div className="bg-white p-4 rounded shadow overflow-auto">
            <h2 className="text-lg font-bold mb-2">Tabletop Workspace</h2>
            <div className="overflow-auto border">
               <Tabletop />
            </div>
          </div>
          <div className="bg-white p-4 rounded shadow">
             <h2 className="text-lg font-bold mb-2">Memory Terrain</h2>
             <Terrain />
          </div>
        </div>

        <div className="flex flex-col gap-4 xl:w-96">
           <ReviewSession />

           <div className="bg-white p-4 rounded shadow flex-1">
             <h2 className="text-lg font-bold mb-2">Analytics & Forecast</h2>

           </div>
        </div>
      </div>
    </div>
  );
}
