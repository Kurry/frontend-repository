import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore, intentList } from '../store';
import { PRESETS, contrastRatio, contrastMatrix, assessHarmony, type Intent } from '../domain';
import { Icon } from './primitives';

// Swatches stay live with the editor and pulse briefly whenever the color
// changes (preset application re-keys every swatch, so the whole row settles).
function Swatch({ color }: { color: string }) {
  return (
    <motion.span
      key={color}
      initial={{ scale: 0.55 }}
      animate={{
        scale: 1,
        boxShadow: [
          '0 0 0 0 rgba(124,140,255,0.55)',
          '0 0 0 7px rgba(124,140,255,0)',
          '0 0 0 0 rgba(124,140,255,0)'
        ]
      }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="inline-block w-5 h-5 rounded-full border border-shell-border shrink-0"
      style={{ backgroundColor: color }}
      data-testid="palette-swatch"
    />
  );
}

function ColorField({ label, path, value }: { label: string; path: string; value: string }) {
  const setPaletteColor = useStore((s) => s.setPaletteColor);
  const [hex, setHex] = useState(value);
  const [err, setErr] = useState<string | null>(null);
  React.useEffect(() => setHex(value), [value]);
  const commit = (v: string) => {
    setHex(v);
    const res = setPaletteColor(path, v);
    setErr(res.ok ? null : res.error ?? 'Invalid color');
  };
  return (
    <div className="flex flex-col gap-1 py-1.5">
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} color`}
          value={/^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#000000'}
          onChange={(e) => commit(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer bg-transparent border border-shell-border"
        />
        <label className="text-xs text-shell-muted w-28">{label}</label>
        <input
          type="text"
          aria-label={`${label} hex value`}
          value={hex}
          onChange={(e) => commit(e.target.value)}
          className="flex-1 bg-shell-2 text-shell-text text-xs px-2 py-1 rounded border border-shell-border font-mono"
        />
        <Swatch color={/^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#000000'} />
      </div>
      {err && (
        <span className="text-xs text-red-300" role="alert">
          {err} ({path})
        </span>
      )}
    </div>
  );
}

function AccordionRow({
  id,
  title,
  swatches,
  children,
  defaultOpen = false
}: {
  id: string;
  title: string;
  swatches?: string[];
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-shell-border last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={`acc-${id}`}
        className="row-wash w-full flex items-center gap-2 px-3 py-2.5 text-left"
      >
        <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.2 }} className="flex">
          <Icon name="chevron_right" style={{ fontSize: 18 }} className="text-shell-muted" />
        </motion.span>
        <span className="text-sm text-shell-text flex-1">{title}</span>
        <span className="flex gap-1">{swatches?.map((c, i) => <Swatch key={i} color={c} />)}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`acc-${id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ToolCard({ id, title, icon, children }: { id: string; title: string; icon: string; children: React.ReactNode }) {
  return (
    <section id={id} className="bg-shell-1 rounded-xl border border-shell-border overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-shell-border">
        <Icon name={icon} style={{ fontSize: 18 }} className="text-accent" />
        <h3 className="text-sm font-medium">{title}</h3>
      </div>
      <div>{children}</div>
    </section>
  );
}

// Linked primary/secondary harmony guide — an interactive graphic beyond the
// contrast matrix: it watches the live pair, explains the tonal relationship,
// and offers a one-click suggested secondary when the pair is too close.
function HarmonyGuide() {
  const options = useStore((s) => s.options);
  const setPaletteColor = useStore((s) => s.setPaletteColor);
  const pushToast = useStore((s) => s.pushToast);
  const primary = options.palette.primary.main;
  const secondary = options.palette.secondary.main;
  const ratio = useMemo(() => contrastRatio(primary, secondary), [primary, secondary]);
  const verdict = useMemo(() => assessHarmony(primary, secondary), [primary, secondary]);

  return (
    <div className="px-3 py-2.5 border-t border-shell-border bg-shell/40" data-testid="harmony-guide">
      <div className="flex items-center gap-2 text-xs">
        <Icon name="tonality" style={{ fontSize: 15 }} className="text-accent" />
        <span className="text-shell-text font-medium">Harmony Guide</span>
        <span className="ml-auto font-mono text-shell-muted">{ratio.toFixed(2)}:1</span>
      </div>
      {verdict.kind === 'suggest' ? (
        <div className="flex items-center gap-2 mt-1.5">
          <span className="flex gap-1">
            <Swatch color={primary} />
            <Swatch color={secondary} />
            <Icon name="arrow_forward" style={{ fontSize: 14 }} className="text-shell-muted self-center" />
            <Swatch color={verdict.color} />
          </span>
          <span className="text-[11px] text-amber-300 flex-1">
            Primary and secondary are tonally close. {verdict.note}.
          </span>
          <button
            type="button"
            onClick={() => {
              setPaletteColor('secondary.main', verdict.color);
              pushToast('Harmony suggestion applied to secondary.main');
            }}
            className="lift bg-accent hover:bg-accent-strong text-white text-[11px] px-2 py-1 rounded whitespace-nowrap"
          >
            Apply
          </button>
        </div>
      ) : verdict.kind === 'close' ? (
        <p className="flex items-center gap-1.5 mt-1.5 text-[11px] text-amber-300">
          <Icon name="warning" style={{ fontSize: 14 }} />
          {verdict.note}
        </p>
      ) : (
        <p className="flex items-center gap-1.5 mt-1.5 text-[11px] text-green-300">
          <Icon name="check_circle" style={{ fontSize: 14 }} />
          Primary and secondary are well separated — accents will read distinctly.
        </p>
      )}
    </div>
  );
}

export function PaletteTool() {
  const options = useStore((s) => s.options);
  const setPaletteType = useStore((s) => s.setPaletteType);
  const p = options.palette;
  return (
    <ToolCard id="tool-palette" title="Palette" icon="palette">
      {/* Type row / Light-Dark toggle */}
      <AccordionRow id="type" title="Type" defaultOpen>
        <div className="flex items-center gap-2" role="group" aria-label="Palette type">
          {(['light', 'dark'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setPaletteType(t)}
              aria-pressed={p.type === t}
              className={`lift flex-1 py-1.5 rounded-md text-sm ${p.type === t ? 'bg-accent hover:bg-accent-strong text-white' : 'bg-shell-2 hover:bg-shell-3 text-shell-muted'}`}
            >
              <Icon name={t === 'light' ? 'light_mode' : 'dark_mode'} style={{ fontSize: 16 }} className="align-middle mr-1" />
              {t === 'light' ? 'Light' : 'Dark'}
            </button>
          ))}
        </div>
      </AccordionRow>
      <AccordionRow id="background" title="Background" swatches={[p.background.default, p.background.paper]}>
        <ColorField label="Default" path="background.default" value={p.background.default} />
        <ColorField label="Paper" path="background.paper" value={p.background.paper} />
      </AccordionRow>
      <AccordionRow id="text" title="Text" swatches={[p.text.primary, p.text.secondary]}>
        <ColorField label="Primary" path="text.primary" value={p.text.primary} />
        <ColorField label="Secondary" path="text.secondary" value={p.text.secondary} />
      </AccordionRow>
      {intentList().map((intent: Intent) => (
        <AccordionRow key={intent} id={intent} title={intent.charAt(0).toUpperCase() + intent.slice(1)} swatches={[p[intent].main]}>
          <ColorField label={`${intent}.main`} path={`${intent}.main`} value={p[intent].main} />
        </AccordionRow>
      ))}
      <AccordionRow id="divider" title="Divider" swatches={[p.divider]}>
        <ColorField label="Divider" path="divider" value={p.divider} />
      </AccordionRow>
      <HarmonyGuide />
    </ToolCard>
  );
}

export function PresetsStrip() {
  const applyPresetById = useStore((s) => s.applyPresetById);
  return (
    <ToolCard id="tool-presets" title="Presets" icon="auto_awesome">
      <div className="grid grid-cols-2 gap-2 p-3">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => applyPresetById(preset.id)}
            className="lift bg-shell-2 hover:bg-shell-3 rounded-lg p-2.5 text-left border border-shell-border"
          >
            <div className="flex gap-1 mb-1.5">
              {(['primary', 'secondary', 'error', 'success'] as const).map((k) => (
                <span key={k} className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.tokens[k] }} />
              ))}
            </div>
            <span className="text-xs text-shell-text">{preset.name}</span>
          </button>
        ))}
      </div>
    </ToolCard>
  );
}

