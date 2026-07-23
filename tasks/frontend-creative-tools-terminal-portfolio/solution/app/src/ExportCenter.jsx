import { useState, useRef, useEffect } from 'preact/hooks';
import * as v from 'valibot';
import {
  projects, buildPortfolioDocument, applyImportedDocument, configTab,
  ProjectSchema, IdentitySchema, SkillSchema, THEMES,
} from './store.js';

const ProfileImportSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(40)),
  theme: v.picklist(THEMES),
  featuredSlugs: v.pipe(v.array(v.string()), v.maxLength(3)),
});

const PortfolioImportSchema = v.object({
  schemaVersion: v.literal('1.0'),
  identity: IdentitySchema,
  theme: v.picklist(THEMES),
  consent: v.picklist(['not_set', 'accepted', 'declined']),
  projects: v.array(ProjectSchema),
  skills: v.array(SkillSchema),
  featuredSlugs: v.pipe(v.array(v.string()), v.maxLength(3)),
  profiles: v.array(ProfileImportSchema),
});

const THEME_TOKENS = {
  dark: { background: '#0f1115', text: '#e2e8f0', accent: '#38bdf8', chrome: '#334155' },
  light: { background: '#f8fafc', text: '#0f172a', accent: '#0284c7', chrome: '#cbd5e1' },
  retro: { background: '#2a211c', text: '#ffb000', accent: '#ff6600', chrome: '#7a5c29' },
  glass: { background: '#000000', text: '#ffffff', accent: '#ffffff', chrome: 'rgba(255,255,255,0.2)' },
};

const TABS = [
  { id: 'json', label: 'Portfolio JSON', file: 'portfolio.json', mime: 'application/json' },
  { id: 'config', label: 'Terminal Config', file: 'terminal.config', mime: 'text/plain' },
  { id: 'css', label: 'Theme CSS', file: 'theme.css', mime: 'text/css' },
];

function buildPreviews() {
  const doc = buildPortfolioDocument();
  const json = JSON.stringify(doc, null, 2);
  const tokens = THEME_TOKENS[doc.theme] || THEME_TOKENS.dark;
  const css = `:root[data-theme="${doc.theme}"] {\n  --background: ${tokens.background};\n  --text: ${tokens.text};\n  --accent: ${tokens.accent};\n  --chrome: ${tokens.chrome};\n}\n`;
  const featured = doc.featuredSlugs.join(',');
  const config = [
    '# terminal-portfolio config',
    `theme = ${doc.theme}`,
    `display_name = ${doc.identity.displayName}`,
    `email = ${doc.identity.email}`,
    `location = ${doc.identity.location}`,
    `featured = ${featured}`,
  ].join('\n');
  return { json, config, css };
}

async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return true; }
  } catch { /* fall through */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { return document.execCommand('copy'); }
    finally { ta.remove(); }
  } catch { return false; }
}

