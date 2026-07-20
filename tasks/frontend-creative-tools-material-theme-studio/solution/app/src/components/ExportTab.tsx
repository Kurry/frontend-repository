import { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { importTheme } from '../store/themeSlice';
import { Button } from '@mui/material';
import { parseImportedTheme } from '../utils/importTheme';
import { copyThemeArtifact, getCssExport } from '../utils/themeArtifacts';

export default function ExportTab() {
    const dispatch = useDispatch();
    const activeOptions = useSelector((state: RootState) => state.theme.activeOptions);
    const activeThemeId = useSelector((state: RootState) => state.theme.activeId);
    const themes = useSelector((state: RootState) => state.theme.themes);

    const activeTheme = themes.find(t => t.id === activeThemeId);
    const themeName = activeTheme?.name ?? 'Theme';

    const [format, setFormat] = useState<'json' | 'css'>('json');
    const [toastMsg, setToastMsg] = useState('');
    const [importText, setImportText] = useState('');
    const [importError, setImportError] = useState('');

    const jsonExport = useMemo(() => {
        return JSON.stringify({ name: themeName, ...activeOptions }, null, 2);
    }, [activeOptions, themeName]);

    const cssExport = useMemo(() => getCssExport(activeOptions), [activeOptions]);

    const textToExport = format === 'json' ? jsonExport : cssExport;

    const copyText = () => {
        copyThemeArtifact(format, themeName, activeOptions).then(() => {
            setToastMsg('Export copied');
            setTimeout(() => setToastMsg(''), 3000);
        });
    };

    const downloadFile = () => {
        const blob = new Blob([textToExport], { type: format === 'json' ? 'application/json' : 'text/css' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${themeName.toLowerCase().replace(/\s+/g, '-')}-theme.${format}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = () => {
        try {
            dispatch(importTheme(parseImportedTheme(importText)));
            setImportText('');
            setImportError('');
            setToastMsg('ThemeOptions imported successfully');
            setTimeout(() => setToastMsg(''), 3000);
        } catch (e: any) {
            setImportError(e.message || "Invalid JSON payload");
        }
    };

    return (
        <div className="flex h-full bg-[#121212] text-white overflow-hidden p-8 gap-8">
            <div className="flex-1 flex flex-col max-w-4xl min-w-0">
                <header className="mb-6">
                    <h2 className="text-3xl font-normal mb-2">Export</h2>
                    <p className="text-gray-400">Export your theme files to integrate into your app.</p>
                </header>

                <div className="flex bg-gray-900 border border-gray-700 rounded-t overflow-hidden shrink-0">
                    <button
                        className={`px-6 py-3 font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${format === 'json' ? 'bg-gray-800 text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                        onClick={() => setFormat('json')}
                    >
                        JSON
                    </button>
                    <button
                        className={`px-6 py-3 font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${format === 'css' ? 'bg-gray-800 text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                        onClick={() => setFormat('css')}
                    >
                        CSS
                    </button>
                </div>

                <div className="flex-1 overflow-auto bg-[#1e1e1e] p-4 font-mono text-sm border-x border-b border-gray-700 rounded-b">
                    <pre className="text-gray-300 m-0">
                        {textToExport}
                    </pre>
                </div>

                <div className="flex gap-4 mt-4 shrink-0">
                    <Button variant="contained" color="primary" onClick={downloadFile}>Download {format.toUpperCase()}</Button>
                    <Button variant="outlined" color="primary" onClick={copyText}>Copy export</Button>
                </div>
            </div>

            <div className="w-96 flex-shrink-0 flex flex-col bg-[#1e1e1e] border border-gray-700 rounded p-6">
                <h3 className="text-xl mb-2">Import ThemeOptions</h3>
                <p className="text-gray-400 text-sm mb-4">Paste an exported ThemeOptions JSON package, including its name, to import it into the current session.</p>
                <textarea
                    value={importText}
                    onChange={e => { setImportText(e.target.value); setImportError(''); }}
                    className="flex-1 bg-gray-900 border border-gray-700 rounded p-2 text-sm font-mono text-gray-300 outline-none focus-visible:ring-2 focus-visible:ring-blue-400 mb-2 resize-none"
                    placeholder={jsonExport}
                    aria-label="Import ThemeOptions JSON"
                />
                {importError && <div className="text-red-400 text-sm mb-4">{importError}</div>}
                <Button variant="contained" color="secondary" onClick={handleImport} disabled={!importText.trim()}>Import ThemeOptions</Button>
            </div>

            {toastMsg && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded shadow-lg z-50 transition-all duration-300" role="status" aria-live="polite">
                    {toastMsg}
                </div>
            )}
        </div>
    );
}
