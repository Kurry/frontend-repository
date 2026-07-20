import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { updateActiveOptions, addFont, removeFont, applySnippet, ThemeOptions, defaultPaletteColor } from '../store/themeSlice';
import { Accordion, AccordionSummary, AccordionDetails, Snackbar } from '@mui/material';

function Chevron() {
    return <span className="material-symbols-outlined">expand_more</span>;
}

function shiftHue(hex: string, degrees: number) {
    const match = /^#([0-9a-f]{6})$/i.exec(hex);
    if (!match) return hex;
    const value = Number.parseInt(match[1], 16);
    let r = ((value >> 16) & 255) / 255;
    let g = ((value >> 8) & 255) / 255;
    let b = (value & 255) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lightness = (max + min) / 2;
    const delta = max - min;
    let hue = 0;
    let saturation = 0;
    if (delta) {
        saturation = delta / (1 - Math.abs(2 * lightness - 1));
        if (max === r) hue = 60 * (((g - b) / delta) % 6);
        else if (max === g) hue = 60 * ((b - r) / delta + 2);
        else hue = 60 * ((r - g) / delta + 4);
    }
    hue = (hue + degrees + 360) % 360;
    const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
    const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
    const m = lightness - chroma / 2;
    const channels = hue < 60 ? [chroma, x, 0] : hue < 120 ? [x, chroma, 0] : hue < 180 ? [0, chroma, x] : hue < 240 ? [0, x, chroma] : hue < 300 ? [x, 0, chroma] : [chroma, 0, x];
    [r, g, b] = channels.map(channel => channel + m);
    return `#${[r, g, b].map(channel => Math.round(channel * 255).toString(16).padStart(2, '0')).join('')}`;
}

