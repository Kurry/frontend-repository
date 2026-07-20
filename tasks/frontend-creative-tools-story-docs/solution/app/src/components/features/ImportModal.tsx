import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { isImportModalOpenStore, showToast } from '@/store/ui';
import { replaceAllScenes, type Scene } from '@/store';

export function ImportModal() {
    const isOpen = useStore(isImportModalOpenStore);
    const [jsonInput, setJsonInput] = useState('');
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleImport = () => {
        try {
            const parsed = JSON.parse(jsonInput);

            if (parsed.schemaVersion !== 1) throw new Error('schemaVersion must be exactly 1');
            if (parsed.project !== 'Demo Projects') throw new Error('project must be exactly Demo Projects');
            if (parsed.storyboard !== '1. Getting Started') throw new Error('storyboard must be exactly 1. Getting Started');
            if (!Array.isArray(parsed.scenes)) throw new Error('scenes must be an array');

            // Validate scenes against field contract
            const newScenes: Scene[] = parsed.scenes.map((s: any, idx: number) => {
                if (typeof s.title !== 'string' || s.title.trim().length < 2 || s.title.trim().length > 80) throw new Error(`Scene ${idx+1}: invalid title`);
                if (typeof s.body !== 'string' || s.body.trim().length < 8 || s.body.trim().length > 2000) throw new Error(`Scene ${idx+1}: invalid body`);
                if (s.cameraNote !== undefined && (typeof s.cameraNote !== 'string' || s.cameraNote.trim().length > 200)) throw new Error(`Scene ${idx+1}: invalid cameraNote`);
                if (!['draft', 'review', 'ready'].includes(s.status)) throw new Error(`Scene ${idx+1}: invalid status`);
                if (typeof s.order !== 'number' || s.order < 1) throw new Error(`Scene ${idx+1}: invalid order`);

                return {
                    id: crypto.randomUUID(),
                    title: s.title.trim(),
                    body: s.body.trim(),
                    cameraNote: s.cameraNote ? s.cameraNote.trim() : undefined,
                    status: s.status,
                    order: s.order,
                    versions: [{
                        id: crypto.randomUUID(),
                        timestamp: new Date().toISOString(),
                        title: s.title.trim(),
                        body: s.body.trim(),
                        cameraNote: s.cameraNote ? s.cameraNote.trim() : undefined,
                        status: s.status,
                    }]
                };
            });

            replaceAllScenes(newScenes);
            showToast('Storyboard imported successfully');
            isImportModalOpenStore.set(false);
            setJsonInput('');
            setError(null);

        } catch (err: any) {
            setError(err.message || 'Invalid JSON format');
        }
    };

    return (
        <div className="fixed inset-0 z-[70] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => isImportModalOpenStore.set(false)}></div>
                <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>
                <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:align-middle animate-fade-in-up">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium leading-6 text-gray-900" id="modal-title">Import StoryboardPackage JSON</h3>
                            <button onClick={() => isImportModalOpenStore.set(false)} className="btn btn-sm btn-ghost btn-circle" aria-label="Cancel">✕</button>
                        </div>
                        <textarea
                            className="textarea textarea-bordered w-full h-64 font-mono text-sm"
                            placeholder="Paste your JSON here..."
                            value={jsonInput}
                            onChange={(e) => {
                                setJsonInput(e.target.value);
                                setError(null);
                            }}
                        ></textarea>
                        {error && <p className="text-error text-sm mt-2 font-medium" role="alert">{error}</p>}
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-gray-100">
                        <button type="button" className="btn btn-primary bg-yellow-400 hover:bg-yellow-500 text-yellow-950 border-none ml-3" onClick={handleImport}>
                            Import
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={() => isImportModalOpenStore.set(false)}>
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