export function FontsTypographyShape() {
  const options = useStore((s) => s.options);
  const fonts = useStore((s) => s.fonts);
  const addFont = useStore((s) => s.addFont);
  const setFontFamily = useStore((s) => s.setFontFamily);
  const setFontSize = useStore((s) => s.setFontSize);
  const setShapeRadius = useStore((s) => s.setShapeRadius);
  const applyOptions = useStore((s) => s.applyOptions);

  const [newFont, setNewFont] = useState('');
  const [sizeErr, setSizeErr] = useState<string | null>(null);
  const [radiusErr, setRadiusErr] = useState<string | null>(null);
  const [sizeVal, setSizeVal] = useState(String(options.typography.fontSize));
  const [radiusVal, setRadiusVal] = useState(String(options.shape.borderRadius));
  React.useEffect(() => setSizeVal(String(options.typography.fontSize)), [options.typography.fontSize]);
  React.useEffect(() => setRadiusVal(String(options.shape.borderRadius)), [options.shape.borderRadius]);

  const AVAILABLE_FONTS = ['Roboto', 'Roboto Mono', 'Roboto Slab', 'Open Sans', 'Lato', 'Inter'];

  const applySnippet = (kind: string) => {
    const next = structuredClone(options);
    if (kind === 'rounded') next.shape.borderRadius = 16;
    if (kind === 'square') next.shape.borderRadius = 0;
    if (kind === 'dense') next.typography.fontSize = 12;
    applyOptions(next);
  };

  return (
    <>
      <ToolCard id="tool-fonts" title="Fonts" icon="font_download">
        <div className="p-3 flex flex-col gap-2">
          <div className="flex gap-2">
            <select
              aria-label="Add a bundled font"
              value={newFont}
              onChange={(e) => setNewFont(e.target.value)}
              className="flex-1 bg-shell-2 text-shell-text text-xs px-2 py-1.5 rounded border border-shell-border"
            >
              <option value="">Choose a Font to Add</option>
              {AVAILABLE_FONTS.filter((f) => !fonts.includes(f)).map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!newFont}
              onClick={() => {
                addFont(newFont);
                setNewFont('');
              }}
              className="lift bg-accent hover:bg-accent-strong text-white px-3 py-1.5 rounded text-xs disabled:opacity-40 disabled:hover:bg-accent"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {fonts.map((f) => (
              <span key={f} className="text-xs bg-shell-2 px-2 py-1 rounded border border-shell-border">
                {f}
              </span>
            ))}
          </div>
        </div>
      </ToolCard>

      <ToolCard id="tool-typography" title="Typography" icon="text_fields">
        <div className="p-3 flex flex-col gap-2">
          <label className="text-xs text-shell-muted" htmlFor="font-family-select">
            Font Family
          </label>
          <select
            id="font-family-select"
            aria-label="Font family"
            value={options.typography.fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="bg-shell-2 text-shell-text text-xs px-2 py-1.5 rounded border border-shell-border"
          >
            {fonts.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <label className="text-xs text-shell-muted mt-1" htmlFor="font-size-input">
            Base Font Size (10–24)
          </label>
          <input
            id="font-size-input"
            type="number"
            aria-label="fontSize"
            value={sizeVal}
            min={10}
            max={24}
            onChange={(e) => {
              setSizeVal(e.target.value);
              const res = setFontSize(Number(e.target.value));
              setSizeErr(res.ok ? null : res.error ?? null);
            }}
            className="bg-shell-2 text-shell-text text-xs px-2 py-1.5 rounded border border-shell-border"
          />
          {sizeErr && (
            <span className="text-xs text-red-300" role="alert">
              {sizeErr}
            </span>
          )}
        </div>
      </ToolCard>

      <ToolCard id="tool-shape" title="Shape" icon="rounded_corner">
        <div className="p-3 flex flex-col gap-2">
          <label className="text-xs text-shell-muted" htmlFor="border-radius-input">
            Border Radius (0–24)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={24}
              value={/^\d+$/.test(radiusVal) ? Number(radiusVal) : 0}
              onChange={(e) => {
                setRadiusVal(e.target.value);
                const res = setShapeRadius(Number(e.target.value));
                setRadiusErr(res.ok ? null : res.error ?? null);
              }}
              aria-label="borderRadius slider"
              className="flex-1 accent-[var(--color-accent)]"
            />
            <input
              id="border-radius-input"
              type="number"
              aria-label="borderRadius"
              value={radiusVal}
              min={0}
              max={24}
              onChange={(e) => {
                setRadiusVal(e.target.value);
                const res = setShapeRadius(Number(e.target.value));
                setRadiusErr(res.ok ? null : res.error ?? null);
              }}
              className="w-16 bg-shell-2 text-shell-text text-xs px-2 py-1.5 rounded border border-shell-border"
            />
          </div>
          {radiusErr && (
            <span className="text-xs text-red-300" role="alert">
              {radiusErr}
            </span>
          )}
        </div>
      </ToolCard>

      <ToolCard id="tool-snippets" title="Snippets" icon="code_blocks">
        <div className="p-3 flex flex-wrap gap-2">
          {[
            { id: 'rounded', label: 'Rounded Corners' },
            { id: 'square', label: 'Square Corners' },
            { id: 'dense', label: 'Dense Typography' }
          ].map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => applySnippet(s.id)}
              className="lift bg-shell-2 hover:bg-shell-3 text-xs px-3 py-1.5 rounded border border-shell-border"
            >
              {s.label}
            </button>
          ))}
        </div>
      </ToolCard>
    </>
  );
}

