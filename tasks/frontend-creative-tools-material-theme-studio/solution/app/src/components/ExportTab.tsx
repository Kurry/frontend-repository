import { useState, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { announce, importTheme } from '../store/themeSlice';
import { Button } from '@mui/material';
import { parseImportedTheme } from '../utils/importTheme';
import { getThemeArtifact, ThemeArtifactFormat } from '../utils/themeArtifacts';
import { ToastView, useToast } from './Toast';

export default function ExportTab() {
    const dispatch = useDispatch();
    const activeOptions = useSelector((state: RootState) => state.theme.activeOptions);
    const activeThemeId = useSelector((state: RootState) => state.theme.activeId);
    const themes = useSelector((state: RootState) => state.theme.themes);

    const activeTheme = themes.find(t => t.id === activeThemeId);
    const themeName = activeTheme?.name ?? 'Theme';

    const [format, setFormat] = useState<ThemeArtifactFormat>('json');
    const { toast, show } = useToast();
    const copyBusyRef = useRef(false);
    const downloadBusyRef = useRef<{ format: ThemeArtifactFormat; at: number } | null>(null);
    const [importText, setImportText] = useState('');
    const [importError, setImportError] = useState('');

    const jsonExport = useMemo(() => {
        return JSON.stringify({ name: themeName, ...activeOptions }, null, 2);
    }, [activeOptions, themeName]);

    const cssExport = useMemo(() => getThemeArtifact('css', themeName, activeOptions), [activeOptions, themeName]);

    const textToExport = format === 'json' ? jsonExport : cssExport;

    const copyText = () => {
        if (copyBusyRef.current || toast?.msg.includes('Export copied')) return;
        copyBusyRef.current = true;
        navigator.clipboard
            .writeText(textToExport)
            .then(() => {
                show('Export copied');
                dispatch(announce(`${format.toUpperCase()} export copied to clipboard`));
            })
            .catch(() => show('Copy failed — clipboard unavailable'))
            .finally(() => {
                setTimeout(() => {
                    copyBusyRef.current = false;
                }, 300);
            });
    };

    const downloadFile = (downloadFormat: ThemeArtifactFormat) => {
        // Dedupe rapid repeats of the same format (double-clicks) while still
        // allowing JSON-then-CSS back-to-back downloads.
        const now = Date.now();
        if (downloadBusyRef.current && downloadBusyRef.current.format === downloadFormat && now - downloadBusyRef.current.at < 400) {
            return;
        }
        downloadBusyRef.current = { format: downloadFormat, at: now };
        const text = downloadFormat === 'json' ? jsonExport : cssExport;
        const blob = new Blob([text], { type: downloadFormat === 'json' ? 'application/json' : 'text/css' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${themeName.toLowerCase().replace(/\s+/g, '-')}-theme.${downloadFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        show(`Downloading ${downloadFormat.toUpperCase()} file`);
        dispatch(announce(`Theme ${downloadFormat.toUpperCase()} file download started`));
    };

    const handleImport = () => {
        try {
            dispatch(importTheme(parseImportedTheme(importText)));
            setImportText('');
            setImportError('');
            show('ThemeOptions imported');
            dispatch(announce('ThemeOptions imported — editor, tools, preview, and export updated, status unsaved'));
        } catch (e: any) {
            const message = e.message || 'Invalid JSON payload';
            setImportError(message);
            dispatch(announce(`Import rejected: ${message}`));
        }
    };

    const tabButton = (value: ThemeArtifactFormat, label: string) => (
        <button
            type="button"
            role="tab"
            aria-selected={format === value}
            className={`px-6 py-3 font-medium min-h-11 transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400 ${
                format === value ? 'bg-gray-800 text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
            onClick={() => setFormat(value)}
        >
            {label}
        </button>
    );

    return (
        <div className="flex flex-col lg:flex-row h-full bg-[#121212] text-white overflow-auto lg:overflow-hidden p-4 lg:p-8 gap-6 lg:gap-8">
            <div className="flex-1 flex flex-col max-w-4xl min-w-0">
                <header className="mb-6">
                    <h2 className="text-3xl font-normal mb-2">Export</h2>
                    <p className="text-gray-400">Live-compiled theme files, regenerated on every edit.</p>
                </header>

                <div className="flex bg-gray-900 border border-gray-700 rounded-t overflow-hidden shrink-0" role="tablist" aria-label="Export format">
                    {tabButton('json', 'JSON')}
                    {tabButton('css', 'CSS')}
                </div>

                <div className="min-h-[240px] lg:flex-1 overflow-auto bg-[#1e1e1e] p-4 font-mono text-sm border-x border-b border-gray-700 rounded-b">
                    <pre className="text-gray-300 m-0" data-export-preview>
                        {textToExport}
                    </pre>
                </div>

                <div className="flex flex-wrap gap-3 mt-4 shrink-0">
                    <Button variant="contained" color="primary" onClick={() => downloadFile('json')} sx={{ minHeight: 44 }}>
                        Download JSON
                    </Button>
                    <Button variant="contained" color="primary" onClick={() => downloadFile('css')} sx={{ minHeight: 44 }}>
                        Download CSS
                    </Button>
                    <Button variant="outlined" color="primary" onClick={copyText} sx={{ minHeight: 44 }}>
                        Copy export
                    </Button>
                </div>
            </div>

            <div className="w-full lg:w-96 flex-shrink-0 flex flex-col bg-[#1e1e1e] border border-gray-700 rounded p-6">
                <h3 className="text-xl mb-2">Import ThemeOptions</h3>
                <p className="text-gray-400 text-sm mb-4">Paste an exported ThemeOptions JSON package, including its name, to import it into the current session.</p>
                <textarea
                    value={importText}
                    onChange={e => { setImportText(e.target.value); setImportError(''); }}
                    className="min-h-[180px] lg:flex-1 bg-gray-900 border border-gray-700 rounded p-2 text-sm font-mono text-gray-300 outline-none focus-visible:ring-2 focus-visible:ring-blue-400 mb-2 resize-none"
                    placeholder={jsonExport}
                    aria-label="Import ThemeOptions JSON"
                />
                {importError && <div className="text-red-400 text-sm mb-4" role="alert">{importError}</div>}
                <Button variant="contained" color="secondary" onClick={handleImport} disabled={!importText.trim()} sx={{ minHeight: 44 }}>
                    Import ThemeOptions
                </Button>
            </div>

            <ToastView toast={toast} />
        </div>
    );
}
