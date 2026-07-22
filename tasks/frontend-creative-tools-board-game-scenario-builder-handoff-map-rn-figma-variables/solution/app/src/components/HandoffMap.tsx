import React, { type KeyboardEvent } from 'react';
import { useStore, HANDOFF_OWNERS } from '../store';
import { motion } from 'framer-motion';

export const HandoffMap: React.FC = () => {
  const { records, selectedRecordId, connectOwner } = useStore();
  const selectedRecord = records.find((r) => r.id === selectedRecordId);

  if (!selectedRecordId) {
    return (
      <div className="flex-1 flex items-center justify-center border rounded-lg bg-muted/50 h-full p-4">
        <p className="text-muted-foreground">Select a record to view Handoff Map</p>
      </div>
    );
  }

  if (!selectedRecord) return null;

  const handleConnect = (ownerId: string | null) => {
    connectOwner(selectedRecordId, ownerId);
  };

  const handleKeyDown = (e: KeyboardEvent, ownerId: string | null) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleConnect(ownerId);
    }
  };

  return (
    <div className="flex flex-col h-full border rounded-lg p-6 bg-card shadow-sm">
      <h2 className="text-lg font-semibold mb-4 text-card-foreground">Handoff Map</h2>
      <div className="flex-1 flex flex-col items-center justify-center gap-8 relative overflow-hidden">

        {/* Record Node */}
        <motion.div
          layoutId={`record-${selectedRecord.id}`}
          className="p-4 rounded-xl border-2 shadow-md bg-background w-64 z-10"
          style={{ borderColor: selectedRecord.ownerId ? '#10b981' : '#e5e7eb' }}
        >
          <div className="text-sm font-mono text-muted-foreground mb-1">{selectedRecord.id}</div>
          <div className="font-medium text-foreground truncate">{selectedRecord.title}</div>
          <div className="text-sm text-muted-foreground mt-2">Status: {selectedRecord.status}</div>
        </motion.div>

        {/* Connection Lines Container */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-0">
            {/* We could render SVG lines here for fidelity, but motion and clear states are key. */}
        </div>

        {/* Owners */}
        <div className="flex gap-4 w-full justify-center flex-wrap z-10">
          <button
            onClick={() => handleConnect(null)}
            onKeyDown={(e) => handleKeyDown(e, null)}
            className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
              selectedRecord.ownerId === null ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-muted-foreground'
            } focus:outline-none focus:ring-2 focus:ring-ring`}
            aria-label="Unassign"
          >
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center mb-2">
              <span className="text-xl">?</span>
            </div>
            <span className="text-sm font-medium">Unassigned</span>
          </button>

          {HANDOFF_OWNERS.map((owner) => {
            const isSelected = selectedRecord.ownerId === owner.id;
            return (
              <button
                key={owner.id}
                onClick={() => handleConnect(owner.id)}
                onKeyDown={(e) => handleKeyDown(e, owner.id)}
                className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                  isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-muted-foreground'
                } focus:outline-none focus:ring-2 focus:ring-ring`}
                aria-label={`Connect to ${owner.name}`}
              >
                <div
                  className="w-12 h-12 rounded-full mb-2 shadow-sm border-2"
                  style={{
                    backgroundColor: owner.avatarColor,
                    borderColor: isSelected ? '#10b981' : 'transparent'
                  }}
                />
                <span className="text-sm font-medium">{owner.name}</span>
                <span className="text-xs text-muted-foreground">{owner.role}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
