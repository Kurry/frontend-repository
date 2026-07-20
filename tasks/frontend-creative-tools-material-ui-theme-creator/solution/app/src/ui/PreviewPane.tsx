import React, { useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore, TEMPLATES, type Device, type ColorBlind, type Template } from '../store';
import { MuiThemed } from './MuiThemed';
import { SampleSite } from './SampleSite';
import { Icon } from './primitives';

const DEVICES: Array<{ id: Device; label: string; icon: string; width: number | null }> = [
  { id: 'phone', label: 'Phone', icon: 'smartphone', width: 375 },
  { id: 'tablet', label: 'Tablet', icon: 'tablet', width: 768 },
  { id: 'desktop', label: 'Desktop', icon: 'desktop_windows', width: null }
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
        active ? 'bg-accent text-white' : 'bg-shell-2 text-shell-muted'
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

      {/* Framed sample site */}
      <div className="flex justify-center bg-shell rounded-xl border border-shell-border p-3 overflow-hidden">
        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          className={`bg-shell-2 rounded-xl border-4 border-shell-3 shadow-2xl overflow-hidden ${colorBlind !== 'off' ? `cb-${colorBlind}` : 'cb-off'}`}
          style={{ width: frameWidth ? Math.min(frameWidth, 900) : '100%', maxWidth: '100%' }}
          data-testid="preview-frame"
        >
          {/* nested template tabs */}
          <div className="flex gap-1 overflow-x-auto scrollbar-thin bg-shell-3 px-2 py-1.5 border-b border-shell-border" role="tablist" aria-label="Sample templates">
            {TEMPLATES.map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={template === t}
                onClick={() => setTemplate(t as Template)}
                className={`inert-link whitespace-nowrap text-xs px-2.5 py-1 rounded ${
                  template === t ? 'bg-accent text-white' : 'text-shell-muted'
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
      </div>
      {compareBefore && (
        <p className="text-xs text-accent" role="status">
          Showing Before — the last saved snapshot. The editor and tools stay on the live options.
        </p>
      )}
    </section>
  );
}