function downloadText(filename, text, mime) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ExportCenter() {
  const [tab, setTab] = useState('json');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [importOk, setImportOk] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  // /import opens export center on the import panel.
  useEffect(() => { if (configTab.value === 'import') setTab('json'); }, [configTab.value]);

  // Read projects so previews recompile live after any mutation.
  const _live = projects.value; void _live;
  const previews = buildPreviews();
  const active = TABS.find((t) => t.id === tab);
  const activeText = previews[tab];

  const onCopy = async () => {
    const ok = await copyText(activeText);
    setCopied(ok);
    setCopyError(ok ? '' : 'Copy was blocked. Select the preview text and copy it manually.');
    if (ok) setTimeout(() => setCopied(false), 1500);
  };

  const runImport = (text) => {
    setImportOk('');
    let parsed;
    try { parsed = JSON.parse(text); }
    catch (err) { setImportError(`Invalid JSON: ${err.message}. No projects were changed.`); return; }
    const result = v.safeParse(PortfolioImportSchema, parsed);
    if (!result.success) {
      const issue = result.issues[0];
      const path = issue.path?.map((s) => s.key).filter((k) => k !== undefined).join('.') || 'document';
      setImportError(`Invalid Portfolio JSON at "${path}": ${issue.message}. Required keys are schemaVersion (1.0), identity, theme, consent, projects, skills, featuredSlugs, profiles. No projects were changed.`);
      return;
    }
    const doc = result.output;
    const projectSlugs = doc.projects.map((project) => project.slug);
    if (projectSlugs.length !== new Set(projectSlugs).size) {
      setImportError('Invalid Portfolio JSON: projects contains duplicate slug values. No projects were changed.');
      return;
    }
    const skillNames = doc.skills.map((skill) => skill.name.toLowerCase());
    if (skillNames.length !== new Set(skillNames).size) {
      setImportError('Invalid Portfolio JSON: skills contains duplicate names. Skill names must be unique regardless of letter case. No projects were changed.');
      return;
    }
    const missing = doc.featuredSlugs.find((s) => !doc.projects.some((p) => p.slug === s));
    if (missing) { setImportError(`Invalid Portfolio JSON: featuredSlugs references unknown slug "${missing}". No projects were changed.`); return; }
    const dup = doc.featuredSlugs.length !== new Set(doc.featuredSlugs).size;
    if (dup) { setImportError('Invalid Portfolio JSON: featuredSlugs contains duplicates. No projects were changed.'); return; }
    const featSet = new Set(doc.projects.filter((p) => p.featured).map((p) => p.slug));
    const mismatch = doc.featuredSlugs.length !== featSet.size || doc.featuredSlugs.some((s) => !featSet.has(s));
    if (mismatch) { setImportError('Invalid Portfolio JSON: featuredSlugs must equal the set of projects with featured true. No projects were changed.'); return; }
    const profileNames = doc.profiles.map((profile) => profile.name.toLowerCase());
    if (profileNames.length !== new Set(profileNames).size) {
      setImportError('Invalid Portfolio JSON: profiles contains duplicate names. Profile names must be unique regardless of letter case. No projects were changed.');
      return;
    }
    for (const profile of doc.profiles) {
      if (profile.featuredSlugs.length !== new Set(profile.featuredSlugs).size) {
        setImportError(`Invalid Portfolio JSON: profile "${profile.name}" contains duplicate featuredSlugs. No projects were changed.`);
        return;
      }
      const unknown = profile.featuredSlugs.find((slug) => !projectSlugs.includes(slug));
      if (unknown) {
        setImportError(`Invalid Portfolio JSON: profile "${profile.name}" references unknown project slug "${unknown}". No projects were changed.`);
        return;
      }
    }
    applyImportedDocument(doc);
    setImportError('');
    setImportOk(`Imported ${doc.projects.length} project(s), ${doc.skills.length} skill(s), theme "${doc.theme}". Board, /work, and all three tabs now match the imported state.`);
  };

  const onFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { const t = String(reader.result || ''); setImportText(t); runImport(t); };
    reader.onerror = () => setImportError('Could not read that file. Paste the JSON instead.');
    reader.readAsText(file);
  };

  return (
    <div className="export-center surface-fade">
      <h2 className="surface-h">Export Center</h2>

      <div className="tab-row" role="tablist" aria-label="Export format">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} type="button" className={`tab ${tab === t.id ? 'is-active' : ''}`} onClick={() => { setTab(t.id); setCopied(false); setCopyError(''); }}>{t.label}</button>
        ))}
      </div>

      <div className="preview-block" key={tab}>
        <div className="preview-actions">
          <button type="button" className="btn btn-sm btn-ghost" onClick={onCopy} aria-label={`Copy ${active.label}`}>
            <span className={`icon-[${copied ? 'tabler--check' : 'tabler--copy'}] size-4`} />
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => downloadText(active.file, activeText, active.mime)} aria-label={`Download ${active.label}`}>
            <span className="icon-[tabler--download] size-4" /> Download
          </button>
        </div>
        {copyError && <p className="field-error" role="alert">{copyError}</p>}
        {copied && <p className="field-success" role="status">{`Copied ${active.label} to clipboard.`}</p>}
        <pre className="preview-pre" tabIndex={0}>{activeText}</pre>
      </div>

      <div
        className={`import-block ${dragOver ? 'is-drag' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer?.files?.[0]; if (f) onFile(f); }}
      >
        <h3 className="panel-h">Import Portfolio JSON</h3>
        <p className="field-hint">Paste a Portfolio JSON document, or drop a .json file here. A conforming document replaces the live collection; anything else is rejected without changing your projects.</p>
        <label className="field-label" htmlFor="import-textarea">Portfolio JSON document</label>
        <textarea id="import-textarea" className="textarea import-textarea" value={importText} onInput={(e) => { setImportText(e.target.value); setImportError(''); setImportOk(''); }} placeholder='{"schemaVersion":"1.0", ...}' spellCheck="false" />
        <div aria-live="polite" className="form-live">
          {importError && <p className="field-error" role="alert">{importError}</p>}
          {importOk && <p className="field-success">{importOk}</p>}
        </div>
        <div className="import-actions">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => runImport(importText)}>Import JSON</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}><span className="icon-[tabler--file-upload] size-4" /> Load file</button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} aria-label="Load a Portfolio JSON file" />
        </div>
      </div>
    </div>
  );
}
