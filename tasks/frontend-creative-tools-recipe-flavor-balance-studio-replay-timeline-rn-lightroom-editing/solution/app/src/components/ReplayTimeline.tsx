import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { Play, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

export function ReplayTimeline() {
  const { records, selectedRecordId, scrubTimeline, restoreCheckpoint, editorMode, setEditorMode } = useStore();
  const record = records.find(r => r.id === selectedRecordId);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // If playing, automatically scrub through timeline
    if (!isPlaying || !record || record.checkpoints.length === 0) return;

    let currentIndex = record.checkpoints.findIndex(c => c.id === record.activeCheckpointId);
    if (currentIndex === -1) currentIndex = 0;

    const interval = setInterval(() => {
      currentIndex++;
      if (currentIndex >= record.checkpoints.length) {
        currentIndex = 0; // loop back or stop
        setIsPlaying(false);
        return;
      }
      const nextCheckpoint = record.checkpoints[currentIndex];
      scrubTimeline(record.id, nextCheckpoint.id);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, record, scrubTimeline]);

  if (!record) return null;

  const activeIndex = record.checkpoints.findIndex(c => c.id === record.activeCheckpointId);

  const handleScrub = (checkpointId: string) => {
    setIsPlaying(false);
    scrubTimeline(record.id, checkpointId);
    if (editorMode !== 'replay') {
      setEditorMode('replay');
    }
  };

  const handleRestore = () => {
    if (record.activeCheckpointId) {
      restoreCheckpoint(record.id, record.activeCheckpointId);
      setEditorMode('edit');
    }
  };

  const isLatest = activeIndex === record.checkpoints.length - 1;

  return (
    <div className="flex flex-col h-full bg-slate-800">
      <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900/50">
        <h3 className="font-semibold text-slate-200">Replay Timeline</h3>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded transition-colors"
            title={isPlaying ? "Pause" : "Play"}
          >
            <Play size={16} className={isPlaying ? "text-blue-400" : ""} />
          </button>

          {editorMode === 'replay' && !isLatest && (
            <button
              onClick={handleRestore}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-amber-900 bg-amber-400 hover:bg-amber-300 rounded transition-colors"
            >
              <RotateCcw size={16} />
              Restore Checkpoint
            </button>
          )}
          {editorMode === 'replay' && isLatest && (
             <button
             onClick={() => setEditorMode('edit')}
             className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded transition-colors"
           >
             <RotateCcw size={16} />
             Return to Edit
           </button>
          )}
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col justify-center">
        <div className="relative h-2 bg-slate-700 rounded-full" ref={containerRef}>
          {record.checkpoints.map((checkpoint, index) => {
            const progress = (index / Math.max(1, record.checkpoints.length - 1)) * 100;
            const isActive = checkpoint.id === record.activeCheckpointId;
            const isRestored = isActive && editorMode === 'edit';

            return (
              <div
                key={checkpoint.id}
                className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
                style={{ left: `${progress}%`, transform: `translate(-50%, -50%)` }}
              >
                <div
                  className={`w-6 h-6 rounded-full border-4 cursor-pointer transition-colors shadow-lg z-10 ${
                    isActive
                      ? 'border-blue-500 bg-white scale-125'
                      : 'border-slate-600 bg-slate-800 hover:border-slate-400'
                  }`}
                  onClick={() => handleScrub(checkpoint.id)}
                  title={new Date(checkpoint.timestamp).toLocaleTimeString()}
                />

                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-8 bg-slate-900 border border-slate-700 text-xs px-3 py-1.5 rounded text-slate-300 whitespace-nowrap shadow-xl z-20"
                  >
                    <div>{isRestored ? 'Current State' : 'Checkpoint'} {index + 1}</div>
                    <div className="text-slate-500 mt-0.5">{new Date(checkpoint.timestamp).toLocaleTimeString()}</div>
                  </motion.div>
                )}
              </div>
            );
          })}

          {/* Progress bar fill */}
          <div
            className="absolute top-0 left-0 h-full bg-blue-500 rounded-full opacity-50"
            style={{ width: `${(activeIndex / Math.max(1, record.checkpoints.length - 1)) * 100}%` }}
          />
        </div>

        <div className="mt-12 text-center text-sm text-slate-400 max-w-lg mx-auto">
          Scrub through the timeline to see previous states of this component.
          When replaying, the main editor reflects the historical state.
        </div>
      </div>
    </div>
  );
}
