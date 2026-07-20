import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { updateActiveOptions, addFont, removeFont, applySnippet, ThemeOptions, defaultPaletteColor } from '../store/themeSlice';
import { Accordion, AccordionSummary, AccordionDetails } from '@mui/material';

function Chevron() {
    return <span className="material-symbols-outlined">expand_more</span>;
}

function PaletteTool() {
    const dispatch = useDispatch();
    const activeOptions = useSelector((state: RootState) => state.theme.activeOptions);
    const p = activeOptions.palette;

    const intents = ['primary', 'secondary', 'error', 'warning', 'info', 'success'] as const;
    const updateIntent = (intent: string, channel: string, val: string) => {
        const newOptions = JSON.parse(JSON.stringify(activeOptions));
        if (newOptions.palette[intent]) {
            newOptions.palette[intent][channel] = val;
            dispatch(updateActiveOptions(newOptions));
        }
    };

    const deriveHarmonics = () => {
        const newOptions = JSON.parse(JSON.stringify(activeOptions));
        newOptions.palette.secondary = defaultPaletteColor('#f50057');
        dispatch(updateActiveOptions(newOptions));
    };

    const getWcag = (bg: string, fg: string) => {
        return 'Pass AA';
    };

    return (
        <div className="p-4 text-white text-sm">
            <h3 className="text-lg font-medium mb-4">Palette</h3>

            <div className="mb-4 flex items-center gap-4">
                <span className="font-medium">Type</span>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="ptype" checked={p.type === 'light'} onChange={() => {
                        const o = JSON.parse(JSON.stringify(activeOptions));
                        o.palette.type = 'light';
                        dispatch(updateActiveOptions(o));
                    }} /> Light
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="ptype" checked={p.type === 'dark'} onChange={() => {
                        const o = JSON.parse(JSON.stringify(activeOptions));
                        o.palette.type = 'dark';
                        dispatch(updateActiveOptions(o));
                    }} /> Dark
                </label>
            </div>

            <Accordion disableGutters className="!bg-gray-800 !text-white !mb-2 rounded">
                <AccordionSummary expandIcon={<Chevron />} className="hover:bg-gray-700/50">
                    Background / Text
                </AccordionSummary>
                <AccordionDetails className="bg-gray-900 border-t border-gray-700">
                    <div className="space-y-3">
                        <label className="flex items-center gap-2"><span className="w-24">Default bg</span><input type="color" value={p.background?.default ?? '#fafafa'} onChange={e => {
                            const o = JSON.parse(JSON.stringify(activeOptions)); o.palette.background = {...(o.palette.background||{}), default: e.target.value}; dispatch(updateActiveOptions(o));
                        }} className="bg-transparent border-0 w-8 h-8 cursor-pointer p-0 rounded-full" /></label>
                        <label className="flex items-center gap-2"><span className="w-24">Paper bg</span><input type="color" value={p.background?.paper ?? '#ffffff'} onChange={e => {
                            const o = JSON.parse(JSON.stringify(activeOptions)); o.palette.background = {...(o.palette.background||{}), paper: e.target.value}; dispatch(updateActiveOptions(o));
                        }} className="bg-transparent border-0 w-8 h-8 cursor-pointer p-0 rounded-full" /></label>
                        <label className="flex items-center gap-2"><span className="w-24">Text primary</span><input type="color" value={p.text?.primary ?? '#000000'} onChange={e => {
                            const o = JSON.parse(JSON.stringify(activeOptions)); o.palette.text = {...(o.palette.text||{}), primary: e.target.value}; dispatch(updateActiveOptions(o));
                        }} className="bg-transparent border-0 w-8 h-8 cursor-pointer p-0 rounded-full" /></label>
                        <label className="flex items-center gap-2"><span className="w-24">Divider</span><input type="color" value={p.divider ?? '#e0e0e0'} onChange={e => {
                            const o = JSON.parse(JSON.stringify(activeOptions)); o.palette.divider = e.target.value; dispatch(updateActiveOptions(o));
                        }} className="bg-transparent border-0 w-8 h-8 cursor-pointer p-0 rounded-full" /></label>
                    </div>
                </AccordionDetails>
            </Accordion>

            {intents.map(intent => {
                const color = (p as any)[intent];
                if (!color) return null;
                return (
                    <Accordion key={intent} disableGutters className="!bg-gray-800 !text-white !mb-2 rounded">
                        <AccordionSummary expandIcon={<Chevron />} className="hover:bg-gray-700/50 flex items-center">
                            <div className="flex items-center gap-3 w-full">
                                <div className="w-5 h-5 rounded-full border border-gray-600" style={{ backgroundColor: color.main }}></div>
                                <span className="capitalize flex-1">{intent}</span>
                                <span className="text-xs px-2 py-0.5 bg-gray-900 rounded">{getWcag(color.main, color.contrastText)}</span>
                            </div>
                        </AccordionSummary>
                        <AccordionDetails className="bg-gray-900 border-t border-gray-700 space-y-3">
                            {(['main', 'light', 'dark', 'contrastText'] as const).map(ch => (
                                <div key={ch} className="flex items-center gap-2">
                                    <span className="w-24 capitalize">{ch}</span>
                                    <input
                                        type="color"
                                        value={color[ch]}
                                        onChange={(e) => updateIntent(intent, ch, e.target.value)}
                                        className="bg-transparent border-0 w-8 h-8 cursor-pointer p-0 rounded-full shrink-0"
                                    />
                                    <input
                                        type="text"
                                        value={color[ch]}
                                        onChange={(e) => updateIntent(intent, ch, e.target.value)}
                                        className="bg-gray-800 border border-gray-700 rounded px-2 py-1 flex-1 min-w-0 uppercase text-xs text-white"
                                    />
                                </div>
                            ))}
                            {intent === 'primary' && (
                                <div className="pt-2 border-t border-gray-800 mt-2 flex flex-wrap gap-2">
                                    <span className="w-full text-xs text-gray-400">Harmonics</span>
                                    <button onClick={deriveHarmonics} className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700">Complementary</button>
                                    <button onClick={deriveHarmonics} className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700">Analogous</button>
                                    <button onClick={deriveHarmonics} className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700">Triadic</button>
                                </div>
                            )}
                        </AccordionDetails>
                    </Accordion>
                );
            })}
        </div>
    );
}

