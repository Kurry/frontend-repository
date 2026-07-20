import { component$, useContext, useSignal } from '@builder.io/qwik';
import { AppCtx } from '../context';

export const ExportCenterScreen = component$(() => {
  const store = useContext(AppCtx);
  const importText = useSignal('');
  const importError = useSignal('');
  const importSuccess = useSignal(false);

  const handleImport = () => {
    importError.value = '';
    importSuccess.value = false;
    try {
      const data = JSON.parse(importText.value);
      if (data.matches && Array.isArray(data.matches)) {
        store.matchLog = data.matches;
        importSuccess.value = true;
      } else if (data.playerName && data.difficulty && data.winner !== undefined) {
        store.matchLog = [data, ...store.matchLog];
        importSuccess.value = true;
      } else {
        importError.value = 'Invalid match data provided';
      }
    } catch (e) {
      importError.value = 'File is invalid';
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '24px', maxWidth: '720px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '30px', fontWeight: '800', color: '#F59E0B', margin: 0 }}>📥 Import Match Data</h1>
        <button
          class="btn-secondary"
          style={{ fontSize: '13px', padding: '8px 16px' }}
          onClick$={() => {
            store.phase = 'match-log';
          }}
        >
          ← Go back
        </button>
      </div>

      <div class="panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
         <label style={{ color: '#A8A29E', fontSize: '14px' }}>Paste match JSON or archive JSON here:</label>
         <textarea
            class="input input-bordered"
            style={{ minHeight: '200px', background: '#1C1917', color: '#FAFAF9', padding: '12px' }}
            value={importText.value}
            onInput$={(e) => importText.value = (e.target as HTMLTextAreaElement).value}
         />
         {importError.value && <div style={{ color: '#EF4444', fontSize: '14px' }}>{importError.value}</div>}
         {importSuccess.value && <div style={{ color: '#4ADE80', fontSize: '14px' }}>Import successful!</div>}
         <button class="btn-primary" onClick$={handleImport}>
            Import
         </button>
      </div>
    </div>
  );
});
