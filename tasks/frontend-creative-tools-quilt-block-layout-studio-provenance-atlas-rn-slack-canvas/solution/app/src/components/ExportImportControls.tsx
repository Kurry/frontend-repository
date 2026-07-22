import { useRef, useState } from 'react';
import { useStore } from '../store';
import { Download, Upload, Trash } from 'lucide-react';

export const ExportImportControls = () => {
  const { exportSession, importSession, clearSession } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const handleExport = () => {
    const data = exportSession();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quilt-layout-v1-provenance-atlas.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setMsg({ text: 'Session exported successfully.', type: 'success' });
    setTimeout(() => setMsg({ text: '', type: '' }), 3000);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importSession(content);
      if (res.success) {
        setMsg({ text: 'Session imported successfully.', type: 'success' });
      } else {
        setMsg({ text: `Import failed: ${res.error}`, type: 'error' });
      }
      setTimeout(() => setMsg({ text: '', type: '' }), 5000);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm p-4">
      <h3 className="font-semibold mb-3">Artifact Management</h3>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleExport}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white p-2 rounded flex items-center justify-center gap-2 text-sm"
        >
          <Download size={16} /> Export
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded flex items-center justify-center gap-2 text-sm"
        >
          <Upload size={16} /> Import
        </button>
        <button
          onClick={() => {
            if (confirm('Are you sure you want to clear the session?')) clearSession();
          }}
          className="flex-none bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded flex items-center justify-center gap-2 text-sm"
          title="Clear Session"
        >
          <Trash size={16} />
        </button>
      </div>
      <input
        type="file"
        accept=".json"
        className="hidden"
        ref={fileInputRef}
        onChange={handleImport}
      />
      {msg.text && (
        <div className={`mt-2 text-xs p-2 rounded ${msg.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {msg.text}
        </div>
      )}
    </div>
  );
};
