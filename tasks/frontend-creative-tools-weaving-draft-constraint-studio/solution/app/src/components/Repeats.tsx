import { useState } from 'react';
import { useWeavingStore } from '../store';
import { RepeatDef } from '../types';

export function RepeatEditor({ store }: { store: ReturnType<typeof useWeavingStore> }) {
  const { state, dispatch } = store;
  const [type, setType] = useState<"threading" | "treadling">("threading");
  const [start, setStart] = useState<number>(0);
  const [end, setEnd] = useState<number>(3);
  const [operation, setOperation] = useState<RepeatDef["operation"]>("tile");

  const handleApply = () => {
    dispatch({
      type: 'ADD_REPEAT',
      repeat: {
        id: crypto.randomUUID(),
        type,
        start,
        end,
        operation
      }
    });
  };

  return (
    <div className="mt-8 p-4 bg-white border border-gray-200 rounded shadow-sm">
      <h3 className="text-sm font-semibold mb-4">Repeat Editor</h3>
      <div className="flex flex-col gap-2 text-sm">
        <label>
          Type:
          <select value={type} onChange={e => setType(e.target.value as any)} className="ml-2 border rounded p-1">
            <option value="threading">Threading</option>
            <option value="treadling">Treadling</option>
          </select>
        </label>
        <div className="flex gap-2">
          <label>Start: <input type="number" min={0} value={start} onChange={e => setStart(Number(e.target.value))} className="w-16 border p-1 rounded" /></label>
          <label>End: <input type="number" min={0} value={end} onChange={e => setEnd(Number(e.target.value))} className="w-16 border p-1 rounded" /></label>
        </div>
        <label>
          Operation:
          <select value={operation} onChange={e => setOperation(e.target.value as any)} className="ml-2 border rounded p-1">
            <option value="tile">Tile</option>
            <option value="mirror">Mirror</option>
            <option value="rotate">Rotate</option>
          </select>
        </label>
        <button onClick={handleApply} className="bg-green-600 text-white rounded px-3 py-1 mt-2 hover:bg-green-700">Apply Repeat</button>
      </div>
      {state.repeats.length > 0 && (
         <ul className="mt-4 border-t pt-2 space-y-1">
           {state.repeats.map(r => (
             <li key={r.id} className="text-xs text-gray-700">
                {r.operation} {r.type} [{r.start}-{r.end}]
             </li>
           ))}
         </ul>
      )}
    </div>
  )
}
