import { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import {
  updateActiveOptions,
  addFont,
  removeFont,
  applySnippet,
  announce,
  flashPreview,
  ThemeOptions,
  defaultPaletteColor,
} from '../store/themeSlice';
import { Accordion, AccordionSummary, AccordionDetails, Snackbar } from '@mui/material';

function Chevron() {
  return <span className="material-symbols-outlined" aria-hidden="true">expand_more</span>;
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

/** Keyboard nudge: ArrowUp/ArrowDown steps every RGB channel by ±1 (clamped). */
function nudgeHex(hex: string, direction: 1 | -1): string | null {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) return null;
  const value = Number.parseInt(match[1], 16);
  const clamp = (channel: number) => Math.max(0, Math.min(255, channel + direction));
  const r = clamp((value >> 16) & 255);
  const g = clamp((value >> 8) & 255);
  const b = clamp(value & 255);
  return `#${[r, g, b].map(channel => channel.toString(16).padStart(2, '0')).join('')}`;
}

function PaletteTool() {
  const dispatch = useDispatch();
  const activeOptions = useSelector((state: RootState) => state.theme.activeOptions);
  const [intentDrafts, setIntentDrafts] = useState<Record<string, string>>({});
  const [intentErrors, setIntentErrors] = useState<Record<string, string>>({});
  const [pulsingIntent, setPulsingIntent] = useState<string | null>(null);
  const pulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const p = activeOptions.palette;

  useEffect(() => () => {
    if (pulseTimer.current) clearTimeout(pulseTimer.current);
  }, []);

  const intents = ['primary', 'secondary', 'error', 'warning', 'info', 'success'] as const;

  const pulse = (intent: string) => {
    if (pulseTimer.current) clearTimeout(pulseTimer.current);
    setPulsingIntent(intent);
    pulseTimer.current = setTimeout(() => setPulsingIntent(null), 650);
  };

  const updateIntent = (intent: string, channel: string, val: string) => {
    const key = `${intent}.${channel}`;
    if (!/^#[0-9a-fA-F]{6}$/.test(val)) {
      setIntentDrafts(current => ({ ...current, [key]: val }));
      const message = `palette.${key} must be a #RRGGBB color`;
      setIntentErrors(current => ({ ...current, [key]: message }));
      dispatch(announce(message));
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
    if ((newOptions.palette as any)[intent]) {
      (newOptions.palette as any)[intent][channel] = val;
      dispatch(updateActiveOptions(newOptions));
      pulse(intent);
    }
  };

  const deriveHarmonics = (kind: 'complementary' | 'analogous' | 'triadic') => {
    const newOptions = JSON.parse(JSON.stringify(activeOptions));
    const degrees = kind === 'complementary' ? 180 : kind === 'analogous' ? 30 : 120;
    const derived = shiftHue(activeOptions.palette.primary.main, degrees);
    newOptions.palette.secondary = defaultPaletteColor(derived);
    dispatch(updateActiveOptions(newOptions));
    dispatch(flashPreview());
    pulse('secondary');
    const label = kind === 'complementary' ? 'Complementary' : kind === 'analogous' ? 'Analogous' : 'Triadic';
    dispatch(announce(`${label} harmonics applied — secondary main is now ${derived}`));
  };

  const setPaletteType = (type: 'light' | 'dark') => {
    const o = JSON.parse(JSON.stringify(activeOptions));
    o.palette.type = type;
    if (type === 'dark') {
      o.palette.background = { default: '#121212', paper: '#1e1e1e' };
      o.palette.text = { primary: '#ffffff', secondary: '#b3b3b3', disabled: '#757575', hint: '#757575' };
      o.palette.divider = '#424242';
    } else {
      o.palette.background = { default: '#fafafa', paper: '#ffffff' };
      o.palette.text = { primary: '#212121', secondary: '#757575', disabled: '#9e9e9e', hint: '#9e9e9e' };
      o.palette.divider = '#e0e0e0';
    }
    dispatch(updateActiveOptions(o));
    dispatch(announce(`Palette type set to ${type}`));
  };

  const getWcag = (bg: string, fg: string) => {
    const ratio = contrastRatio(bg, fg);
    if (ratio == null) return { label: 'Fail', ratio: null as number | null };
    if (ratio >= 7) return { label: 'Pass AAA', ratio };
    if (ratio >= 4.5) return { label: 'Pass AA', ratio };
    return { label: 'Fail', ratio };
  };

  const handleHexKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, intent: string, channel: string, current: string) => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    const nudged = nudgeHex(current, event.key === 'ArrowUp' ? 1 : -1);
    if (nudged) updateIntent(intent, channel, nudged);
  };

  return (
    <div className="p-4 text-white text-sm">
      <h3 className="text-lg font-medium mb-4">Palette</h3>

      <div className="mb-4 flex items-center gap-4">
        <span className="font-medium" id="palette-type-label">Type</span>
        <label className="flex items-center gap-2 cursor-pointer min-h-11">
          <input type="radio" name="ptype" checked={p.type === 'light'} onChange={() => setPaletteType('light')} /> Light
        </label>
        <label className="flex items-center gap-2 cursor-pointer min-h-11">
          <input type="radio" name="ptype" checked={p.type === 'dark'} onChange={() => setPaletteType('dark')} /> Dark
        </label>
      </div>

      <Accordion disableGutters className="!bg-gray-800 !text-white !mb-2 rounded">
        <AccordionSummary expandIcon={<Chevron />} className="hover:bg-gray-700/50">
          Background / Text
        </AccordionSummary>
        <AccordionDetails className="bg-gray-900 border-t border-gray-700">
          <div className="space-y-3">
            <label className="flex items-center gap-2"><span className="w-24">Default bg</span><input type="color" value={p.background?.default ?? '#fafafa'} aria-label="Background default color" onChange={e => {
              const o = JSON.parse(JSON.stringify(activeOptions)); o.palette.background = { ...(o.palette.background || {}), default: e.target.value }; dispatch(updateActiveOptions(o));
            }} className="bg-transparent border-0 w-8 h-8 cursor-pointer p-0 rounded-full" /></label>
            <label className="flex items-center gap-2"><span className="w-24">Paper bg</span><input type="color" value={p.background?.paper ?? '#ffffff'} aria-label="Background paper color" onChange={e => {
              const o = JSON.parse(JSON.stringify(activeOptions)); o.palette.background = { ...(o.palette.background || {}), paper: e.target.value }; dispatch(updateActiveOptions(o));
            }} className="bg-transparent border-0 w-8 h-8 cursor-pointer p-0 rounded-full" /></label>
            <label className="flex items-center gap-2"><span className="w-24">Text primary</span><input type="color" value={p.text?.primary ?? '#000000'} aria-label="Text primary color" onChange={e => {
              const o = JSON.parse(JSON.stringify(activeOptions)); o.palette.text = { ...(o.palette.text || {}), primary: e.target.value }; dispatch(updateActiveOptions(o));
            }} className="bg-transparent border-0 w-8 h-8 cursor-pointer p-0 rounded-full" /></label>
            <label className="flex items-center gap-2"><span className="w-24">Divider</span><input type="color" value={p.divider ?? '#e0e0e0'} aria-label="Divider color" onChange={e => {
              const o = JSON.parse(JSON.stringify(activeOptions)); o.palette.divider = e.target.value; dispatch(updateActiveOptions(o));
            }} className="bg-transparent border-0 w-8 h-8 cursor-pointer p-0 rounded-full" /></label>
          </div>
        </AccordionDetails>
      </Accordion>

      {intents.map(intent => {
        const color = (p as any)[intent];
        if (!color) return null;
        const wcag = getWcag(color.main, color.contrastText);
        const bgWcag = getWcag(p.background?.default || '#fafafa', color.main);
        return (
          <Accordion key={intent} disableGutters className="!bg-gray-800 !text-white !mb-2 rounded">
            <AccordionSummary expandIcon={<Chevron />} className="hover:bg-gray-700/50 flex items-center" aria-label={`${intent} palette row`}>
              <div className="flex items-center gap-3 w-full">
                <div
                  className={`w-5 h-5 rounded-full border border-gray-600 ${pulsingIntent === intent ? 'animate-swatch-pulse' : ''}`}
                  style={{ backgroundColor: color.main }}
                  aria-hidden="true"
                ></div>
                <span className="capitalize flex-1">{intent}</span>
                <span
                  key={`${wcag.label}-${color.main}-${color.contrastText}`}
                  className="animate-wcag-settle text-xs px-2 py-0.5 bg-gray-900 rounded"
                  title="WCAG contrast of main versus contrastText"
                >
                  {wcag.label}
                  {wcag.ratio != null && <span className="text-gray-400"> · {wcag.ratio.toFixed(1)}:1</span>}
                </span>
              </div>
            </AccordionSummary>
            <AccordionDetails className="bg-gray-900 border-t border-gray-700 space-y-3 pt-4">
              <div className="flex gap-4 mb-4" aria-label="Contrast pairing visualizer">
                <div className="flex-1 rounded p-3 flex flex-col justify-center items-center text-center shadow-inner" style={{ backgroundColor: color.main, color: color.contrastText }}>
                  <span className="text-sm font-medium">Text on Main</span>
                  <span className="text-[10px] opacity-80">{wcag.ratio?.toFixed(2)}:1 ({wcag.label})</span>
                </div>
                <div className="flex-1 rounded p-3 flex flex-col justify-center items-center text-center shadow-inner" style={{ backgroundColor: p.background?.default || '#fafafa', color: color.main }}>
                  <span className="text-sm font-medium">Main on Background</span>
                  <span className="text-[10px] opacity-80">{bgWcag.ratio?.toFixed(2)}:1 ({bgWcag.label})</span>
                </div>
              </div>
              {(['main', 'light', 'dark', 'contrastText'] as const).map(ch => (
                <div key={ch} className="flex items-center gap-2">
                  <span className="w-24 capitalize">{ch}</span>
                  <input
                    type="color"
                    value={color[ch]}
                    aria-label={`${intent} ${ch} color picker`}
                    onChange={(e) => updateIntent(intent, ch, e.target.value)}
                    className="bg-transparent border-0 w-8 h-8 cursor-pointer p-0 rounded-full shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={intentDrafts[`${intent}.${ch}`] ?? color[ch]}
                      onChange={(e) => updateIntent(intent, ch, e.target.value)}
                      onKeyDown={(e) => handleHexKeyDown(e, intent, ch, color[ch])}
                      aria-invalid={!!intentErrors[`${intent}.${ch}`]}
                      aria-describedby={intentErrors[`${intent}.${ch}`] ? `palette-${intent}-${ch}-error` : undefined}
                      aria-label={`${intent}.${ch} hex value — use ArrowUp and ArrowDown to nudge`}
                      className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 w-full uppercase text-xs text-white outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
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
                <div className="pt-2 border-t border-gray-800 mt-2 flex flex-wrap gap-2 items-center">
                  <span className="w-full text-xs text-gray-400">Harmonics — derive secondary main from primary</span>
                  <button type="button" onClick={() => deriveHarmonics('complementary')} className="text-xs px-3 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 transition-colors min-h-11 outline-none focus-visible:ring-2 focus-visible:ring-blue-400">Complementary</button>
                  <button type="button" onClick={() => deriveHarmonics('analogous')} className="text-xs px-3 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 transition-colors min-h-11 outline-none focus-visible:ring-2 focus-visible:ring-blue-400">Analogous</button>
                  <button type="button" onClick={() => deriveHarmonics('triadic')} className="text-xs px-3 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 transition-colors min-h-11 outline-none focus-visible:ring-2 focus-visible:ring-blue-400">Triadic</button>
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
    const family = newFont.trim();
    if (!family) return;
    if (fonts.some(f => f.toLowerCase() === family.toLowerCase())) {
      const message = `Font "${family}" is already loaded — duplicates are not added`;
      setErr(message);
      dispatch(announce(message));
      return;
    }
    dispatch(addFont(family));
    setNewFont('');
    setErr('');
    dispatch(announce(`Font ${family} added`));
  };

  return (
    <div className="p-4 text-white text-sm">
      <h3 className="text-lg font-medium mb-4">Fonts</h3>
      <p className="text-gray-400 mb-4 text-xs">Add a font family by name. Added fonts become available to Typography and the preview. Roboto is the protected base family and cannot be removed.</p>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={newFont}
          onChange={e => { setNewFont(e.target.value); setErr(''); }}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="e.g. Open Sans"
          aria-label="Font family name"
          className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 min-h-11 outline-none focus-visible:ring-2 focus-visible:ring-blue-400 text-white"
        />
        <button type="button" onClick={handleAdd} className="bg-blue-600 hover:bg-blue-500 text-white px-4 rounded font-medium transition-colors min-h-11 outline-none focus-visible:ring-2 focus-visible:ring-blue-400">Add</button>
      </div>
      {err && <p className="text-red-400 text-xs mb-4" role="alert">{err}</p>}
      <ul className="space-y-2 mt-4">
        {fonts.map(f => (
          <li key={f} className="flex justify-between items-center p-2 bg-gray-800 rounded border border-gray-700">
            <span>{f}{f === 'Roboto' && <span className="ml-2 text-xs text-gray-500">(base — protected)</span>}</span>
            {f !== 'Roboto' ? (
              <button
                type="button"
                onClick={() => {
                  dispatch(removeFont(f));
                  dispatch(announce(`Font ${f} removed`));
                }}
                className="text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors min-w-11 min-h-11 flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                aria-label={`Remove ${f}`}
              >
                <span className="material-symbols-outlined text-sm" aria-hidden="true">close</span>
              </button>
            ) : (
              <span className="min-w-11 min-h-11 flex items-center justify-center text-gray-600" title="Roboto cannot be removed" aria-label="Roboto is protected from removal">
                <span className="material-symbols-outlined text-sm" aria-hidden="true">lock</span>
              </span>
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

  const setFontSize = (raw: string) => {
    const val = Number(raw);
    setFontSizeDraft(raw);
    if (!raw.trim() || !Number.isInteger(val) || val < 8 || val > 24) {
      const message = 'typography.fontSize must be an integer from 8 through 24';
      setFontSizeError(message);
      dispatch(announce(message));
      if (!raw.trim() || !Number.isFinite(val)) return;
      // Clamp values and dispatch them anyway so error does not block the UI workflow permanently
      const clamped = Math.max(8, Math.min(24, Math.round(val)));
      const o = JSON.parse(JSON.stringify(activeOptions));
      o.typography.fontSize = clamped;
      dispatch(updateActiveOptions(o));
      return;
    }
    setFontSizeError('');
    setFontSizeDraft(null);
    const o = JSON.parse(JSON.stringify(activeOptions));
    o.typography.fontSize = val;
    dispatch(updateActiveOptions(o));
  };

  const setBorderRadius = (raw: string) => {
    const val = Number(raw);
    setBorderRadiusDraft(raw);
    if (!raw.trim() || !Number.isFinite(val) || val < 0 || val > 24) {
      const message = 'shape.borderRadius must be a number from 0 through 24';
      setBorderRadiusError(message);
      dispatch(announce(message));
      if (!raw.trim() || !Number.isFinite(val)) return;
      const clamped = Math.max(0, Math.min(24, val));
      const o = JSON.parse(JSON.stringify(activeOptions));
      o.shape.borderRadius = clamped;
      dispatch(updateActiveOptions(o));
      return;
    }
    setBorderRadiusError('');
    setBorderRadiusDraft(null);
    const o = JSON.parse(JSON.stringify(activeOptions));
    o.shape.borderRadius = val;
    dispatch(updateActiveOptions(o));
  };

  return (
    <div className="p-4 text-white text-sm">
      <h3 className="text-lg font-medium mb-4">Typography &amp; Shape</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-gray-400 mb-1 text-xs" htmlFor="font-family-select">Font Family</label>
          <select
            id="font-family-select"
            value={t.fontFamily}
            onChange={e => {
              const o = JSON.parse(JSON.stringify(activeOptions));
              o.typography.fontFamily = e.target.value;
              dispatch(updateActiveOptions(o));
              dispatch(announce(`typography.fontFamily set to ${e.target.value}`));
            }}
            className="w-full bg-gray-800 text-white border border-gray-700 rounded px-2 py-2 min-h-11 outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            {fontOptions.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-gray-400 mb-1 text-xs" htmlFor="font-size-input">Base Font Size (8–24px)</label>
          <input
            id="font-size-input"
            type="number"
            min="8" max="24"
            value={fontSizeDraft ?? t.fontSize}
            aria-invalid={!!fontSizeError}
            aria-describedby={fontSizeError ? 'font-size-error' : undefined}
            onChange={e => setFontSize(e.target.value)}
            className="w-full bg-gray-800 text-white border border-gray-700 rounded px-2 py-1 min-h-11 outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          />
          {fontSizeError && <p id="font-size-error" className="mt-1 text-xs text-red-400" role="alert">{fontSizeError}</p>}
        </div>

        <div>
          <label className="block text-gray-400 mb-1 text-xs" htmlFor="border-radius-input">Border Radius (0–24px)</label>
          <input
            id="border-radius-input"
            type="number"
            min="0" max="24"
            value={borderRadiusDraft ?? s.borderRadius}
            aria-invalid={!!borderRadiusError}
            aria-describedby={borderRadiusError ? 'border-radius-error' : undefined}
            onChange={e => setBorderRadius(e.target.value)}
            className="w-full bg-gray-800 text-white border border-gray-700 rounded px-2 py-1 min-h-11 outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          />
          {borderRadiusError && <p id="border-radius-error" className="mt-1 text-xs text-red-400" role="alert">{borderRadiusError}</p>}
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
      description: 'Increase shape.borderRadius to 12 on paper surfaces.',
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
    dispatch(announce(`${snip.name} snippet applied`));
  };

  return (
    <div className="p-4 text-white text-sm space-y-4">
      <h3 className="text-lg font-medium mb-2">Snippets</h3>
      {snippets.map(s => (
        <div key={s.id} className="p-3 bg-gray-800 border border-gray-700 rounded flex flex-col gap-2">
          <div className="font-medium">{s.name}</div>
          <div className="text-gray-400 text-xs">{s.description}</div>
          <button
            type="button"
            onClick={() => applySnip(s)}
            className="self-start mt-2 bg-blue-600 hover:bg-blue-500 px-4 rounded text-xs font-medium transition-colors min-h-11 outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
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
