import { useEffect, useState } from "react";
import { useStore } from "../store";
import type { FlavorProfile, DomainStatus } from '../store';
import { Archive, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function FlavorComponentEditor() {
  const { records, selectedRecordId, updateRecord, deleteRecord, archiveRecord, editorMode } = useStore();
  const record = records.find(r => r.id === selectedRecordId);

  // Local state for editing fields with validation
  const [localName, setLocalName] = useState('');
  const [localDetails, setLocalDetails] = useState('');
  const [localStatus, setLocalStatus] = useState<DomainStatus>('draft');
  const [localProfile, setLocalProfile] = useState<FlavorProfile>({ sweetness: 50, acidity: 50, saltiness: 50, bitterness: 50, umami: 50 });
  const [errorMsg, setErrorMsg] = useState('');

  // Sync with record when selection changes or record updates from external (like undo)
  useEffect(() => {
    if (record) {
      setLocalName(record.name);
      setLocalDetails(record.details);
      setLocalStatus(record.status);
      setLocalProfile(record.profile);
      setErrorMsg('');
    }
  }, [record]);

  if (!record) return null;

  const handleUpdate = () => {
    // Validate bounds
    if (!localName.trim()) {
      setErrorMsg('Name is required. Reverting to prior valid state.');
      setLocalName(record.name);
      return;
    }
    const profileVals = Object.values(localProfile);
    if (profileVals.some(v => v < 0 || v > 100)) {
      setErrorMsg('Profile values must be between 0 and 100. Exact field boundaries are accepted while adjacent out-of-range values are rejected.');
      setLocalProfile(record.profile);
      return;
    }

    setErrorMsg('');
    updateRecord(record.id, {
      name: localName,
      details: localDetails,
      status: localStatus,
      profile: localProfile
    });
  };

  const handleProfileChange = (key: keyof FlavorProfile, value: string) => {
    const num = parseInt(value, 10);
    // Allowing intermediate invalid states during typing, will correct on blur/update
    setLocalProfile(prev => ({ ...prev, [key]: isNaN(num) ? 0 : num }));
  };

  const isReplay = editorMode === 'replay';

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            {isReplay ? (
              <span className="text-amber-400">Replaying Checkpoint</span>
            ) : (
              'Edit Component'
            )}
          </h2>
          {errorMsg && <p className="text-red-400 text-sm mt-2">{errorMsg}</p>}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => archiveRecord(record.id)}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-700 rounded transition-colors"
            title="Archive"
            disabled={isReplay}
          >
            <Archive size={18} />
          </button>
          <button
            onClick={() => deleteRecord(record.id)}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors"
            title="Delete"
            disabled={isReplay}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Name</label>
            <input
              type="text"
              value={localName}
              onChange={e => setLocalName(e.target.value)}
              onBlur={handleUpdate}
              disabled={isReplay}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Status</label>
            <select
              value={localStatus}
              onChange={e => {
                setLocalStatus(e.target.value as DomainStatus);
                // force update immediately on select
                updateRecord(record.id, { status: e.target.value as DomainStatus });
              }}
              disabled={isReplay}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="changed">Changed</option>
              <option value="archived">Archived</option>
              <option value="empty">Empty</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Details</label>
            <textarea
              value={localDetails}
              onChange={e => setLocalDetails(e.target.value)}
              onBlur={handleUpdate}
              disabled={isReplay}
              rows={4}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 resize-none"
            />
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-sm font-medium text-slate-400 mb-4">Flavor Profile (0-100)</h3>
          {(['sweetness', 'acidity', 'saltiness', 'bitterness', 'umami'] as const).map(key => (
            <div key={key} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="capitalize text-slate-300">{key}</span>
                <span className="text-slate-400 font-mono w-8 text-right">{localProfile[key]}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={localProfile[key]}
                onChange={e => {
                  handleProfileChange(key, e.target.value);
                }}
                onMouseUp={handleUpdate}
                onTouchEnd={handleUpdate}
                onKeyUp={(e) => {
                  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                    handleUpdate();
                  }
                }}
                disabled={isReplay}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50 accent-blue-500"
              />
            </div>
          ))}

          <div className="mt-8">
             {/* Visual summary of the profile */}
             <div className="h-16 flex items-end gap-1 px-4 py-2 bg-slate-900 rounded border border-slate-700 overflow-hidden">
                {(['sweetness', 'acidity', 'saltiness', 'bitterness', 'umami'] as const).map(key => (
                  <motion.div
                    key={key}
                    className="flex-1 bg-blue-500/50 hover:bg-blue-400 transition-colors rounded-t"
                    initial={false}
                    animate={{ height: `${Math.max(2, localProfile[key])}%` }}
                    transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                    title={`${key}: ${localProfile[key]}`}
                  />
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
