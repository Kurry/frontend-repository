import { useState } from 'react';
import { useStore, calculateDerivedStats } from '../store';
import type { ArtifactSession } from '../types';
import { formatISO } from 'date-fns';
import { Download, Upload, Trash2, Code } from 'lucide-react';

export function ArtifactTools() {
    const { records, history, importArtifact, clearState, selectedRecordId, forecastRecord } = useStore();
    const [importText, setImportText] = useState('');
    const [importError, setImportError] = useState<string | null>(null);

    const handleExport = () => {
        const derived = calculateDerivedStats(records, selectedRecordId, forecastRecord);
        const session: ArtifactSession = {
            schemaVersion: 'garden-workday-v1',
            exportedAt: formatISO(new Date()),
            records,
            derived,
            history
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(session, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "garden-workday-v1.json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const validateSession = (data: any): data is ArtifactSession => {
        if (data?.schemaVersion !== 'garden-workday-v1') {
            throw new Error('Invalid schemaVersion. Expected garden-workday-v1');
        }
        if (!Array.isArray(data.records)) {
            throw new Error('Missing or invalid records array');
        }

        const ids = new Set();
        for (const record of data.records) {
            if (!record.id || typeof record.id !== 'string') throw new Error('Invalid record id');
            if (ids.has(record.id)) throw new Error(`Duplicate record id: ${record.id}`);
            ids.add(record.id);

            if (typeof record.title !== 'string') throw new Error('Invalid title');
            if (!['empty', 'draft', 'ready', 'changed', 'archived'].includes(record.status)) {
                throw new Error(`Invalid status enum: ${record.status}`);
            }
            if (typeof record.effort !== 'number' || record.effort < 0 || record.effort > 24) {
                throw new Error('Effort must be a number between 0 and 24');
            }
        }
        return true;
    };

    const handleImport = () => {
        setImportError(null);
        try {
            const data = JSON.parse(importText);
            if (validateSession(data)) {
                data.exportedAt = formatISO(new Date());
                importArtifact(data);
                setImportText('');
            }
        } catch (e: any) {
            setImportError(e.message || 'Invalid JSON format');
        }
    };

    return (
        <div className="flex flex-col gap-4 p-4 border border-slate-200 bg-white rounded-md shadow-sm">
            <div className="flex items-center gap-2">
                <Code className="text-slate-600" size={20} />
                <h2 className="text-lg font-semibold text-slate-800">Portable Work Artifact</h2>
            </div>

            <div className="flex flex-col gap-3">
                <p className="text-sm text-slate-600">
                    Export the current session state as a valid JSON artifact, or import a previously exported session.
                </p>

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded hover:bg-slate-900"
                    >
                        <Download size={16} /> Export Session
                    </button>
                    <button
                        onClick={clearState}
                        className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded hover:bg-red-200"
                    >
                        <Trash2 size={16} /> Clear State
                    </button>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                    <label className="text-sm font-medium text-slate-700">Import Session JSON</label>
                    <textarea
                        className="border border-slate-300 rounded p-2 text-sm font-mono h-32 bg-slate-50"
                        placeholder="Paste garden-workday-v1.json contents here..."
                        value={importText}
                        onChange={e => setImportText(e.target.value)}
                    />
                    {importError && (
                        <div className="text-sm text-red-600 font-medium">
                            Import Error: {importError}
                        </div>
                    )}
                    <button
                        onClick={handleImport}
                        disabled={!importText.trim()}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50 w-full sm:w-auto"
                    >
                        <Upload size={16} /> Validate & Import
                    </button>
                </div>
            </div>
        </div>
    );
}
