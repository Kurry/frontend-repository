import { toast } from '../state.js';
import { Icon } from './Icon.jsx';

const KIND = {
  info: { cls: 'bg-[#0f3d3e] text-[#e6f7f1]', icon: 'lucide:info' },
  success: { cls: 'bg-[#047857] text-white', icon: 'lucide:circle-check-big' },
  error: { cls: 'bg-[#c2410c] text-white', icon: 'lucide:circle-alert' },
  demo: { cls: 'bg-[#175250] text-[#e6f7f1]', icon: 'lucide:mouse-pointer-click' },
};

export function Toasts() {
  const t = toast.value;
  if (!t) return null;
  const k = KIND[t.kind] || KIND.info;
  return (
    <div class="pointer-events-none fixed inset-x-0 bottom-5 z-[120] flex justify-center px-4">
      <div
        role="status"
        aria-live="polite"
        class={`pointer-events-auto flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium shadow-lg shadow-black/15 ring-1 ring-black/5 ${k.cls} ${
          t.phase === 'out' ? 'anim-toast-out' : 'anim-toast-in'
        }`}
      >
        <Icon name={k.icon} decorative size={18} />
        <span>{t.text}</span>
      </div>
    </div>
  );
}
