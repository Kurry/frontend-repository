import { useEffect, useRef } from 'react';
import { useStore } from '../store';

export function SessionLedger() {
  const { saveHealth, history, exportedAt, recoveryMessage, clearRecoveryMessage } = useStore();
  const msgRef = useRef(recoveryMessage);

  useEffect(() => {
    if (recoveryMessage && recoveryMessage !== msgRef.current) {
      msgRef.current = recoveryMessage;
      const timer = setTimeout(() => clearRecoveryMessage(), 5000);
      return () => clearTimeout(timer);
    }
  }, [recoveryMessage, clearRecoveryMessage]);

  return (
    <div className="flex flex-col gap-2 border p-4 bg-gray-900 text-gray-100 rounded shadow-sm text-sm h-full">
      <h3 className="font-bold border-b border-gray-700 pb-2">Session Ledger</h3>

      <div className="flex justify-between items-center py-1">
        <span className="text-gray-400">Save Health</span>
        <span className={`px-2 py-0.5 rounded font-mono text-xs ${
          saveHealth === 'saved' ? 'bg-green-900 text-green-300' :
          saveHealth === 'unsaved' ? 'bg-yellow-900 text-yellow-300' :
          'bg-red-900 text-red-300'
        }`}>
          {saveHealth.toUpperCase()}
        </span>
      </div>

      <div className="flex justify-between items-center py-1">
        <span className="text-gray-400">Last Export</span>
        <span className="font-mono text-xs text-gray-300" title={exportedAt}>
          {new Date(exportedAt).toLocaleTimeString()}
        </span>
      </div>

      <div className="flex justify-between items-center py-1">
        <span className="text-gray-400">Mutations (History)</span>
        <span className="font-mono text-xs text-blue-300">
          {history.length} operations
        </span>
      </div>

      <div className="flex-1 mt-2 p-2 bg-gray-950 rounded font-mono text-xs overflow-y-auto" aria-live="polite">
        {recoveryMessage ? (
          <div className="text-yellow-400">
            &gt; {recoveryMessage}
          </div>
        ) : (
          <div className="text-gray-500">
            &gt; System idle...
          </div>
        )}
      </div>
    </div>
  );
}
