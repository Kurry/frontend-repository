import React, { useRef, useEffect, useState } from 'react';
import { useGlobalState, updateProjectState, updateCue } from '../store';

const Timeline = () => {
  const [project] = useGlobalState('project');
  const [ui] = useGlobalState('ui');
  const videoRef = useRef(null);

  const { logicalClock, playbackState, playbackRate, shots, cues, mediaDuration } = project;

  useEffect(() => {
    if (videoRef.current) {
      if (Math.abs(videoRef.current.currentTime - logicalClock / 1000) > 0.1) {
        videoRef.current.currentTime = logicalClock / 1000;
      }
      videoRef.current.playbackRate = playbackRate;

      if (playbackState === 'playing' && videoRef.current.paused) {
        videoRef.current.play().catch(e => console.error(e));
      } else if (playbackState === 'paused' && !videoRef.current.paused) {
        videoRef.current.pause();
      }
    }
  }, [logicalClock, playbackState, playbackRate]);

  useEffect(() => {
    let animationFrame;
    if (playbackState === 'playing') {
      const updateClock = () => {
        if (videoRef.current) {
          updateProjectState({ logicalClock: videoRef.current.currentTime * 1000 });
        }
        animationFrame = requestAnimationFrame(updateClock);
      };
      animationFrame = requestAnimationFrame(updateClock);
    }
    return () => cancelAnimationFrame(animationFrame);
  }, [playbackState]);

  const handleSeek = (time) => {
    updateProjectState({ logicalClock: Math.max(0, Math.min(time, mediaDuration)) });
  };

  const handleCueDrag = (cueId, newStart, newEnd) => {
    const duration = newEnd - newStart;
    if (duration >= 500 && duration <= 7000 && newStart >= 0 && newEnd <= mediaDuration) {
      updateCue(cueId, () => ({ start: newStart, end: newEnd }));
    }
  };

  const pxPerMs = 0.05; // 1 ms = 0.05px => 96000ms = 4800px

  return (
    <div className="flex flex-col border-b border-gray-700 bg-gray-900 text-white overflow-hidden relative">
      {/* Video Preview */}
      <div className="h-64 bg-black flex justify-center items-center relative overflow-hidden shrink-0">
        <video
          ref={videoRef}
          src="https://upload.wikimedia.org/wikipedia/commons/transcoded/f/f1/Sintel_movie_4K.webm/Sintel_movie_4K.webm.480p.vp9.webm" // Fallback deterministic vp9 webm
          className="h-full object-contain pointer-events-none"
          muted
        />
        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            {cues.filter(c => logicalClock >= c.start && logicalClock <= c.end).map(c => (
              <div key={c.id} className="bg-black/80 px-4 py-2 rounded text-xl text-center max-w-[80%] break-words shadow-lg border border-gray-600">
                {c.styling?.speaker && <span className="font-bold text-gray-300 mr-2">{c.speaker}:</span>}
                <span className={c.styling?.italics ? 'italic' : ''}>{c.text}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Transport controls */}
      <div className="flex items-center gap-4 p-2 bg-gray-800 shrink-0">
         <button onClick={() => updateProjectState({ playbackState: playbackState === 'playing' ? 'paused' : 'playing' })} className="px-3 py-1 bg-blue-600 rounded">
            {playbackState === 'playing' ? 'Pause' : 'Play'}
         </button>
         <button onClick={() => updateProjectState({ playbackRate: playbackRate === 1 ? 1.5 : (playbackRate === 1.5 ? 0.5 : 1) })} className="px-3 py-1 bg-gray-700 rounded">
            {playbackRate}x
         </button>
         <span>{Math.floor(logicalClock / 1000)}.{String(logicalClock % 1000).padStart(3, '0')} / {Math.floor(mediaDuration / 1000)}s</span>
      </div>

      {/* Timeline Scroll Area */}
      <div className="overflow-x-auto overflow-y-hidden h-64 relative scroll-smooth flex-1" onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const scrollLeft = e.currentTarget.scrollLeft;
        const x = e.clientX - rect.left + scrollLeft;
        handleSeek(x / pxPerMs);
      }}>
        <div className="relative h-full" style={{ width: mediaDuration * pxPerMs }}>

          {/* Shots Lane */}
          <div className="absolute top-0 h-4 w-full flex opacity-50 pointer-events-none">
            {shots.map(s => (
              <div key={s.id} className="absolute h-full border-r border-gray-500 bg-gray-800" style={{ left: s.start * pxPerMs, width: (s.end - s.start) * pxPerMs }} />
            ))}
          </div>

          {/* Cues Lanes */}
          {[0, 1, 2].map(laneIdx => (
             <div key={laneIdx} className="absolute w-full h-12 border-b border-gray-700 pointer-events-none" style={{ top: 20 + laneIdx * 50 }}>
                {cues.filter(c => c.lane === laneIdx).map(c => (
                  <div
                    key={c.id}
                    className="absolute h-10 top-1 bg-blue-500/80 border border-blue-300 rounded px-1 text-xs truncate cursor-ew-resize pointer-events-auto"
                    style={{ left: c.start * pxPerMs, width: (c.end - c.start) * pxPerMs }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        const tokenId = e.dataTransfer.getData("text/plain");
                        if (!tokenId) return;
                        updateCue(c.id, () => ({ tokens: [...c.tokens, tokenId] }));
                    }}
                    onPointerDown={(e) => {
                       e.stopPropagation();
                       const el = e.currentTarget;
                       const startX = e.clientX;
                       const startCueStart = c.start;
                       const startCueEnd = c.end;

                       const rect = el.getBoundingClientRect();
                       const isLeftEdge = (e.clientX - rect.left) < 10;
                       const isRightEdge = (rect.right - e.clientX) < 10;

                       const onMove = (ev) => {
                         const dxMs = (ev.clientX - startX) / pxPerMs;
                         if (isLeftEdge) handleCueDrag(c.id, startCueStart + dxMs, startCueEnd);
                         else if (isRightEdge) handleCueDrag(c.id, startCueStart, startCueEnd + dxMs);
                         else handleCueDrag(c.id, startCueStart + dxMs, startCueEnd + dxMs);
                       };
                       const onUp = () => {
                         window.removeEventListener('pointermove', onMove);
                         window.removeEventListener('pointerup', onUp);
                       };
                       window.addEventListener('pointermove', onMove);
                       window.addEventListener('pointerup', onUp);
                    }}
                  >
                    {c.text}
                  </div>
                ))}
             </div>
          ))}

          {/* Playhead */}
          <div className="absolute top-0 bottom-0 w-px bg-red-500 z-50 pointer-events-none" style={{ left: logicalClock * pxPerMs }}>
            <div className="w-3 h-3 bg-red-500 rounded-full -ml-1.5 -mt-1" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;
