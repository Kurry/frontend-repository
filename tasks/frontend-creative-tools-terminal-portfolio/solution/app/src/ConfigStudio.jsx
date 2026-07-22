import { useState, useRef, useEffect } from 'preact/hooks';
import {
  identity, skills, projects, profiles, theme, configTab,
  saveIdentity, saveSkills, saveProfile, applyProfile, toggleFeatured,
  mutate, validateProfile, FEATURED_CAP, THEMES,
} from './store.js';
import { ConfigDiff } from './forms.jsx';

const TABS = [
  { id: 'identity', label: 'Identity' },
  { id: 'skills', label: 'Skills' },
  { id: 'featured', label: 'Featured' },
  { id: 'profiles', label: 'Profiles' },
  { id: 'diff', label: 'Config Diff' },
];

export default function ConfigStudio() {
  // Reactive read so /config / /profiles commands (which set configTab) update
  // the active tab and scroll the matching section into view.
  const active = configTab.value;
  const refs = { identity: useRef(null), skills: useRef(null), featured: useRef(null), profiles: useRef(null), diff: useRef(null) };

  useEffect(() => {
    const el = refs[active]?.current;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [active]);

  return (
    <div className="config-studio surface-fade">
      <h2 className="surface-h">Config Studio</h2>
      <div className="tab-row" role="tablist" aria-label="Config Studio sections">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={active === t.id} type="button" className={`tab ${active === t.id ? 'is-active' : ''}`} onClick={() => { configTab.value = t.id; }}>{t.label}</button>
        ))}
      </div>

      <section ref={refs.identity} className="config-section">
        <h3 className="panel-h">Identity</h3>
        <IdentityForm />
      </section>

      <section ref={refs.skills} className="config-section">
        <h3 className="panel-h">Skills</h3>
        <SkillsEditor />
      </section>

      <section ref={refs.featured} className="config-section">
        <h3 className="panel-h">Featured Pins</h3>
        <FeaturedEditor />
      </section>

      <section ref={refs.profiles} className="config-section">
        <h3 className="panel-h">Shell Profiles</h3>
        <ProfilesEditor />
      </section>

      <section ref={refs.diff} className="config-section">
        <h3 className="panel-h">Config Diff</h3>
        <ConfigDiff />
      </section>
    </div>
  );
}

function LiveRegion({ children }) {
  return <div aria-live="polite" className="form-live">{children}</div>;
}

