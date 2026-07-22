import React, { useRef } from 'react';
import { useAppStore } from './store';
import { Download, Upload } from 'lucide-react';

export const ExportImport = () => {
  const { data, loadData } = useAppStore();
  const fileInputRef = useRef(null);

  const handleExport = () => {
    const exportData = {
      ...data,
      exportedAt: new Date().toISOString()
    };

    // Convert to JSON string
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Create download link
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoice-aging-v1.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);

        // Field-level validation
        if (parsed.schemaVersion !== 'v1') {
          throw new Error('Invalid schemaVersion: expected v1');
        }
        if (!Array.isArray(parsed.records)) {
          throw new Error('Invalid schema: records must be an array');
        }

        // Duplicate ID check
        const ids = new Set();
        for (const record of parsed.records) {
          if (ids.has(record.id)) {
            throw new Error(`Duplicate ID found: ${record.id}`);
          }
          ids.add(record.id);

          if (!['empty', 'draft', 'ready', 'changed', 'archived'].includes(record.status)) {
            throw new Error(`Invalid status enum in record ${record.id}`);
          }
          if (typeof record.amount !== 'number' || record.amount < 0) {
            throw new Error(`Invalid amount bounds in record ${record.id}`);
          }
        }

        // Validated, regenerate exportedAt
        parsed.exportedAt = new Date().toISOString();

        loadData(parsed);
        alert('Successfully imported and validated session state.');
      } catch (err) {
        alert(`Malformed import rejected. No state change made.\nError: ${err.message}`);
      }

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleExport}
        className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 text-gray-700 font-medium"
      >
        <Download size={16} /> Export
      </button>

      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        onChange={handleImport}
        className="hidden"
        id="import-upload"
      />
      <label
        htmlFor="import-upload"
        className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 text-gray-700 font-medium cursor-pointer"
      >
        <Upload size={16} /> Clear & Import
      </label>
    </div>
  );
};
