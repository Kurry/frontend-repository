import { MASTER_SLOTS } from '../lib/render';
import { useStore } from '../store/useStore';
export function MasterRibbon() {
  const { slot4Source, dropPhrase, previewState, repairEnum, setRepairEnum, confirmRepair } = useStore();
  return (
    <div className="flex flex-col gap-4 p-4 border-b">
      <h2 className="text-xl font-bold">Master Ribbon</h2>
      <div className="flex gap-2 w-full overflow-x-auto">
        {MASTER_SLOTS.map(slot => (
          <div key={slot.id} className="min-w-[150px] p-4 border rounded bg-gray-50"
               onDragOver={e => e.preventDefault()} onDrop={() => { if (slot.id === 'SLOT-04') dropPhrase(); }}>
            <div className="font-mono text-sm">{slot.id}</div>
            <div className="font-medium text-sm mb-2">{slot.intendedText}</div>
            {slot.id === 'SLOT-04' && <div className="mt-2 text-xs">Source: {slot4Source}</div>}
          </div>
        ))}
      </div>
      {previewState === 'confirm_repair' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Confirm Repair</h3>
            <label className="flex items-center gap-2 mb-2 cursor-pointer">
              <input type="radio" checked={repairEnum === 'pad-symmetric'} onChange={() => setRepairEnum('pad-symmetric')} /> Symmetric Room Tone (+1600 each side)
            </label>
            <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={confirmRepair}>Confirm</button>
          </div>
        </div>
      )}
    </div>
  );
}