function IdentityForm() {
  const [data, setData] = useState(() => ({ ...identity.value }));
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState('');

  // Keep the form in sync if identity changes elsewhere (import / profile).
  useEffect(() => { setData({ ...identity.value }); }, [identity.value]);

  const set = (k, v) => { setData((d) => ({ ...d, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); setMsg(''); };

  const submit = (e) => {
    e.preventDefault();
    const res = saveIdentity(data);
    if (res.ok) { setErrors({}); setMsg(`Identity saved. /about and /email now read "${res.value.displayName}".`); }
    else { setErrors(res.errors || {}); setMsg(''); }
  };

  const fields = [
    { k: 'displayName', label: 'Display name', type: 'text' },
    { k: 'email', label: 'Email', type: 'email' },
    { k: 'location', label: 'Location', type: 'text' },
    { k: 'tagline', label: 'Tagline (optional)', type: 'text' },
  ];

  return (
    <form className="panel-form" onSubmit={submit} noValidate>
      <LiveRegion>{msg}</LiveRegion>
      {fields.map((f) => (
        <div className="form-control" key={f.k}>
          <label className="field-label" htmlFor={`id-${f.k}`}>{f.label}</label>
          <input id={`id-${f.k}`} type={f.type} className={`input ${errors[f.k] ? 'input-error' : ''}`} value={data[f.k] || ''} onInput={(e) => set(f.k, e.target.value)} aria-invalid={!!errors[f.k]} aria-describedby={errors[f.k] ? `id-${f.k}-error` : undefined} />
          {errors[f.k] && <p className="field-error" id={`id-${f.k}-error`} role="alert">{errors[f.k]}</p>}
        </div>
      ))}
      <button type="submit" className="btn btn-primary self-start">Save Identity</button>
    </form>
  );
}

function SkillsEditor() {
  const [rows, setRows] = useState(() => skills.value.map((s) => ({ ...s })));
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState('');
  useEffect(() => { setRows(skills.value.map((s) => ({ ...s }))); }, [skills.value]);

  const update = (i, k, v) => { setRows((r) => r.map((row, idx) => idx === i ? { ...row, [k]: k === 'proficiency' ? (parseInt(v, 10) || 0) : v } : row)); setErrors((e) => ({ ...e, [i]: undefined })); setMsg(''); };
  const add = () => setRows((r) => [...r, { name: '', proficiency: 0 }]);
  const remove = (i) => { setRows((r) => r.filter((_, idx) => idx !== i)); setErrors((e) => { const n = { ...e }; delete n[i]; return n; }); };

  const submit = (e) => {
    e.preventDefault();
    const res = saveSkills(rows);
    if (res.ok) { setErrors({}); setMsg(`Skills saved. /skills and Portfolio JSON now list ${skills.value.length} skill(s).`); }
    else { setErrors(res.errors || {}); setMsg(''); }
  };

  return (
    <form className="panel-form" onSubmit={submit} noValidate>
      <LiveRegion>{msg}</LiveRegion>
      {rows.length === 0 && <p className="empty-hint">No skills yet. Add one below; proficiency is a whole number from 0 to 100.</p>}
      {rows.map((row, i) => (
        <div className="skill-edit-row" key={i}>
          <div className="form-control flex-1">
            <label className="field-label" htmlFor={`sk-name-${i}`}>Skill name</label>
            <input id={`sk-name-${i}`} className={`input ${errors[i] ? 'input-error' : ''}`} value={row.name} onInput={(e) => update(i, 'name', e.target.value)} aria-invalid={!!errors[i]} />
          </div>
          <div className="form-control w-prof">
            <label className="field-label" htmlFor={`sk-prof-${i}`}>Proficiency</label>
            <input id={`sk-prof-${i}`} type="number" min="0" max="100" className={`input ${errors[i] ? 'input-error' : ''}`} value={row.proficiency} onInput={(e) => update(i, 'proficiency', e.target.value)} aria-invalid={!!errors[i]} />
          </div>
          <button type="button" className="icon-btn danger self-end" onClick={() => remove(i)} aria-label={`Remove skill ${row.name || i + 1}`}><span className="icon-[tabler--trash] size-4" /></button>
          {errors[i] && <p className="field-error full" role="alert">{errors[i]}</p>}
        </div>
      ))}
      <div className="form-actions">
        <button type="button" className="btn btn-ghost self-start" onClick={add}><span className="icon-[tabler--plus] size-4" /> Add Skill</button>
        <button type="submit" className="btn btn-primary self-start">Save Skills</button>
      </div>
    </form>
  );
}

function FeaturedEditor() {
  const list = projects.value;
  const count = list.filter((p) => p.featured).length;
  const [msg, setMsg] = useState('');
  const toggle = (slug) => {
    const res = toggleFeatured(slug);
    setMsg(res.ok ? `${slug} is now ${res.featured ? 'featured' : 'unfeatured'}.` : (res.message || ''));
  };
  return (
    <div className="panel-form">
      <LiveRegion>{msg}</LiveRegion>
      <p className="field-hint">{count} of {FEATURED_CAP} featured pins used. A project appears in Portfolio JSON featuredSlugs when pinned.</p>
      <ul className="featured-list">
        {list.map((p) => (
          <li key={p.slug} className="featured-row">
            <button type="button" className={`pin-toggle ${p.featured ? 'is-on' : ''}`} aria-pressed={p.featured} onClick={() => toggle(p.slug)}>
              <span className={`icon-[${p.featured ? 'tabler--star-filled' : 'tabler--star'}] size-4`} />
              <span>{p.featured ? 'Pinned' : 'Pin'}</span>
            </button>
            <span className="featured-name">{p.name}</span>
            <span className="featured-slug">/{p.slug}</span>
          </li>
        ))}
        {list.length === 0 && <li className="empty-hint">No projects to pin. Create one on the Projects Board first.</li>}
      </ul>
    </div>
  );
}

function ProfilesEditor() {
  const [name, setName] = useState('');
  const [pTheme, setPTheme] = useState(theme.value);
  const [pSlugs, setPSlugs] = useState([]);
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const featuredNow = projects.value.filter((p) => p.featured).map((p) => p.slug);

  const save = (e) => {
    e.preventDefault();
    const res = saveProfile({ name: name.trim(), theme: pTheme, featuredSlugs: [...pSlugs] });
    if (res.ok) { setMsg(`Profile "${res.value.name}" saved with theme ${res.value.theme} and ${res.value.featuredSlugs.length} pinned project(s).`); setName(''); setPSlugs([]); setErrors({}); }
    else { setErrors(res.errors || {}); setMsg(''); }
  };

  const toggleSlug = (slug) => setPSlugs((s) => s.includes(slug) ? s.filter((x) => x !== slug) : (s.length >= 3 ? s : [...s, slug]));

  const doDelete = (pname) => {
    mutate(() => { profiles.value = profiles.value.filter((p) => p.name !== pname); });
    setConfirmDelete(null);
    setMsg(`Profile "${pname}" deleted.`);
  };

  return (
    <div className="panel-form">
      <LiveRegion>{msg}</LiveRegion>
      <form onSubmit={save} noValidate className="profile-form">
        <div className="form-control">
          <label className="field-label" htmlFor="prof-name">Profile name</label>
          <input id="prof-name" className={`input ${errors.name ? 'input-error' : ''}`} value={name} onInput={(e) => { setName(e.target.value); setErrors((er) => ({ ...er, name: undefined })); }} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'prof-name-error' : undefined} />
          {errors.name && <p className="field-error" id="prof-name-error" role="alert">{errors.name}</p>}
        </div>
        <div className="form-control">
          <label className="field-label" htmlFor="prof-theme">Theme</label>
          <select id="prof-theme" className="select" value={pTheme} onChange={(e) => setPTheme(e.target.value)}>
            {THEMES.map((t) => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>
        <fieldset className="form-control">
          <legend className="field-label">Featured slugs to pin (0 to 3, from currently featured)</legend>
          {errors.featuredSlugs && <p className="field-error" role="alert">{errors.featuredSlugs}</p>}
          <div className="chip-wrap">
            {featuredNow.length === 0 && <p className="empty-hint">Pin projects on the Featured tab first, then save them into a profile.</p>}
            {featuredNow.map((slug) => (
              <label key={slug} className="chip-check">
                <input type="checkbox" checked={pSlugs.includes(slug)} onChange={() => toggleSlug(slug)} />
                <span>/{slug}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <button type="submit" className="btn btn-primary self-start">Save Profile</button>
      </form>

      <div className="profile-list">
        <h4 className="panel-sub">Saved profiles</h4>
        {profiles.value.length === 0 && <p className="empty-hint">No saved profiles yet. Save one above to snapshot a theme and featured set.</p>}
        {profiles.value.map((p) => (
          <div key={p.name} className="profile-row">
            <div className="profile-meta">
              <span className="profile-name">{p.name}</span>
              <span className="profile-detail">theme {p.theme} &bull; pins {p.featuredSlugs.length ? p.featuredSlugs.map((s) => `/${s}`).join(' ') : '(none)'}</span>
            </div>
            <div className="profile-actions">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { const r = applyProfile(p.name); setMsg(r.ok ? `Applied profile "${p.name}": theme ${p.theme} restored.` : (r.message || '')); }}>Apply</button>
              {confirmDelete === p.name
                ? <span className="confirm-inline"><span className="confirm-q">Delete?</span><button type="button" className="btn btn-sm btn-danger" onClick={() => doDelete(p.name)}>Confirm</button><button type="button" className="btn btn-sm btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button></span>
                : <button type="button" className="icon-btn danger" onClick={() => setConfirmDelete(p.name)} aria-label={`Delete profile ${p.name}`}><span className="icon-[tabler--trash] size-4" /></button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
