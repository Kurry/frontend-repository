import React from 'react';
import { useStore } from '../store';

export default function BatchExecution() {
  const { batch, startBatch, advanceBatch, abortBatch, deviateBatch, pieces, quarantinePiece, refirePiece } = useStore();

  const isFiring = batch.state !== 'idle' && batch.state !== 'completed' && batch.state !== 'aborted';

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-md">
      <h2 className="text-xl font-bold">Batch Execution</h2>

      <div className="flex justify-between items-center bg-gray-100 p-2 rounded">
          <span className="font-mono font-bold text-lg">State: {batch.state.toUpperCase()}</span>
          <span className="text-sm font-mono text-gray-500">CLK: {batch.logicalClock}</span>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
           className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
           onClick={startBatch}
           disabled={batch.state !== 'idle'}
        >
          Start Batch
        </button>
        <button
           className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
           onClick={advanceBatch}
           disabled={!isFiring}
        >
          Advance State
        </button>
        <button
           className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50"
           onClick={() => deviateBatch({ message: 'Sensor Dropout Detected' })}
           disabled={!isFiring}
        >
          Inject Deviation
        </button>
        <button
           className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
           onClick={abortBatch}
           disabled={!isFiring}
        >
          Abort
        </button>
      </div>

      <div className="flex flex-col gap-2 mt-4">
          <h3 className="font-semibold">Event Log</h3>
          <div className="h-32 overflow-y-auto bg-black text-green-400 font-mono text-xs p-2 rounded">
              {batch.events.map((e, idx) => (
                  <div key={idx}>[{idx}] {e.type} {e.data ? JSON.stringify(e.data) : ''}</div>
              ))}
              {batch.events.length === 0 && <span className="text-gray-500">Waiting for events...</span>}
          </div>
      </div>

      <div className="flex flex-col gap-2 mt-4">
        <h3 className="font-semibold">Results & Defect Recovery</h3>
        {batch.state === 'inspection' || batch.state === 'reconcile' || batch.state === 'aborted' ? (
          <div className="grid grid-cols-2 gap-2">
            {pieces.filter(p => p.status === 'firing' || p.status === 'quarantine').map(p => (
              <div key={p.id} className={`border p-2 rounded flex flex-col gap-1 ${p.status === 'quarantine' ? 'bg-red-50' : 'bg-gray-50'}`}>
                <span className="font-bold">{p.id}</span>
                <span className="text-xs">Status: {p.status}</span>
                {p.status === 'firing' && (
                  <button onClick={() => quarantinePiece(p.id)} className="text-xs bg-red-100 text-red-700 p-1 rounded hover:bg-red-200">Quarantine Defect</button>
                )}
                {p.status === 'quarantine' && (
                  <button onClick={() => refirePiece(p.id)} className="text-xs bg-blue-100 text-blue-700 p-1 rounded hover:bg-blue-200">Branch to Refire</button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-sm">Available during inspection/reconcile or upon abort.</div>
        )}
      </div>

    </div>
  );
}
