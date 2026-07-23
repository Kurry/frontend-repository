import { useState, useMemo } from 'preact/hooks';
import { projects, baseline, validateProject } from './store.js';
import { STATUSES } from './schemas.js';

function Field({ id, label, error, children, hint }) {
  return (
    <div className="form-control">
      <label className="field-label" htmlFor={id}>{label}</label>
      {children}
      {hint && !error && <p className="field-hint" id={`${id}-hint`}>{hint}</p>}
      {error && <p className="field-error" id={`${id}-error`} role="alert">{error}</p>}
    </div>
  );
}

const EMPTY = { name: '', slug: '', summary: '', status: 'shipped', tags: [], year: new Date().getFullYear(), featured: false, type: '' };

export function ProjectForm({ project, onSubmit, onCancel, submitLabel }) {
  const [data, setData] = useState(() => project
    ? { name: project.name, slug: project.slug, summary: project.summary, status: project.status, tags: [...project.tags], year: project.year, featured: project.featured, type: project.type || '' }
    : { ...EMPTY, tags: [] });
  const [touched, setTouched] = useState({});
  const [submitError, setSubmitError] = useState('');

  const set = (key, value) => { setData((d) => ({ ...d, [key]: value })); setTouched((t) => ({ ...t, [key]: true })); setSubmitError(''); };

  const validation = useMemo(() => validateProject(data), [data]);
  const slugTaken = projects.value.some((p) => p.slug === data.slug && p.slug !== project?.slug);
  const featuredOver = data.featured && projects.value.filter((p) => p.featured && p.slug !== project?.slug).length >= 3;

  const fieldError = (key) => {
    if (key === 'slug' && slugTaken) return 'A project with this slug already exists. Choose a unique lowercase slug.';
    if (key === 'featured' && featuredOver) return 'At most 3 projects may be featured at once.';
    if (!touched[key]) return undefined;
    return validation.errors?.[key];
  };

  const isValid = validation.ok && !slugTaken && !featuredOver;

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({ name: true, slug: true, summary: true, status: true, tags: true, year: true, featured: true });
    if (!isValid) {
      setSubmitError('Please fix the highlighted fields before saving. Each field lists the contract rule it must follow.');
      return;
    }
    const res = onSubmit({ ...data, tags: data.tags });
    if (res && res.ok === false) {
      setSubmitError(Object.values(res.errors || {}).join(' ') || 'Could not save the project.');
    }
  };

  const tagText = data.tags.join(', ');

  return (
    <form onSubmit={handleSubmit} className="panel-form" noValidate>
      <h3 className="panel-h">{project ? 'Edit Project' : 'New Project'}</h3>
      <div aria-live="polite" className="form-live">{submitError}</div>

      <Field id="pf-name" label="Name" error={fieldError('name')} hint="1 to 80 characters.">
        <input id="pf-name" className={`input ${fieldError('name') ? 'input-error' : ''}`} value={data.name} onInput={(e) => set('name', e.target.value)} aria-describedby={fieldError('name') ? 'pf-name-error' : 'pf-name-hint'} aria-invalid={!!fieldError('name')} />
      </Field>

      <Field id="pf-slug" label="Slug" error={fieldError('slug')} hint="Lowercase letters, digits, and single hyphens only.">
        <input id="pf-slug" className={`input ${fieldError('slug') ? 'input-error' : ''}`} value={data.slug} onInput={(e) => set('slug', e.target.value)} aria-describedby={fieldError('slug') ? 'pf-slug-error' : 'pf-slug-hint'} aria-invalid={!!fieldError('slug')} />
      </Field>

      <div className="form-row">
        <Field id="pf-year" label="Year" error={fieldError('year')} hint="2000 to 2100.">
          <input id="pf-year" type="number" className={`input ${fieldError('year') ? 'input-error' : ''}`} value={data.year} onInput={(e) => set('year', parseInt(e.target.value, 10) || 0)} aria-describedby={fieldError('year') ? 'pf-year-error' : 'pf-year-hint'} aria-invalid={!!fieldError('year')} />
        </Field>
        <Field id="pf-status" label="Status" error={fieldError('status')}>
          <select id="pf-status" className={`select ${fieldError('status') ? 'select-error' : ''}`} value={data.status} onChange={(e) => set('status', e.target.value)} aria-invalid={!!fieldError('status')}>
            {STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
          </select>
        </Field>
      </div>

      <Field id="pf-type" label="Category (optional)" hint="A short project category, shown on the card.">
        <input id="pf-type" className="input" value={data.type} onInput={(e) => set('type', e.target.value)} />
      </Field>

      <Field id="pf-tags" label="Tags (comma separated)" error={fieldError('tags')} hint="At most 5 tags, each 1 to 24 characters.">
        <input id="pf-tags" className={`input ${fieldError('tags') ? 'input-error' : ''}`} value={tagText} onInput={(e) => set('tags', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} aria-describedby={fieldError('tags') ? 'pf-tags-error' : 'pf-tags-hint'} aria-invalid={!!fieldError('tags')} />
      </Field>

      <Field id="pf-summary" label="Summary" error={fieldError('summary')} hint="1 to 280 characters.">
        <textarea id="pf-summary" className={`textarea ${fieldError('summary') ? 'textarea-error' : ''}`} value={data.summary} onInput={(e) => set('summary', e.target.value)} aria-describedby={fieldError('summary') ? 'pf-summary-error' : 'pf-summary-hint'} aria-invalid={!!fieldError('summary')} />
      </Field>

      <div className="form-control form-check-row">
        <input id="pf-featured" type="checkbox" className="tp-check" checked={data.featured} onChange={(e) => set('featured', e.target.checked)} aria-describedby={fieldError('featured') ? 'pf-featured-error' : undefined} aria-invalid={!!fieldError('featured')} />
        <label className="field-label-inline" htmlFor="pf-featured">Featured pin</label>
        {fieldError('featured') && <p className="field-error" id="pf-featured-error" role="alert">{fieldError('featured')}</p>}
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={!isValid}>{submitLabel || (project ? 'Save Changes' : 'Create Project')}</button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Config Diff — current session vs the seeded baseline, with marked changes
// across identity, theme, featured pins, projects, and skills.
// ---------------------------------------------------------------------------
function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

export function ConfigDiff() {
  const curProjects = projects.value; // read for reactivity
  void curProjects;
  const diffs = [];

  // Identity
  const idKeys = ['displayName', 'email', 'location', 'tagline'];
  for (const k of idKeys) {
    const before = baseline.identity[k] || '';
    const after = readIdentity()[k] || '';
    if (before !== after) diffs.push({ section: 'Identity', key: k, before, after });
  }

  // Theme
  if (baseline.theme !== readTheme()) diffs.push({ section: 'Theme', key: 'theme', before: baseline.theme, after: readTheme() });

  // Featured pins
  const beforeFeat = baseline.featured.join(', ') || '(none)';
  const afterFeat = readFeatured().join(', ') || '(none)';
  if (beforeFeat !== afterFeat) diffs.push({ section: 'Featured', key: 'featuredSlugs', before: beforeFeat, after: afterFeat });

  // Projects (by slug)
  const bMap = new Map(baseline.projects.map((p) => [p.slug, p]));
  const aMap = new Map(projects.value.map((p) => [p.slug, p]));
  for (const [slug, after] of aMap) {
    const before = bMap.get(slug);
    if (!before) diffs.push({ section: 'Projects', key: `+ ${after.name}`, before: '(not seeded)', after: 'added' });
    else if (!same(before, after)) diffs.push({ section: 'Projects', key: after.name, before: 'seed values', after: 'modified' });
  }
  for (const [slug, before] of bMap) {
    if (!aMap.has(slug)) diffs.push({ section: 'Projects', key: `- ${before.name}`, before: 'seeded', after: 'deleted' });
  }

  // Skills
  if (!same(baseline.skills, readSkills())) {
    const bNames = baseline.skills.map((s) => s.name);
    const aNames = readSkills().map((s) => s.name);
    const detail = !same(bNames, aNames) ? 'set changed' : 'proficiency changed';
    diffs.push({ section: 'Skills', key: 'skills', before: baseline.skills.map((s) => `${s.name}:${s.proficiency}`).join(', '), after: readSkills().map((s) => `${s.name}:${s.proficiency}`).join(', ') || '(none)', note: detail });
  }

  if (diffs.length === 0) {
    return (
      <div className="diff-empty" role="status">
        <span className="icon-[tabler--circle-check] size-4" />
        <p>No differences yet. Edits you make in Config Studio, the board, or via commands will appear here against the seeded baseline.</p>
      </div>
    );
  }

  const sections = {};
  for (const d of diffs) (sections[d.section] ||= []).push(d);

  return (
    <div className="config-diff">
      {Object.entries(sections).map(([section, rows]) => (
        <section key={section} className="diff-section">
          <h4 className="diff-h">{section} <span className="diff-count">{rows.length} changed</span></h4>
          <ul className="diff-list">
            {rows.map((d, i) => (
              <li key={i} className="diff-row">
                <span className="diff-key">{d.key}</span>
                <span className="diff-change">
                  <span className="diff-before">{d.before}</span>
                  <span className="icon-[tabler--arrow-right] size-3 diff-arrow" aria-hidden="true" />
                  <span className="diff-after">{d.after}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

// Indirection so ConfigDiff re-renders whenever the underlying signals change
// (the reads happen inside the component body above via these getters too).
import { identity, theme, skills, featuredSlugs } from './store.js';
function readIdentity() { return identity.value; }
function readTheme() { return theme.value; }
function readSkills() { return skills.value; }
function readFeatured() { return featuredSlugs(); }
