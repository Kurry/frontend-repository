import React, { useState } from 'react';
import { useAppStore } from '../store/store';

export const ImportDiagnostic: React.FC = () => {
  const { rawIntents, rawFills, loadFixtures, commitImports, repairIntent, repairFill } = useAppStore();
  const [error, setError] = useState('');

  if (rawIntents.length === 0 && rawFills.length === 0) {
    return (
      <div className="p-4">
        <h2 className="text-xl mb-4">Import Diagnostic</h2>
        <button className="bg-blue-500 text-white px-4 py-2" onClick={loadFixtures}>Load Fixtures</button>
      </div>
    );
  }

  const handleCommit = () => {
    const success = commitImports();
    if (!success) {
      setError('Commit failed. Please repair invalid schema data.');
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">Repair & Map</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}

      <div className="flex gap-4">
        <div className="flex-1 border p-2">
          <h3 className="font-bold">Intents</h3>
          <table className="w-full text-sm mt-2">
            <thead><tr><th>ID</th><th>Account</th><th>Symbol</th><th>Side</th><th>Qty</th></tr></thead>
            <tbody>
              {rawIntents.map(i => (
                <tr key={i.id}>
                  <td>{i.id}</td>
                  <td><input value={i.accountId} onChange={e => repairIntent(i.id, 'accountId', e.target.value)} className="border w-full" /></td>
                  <td><input value={i.symbol} onChange={e => repairIntent(i.id, 'symbol', e.target.value)} className="border w-full" /></td>
                  <td>{i.side}</td>
                  <td><input value={i.quantity} onChange={e => repairIntent(i.id, 'quantity', e.target.value)} className="border w-full" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex-1 border p-2">
          <h3 className="font-bold">Fills</h3>
          <table className="w-full text-sm mt-2">
            <thead><tr><th>ID</th><th>Symbol</th><th>Side</th><th>Qty</th><th>Px</th></tr></thead>
            <tbody>
              {rawFills.map(f => (
                <tr key={f.id + f.time}>
                  <td><input value={f.id} onChange={e => repairFill(f.id, 'id', e.target.value)} className="border w-full" /></td>
                  <td><input value={f.sym_alias} onChange={e => repairFill(f.id, 'sym_alias', e.target.value)} className="border w-full" /></td>
                  <td><input value={f.side} onChange={e => repairFill(f.id, 'side', e.target.value)} className="border w-full" /></td>
                  <td><input value={f.qty} onChange={e => repairFill(f.id, 'qty', e.target.value)} className="border w-full" /></td>
                  <td><input value={f.px} onChange={e => repairFill(f.id, 'px', e.target.value)} className="border w-full" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button className="bg-green-500 text-white px-4 py-2 mt-4" onClick={handleCommit}>Commit</button>
    </div>
  );
};
