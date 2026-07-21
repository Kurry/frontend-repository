import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { setDevice, setColorBlindness, setCompareMode } from '../store/themeSlice';
import SampleSite from './SampleSite';
import { useEffect } from 'react';
import EditorSidebar from './EditorSidebar';

const TEMPLATE_LABELS: Record<string, string> = {
  instructions: 'Instructions',
  signup: 'Sign Up',
  dashboard: 'Dashboard',
  blog: 'Blog',
  pricing: 'Pricing',
  checkout: 'Checkout',
};

export default function PreviewTab() {
  const dispatch = useDispatch();
  const device = useSelector((state: RootState) => state.theme.device);
  const sample = useSelector((state: RootState) => state.theme.sample);
  const colorBlindness = useSelector((state: RootState) => state.theme.colorBlindness);
  const compareMode = useSelector((state: RootState) => state.theme.compareMode);
  const previewFlash = useSelector((state: RootState) => state.theme.previewFlash);

  const activeOptions = useSelector((state: RootState) => state.theme.activeOptions);
  const activeId = useSelector((state: RootState) => state.theme.activeId);
  const savedOptions = useSelector((state: RootState) => {
    const theme = state.theme.themes.find(candidate => candidate.id === activeId);
    const versions = theme?.versions;
    return (versions?.length ? versions[versions.length - 1].options : undefined) ?? theme?.options;
  });
  const previewOptions = compareMode && savedOptions ? savedOptions : activeOptions;

  useEffect(() => {
    const root = document.documentElement;
    const o = previewOptions;
    const p = o.palette;
    const t = o.typography;
    const shape = o.shape;
    const radius = shape.borderRadius;
    const spacing = o.spacing ?? 8;

    root.style.setProperty('--preview-primary', p.primary.main);
    root.style.setProperty('--preview-primary-light', p.primary.light);
    root.style.setProperty('--preview-primary-dark', p.primary.dark);
    root.style.setProperty('--preview-primary-contrast', p.primary.contrastText);

    root.style.setProperty('--preview-secondary', p.secondary.main);
    root.style.setProperty('--preview-secondary-light', p.secondary.light);
    root.style.setProperty('--preview-secondary-dark', p.secondary.dark);
    root.style.setProperty('--preview-secondary-contrast', p.secondary.contrastText);

    root.style.setProperty('--preview-error', p.error.main);
    root.style.setProperty('--preview-warning', p.warning.main);
    root.style.setProperty('--preview-info', p.info.main);
    root.style.setProperty('--preview-success', p.success.main);

    root.style.setProperty('--preview-bg', p.background?.default ?? '#fafafa');
    root.style.setProperty('--preview-paper', p.background?.paper ?? '#ffffff');
    root.style.setProperty('--preview-text', p.text?.primary ?? 'rgba(0,0,0,0.87)');
    root.style.setProperty('--preview-text-secondary', p.text?.secondary ?? 'rgba(0,0,0,0.54)');
    root.style.setProperty('--preview-divider', p.divider ?? 'rgba(0,0,0,0.12)');

    root.style.setProperty('--preview-font', t.fontFamily);
    root.style.setProperty('--preview-font-size', `${t.fontSize}px`);
    root.style.setProperty('--preview-radius', `${radius}px`);
    root.style.setProperty('--preview-spacing', `${spacing}px`);
    root.style.setProperty('--preview-button-transform', t.button?.textTransform ?? 'uppercase');
  }, [previewOptions]);

  return (
    <div className="flex h-full w-full flex-col lg:flex-row bg-[#1e1e1e]">
      <svg aria-hidden="true" style={{ width: 0, height: 0, position: 'absolute' }}>
        <defs>
          <filter id="cb-protanopia"><feColorMatrix type="matrix" values="0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0" /></filter>
          <filter id="cb-deuteranopia"><feColorMatrix type="matrix" values="0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0" /></filter>
          <filter id="cb-tritanopia"><feColorMatrix type="matrix" values="0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0" /></filter>
        </defs>
      </svg>

      <div className="flex-1 flex flex-col min-w-0 border-r border-gray-700 bg-gray-900/50">
        <div className="flex flex-wrap items-center p-2 gap-x-4 gap-y-2 border-b border-gray-700 bg-gray-900">
          <div className="flex gap-1 bg-gray-800 rounded p-1" role="group" aria-label="Device frame">
            {(['phone', 'tablet', 'desktop'] as const).map(d => (
              <button
                key={d}
                type="button"
                aria-label={`${d.charAt(0).toUpperCase() + d.slice(1)} frame`}
                aria-pressed={device === d}
                className={`p-1.5 rounded transition-colors duration-200 flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-blue-400 min-w-11 min-h-11 ${device === d ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'}`}
                title={d.charAt(0).toUpperCase() + d.slice(1)}
                onClick={() => dispatch(setDevice(d))}
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{d === 'phone' ? 'smartphone' : d === 'tablet' ? 'tablet_mac' : 'desktop_windows'}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400" id="vision-label">Vision:</span>
            <select
              value={colorBlindness}
              onChange={(e) => dispatch(setColorBlindness(e.target.value as any))}
              className="bg-gray-800 text-white border border-gray-700 rounded px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-blue-400 min-h-11"
              aria-labelledby="vision-label"
            >
              <option value="None">None</option>
              <option value="Protanopia">Protanopia</option>
              <option value="Deuteranopia">Deuteranopia</option>
              <option value="Tritanopia">Tritanopia</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-sm" role="group" aria-label="Before / After compare">
            <span className="text-gray-400">Compare:</span>
            <div className="flex rounded overflow-hidden border border-gray-700">
              <button
                type="button"
                aria-pressed={!compareMode}
                onClick={() => dispatch(setCompareMode(false))}
                className={`px-3 transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400 min-h-11 ${!compareMode ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'}`}
              >
                After
              </button>
              <button
                type="button"
                aria-pressed={compareMode}
                onClick={() => dispatch(setCompareMode(true))}
                className={`px-3 transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400 min-h-11 ${compareMode ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'}`}
              >
                Before
              </button>
            </div>
          </div>

          <span
            className="ml-auto hidden md:inline text-[11px] text-gray-500 bg-gray-800/70 border border-gray-700 rounded px-2 py-1"
            title="The studio remembers your last device and template for this session"
          >
            Session memory — {device.charAt(0).toUpperCase() + device.slice(1)} · {TEMPLATE_LABELS[sample] ?? sample}
          </span>
        </div>

        <div className="flex-1 overflow-auto flex justify-center py-4 relative">
          <div
            className={`relative transition-all duration-300 ease-in-out bg-white shadow-2xl overflow-hidden ${
              device === 'phone' ? 'w-[375px] h-[667px] border-[12px] border-gray-800 rounded-3xl' :
              device === 'tablet' ? 'w-[768px] h-[1024px] border-[16px] border-gray-800 rounded-3xl' :
              'w-full h-full max-w-6xl rounded shadow-none'
            }`}
            style={{
              filter: colorBlindness !== 'None' ? `url(#cb-${colorBlindness.toLowerCase()})` : 'none',
              transition: 'filter 0.3s ease, width 0.3s ease, height 0.3s ease'
            }}
          >
            <span
              className="absolute top-2 right-2 z-20 rounded bg-black/70 px-2 py-1 text-[11px] font-medium text-white pointer-events-none"
              role="status"
              aria-live="polite"
            >
              {compareMode ? 'Before — last saved snapshot' : 'After — live ThemeOptions'}
            </span>
            {previewFlash > 0 && (
              <div
                key={previewFlash}
                aria-hidden="true"
                className="animate-preview-flash pointer-events-none absolute inset-0 z-10"
                style={{ backgroundColor: 'var(--preview-primary)' }}
              />
            )}
            <div key={compareMode ? 'before' : 'after'} className="h-full animate-fade-in">
              <SampleSite />
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[400px] flex-shrink-0 flex flex-col h-[50vh] lg:h-full border-t lg:border-t-0 border-gray-700 relative">
        <EditorSidebar />
      </div>
    </div>
  );
}
