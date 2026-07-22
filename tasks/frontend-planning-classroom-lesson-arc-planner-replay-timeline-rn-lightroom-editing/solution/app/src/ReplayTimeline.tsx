import { useState } from 'react';
import type { LessonBlock, AppHistoryEvent, LessonStatus } from './types';

interface Props {
  selectedRecord: LessonBlock | null;
  history: AppHistoryEvent[];
  onUpdate: (id: string, updates: Partial<LessonBlock>) => void;
  onUndo: () => void;
}

export function ReplayTimeline({ selectedRecord, history, onUpdate, onUndo }: Props) {
  const [sliderIndex, setSliderIndex] = useState<number>(-1);
  const [errorMsg, setErrorMsg] = useState('');

  if (!selectedRecord) {
    return <div className="p-4 bg-gray-50 border rounded text-gray-500 text-sm text-center">Select a record to view its timeline and edit</div>;
  }

  const recordHistory = history.filter(h => h.recordId === selectedRecord.id && h.type === 'MUTATE_RECORD');

  const handleRestore = () => {
    if (sliderIndex === -1 || sliderIndex >= recordHistory.length) return;
    const pastState = recordHistory[sliderIndex].newState;
    if (pastState) {
       onUpdate(selectedRecord.id, pastState);
       setSliderIndex(-1); // reset after restore
    }
  };

  const handleEdit = (field: string, value: string | number) => {
    if (field === 'title' && !(value as string).trim()) {
       setErrorMsg('Title cannot be empty');
       return;
    }
    if (field === 'duration' && (isNaN(Number(value)) || Number(value) < 0)) {
       setErrorMsg('Duration must be a positive number');
       return;
    }

    setErrorMsg('');
    onUpdate(selectedRecord.id, { [field]: value });
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded shadow-sm bg-white">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold">Replay Timeline & Editor</h3>
        <button onClick={onUndo} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm transition-colors">Undo Last Global Mutation</button>
      </div>

      <div className="flex flex-col gap-2">
         {errorMsg && <p className="text-red-500 text-xs">{errorMsg}</p>}
         <input
           type="text"
           value={selectedRecord.title}
           onChange={e => handleEdit('title', e.target.value)}
           className="border p-2 rounded text-sm w-full"
         />
         <input
           type="number"
           value={selectedRecord.duration}
           onChange={e => handleEdit('duration', parseInt(e.target.value, 10))}
           className="border p-2 rounded text-sm w-full"
         />
         <select
           value={selectedRecord.status}
           onChange={e => handleEdit('status', e.target.value as LessonStatus)}
           className="border p-2 rounded text-sm w-full"
         >
            <option value="empty">empty</option>
            <option value="draft">draft</option>
            <option value="ready">ready</option>
            <option value="changed">changed</option>
            <option value="archived">archived</option>
         </select>
      </div>

      {recordHistory.length > 0 && (
         <div className="mt-4 border-t pt-4">
           <h4 className="text-sm font-medium mb-2">Timeline Scrub</h4>
           <input
             type="range"
             min="0"
             max={recordHistory.length - 1}
             value={sliderIndex === -1 ? recordHistory.length - 1 : sliderIndex}
             onChange={e => setSliderIndex(parseInt(e.target.value, 10))}
             className="w-full"
           />
           <div className="text-xs text-gray-500 flex justify-between mt-1">
             <span>Oldest</span>
             <span>Current</span>
           </div>

           {sliderIndex !== -1 && sliderIndex < recordHistory.length - 1 && (
             <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded flex justify-between items-center">
               <span className="text-sm text-yellow-800">Previewing past state</span>
               <button onClick={handleRestore} className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors">Restore Checkpoint</button>
             </div>
           )}
         </div>
      )}
    </div>
  );
}
