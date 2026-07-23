import React, { useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore, TEMPLATES, type Device, type ColorBlind, type Template } from '../store';
import { MuiThemed } from './MuiThemed';
import { SampleSite } from './SampleSite';
import { Icon } from './primitives';

const DEVICES: Array<{ id: Device; label: string; icon: string; width: number | null; radius: number; caption: string }> = [
  { id: 'phone', label: 'Phone', icon: 'smartphone', width: 375, radius: 26, caption: 'Phone · 375 px' },
  { id: 'tablet', label: 'Tablet', icon: 'tablet', width: 768, radius: 18, caption: 'Tablet · 768 px' },
  { id: 'desktop', label: 'Desktop', icon: 'desktop_windows', width: null, radius: 12, caption: 'Desktop · full width' }
];

const CB_MODES: Array<{ id: ColorBlind; label: string }> = [
  { id: 'off', label: 'Off' },
  { id: 'protanopia', label: 'Protanopia' },
  { id: 'deuteranopia', label: 'Deuteranopia' },
  { id: 'tritanopia', label: 'Tritanopia' }
];

function SegButton({ active, onClick, children, label }: { active: boolean; onClick: () => void; children: React.ReactNode; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className={`lift px-2.5 py-1.5 rounded-md text-sm flex items-center gap-1 ${
        active ? 'bg-accent hover:bg-accent-strong text-white' : 'bg-shell-2 hover:bg-shell-3 text-shell-muted'
      }`}
    >
      {children}
    </button>
  );
}

export function PreviewPane() {
  const device = useStore((s) => s.device);
  const setDevice = useStore((s) => s.setDevice);
  const template = useStore((s) => s.template);
  const setTemplate = useStore((s) => s.setTemplate);
  const colorBlind = useStore((s) => s.colorBlind);
  const setColorBlind = useStore((s) => s.setColorBlind);
  const compareBefore = useStore((s) => s.compareBefore);
  const toggleCompare = useStore((s) => s.toggleCompare);
  const options = useStore((s) => s.options);
  const lastSnapshot = useStore((s) => s.lastSnapshotOptions);
  const activeThemeId = useStore((s) => s.activeThemeId);
  const savedThemes = useStore((s) => s.savedThemes);

  const beforeOptions = useMemo(() => {
    if (lastSnapshot) return lastSnapshot;
    const active = savedThemes.find((t) => t.id === activeThemeId);
    return active?.themeOptions ?? options;
  }, [lastSnapshot, savedThemes, activeThemeId, options]);

  const shown = compareBefore ? beforeOptions : options;
  const dev = DEVICES.find((d) => d.id === device)!;
  const frameWidth = dev.width;

  return (
    <section className="flex flex-col gap-3 min-w-0" aria-label="Preview workspace">
      <h2 className="sr-only">Device Preview</h2>
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div role="group" aria-label="Device frame" className="flex gap-1.5 bg-shell-1 p-1 rounded-lg border border-shell-border">
          {DEVICES.map((d) => (
            <SegButton key={d.id} active={device === d.id} onClick={() => setDevice(d.id)} label={d.label}>
              <Icon name={d.icon} style={{ fontSize: 18 }} />
              <span className="hidden sm:inline">{d.label}</span>
            </SegButton>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-shell-muted bg-shell-1 px-2 py-1.5 rounded-lg border border-shell-border">
            <Icon name="visibility" style={{ fontSize: 16 }} />
            <span className="hidden sm:inline">Color Blindness</span>
            <select
              aria-label="Color blindness simulation"
              value={colorBlind}
              onChange={(e) => setColorBlind(e.target.value as ColorBlind)}
              className="bg-shell-2 text-shell-text rounded px-1.5 py-1 text-xs border border-shell-border"
            >
              {CB_MODES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <SegButton active={compareBefore} onClick={toggleCompare} label="Before After compare">
            <Icon name="compare" style={{ fontSize: 16 }} />
            {compareBefore ? 'Before' : 'After'}
          </SegButton>
        </div>
      </div>

      {/* Framed sample site — the chrome morphs (radius + device bar) as the
          device toggles reframe it, and the caption chip narrates the frame. */}
      <div className="flex flex-col items-center gap-2 bg-shell rounded-xl border border-shell-border p-3 overflow-hidden">
        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          animate={{ borderRadius: dev.radius }}
          className={`bg-shell-2 border-4 border-shell-3 shadow-2xl overflow-hidden ${colorBlind !== 'off' ? `cb-${colorBlind}` : 'cb-off'}`}
          style={{ width: '100%', maxWidth: frameWidth ?? 900 }}
          data-testid="preview-frame"
        >
          {/* device chrome bar */}
          <div className="flex items-center justify-center gap-1.5 bg-shell-3 border-b border-shell-border px-2" style={{ height: device === 'desktop' ? 26 : 18 }}>
            {device === 'phone' ? (
              <span className="w-12 h-1.5 rounded-full bg-shell-border" aria-hidden="true" />
            ) : device === 'tablet' ? (
              <span className="w-1.5 h-1.5 rounded-full bg-shell-border" aria-hidden="true" />
            ) : (
              <span className="flex gap-1 self-center mr-auto pl-1" aria-hidden="true">
                <span className="w-2 h-2 rounded-full bg-shell-border" />
                <span className="w-2 h-2 rounded-full bg-shell-border" />
                <span className="w-2 h-2 rounded-full bg-shell-border" />
              </span>
            )}
          </div>
          {/* nested template tabs */}
          <div className="flex flex-wrap gap-1 bg-shell-3 px-2 py-1.5 border-b border-shell-border" role="tablist" aria-label="Sample templates">
            {TEMPLATES.map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={template === t}
                onClick={() => setTemplate(t as Template)}
                className={`whitespace-nowrap text-xs px-2.5 py-1 rounded transition-colors ${
                  template === t ? 'bg-accent text-white' : 'text-shell-muted hover:text-shell-text hover:bg-shell-2'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div style={{ height: frameWidth ? 520 : 560 }} className="overflow-auto scrollbar-thin">
            <AnimatePresence mode="wait">
              <motion.div
                key={String(compareBefore) + template + device}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28 }}
                style={{ minHeight: '100%' }}
              >
                <MuiThemed options={shown}>
                  <SampleSite template={template} deviceWidth={frameWidth ?? 900} />
                </MuiThemed>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
        <AnimatePresence mode="wait">
          <motion.span
            key={dev.caption}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22 }}
            className="text-[11px] text-shell-muted bg-shell-1 border border-shell-border rounded-full px-2.5 py-0.5"
            role="status"
          >
            {dev.caption}
          </motion.span>
        </AnimatePresence>
        {compareBefore && (
          <p className="text-xs text-accent" role="status">
            Showing Before — the last saved snapshot. The editor and tools stay on the live options.
          </p>
        )}
      </div>
    </section>
  );
}
