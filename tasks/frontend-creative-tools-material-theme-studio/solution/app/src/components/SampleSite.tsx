import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { setSample } from '../store/themeSlice';

export default function SampleSite() {
  const dispatch = useDispatch();
  const sample = useSelector((state: RootState) => state.theme.sample);

  return (
    <div className="flex flex-col h-full bg-[var(--preview-bg)] text-[var(--preview-text)] overflow-hidden rounded-t-[var(--preview-radius)]" style={{ fontFamily: 'var(--preview-font)', fontSize: 'var(--preview-font-size)' }}>
      <header className="flex items-center gap-2 p-2 bg-[var(--preview-primary)] text-[var(--preview-primary-contrast)] shadow-md z-10">
        <button type="button" className="p-2 rounded-full hover:bg-black/10 transition-colors" aria-label="open drawer">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="flex-1 bg-white/20 rounded-[var(--preview-radius)] flex items-center px-2 py-1 gap-2">
          <span className="material-symbols-outlined text-sm">search</span>
          <input type="search" placeholder="Search…" aria-label="search" className="bg-transparent border-none outline-none text-inherit placeholder-white/70 text-sm w-full" />
        </div>
        <button type="button" className="p-2 rounded-full hover:bg-black/10 transition-colors" aria-label="show more">
          <span className="material-symbols-outlined">more_vert</span>
        </button>
      </header>

      <div className="flex overflow-x-auto bg-[var(--preview-primary)] text-white/70" role="tablist">
        {(['Instructions', 'Sign Up', 'Dashboard', 'Blog', 'Pricing', 'Checkout'] as const).map(s => {
          const sLower = s.toLowerCase().replace(' ', '');
          return (
            <button
              key={sLower}
              type="button"
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap min-w-[90px] text-center relative hover:bg-white/10 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:z-10 ${
                sample === sLower ? 'text-white' : ''
              }`}
              onClick={() => dispatch(setSample(sLower))}
            >
              {s}
              {sample === sLower && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--preview-secondary)]"></span>}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-[var(--preview-spacing)]">
        <div className="bg-[var(--preview-paper)] shadow-md p-4 rounded-[var(--preview-radius)] text-[var(--preview-text)]">
          <h2 className="text-xl mb-4 font-normal">Content for {sample}</h2>
          <p className="text-[var(--preview-text-secondary)] mb-4">Sample template demonstrating the current theme options.</p>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-[var(--preview-secondary)] text-[var(--preview-secondary-contrast)] rounded-[var(--preview-radius)] font-medium shadow-sm hover:brightness-110 transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500" style={{ textTransform: 'var(--preview-button-transform)' as any }}>Action</button>
            <button className="px-4 py-2 bg-transparent text-[var(--preview-primary)] border border-[var(--preview-primary)] rounded-[var(--preview-radius)] font-medium hover:bg-[var(--preview-primary)]/10 transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500" style={{ textTransform: 'var(--preview-button-transform)' as any }}>Secondary</button>
          </div>
        </div>
      </div>
    </div>
  );
}
