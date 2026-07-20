import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { setSample } from '../store/themeSlice';

export default function SampleSite() {
  const dispatch = useDispatch();
  const sample = useSelector((state: RootState) => state.theme.sample);

  const renderSample = () => {
    const card = 'bg-[var(--preview-paper)] shadow-md p-4 rounded-[var(--preview-radius)] text-[var(--preview-text)]';
    const primaryButton = 'px-4 py-2 bg-[var(--preview-primary)] text-[var(--preview-primary-contrast)] rounded-[var(--preview-radius)] font-medium shadow-sm';
    const field = 'w-full border border-[var(--preview-divider)] bg-transparent px-3 py-2 rounded-[var(--preview-radius)]';

    switch (sample) {
      case 'signup':
        return <div className={`${card} max-w-sm mx-auto`}><h2 className="text-2xl mb-1">Create account</h2><p className="text-[var(--preview-text-secondary)] mb-5">Start building with your team.</p><div className="space-y-3"><input className={field} aria-label="Email address" placeholder="Email address" /><input className={field} aria-label="Password" placeholder="Password" type="password" /><button className={`${primaryButton} w-full`}>Sign up</button></div></div>;
      case 'dashboard':
        return <div className="space-y-4"><div className="grid grid-cols-3 gap-3">{[['Revenue', '$24.8k'], ['Orders', '1,284'], ['Growth', '+18%']].map(([label, value]) => <div key={label} className={card}><p className="text-sm text-[var(--preview-text-secondary)]">{label}</p><strong className="text-xl">{value}</strong></div>)}</div><div className={card}><h2 className="text-lg mb-3">Weekly activity</h2><div className="flex h-28 items-end gap-2">{[40, 72, 55, 88, 64, 96, 78].map((height, index) => <span key={index} className="flex-1 bg-[var(--preview-primary)] rounded-t" style={{ height: `${height}%` }} />)}</div></div></div>;
      case 'blog':
        return <div className="grid gap-4 md:grid-cols-[2fr_1fr]"><article className={card}><div className="h-28 mb-4 rounded-[var(--preview-radius)] bg-[var(--preview-primary-light)]" /><p className="text-sm text-[var(--preview-primary)]">DESIGN SYSTEMS</p><h2 className="text-2xl my-2">A practical guide to expressive themes</h2><p className="text-[var(--preview-text-secondary)]">Build a visual language that remains consistent across every surface.</p></article><aside className={`${card} space-y-3`}><h3 className="font-semibold">Popular posts</h3>{['Color with intent', 'Type that scales', 'Shape and rhythm'].map(title => <p key={title} className="border-t border-[var(--preview-divider)] pt-3">{title}</p>)}</aside></div>;
      case 'pricing':
        return <div><h2 className="text-2xl text-center mb-5">Plans for every team</h2><div className="grid grid-cols-3 gap-3">{[['Starter', '$0'], ['Pro', '$19'], ['Scale', '$49']].map(([name, price], index) => <div key={name} className={`${card} ${index === 1 ? 'ring-2 ring-[var(--preview-primary)]' : ''}`}><h3 className="font-semibold">{name}</h3><p className="text-2xl my-3">{price}<span className="text-sm text-[var(--preview-text-secondary)]"> / month</span></p><ul className="text-sm space-y-2 mb-4"><li>✓ Theme editor</li><li>✓ Live preview</li><li>✓ Export tools</li></ul><button className={`${primaryButton} w-full`}>Choose {name}</button></div>)}</div></div>;
      case 'checkout':
        return <div className="grid gap-4 md:grid-cols-[3fr_2fr]"><div className={card}><h2 className="text-xl mb-4">Payment details</h2><div className="space-y-3"><input className={field} aria-label="Name on card" placeholder="Name on card" /><input className={field} aria-label="Card number" placeholder="Card number" /><div className="grid grid-cols-2 gap-3"><input className={field} aria-label="Expiration" placeholder="MM / YY" /><input className={field} aria-label="Security code" placeholder="CVC" /></div></div></div><aside className={card}><h3 className="font-semibold mb-3">Order summary</h3><div className="flex justify-between border-b border-[var(--preview-divider)] pb-3"><span>Theme Studio Pro</span><span>$19</span></div><div className="flex justify-between font-semibold py-3"><span>Total</span><span>$19</span></div><button className={`${primaryButton} w-full`}>Place order</button></aside></div>;
      default:
        return <div className={card}><h2 className="text-2xl mb-2">Build your first Material theme</h2><p className="text-[var(--preview-text-secondary)] mb-5">Follow these steps to create, preview, and share a reusable ThemeOptions package.</p><ol className="grid gap-3 md:grid-cols-3">{[['1', 'Choose colors'], ['2', 'Tune typography'], ['3', 'Export theme']].map(([number, label]) => <li key={number} className="border border-[var(--preview-divider)] p-3 rounded-[var(--preview-radius)]"><span className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-[var(--preview-primary)] text-[var(--preview-primary-contrast)] mr-2">{number}</span>{label}</li>)}</ol></div>;
    }
  };

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
        {renderSample()}
      </div>
    </div>
  );
}
