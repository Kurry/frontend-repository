import React from 'react';
import { useGlobalState, updateProjectState } from '../store';

const Transcript = () => {
  const [project] = useGlobalState('project');
  const [ui] = useGlobalState('ui');

  const { tokens, cues, logicalClock } = project;

  // Identify bounded vs unbounded tokens
  const boundTokenIds = new Set(cues.flatMap(c => c.tokens));

  const handleTokenClick = (time) => {
    updateProjectState({ logicalClock: time });
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 border-r border-gray-700 w-64 overflow-y-auto">
      <div className="p-4 bg-gray-900 border-b border-gray-700 font-bold sticky top-0">Transcript</div>
      <div className="p-4 flex flex-wrap gap-1">
        {tokens.map(token => {
          const isBound = boundTokenIds.has(token.id);
          const isCurrent = logicalClock >= token.start && logicalClock < token.start + 750; // Approximated
          const isLowConf = token.confidence < 0.8;

          return (
             <span
               key={token.id}
               onClick={() => handleTokenClick(token.start)} draggable onDragStart={(e) => { e.dataTransfer.setData("text/plain", token.id); }}
               className={`
                 cursor-pointer px-1 py-0.5 rounded text-sm transition-colors
                 ${isBound ? 'text-gray-200' : 'text-gray-500'}
                 ${isCurrent ? 'bg-blue-600/50' : 'hover:bg-gray-700'}
                 ${isLowConf ? 'border-b border-dashed border-red-500' : ''}
               `}
               title={`Confidence: ${Math.round(token.confidence * 100)}%`}
             >
               {token.text}
             </span>
          );
        })}
      </div>
    </div>
  );
};

export default Transcript;
