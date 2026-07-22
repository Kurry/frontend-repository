import { useState } from 'react';
import { useStore } from '../store';
import { BinId } from '../lib/schema';

export function ExactUI() {
  const store = useStore();
  const [binId, setBinId] = useState("BIN-K3");
  const [real, setReal] = useState("2");
  const [imag, setImag] = useState("-2");

  const [noteTarget, setNoteTarget] = useState("BIN-K1");
  const [noteText, setNoteText] = useState("Locked reference establishes the conjugate target");

  const handleApply = () => {
    store.selectBin(binId as BinId);
    store.moveBinK3(Math.round(parseFloat(real) * 4), Math.round(parseFloat(imag) * 4), false);
    store.confirmMove("ExactUI");
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-white border rounded shadow">
      <h2 className="font-bold text-lg">Exact UI & Annotations</h2>
      <div className="flex gap-2 items-center">
        <label className="text-sm font-semibold">Bin ID</label>
        <select value={binId} onChange={e => setBinId(e.target.value)} className="border p-1">
          <option value="BIN-K0">BIN-K0</option>
          <option value="BIN-K1">BIN-K1</option>
          <option value="BIN-K2">BIN-K2</option>
          <option value="BIN-K3">BIN-K3</option>
        </select>
        <label className="text-sm font-semibold">Real</label>
        <input type="number" step="0.25" value={real} onChange={e => setReal(e.target.value)} className="border p-1 w-16" />
        <label className="text-sm font-semibold">Imag</label>
        <input type="number" step="0.25" value={imag} onChange={e => setImag(e.target.value)} className="border p-1 w-16" />
        <button onClick={handleApply} className="bg-blue-600 text-white px-2 py-1 rounded">Apply Move</button>
      </div>

      <div className="flex gap-2 items-center mt-2 border-t pt-2">
        <label className="text-sm font-semibold">Note Target</label>
        <select value={noteTarget} onChange={e => setNoteTarget(e.target.value)} className="border p-1">
          <option value="BIN-K0">BIN-K0</option>
          <option value="BIN-K1">BIN-K1</option>
          <option value="BIN-K2">BIN-K2</option>
          <option value="BIN-K3">BIN-K3</option>
        </select>
        <input type="text" value={noteText} onChange={e => setNoteText(e.target.value)} className="border p-1 flex-1" />
        <button onClick={() => store.addNote({targetId: noteTarget, actor: "Zia", text: noteText})} className="bg-green-600 text-white px-2 py-1 rounded">Add Note</button>
      </div>
    </div>
  );
}
