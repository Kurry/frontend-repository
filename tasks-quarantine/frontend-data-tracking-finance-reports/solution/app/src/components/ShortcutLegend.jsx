import { shortcutLegend } from '../state.js';
import { useFocusTrap } from '../hooks.jsx';
import { Icon } from './Icon.jsx';

const SHORTCUTS = [
  { keys: ['Ctrl', 'Z'], label: 'Undo the last ledger change', icon: 'lucide:undo-2' },
  { keys: ['Ctrl', 'Shift', 'Z'], label: 'Redo the last undone change', icon: 'lucide:redo-2' },
  { keys: ['Ctrl', 'E'], label: 'Open the Export drawer', icon: 'lucide:download' },
  { keys: ['?'], label: 'Open this keyboard shortcut legend', icon: 'lucide:keyboard' },
  { keys: ['Esc'], label: 'Close the active dialog or drawer', icon: 'lucide:x' },
];

function Key({ children }) {
  return (
    <kbd class="inline-flex min-w-[1.6rem] items-center justify-center rounded-md border border-[#d7eae3] bg-white px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[#175250] shadow-sm">
      {children}
    </kbd>
  );
}

export function ShortcutLegend() {
  const open = shortcutLegend.value;
  const trapRef = useFocusTrap(open, { onEscape: () => (shortcutLegend.value = false) });
  if (!open) return null;
  return (
    <div class="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close keyboard shortcuts"
        class="absolute inset-0 bg-[#082727]/35 anim-fade-in"
        onClick={() => (shortcutLegend.value = false)}
      />
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ld-shortcuts-title"
        tabindex="-1"
        class="anim-scale-in relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
      >
        <div class="flex items-center justify-between border-b border-[#eef4f1] px-5 py-3.5">
          <h2 id="ld-shortcuts-title" class="flex items-center gap-2 font-display text-lg font-semibold text-[#0f3d3e]">
            <Icon name="lucide:keyboard" decorative size={18} />
            Keyboard shortcuts
          </h2>
          <button
            type="button"
            class="grid h-8 w-8 place-items-center rounded-lg text-[#4a6460] transition hover:bg-[#e6f7f1] hover:text-[#0f3d3e]"
            onClick={() => (shortcutLegend.value = false)}
            aria-label="Close"
          >
            <Icon name="lucide:x" decorative size={18} />
          </button>
        </div>
        <ul class="divide-y divide-[#eef4f1] px-5 py-1">
          {SHORTCUTS.map((s) => (
            <li key={s.label} class="flex items-center justify-between gap-4 py-3">
              <span class="flex items-center gap-2 text-sm text-[#4a6460]">
                <Icon name={s.icon} decorative size={16} class="text-[#2c8a85]" />
                {s.label}
              </span>
              <span class="flex items-center gap-1">
                {s.keys.map((k, i) => (
                  <span key={k + i} class="flex items-center gap-1">
                    {i > 0 && <span class="text-xs text-[#7e958f]">+</span>}
                    <Key>{k}</Key>
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
        <p class="border-t border-[#eef4f1] px-5 py-3 text-xs text-[#7e958f]">
          On macOS, use the Command key in place of Ctrl.
        </p>
      </div>
    </div>
  );
}