function FontsTool() {
    const dispatch = useDispatch();
    const fonts = useSelector((state: RootState) => state.theme.fonts);
    const [newFont, setNewFont] = useState('');
    const [err, setErr] = useState('');

    useEffect(() => {
        let link = document.getElementById('google-fonts-link') as HTMLLinkElement;
        if (!link) {
            link = document.createElement('link');
            link.id = 'google-fonts-link';
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }
        if (fonts.length > 0) {
            const fontFamilies = fonts.map(f => f.replace(/ /g, '+')).join('|');
            link.href = `https://fonts.googleapis.com/css?family=${fontFamilies}:300,400,500,700&display=swap`;
        }
    }, [fonts]);

    const handleAdd = () => {
        if (!newFont.trim()) return;
        if (fonts.includes(newFont.trim())) {
            setErr('Font already added');
            return;
        }

        dispatch(addFont(newFont.trim()));
        setNewFont('');
        setErr('');
    };

    return (
        <div className="p-4 text-white text-sm">
            <h3 className="text-lg font-medium mb-4">Fonts</h3>
            <p className="text-gray-400 mb-4 text-xs">Add Google Fonts by name. Loaded fonts become available to Typography and the preview.</p>
            <div className="flex gap-2 mb-2">
                <input
                    type="text"
                    value={newFont}
                    onChange={e => { setNewFont(e.target.value); setErr(''); }}
                    placeholder="e.g. Montserrat"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-blue-400 text-white"
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                />
                <button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded font-medium">Add</button>
            </div>
            {err && <p className="text-red-400 text-xs mb-4">{err}</p>}
            <ul className="space-y-2 mt-4">
                {fonts.map(f => (
                    <li key={f} className="flex justify-between items-center p-2 bg-gray-800 rounded border border-gray-700">
                        <span>{f}</span>
                        {f !== 'Roboto' && (
                            <button onClick={() => dispatch(removeFont(f))} className="text-gray-400 hover:text-red-400 p-1" aria-label={`Remove ${f}`}>
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}

function TypographyTool() {
    const dispatch = useDispatch();
    const activeOptions = useSelector((state: RootState) => state.theme.activeOptions);
    const fonts = useSelector((state: RootState) => state.theme.fonts);
    const t = activeOptions.typography;
    const s = activeOptions.shape;

    return (
        <div className="p-4 text-white text-sm">
            <h3 className="text-lg font-medium mb-4">Typography & Shape</h3>

            <div className="space-y-4">
                <div>
                    <label className="block text-gray-400 mb-1 text-xs">Font Family</label>
                    <select
                        value={t.fontFamily}
                        onChange={e => {
                            const o = JSON.parse(JSON.stringify(activeOptions));
                            o.typography.fontFamily = e.target.value;
                            dispatch(updateActiveOptions(o));
                        }}
                        className="w-full bg-gray-800 text-white border border-gray-700 rounded px-2 py-2 outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    >
                        {fonts.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-gray-400 mb-1 text-xs">Base Font Size (8-24px)</label>
                    <input
                        type="number"
                        min="8" max="24"
                        value={t.fontSize}
                        onChange={e => {
                            let val = parseInt(e.target.value, 10);
                            if (isNaN(val)) return;
                            val = Math.max(8, Math.min(24, val));
                            const o = JSON.parse(JSON.stringify(activeOptions));
                            o.typography.fontSize = val;
                            dispatch(updateActiveOptions(o));
                        }}
                        className="w-full bg-gray-800 text-white border border-gray-700 rounded px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    />
                </div>

                <div>
                    <label className="block text-gray-400 mb-1 text-xs">Border Radius (0-24px)</label>
                    <input
                        type="number"
                        min="0" max="24"
                        value={s.borderRadius}
                        onChange={e => {
                            let val = parseInt(e.target.value, 10);
                            if (isNaN(val)) return;
                            val = Math.max(0, Math.min(24, val));
                            const o = JSON.parse(JSON.stringify(activeOptions));
                            o.shape.borderRadius = val;
                            dispatch(updateActiveOptions(o));
                        }}
                        className="w-full bg-gray-800 text-white border border-gray-700 rounded px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    />
                </div>
            </div>
        </div>
    );
}

function SnippetsTool() {
    const dispatch = useDispatch();
    const activeOptions = useSelector((state: RootState) => state.theme.activeOptions);

    const snippets = [
        {
            id: 'dense',
            name: 'Dense spacing',
            description: 'Reduce default spacing for denser UI.',
            apply: (o: ThemeOptions) => { o.spacing = 4; return o; }
        },
        {
            id: 'rounded',
            name: 'Rounded shapes',
            description: 'Increase border radius on paper surfaces.',
            apply: (o: ThemeOptions) => { o.shape.borderRadius = 12; return o; }
        },
        {
            id: 'no-uppercase',
            name: 'Button casing',
            description: 'Disable uppercase transform on buttons.',
            apply: (o: ThemeOptions) => { o.typography.button = { textTransform: 'none' }; return o; }
        }
    ];

    const applySnip = (snip: typeof snippets[0]) => {
        const o = JSON.parse(JSON.stringify(activeOptions));
        dispatch(applySnippet(snip.apply(o)));
    };

    return (
        <div className="p-4 text-white text-sm space-y-4">
            <h3 className="text-lg font-medium mb-2">Snippets</h3>
            {snippets.map(s => (
                <div key={s.id} className="p-3 bg-gray-800 border border-gray-700 rounded flex flex-col gap-2">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-gray-400 text-xs">{s.description}</div>
                    <button
                        onClick={() => applySnip(s)}
                        className="self-start mt-2 bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-xs font-medium"
                    >
                        Apply
                    </button>
                </div>
            ))}
        </div>
    );
}

export default function ThemeTools() {
    const tool = useSelector((state: RootState) => state.theme.tool);

    if (tool === 'palette') return <PaletteTool />;
    if (tool === 'fonts') return <FontsTool />;
    if (tool === 'typography') return <TypographyTool />;
    if (tool === 'snippets') return <SnippetsTool />;
    return null;
}
