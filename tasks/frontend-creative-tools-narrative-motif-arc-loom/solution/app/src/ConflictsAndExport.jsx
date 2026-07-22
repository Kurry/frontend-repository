import React, { useState } from 'react';
import { useStore } from './store.js';

// Simple determinist hash implementation
const cyrb53 = (str, seed = 0) => {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

export function ConflictsAndExport() {
  const motifs = useStore(state => state.motifs);
  const relations = useStore(state => state.relations);
  const spans = useStore(state => state.spans);
  const stages = useStore(state => state.stages);
  const undo = useStore(state => state.undo);
  const redo = useStore(state => state.redo);
  const loadAtlas = useStore(state => state.loadAtlas);

  const [showExport, setShowExport] = useState(false);
  const [exportedData, setExportedData] = useState("");
  const [importInput, setImportInput] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const conflicts = [];

  relations.forEach(rel => {
    const hasSourceEvidence = spans.some(s => s.motifId === rel.sourceMotifId);
    const hasTargetEvidence = spans.some(s => s.motifId === rel.targetMotifId);
    if (!hasSourceEvidence || !hasTargetEvidence) {
      conflicts.push(`Relation from Motif ${rel.sourceMotifId} to Motif ${rel.targetMotifId} lacks evidence on one or both ends.`);
    }
  });

  stages.forEach(stage => {
    const stageSpans = spans.filter(s => s.motifId === stage.motifId);
    if (stageSpans.length > 0 && stageSpans.every(s => s.isCounterexample)) {
      conflicts.push(`Stage for Motif ${stage.motifId} in Collection ${stage.collectionId} has only counterexamples.`);
    }
  });

  const generateChecksum = () => {
    const dataStr = JSON.stringify({ motifs, spans, relations, stages });
    return cyrb53(dataStr).toString(16);
  };

  const handleExport = () => {
    const atlas = {
      schemaVersion: "narrative-motif-atlas/v1",
      exportedAt: new Date().toISOString(),
      checksum: generateChecksum(),
      motifs,
      spans,
      relations,
      stages,
    };

    const markdown = `# Narrative Motif Atlas\n\n## Motifs\n${motifs.map(m => `- ${m.name}`).join('\n')}\n\n## Citations\n${spans.map(s => `> "${s.text}" (Motif ID: ${s.motifId})`).join('\n\n')}`;

    setExportedData(JSON.stringify({ ...atlas, _markdown: markdown }, null, 2));
    setShowExport(true);
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(importInput);
      if (data.schemaVersion === "narrative-motif-atlas/v1") {
        loadAtlas(data);
        setIsImporting(false);
        setImportInput("");
      } else {
        alert("Invalid schema version");
      }
    } catch (e) {
      alert("Failed to parse JSON");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {conflicts.length > 0 && (
        <div className="bg-red-50 border border-red-200 p-4 rounded shadow-sm">
          <h2 className="text-red-800 font-bold mb-2">Arc Conflicts Detected</h2>
          <ul className="list-disc pl-5 text-sm text-red-700 space-y-1">
            {conflicts.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </div>
      )}

      <div className="bg-white border p-4 rounded shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Transformation Ledger & Export</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setIsImporting(!isImporting)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded shadow text-sm hover:bg-gray-200 transition-colors"
            >
              Import
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-blue-600 text-white rounded shadow text-sm hover:bg-blue-700 transition-colors"
            >
              Generate Atlas Artifact
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button onClick={undo} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200">Undo</button>
          <button onClick={redo} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200">Redo</button>
        </div>

        {isImporting && (
          <div className="mt-4 border-t pt-4">
            <h3 className="font-semibold text-sm mb-2">Import JSON</h3>
            <textarea
              className="w-full h-32 p-2 text-xs font-mono bg-white border rounded mb-2"
              value={importInput}
              onChange={(e) => setImportInput(e.target.value)}
              placeholder="Paste JSON here..."
            />
            <button onClick={handleImport} className="px-4 py-2 bg-green-600 text-white rounded shadow text-sm">Load</button>
          </div>
        )}

        {showExport && (
          <div className="mt-4 border-t pt-4">
            <h3 className="font-semibold text-sm mb-2">Exported JSON (includes Markdown as property)</h3>
            <textarea
              readOnly
              className="w-full h-48 p-2 text-xs font-mono bg-gray-50 border rounded"
              value={exportedData}
            />
          </div>
        )}
      </div>
    </div>
  );
}