export function ContrastMatrix() {
  const options = useStore((s) => s.options);
  const rows = useMemo(() => contrastMatrix(options), [options]);
  const badgeStyle: Record<string, string> = {
    AAA: 'bg-green-900/50 text-green-200 border-green-700',
    AA: 'bg-amber-900/40 text-amber-200 border-amber-700',
    Fail: 'bg-red-950/50 text-red-200 border-red-700'
  };
  const badgeIcon: Record<string, string> = { AAA: 'verified', AA: 'check_circle', Fail: 'cancel' };
  return (
    <ToolCard id="tool-contrast" title="Contrast Matrix" icon="contrast">
      <div className="divide-y divide-shell-border">
        {rows.map((r) => (
          <div key={r.id} className="flex items-center gap-2 px-3 py-2">
            <div className="flex gap-1">
              <span className="w-4 h-4 rounded border border-shell-border" style={{ backgroundColor: r.fg }} />
              <span className="w-4 h-4 rounded border border-shell-border" style={{ backgroundColor: r.bg }} />
            </div>
            <span className="text-xs text-shell-text flex-1">{r.label}</span>
            <span className="text-xs font-mono text-shell-muted">{r.ratio.toFixed(2)}:1</span>
            <motion.span
              key={r.level + r.ratio}
              initial={{ scale: 0.8, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25 }}
              className={`text-[11px] font-semibold px-1.5 py-0.5 rounded border flex items-center gap-1 ${badgeStyle[r.level]}`}
            >
              <Icon name={badgeIcon[r.level]} style={{ fontSize: 13 }} />
              {r.level}
            </motion.span>
          </div>
        ))}
      </div>
    </ToolCard>
  );
}

export function ToolsPanel() {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="sr-only">Theme Tools</h2>
      <PaletteTool />
      <PresetsStrip />
      <ContrastMatrix />
      <FontsTypographyShape />
    </div>
  );
}
