import React, { useEffect, useRef } from 'react';
import { useDrumStore } from '../store/useDrumStore';
import { Play, Square, Plus, Volume2, VolumeX, Mic, MicOff } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

export const DrumGrid: React.FC = () => {
  const {
    pattern,
    isPlaying,
    currentStep,
    togglePlay,
    setCurrentStep,
    toggleStep,
    addTrack,
    toggleMute,
    toggleSolo,
    setTempo,
    setSteps,
  } = useDrumStore();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const shouldReduceMotion = useReducedMotion();

  // Playback engine
  useEffect(() => {
    if (isPlaying) {
      const msPerBeat = 60000 / pattern.tempo;
      const msPerStep = msPerBeat / 4; // 16th notes

      timerRef.current = setInterval(() => {
        setCurrentStep((useDrumStore.getState().currentStep + 1) % pattern.steps);
      }, msPerStep);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, pattern.tempo, pattern.steps, setCurrentStep]);

  const anySolo = pattern.tracks.some((t) => t.solo);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 text-white overflow-x-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-xl md:text-3xl font-bold truncate">{pattern.name}</h2>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="tempo" className="text-sm">Tempo</label>
            <input
              id="tempo"
              type="number"
              min={20}
              max={300}
              value={pattern.tempo}
              onChange={(e) => setTempo(parseInt(e.target.value, 10) || 120)}
              className="bg-gray-800 p-2 rounded w-20 text-center focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="steps" className="text-sm">Steps</label>
            <select
              id="steps"
              value={pattern.steps}
              onChange={(e) => setSteps(parseInt(e.target.value, 10))}
              className="bg-gray-800 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value={8}>8</option>
              <option value={16}>16</option>
              <option value={32}>32</option>
            </select>
          </div>
          <button
            onClick={togglePlay}
            className="p-3 bg-blue-600 rounded-full hover:bg-blue-500 transition-colors focus:ring-2 focus:ring-blue-400 outline-none shadow-lg"
            aria-label={isPlaying ? 'Stop playback' : 'Start playback'}
          >
            {isPlaying ? <Square size={20} /> : <Play size={20} className="ml-1" />}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 min-w-[768px]">
        {/* Step Indicators */}
        <div className="flex">
          <div className="w-32 md:w-48 flex-shrink-0" />
          <div className="flex-1 flex gap-1 px-1">
            {Array.from({ length: pattern.steps }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-2 rounded-t transition-colors duration-75 ${
                  currentStep === i ? 'bg-blue-400' : 'bg-gray-800'
                }`}
                role="progressbar"
                aria-valuenow={currentStep === i ? 100 : 0}
                aria-label={`Step ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Tracks */}
        {pattern.tracks.map((track) => (
          <div key={track.id} className="flex gap-2 md:gap-4 items-center bg-gray-800 p-2 rounded">
            <div className="w-32 md:w-48 flex-shrink-0 flex items-center justify-between">
              <span className="font-medium text-sm md:text-base truncate" title={track.instrument}>{track.instrument}</span>
              <div className="flex gap-1 md:gap-2">
                <button
                  onClick={() => toggleMute(track.id)}
                  className={`p-1.5 rounded focus:ring-2 focus:ring-gray-400 outline-none transition-colors ${track.muted ? 'bg-red-900/50 text-red-400 hover:bg-red-900/70' : 'hover:bg-gray-700'}`}
                  aria-pressed={track.muted}
                  aria-label={`Mute ${track.instrument}`}
                >
                  {track.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
                <button
                  onClick={() => toggleSolo(track.id)}
                  className={`p-1.5 rounded focus:ring-2 focus:ring-gray-400 outline-none transition-colors ${track.solo ? 'bg-yellow-900/50 text-yellow-400 hover:bg-yellow-900/70' : 'hover:bg-gray-700'}`}
                  aria-pressed={track.solo}
                  aria-label={`Solo ${track.instrument}`}
                >
                  {track.solo ? <Mic size={14} /> : <MicOff size={14} />}
                </button>
              </div>
            </div>

            <div className="flex-1 flex gap-1">
              {track.steps.map((step, i) => {
                const isActive = step.active;
                const isCurrent = currentStep === i;
                const isTrackAudible = track.solo || (!anySolo && !track.muted);

                return (
                  <motion.div
                    key={step.id}
                    className="flex-1"
                    whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                  >
                    <button
                      onClick={() => toggleStep(track.id, i)}
                      className={`w-full h-10 md:h-12 rounded border border-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-inset ${
                        isActive
                          ? isCurrent
                            ? 'bg-blue-300'
                            : 'bg-blue-500'
                          : isCurrent
                          ? 'bg-gray-600'
                          : 'bg-gray-800'
                      } ${!isTrackAudible && isActive ? 'opacity-40' : ''}`}
                      aria-pressed={isActive}
                      aria-label={`Toggle step ${i + 1} for ${track.instrument}`}
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}

        <button
          onClick={() => {
            const inst = prompt('Instrument name?');
            if (inst) addTrack(inst);
          }}
          className="mt-4 flex items-center gap-2 px-4 py-2 border border-gray-700 rounded hover:bg-gray-800 self-start text-gray-300 hover:text-white transition-colors focus:ring-2 focus:ring-gray-400 outline-none"
        >
          <Plus size={16} /> Add Track
        </button>
      </div>
    </div>
  );
};
