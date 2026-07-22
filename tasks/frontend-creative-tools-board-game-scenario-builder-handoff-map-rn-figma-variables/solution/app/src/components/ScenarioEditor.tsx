import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { type ScenarioStatus } from '../types';

export const ScenarioEditor: React.FC = () => {
  const { records, selectedRecordId, updateRecord, error } = useStore();
  const selectedRecord = records.find((r) => r.id === selectedRecordId);

  const [localTitle, setLocalTitle] = useState('');
  const [localDesc, setLocalDesc] = useState('');
  const [localStatus, setLocalStatus] = useState<ScenarioStatus>('empty');
  const [localDiff, setLocalDiff] = useState(1);
  const [localDur, setLocalDur] = useState(30);

  useEffect(() => {
    if (selectedRecord) {
      setLocalTitle(selectedRecord.title);
      setLocalDesc(selectedRecord.description);
      setLocalStatus(selectedRecord.status);
      setLocalDiff(selectedRecord.difficulty);
      setLocalDur(selectedRecord.duration);
    }
  }, [selectedRecord]);

  if (!selectedRecord) {
    return (
      <div className="flex-1 border rounded-lg p-6 bg-card shadow-sm flex flex-col justify-center items-center">
        <p className="text-muted-foreground">Select a record to edit details.</p>
      </div>
    );
  }

  const handleBlur = () => {
    updateRecord(selectedRecord.id, {
      title: localTitle,
      description: localDesc,
      status: localStatus,
      difficulty: localDiff,
      duration: localDur,
    });
  };

  return (
    <div className="flex-1 flex flex-col border rounded-lg p-6 bg-card shadow-sm overflow-y-auto">
      <h2 className="text-lg font-semibold mb-6">Inspector</h2>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded border border-destructive/20" aria-live="polite">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title (Required)</label>
          <input
            type="text"
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            onBlur={handleBlur}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={localDesc}
            onChange={(e) => setLocalDesc(e.target.value)}
            onBlur={handleBlur}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:outline-none min-h-[100px]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            value={localStatus}
            onChange={(e) => {
              setLocalStatus(e.target.value as ScenarioStatus);
              updateRecord(selectedRecord.id, { status: e.target.value as ScenarioStatus });
            }}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:outline-none"
          >
            <option value="empty">Empty</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="changed">Changed</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Difficulty (1-5)</label>
            <input
              type="number"
              min="1" max="5"
              value={localDiff}
              onChange={(e) => setLocalDiff(Number(e.target.value))}
              onBlur={handleBlur}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Duration (0-300 min)</label>
            <input
              type="number"
              min="0" max="300"
              value={localDur}
              onChange={(e) => setLocalDur(Number(e.target.value))}
              onBlur={handleBlur}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-4 border-t mt-6">
          <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Derived Summary</h3>
          <div className="bg-muted/50 p-3 rounded text-sm font-mono space-y-1">
            <p>ID: {selectedRecord.id}</p>
            <p>Owner: {selectedRecord.ownerId || 'Unassigned'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
