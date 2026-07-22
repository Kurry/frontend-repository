import React from 'react';
import { PlantRecord, ProvenanceAtlasState } from '../store';
import { ShieldAlert, CheckCircle, Search, Undo2, ChevronRight, XCircle } from 'lucide-react';

interface ProvenanceAtlasProps {
  records: PlantRecord[];
  atlasState: ProvenanceAtlasState;
  onAtlasStateChange: (state: ProvenanceAtlasState) => void;
  onUpdateRecord: (record: PlantRecord) => void;
  canUndo: boolean;
  onUndo: () => void;
}

export function ProvenanceAtlas({
  records,
  atlasState,
  onAtlasStateChange,
  onUpdateRecord,
  canUndo,
  onUndo
}: ProvenanceAtlasProps) {
  const selectedRecord = records.find(r => r.id === atlasState.selectedRecordId);

  const handleTraceAndQuarantine = () => {
    if (!selectedRecord) return;

    if (selectedRecord.quarantined) {
      onUpdateRecord({ ...selectedRecord, quarantined: false, status: 'ready' });
      onAtlasStateChange({ ...atlasState, mode: 'resolved' });
    } else {
      if (!selectedRecord.sourceEvidence) {
        onAtlasStateChange({ ...atlasState, mode: 'conflict' });
        return;
      }
      onUpdateRecord({ ...selectedRecord, quarantined: true, status: 'changed' });
      onAtlasStateChange({ ...atlasState, mode: 'changed' });
    }
  };

  const closeSelection = () => {
    onAtlasStateChange({ selectedRecordId: null, mode: 'idle' });
  };

  if (!selectedRecord) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 h-full">
        <div className="text-center text-gray-400">
          <Search className="mx-auto mb-2 opacity-50" size={32} />
          <p>Select an observation to inspect provenance</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          Provenance Atlas <ChevronRight size={16} className="text-gray-400"/> <span className="text-sm font-mono text-gray-500 font-normal">{selectedRecord.id}</span>
        </h2>
        <div className="flex gap-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded-md ${canUndo ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' : 'text-gray-300 cursor-not-allowed'}`}
            title="Undo last action"
            aria-label="Undo"
          >
            <Undo2 size={18} />
          </button>
          <button
            onClick={closeSelection}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
            aria-label="Close details"
          >
            <XCircle size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 shadow-sm">
            <h3 className="text-xl font-medium text-gray-900 mb-1">{selectedRecord.name}</h3>
            <p className="text-sm text-gray-500 mb-4 italic">{selectedRecord.species}</p>

            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <span className="block text-gray-400 mb-1 text-xs uppercase tracking-wider">Status</span>
                <span className="font-medium text-gray-800">{selectedRecord.status}</span>
              </div>
              <div>
                <span className="block text-gray-400 mb-1 text-xs uppercase tracking-wider">Height</span>
                <span className="font-medium text-gray-800">{selectedRecord.heightCm} cm</span>
              </div>
              <div className="col-span-2">
                <span className="block text-gray-400 mb-1 text-xs uppercase tracking-wider">Source Evidence</span>
                <span className="font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded text-xs break-all border border-gray-200 inline-block w-full">
                  {selectedRecord.sourceEvidence || 'No source evidence provided'}
                </span>
              </div>
              <div className="col-span-2">
                <span className="block text-gray-400 mb-1 text-xs uppercase tracking-wider">Notes</span>
                <p className="text-gray-700 bg-white p-2 rounded border border-gray-200 min-h-[60px]">
                  {selectedRecord.notes || <span className="text-gray-400 italic">No notes</span>}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-md font-medium text-gray-800 mb-3">Lineage Actions</h4>

            <div className={`p-4 rounded-lg border transition-all transform ${selectedRecord.quarantined ? 'bg-orange-50 border-orange-200 scale-[1.01]' : 'bg-white border-gray-200'}`}>
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${selectedRecord.quarantined ? 'text-orange-500' : 'text-gray-400'}`}>
                  {selectedRecord.quarantined ? <ShieldAlert size={20} /> : <CheckCircle size={20} />}
                </div>
                <div className="flex-1">
                  <h5 className={`font-medium ${selectedRecord.quarantined ? 'text-orange-900' : 'text-gray-800'}`}>
                    {selectedRecord.quarantined ? 'Lineage Quarantined' : 'Lineage Intact'}
                  </h5>
                  <p className="text-sm text-gray-600 mt-1 mb-3">
                    {selectedRecord.quarantined
                      ? 'This record has been flagged due to bad lineage or conflicting evidence. It requires review.'
                      : 'Trace this record to its source evidence. If the lineage is bad, quarantine it immediately.'}
                  </p>

                  {atlasState.mode === 'conflict' && (
                    <div className="mb-3 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100">
                      Cannot trace lineage: Source evidence is missing. Please edit the record to provide source evidence before quarantining.
                    </div>
                  )}

                  <button
                    onClick={handleTraceAndQuarantine}
                    className={`text-sm px-4 py-2 rounded-md font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none ${
                      selectedRecord.quarantined
                        ? 'bg-orange-100 text-orange-800 hover:bg-orange-200 focus:ring-orange-500'
                        : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 focus:ring-red-500'
                    }`}
                  >
                    {selectedRecord.quarantined ? 'Resolve Quarantine' : 'Trace & Quarantine Lineage'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
