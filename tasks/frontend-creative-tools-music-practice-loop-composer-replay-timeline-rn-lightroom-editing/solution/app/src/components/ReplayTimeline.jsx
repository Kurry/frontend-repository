import React, { useRef, useState, useEffect } from 'react';

export default function ReplayTimeline({ record, onUpdate, stateStatus, setStateStatus }) {
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localCheckpoint, setLocalCheckpoint] = useState(record?.checkpoint || 0);

  useEffect(() => {
    if (record) {
      setLocalCheckpoint(record.checkpoint);
      if (record.status === 'conflict') {
        setStateStatus('conflict');
      } else {
        setStateStatus(record.checkpoint !== record.originalCheckpoint ? 'changed' : 'idle');
      }
    } else {
      setStateStatus('idle');
    }
  }, [record, setStateStatus]);

  if (!record) {
    return (
      <div className="flex-1 flex items-center justify-center bg-card rounded-xl border border-border shadow-sm text-muted-foreground p-8 text-center">
        Select a segment to view its replay timeline and linked summary.
      </div>
    );
  }

  const handleInteraction = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    let percent = x / rect.width; // Allow out of bounds for conflict testing

    // Calculate precise time
    const newCheckpoint = Math.round(percent * record.duration);
    setLocalCheckpoint(newCheckpoint);

    if (newCheckpoint < 0 || newCheckpoint > record.duration) {
      setStateStatus('conflict');
    } else {
      setStateStatus('changed');
    }
  };

  const handleStart = (e) => {
    setIsDragging(true);
    handleInteraction(e);
  };

  const handleMove = (e) => {
    if (!isDragging) return;
    handleInteraction(e);
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    // Bounds validation for conflict
    if (localCheckpoint < 0 || localCheckpoint > record.duration) {
      setStateStatus('conflict');
      // DO NOT update state on invalid bounds! Preserves prior state as requested.
      return;
    }

    setStateStatus('resolved');
    // Commit the mutation
    onUpdate(record.id, {
      checkpoint: localCheckpoint,
      status: 'changed',
      // Store original to allow undo parity visual
      originalCheckpoint: record.originalCheckpoint !== undefined ? record.originalCheckpoint : record.checkpoint
    });
  };

  const handleKeyDown = (e) => {
    let newCheckpoint = localCheckpoint;
    if (e.key === 'ArrowRight') {
      newCheckpoint = Math.min(record.duration, localCheckpoint + 1);
    } else if (e.key === 'ArrowLeft') {
      newCheckpoint = Math.max(0, localCheckpoint - 1);
    } else if (e.key === 'Home') {
      newCheckpoint = 0;
    } else if (e.key === 'End') {
      newCheckpoint = record.duration;
    } else {
      return;
    }
    e.preventDefault();
    setLocalCheckpoint(newCheckpoint);
    setStateStatus('changed');
    onUpdate(record.id, {
      checkpoint: newCheckpoint,
      status: 'changed',
      originalCheckpoint: record.originalCheckpoint !== undefined ? record.originalCheckpoint : record.checkpoint
    });
  };

  const percent = record.duration > 0 ? (Math.max(0, Math.min(1, localCheckpoint / record.duration))) * 100 : 0;

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex-1 bg-card rounded-xl border border-border shadow-sm flex flex-col p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-foreground truncate">{record.name || 'Untitled Segment'}</h2>
          <div className="flex items-center gap-3 text-sm">
            <span className="font-mono bg-muted px-2 py-1 rounded text-muted-foreground">
              {String(Math.max(0, Math.floor(localCheckpoint / 60))).padStart(2, '0')}:{String(Math.max(0, localCheckpoint % 60)).padStart(2, '0')}
            </span>
            <span className="text-muted-foreground">/</span>
            <span className="font-mono bg-muted px-2 py-1 rounded text-muted-foreground">
              {String(Math.floor(record.duration / 60)).padStart(2, '0')}:{String(record.duration % 60).padStart(2, '0')}
            </span>
          </div>
        </div>

        <div className="relative mt-auto mb-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex justify-between">
            <span>Timeline</span>
            <span className={`transition-colors ${stateStatus === 'conflict' ? 'text-destructive' : stateStatus === 'changed' ? 'text-primary' : ''}`}>
              State: {stateStatus}
            </span>
          </div>

          <div
            ref={containerRef}
            className="h-16 bg-muted/50 rounded-lg relative cursor-pointer overflow-visible border border-border group"
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            role="slider"
            tabIndex={0}
            aria-valuemin={0}
            aria-valuemax={record.duration}
            aria-valuenow={localCheckpoint}
            aria-label="Replay timeline scrubber"
            onKeyDown={handleKeyDown}
          >
            <div className="absolute inset-0 flex items-end px-1 gap-0.5 opacity-30 overflow-hidden">
              {Array.from({length: 40}).map((_, i) => (
                <div key={i} className="flex-1 bg-foreground/40 rounded-t-sm" style={{height: `${20 + Math.random() * 80}%`}}></div>
              ))}
            </div>

            <div
              className="absolute top-0 left-0 bottom-0 bg-primary/20 border-r-2 border-primary transition-all duration-75 ease-out"
              style={{ width: `${percent}%` }}
            ></div>

            <div
              className={`absolute top-0 bottom-0 w-1 ${stateStatus === 'conflict' ? 'bg-destructive shadow-[0_0_8px_rgba(var(--destructive),0.8)]' : 'bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]'} transition-all duration-75 ease-out`}
              style={{ left: `${percent}%`, transform: 'translateX(-50%)' }}
            >
              <div className={`absolute -top-3 -translate-x-1/2 w-3 h-3 rotate-45 ${stateStatus === 'conflict' ? 'bg-destructive' : 'bg-primary'}`}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm p-4 text-sm">
        <h3 className="font-semibold mb-2">Derived Summary</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
            <div className="text-muted-foreground text-xs uppercase mb-1">Status</div>
            <div className="font-medium capitalize">{record.status}</div>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
            <div className="text-muted-foreground text-xs uppercase mb-1">Duration</div>
            <div className="font-medium font-mono">{record.duration}s</div>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
            <div className="text-muted-foreground text-xs uppercase mb-1">Current Checkpoint</div>
            <div className={`font-medium font-mono transition-colors ${stateStatus === 'conflict' ? 'text-destructive' : 'text-primary'}`}>{localCheckpoint}s</div>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
            <div className="text-muted-foreground text-xs uppercase mb-1">Remaining</div>
            <div className="font-medium font-mono">{Math.max(0, record.duration - localCheckpoint)}s</div>
          </div>
        </div>
      </div>
    </div>
  );
}
