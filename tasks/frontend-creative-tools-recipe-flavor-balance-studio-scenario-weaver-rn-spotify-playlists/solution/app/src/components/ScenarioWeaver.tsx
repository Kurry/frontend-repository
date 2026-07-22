import React, { useState } from 'react';
import { useStore } from '../store';
import { GitBranch, Save } from 'lucide-react';

export function ScenarioWeaver() {
  const { records, selectedId, updateRecord, branchScenario } = useStore();
  const selectedRecord = records.find(r => r.id === selectedId);

  const [editProfile, setEditProfile] = useState(selectedRecord?.profile);

  // Keep local state in sync when selection changes
  React.useEffect(() => {
    setEditProfile(selectedRecord?.profile);
  }, [selectedRecord]);

  if (!selectedRecord || !editProfile) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-zinc-500 bg-black/20 rounded-lg border border-zinc-800">
        <GitBranch size={48} className="mb-4 opacity-50" />
        <p>Select a flavor component to view details or weave a scenario.</p>
      </div>
    );
  }

  const handleSliderChange = (key: keyof typeof editProfile, value: number) => {
    setEditProfile({ ...editProfile, [key]: value });
  };

  const handleSave = () => {
    updateRecord(selectedRecord.id, { profile: editProfile });
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 rounded-lg p-6 border border-zinc-800">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">{selectedRecord.name}</h2>
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <span className="capitalize px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700">Status: {selectedRecord.status}</span>
            {selectedRecord.branched_from && <span>Branched from: {selectedRecord.branched_from}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => branchScenario(selectedRecord.id)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-black font-semibold py-2 px-4 rounded-full transition-transform active:scale-95"
            aria-label="Branch Scenario"
          >
            <GitBranch size={18} />
            Branch
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6">
          <h3 className="text-lg font-semibold border-b border-zinc-800 pb-2">Flavor Profile Mutation</h3>
          {Object.entries(editProfile).map(([key, value]) => (
            <div key={key} className="space-y-2">
              <div className="flex justify-between">
                <label className="capitalize text-sm font-medium text-zinc-300">{key}</label>
                <span className="text-sm font-mono">{value}/10</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={value}
                onChange={(e) => handleSliderChange(key as keyof typeof editProfile, parseInt(e.target.value))}
                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-primary"
                aria-label={`Adjust ${key}`}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end gap-3">
        <button
          onClick={() => setEditProfile(selectedRecord.profile)}
          className="px-4 py-2 rounded-full font-semibold hover:bg-zinc-800 transition-colors"
        >
          Reset
        </button>
        <button
          onClick={handleSave}
          disabled={JSON.stringify(editProfile) === JSON.stringify(selectedRecord.profile)}
          className="flex items-center gap-2 bg-white hover:bg-zinc-200 text-black font-semibold py-2 px-4 rounded-full transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={18} />
          Save Changes
        </button>
      </div>
    </div>
  );
}
