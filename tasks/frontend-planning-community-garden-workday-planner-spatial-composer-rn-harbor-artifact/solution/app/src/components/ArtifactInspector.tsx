import React, { useRef, useState } from 'react';
import { useAppStore } from '../store';
import { CommunityGardenWorkdayPlannerSessionSchema } from '../schemas';
import { Download, Upload, Trash2, FileJson, AlertCircle, CheckCircle2 } from 'lucide-react';

export const ArtifactInspector: React.FC = () => {
    const { state, dispatch, derived } = useAppStore();
    const [importError, setImportError] = useState<string | null>(null);
    const [importSuccess, setImportSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const generatePayload = () => {
        return {
            schemaVersion: 'v1' as const,
            exportedAt: new Date().toISOString(),
            records: state.records,
            derived,
            history: state.history
        };
    };

    const handleExport = () => {
        const payload = generatePayload();

        // Ensure strictly validated before export to guarantee contract
        const validPayload = CommunityGardenWorkdayPlannerSessionSchema.parse(payload);

        const blob = new Blob([JSON.stringify(validPayload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'garden-workday-v1-spatial-composer.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setImportError(null);
        setImportSuccess(false);

        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                const parsed = CommunityGardenWorkdayPlannerSessionSchema.safeParse(json);

                if (parsed.success) {
                    dispatch({ type: 'IMPORT_STATE', payload: parsed.data });
                    setImportSuccess(true);
                    setTimeout(() => setImportSuccess(false), 3000);
                } else {
                    setImportError(`Validation failed: ${parsed.error.issues[0].path.join('.')} - ${parsed.error.issues[0].message}`);
                }
            } catch (err) {
                setImportError("Malformed JSON file");
            }
        };
        reader.readAsText(file);

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const currentJson = JSON.stringify(generatePayload(), null, 2);

    return (
        <div className="w-full md:w-96 bg-slate-800 text-slate-300 flex flex-col h-full md:h-auto overflow-hidden font-mono text-xs border-l border-slate-700 shadow-xl z-20">
            <div className="p-4 border-b border-slate-700 bg-slate-900 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                    <FileJson size={16} className="text-emerald-400" />
                    <h2 className="font-semibold text-slate-100 tracking-wide text-sm font-sans">Provenance Artifact Inspector</h2>
                </div>
                <div className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-sans border border-slate-700">
                    v1
                </div>
            </div>

            <div className="p-4 border-b border-slate-700 shrink-0 bg-slate-800/50 flex flex-col gap-3">

                {importError && (
                    <div className="bg-red-900/50 border border-red-700 text-red-200 p-2 rounded text-xs flex items-start gap-2 font-sans">
                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                        <div>
                            <div className="font-bold mb-1">Import Failed</div>
                            <div>{importError}</div>
                        </div>
                    </div>
                )}

                {importSuccess && (
                    <div className="bg-emerald-900/50 border border-emerald-700 text-emerald-200 p-2 rounded text-xs flex items-center gap-2 font-sans">
                        <CheckCircle2 size={14} /> Import successful
                    </div>
                )}

                <div className="grid grid-cols-2 gap-2 font-sans">
                    <button
                        onClick={handleExport}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded flex items-center justify-center gap-2 transition-colors font-medium shadow-sm"
                    >
                        <Download size={14} /> Export
                    </button>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-slate-700 hover:bg-slate-600 text-slate-100 p-2 rounded flex items-center justify-center gap-2 transition-colors font-medium border border-slate-600"
                    >
                        <Upload size={14} /> Import
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImport}
                        accept=".json"
                        className="hidden"
                    />
                </div>

                <button
                    onClick={() => {
                        if(window.confirm('Clear all session state?')) {
                            dispatch({ type: 'CLEAR_STATE' });
                        }
                    }}
                    className="w-full bg-slate-900 hover:bg-red-900/30 text-slate-400 hover:text-red-400 p-2 rounded flex items-center justify-center gap-2 transition-colors font-sans text-xs border border-slate-700 hover:border-red-800"
                >
                    <Trash2 size={12} /> Clear Session State
                </button>
            </div>

            <div className="flex-1 overflow-auto p-4 relative bg-slate-950">
                <div className="absolute top-2 right-4 text-slate-600 select-none">LIVE VIEW</div>
                <pre className="text-[10px] leading-relaxed break-all whitespace-pre-wrap text-emerald-500/80 font-medium">
                    {currentJson}
                </pre>
            </div>
        </div>
    );
};
