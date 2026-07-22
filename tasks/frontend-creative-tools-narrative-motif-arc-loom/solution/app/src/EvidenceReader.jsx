import React, { useState } from 'react';
import { useStore } from './store.js';
import { TEXTS, COLLECTIONS, PALETTE } from './fixture.js';
import { cn } from './utils.js';
import { v4 as uuidv4 } from 'uuid';

export function EvidenceReader() {
  const spans = useStore(state => state.spans);
  const motifs = useStore(state => state.motifs);
  const addSpan = useStore(state => state.addSpan);
  const [error, setError] = useState(null);

  const getMotifColor = (motifId) => {
    if (!motifId) return '#e5e7eb'; // gray-200
    const motif = motifs.find(m => m.id === motifId);
    if (!motif) return '#e5e7eb';
    const color = PALETTE.find(p => p.id === motif.colorId);
    return color ? color.value : '#e5e7eb';
  };

  const handleMouseUp = (textId, content) => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    if (!selectedText.trim()) return;

    const startOffset = content.indexOf(selectedText);

    if (startOffset === -1) {
      selection.removeAllRanges();
      return;
    }

    const endOffset = startOffset + selectedText.length;

    const newSpan = {
      id: uuidv4(),
      textId,
      startOffset,
      endOffset,
      text: selectedText,
      motifId: null, // Unclassified by default
      isCounterexample: false
    };

    addSpan(newSpan);
    selection.removeAllRanges();
    setError(null);
  };

  return (
    <div className="w-full h-full overflow-y-auto p-4 flex flex-col gap-6 bg-white shadow-inner">
      <h2 className="text-xl font-bold border-b pb-2">Evidence Reader</h2>
      {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>}

      {COLLECTIONS.map(collection => (
        <div key={collection.id} className="flex flex-col gap-3">
          <h3 className="font-semibold text-lg text-gray-700 bg-gray-100 p-2 rounded-t">{collection.name}</h3>
          <div className="flex flex-col gap-4">
            {collection.texts.map(textId => {
              const textObj = TEXTS[textId];
              const textSpans = spans.filter(s => s.textId === textId);

              return (
                <div key={textId} className="px-3 pb-3 pt-2 border rounded bg-gray-50 text-sm leading-relaxed text-gray-800">
                  <div
                    onMouseUp={() => handleMouseUp(textId, textObj.content)}
                    className="whitespace-pre-wrap cursor-text"
                  >
                    {textObj.content}
                  </div>

                  {textSpans.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2 border-t pt-2">
                      {textSpans.map(span => (
                        <div
                          key={span.id}
                          className="text-xs px-2 py-1 rounded shadow-sm flex items-center gap-2"
                          style={{ backgroundColor: getMotifColor(span.motifId) + '40', border: `1px solid ${getMotifColor(span.motifId)}` }}
                        >
                          <span className="font-medium text-gray-900">"{span.text}"</span>
                          {span.motifId ? (
                            <span className="text-[10px] uppercase tracking-wider text-gray-700 bg-white/50 px-1 rounded">
                              {motifs.find(m=>m.id === span.motifId)?.name}
                              {span.isCounterexample && " (Counter)"}
                            </span>
                          ) : (
                            <span className="text-[10px] uppercase tracking-wider text-gray-500 bg-white/50 px-1 rounded">
                              Unclassified
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
