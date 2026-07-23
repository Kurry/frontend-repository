import { useStore } from '../store/useStore';
import { exportPacket } from '../lib/export';
export function ProofRail() {
  useStore();
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Review & Proof</h2>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-slate-800 text-white rounded" onClick={exportPacket}>Export Packet (ZIP)</button>
        </div>
      </div>
    </div>
  );
}