function contrastRatio(background: string, foreground: string) {
    const luminance = (hex: string) => {
        const match = /^#([0-9a-f]{6})$/i.exec(hex);
        if (!match) return null;
        const value = Number.parseInt(match[1], 16);
        const channels = [value >> 16, (value >> 8) & 255, value & 255].map(channel => {
            const normalized = channel / 255;
            return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    };
    const bg = luminance(background);
    const fg = luminance(foreground);
    if (bg == null || fg == null) return null;
    return (Math.max(bg, fg) + 0.05) / (Math.min(bg, fg) + 0.05);
}

function PaletteTool() {
    const dispatch = useDispatch();
    const activeOptions = useSelector((state: RootState) => state.theme.activeOptions);
    const [intentDrafts, setIntentDrafts] = useState<Record<string, string>>({});
    const [intentErrors, setIntentErrors] = useState<Record<string, string>>({});
    const p = activeOptions.palette;

    const intents = ['primary', 'secondary', 'error', 'warning', 'info', 'success'] as const;
    const updateIntent = (intent: string, channel: string, val: string) => {
        const key = `${intent}.${channel}`;
        if (!/^#[0-9a-fA-F]{6}$/.test(val)) {
            setIntentDrafts(current => ({ ...current, [key]: val }));
            setIntentErrors(current => ({ ...current, [key]: `palette.${key} must be #RRGGBB` }));
            return;
        }
        setIntentDrafts(current => {
            const next = { ...current };
            delete next[key];
            return next;
        });
        setIntentErrors(current => {
            const next = { ...current };
            delete next[key];
            return next;
        });
        const newOptions = JSON.parse(JSON.stringify(activeOptions));
        if (newOptions.palette[intent]) {
            newOptions.palette[intent][channel] = val;
            dispatch(updateActiveOptions(newOptions));
        }
    };

    const deriveHarmonics = (kind: 'complementary' | 'analogous' | 'triadic') => {
        const newOptions = JSON.parse(JSON.stringify(activeOptions));
        const degrees = kind === 'complementary' ? 180 : kind === 'analogous' ? 30 : 120;
        newOptions.palette.secondary = defaultPaletteColor(shiftHue(activeOptions.palette.primary.main, degrees));
        dispatch(updateActiveOptions(newOptions));
    };

    const setPaletteType = (type: 'light' | 'dark') => {
        const o = JSON.parse(JSON.stringify(activeOptions));
        o.palette.type = type;
        if (type === 'dark') {
            o.palette.background = { default: '#121212', paper: '#1e1e1e' };
            o.palette.text = {
                primary: '#ffffff',
                secondary: '#b3b3b3',
                disabled: '#757575',
                hint: '#757575'
            };
            o.palette.divider = '#424242';
        } else {
            o.palette.background = { default: '#fafafa', paper: '#ffffff' };
            o.palette.text = {
                primary: '#212121',
                secondary: '#757575',
                disabled: '#9e9e9e',
                hint: '#9e9e9e'
            };
            o.palette.divider = '#e0e0e0';
        }
        dispatch(updateActiveOptions(o));
    };

    const getWcag = (bg: string, fg: string) => {
        const ratio = contrastRatio(bg, fg);
        if (ratio == null) return 'Fail';
        if (ratio >= 7) return 'Pass AAA';
        if (ratio >= 4.5) return 'Pass AA';
        return 'Fail';
    };

    return (
        <div className="p-4 text-white text-sm">
            <h3 className="text-lg font-medium mb-4">Palette</h3>

            <div className="mb-4 flex items-center gap-4">
                <span className="font-medium">Type</span>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="ptype" checked={p.type === 'light'} onChange={() => setPaletteType('light')} /> Light
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="ptype" checked={p.type === 'dark'} onChange={() => setPaletteType('dark')} /> Dark
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
                                    <div className="flex-1 min-w-0">
                                        <input
                                            type="text"
                                            value={intentDrafts[`${intent}.${ch}`] ?? color[ch]}
                                            onChange={(e) => updateIntent(intent, ch, e.target.value)}
                                            aria-invalid={!!intentErrors[`${intent}.${ch}`]}
                                            aria-describedby={intentErrors[`${intent}.${ch}`] ? `palette-${intent}-${ch}-error` : undefined}
                                            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 w-full uppercase text-xs text-white"
                                        />
                                        {intentErrors[`${intent}.${ch}`] && (
                                            <p id={`palette-${intent}-${ch}-error`} className="mt-1 text-xs text-red-400" role="alert">
                                                {intentErrors[`${intent}.${ch}`]}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {intent === 'primary' && (
                                <div className="pt-2 border-t border-gray-800 mt-2 flex flex-wrap gap-2">
                                    <span className="w-full text-xs text-gray-400">Harmonics</span>
                                    <button onClick={() => deriveHarmonics('complementary')} className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700">Complementary</button>
                                    <button onClick={() => deriveHarmonics('analogous')} className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700">Analogous</button>
                                    <button onClick={() => deriveHarmonics('triadic')} className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700">Triadic</button>
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
            <p className="text-gray-400 mb-4 text-xs">Add a locally available font family by name. Added fonts become available to Typography and the preview.</p>
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
    const [fontSizeDraft, setFontSizeDraft] = useState<string | null>(null);
    const [fontSizeError, setFontSizeError] = useState('');
    const [borderRadiusDraft, setBorderRadiusDraft] = useState<string | null>(null);
    const [borderRadiusError, setBorderRadiusError] = useState('');
    const t = activeOptions.typography;
    const s = activeOptions.shape;
    const fontOptions = Array.from(new Set([t.fontFamily, ...fonts]));

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
                        {fontOptions.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-gray-400 mb-1 text-xs">Base Font Size (8-24px)</label>
                    <input
                        type="number"
                        min="8" max="24"
                        value={fontSizeDraft ?? t.fontSize}
                        aria-invalid={!!fontSizeError}
                        onChange={e => {
                            const raw = e.target.value;
                            const val = Number(raw);
                            setFontSizeDraft(raw);
                            if (!raw.trim() || !Number.isInteger(val) || val < 8 || val > 24) {
                                setFontSizeError('typography.fontSize must be an integer from 8 through 24');
                                return;
                            }
                            setFontSizeError('');
                            setFontSizeDraft(null);
                            const o = JSON.parse(JSON.stringify(activeOptions));
                            o.typography.fontSize = val;
                            dispatch(updateActiveOptions(o));
                        }}
                        className="w-full bg-gray-800 text-white border border-gray-700 rounded px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    />
                    {fontSizeError && <p className="mt-1 text-xs text-red-400" role="alert">{fontSizeError}</p>}
                </div>

                <div>
                    <label className="block text-gray-400 mb-1 text-xs">Border Radius (0-24px)</label>
                    <input
                        type="number"
                        min="0" max="24"
                        value={borderRadiusDraft ?? s.borderRadius}
                        aria-invalid={!!borderRadiusError}
                        onChange={e => {
                            const raw = e.target.value;
                            const val = Number(raw);
                            setBorderRadiusDraft(raw);
                            if (!raw.trim() || !Number.isFinite(val) || val < 0 || val > 24) {
                                setBorderRadiusError('shape.borderRadius must be a number from 0 through 24');
                                return;
                            }
                            setBorderRadiusError('');
                            setBorderRadiusDraft(null);
                            const o = JSON.parse(JSON.stringify(activeOptions));
                            o.shape.borderRadius = val;
                            dispatch(updateActiveOptions(o));
                        }}
                        className="w-full bg-gray-800 text-white border border-gray-700 rounded px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    />
                    {borderRadiusError && <p className="mt-1 text-xs text-red-400" role="alert">{borderRadiusError}</p>}
                </div>
            </div>
        </div>
    );
}

function SnippetsTool() {
    const dispatch = useDispatch();
    const activeOptions = useSelector((state: RootState) => state.theme.activeOptions);
    const [toastMsg, setToastMsg] = useState('');

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
        setToastMsg(`${snip.name} applied`);
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
            <Snackbar
                open={!!toastMsg}
                autoHideDuration={3000}
                onClose={() => setToastMsg('')}
                message={toastMsg}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />
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
